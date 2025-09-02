// Eventure - Mini-Adventure Generator
// Configuration
const GEMINI_API_KEY = 'AIzaSyBuyDNfsD6He3YepSRDY-10X5dkQKhZ_UI';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// DOM Elements
const locationInput = document.getElementById('location');
const moodSelect = document.getElementById('mood');
const durationSelect = document.getElementById('duration');
const spinButton = document.getElementById('spinButton');
const spinner = document.getElementById('spinner');
const adventureSpinner = document.getElementById('adventureSpinner');
const adventureResult = document.getElementById('adventureResult');
const adventureCard = document.getElementById('adventureCard');
const newAdventureBtn = document.getElementById('newAdventureBtn');
const saveBtn = document.getElementById('saveBtn');
const shareBtn = document.getElementById('shareBtn');
const memoryCapsule = document.getElementById('memoryCapsule');
const memoriesGrid = document.getElementById('memoriesGrid');

// State
let currentAdventure = null;
let savedMemories = JSON.parse(localStorage.getItem('eventureMemories')) || [];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadSavedMemories();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    spinButton.addEventListener('click', generateAdventure);
    newAdventureBtn.addEventListener('click', showAdventureSpinner);
    saveBtn.addEventListener('click', saveAdventure);
    shareBtn.addEventListener('click', shareAdventure);
    
    // Enter key support for inputs
    [locationInput, moodSelect, durationSelect].forEach(element => {
        element.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                generateAdventure();
            }
        });
    });
}

// Generate Adventure using Gemini API
async function generateAdventure() {
    const location = locationInput.value.trim();
    const mood = moodSelect.value;
    const duration = durationSelect.value;

    if (!location || !mood || !duration) {
        showNotification('Please fill in all fields!', 'error');
        return;
    }

    // Show loading state
    setLoadingState(true);
    
    try {
        const prompt = createAdventurePrompt(location, mood, duration);
        const adventure = await callGeminiAPI(prompt);
        
        currentAdventure = {
            ...adventure,
            location,
            mood,
            duration,
            timestamp: new Date().toISOString()
        };
        
        displayAdventure(currentAdventure);
        showAdventureResult();
        
    } catch (error) {
        console.error('Error generating adventure:', error);
        showNotification('Oops! Something went wrong. Try again!', 'error');
    } finally {
        setLoadingState(false);
    }
}

// Create the prompt for Gemini API
function createAdventurePrompt(location, mood, duration) {
    const durationText = getDurationText(duration);
    const moodEmojis = {
        'chill': '😌',
        'active': '🏃‍♀️',
        'creative': '🎨',
        'social': '👥',
        'adventurous': '🗺️',
        'foodie': '🍕'
    };

    return `You are Eventure, a fun app that creates spontaneous mini-adventures for teens. Generate a creative, specific, and exciting micro-adventure based on these details:

Location: ${location}
Mood: ${mood} ${moodEmojis[mood]}
Duration: ${durationText}

Create a unique adventure that:
- Is specific to the location (mention actual places, neighborhoods, or local spots when possible)
- Matches the mood perfectly
- Fits the time constraint
- Is fun and engaging for teens
- Includes creative, unexpected elements
- Is safe and realistic

Return your response in this EXACT JSON format:
{
  "title": "Creative adventure title with emojis",
  "description": "Detailed description of what to do, where to go, and how to make it fun",
  "location": "Specific location or area within ${location}",
  "estimatedTime": "${durationText}",
  "mood": "${mood}",
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"]
}

Make it sound exciting and use lots of emojis! Be creative and think outside the box.`;
}

// Get duration text from minutes
function getDurationText(minutes) {
    const durationMap = {
        '30': '30 minutes',
        '60': '1 hour',
        '120': '2 hours',
        '240': '4 hours',
        '480': '8+ hours'
    };
    return durationMap[minutes] || `${minutes} minutes`;
}

// Call Gemini API through our local server
async function callGeminiAPI(prompt) {
    const response = await fetch('http://localhost:5000/generate-adventure', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API request failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from API');
    }
    
    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
    }
    
    return JSON.parse(jsonMatch[0]);
}

// Display the generated adventure
function displayAdventure(adventure) {
    const adventureHTML = `
        <div class="adventure-title">
            ${adventure.title}
        </div>
        <div class="adventure-description">
            ${adventure.description}
        </div>
        <div class="adventure-details">
            <div class="detail-item">
                <span class="emoji">📍</span>
                <div class="label">Location</div>
                <div class="value">${adventure.location}</div>
            </div>
            <div class="detail-item">
                <span class="emoji">⏰</span>
                <div class="label">Duration</div>
                <div class="value">${adventure.estimatedTime}</div>
            </div>
            <div class="detail-item">
                <span class="emoji">🎭</span>
                <div class="label">Mood</div>
                <div class="value">${adventure.mood}</div>
            </div>
        </div>
        ${adventure.tips ? `
        <div class="adventure-tips">
            <h4>💡 Pro Tips:</h4>
            <ul>
                ${adventure.tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        ${adventure.hashtags ? `
        <div class="adventure-hashtags">
            <p>${adventure.hashtags.join(' ')}</p>
        </div>
        ` : ''}
    `;
    
    adventureCard.innerHTML = adventureHTML;
    adventureCard.classList.add('success');
    
    // Remove success animation after it completes
    setTimeout(() => {
        adventureCard.classList.remove('success');
    }, 600);
}

// Show adventure result section
function showAdventureResult() {
    adventureSpinner.style.display = 'none';
    adventureResult.style.display = 'block';
    adventureResult.scrollIntoView({ behavior: 'smooth' });
}

// Show adventure spinner section
function showAdventureSpinner() {
    adventureResult.style.display = 'none';
    adventureSpinner.style.display = 'block';
    adventureSpinner.scrollIntoView({ behavior: 'smooth' });
    
    // Clear form
    locationInput.value = '';
    moodSelect.value = '';
    durationSelect.value = '';
    locationInput.focus();
}

// Set loading state
function setLoadingState(loading) {
    if (loading) {
        spinButton.disabled = true;
        spinner.style.display = 'block';
        spinButton.querySelector('.button-text').textContent = 'Spinning your adventure...';
        adventureSpinner.classList.add('loading');
    } else {
        spinButton.disabled = false;
        spinner.style.display = 'none';
        spinButton.querySelector('.button-text').textContent = '🎲 Spin My Adventure!';
        adventureSpinner.classList.remove('loading');
    }
}

// Save adventure to memory capsule
function saveAdventure() {
    if (!currentAdventure) return;
    
    const memory = {
        id: Date.now(),
        ...currentAdventure,
        savedAt: new Date().toISOString()
    };
    
    savedMemories.unshift(memory);
    localStorage.setItem('eventureMemories', JSON.stringify(savedMemories));
    
    showNotification('Adventure saved to Memory Capsule! 💾', 'success');
    loadSavedMemories();
}

// Share adventure
function shareAdventure() {
    if (!currentAdventure) return;
    
    const shareText = `🎯 Check out my new adventure from Eventure!\n\n${currentAdventure.title}\n\n${currentAdventure.description}\n\n${currentAdventure.hashtags ? currentAdventure.hashtags.join(' ') : ''}\n\n#Eventure #MiniAdventure`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My Eventure Adventure',
            text: shareText
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('Adventure copied to clipboard! 📋', 'success');
        });
    }
}

// Load saved memories
function loadSavedMemories() {
    if (savedMemories.length === 0) {
        memoriesGrid.innerHTML = '<p style="text-align: center; color: #7f8c8d; grid-column: 1 / -1;">No adventures saved yet. Go create some memories! ✨</p>';
        return;
    }
    
    memoriesGrid.innerHTML = savedMemories.map(memory => `
        <div class="memory-item">
            <div class="memory-date">${formatDate(memory.savedAt)}</div>
            <div class="memory-title">${memory.title}</div>
            <div class="memory-description">${memory.description.substring(0, 100)}${memory.description.length > 100 ? '...' : ''}</div>
        </div>
    `).join('');
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'error' ? '#ff6b6b' : '#4ecdc4',
        color: 'white',
        padding: '15px 20px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        zIndex: '1000',
        fontSize: '1rem',
        fontWeight: '500',
        maxWidth: '300px',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add some fun interactions
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to cards
    const cards = document.querySelectorAll('.adventure-card, .memory-item');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add click animation to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to generate adventure
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (adventureSpinner.style.display !== 'none') {
            generateAdventure();
        }
    }
    
    // Escape to go back to spinner
    if (e.key === 'Escape') {
        if (adventureResult.style.display !== 'none') {
            showAdventureSpinner();
        }
    }
});

// Add some Easter eggs for fun
let clickCount = 0;
document.querySelector('.logo h1').addEventListener('click', function() {
    clickCount++;
    if (clickCount === 5) {
        showNotification('You found the secret! 🎉 Eventure loves you!', 'success');
        clickCount = 0;
    }
});

// Initialize memory capsule visibility
if (savedMemories.length > 0) {
    memoryCapsule.style.display = 'block';
}