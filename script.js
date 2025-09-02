// Eventure - Mini-Adventure Generator
// Configuration
const GEMINI_API_KEY = 'AIzaSyBuyDNfsD6He3YepSRDY-10X5dkQKhZ_UI';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// DOM Elements
const locationInput = document.getElementById('location');
const moodSelect = document.getElementById('mood');
const durationSelect = document.getElementById('duration');
const budgetSelect = document.getElementById('budget');
const energySelect = document.getElementById('energy');
const multipleOptionsCheckbox = document.getElementById('multipleOptions');
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
const groupSpinBtn = document.getElementById('groupSpinBtn');
const invitedFriendsDiv = document.getElementById('invitedFriends');

// State
let currentAdventure = null;
let savedMemories = JSON.parse(localStorage.getItem('eventureMemories')) || [];
let invitedFriends = [];
let currentTab = 'adventures';
let multipleAdventures = [];
let streamController = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadSavedMemories();
    setupEventListeners();
    setupTabNavigation();
    updateInvitedFriendsDisplay();
});

// Event Listeners
function setupEventListeners() {
    spinButton.addEventListener('click', generateAdventure);
    newAdventureBtn.addEventListener('click', showAdventureSpinner);
    saveBtn.addEventListener('click', saveAdventure);
    shareBtn.addEventListener('click', shareAdventure);
    groupSpinBtn.addEventListener('click', generateGroupAdventure);
    
    // Enter key support for inputs
    [locationInput, moodSelect, durationSelect, budgetSelect, energySelect].forEach(element => {
        element.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                generateAdventure();
            }
        });
    });
}

// Setup Tab Navigation
function setupTabNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
}

// Switch Tab Function
function switchTab(tabName) {
    currentTab = tabName;
    
    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    const targetContent = document.getElementById(`${tabName}Tab`);
    if (targetContent) {
        targetContent.style.display = 'block';
    }
    
    // Handle memory capsule visibility
    if (tabName === 'memories') {
        memoryCapsule.style.display = 'block';
        loadSavedMemories();
    }
}

// Friends Management
function inviteFriend(friendId) {
    const friendCard = document.querySelector(`[data-friend="${friendId}"]`);
    const inviteBtn = friendCard.querySelector('.invite-btn');
    
    const friends = {
        'alex': { name: 'Alex Chen', emoji: '🧑‍🎨', preferences: ['creative', 'chill'] },
        'sarah': { name: 'Sarah Kim', emoji: '🏃‍♀️', preferences: ['active', 'adventurous'] },
        'marcus': { name: 'Marcus Rivera', emoji: '🍕', preferences: ['foodie', 'social'] },
        'zoe': { name: 'Zoe Thompson', emoji: '🎭', preferences: ['social', 'adventurous'] }
    };
    
    if (invitedFriends.includes(friendId)) {
        // Remove friend
        invitedFriends = invitedFriends.filter(id => id !== friendId);
        friendCard.classList.remove('invited');
        inviteBtn.classList.remove('invited');
        inviteBtn.textContent = 'Invite';
    } else {
        // Add friend
        invitedFriends.push(friendId);
        friendCard.classList.add('invited');
        inviteBtn.classList.add('invited');
        inviteBtn.textContent = 'Invited!';
    }
    
    updateInvitedFriendsDisplay();
    groupSpinBtn.disabled = invitedFriends.length === 0;
}

// Update Invited Friends Display
function updateInvitedFriendsDisplay() {
    const friends = {
        'alex': { name: 'Alex Chen', emoji: '🧑‍🎨' },
        'sarah': { name: 'Sarah Kim', emoji: '🏃‍♀️' },
        'marcus': { name: 'Marcus Rivera', emoji: '🍕' },
        'zoe': { name: 'Zoe Thompson', emoji: '🎭' }
    };
    
    if (invitedFriends.length === 0) {
        invitedFriendsDiv.innerHTML = '<p>No friends invited yet. Select some friends above!</p>';
        return;
    }
    
    const friendTags = invitedFriends.map(friendId => {
        const friend = friends[friendId];
        return `
            <div class="invited-friend-tag">
                <span>${friend.emoji} ${friend.name}</span>
                <button class="remove-friend" onclick="inviteFriend('${friendId}')">×</button>
            </div>
        `;
    }).join('');
    
    invitedFriendsDiv.innerHTML = friendTags;
}

// Generate Adventure using Gemini API
async function generateAdventure() {
    const location = locationInput.value.trim();
    const mood = moodSelect.value;
    const duration = durationSelect.value;
    const budget = budgetSelect.value;
    const energy = energySelect.value;

    if (!location || !mood || !duration) {
        showNotification('Please fill in all required fields!', 'error');
        return;
    }

    // Show loading state
    setLoadingState(true);
    
    try {
        const prompt = createAdventurePrompt(location, mood, duration, budget, energy);
        const result = await callGeminiAPIWithStreaming(prompt);
        
        if (multipleOptionsCheckbox.checked && result.adventures) {
            multipleAdventures = result.adventures.map(adventure => ({
                ...adventure,
                location,
                mood,
                duration,
                budget,
                energy,
                timestamp: new Date().toISOString()
            }));
            displayMultipleAdventures(multipleAdventures);
        } else {
            const adventure = result.adventures ? result.adventures[0] : result;
            currentAdventure = {
                ...adventure,
                location,
                mood,
                duration,
                budget,
                energy,
                timestamp: new Date().toISOString()
            };
            displayAdventure(currentAdventure);
        }
        
        showAdventureResult();
        
    } catch (error) {
        console.error('Error generating adventure:', error);
        showNotification('Oops! Something went wrong. Try again!', 'error');
    } finally {
        setLoadingState(false);
    }
}

// Generate Group Adventure
async function generateGroupAdventure() {
    const location = locationInput.value.trim() || 'your area';
    
    if (invitedFriends.length === 0) {
        showNotification('Please invite some friends first!', 'error');
        return;
    }
    
    setLoadingState(true);
    
    try {
        const prompt = createAdventurePrompt(location, 'social', '120', '', '', true, invitedFriends);
        const result = await callGeminiAPIWithStreaming(prompt);
        
        const adventure = result.adventures ? result.adventures[0] : result;
        currentAdventure = {
            ...adventure,
            location,
            mood: 'social',
            duration: '120',
            isGroup: true,
            friends: invitedFriends,
            timestamp: new Date().toISOString()
        };
        
        displayAdventure(currentAdventure);
        showAdventureResult();
        switchTab('adventures');
        
    } catch (error) {
        console.error('Error generating group adventure:', error);
        showNotification('Oops! Something went wrong. Try again!', 'error');
    } finally {
        setLoadingState(false);
    }
}

// Create the prompt for Gemini API
function createAdventurePrompt(location, mood, duration, budget = '', energy = '', isGroup = false, friends = []) {
    const durationText = getDurationText(duration);
    const moodEmojis = {
        'chill': '😌',
        'active': '🏃‍♀️',
        'creative': '🎨',
        'social': '👥',
        'adventurous': '🗺️',
        'foodie': '🍕'
    };

    let budgetText = budget ? `\nBudget: ${budget}` : '';
    let energyText = energy ? `\nEnergy Level: ${energy}` : '';
    let groupText = '';
    
    if (isGroup && friends.length > 0) {
        const friendList = friends.map(id => {
            const friendData = {
                'alex': 'Alex (creative, loves art)',
                'sarah': 'Sarah (active, loves sports)',
                'marcus': 'Marcus (foodie, loves restaurants)',
                'zoe': 'Zoe (social butterfly, loves events)'
            };
            return friendData[id];
        }).join(', ');
        groupText = `\nGroup Size: ${friends.length + 1} people (You + ${friendList})`;
    }

    const multipleOptions = document.getElementById('multipleOptions').checked;
    const optionsText = multipleOptions ? '\n\nGenerate 3-5 different adventure options in an array format.' : '';

    return `You are Eventure, a fun app that creates spontaneous mini-adventures for teens. Generate creative, specific, and exciting micro-adventure${multipleOptions ? 's' : ''} based on these details:

Location: ${location}
Mood: ${mood} ${moodEmojis[mood]}
Duration: ${durationText}${budgetText}${energyText}${groupText}

Create ${multipleOptions ? 'multiple unique adventures' : 'a unique adventure'} that:
- ${multipleOptions ? 'Are' : 'Is'} specific to the location (mention actual places, neighborhoods, or local spots when possible)
- Match${multipleOptions ? '' : 'es'} the mood perfectly
- Fit${multipleOptions ? '' : 's'} the time constraint
- ${multipleOptions ? 'Are' : 'Is'} fun and engaging for teens
- Include${multipleOptions ? '' : 's'} creative, unexpected elements
- ${multipleOptions ? 'Are' : 'Is'} safe and realistic
${budget ? `- Stay${multipleOptions ? '' : 's'} within the ${budget} budget range` : ''}
${energy ? `- Match${multipleOptions ? '' : 'es'} the ${energy} energy level` : ''}
${isGroup ? `- ${multipleOptions ? 'Are' : 'Is'} perfect for a group of ${friends.length + 1} people` : ''}

Return your response in this EXACT JSON format:
${multipleOptions ? `{
  "adventures": [
    {
      "title": "Creative adventure title with emojis",
      "description": "Detailed description of what to do, where to go, and how to make it fun",
      "location": "Specific location or area within ${location}",
      "estimatedTime": "${durationText}",
      "mood": "${mood}",
      "tips": ["Tip 1", "Tip 2", "Tip 3"],
      "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"]
    }
  ]
}` : `{
  "title": "Creative adventure title with emojis",
  "description": "Detailed description of what to do, where to go, and how to make it fun",
  "location": "Specific location or area within ${location}",
  "estimatedTime": "${durationText}",
  "mood": "${mood}",
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"]
}`}

Make it sound exciting and use lots of emojis! Be creative and think outside the box.${optionsText}`;
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

// Call Gemini API with Streaming
async function callGeminiAPIWithStreaming(prompt) {
    // Show streaming container
    showStreamingContainer();
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.9,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        })
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Simulate streaming by showing text progressively
    await simulateStreaming(generatedText);
    
    // Extract JSON from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
    }
    
    hideStreamingContainer();
    return JSON.parse(jsonMatch[0]);
}

// Show Streaming Container
function showStreamingContainer() {
    const streamContainer = document.createElement('div');
    streamContainer.id = 'streamContainer';
    streamContainer.className = 'adventure-stream';
    streamContainer.innerHTML = `
        <div class="stream-header">
            <h3>🎯 Generating your adventure...</h3>
        </div>
        <div class="stream-content" id="streamContent">
            <span class="typing-indicator"></span>
        </div>
    `;
    
    // Insert before adventure result
    adventureResult.parentNode.insertBefore(streamContainer, adventureResult);
    streamContainer.scrollIntoView({ behavior: 'smooth' });
}

// Hide Streaming Container
function hideStreamingContainer() {
    const streamContainer = document.getElementById('streamContainer');
    if (streamContainer) {
        streamContainer.remove();
    }
}

// Simulate Streaming Effect
async function simulateStreaming(fullText) {
    const streamContent = document.getElementById('streamContent');
    if (!streamContent) return;
    
    // Extract just the description part for streaming
    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    let textToStream = fullText;
    
    if (jsonMatch) {
        try {
            const parsedJson = JSON.parse(jsonMatch[0]);
            if (parsedJson.description) {
                textToStream = parsedJson.description;
            } else if (parsedJson.adventures && parsedJson.adventures[0] && parsedJson.adventures[0].description) {
                textToStream = parsedJson.adventures[0].description;
            }
        } catch (e) {
            // Use original text if parsing fails
        }
    }
    
    streamContent.innerHTML = '';
    const words = textToStream.split(' ');
    
    for (let i = 0; i < words.length; i++) {
        streamContent.innerHTML += words[i] + ' ';
        streamContent.innerHTML += '<span class="typing-indicator"></span>';
        
        // Scroll to keep the streaming visible
        streamContent.scrollIntoView({ behavior: 'smooth' });
        
        // Random delay between 50-150ms for natural feeling
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        
        // Remove typing indicator
        streamContent.innerHTML = streamContent.innerHTML.replace('<span class="typing-indicator"></span>', '');
    }
}

// Display the generated adventure
function displayAdventure(adventure) {
    const extraDetails = [];
    
    if (adventure.budget) {
        extraDetails.push(`
            <div class="detail-item">
                <span class="emoji">💰</span>
                <div class="label">Budget</div>
                <div class="value">${adventure.budget}</div>
            </div>
        `);
    }
    
    if (adventure.energy) {
        extraDetails.push(`
            <div class="detail-item">
                <span class="emoji">⚡</span>
                <div class="label">Energy</div>
                <div class="value">${adventure.energy}</div>
            </div>
        `);
    }
    
    if (adventure.isGroup && adventure.friends) {
        extraDetails.push(`
            <div class="detail-item">
                <span class="emoji">👥</span>
                <div class="label">Group Size</div>
                <div class="value">${adventure.friends.length + 1} people</div>
            </div>
        `);
    }

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
            ${extraDetails.join('')}
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

// Display Multiple Adventures
function displayMultipleAdventures(adventures) {
    const adventuresHTML = adventures.map((adventure, index) => `
        <div class="adventure-option" data-index="${index}" onclick="selectAdventure(${index})">
            <div class="option-number">${index + 1}</div>
            <div class="adventure-title">${adventure.title}</div>
            <div class="adventure-description">${adventure.description}</div>
            ${adventure.tips ? `
            <div class="adventure-tips">
                <h4>💡 Pro Tips:</h4>
                <ul>
                    ${adventure.tips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
    `).join('');
    
    adventureCard.innerHTML = `
        <div class="multiple-adventures-header">
            <h3>🎲 Pick Your Adventure!</h3>
            <p>Choose the one that speaks to you:</p>
        </div>
        <div class="multiple-adventures">
            ${adventuresHTML}
        </div>
    `;
    
    adventureCard.classList.add('success');
    setTimeout(() => {
        adventureCard.classList.remove('success');
    }, 600);
}

// Select Adventure from Multiple Options
function selectAdventure(index) {
    document.querySelectorAll('.adventure-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    document.querySelector(`[data-index="${index}"]`).classList.add('selected');
    currentAdventure = multipleAdventures[index];
    
    // Show selected adventure after a brief delay
    setTimeout(() => {
        displayAdventure(currentAdventure);
    }, 300);
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
    budgetSelect.value = '';
    energySelect.value = '';
    multipleOptionsCheckbox.checked = false;
    multipleAdventures = [];
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

// Make functions globally available
window.inviteFriend = inviteFriend;
window.selectAdventure = selectAdventure;

// Initialize memory capsule visibility
if (savedMemories.length > 0) {
    // Don't auto-show memory capsule, let tabs handle it
}