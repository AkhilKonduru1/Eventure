#!/usr/bin/env python3
"""
Backend server for Eventure
Run with: python3 backend_server.py
"""
from flask import Flask, request, jsonify, session
from flask_cors import CORS
import sqlite3
import hashlib
import uuid
import json
import random
from datetime import datetime
import os

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=['http://localhost:8000', 'http://127.0.0.1:8000', 'file://', 'null'])
app.secret_key = os.getenv('SECRET_KEY', 'eventure-secret-key-change-in-production')

# Configure session for better cross-origin support
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_HTTPONLY'] = False
app.config['SESSION_COOKIE_SAMESITE'] = None

# Database functions
def get_db():
    conn = sqlite3.connect('eventure.db')
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def require_auth(f):
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

# Sample adventure generator
def generate_sample_adventure(location, mood, duration):
    duration_text = f"{duration} minutes" if duration < 60 else f"{duration//60} hour{'s' if duration > 60 else ''}"
    
    sample_adventures = {
        'chill': [
            {
                'title': f'Peaceful Park Visit in {location}',
                'description': f'Find a quiet spot in a local park in {location} and enjoy some downtime. Bring a book, listen to music, or just watch the world go by.',
                'cost': '$0-10',
                'tips': ['Bring a blanket or chair', 'Pack some snacks', 'Choose a comfortable spot'],
            },
            {
                'title': f'Local Café Discovery in {location}',
                'description': f'Explore a new café in {location} and try something different from their menu. Perfect for reading or catching up with a friend.',
                'cost': '$8-15',
                'tips': ['Try something new', 'Bring a book', 'Ask staff for recommendations'],
            }
        ],
        'active': [
            {
                'title': f'Bike Ride Through {location}',
                'description': f'Rent a bike and explore {location} at your own pace. Discover new neighborhoods and get some exercise.',
                'cost': '$15-25',
                'tips': ['Check bike rental locations', 'Wear a helmet', 'Plan a safe route'],
            },
            {
                'title': f'Walking Tour of {location}',
                'description': f'Create your own walking tour of {location}, visiting interesting landmarks and neighborhoods.',
                'cost': 'Free',
                'tips': ['Wear comfortable shoes', 'Stay hydrated', 'Use maps app for navigation'],
            }
        ],
        'creative': [
            {
                'title': f'Local Art Discovery in {location}',
                'description': f'Explore public art, galleries, or creative spaces in {location}. Take photos and learn about local artists.',
                'cost': '$5-15',
                'tips': ['Bring a camera', 'Research art districts', 'Visit during daylight'],
            }
        ],
        'social': [
            {
                'title': f'Food Market Visit in {location}',
                'description': f'Explore a local food market in {location} with friends. Try different vendors and share the experience.',
                'cost': '$15-30',
                'tips': ['Bring cash', 'Come with friends', 'Try multiple vendors'],
            }
        ],
        'adventurous': [
            {
                'title': f'Hidden Spots Exploration in {location}',
                'description': f'Use local guides or apps to find lesser-known interesting spots in {location}. Discover something new!',
                'cost': '$10-20',
                'tips': ['Research beforehand', 'Stay in safe areas', 'Use public transport'],
            }
        ],
        'foodie': [
            {
                'title': f'Cuisine Discovery in {location}',
                'description': f'Pick a cuisine you\'ve never tried and find a highly-rated restaurant in {location}. Expand your palate!',
                'cost': '$20-40',
                'tips': ['Read reviews first', 'Ask for recommendations', 'Try signature dishes'],
            }
        ]
    }
    
    adventures = sample_adventures.get(mood, sample_adventures['chill'])
    adventure = random.choice(adventures).copy()
    
    adventure.update({
        'id': str(uuid.uuid4()),
        'location': adventure.get('location', location),
        'mood': mood,
        'duration': duration,
        'estimatedTime': duration_text,
    })
    
    return adventure

# Authentication endpoints
@app.route('/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        location = data.get('location')
        
        if not all([name, email, password, location]):
            return jsonify({'error': 'All fields are required'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
        if cursor.fetchone():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create user
        user_id = str(uuid.uuid4())
        password_hash = hash_password(password)
        
        cursor.execute('''
            INSERT INTO users (id, name, email, password_hash, location)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, name, email, password_hash, location))
        
        conn.commit()
        conn.close()
        
        # Set session
        session['user_id'] = user_id
        session['user_name'] = name
        session['user_location'] = location
        
        return jsonify({
            'success': True,
            'user': {
                'id': user_id,
                'name': name,
                'email': email,
                'location': location
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Signup failed: {str(e)}'}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not all([email, password]):
            return jsonify({'error': 'Email and password are required'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Find user
        cursor.execute('''
            SELECT id, name, email, password_hash, location 
            FROM users WHERE email = ?
        ''', (email,))
        
        user = cursor.fetchone()
        if not user or user['password_hash'] != hash_password(password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        conn.close()
        
        # Set session
        session['user_id'] = user['id']
        session['user_name'] = user['name']
        session['user_location'] = user['location']
        
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'location': user['location']
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@app.route('/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/auth/me', methods=['GET'])
def get_current_user():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, name, email, location, created_at
            FROM users WHERE id = ?
        ''', (session['user_id'],))
        
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        conn.close()
        
        return jsonify({
            'user': {
                'id': user['id'],
                'name': user['name'], 
                'email': user['email'],
                'location': user['location'],
                'created_at': user['created_at']
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get user: {str(e)}'}), 500

# Adventure endpoints
@app.route('/adventures/discover', methods=['POST'])
@require_auth
def discover_adventures():
    try:
        data = request.get_json()
        location = data.get('location', session.get('user_location', 'your area'))
        mood_filter = data.get('mood_filter', 'all')
        duration_filter = data.get('duration_filter', 'all')
        count = data.get('count', 6)
        
        adventures = []
        moods = ['chill', 'active', 'creative', 'social', 'adventurous', 'foodie']
        durations = [30, 60, 120, 240]
        
        for i in range(count):
            # Select mood based on filter
            if mood_filter == 'all':
                mood = random.choice(moods)
            else:
                mood = mood_filter
            
            # Select duration based on filter
            if duration_filter == 'all':
                duration = random.choice(durations)
            else:
                duration = int(duration_filter)
            
            adventure_data = generate_sample_adventure(location, mood, duration)
            adventures.append(adventure_data)
        
        return jsonify({'adventures': adventures})
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate adventures: {str(e)}'}), 500

# Adventure save endpoint
@app.route('/adventures/save', methods=['POST'])
@require_auth
def save_adventure():
    try:
        data = request.get_json()
        adventure_id = data.get('adventure_id')
        
        if not adventure_id:
            return jsonify({'error': 'Adventure ID required'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if already saved
        cursor.execute('''
            SELECT id FROM saved_adventures 
            WHERE user_id = ? AND adventure_data->>'$.id' = ?
        ''', (session['user_id'], adventure_id))
        
        if cursor.fetchone():
            return jsonify({'error': 'Adventure already saved'}), 400
        
        # Save adventure record
        save_id = str(uuid.uuid4())
        adventure_data = json.dumps({
            'id': adventure_id,
            'saved_by': session['user_id'],
            'saved_at': datetime.now().isoformat()
        })
        
        cursor.execute('''
            INSERT INTO saved_adventures (id, user_id, adventure_data)
            VALUES (?, ?, ?)
        ''', (save_id, session['user_id'], adventure_data))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'error': f'Failed to save adventure: {str(e)}'}), 500

# Get saved adventures
@app.route('/adventures/memories', methods=['GET'])
@require_auth
def get_memories():
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, adventure_data, saved_at
            FROM saved_adventures 
            WHERE user_id = ?
            ORDER BY saved_at DESC
        ''', (session['user_id'],))
        
        memories = []
        for row in cursor.fetchall():
            adventure_data = json.loads(row['adventure_data'])
            memories.append({
                'id': row['id'],
                'title': f"Saved Adventure",
                'description': "A saved adventure from your discovery session",
                'saved_at': row['saved_at'],
            })
        
        conn.close()
        return jsonify({'memories': memories})
        
    except Exception as e:
        return jsonify({'error': f'Failed to get memories: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Eventure backend is running'
    })

if __name__ == '__main__':
    # Initialize database
    conn = sqlite3.connect('eventure.db')
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            location TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create saved adventures table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS saved_adventures (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            adventure_data JSON NOT NULL,
            saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    
    print("Starting Eventure backend server...")
    print("Server available at: http://localhost:5001")
    print("Health check: http://localhost:5001/health")
    
    app.run(host='0.0.0.0', port=5001, debug=True)