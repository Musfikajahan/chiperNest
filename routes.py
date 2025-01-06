from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session
from flask_bcrypt import Bcrypt
from datetime import datetime
from app import db, User

auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()

@auth_bp.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Please fill all fields'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if user and bcrypt.check_password_hash(user.password_hash, password):
            session['loggedin'] = True
            session['id'] = user.id
            session['email'] = user.email
            
            # Check if 2FA is enabled
            if user.two_fa_secret:
                return jsonify({
                    'redirect': url_for('two_factor_setup'),
                    'requires_2fa': True
                })
            
            return jsonify({
                'message': 'Login successful',
                'redirect': url_for('home')
            })
        else:
            return jsonify({'error': 'Incorrect email/password!'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        confirm_password = data.get('confirm_password')
        
        if not all([email, password, confirm_password]):
            return jsonify({'error': 'Please fill all fields'}), 400
            
        if password != confirm_password:
            return jsonify({'error': 'Passwords do not match'}), 400
            
        if not email or '@' not in email:
            return jsonify({'error': 'Invalid email address'}), 400
            
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 400
            
        # Create new user
        password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = User(
            email=email,
            password_hash=password_hash,
            created_at=datetime.utcnow()
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'Registration successful',
            'redirect': url_for('login')
        })
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/api/logout')
def logout():
    session.pop('loggedin', None)
    session.pop('id', None)
    session.pop('email', None)
    return jsonify({
        'message': 'Logout successful',
        'redirect': url_for('login')
    })
