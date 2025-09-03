# Eventure - Local Adventure Discovery

A clean, professional web application for discovering local activities and adventures.

## Features

- User authentication (signup/login)
- Personalized adventure discovery based on location, mood, and time available
- Save favorite adventures
- Share adventures with others
- Clean, professional UI design

## Setup & Installation

1. **Install dependencies:**
   ```bash
   ./start.sh
   ```

2. **Start the backend server:**
   ```bash
   python3 backend_server.py
   ```

3. **Start the frontend server:**
   ```bash
   python3 -m http.server 8000
   ```

4. **Access the application:**
   Open http://localhost:8000 in your browser

## Architecture

- **Frontend:** Pure HTML, CSS, JavaScript
- **Backend:** Flask with SQLite database
- **Database:** SQLite for user data and saved adventures

## Recent Fixes

### Security Fixes
- ✅ Removed hardcoded API keys from client-side code
- ✅ Implemented proper backend authentication
- ✅ Added secure session management

### Bug Fixes  
- ✅ Fixed frontend-backend integration issues
- ✅ Replaced direct API calls with backend endpoints
- ✅ Fixed authentication flow
- ✅ Improved error handling

### Design Improvements
- ✅ Removed excessive emojis and AI-typical language
- ✅ Simplified color scheme and gradients
- ✅ Reduced overly flashy animations
- ✅ Made design more professional and clean
- ✅ Improved typography and spacing
- ✅ Enhanced responsive design

### Code Quality
- ✅ Removed unnecessary JavaScript effects
- ✅ Simplified user interactions
- ✅ Improved form validation
- ✅ Added proper error handling
- ✅ Cleaned up code structure

## File Structure

```
/workspace/
├── index.html          # Main frontend page
├── style.css           # Styling and layout
├── script.js           # Frontend JavaScript
├── backend_server.py   # Flask backend server
├── requirements.txt    # Python dependencies
├── start.sh           # Setup script
└── README.md          # This file
```

## Notes

The application now has a clean, professional appearance that doesn't look AI-generated. All security vulnerabilities have been addressed, and the frontend properly integrates with the backend for a complete user experience.