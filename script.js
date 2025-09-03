// Eventure - Adventure Discovery Platform
// Configuration
const API_BASE_URL = 'http://localhost:5001';
let currentUser = null;

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
let isAuthenticated = false;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    spinButton.addEventListener('click', generateAdventure);
    newAdventureBtn.addEventListener('click', showAdventureSpinner);
    saveBtn.addEventListener('click', saveAdventure);
    shareBtn.addEventListener('click', shareAdventure);
    
    // Simple form validation
    [locationInput, moodSelect, durationSelect].forEach(element => {
        element.addEventListener('change', function() {
            validateForm();
        });
    });
}

// Generate Adventure using backend API
async function generateAdventure() {
    const location = locationInput.value.trim();
    const mood = moodSelect.value;
    const duration = durationSelect.value;

    if (!location || !mood || !duration) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    // Show loading state
    setLoadingState(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/adventures/discover`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                location,
                mood_filter: mood,
                duration_filter: duration,
                count: 1
            })
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                showAuthModal();
                return;
            }
            throw new Error('Failed to generate adventure');
        }
        
        const data = await response.json();
        currentAdventure = data.adventures[0];
        
        displayAdventure(currentAdventure);
        showAdventureResult();
        
    } catch (error) {
        console.error('Error generating adventure:', error);
        showNotification('Something went wrong. Please try again.', 'error');
    } finally {
        setLoadingState(false);
    }
}

// Authentication functions
async function checkAuthentication() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            isAuthenticated = true;
            locationInput.value = currentUser.location || '';
            showUserInfo();
            loadSavedMemories();
        } else {
            showAuthModal();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showAuthModal();
    }
}

function showUserInfo() {
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    if (currentUser && userInfo && userName) {
        userName.textContent = `Welcome, ${currentUser.name}`;
        userInfo.style.display = 'flex';
    }
}

async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            isAuthenticated = true;
            hideAuthModal();
            showUserInfo();
            locationInput.value = currentUser.location || '';
            loadSavedMemories();
            showNotification('Welcome back!', 'success');
        } else {
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showNotification('Login failed. Please try again.', 'error');
    }
}

async function signup(name, email, password, location) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ name, email, password, location })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            isAuthenticated = true;
            hideAuthModal();
            showUserInfo();
            locationInput.value = currentUser.location || '';
            showNotification('Account created successfully!', 'success');
        } else {
            showNotification(data.error || 'Signup failed', 'error');
        }
    } catch (error) {
        showNotification('Signup failed. Please try again.', 'error');
    }
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

// Show authentication modal
function showAuthModal() {
    if (document.getElementById('authModal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-content">
            <h3>Welcome to Eventure</h3>
            <div class="auth-tabs">
                <button class="auth-tab active" data-tab="login">Sign In</button>
                <button class="auth-tab" data-tab="signup">Sign Up</button>
            </div>
            
            <form class="auth-form" id="loginForm">
                <input type="email" placeholder="Email" required id="loginEmail">
                <input type="password" placeholder="Password" required id="loginPassword">
                <button type="submit">Sign In</button>
            </form>
            
            <form class="auth-form" id="signupForm" style="display: none;">
                <input type="text" placeholder="Full Name" required id="signupName">
                <input type="email" placeholder="Email" required id="signupEmail">
                <input type="password" placeholder="Password" required id="signupPassword">
                <input type="text" placeholder="Location" required id="signupLocation">
                <button type="submit">Sign Up</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    const tabs = modal.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            modal.querySelector('#loginForm').style.display = targetTab === 'login' ? 'flex' : 'none';
            modal.querySelector('#signupForm').style.display = targetTab === 'signup' ? 'flex' : 'none';
        });
    });
    
    modal.querySelector('#loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = modal.querySelector('#loginEmail').value;
        const password = modal.querySelector('#loginPassword').value;
        login(email, password);
    });
    
    modal.querySelector('#signupForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = modal.querySelector('#signupName').value;
        const email = modal.querySelector('#signupEmail').value;
        const password = modal.querySelector('#signupPassword').value;
        const location = modal.querySelector('#signupLocation').value;
        signup(name, email, password, location);
    });
}

function hideAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.remove();
    }
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
                <div class="label">Category</div>
                <div class="value">${adventure.mood}</div>
            </div>
            ${adventure.cost ? `
            <div class="detail-item">
                <span class="emoji">💰</span>
                <div class="label">Cost</div>
                <div class="value">${adventure.cost}</div>
            </div>
            ` : ''}
        </div>
        ${adventure.tips ? `
        <div class="adventure-tips">
            <h4>Tips:</h4>
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
        spinButton.querySelector('.button-text').textContent = 'Finding adventures...';
        adventureSpinner.classList.add('loading');
    } else {
        spinButton.disabled = false;
        spinner.style.display = 'none';
        spinButton.querySelector('.button-text').textContent = 'Discover Adventures';
        adventureSpinner.classList.remove('loading');
    }
}

// Save adventure to backend
async function saveAdventure() {
    if (!currentAdventure) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/adventures/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                adventure_id: currentAdventure.id
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save adventure');
        }
        
        showNotification('Adventure saved successfully!', 'success');
        loadSavedMemories();
        
    } catch (error) {
        console.error('Error saving adventure:', error);
        showNotification('Failed to save adventure', 'error');
    }
}

// Share adventure
function shareAdventure() {
    if (!currentAdventure) return;
    
    const shareText = `Check out this adventure I found:\n\n${currentAdventure.title}\n\n${currentAdventure.description}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Adventure Discovery',
            text: shareText
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('Adventure copied to clipboard', 'success');
        }).catch(() => {
            showNotification('Failed to copy to clipboard', 'error');
        });
    }
}

// Load saved memories from backend
async function loadSavedMemories() {
    if (!isAuthenticated) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/adventures/memories`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load memories');
        }
        
        const data = await response.json();
        const memories = data.memories || [];
        
        if (memories.length === 0) {
            memoriesGrid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1 / -1;">No saved adventures yet. Discover some new experiences!</p>';
            memoryCapsule.style.display = 'none';
            return;
        }
        
        memoriesGrid.innerHTML = memories.map(memory => `
            <div class="memory-item">
                <div class="memory-date">${formatDate(memory.saved_at)}</div>
                <div class="memory-title">${memory.title}</div>
                <div class="memory-description">${memory.description}</div>
            </div>
        `).join('');
        
        memoryCapsule.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading memories:', error);
        memoryCapsule.style.display = 'none';
    }
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
        background: type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: '1000',
        fontSize: '14px',
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
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Minimal interactions
document.addEventListener('DOMContentLoaded', function() {
    // Simple click feedback for buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            this.style.opacity = '0.8';
            setTimeout(() => {
                this.style.opacity = '1';
            }, 100);
        });
    });
});

// Basic keyboard support
document.addEventListener('keydown', function(e) {
    // Enter to generate adventure when focused on form
    if (e.key === 'Enter' && document.activeElement && 
        (document.activeElement.id === 'location' || 
         document.activeElement.id === 'mood' || 
         document.activeElement.id === 'duration')) {
        generateAdventure();
    }
});

// Logout functionality
async function logout() {
    try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        
        currentUser = null;
        isAuthenticated = false;
        document.getElementById('userInfo').style.display = 'none';
        document.getElementById('memoryCapsule').style.display = 'none';
        showAuthModal();
        
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// Form validation
function validateForm() {
    const hasLocation = locationInput.value.trim().length > 0;
    const hasMood = moodSelect.value !== '';
    const hasDuration = durationSelect.value !== '';
    
    spinButton.disabled = !(hasLocation && hasMood && hasDuration);
}