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

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root@localhost/ciphernest'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
#CORS(app)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5000", "http://127.0.0.1:5000"]}})
class User(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(50), unique=True)
    password_hash = db.Column(db.String(255))
    
    # 2FA Fields
    two_fa_secret = db.Column(db.String(32), nullable=True)
    two_fa_enabled = db.Column(db.Boolean, default=False)
    backup_codes = db.Column(db.JSON, nullable=True)
    
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

class TwoFactorAuth:
    @staticmethod
    def generate_secret():
        return pyotp.random_base32()
    
    @staticmethod
    def generate_backup_codes(count=6):
        return [secrets.token_hex(4) for _ in range(count)]
    
    @staticmethod
    def create_qr_code(secret, email):
        try:
            totp = pyotp.TOTP(secret)
            qr_data = totp.provisioning_uri(name=email, issuer_name="CypherNest")
            qr = qrcode.make(qr_data)
            buffer = BytesIO()
            qr.save(buffer, format="PNG")
            return base64.b64encode(buffer.getvalue()).decode("utf-8")
        except Exception as e:
            logging.error(f"QR Code Generation Error: {e}")
            return None
    
    @staticmethod
    def verify_otp(secret, otp, window=3):
        totp = pyotp.TOTP(secret)
        return totp.verify(otp, valid_window=window)

@app.route('/api/2fa/generate', methods=['POST'])
def generate_2fa_secret():
    try:
        email = request.json.get("email")
        if not email:
            return jsonify({"error": "Invalid user email."}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(email=email)
            db.session.add(user)
        
        secret = TwoFactorAuth.generate_secret()
        user.two_fa_secret = secret
        backup_codes = TwoFactorAuth.generate_backup_codes()
        user.backup_codes = backup_codes
        
        qr_code = TwoFactorAuth.create_qr_code(secret, email)
        if not qr_code:
            return jsonify({"error": "Failed to generate QR code."}), 500

        db.session.commit()
        return jsonify({
            "secret": secret, 
            "qr_code": qr_code, 
            "backup_codes": backup_codes
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

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

# Run the application
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
