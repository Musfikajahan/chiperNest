from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_mysqldb import MySQL
import MySQLdb.cursors
import re
import os
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

app = Flask(__name__, template_folder='Template')  # Point to correct template folder

# Change this to your secret key (can be anything, it's for extra protection)
app.secret_key = '1a2b3c4d5e6d7g8h9i10'

# Enter your database connection details below
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = '*********'  # Replace ******* with your database password
app.config['MYSQL_DB'] = 'ciphernest'  # Updated to your actual database name

# Initialize MySQL
mysql = MySQL(app)

# Login route
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST' and 'email' in request.form and 'password' in request.form:
        email = request.form['email']
        password = request.form['password']
        
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT * FROM users WHERE email = %s', [email])
        account = cursor.fetchone()
        
        if account and check_password_hash(account['password_hash'], password):
            session['loggedin'] = True
            session['id'] = account['id']
            session['email'] = account['email']
            
            # Check if 2FA is enabled
            if account['two_fa_secret']:
                # Redirect to 2FA verification page
                return redirect(url_for('two_fa'))
            return redirect(url_for('home'))
        else:
            flash("Incorrect email/password!", "danger")
    return render_template('login.html', title="Login")

# Register route
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST' and 'email' in request.form and 'password' in request.form:
        email = request.form['email']
        password = request.form['password']
        
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute("SELECT * FROM users WHERE email = %s", [email])
        account = cursor.fetchone()
        
        if account:
            flash("Account already exists!", "danger")
        elif not re.match(r'[^@]+@[^@]+\.[^@]+', email):
            flash("Invalid email address!", "danger")
        elif not password or not email:
            flash("Please fill all fields!", "danger")
        else:
            # Hash the password before storing
            password_hash = generate_password_hash(password)
            cursor.execute('INSERT INTO users (email, password_hash, created_at) VALUES (%s, %s, %s)', 
                         (email, password_hash, datetime.now()))
            mysql.connection.commit()
            
            # Get the user_id of the newly created user
            user_id = cursor.lastrowid
            
            # Initialize password_analytics for the new user
            cursor.execute('INSERT INTO password_analytics (user_id, strength_category, reuse_count, vulnerabilities) VALUES (%s, %s, %s, %s)',
                         (user_id, 'NEW', 0, 0))
            mysql.connection.commit()
            
            flash("You have successfully registered!", "success")
            return redirect(url_for('login'))

    elif request.method == 'POST':
        flash("Please fill out the form!", "danger")
    return render_template('Register.html', title="Register")

# Home route
@app.route('/')
def home():
    if 'loggedin' in session:
        return render_template('index.html', email=session['email'], title="Home")
    return redirect(url_for('login'))

# Profile/Settings route
@app.route('/settings')
def settings():
    if 'loggedin' in session:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        # Get user settings
        cursor.execute('SELECT * FROM user_settings WHERE user_id = %s', [session['id']])
        settings = cursor.fetchall()
        # Get user's saved passwords count
        cursor.execute('SELECT COUNT(*) as pwd_count FROM passwords WHERE user_id = %s', [session['id']])
        pwd_count = cursor.fetchone()['pwd_count']
        # Get password analytics
        cursor.execute('SELECT * FROM password_analytics WHERE user_id = %s', [session['id']])
        analytics = cursor.fetchone()
        
        return render_template('settings.html', 
                             email=session['email'],
                             settings=settings,
                             pwd_count=pwd_count,
                             analytics=analytics,
                             title="Settings")
    return redirect(url_for('login'))

# 2FA Setup route
@app.route('/2fa-setup')
def two_fa_setup():
    if 'loggedin' in session:
        return render_template('2fa-setup.html', title="2FA Setup")
    return redirect(url_for('login'))

# 2FA Verification route
@app.route('/2fa', methods=['GET', 'POST'])
def two_fa():
    if 'loggedin' in session:
        if request.method == 'POST':
            # Add 2FA verification logic here
            pass
        return render_template('2fa.html', title="2FA Verification")
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)
