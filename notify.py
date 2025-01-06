import os
from enum import Enum  
from flask import Flask, jsonify, request, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from datetime import datetime
import logging
from database import db, app

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='notify.log'
)

CORS(app, resources={r"/api/*": {
    "origins": ["http://localhost:5000", "http://127.0.0.1:5000"],
    "methods": ["GET", "POST", "DELETE"],
    "allow_headers": ["Content-Type"]
}})

class NotificationType(Enum):
    SECURITY_ALERT = "security_alert"
    PASSWORD_UPDATE = "password_update"
    LOGIN_ATTEMPT = "login_attempt"
    SYSTEM_UPDATE = "system_update"
    PASSWORD_STRENGTH = "password_strength"
    PASSWORD_REUSE = "password_reuse"
    TWO_FA_SETUP = "2fa_setup"

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(20), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    dismissed = db.Column(db.Boolean, default=False)
    action_url = db.Column(db.String(255), nullable=True)
    action_text = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'severity': self.severity,
            'is_read': self.is_read,
            'dismissed': self.dismissed,
            'action_url': self.action_url,
            'action_text': self.action_text,
            'created_at': self.created_at.isoformat()
        }

class NotificationPreferences(db.Model):
    __tablename__ = 'user_settings'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    security_alerts = db.Column(db.Boolean, default=True)
    password_updates = db.Column(db.Boolean, default=True)
    login_attempts = db.Column(db.Boolean, default=True)
    email_notifications = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'security_alerts': self.security_alerts,
            'password_updates': self.password_updates,
            'login_attempts': self.login_attempts,
            'email_notifications': self.email_notifications
        }

def create_notification(user_id, type, title, message, severity="info", action_url=None, action_text=None):
    try:
        notification = Notification(
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            severity=severity,
            action_url=action_url,
            action_text=action_text
        )
        db.session.add(notification)
        db.session.commit()
        return notification
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Create notification error: {str(e)}")
        return None
@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        filter_type = request.args.get('type', 'all')
        query = Notification.query.filter_by(
            user_id=session['user_id'],
            dismissed=False
        )
        
        if filter_type == 'unread':
            query = query.filter_by(is_read=False)
        elif filter_type == 'security_alerts':
            query = query.filter_by(type=NotificationType.SECURITY_ALERT)
        elif filter_type == 'updates':
            query = query.filter_by(type=NotificationType.SYSTEM_UPDATE)
        
        notifications = query.order_by(Notification.created_at.desc()).all()
        return jsonify([n.to_dict() for n in notifications]), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/notifications/dismiss', methods=['POST'])
def dismiss_notification():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    notification_id = request.json.get('notification_id')
    
    try:
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=session['user_id']
        ).first()
        
        if notification:
            notification.dismissed = True
            db.session.commit()
            return jsonify({'message': 'Notification dismissed'}), 200
        
        return jsonify({'error': 'Notification not found'}), 404
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/notifications/mark-read', methods=['POST'])
def mark_notification_read():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    notification_id = request.json.get('notification_id')
    
    try:
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=session['user_id']
        ).first()
        
        if notification:
            notification.is_read = True
            db.session.commit()
            return jsonify({'message': 'Notification marked as read'}), 200
        
        return jsonify({'error': 'Notification not found'}), 404
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/notifications/preferences', methods=['GET', 'POST'])
def manage_preferences():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    if request.method == 'GET':
        prefs = NotificationPreferences.query.filter_by(
            user_id=session['user_id']
        ).first()
        
        if not prefs:
            prefs = NotificationPreferences(user_id=session['user_id'])
            db.session.add(prefs)
            db.session.commit()
        
        return jsonify(prefs.to_dict()), 200
    
    else: 
        try:
            data = request.json
            prefs = NotificationPreferences.query.filter_by(
                user_id=session['user_id']
            ).first()
            
            if not prefs:
                prefs = NotificationPreferences(user_id=session['user_id'])
                db.session.add(prefs)
            
            prefs.security_alerts = data.get('security_alerts', True)
            prefs.password_updates = data.get('password_updates', True)
            prefs.login_attempts = data.get('login_attempts', True)
            prefs.email_notifications = data.get('email_notifications', True)
            
            db.session.commit()
            return jsonify({'message': 'Preferences updated'}), 200
        
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

def create_notification(user_id, type, severity, title, message, action_url=None, action_text=None):
    try:
        notification = Notification(
            user_id=user_id,
            type=type,
            severity=severity,
            title=title,
            message=message,
            action_url=action_url,
            action_text=action_text
        )
        db.session.add(notification)
        db.session.commit()
        return notification
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Create notification error: {str(e)}")
        return None


@app.before_first_request
def init_database():
    try:
        db.create_all()
    except Exception as e:
        app.logger.error(f"Database initialization error: {str(e)}")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
