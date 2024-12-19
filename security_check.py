from flask import Blueprint, jsonify, request, session
from datetime import datetime
import hashlib
import requests
import sqlite3
from functools import wraps
from cryptography.fernet import Fernet
import re

security_bp = Blueprint('security', __name__)

# Initialize encryption key (in production, use environment variables)
ENCRYPTION_KEY = Fernet.generate_key()
cipher_suite = Fernet(ENCRYPTION_KEY)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def get_db_connection():
    conn = sqlite3.connect('passwords.db')
    conn.row_factory = sqlite3.Row
    return conn

@security_bp.route('/api/security/check-password', methods=['POST'])
@login_required
def check_password():
    data = request.get_json()
    password = data.get('password')
    
    if not password:
        return jsonify({'error': 'Password is required'}), 400
    
    # Check password strength
    strength_score = check_password_strength(password)
    
    # Check for common patterns
    patterns_found = check_common_patterns(password)
    
    # Check if password has been exposed in breaches
    is_breached = check_password_breach(password)
    
    return jsonify({
        'strength_score': strength_score,
        'patterns_found': patterns_found,
        'is_breached': is_breached,
        'recommendations': generate_recommendations(strength_score, patterns_found, is_breached)
    })

def check_password_strength(password):
    score = 0
    checks = {
        'length': len(password) >= 12,
        'uppercase': bool(re.search(r'[A-Z]', password)),
        'lowercase': bool(re.search(r'[a-z]', password)),
        'numbers': bool(re.search(r'\d', password)),
        'special': bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password))
    }
    
    return {
        'score': sum(checks.values()) / len(checks) * 100,
        'checks': checks
    }

def check_common_patterns(password):
    patterns = {
        'sequential_numbers': bool(re.search(r'(?:012|123|234|345|456|567|678|789)', password)),
        'repeated_chars': bool(re.search(r'(.)\1{2,}', password)),
        'keyboard_patterns': bool(re.search(r'(?:qwerty|asdfgh|zxcvbn)', password.lower())),
        'common_words': bool(re.search(r'(?:password|admin|login|welcome)', password.lower()))
    }
    
    return {k: v for k, v in patterns.items() if v}

def check_password_breach(password):
    # Using k-Anonymity model with HIBP API
    password_hash = hashlib.sha1(password.encode()).hexdigest().upper()
    prefix, suffix = password_hash[:5], password_hash[5:]
    
    try:
        response = requests.get(f'https://api.pwnedpasswords.com/range/{prefix}')
        if response.status_code == 200:
            return suffix in response.text
    except:
        return None
    
    return False

def generate_recommendations(strength_score, patterns_found, is_breached):
    recommendations = []
    
    if strength_score['score'] < 60:
        if not strength_score['checks']['length']:
            recommendations.append("Make your password longer (at least 12 characters)")
        if not strength_score['checks']['uppercase']:
            recommendations.append("Add uppercase letters")
        if not strength_score['checks']['lowercase']:
            recommendations.append("Add lowercase letters")
        if not strength_score['checks']['numbers']:
            recommendations.append("Add numbers")
        if not strength_score['checks']['special']:
            recommendations.append("Add special characters")
    
    if patterns_found:
        recommendations.append("Avoid common patterns in your password")
    
    if is_breached:
        recommendations.append("This password has been exposed in data breaches. Change it immediately!")
    
    return recommendations

@security_bp.route('/api/security/check-accounts', methods=['GET'])
@login_required
def check_accounts():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        user_id = session['user_id']
        
        # Get all passwords for the user
        passwords = cursor.execute('''
            SELECT id, website, username, password, last_updated
            FROM passwords
            WHERE user_id = ?
        ''', (user_id,)).fetchall()
        
        results = []
        for pwd in passwords:
            decrypted_password = cipher_suite.decrypt(pwd['password'].encode()).decode()
            
            result = {
                'id': pwd['id'],
                'website': pwd['website'],
                'username': pwd['username'],
                'last_updated': pwd['last_updated'],
                'security_status': check_password_strength(decrypted_password),
                'is_breached': check_password_breach(decrypted_password),
                'age_warning': (datetime.now() - datetime.strptime(pwd['last_updated'], '%Y-%m-%d')).days > 90
            }
            results.append(result)
        
        return jsonify({'accounts': results})
    
    finally:
        conn.close()

@security_bp.route('/api/security/alerts', methods=['GET'])
@login_required
def get_security_alerts():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        user_id = session['user_id']
        
        # Get recent alerts
        alerts = cursor.execute('''
            SELECT * FROM security_alerts
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 10
        ''', (user_id,)).fetchall()
        
        return jsonify({'alerts': [dict(alert) for alert in alerts]})
    
    finally:
        conn.close()
