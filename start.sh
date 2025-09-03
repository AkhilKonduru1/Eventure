#!/bin/bash

echo "Starting Eventure application..."

# Install dependencies
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

echo "Setup complete! You can now start the servers:"
echo "1. Backend: python3 backend_server.py"
echo "2. Frontend: python3 -m http.server 8000"
echo ""
echo "Then visit: http://localhost:8000"