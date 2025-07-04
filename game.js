// Game state
let gameState = {
    points: 0,
    challenges: 0,
    words: 0,
    story: '',
    storyLines: [],
    currentChallenge: null,
    completedChallenges: [],
    gradeLevel: 'K-2',
    isUserTurn: false,
    sentenceCount: 0,
    maxSentences: 5,
    timer: null,
    timeLeft: 120, // 2 minutes in seconds for user turn
    gameStarted: false,
    userWords: 0,
    userProfile: null,
    xp: 0,
    userSentenceCount: 0 // NEW: track only user turns
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
        "Add a favorite food 🍕",
        "Include a talking tree 🌳",
        "Describe a sound you hear in the story 👂",
        "Make a character go on a treasure hunt 🗺️",
        "Add a helpful insect 🐞",
        "Describe a place using three colors 🎨",
        "Make a character find a secret door 🚪",
        "Include a lost toy 🧸",
        "Describe a character's dream 💭",
        "Add a silly dance move 💃",
        "Make a character help a friend 🤝"
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
        "Include a lesson learned 📚",
        "Make a character invent something new 🛠️",
        "Describe a festival or celebration 🎉",
        "Include a riddle or puzzle 🧩",
        "Make a character overcome a fear 😱",
        "Describe a journey through a forest 🌲",
        "Add a magical animal 🦄",
        "Include a secret message 📝",
        "Describe a character's favorite place 🏞️",
        "Make a character meet someone new 👋",
        "Include a time when someone gets lost 🧭"
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
        "Add a surprising revelation 💥",
        "Describe a character's secret ambition 🎯",
        "Include a scene at night 🌙",
        "Make a character face a tough decision ⚖️",
        "Describe a festival or public event 🎪",
        "Add a mysterious stranger 🕵️",
        "Include a letter or diary entry 📖",
        "Describe a place using all five senses 👀👂👃👅🤚",
        "Make a character break a rule 🚫",
        "Include a moment of teamwork 🤝",
        "Describe a character's biggest mistake ❌"
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
        "Add philosophical elements 💭",
        "Describe a character's internal conflict 🧠",
        "Include a flashback that changes the story 🕰️",
        "Make a character question their beliefs ❓",
        "Describe a setting in vivid detail 🌆",
        "Add a betrayal between characters 🗡️",
        "Include a symbol that recurs throughout the story 🔁",
        "Make a character face a moral dilemma ⚖️",
        "Describe a moment of epiphany 💡",
        "Include a scene with unreliable narration 🤥",
        "Make a character confront their past 👤"
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

// Grade-level vocabulary words for scoring
const GRADE_VOCABULARY = {
    "K-2": {
        basic: ["the", "and", "a", "to", "in", "is", "you", "that", "it", "he", "was", "for", "on", "are", "as", "with", "his", "they", "at", "be", "this", "have", "from", "or", "one", "had", "by", "word", "but", "not", "what", "all", "were", "we", "when", "your", "can", "said", "there", "use", "an", "each", "which", "she", "do", "how", "their", "if", "will", "up", "other", "about", "out", "many", "then", "them", "these", "so", "some", "her", "would", "make", "like", "into", "him", "time", "two", "more", "go", "no", "way", "could", "my", "than", "first", "been", "call", "who", "its", "now", "find", "long", "down", "day", "did", "get", "come", "made", "may", "part"],
        advanced: ["beautiful", "wonderful", "amazing", "exciting", "friendly", "happy", "sad", "big", "small", "fast", "slow", "loud", "quiet", "bright", "dark", "warm", "cold", "soft", "hard", "sweet", "funny", "scary", "magical", "special", "colorful", "shiny", "sparkly", "bouncy", "fuzzy", "smooth"]
    },
    "3-5": {
        basic: ["because", "through", "before", "after", "during", "while", "until", "since", "although", "however", "therefore", "meanwhile", "finally", "suddenly", "quickly", "slowly", "carefully", "easily", "happily", "sadly", "angrily", "quietly", "loudly", "brightly", "darkly", "warmly", "coldly", "softly", "hardly", "sweetly", "funnily"],
        advanced: ["adventure", "journey", "discovery", "mystery", "treasure", "castle", "dragon", "wizard", "princess", "knight", "forest", "mountain", "ocean", "river", "island", "cave", "bridge", "tower", "garden", "palace", "kingdom", "magic", "spell", "enchantment", "curiosity", "bravery", "wisdom", "kindness", "courage", "strength"]
    },
    "6-8": {
        basic: ["consequently", "furthermore", "moreover", "nevertheless", "nonetheless", "otherwise", "similarly", "likewise", "conversely", "additionally", "specifically", "particularly", "especially", "generally", "usually", "frequently", "occasionally", "rarely", "seldom", "never", "always", "sometimes", "often", "constantly", "continuously", "gradually", "rapidly", "immediately", "instantly", "eventually", "ultimately"],
        advanced: ["enigmatic", "mysterious", "puzzling", "perplexing", "bewildering", "confusing", "complicated", "complex", "sophisticated", "elaborate", "detailed", "thorough", "comprehensive", "extensive", "vast", "immense", "enormous", "gigantic", "colossal", "tremendous", "magnificent", "spectacular", "extraordinary", "remarkable", "exceptional", "outstanding", "brilliant", "genius", "masterful", "skilled", "talented"]
    },
    "9-12": {
        basic: ["notwithstanding", "consequently", "furthermore", "moreover", "nevertheless", "nonetheless", "otherwise", "similarly", "likewise", "conversely", "additionally", "specifically", "particularly", "especially", "generally", "usually", "frequently", "occasionally", "rarely", "seldom", "never", "always", "sometimes", "often", "constantly", "continuously", "gradually", "rapidly", "immediately", "instantly", "eventually"],
        advanced: ["philosophical", "metaphysical", "theoretical", "hypothetical", "analytical", "logical", "rational", "systematic", "methodical", "strategic", "tactical", "diplomatic", "political", "economic", "social", "cultural", "historical", "scientific", "technological", "environmental", "psychological", "sociological", "anthropological", "archaeological", "geological", "astronomical", "biological", "chemical", "physical", "mathematical"]
    }
};

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
    const timerInline = document.getElementById('timer-inline');
    if (!timerElement && !timerInline) {
        console.error('Timer element not found');
        return;
    }
    const minutes = Math.floor(gameState.timeLeft / 60);
    const seconds = gameState.timeLeft % 60;
    const timerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    if (timerElement) timerElement.textContent = timerText;
    if (timerInline) timerInline.textContent = timerText;
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
    // Use only userSentenceCount
    const userSentences = gameState.userSentenceCount;
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

        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Check if scores table exists and has required columns
        const { data: tableExists, error: tableError } = await supabase
            .from('scores')
            .select('id, points, words, challenges_completed, grade_level, story, completed_challenges, player_email')
            .limit(1);

        if (tableError) {
            console.error('Error checking scores table:', tableError);
            if (tableError.code === '42P01') { // Table doesn't exist
                console.warn('Scores table does not exist. Please create it in your Supabase dashboard with the following structure:');
                console.warn(`
                    CREATE TABLE scores (
                        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                        points INTEGER NOT NULL,
                        words INTEGER NOT NULL,
                        challenges_completed INTEGER NOT NULL,
                        grade_level TEXT NOT NULL,
                        story TEXT NOT NULL,
                        completed_challenges TEXT[] NOT NULL,
                        player_email TEXT NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
                    );

                    -- Enable RLS
                    ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

                    -- Create policy to allow inserts
                    CREATE POLICY "Allow inserts for all users" ON scores
                        FOR INSERT
                        TO authenticated, anon
                        WITH CHECK (true);

                    -- Create policy to allow reads
                    CREATE POLICY "Allow reads for all users" ON scores
                        FOR SELECT
                        TO authenticated, anon
                        USING (true);
                `);
            } else if (tableError.code === 'PGRST204') { // Column doesn't exist
                console.warn('The scores table is missing required columns. Please run this SQL in your Supabase dashboard:');
                console.warn(`
                    -- Add player_email column to scores table
                    ALTER TABLE scores ADD COLUMN player_email TEXT NOT NULL;

                    -- Add index for faster email lookups
                    CREATE INDEX idx_scores_player_email ON scores(player_email);
                `);
            }
            return null;
        }

        return supabase;
    } catch (error) {
        console.error('Error initializing Supabase:', error);
        return null;
    }
}

async function endGame() {
    clearInterval(gameState.timer);
    gameState.gameStarted = false;
    
    // --- Streak Logic ---
    await updateUserStreak();

    // Calculate final stats
    const finalScore = gameState.points;
    const completedChallenges = gameState.completedChallenges.length;
    const totalWords = gameState.userWords; // Only user words
    console.log('Words Written at endGame:', totalWords); // Debug log
    
    console.log('Game ended with stats:', {
        finalScore,
        completedChallenges,
        totalWords,
        challenges: gameState.completedChallenges
    });
    
    // Create and show the score modal
    const scoreModal = document.createElement('div');
    scoreModal.className = 'score-modal';
    scoreModal.innerHTML = `
        <div class="score-content">
            <h2>Story Complete! 🎉</h2>
            <div class="score-details">
                <p>Final Score: ${finalScore} points</p>
                <p>Words Written: ${totalWords}</p>
                <p>Challenges Completed: ${completedChallenges}/3</p>
                <div class="completed-challenges">
                    <h3>Completed Challenges:</h3>
                    ${gameState.completedChallenges.length > 0 
                        ? `<ul>${gameState.completedChallenges.map(challenge => `<li>${challenge}</li>`).join('')}</ul>`
                        : '<p>No challenges completed</p>'}
                </div>
                <div id="generated-image-container" style="display: none; margin: 20px 0;">
                    <h3>🎨 Your Story as an Image</h3>
                    <img id="generated-image" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
                    <button id="download-image" class="button" style="margin-top: 10px;">📥 Download Image</button>
                </div>
                ${supabase ? `
                    <div class="email-input">
                        <label for="player-email">Enter your email to save your score:</label>
                        <input type="email" id="player-email" placeholder="your.email@example.com" required>
                        <small>We'll only use this to track high scores!</small>
                    </div>
                    <div class="user-id-input">
                        <label for="player-id">Create your player ID:</label>
                        <input type="text" id="player-id" placeholder="Enter a unique ID (3-15 characters)" 
                               pattern="[a-zA-Z0-9_-]{3,15}" 
                               title="3-15 characters, letters, numbers, underscore, or hyphen"
                               required>
                        <small>This will be displayed on the high scores list!</small>
                    </div>
                ` : ''}
            </div>
            <div class="score-actions">
                ${supabase ? '<button id="save-score">Save Score</button>' : ''}
                <button id="new-game">New Game</button>
                <button id="generate-image">🎨 Generate Story Image</button>
                <button id="download-story">Download Story</button>
                <button id="view-scores">View High Scores</button>
                <button id="close-score-modal">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(scoreModal);

    // Generate image button logic
    document.getElementById('generate-image').addEventListener('click', async () => {
        // Prevent image generation if story is empty
        if (!gameState.story || gameState.story.trim() === '') {
            alert('No story available to generate an image. Please finish the game first!');
            return;
        }
        const generateButton = document.getElementById('generate-image');
        const imageContainer = document.getElementById('generated-image-container');
        const generatedImage = document.getElementById('generated-image');
        
        generateButton.disabled = true;
        generateButton.textContent = '🎨 Generating Image...';
        
        try {
            // Prepare the story text for image generation
            const storyText = gameState.story;
            
            // Call the Flask backend to generate image
            const response = await fetch('http://localhost:5002/api/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    story: storyText
                })
            });
            
            const data = await response.json();
            
            if (data.success && data.image_url) {
                // Display the generated image
                generatedImage.src = data.image_url;
                imageContainer.style.display = 'block';
                
                generateButton.textContent = '🎨 Image Generated!';
                generateButton.style.backgroundColor = '#45a049';
                
                // Add download functionality for the image
                document.getElementById('download-image').addEventListener('click', () => {
                    window.open(data.image_url, '_blank');
                });
                
            } else {
                throw new Error(data.error || 'Failed to generate image');
            }
            
        } catch (error) {
            console.error('Error generating image:', error);
            generateButton.textContent = '🎨 Generate Story Image';
            generateButton.style.backgroundColor = '#f44336';
            alert('Failed to generate image. Please try again later.');
            
            // Reset button after a delay
            setTimeout(() => {
                generateButton.disabled = false;
                generateButton.textContent = '🎨 Generate Story Image';
                generateButton.style.backgroundColor = '#4CAF50';
            }, 3000);
        }
    });

    // Download story button logic
    document.getElementById('download-story').addEventListener('click', () => {
        // Format story with author labels
        const lines = gameState.storyLines.map(line => `${line.author}: ${line.text}`);
        const storyText = lines.join('\n');
        const blob = new Blob([storyText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my_story.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Add event listeners for the score modal buttons
    if (supabase) {
        document.getElementById('save-score').addEventListener('click', async () => {
            const saveButton = document.getElementById('save-score');
            const emailInput = document.getElementById('player-email');
            const playerIdInput = document.getElementById('player-id');
            const email = emailInput.value.trim();
            const playerId = playerIdInput.value.trim();
            
            // Validate email
            if (!email) {
                alert('Please enter your email address to save your score.');
                return;
            }
            
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                alert('Please enter a valid email address.');
                return;
            }

            // Validate player ID
            if (!playerId) {
                alert('Please create a player ID.');
                return;
            }

            if (!/^[a-zA-Z0-9_-]{3,15}$/.test(playerId)) {
                alert('Player ID must be 3-15 characters long and can only contain letters, numbers, underscore, or hyphen.');
                return;
            }
            
            saveButton.disabled = true;
            saveButton.textContent = 'Saving...';
            
            try {
                const { data, error } = await supabase
                    .from('scores')
                    .insert([
                        {
                            points: finalScore,
                            words: totalWords,
                            challenges_completed: completedChallenges,
                            grade_level: gameState.gradeLevel,
                            story: gameState.story,
                            completed_challenges: gameState.completedChallenges,
                            player_email: email,
                            player_id: playerId,
                            xp: finalScore
                        }
                    ])
                    .select();

                if (error) {
                    if (error.code === 'PGRST204') {
                        alert('The database needs to be updated. Please contact the administrator.');
                        console.error('Database schema needs to be updated:', error);
                    } else {
                        throw error;
                    }
                } else {
                    saveButton.textContent = 'Score Saved! 🎉';
                    saveButton.style.backgroundColor = '#45a049';
                    emailInput.disabled = true;
                    playerIdInput.disabled = true;
                    
                    // Show high scores after successful save
                    await showHighScores();
                }
            } catch (error) {
                console.error('Error saving score:', error);
                saveButton.disabled = false;
                saveButton.textContent = 'Save Score';
                alert('Failed to save score. Please check the console for details.');
            }
        });
    }

    document.getElementById('new-game').addEventListener('click', () => {
        scoreModal.remove();
        startNewGame();
    });

    document.getElementById('view-scores').addEventListener('click', async () => {
        await showHighScores();
    });

    document.getElementById('close-score-modal').addEventListener('click', () => {
        scoreModal.remove();
    });

    // Disable input
    document.getElementById('story-input').disabled = true;
    document.getElementById('submit-story').disabled = true;
    document.getElementById('voice-input').disabled = true;
    updateTurnIndicator();

    // Update main screen stats to reflect final values
    updateStats();
}

// Game functions
async function startGame() {
    if (gameState.gameStarted) return;
    
    gameState.gameStarted = true;
    gameState.sentenceCount = 0;
    gameState.story = '';
    gameState.storyLines = [];
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
        // Ensure we're in AI's turn
        if (gameState.isUserTurn) {
            console.error('getAIResponse called during user turn');
            return;
        }
        
        updateTurnIndicator();
        
        // Clear the timer while AI is thinking
        if (gameState.timer) {
            clearInterval(gameState.timer);
        }
        
        // Stop voice recognition if it's active
        stopListening();
        
        console.log('Sending request with:', {
            gradeLevel: gameState.gradeLevel,
            storySoFar: gameState.story,
            challenge: gameState.currentChallenge
        });
        
        // Determine if this is the start of the story or a continuation
        const isStart = !gameState.story || gameState.story.trim() === '';
        const endpoint = isStart ? '/api/start-story' : '/api/continue-story';
        
        const response = await fetch(`http://localhost:5002${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                gradeLevel: gameState.gradeLevel,
                storySoFar: gameState.story,
                challenge: gameState.currentChallenge
            })
        });
        
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
        // Do NOT increment gameState.sentenceCount here
        // updateSentenceCount();
        
        // Check if we've reached the maximum sentences
        if (gameState.sentenceCount >= gameState.maxSentences * 2) {
            endGame();
            return;
        }
        
        // Get a new challenge after AI's response
        getNewChallenge();
        
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
        const voiceButton = document.getElementById('voice-input');
        input.disabled = false;
        submitButton.disabled = false;
        voiceButton.disabled = false;
        
        gameState.isUserTurn = true;
        updateTurnIndicator();
        
        // Start the timer for user's turn even if there was an error
        startTimer();
    }
}

function getNewChallenge() {
    const challenges = STORY_CHALLENGES[gameState.gradeLevel];
    if (challenges && challenges.length > 0) {
        // Filter out completed challenges
        const availableChallenges = challenges.filter(c => !gameState.completedChallenges.includes(c));
        if (availableChallenges.length > 0) {
            gameState.currentChallenge = availableChallenges[Math.floor(Math.random() * availableChallenges.length)];
        } else {
            // If all challenges are completed, reset completed challenges and pick a new one
            gameState.completedChallenges = [];
            gameState.currentChallenge = challenges[Math.floor(Math.random() * challenges.length)];
        }
        console.log('New challenge selected:', gameState.currentChallenge); // Debug log
        updateChallengeDisplay();
    }
}

function updateChallengeDisplay() {
    const challengeDisplay = document.getElementById('currentChallenge');
    const challengeInline = document.getElementById('currentChallenge-inline');
    if (challengeDisplay) {
        if (!gameState.currentChallenge) {
            challengeDisplay.textContent = 'Click "Start New Game" to begin!';
        } else {
            challengeDisplay.textContent = `Current Challenge: ${gameState.currentChallenge}`;
            console.log('Challenge display updated:', gameState.currentChallenge); // Debug log
        }
    } else {
        console.error('Challenge display element not found'); // Debug log
    }
    if (challengeInline) {
        if (!gameState.currentChallenge) {
            challengeInline.textContent = '';
        } else {
            challengeInline.textContent = `Current Challenge: ${gameState.currentChallenge}`;
        }
    }
}

function updateStats() {
    const pointsElement = document.getElementById('points');
    const challengesElement = document.getElementById('challenges');
    const wordsElement = document.getElementById('words-written');
    
    if (pointsElement) pointsElement.textContent = gameState.points;
    if (challengesElement) challengesElement.textContent = `${gameState.completedChallenges.length}/3`;
    if (wordsElement) wordsElement.textContent = gameState.userWords;
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
    // Track story lines with author
    gameState.storyLines.push({ text, author: isAI ? 'AI' : 'User' });

    // Only count user words
    if (!isAI) {
        const userWordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        gameState.userWords += userWordCount;
    }

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
        if (!recognition) {
            recognition = new webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                console.log('Voice recognition started');
            };

            recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                const inputBox = document.getElementById('story-input');
                // Append transcript if box already has text
                if (inputBox.value.trim().length > 0) {
                    inputBox.value += ' ' + text;
                } else {
                    inputBox.value = text;
                }
                inputBox.focus();
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                isListening = false;
                updateVoiceButton();
                alert('Speech recognition error: ' + event.error);
            };

            recognition.onend = () => {
                isListening = false;
                updateVoiceButton();
                console.log('Voice recognition ended');
            };
        }
        // Enable the button if supported
        document.getElementById('voice-input').disabled = false;
    } else {
        console.warn('Speech recognition not supported in this browser');
        document.getElementById('voice-input').style.display = 'none';
        alert('Voice input is not supported in this browser. Please use Google Chrome.');
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

// --- Authentication Functions ---
async function handleLogin() {
    if (!supabase) {
        alert('Authentication system is still loading. Please wait a moment and try again.');
        return;
    }
    
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        alert('Error logging in: ' + error.message);
    }
}

async function handleSignup() {
    if (!supabase) {
        alert('Authentication system is still loading. Please wait a moment and try again.');
        return;
    }
    
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
        alert('Error signing up: ' + error.message);
    } else {
        alert('Signup successful! Please check your email for a confirmation link.');
    }
}

async function handleLogout() {
    if (!supabase) {
        alert('Authentication system is still loading. Please wait a moment and try again.');
        return;
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) {
        alert('Error logging out: ' + error.message);
    }
}

async function fetchUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data, error } = await supabase
            .from('profiles')
            .select('streak, last_played_date, xp')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
        } else {
            gameState.userProfile = data;
            gameState.xp = data.xp || 0;
            updateStreakDisplay();
            updateXpDisplay();
        }
    }
}

function updateStreakDisplay() {
    const streakElement = document.getElementById('streak-display');
    if (gameState.userProfile && gameState.userProfile.streak > 0) {
        streakElement.textContent = `🔥 ${gameState.userProfile.streak} day streak`;
    } else {
        streakElement.textContent = '';
    }
}

function updateXpDisplay() {
    const xpElement = document.getElementById('xp-display');
    if (xpElement) {
        xpElement.textContent = `XP: ${gameState.xp}`;
    }
}

async function updateUserStreak() {
    const today = new Date().toISOString().split('T')[0];
    const user = supabase.auth.getUser();

    if (!gameState.userProfile || !user) return;

    const lastPlayed = gameState.userProfile.last_played_date;
    let newStreak = gameState.userProfile.streak || 0;

    if (lastPlayed !== today) {
        const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0];
        if (lastPlayed === yesterday) {
            newStreak++; // Continue streak
        } else {
            newStreak = 1; // Reset streak
        }

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const updatedXp = (gameState.userProfile.xp || 0) + gameState.points;

        const { error } = await supabase
            .from('profiles')
            .update({ streak: newStreak, last_played_date: today, xp: updatedXp })
            .eq('id', currentUser.id);

        if (error) {
            console.error('Error updating streak and xp:', error);
        } else {
            gameState.userProfile.streak = newStreak;
            gameState.userProfile.last_played_date = today;
            gameState.xp = updatedXp;
            updateStreakDisplay();
            updateXpDisplay();
        }
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Supabase client
    supabase = await initializeSupabase();

    // --- Auth UI Listeners ---
    document.getElementById('login-button').addEventListener('click', handleLogin);
    document.getElementById('signup-button').addEventListener('click', handleSignup);
    
    // Add logout button listener (it already exists in HTML)
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // Only set up auth listeners if Supabase is properly initialized
    if (supabase) {
        // Listen for auth state changes
        supabase.auth.onAuthStateChange((event, session) => {
            const loginContainer = document.getElementById('login-container');
            const gameContainer = document.getElementById('game-container');
            const userInfo = document.getElementById('user-info');
            const logoutButton = document.getElementById('logout-button');

            if (session && session.user) {
                // User is logged in
                loginContainer.style.display = 'none';
                gameContainer.style.display = 'block';
                
                // Show user info and logout button
                if (userInfo) userInfo.style.display = 'block';
                if (logoutButton) logoutButton.style.display = 'inline-block';

                fetchUserProfile();
            } else {
                // User is logged out
                loginContainer.style.display = 'block';
                gameContainer.style.display = 'none';
                
                // Hide user info and logout button
                if (userInfo) userInfo.style.display = 'none';
                if (logoutButton) logoutButton.style.display = 'none';
            }
        });

        // Initial check
        const { data: { session } } = await supabase.auth.getSession();
        const loginContainer = document.getElementById('login-container');
        const gameContainer = document.getElementById('game-container');
        const userInfo = document.getElementById('user-info');
        const logoutButton = document.getElementById('logout-button');

        if (session && session.user) {
            loginContainer.style.display = 'none';
            gameContainer.style.display = 'block';
            
            // Show user info and logout button
            if (userInfo) userInfo.style.display = 'block';
            if (logoutButton) logoutButton.style.display = 'inline-block';

            fetchUserProfile();
        } else {
            loginContainer.style.display = 'block';
            gameContainer.style.display = 'none';
            
            // Hide user info and logout button
            if (userInfo) userInfo.style.display = 'none';
            if (logoutButton) logoutButton.style.display = 'none';
        }
    } else {
        console.warn('Supabase not initialized. Authentication features will be disabled.');
        // Show a message to the user that auth is not available
        const loginContainer = document.getElementById('login-container');
        if (loginContainer) {
            loginContainer.innerHTML = `
                <div class="header">
                    <h1>🎮 StoryQuest</h1>
                    <p>Authentication is not configured. You can still play the game, but scores won't be saved.</p>
                    <button class="button" onclick="window.location.reload()">Continue to Game</button>
                </div>
            `;
        }
    }
    
    // Set initial timer display
    gameState.timeLeft = 120; // 2 minutes in seconds
    updateTimerDisplay();
    
    initCanvas();
    animateParticles();
    
    // Add high scores button to the game interface
    const gameInterface = document.getElementById('gameInterface');
    if (gameInterface) {
        const highScoresButton = document.createElement('button');
        highScoresButton.id = 'high-scores';
        highScoresButton.className = 'high-scores-button';
        highScoresButton.innerHTML = '🏆 High Scores';
        highScoresButton.addEventListener('click', showHighScores);
        gameInterface.insertBefore(highScoresButton, gameInterface.firstChild);
    }
    
    // Grade level change
    const gradeLevelSelect = document.getElementById('grade-level');
    if (gradeLevelSelect) {
        gradeLevelSelect.addEventListener('change', (e) => {
            gameState.gradeLevel = e.target.value;
        });
    }
    
    // Start game button
    const startGameButton = document.getElementById('start-game');
    if (startGameButton) {
        startGameButton.addEventListener('click', () => {
            if (!gameState.gameStarted) {
                startNewGame();
            }
        });
    }
    
    // Add restart game button event listener (always allow restart)
    const restartGameButton = document.getElementById('restart-game');
    if (restartGameButton) {
        restartGameButton.addEventListener('click', () => {
            startNewGame();
        });
    }
    
    // Setup voice recognition
    setupVoiceRecognition();
    
    // Add voice input button event listener
    const voiceInputButton = document.getElementById('voice-input');
    if (voiceInputButton) {
        voiceInputButton.addEventListener('click', () => {
            if (isListening) {
                stopListening();
            } else {
                startListening();
            }
        });
    }
    
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
    const submitStoryButton = document.getElementById('submit-story');
    if (submitStoryButton) {
        submitStoryButton.addEventListener('click', async () => {
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
            
            // Prevent double submission
            if (submitButton.disabled) {
                return;
            }
            
            try {
                // Disable input while processing
                input.disabled = true;
                submitButton.disabled = true;
                const voiceInput = document.getElementById('voice-input');
                if (voiceInput) voiceInput.disabled = true;
                
                // Clear the timer when submitting
                if (gameState.timer) {
                    clearInterval(gameState.timer);
                }
                
                // Add user's story and award points
                addToStory(text);
                updateStats();
                awardPoints(text);
                input.value = '';
                
                // Update game state
                gameState.userSentenceCount++;
                updateSentenceCount();
                
                // Check if we've reached the maximum sentences
                if (gameState.userSentenceCount >= gameState.maxSentences) {
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
                const voiceInput = document.getElementById('voice-input');
                if (voiceInput) voiceInput.disabled = false;
                gameState.isUserTurn = true;
                updateTurnIndicator();
                
                // Restart the timer if there's an error
                startTimer();
            }
        });
    }

    // Add stop game button event listener (always allow stop)
    const stopGameButton = document.getElementById('stop-game');
    if (stopGameButton) {
        stopGameButton.addEventListener('click', () => {
            endGame();
        });
    }

    // Add event listener for the new high scores button
    const viewHighScoresButton = document.getElementById('view-high-scores');
    if (viewHighScoresButton) {
        viewHighScoresButton.addEventListener('click', () => {
            showHighScores();
        });
    }

    // Add event listener for the new high scores button
    const highScoresBtn = document.getElementById('high-scores-btn');
    if (highScoresBtn) {
        highScoresBtn.addEventListener('click', showHighScores);
    }

    // Continue Story UI elements
    const importDbBtn = document.getElementById('import-db-btn');
    const uploadFileBtn = document.getElementById('upload-file-btn');
    const uploadFileInput = document.getElementById('upload-file-input');
    const userStoriesList = document.getElementById('user-stories-list');

    // File upload logic
    uploadFileBtn.addEventListener('click', () => {
        uploadFileInput.value = '';
        uploadFileInput.click();
    });

    uploadFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                const storyText = evt.target.result;
                loadStoryFromText(storyText);
            };
            reader.readAsText(file);
        }
    });

    // Import from DB logic
    importDbBtn.addEventListener('click', async () => {
        if (!supabase) {
            alert('Supabase is not initialized. Please log in.');
            return;
        }
        userStoriesList.innerHTML = '<p>Loading your stories...</p>';
        userStoriesList.style.display = 'block';
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                userStoriesList.innerHTML = '<p>Please log in to view your stories.</p>';
                return;
            }
            // Fetch stories for this user
            const { data: stories, error } = await supabase
                .from('scores')
                .select('id, story, created_at, grade_level, points')
                .eq('player_email', user.email)
                .order('created_at', { ascending: false })
                .limit(10);
            if (error) throw error;
            if (!stories || stories.length === 0) {
                userStoriesList.innerHTML = '<p>No saved stories found.</p>';
                return;
            }
            // Show stories as a list
            userStoriesList.innerHTML = '<h4>Your Stories</h4>' +
                '<ul style="list-style:none; padding:0;">' +
                stories.map(story =>
                    `<li style="margin-bottom:10px;">
                        <button class="button" style="width:100%;text-align:left;" data-story-id="${story.id}">
                            <b>${story.grade_level}</b> | ${story.created_at ? new Date(story.created_at).toLocaleString() : ''} | <span style="color:#888">${story.points} pts</span><br>
                            <span style="font-size:0.95em; color:#555;">${story.story.slice(0, 60)}${story.story.length > 60 ? '...' : ''}</span>
                        </button>
                    </li>`
                ).join('') + '</ul>';
            // Add click listeners
            userStoriesList.querySelectorAll('button[data-story-id]').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const storyId = btn.getAttribute('data-story-id');
                    const storyObj = stories.find(s => s.id == storyId);
                    if (storyObj) {
                        loadStoryFromText(storyObj.story);
                        userStoriesList.style.display = 'none';
                    }
                });
            });
        } catch (err) {
            userStoriesList.innerHTML = '<p>Error loading stories. Please try again later.</p>';
            console.error('Error fetching user stories:', err);
        }
    });

    // Hide story list when clicking outside
    document.addEventListener('click', (e) => {
        if (userStoriesList.style.display === 'block' && !userStoriesList.contains(e.target) && e.target !== importDbBtn) {
            userStoriesList.style.display = 'none';
        }
    });
});

function startNewGame() {
    // Clear the story display box
    const storyDisplay = document.getElementById('story-display');
    if (storyDisplay) {
        storyDisplay.innerHTML = '';
    }
    // Reset game state
    gameState.sentenceCount = 0;
    gameState.userSentenceCount = 0;
    gameState.story = '';
    gameState.storyLines = [];
    gameState.completedChallenges = [];
    gameState.points = 0;
    gameState.words = 0;
    gameState.currentChallenge = null;
    gameState.gameStarted = true;
    
    // Get selected grade level
    const gradeLevel = document.getElementById('grade-level').value;
    gameState.gradeLevel = gradeLevel;
    
    // Update UI elements
    updateChallengeDisplay();
    updateSentenceCount();
    updateStats();
    updateTurnIndicator();
    
    // Start the story with AI's turn
    gameState.isUserTurn = false;
    
    // Start the story
    fetch('http://localhost:5002/api/start-story', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            gradeLevel: gradeLevel,
            challenge: gameState.currentChallenge
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Add AI's story starter
        addToStory(data.story, true);
        gameState.story = data.story;
        gameState.sentenceCount++;
        updateSentenceCount();
        
        // Get first challenge
        getNewChallenge();
        
        // Switch to user's turn
        gameState.isUserTurn = true;
        updateTurnIndicator();
        
        // Enable input for user's turn
        document.getElementById('story-input').disabled = false;
        document.getElementById('submit-story').disabled = false;
        document.getElementById('voice-input').disabled = false;
        
        // Start timer for user's turn
        startTimer();
    })
    .catch(error => {
        console.error('Error starting new game:', error);
        alert('Failed to start new game. Please try again.');
        
        // Reset game state on error
        gameState.gameStarted = false;
        updateTurnIndicator();
    });
}

function updateStoryDisplay() {
    const storyDisplay = document.getElementById('story-display');
    if (!storyDisplay) {
        console.error('Story display element not found');
        return;
    }
    storyDisplay.innerHTML = gameState.story;
}

// Add this function to fetch and display high scores
async function showHighScores() {
    try {
        const { data: scores, error } = await supabase
            .from('scores')
            .select('*')
            .order('points', { ascending: false })
            .limit(10);

        if (error) throw error;

        // Create and show the high scores modal
        const scoresModal = document.createElement('div');
        scoresModal.className = 'score-modal';
        scoresModal.innerHTML = `
            <div class="score-content">
                <h2>🏆 High Scores</h2>
                <div class="high-scores-list">
                    ${scores.length > 0 
                        ? `<table>
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Player ID</th>
                                    <th>Score</th>
                                    <th>Grade Level</th>
                                    <th>Challenges</th>
                                    <th>Words</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${scores.map((score, index) => `
                                    <tr>
                                        <td>#${index + 1}</td>
                                        <td>${score.player_id || 'Anonymous'}</td>
                                        <td>${score.points}</td>
                                        <td>${score.grade_level}</td>
                                        <td>${score.challenges_completed}/3</td>
                                        <td>${score.words}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>`
                        : '<p>No scores yet. Be the first to set a high score! 🎮</p>'
                    }
                </div>
                <div class="score-actions">
                    <button id="close-scores">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(scoresModal);

        // Add event listener for the close button
        document.getElementById('close-scores').addEventListener('click', () => {
            scoresModal.remove();
        });
    } catch (error) {
        console.error('Error fetching high scores:', error);
        alert('Failed to load high scores. Please try again later.');
    }
}

// Add CSS for all styles
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

    .completed-challenges {
        margin-top: 1rem;
        text-align: left;
    }

    .completed-challenges h3 {
        margin-bottom: 0.5rem;
        color: #333;
    }

    .completed-challenges ul {
        list-style-type: none;
        padding: 0;
        margin: 0;
    }

    .completed-challenges li {
        padding: 0.5rem;
        margin: 0.25rem 0;
        background-color: #f0f0f0;
        border-radius: 4px;
    }

    .email-input {
        margin-top: 1.5rem;
        text-align: left;
    }

    .email-input label {
        display: block;
        margin-bottom: 0.5rem;
        color: #333;
        font-weight: bold;
    }

    .email-input input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        margin-bottom: 0.5rem;
    }

    .email-input input:focus {
        border-color: #2196F3;
        outline: none;
    }

    .email-input small {
        display: block;
        color: #666;
        font-size: 0.8rem;
    }

    .score-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 1.5rem;
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

    .challenge-completion {
        background-color: #e8f5e9;
        color: #2e7d32;
        padding: 0.5rem;
        margin: 0.5rem 0;
        border-radius: 4px;
        font-weight: bold;
    }

    .vocabulary-bonus {
        background-color: #fff3e0;
        color: #e65100;
        padding: 0.5rem;
        margin: 0.5rem 0;
        border-radius: 4px;
        font-weight: bold;
        border-left: 4px solid #ff9800;
    }

    .high-scores-button {
        position: absolute;
        top: 1rem;
        right: 1rem;
        padding: 0.5rem 1rem;
        background-color: #FFD700;
        color: #000;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: bold;
        transition: background-color 0.3s;
    }

    .high-scores-button:hover {
        background-color: #FFC800;
    }

    .high-scores-list {
        margin: 1rem 0;
        max-height: 400px;
        overflow-y: auto;
    }

    .high-scores-list table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
    }

    .high-scores-list th,
    .high-scores-list td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #ddd;
    }

    .high-scores-list th {
        background-color: #f5f5f5;
        font-weight: bold;
    }

    .high-scores-list tr:nth-child(even) {
        background-color: #f9f9f9;
    }

    .high-scores-list tr:hover {
        background-color: #f0f0f0;
    }

    #close-scores {
        background-color: #666;
        color: white;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.3s;
    }

    #close-scores:hover {
        background-color: #555;
    }

    .user-id-input {
        margin-top: 1rem;
        text-align: left;
    }

    .user-id-input label {
        display: block;
        margin-bottom: 0.5rem;
        color: #333;
        font-weight: bold;
    }

    .user-id-input input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        margin-bottom: 0.5rem;
    }

    .user-id-input input:focus {
        border-color: #2196F3;
        outline: none;
    }

    .user-id-input small {
        display: block;
        color: #666;
        font-size: 0.8rem;
    }

    .high-scores-list table td:nth-child(2) {
        font-weight: bold;
        color: #2196F3;
    }
`;
document.head.appendChild(style);

// Helper function to check for grade-appropriate vocabulary
function checkGradeLevelVocabulary(text, gradeLevel) {
    const textLower = text.toLowerCase();
    const words = textLower.split(/\s+/);
    const vocabulary = GRADE_VOCABULARY[gradeLevel];
    
    if (!vocabulary) return { basicCount: 0, advancedCount: 0, totalPoints: 0 };
    
    let basicCount = 0;
    let advancedCount = 0;
    
    // Check each word against the grade-level vocabulary
    words.forEach(word => {
        // Clean the word (remove punctuation)
        const cleanWord = word.replace(/[^\w]/g, '');
        if (cleanWord.length < 3) return; // Skip very short words
        
        if (vocabulary.basic.includes(cleanWord)) {
            basicCount++;
        } else if (vocabulary.advanced.includes(cleanWord)) {
            advancedCount++;
        }
    });
    
    // Calculate points: 1 point for basic words, 3 points for advanced words
    const totalPoints = basicCount + (advancedCount * 3);
    
    return { basicCount, advancedCount, totalPoints };
}

function awardPoints(text) {
    const wordCount = text.trim().split(/\s+/).length;
    
    // Award 1 point for every 5 words
    gameState.points += Math.floor(wordCount / 5);

    // Award bonus points for completing the current challenge
    if (validateChallenge(text)) {
        gameState.points += 20;
        if (!gameState.completedChallenges.includes(gameState.currentChallenge)) {
            gameState.completedChallenges.push(gameState.currentChallenge);
        }
        updateChallengeDisplay();
        
        // Show challenge completion message
        const storyDisplay = document.getElementById('story-display');
        if (storyDisplay) {
            const completionMessage = document.createElement('div');
            completionMessage.className = 'challenge-completion';
            completionMessage.textContent = `🎉 Challenge Completed: ${gameState.currentChallenge}`;
            storyDisplay.appendChild(completionMessage);
        }
    }

    // Award points for grade-appropriate vocabulary
    const vocabScore = checkGradeLevelVocabulary(text, gameState.gradeLevel);
    if (vocabScore.totalPoints > 0) {
        gameState.points += vocabScore.totalPoints;
        
        // Show vocabulary bonus message
        const storyDisplay = document.getElementById('story-display');
        if (storyDisplay) {
            const vocabMessage = document.createElement('div');
            vocabMessage.className = 'vocabulary-bonus';
            let message = `📚 Vocabulary Bonus: +${vocabScore.totalPoints} points`;
            if (vocabScore.basicCount > 0) {
                message += ` (${vocabScore.basicCount} basic words)`;
            }
            if (vocabScore.advancedCount > 0) {
                message += ` (${vocabScore.advancedCount} advanced words)`;
            }
            vocabMessage.textContent = message;
            storyDisplay.appendChild(vocabMessage);
        }
    }

    updateStats();
}

// Helper: Load story text into game state and update UI
function loadStoryFromText(storyText) {
    // Reset game state as for a new game
    gameState.story = storyText;
    gameState.storyLines = [];
    gameState.points = 0;
    gameState.words = 0;
    gameState.userWords = 0;
    gameState.sentenceCount = 0;
    gameState.userSentenceCount = 0;
    gameState.completedChallenges = [];
    gameState.currentChallenge = null;
    gameState.gameStarted = true;

    // Try to parse lines with author if possible
    const lines = storyText.split('\n');
    for (const line of lines) {
        if (line.startsWith('AI:') || line.startsWith('🤖 AI:')) {
            gameState.storyLines.push({ text: line.replace(/^((🤖 )?AI:)/, '').trim(), author: 'AI' });
        } else if (line.startsWith('You:') || line.startsWith('✍️ You:')) {
            gameState.storyLines.push({ text: line.replace(/^((✍️ )?You:)/, '').trim(), author: 'User' });
        } else if (line.trim()) {
            // Fallback: treat as user
            gameState.storyLines.push({ text: line.trim(), author: 'User' });
        }
    }
    // Update UI and stats
    updateStoryDisplay();
    updateStats();
    updateSentenceCount();
    updateTurnIndicator();
    alert('Story loaded! You can now continue your story.');

    // Decide whose turn it is: user always goes after AI
    if (gameState.storyLines.length === 0 || gameState.storyLines[gameState.storyLines.length - 1].author === 'AI') {
        gameState.isUserTurn = true;
    } else {
        gameState.isUserTurn = false;
    }

    // Set or pick a challenge
    getNewChallenge();

    // Enable input if it's user's turn
    const input = document.getElementById('story-input');
    const submitButton = document.getElementById('submit-story');
    const voiceButton = document.getElementById('voice-input');
    if (gameState.isUserTurn) {
        input.disabled = false;
        submitButton.disabled = false;
        voiceButton.disabled = false;
        startTimer();
    } else {
        input.disabled = true;
        submitButton.disabled = true;
        voiceButton.disabled = true;
        getAIResponse();
    }
    updateTurnIndicator();
} 