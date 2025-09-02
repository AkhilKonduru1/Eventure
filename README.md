# 🎯 Eventure - Turn Everyday Moments into Mini-Adventures

A spontaneous mini-event generator and planner for teens that uses AI to create personalized micro-adventures based on location, mood, and time available.

## 🚀 Quick Start

### Option 1: Easy Start (Recommended)
```bash
./start.sh
```

### Option 2: Manual Start
1. Install dependencies:
```bash
pip3 install -r requirements.txt
```

2. Start the backend server:
```bash
python3 server.py
```

3. In a new terminal, start the frontend server:
```bash
python3 -m http.server 8000
```

4. Open your browser and go to: `http://localhost:8000`

## 🎮 How to Use

1. **Enter your location** (city or zip code)
2. **Choose your mood** (Chill, Active, Creative, Social, Adventurous, Foodie)
3. **Select your time** (30 minutes to 8+ hours)
4. **Click "🎲 Spin My Adventure!"**
5. **Get a personalized micro-adventure!**
6. **Save it to your Memory Capsule or share with friends**

## 🛠️ Troubleshooting

### Common Issues:

**"API request failed" error:**
- Make sure the backend server is running on port 5000
- Check that your Gemini API key is valid
- Ensure you have internet connection

**"Connection refused" error:**
- Start the backend server first: `python3 server.py`
- Make sure port 5000 is not being used by another application

**CORS errors:**
- The app now uses a local Flask server to handle CORS issues
- Make sure both servers are running

### Health Check:
Visit `http://localhost:5000/health` to check if the backend is working.

## 🎨 Features

- ✨ **AI-Powered Adventures**: Uses Google's Gemini API to generate unique, personalized adventures
- 🎭 **Mood-Based Suggestions**: 6 different mood categories for personalized experiences
- ⏰ **Time-Aware**: Adventures that fit your available time (30 min to 8+ hours)
- 📍 **Location-Specific**: Real places and neighborhoods in your area
- 💾 **Memory Capsule**: Save your favorite adventures
- 📱 **Share Functionality**: Share adventures with friends
- 🎨 **Gen Z Aesthetic**: Modern, emoji-rich design
- 📱 **Responsive**: Works on desktop and mobile

## 🏗️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Python Flask
- **AI**: Google Gemini API
- **Storage**: Local Storage for memories
- **Styling**: Custom CSS with modern gradients and animations

## 🎯 Perfect for Congressional App Challenge

This app demonstrates:
- ✅ **Relatable Problem**: Solves teen boredom with creative solutions
- ✅ **AI Integration**: Smart use of machine learning for personalization
- ✅ **Social Features**: Sharing and memory saving capabilities
- ✅ **Innovation**: Unique blend of adventure planning and AI
- ✅ **Demo-Ready**: Easy to show in 2-3 minutes

## 🔧 Development

The app is structured as:
- `index.html` - Main HTML structure
- `style.css` - Modern CSS with Gen Z aesthetic
- `script.js` - Frontend JavaScript logic
- `server.py` - Flask backend for API proxy
- `requirements.txt` - Python dependencies

## 📝 License

Created for the Congressional App Challenge. Feel free to use and modify!

---

Made with 💜 for teens who refuse to be bored! 🎯✨