from flask import Flask, jsonify, request, render_template, session
from flask_cors import CORS
import secrets
import string
import logging
import pyotp
import qrcode
from io import BytesIO
import base64
import pyotp
import qrcode
from io import BytesIO
import os
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime, timedelta
#import mysql.connector  # Import MySQL library for future use
app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)
#====================================Password Vault Page=============================================
# Dummy Passwords Database (Replace with MySQL later)
# PASSWORDS_DB = [
#     {
#         "id": 1,
#         "website": "Google",
#         "username": "user@example.com",
#         "password": "P@ssw0rd123!",
#         "logo_url": "https://www.google.com/favicon.ico",
#         "last_updated": "2 days ago",
#     }
# ]

# # Function to Connect to MySQL Database
# def get_db_connection():
#     return mysql.connector.connect(
#         host="localhost",
#         user="your_username",
#         password="your_password",
#         database="your_database_name"
#     )

# # Route to Serve Vault Page
# @app.route('/vault')
# def vault():
#     return render_template('vault.html')

# # API Route to Fetch All Passwords
# @app.route('/api/passwords', methods=['GET'])
# def get_passwords():
#     try:
#         # Uncomment below when MySQL is ready
#         # db = get_db_connection()
#         # cursor = db.cursor(dictionary=True)
#         # cursor.execute("SELECT * FROM passwords")
#         # passwords = cursor.fetchall()
#         # db.close()

#         # Return dummy database for now
#         return jsonify(PASSWORDS_DB), 200
#     except Exception as e:
#         return jsonify({"error": "Failed to fetch passwords.", "details": str(e)}), 500

# # API Route to Add a New Password
# @app.route('/api/passwords', methods=['POST'])
# def add_password():
#     try:
#         data = request.get_json()
#         website = data.get("website")
#         username = data.get("username")
#         password = data.get("password")
#         logo_url = f"https://www.google.com/favicon.ico"  # Placeholder for website logo

#         # Insert into MySQL (Uncomment when ready)
#         # db = get_db_connection()
#         # cursor = db.cursor()
#         # cursor.execute(
#         #     "INSERT INTO passwords (website, username, password, logo_url) VALUES (%s, %s, %s, %s)",
#         #     (website, username, password, logo_url)
#         # )
#         # db.commit()
#         # db.close()

#         # Add to dummy database
#         new_password = {
#             "id": len(PASSWORDS_DB) + 1,
#             "website": website,
#             "username": username,
#             "password": password,
#             "logo_url": logo_url,
#             "last_updated": "just now",
#         }
#         PASSWORDS_DB.append(new_password)
#         return jsonify({"message": "Password added successfully!", "password": new_password}), 201
#     except Exception as e:
#         return jsonify({"error": "Failed to add password.", "details": str(e)}), 500

# # API Route to Delete a Password
# @app.route('/api/passwords/<int:password_id>', methods=['DELETE'])
# def delete_password(password_id):
#     try:
#         # Delete from MySQL (Uncomment when ready)
#         # db = get_db_connection()
#         # cursor = db.cursor()
#         # cursor.execute("DELETE FROM passwords WHERE id = %s", (password_id,))
#         # db.commit()
#         # db.close()

#         # Remove from dummy database
#         global PASSWORDS_DB
#         PASSWORDS_DB = [p for p in PASSWORDS_DB if p["id"] != password_id]
#         return jsonify({"message": "Password deleted successfully!"}), 200
#     except Exception as e:
#         return jsonify({"error": "Failed to delete password.", "details": str(e)}), 500

# if __name__ == '__main__':
#     app.run(debug=True)

#====================================Generate Random Password========================================
# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

# Password generation logic
def generate_password(length=16, use_uppercase=True, use_lowercase=True, use_numbers=True, use_symbols=True):
    char_set = ""
    if use_uppercase:
        char_set += string.ascii_uppercase
    if use_lowercase:
        char_set += string.ascii_lowercase
    if use_numbers:
        char_set += string.digits
    if use_symbols:
        char_set += string.punctuation

    if not char_set:
        raise ValueError("At least one character set must be selected.")

    password = ''.join(secrets.choice(char_set) for _ in range(length))
    return password

@app.route('/')
def home():
    return render_template('generator.html')

@app.route('/generate-password', methods=['POST'])
def generate_password_api():
    try:
        logging.info("Password generation request received.")
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON request."}), 400

        length = data.get('length')
        if not isinstance(length, int) or length < 8 or length > 64:
            return jsonify({"error": "Password length must be an integer between 8 and 64."}), 400

        use_uppercase = data.get('use_uppercase', True)
        use_lowercase = data.get('use_lowercase', True)
        use_numbers = data.get('use_numbers', True)
        use_symbols = data.get('use_symbols', True)

        if not any([use_uppercase, use_lowercase, use_numbers, use_symbols]):
            return jsonify({"error": "At least one character set must be selected."}), 400

        password = generate_password(length, use_uppercase, use_lowercase, use_numbers, use_symbols)
        logging.info("Password generated successfully.")
        return jsonify({"password": password}), 200

    except ValueError as e:
        logging.error(f"Validation error: {e}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500

@app.route('/save-password', methods=['POST'])
def save_password():
    try:
        logging.info("Save password request received.")
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON request."}), 400

        password = data.get('password')
        if not password or len(password) < 8:
            return jsonify({"error": "Invalid password. Password must be at least 8 characters long."}), 400

        logging.info(f"Password saved: {password}")  # Replace with secure save logic
        return jsonify({"message": "Password saved successfully!"}), 200

    except Exception as e:
        logging.error(f"Error saving password: {e}")
        return jsonify({"error": "Failed to save password."}), 500
#==============================================2FA==================================================

app.config['SECRET_KEY'] = os.urandom(24)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///two_factor_auth.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
CORS(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    two_fa_secret = db.Column(db.String(32), nullable=True)
    backup_codes = db.Column(db.JSON, nullable=True)
    last_2fa_attempt = db.Column(db.DateTime, nullable=True)
    failed_attempts = db.Column(db.Integer, default=0)

    def increment_failed_attempts(self):
        self.failed_attempts += 1
        self.last_2fa_attempt = datetime.utcnow()
    def locked(self):
        if self.failed_attempts >= 3:
            cooldown = timedelta(minutes=15)
            if datetime.utcnow() - self.last_2fa_attempt < cooldown:
                return True
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
            if not email or not not email.endswith('@gmail.com'):
                raise ValueError("Invalid email address")
            totp = pyotp.TOTP(secret)
            qr_data = totp.provisioning_uri(name=email, issuer_name="CypherNest")
            qr = qrcode.make(qr_data)
            buffer = BytesIO()
            qr.save(buffer, format="PNG")
            return base64.b64encode(buffer.getvalue()).decode("utf-8")
        except Exception as e:
            logging.error(f"Error generating QR code: {e}")
            return None
    @staticmethod
    def verify_otp(secret, otp, window=3):
        totp = pyotp.TOTP(secret)
        return totp.verify(otp, valid_window=window)

@app.route('/2fa')
def two_factor_setup():
    return render_template('2fa-setup.html')

@app.route('/api/2fa/generate', methods=['POST'])
def generate_2fa_secret():
    try:
        email = request.json.get("email")
        if not email:
            return jsonify({"error": "Invalid user email."}), 400

        # Find or create user
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(email=email)
            db.session.add(user)

        # Generate and store 2FA secret
        secret = TwoFactorAuth.generate_secret()
        user.two_fa_secret = secret

        # Generate backup codes
        backup_codes = TwoFactorAuth.generate_backup_codes()
        user.backup_codes = backup_codes

        # Create QR code
        qr_base64 = TwoFactorAuth.create_qr_code(secret, email)

        #db.session.commit()

        return jsonify({
            "secret": secret, 
            "qr_code": qr_base64, 
            "backup_codes": backup_codes
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to generate 2FA secret.", "details": str(e)}), 500

@app.route('/api/2fa/verify', methods=['POST'])
def verify_otp():
    try:
        email = request.json.get("email")
        otp = request.json.get("otp")
        
        if not email or not otp:
            return jsonify({"error": "Invalid input."}), 400

        user = User.query.filter_by(email=email).first()
        if not user or not user.two_fa_secret:
            return jsonify({"error": "2FA not set up for this user."}), 400
        if user.locked():
            return jsonify({"error": "Too many failed attempts. Please try again later."}), 429

        # Check for brute force protection
        if user.failed_attempts >= 3 and user.last_2fa_attempt:
            cooldown = timedelta(minutes=15)
            if datetime.utcnow() - user.last_2fa_attempt < cooldown:
                return jsonify({"error": "Too many failed attempts. Please try again later."}), 429

        # Verify OTP
        if TwoFactorAuth.verify_otp(user.two_fa_secret, otp):
            user.reset_failed_attempts()
            db.session.commit()
            return jsonify({"message": "2FA verification successful!"}), 200
        else:
            user.increment_failed_attempts()
            db.session.commit()
            return jsonify({"error": "Invalid OTP.", "attempts_left": 5 - user.failed_attempts}), 400
    except Exception as e:
        return jsonify({"error": "Failed to verify OTP.", "details": str(e)}), 500

@app.route('/api/2fa/validate-backup', methods=['POST'])
def validate_backup_code():
    try:
        email = request.json.get("email")
        code = request.json.get("code")
        
        if not email or not code:
            return jsonify({"error": "Invalid input."}), 400

        user = User.query.filter_by(email=email).first()
        if not user or not user.backup_codes:
            return jsonify({"error": "No backup codes available."}), 400

        # Check if backup code exists
        if code in user.backup_codes:
            # Remove the used backup code
            user.backup_codes.remove(code)
            db.session.commit()
            return jsonify({"message": "Backup code accepted!"}), 200
        else:
            return jsonify({"error": "Invalid backup code."}), 400
    except Exception as e:
        return jsonify({"error": "Failed to validate backup code.", "details": str(e)}), 500

@app.route('/api/2fa/generate', methods=['POST'])
def generate_qr_code():
    email = request.json['email']
    secret = app.config['SECRET_KEY']
    qr_code = TwoFactorAuth.create_qr_code(secret, email)
    if qr_code:
        return {'qr_code': qr_code}
    else:
        return {'error': 'Failed to generate QR code'}, 500
# if __name__ == '__main__':
#     with app.app_context():
#         db.create_all()
#     app.run(debug=True)

if __name__ == '__main__':
    app.run(debug=True)
