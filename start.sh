#!/bin/bash

echo "🎯 Starting Eventure - Mini-Adventure Generator!"
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt --break-system-packages

echo ""
echo "🚀 Starting the backend server..."
echo "📡 Backend will be available at: http://localhost:5000"
echo "🌐 Frontend will be available at: http://localhost:8000"
echo ""
echo "💡 Open your browser and go to: http://localhost:8000"
echo ""

# Start the Flask server in the background
python3 server.py &
SERVER_PID=$!

# Start the HTTP server for the frontend
python3 -m http.server 8000 &
HTTP_PID=$!

echo "✅ Both servers are running!"
echo "🛑 Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $SERVER_PID 2>/dev/null
    kill $HTTP_PID 2>/dev/null
    echo "✅ Servers stopped. Thanks for using Eventure!"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait