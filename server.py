#!/usr/bin/env python3
"""
Simple Flask server to proxy Gemini API requests and handle CORS
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

GEMINI_API_KEY = 'AIzaSyBuyDNfsD6He3YepSRDY-10X5dkQKhZ_UI'
GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

@app.route('/generate-adventure', methods=['POST'])
def generate_adventure():
    try:
        data = request.get_json()
        prompt = data.get('prompt')
        
        if not prompt:
            return jsonify({'error': 'No prompt provided'}), 400
        
        # Prepare the request to Gemini API
        headers = {
            'Content-Type': 'application/json',
        }
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.9,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 1024,
            }
        }
        
        # Make request to Gemini API
        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            return jsonify(result)
        else:
            print(f"Gemini API error: {response.status_code} - {response.text}")
            return jsonify({
                'error': f'API request failed: {response.status_code}',
                'details': response.text
            }), response.status_code
            
    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timeout'}), 408
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Request failed: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Eventure server is running!'})

if __name__ == '__main__':
    print("🚀 Starting Eventure server...")
    print("📡 Server will be available at: http://localhost:5000")
    print("🎯 Health check: http://localhost:5000/health")
    app.run(host='0.0.0.0', port=5000, debug=True)