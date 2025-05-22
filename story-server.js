const express = require('express');
const cors = require('cors');
const { CrewAI } = require('crewai');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 5002;

// Load configuration
const agentsConfig = yaml.load(fs.readFileSync(path.join(__dirname, 'N2G/config/agents.yaml'), 'utf8'));
const tasksConfig = yaml.load(fs.readFileSync(path.join(__dirname, 'N2G/config/tasks.yaml'), 'utf8'));

// Initialize CrewAI
const crew = new CrewAI({
    agents: agentsConfig,
    tasks: tasksConfig
});

// Enable CORS for all routes
app.use(cors({
    origin: 'http://localhost:8000',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept']
}));

// Parse JSON bodies
app.use(express.json());

// Story generation function
async function generateStory(gradeLevel, storySoFar, challenge) {
    try {
        if (!storySoFar) {
            // Generate story starter
            const result = await crew.executeTask('generate_prompt', {
                genre: challenge || 'fantasy',
                grade_level: gradeLevel
            });
            return result.output;
        } else {
            // Continue the story
            const result = await crew.executeTask('continue_story', {
                story_so_far: storySoFar,
                grade_level: gradeLevel
            });
            return result.output;
        }
    } catch (error) {
        console.error('Error generating story:', error);
        // Fallback to simple story generation if CrewAI fails
        return generateFallbackStory(gradeLevel, storySoFar, challenge);
    }
}

// Fallback story generation function
function generateFallbackStory(gradeLevel, storySoFar, challenge) {
    // Story continuations organized by challenge type
    const storyContinuations = {
        "animal": {
            "K-2": [
                "The rabbit's ears twitched as it heard a rustling sound.",
                "The friendly rabbit hopped around, looking for new friends.",
                "The little rabbit's nose wiggled as it sniffed the air.",
                "The rabbit's fluffy tail bobbed up and down as it hopped.",
                "The rabbit's big eyes sparkled with curiosity."
            ],
            "3-5": [
                "The rabbit discovered a secret burrow in the garden.",
                "The rabbit's special abilities started to manifest.",
                "The rabbit could understand the language of other animals.",
                "The rabbit's fur changed colors with its emotions.",
                "The rabbit had a magical connection with nature."
            ]
        },
        "weather": {
            "K-2": [
                "The sun was shining brightly in the blue sky.",
                "A gentle breeze rustled the leaves in the trees.",
                "Raindrops started to fall from the clouds.",
                "A rainbow appeared after the rain stopped.",
                "The wind made the flowers dance in the garden."
            ],
            "3-5": [
                "A storm was brewing on the horizon.",
                "The weather seemed to respond to the rabbit's emotions.",
                "The clouds formed strange shapes in the sky.",
                "The temperature began to change mysteriously.",
                "The weather patterns became more unusual."
            ]
        },
        "feelings": {
            "K-2": [
                "The rabbit felt happy and excited.",
                "The rabbit was a little scared of the dark.",
                "The rabbit's heart was full of joy.",
                "The rabbit felt nervous about making new friends.",
                "The rabbit was proud of its special abilities."
            ],
            "3-5": [
                "The rabbit's emotions seemed to affect its surroundings.",
                "The rabbit struggled with its new responsibilities.",
                "The rabbit felt a deep connection to the garden.",
                "The rabbit's confidence grew with each adventure.",
                "The rabbit learned to understand its feelings better."
            ]
        },
        "magical": {
            "K-2": [
                "The rabbit's fur started to glow with magic.",
                "The rabbit could make flowers bloom instantly.",
                "The rabbit's ears could hear magical sounds.",
                "The rabbit's eyes could see invisible things.",
                "The rabbit's paws left sparkles wherever it hopped."
            ],
            "3-5": [
                "The rabbit discovered it had magical powers.",
                "The rabbit could communicate with magical creatures.",
                "The rabbit's magic grew stronger each day.",
                "The rabbit learned to control its magical abilities.",
                "The rabbit's magic affected the entire garden."
            ]
        }
    };

    // Default continuations if no specific challenge is matched
    const defaultContinuations = {
        "K-2": [
            "The garden was full of beautiful flowers.",
            "The rabbit made new friends in the garden.",
            "The sun was shining brightly.",
            "The birds were singing sweet songs.",
            "The butterflies danced in the air."
        ],
        "3-5": [
            "The garden held many secrets.",
            "The rabbit discovered something special.",
            "The magic in the garden grew stronger.",
            "The adventure was just beginning.",
            "The rabbit's journey continued."
        ]
    };

    // Determine which challenge category to use
    let challengeCategory = "default";
    if (challenge) {
        const challengeLower = challenge.toLowerCase();
        if (challengeLower.includes("animal")) challengeCategory = "animal";
        else if (challengeLower.includes("weather")) challengeCategory = "weather";
        else if (challengeLower.includes("feel") || challengeLower.includes("happy") || challengeLower.includes("sad")) challengeCategory = "feelings";
        else if (challengeLower.includes("magical")) challengeCategory = "magical";
    }

    // Get appropriate continuations based on challenge and grade level
    let continuations;
    if (challengeCategory !== "default" && storyContinuations[challengeCategory] && storyContinuations[challengeCategory][gradeLevel]) {
        continuations = storyContinuations[challengeCategory][gradeLevel];
    } else {
        continuations = defaultContinuations[gradeLevel] || defaultContinuations["K-2"];
    }

    // Get a random continuation
    const randomContinuation = continuations[Math.floor(Math.random() * continuations.length)];

    // If there's an existing story, return only the new part
    if (storySoFar) {
        return randomContinuation;
    }

    // For the first part, return a starter that matches the challenge
    const starters = {
        "animal": {
            "K-2": "Once upon a time, in a magical garden, there lived a special red rabbit.",
            "3-5": "In a hidden corner of the garden, a mysterious red rabbit appeared."
        },
        "weather": {
            "K-2": "The sun was rising over a magical garden, where a special red rabbit lived.",
            "3-5": "A storm was approaching the magical garden, home to a unique red rabbit."
        },
        "feelings": {
            "K-2": "In a magical garden, a happy red rabbit was playing with its friends.",
            "3-5": "The red rabbit in the magical garden was feeling particularly special today."
        },
        "magical": {
            "K-2": "A magical red rabbit lived in a special garden full of wonders.",
            "3-5": "The garden was home to a red rabbit with extraordinary magical abilities."
        },
        "default": {
            "K-2": "Once upon a time, in a magical garden, there lived a special red rabbit.",
            "3-5": "In a hidden corner of the garden, a mysterious red rabbit appeared."
        }
    };

    return starters[challengeCategory][gradeLevel] || starters["default"][gradeLevel] || starters["default"]["K-2"];
}

// API endpoints
app.post('/api/start-story', async (req, res) => {
    const { gradeLevel, challenge } = req.body;
    
    if (!gradeLevel) {
        return res.status(400).json({ error: 'Grade level is required' });
    }

    try {
        const story = await generateStory(gradeLevel, '', challenge);
        res.json({ story });
    } catch (error) {
        console.error('Error in /api/start-story:', error);
        res.status(500).json({ error: 'Failed to generate story' });
    }
});

app.post('/api/continue-story', async (req, res) => {
    const { gradeLevel, storySoFar, challenge } = req.body;
    
    if (!gradeLevel || !storySoFar) {
        return res.status(400).json({ error: 'Grade level and story so far are required' });
    }

    try {
        const story = await generateStory(gradeLevel, storySoFar, challenge);
        res.json({ story });
    } catch (error) {
        console.error('Error in /api/continue-story:', error);
        res.status(500).json({ error: 'Failed to continue story' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
    console.log(`Story server running at http://localhost:${port}`);
}); 