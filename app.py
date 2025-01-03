from flask import Flask, jsonify, request, render_template, session, url_for
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import secrets
import string
import logging
import os
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime, timedelta
import mysql.connector

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='generator.log'
)

app = Flask(__name__, 
    static_folder='static', 
    template_folder='templates'
)


app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or os.urandom(24)

CORS(app, resources={r"/*": {
    "origins": ["http://127.0.0.1:5500", "https://your-production-domain.com"],
    "methods": ["GET", "POST", "DELETE"],
    "allow_headers": ["Content-Type"]
}})

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

try:
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or 'mysql+pymysql://root:your_password@localhost/ciphernest'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db = SQLAlchemy(app)
    bcrypt = Bcrypt(app)
except Exception as e:
    logging.error(f"Database connection failed: {e}")
    raise

class Password(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    website = db.Column(db.String(255), nullable=False)
    username = db.Column(db.String(255), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    logo_url = db.Column(db.String(255), nullable=True)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "website": self.website,
            "username": self.username,
            "password": self.password,
            "logo_url": self.logo_url,
            "last_updated": self.last_updated
        }

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

#====================================Password Vault Page=============================================

@app.route('/vault')
def vault():
    try:
        return render_template('vault.html')
    except Exception as e:
        logging.error(f"Error loading vault page: {e}")
        return "Error loading vault page", 500

@app.route('/api/passwords', methods=['GET'])
def get_passwords():
    try:
        passwords = Password.query.all()
        return jsonify([password.to_dict() for password in passwords]), 200
    except Exception as e:
        logging.error(f"Failed to fetch passwords: {e}")
        return jsonify({"error": "Failed to fetch passwords"}), 500

@app.route('/api/passwords', methods=['POST'])
def add_password():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        required_fields = ['website', 'username', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Missing required field: {field}"}), 400
                
        new_password = Password(
            website=data['website'],
            username=data['username'],
            password=data['password']
        )
        
        db.session.add(new_password)
        db.session.commit()
        
        logging.info(f"Password added for website: {data['website']}")
        return jsonify({"message": "Password added successfully", "id": new_password.id}), 201

    except Exception as e:
        db.session.rollback()
        logging.error(f"Failed to add password: {e}")
        return jsonify({"error": "Failed to add password"}), 500

@app.route('/api/passwords/<int:password_id>', methods=['DELETE'])
def delete_password(password_id):
    try:
        password = Password.query.get_or_404(password_id)
        website = password.website 
        
        db.session.delete(password)
        db.session.commit()
        
        logging.info(f"Password deleted for website: {website}")
        return jsonify({"message": "Password deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        logging.error(f"Failed to delete password {password_id}: {e}")
        return jsonify({"error": "Failed to delete password"}), 500

#====================================Generate Random Password========================================

def generate_password(length=8, use_uppercase=True, use_lowercase=True, use_numbers=True, use_symbols=True):
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
@limiter.limit("10 per minute") 
def generate_password_api():
    try:
        logging.info("Password generation request received")
        data = request.get_json()
        
        if not data:
            logging.warning("Invalid JSON request received")
            return jsonify({"error": "Invalid JSON request"}), 400

        length = data.get('length', 12) 
        if not isinstance(length, int) or length < 8 or length > 64:
            return jsonify({"error": "Password length must be between 8 and 64"}), 400

        use_uppercase = data.get('use_uppercase', True)
        use_lowercase = data.get('use_lowercase', True)
        use_numbers = data.get('use_numbers', True)
        use_symbols = data.get('use_symbols', True)

        if not any([use_uppercase, use_lowercase, use_numbers, use_symbols]):
            return jsonify({"error": "At least one character set must be selected"}), 400
        try:
            password = generate_password(
                length, 
                use_uppercase, 
                use_lowercase, 
                use_numbers, 
                use_symbols
            )
            logging.info("Password generated successfully")
            return jsonify({"password": password, "strength": calculate_strength(password)}), 200
        except ValueError as e:
            logging.error(f"Password generation failed: {str(e)}")
            return jsonify({"error": str(e)}), 400

    except Exception as e:
        logging.error(f"Unexpected error in password generation: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

def calculate_strength(password):
    strength = 0
    criteria = {
        'length': len(password) >= 12,
        'uppercase': any(c.isupper() for c in password),
        'lowercase': any(c.islower() for c in password),
        'numbers': any(c.isdigit() for c in password),
        'symbols': any(not c.isalnum() for c in password)
    }
    return sum(criteria.values()) * 20  # Score from 0 to 100

@app.route('/save-password', methods=['POST'])
def save_password():
    try:
        logging.info("Save password request received.")
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON request."}), 400

        website = data.get('website')
        username = data.get('username')
        password = data.get('password')
        if not password or len(password) < 8:
            return jsonify({"error": "Invalid password. Password must be at least 8 characters long."}), 400

        new_password = Password(
            website=website,
            username=username,
            password=password,
        )
        db.session.add(new_password)
        db.session.commit()

        logging.info(f"Password saved: {password}")
        return jsonify({"message": "Password saved successfully!"}), 200

    except Exception as e:
        logging.error(f"Error saving password: {e}")
        return jsonify({"error": "Failed to save password."}), 500

@app.errorhandler(429)
def ratelimit_handler(e):
    logging.warning(f"Rate limit exceeded: {str(e)}")
    return jsonify({"error": "Rate limit exceeded. Please try again later."}), 429

@app.errorhandler(500)
def internal_error(e):
    logging.error(f"Internal server error: {str(e)}")
    return jsonify({"error": "Internal server error"}), 500

# if __name__ == '__main__':
#     with app.app_context():
#         try:
#             db.create_all()
    
#     # Production settings
#     app.run(
#         host='0.0.0.0',
#         port=int(os.environ.get('PORT', 5000)),
#         debug=False  
#     )
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
