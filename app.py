from flask import Flask, jsonify, request, render_template, session, url_for, redirect
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import secrets
import string
import logging
import os
from functools import wraps
from flask_bcrypt import Bcrypt
from flask import abort
from datetime import datetime, timedelta
from database import db, app
import redis
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return abort(401)
        return f(*args, **kwargs)
    return decorated_function
# Configure logging properly
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='generator.log'
)

bcrypt = Bcrypt(app)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5000", "http://127.0.0.1:5000", "YOUR_PRODUCTION_DOMAIN"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    storage_uri="memory://", 
    default_limits=["200 per day", "50 per hour"]
)


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.Text, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    reset_token_hash = db.Column(db.String(64), nullable=True)
    reset_token_expires_at = db.Column(db.DateTime, nullable=True)
    two_fa_secret = db.Column(db.String(32), nullable=True)
    backup_codes = db.Column(db.Text, nullable=True)
class Password(db.Model):
    __tablename__ = 'passwords'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    website = db.Column(db.String(255), nullable=False)
    username = db.Column(db.String(255), nullable=False)
    password = db.Column(db.Text, nullable=False)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    def to_dict(self):
        return {
            "id": self.id,
            "website": self.website,
            "username": self.username,
            "password": self.password,
            #"logo_url": self.logo_url,
            "last_updated": self.last_updated
        }
    
class PasswordAnalytics(db.Model):
    __tablename__ = 'password_analytics'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    strength_category = db.Column(db.String(50), nullable=True)
    reuse_count = db.Column(db.Integer, default=0)
    vulnerabilities = db.Column(db.Integer, default=0)

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
@login_required
def get_passwords():
    try:
        current_user_id = session.get('user_id')
        if not current_user_id:
            return jsonify({"error": "User not authenticated"}), 401
            
        passwords = Password.query.filter_by(user_id=current_user_id).order_by(Password.last_updated.desc()).all()
        
        return jsonify({
            "message": "Passwords retrieved successfully",
            "passwords": [password.to_dict() for password in passwords]
        }), 200
        
    except Exception as e:
        logging.error(f"Database error in get_passwords: {str(e)}")
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
@login_required
def delete_password(password_id):
    try:
        current_user_id = session.get('user_id')
        password = Password.query.get_or_404(password_id)
        if password.user_id != current_user_id:
            return jsonify({"error": "Unauthorized"}), 403
            
        db.session.delete(password)
        db.session.commit()
        
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

# Update the generate-password route
@app.route('/generate-password', methods=['POST', 'OPTIONS'])
def generate_password_api():
    try:
        if request.method == 'OPTIONS':
            response = app.make_default_options_response()
            return response

        data = request.get_json()
        print("Received data:", data)  


        length = int(data.get('length', 12)) if data else 12
        use_uppercase = data.get('use_uppercase', True) if data else True
        use_lowercase = data.get('use_lowercase', True) if data else True
        use_numbers = data.get('use_numbers', True) if data else True
        use_symbols = data.get('use_symbols', True) if data else True

        password = generate_password(
            length=length,
            use_uppercase=use_uppercase,
            use_lowercase=use_lowercase,
            use_numbers=use_numbers,
            use_symbols=use_symbols
        )
        
        response = jsonify({"password": password})
        return response

    except Exception as e:
        print(f"Error in generate_password_api: {str(e)}")  # Debug print
        return jsonify({"error": str(e)}), 500

def calculate_strength(password):
    """Calculate password strength score"""
    strength = 0
    criteria = {
        'length': len(password) >= 12,
        'uppercase': any(c.isupper() for c in password),
        'lowercase': any(c.islower() for c in password),
        'numbers': any(c.isdigit() for c in password),
        'symbols': any(not c.isalnum() for c in password)
    }
    return sum(criteria.values()) * 20  


@app.route('/save-password', methods=['POST', 'OPTIONS'])
@login_required  
def save_password():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        print("Received save password request:", data)  
        if not data:
            return jsonify({"error": "No data provided"}), 400

        if not all(k in data for k in ['website', 'username', 'password']):
            return jsonify({"error": "Missing required fields"}), 400

        current_user_id = session.get('user_id')
        if not current_user_id:
            return jsonify({"error": "User not authenticated"}), 401

        new_password = Password(
            user_id=current_user_id,  
            website=data['website'],
            username=data['username'],
            password=data['password']
        )
        
        print("Attempting to save password:", {
            "user_id": new_password.user_id,
            "website": new_password.website,
            "username": new_password.username
        })

        try:
            db.session.add(new_password)
            db.session.commit()
            print("Password saved successfully")
            
            return jsonify({
                "message": "Password saved successfully",
                "password": new_password.to_dict()
            }), 200
            
        except Exception as db_error:
            db.session.rollback()
            print(f"Database error: {str(db_error)}")
            return jsonify({
                "error": "Database error",
                "details": str(db_error)
            }), 500

    except Exception as e:
        print(f"General error: {str(e)}")
        return jsonify({
            "error": "Failed to save password",
            "details": str(e)
        }), 500

# Add route to get user's saved passwords
@app.route('/api/user/passwords', methods=['GET'])
@login_required
def get_user_passwords():
    try:
        current_user_id = session.get('user_id')
        passwords = Password.query.filter_by(user_id=current_user_id).all()
        
        return jsonify({
            "message": "Passwords retrieved successfully",
            "passwords": [password.to_dict() for password in passwords]
        }), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch passwords"}), 500

# Add login route
@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        user = User.query.filter_by(email=data['email']).first()
        
        if user and bcrypt.check_password_hash(user.password_hash, data['password']):
            session['user_id'] = user.id
            return jsonify({"message": "Login successful"}), 200
        
        return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"error": "Login failed"}), 500

# Add logout route
@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return jsonify({"message": "Logged out successfully"}), 200

# Add this route to check authentication status
@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    if 'user_id' in session:
        return jsonify({"authenticated": True, "user_id": session['user_id']}), 200
    return jsonify({"authenticated": False}), 401

# Error handlers
@app.errorhandler(429)
def ratelimit_handler(e):
    logging.warning(f"Rate limit exceeded: {str(e)}")
    return jsonify({"error": "Rate limit exceeded. Please try again later."}), 429

@app.errorhandler(500)
def internal_error(e):
    logging.error(f"Internal server error: {str(e)}")
    return jsonify({"error": "Internal server error"}), 500

def init_db():
    try:
        with app.app_context():
            db.create_all()
            logging.info("Database tables created successfully")
    except Exception as e:
        logging.error(f"Failed to initialize database: {str(e)}")
        raise


@app.after_request
def after_request(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Accept, Authorization'
    response.headers['Access-Control-Max-Age'] = '3600'
    return response
    
logging.info("Application started")
logging.info("Database connection established")
logging.info("Redis client connected")
logging.info("Flask application initialized")
logging.info("CORS configuration applied")
logging.info("Limiter configuration applied")
logging.info("Database tables created successfully")
logging.info("User model initialized")
logging.info("Password model initialized")
logging.info("PasswordAnalytics model initialized")

if __name__ == '__main__':
    init_db()  
    app.run(debug=True, port=5000)
