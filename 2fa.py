import os
import uuid
import secrets
import logging
import pyotp
import qrcode
import base64
from io import BytesIO
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from database import db, app
bcrypt = Bcrypt(app)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='2fa.log'
)
CORS(app, resources={r"/api/*": {
    "origins": ["http://localhost:5000", "http://127.0.0.1:5000"],
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"],
    "supports_credentials": True
}})
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.Text, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    reset_token_hash = db.Column(db.String(64), nullable=True)
    reset_token_expires_at = db.Column(db.DateTime, nullable=True)
    
    # 2FA Fields
    two_fa_secret = db.Column(db.String(32), nullable=True)
    backup_codes = db.Column(db.Text, nullable=True)
    # Security Tracking
    last_2fa_attempt = db.Column(db.DateTime, nullable=True)
    failed_attempts = db.Column(db.Integer, default=0)

    def increment_failed_attempts(self):
        self.failed_attempts += 1
        self.last_2fa_attempt = datetime.utcnow()
    
    def locked(self):
        if self.failed_attempts >= 3:
            cooldown = timedelta(minutes=15)
            return datetime.utcnow() - self.last_2fa_attempt < cooldown
        return False
    
    def reset_failed_attempts(self):
        self.failed_attempts = 0
        self.last_2fa_attempt = None
    @property
    def has_2fa_enabled(self):
        return self.two_fa_secret is not None
    @app.before_request
    def check_session():
    # Skip auth check for specific endpoints
        if request.endpoint and 'static' not in request.endpoint:
            excluded_routes = ['login', 'register']
            if request.endpoint not in excluded_routes and 'user_id' not in session:
                return jsonify({"error": "Unauthorized"}), 401
class TwoFactorAuth:
    @app.route('/api/2fa/check-status')
    def check_2fa_status():
        if 'user_id' not in session:
            return jsonify({"error": "Unauthorized"}), 401
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({
            "enabled": user.has_2fa_enabled,
            "setup_required": not user.has_2fa_enabled
        }), 200
    @staticmethod
    def generate_secret():
        return pyotp.random_base32()
    
    @staticmethod
    def generate_backup_codes(count=6):
        return [secrets.token_hex(4) for _ in range(count)]
    @staticmethod
    def verify_otp(secret, otp):
        totp = pyotp.TOTP(secret)
        return totp.verify(otp)
    @staticmethod
    def create_qr_code(secret, email):
        try:
            if not secret or not email:
                raise ValueError("Invalid secret or email")
            
            if not isinstance(secret, str) or not isinstance(email, str):
                raise ValueError("Secret and email must be strings")
                
            totp = pyotp.TOTP(secret)
            qr_data = totp.provisioning_uri(name=email, issuer_name="CypherNest")
            
            # Add error handling for QR code generation
            try:
                qr = qrcode.make(qr_data)
            except Exception as e:
                logging.error(f"QR code generation failed: {e}")
                return None
                
            buffer = BytesIO()
            qr.save(buffer, format="PNG")
            buffer.seek(0)
            
            try:
                encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
                return encoded
            except Exception as e:
                logging.error(f"Base64 encoding failed: {e}")
                return None
                
        except Exception as e:
            logging.error(f"QR Code Generation Error: {e}")
            return None

@app.route('/api/2fa/generate', methods=['POST', 'OPTIONS'])
def generate_2fa_secret():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        if 'user_id' not in session:
            logging.warning("Unauthorized 2FA generation attempt")
            return jsonify({"error": "Not authenticated"}), 401
        user = User.query.get(session['user_id'])
        if not user:
            logging.error(f"User not found: {session['user_id']}")
            return jsonify({"error": "User not found"}), 404
        
        secret = TwoFactorAuth.generate_secret()
        qr_code = TwoFactorAuth.create_qr_code(secret, user.email)
        user.two_fa_secret = secret
        backup_codes = TwoFactorAuth.generate_backup_codes()
        user.backup_codes = backup_codes
        if not qr_code:
            logging.error("QR code generation failed")
            return jsonify({"error": "Failed to generate QR code."}), 500

        db.session.commit()
        return jsonify({
            "secret": secret, 
            "qr_code": qr_code, 
            "backup_codes": backup_codes
        }), 200
    except Exception as e:
        logging.error(f"2FA generation error: {e}")
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/2fa/verify', methods=['POST'])
def verify_otp():
    try:
        email = request.json.get("email")
        otp = request.json.get("otp")
        
        user = User.query.filter_by(email=email).first()
        if not user or not user.two_fa_secret:
            return jsonify({"error": "2FA not set up"}), 400
        
        if user.locked():
            return jsonify({"error": "Account temporarily locked"}), 429
        
        if TwoFactorAuth.verify_otp(user.two_fa_secret, otp):
            user.reset_failed_attempts()
            user.two_fa_enabled = True
            db.session.commit()
            return jsonify({"message": "2FA verified successfully"}), 200
        else:
            user.increment_failed_attempts()
            db.session.commit()
            return jsonify({
                "error": "Invalid OTP", 
                "attempts_left": max(0, 3 - user.failed_attempts)
            }), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/2fa/validate-backup', methods=['POST'])
def validate_backup_code():
    try:
        email = request.json.get("email")
        code = request.json.get("code")
        
        user = User.query.filter_by(email=email).first()
        if not user or not user.backup_codes:
            return jsonify({"error": "No backup codes available"}), 400
        
        if code in user.backup_codes:
            user.backup_codes.remove(code)
            db.session.commit()
            return jsonify({"message": "Backup code accepted"}), 200
        else:
            return jsonify({"error": "Invalid backup code"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/2fa/setup', methods=['POST', 'OPTIONS'])
def setup_2fa():
    if request.method == 'OPTIONS':
        return '', 204
        
    if 'user_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401

    try:
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        secret = TwoFactorAuth.generate_secret()
        user.two_fa_secret = secret
        user.backup_codes = ','.join(TwoFactorAuth.generate_backup_codes())
        
        db.session.commit()
        
        qr_code = TwoFactorAuth.create_qr_code(secret, user.email)
        if not qr_code:
            return jsonify({"error": "Failed to generate QR code"}), 500

        return jsonify({
            "secret": secret,
            "qr_code": qr_code,
            "backup_codes": user.backup_codes.split(',')
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

def init_db():
    try:
        with app.app_context():
            db.create_all()
            logging.info("Database tables created successfully")
    except Exception as e:
        logging.error(f"Database initialization failed: {str(e)}")
        raise

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
