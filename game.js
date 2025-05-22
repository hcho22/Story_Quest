// Game state
let gameState = {
    points: 0,
    challenges: 0,
    words: 0,
    story: '',
    currentChallenge: null,
    completedChallenges: [],
    gradeLevel: 'K-2',
    isUserTurn: false,
    sentenceCount: 0,
    maxSentences: 5,
    timer: null,
    timeLeft: 120, // 2 minutes in seconds for user turn
    gameStarted: false
};

// Story challenges by grade level
const STORY_CHALLENGES = {
    "K-2": [
        "Include a friendly animal character 🐰",
        "Describe how something feels or smells 👃",
        "Use a color in your story 🎨",
        "Make a character feel happy or sad 😊",
        "Add a magical object ✨",
        "Describe the weather ☀️",
        "Add a funny moment 😄",
        "Include a family member 👨‍👩‍👧‍👦",
        "Describe what someone is wearing 👕",
        "Add a favorite food 🍕"
    ],
    "3-5": [
        "Create a unexpected plot twist 🔄",
        "Use dialogue between characters 💭",
        "Describe the setting using three senses 🌟",
        "Include a problem and solution 🎯",
        "Add weather to set the mood 🌤️",
        "Create a mysterious situation 🔍",
        "Include a flashback memory 🕰️",
        "Add a surprising discovery 💡",
        "Describe a character's feelings 💕",
        "Include a lesson learned 📚"
    ],
    "6-8": [
        "Develop a character's inner thoughts 🤔",
        "Create conflict between characters 🤝",
        "Use metaphor or simile 📝",
        "Include foreshadowing 🔮",
        "Show character growth 🌱",
        "Add a plot complication 🌀",
        "Include symbolic meaning 🎭",
        "Create suspense 😰",
        "Show don't tell a feeling 💫",
        "Add a surprising revelation 💥"
    ],
    "9-12": [
        "Develop complex character motivations 🎭",
        "Create parallel storylines 🔀",
        "Use sophisticated literary devices 📚",
        "Build suspense or tension 😰",
        "Include social commentary 🌍",
        "Explore a theme deeply 🎯",
        "Add moral ambiguity 🤔",
        "Include dramatic irony 🎭",
        "Create a unique narrative voice 🗣️",
        "Add philosophical elements 💭"
    ]
};

// Canvas setup
let canvas, ctx;
let particles = [];

// Supabase client
let supabase = null;

// Add voice recognition setup
let recognition = null;
let isListening = false;

function initCanvas() {
    canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = 100;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '-1';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
}

// Animation function for particles
function animateParticles() {
    ctx.fillStyle = 'rgba(240, 240, 240, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].display(ctx);
        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }
    
    requestAnimationFrame(animateParticles);
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = Math.random() * 4 - 2; // Random value between -2 and 2
        this.vy = Math.random() * 4 - 2; // Random value between -2 and 2
        this.alpha = 255;
        this.color = {
            r: Math.floor(Math.random() * 155) + 100, // Random value between 100 and 255
            g: Math.floor(Math.random() * 155) + 100,
            b: Math.floor(Math.random() * 155) + 100
        };
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 5;
    }

    display(ctx) {
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha / 255})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    isDead() {
        return this.alpha <= 0;
    }
}

// Timer functions
function startTimer() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
    gameState.timeLeft = 120; // Reset to 2 minutes
    updateTimerDisplay();
    
    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        updateTimerDisplay();
        
        if (gameState.timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    if (!timerElement) {
        console.error('Timer element not found');
        return;
    }
    const minutes = Math.floor(gameState.timeLeft / 60);
    const seconds = gameState.timeLeft % 60;
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateTurnIndicator() {
    const turnIndicator = document.getElementById('turn-indicator');
    if (!turnIndicator) {
        console.error('Turn indicator element not found');
        return;
    }
    if (!gameState.gameStarted) {
        turnIndicator.textContent = 'Waiting to start...';
        turnIndicator.className = 'turn-indicator';
    } else if (gameState.isUserTurn) {
        turnIndicator.textContent = '✍️ Your turn!';
        turnIndicator.className = 'turn-indicator user-turn';
    } else {
        turnIndicator.textContent = '🤖 AI is thinking...';
        turnIndicator.className = 'turn-indicator ai-turn';
    }
}

function updateSentenceCount() {
    const sentencesElement = document.getElementById('sentences');
    if (!sentencesElement) {
        console.error('Sentences element not found');
        return;
    }
    // Divide by 2 since we count both user and AI turns
    const userSentences = Math.ceil(gameState.sentenceCount / 2);
    sentencesElement.textContent = `${userSentences}/${gameState.maxSentences}`;
}

// Function to initialize Supabase
async function initializeSupabase() {
    try {
        // Wait for config to load
        let attempts = 0;
        while ((!SUPABASE_URL || !SUPABASE_ANON_KEY) && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn('Supabase credentials not found. Score saving will be disabled.');
            return null;
        }
        return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (error) {
        console.error('Error initializing Supabase:', error);
        return null;
    }
}

async function endGame() {
    clearInterval(gameState.timer);
    gameState.gameStarted = false;
    
    // Create and show the score modal
    const scoreModal = document.createElement('div');
    scoreModal.className = 'score-modal';
    scoreModal.innerHTML = `
        <div class="score-content">
            <h2>Story Complete! 🎉</h2>
            <div class="score-details">
                <p>Final Score: ${gameState.points} points</p>
                <p>Words Written: ${gameState.words}</p>
                <p>Challenges Completed: ${gameState.completedChallenges.length}/3</p>
            </div>
            <div class="score-actions">
                ${supabase ? '<button id="save-score">Save Score</button>' : ''}
                <button id="new-game">New Game</button>
            </div>
        </div>
    `;
    document.body.appendChild(scoreModal);

    // Add event listeners for the score modal buttons
    if (supabase) {
        document.getElementById('save-score').addEventListener('click', async () => {
            try {
                const { data, error } = await supabase
                    .from('scores')
                    .insert([
                        {
                            points: gameState.points,
                            words: gameState.words,
                            challenges_completed: gameState.completedChallenges.length,
                            grade_level: gameState.gradeLevel,
                            story: gameState.story
                        }
                    ]);

                if (error) throw error;

                alert('Score saved successfully! 🎉');
                document.getElementById('save-score').disabled = true;
            } catch (error) {
                console.error('Error saving score:', error);
                alert('Failed to save score. Please try again.');
            }
        });
    }

    document.getElementById('new-game').addEventListener('click', () => {
        scoreModal.remove();
        startGame();
    });

    // Disable input
    document.getElementById('story-input').disabled = true;
    document.getElementById('submit-story').disabled = true;
    updateTurnIndicator();
}

// Add CSS for the score modal
const style = document.createElement('style');
style.textContent = `
    .score-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .score-content {
        background-color: white;
        padding: 2rem;
        border-radius: 10px;
        text-align: center;
        max-width: 500px;
        width: 90%;
    }

    .score-details {
        margin: 1.5rem 0;
        font-size: 1.2rem;
    }

    .score-details p {
        margin: 0.5rem 0;
    }

    .score-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }

    .score-actions button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.3s;
    }

    #save-score {
        background-color: #4CAF50;
        color: white;
    }

    #save-score:hover {
        background-color: #45a049;
    }

    #new-game {
        background-color: #2196F3;
        color: white;
    }

    #new-game:hover {
        background-color: #1976D2;
    }

    #save-score:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style);

// Game functions
async function startGame() {
    if (gameState.gameStarted) return;
    
    gameState.gameStarted = true;
    gameState.sentenceCount = 0;
    gameState.story = '';
    gameState.completedChallenges = [];
    gameState.points = 0;
    gameState.words = 0;
    
    // Clear story display
    const storyDisplay = document.getElementById('story-display');
    if (storyDisplay) {
        storyDisplay.innerHTML = '';
    }
    
    // Enable input
    document.getElementById('story-input').disabled = false;
    document.getElementById('submit-story').disabled = false;
    document.getElementById('voice-input').disabled = false;
    
    // Get initial challenge
    const challenges = STORY_CHALLENGES[gameState.gradeLevel];
    if (challenges && challenges.length > 0) {
        gameState.currentChallenge = challenges[Math.floor(Math.random() * challenges.length)];
        updateChallengeDisplay();
    }
    
    // Start timer
    startTimer();
    
    // Update UI
    updateSentenceCount();
    updateTurnIndicator();
    updateStats();
    
    // Get AI to start the story
    await getAIResponse();
}

async function getAIResponse() {
    try {
        gameState.isUserTurn = false;
        updateTurnIndicator();
        
        // Clear the timer while AI is thinking
        if (gameState.timer) {
            clearInterval(gameState.timer);
        }
        
        // Stop voice recognition if it's active
        stopListening();
        
        // Make sure gradeLevel is set
        if (!gameState.gradeLevel) {
            gameState.gradeLevel = 'K-2'; // Default to K-2 if not set
        }
        
        console.log('Sending request with:', {
            gradeLevel: gameState.gradeLevel,
            storySoFar: gameState.story,
            challenge: gameState.currentChallenge
        });
        
        // Determine if this is the start of the story or a continuation
        const isStart = gameState.sentenceCount === 0;
        const endpoint = isStart ? '/api/start-story' : '/api/continue-story';
        
        // First test if the server is reachable
        try {
            const testResponse = await fetch(`http://localhost:5002${endpoint}`, {
                method: 'OPTIONS'
            });
            console.log('Server connection test:', testResponse.status);
        } catch (testError) {
            console.error('Server connection test failed:', testError);
            throw new Error('Cannot connect to the story server. Please make sure the server is running on port 5002.');
        }
        
        const response = await fetch(`http://localhost:5002${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                gradeLevel: gameState.gradeLevel,
                storySoFar: gameState.story || '', // Ensure storySoFar is never undefined
                challenge: gameState.currentChallenge // Include the current challenge
            })
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Server error response:', errorData);
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        addToStory(data.story, true);
        gameState.sentenceCount++;
        updateSentenceCount();
        
        // Check if we've reached the maximum sentences
        if (gameState.sentenceCount >= gameState.maxSentences * 2) { // Multiply by 2 since we count both user and AI turns
            endGame();
            return;
        }
        
        // Switch back to user's turn
        gameState.isUserTurn = true;
        updateTurnIndicator();
        
        // Re-enable input and submit button
        const input = document.getElementById('story-input');
        const submitButton = document.getElementById('submit-story');
        const voiceButton = document.getElementById('voice-input');
        input.disabled = false;
        submitButton.disabled = false;
        voiceButton.disabled = false;
        
        // Start the timer for user's turn
        startTimer();
    } catch (error) {
        console.error('Error getting AI response:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        alert('Error getting AI response: ' + error.message);
        
        // Re-enable input and submit button on error
        const input = document.getElementById('story-input');
        const submitButton = document.getElementById('submit-story');
        input.disabled = false;
        submitButton.disabled = false;
        
        gameState.isUserTurn = true;
        updateTurnIndicator();
        
        // Start the timer for user's turn even if there was an error
        startTimer();
        
        // Re-enable voice input on error
        document.getElementById('voice-input').disabled = false;
    }
}

function getNewChallenge() {
    const challenges = STORY_CHALLENGES[gameState.gradeLevel];
    const availableChallenges = challenges.filter(c => !gameState.completedChallenges.includes(c));
    if (availableChallenges.length > 0) {
        gameState.currentChallenge = availableChallenges[Math.floor(Math.random() * availableChallenges.length)];
        updateChallengeDisplay();
    }
}

function updateChallengeDisplay() {
    const challengeElement = document.getElementById('challenge');
    if (!challengeElement) {
        console.error('Challenge element not found');
        return;
    }
    
    // Create challenge display with completed challenges
    let challengeHTML = `
        <div class="challenge-container">
            <div class="current-challenge">
                <h3>Current Challenge:</h3>
                <p>${gameState.currentChallenge}</p>
            </div>
            <div class="completed-challenges">
                <h3>Completed Challenges:</h3>
                <ul>
                    ${gameState.completedChallenges.map(challenge => `<li>${challenge}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
    
    challengeElement.innerHTML = challengeHTML;
}

function updateStats() {
    const pointsElement = document.getElementById('points');
    const challengesElement = document.getElementById('challenges');
    const wordsElement = document.getElementById('words');
    
    if (pointsElement) pointsElement.textContent = gameState.points;
    if (challengesElement) challengesElement.textContent = `${gameState.completedChallenges.length}/3`;
    if (wordsElement) wordsElement.textContent = gameState.words;
}

function addToStory(text, isAI = false) {
    const storyDisplay = document.getElementById('story-display');
    if (!storyDisplay) {
        console.error('Story display element not found');
        return;
    }
    const prefix = isAI ? '🤖 AI: ' : '✍️ You: ';
    const newParagraph = document.createElement('p');
    newParagraph.textContent = prefix + text;
    storyDisplay.appendChild(newParagraph);
    gameState.story += text + '\n';
    gameState.words = gameState.story.split(/\s+/).length;
    updateStats();
}

function validateChallenge(text) {
    if (!gameState.currentChallenge) return false;
    
    // Check if the challenge is already completed
    if (gameState.completedChallenges.includes(gameState.currentChallenge)) {
        return false;
    }
    
    // Validate the current challenge
    const challenge = gameState.currentChallenge.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Check for challenge completion based on the challenge type
    if (challenge.includes('animal') && /(rabbit|bunny|hare|animal|creature)/i.test(textLower)) {
        return true;
    } else if (challenge.includes('feel') && /(feel|touch|soft|rough|smooth|warm|cold)/i.test(textLower)) {
        return true;
    } else if (challenge.includes('smell') && /(smell|scent|aroma|fragrant|stinky)/i.test(textLower)) {
        return true;
    } else if (challenge.includes('color') && /(red|blue|green|yellow|purple|orange|pink|brown|black|white)/i.test(textLower)) {
        return true;
    } else if (challenge.includes('happy') && /(happy|joy|smile|laugh|cheerful)/i.test(textLower)) {
        return true;
    } else if (challenge.includes('sad') && /(sad|upset|cry|tear|unhappy)/i.test(textLower)) {
        return true;
    } else if (challenge.includes('magical') && /(magic|magical|spell|enchant|wonder)/i.test(textLower)) {
        return true;
    } else if (challenge.includes('weather') && /(sunny|rainy|cloudy|windy|stormy|snowy)/i.test(textLower)) {
        return true;
    } else if (challenge.includes('funny') && /(funny|laugh|joke|silly|humorous)/i.test(textLower)) {
        return true;
    } else if (challenge.includes('family') && /(mom|dad|mother|father|sister|brother|family)/i.test(textLower)) {
        return true;
    } else if (challenge.includes('wearing') && /(wear|clothes|shirt|pants|dress|hat)/i.test(textLower)) {
        return true;
    } else if (challenge.includes('food') && /(food|eat|delicious|tasty|yummy)/i.test(textLower)) {
        return true;
    }
    
    return false;
}

function awardPoints(text) {
    // Award points for completing the current challenge
    if (validateChallenge(text)) {
        gameState.points += 10;
        gameState.completedChallenges.push(gameState.currentChallenge);
        updateChallengeDisplay();
        updateStats();
        
        // Show challenge completion message
        const storyElement = document.getElementById('story');
        const completionMessage = document.createElement('div');
        completionMessage.className = 'challenge-completion';
        completionMessage.textContent = `🎉 Challenge Completed: ${gameState.currentChallenge}`;
        storyElement.appendChild(completionMessage);
        
        // Award bonus points for word count
        const wordCount = text.trim().split(/\s+/).length;
        if (wordCount >= getMinWordCount(gameState.gradeLevel)) {
            gameState.points += 5;
            gameState.words += wordCount;
            updateStats();
        }
    }
}

// Helper function to get minimum word count based on grade level
function getMinWordCount(gradeLevel) {
    const minWords = {
        "K-2": 20,
        "3-5": 30,
        "6-8": 40,
        "9-12": 50
    };
    return minWords[gradeLevel] || 20;
}

// Voice recognition setup
function setupVoiceRecognition() {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            document.getElementById('story-input').value = text;
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            isListening = false;
            updateVoiceButton();
        };

        recognition.onend = () => {
            isListening = false;
            updateVoiceButton();
        };
    } else {
        console.warn('Speech recognition not supported in this browser');
        document.getElementById('voice-input').style.display = 'none';
    }
}

function startListening() {
    if (!recognition) return;
    
    try {
        recognition.start();
        isListening = true;
        updateVoiceButton();
    } catch (error) {
        console.error('Error starting voice recognition:', error);
    }
}

function stopListening() {
    if (!recognition) return;
    
    try {
        recognition.stop();
        isListening = false;
        updateVoiceButton();
    } catch (error) {
        console.error('Error stopping voice recognition:', error);
    }
}

function updateVoiceButton() {
    const voiceButton = document.getElementById('voice-input');
    if (!voiceButton) return;
    
    if (isListening) {
        voiceButton.textContent = '🎤 Stop Listening';
        voiceButton.classList.add('listening');
    } else {
        voiceButton.textContent = '🎤 Start Voice Input';
        voiceButton.classList.remove('listening');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Supabase client
    supabase = await initializeSupabase();
    
    // Set initial timer display
    gameState.timeLeft = 120; // 2 minutes in seconds
    updateTimerDisplay();
    
    initCanvas();
    animateParticles();
    
    // Grade level change
    document.getElementById('grade-level').addEventListener('change', (e) => {
        gameState.gradeLevel = e.target.value;
    });
    
    // Start game button
    document.getElementById('start-game').addEventListener('click', startGame);
    
    // Setup voice recognition
    setupVoiceRecognition();
    
    // Add voice input button event listener
    document.getElementById('voice-input').addEventListener('click', () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    });
    
    // Add keyboard shortcut for voice input (Alt+V)
    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key === 'v' && gameState.isUserTurn) {
            e.preventDefault();
            if (isListening) {
                stopListening();
            } else {
                startListening();
            }
        }
    });
    
    // Submit story button
    document.getElementById('submit-story').addEventListener('click', async () => {
        const input = document.getElementById('story-input');
        const submitButton = document.getElementById('submit-story');
        const text = input.value.trim();
        
        if (!text) {
            alert('Please enter your sentence to continue the story.');
            return;
        }
        
        if (!gameState.isUserTurn) {
            alert('Please wait for your turn!');
            return;
        }
        
        try {
            // Disable input while processing
            input.disabled = true;
            submitButton.disabled = true;
            
            // Clear the timer when submitting
            if (gameState.timer) {
                clearInterval(gameState.timer);
            }
            
            // Add user's story and award points
            addToStory(text);
            awardPoints(text);
            input.value = '';
            
            // Update game state
            gameState.sentenceCount++;
            updateSentenceCount();
            
            // Check if we've reached the maximum sentences
            if (gameState.sentenceCount >= gameState.maxSentences * 2) { // Multiply by 2 since we count both user and AI turns
                endGame();
                return;
            }
            
            // Switch turns
            gameState.isUserTurn = false;
            updateTurnIndicator();
            
            // Wait for AI response
            await getAIResponse();
        } catch (error) {
            console.error('Error in submit handler:', error);
            // Re-enable input if there's an error
            input.disabled = false;
            submitButton.disabled = false;
            gameState.isUserTurn = true;
            updateTurnIndicator();
            
            // Restart the timer if there's an error
            startTimer();
        }
    });
}); 