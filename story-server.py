from flask import Flask, request, jsonify
from flask_cors import CORS
import yaml
from crewai import Crew, Agent, Task
import os
from openai import OpenAI
import json
import re

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:8000"}})

# Initialize OpenAI client
client = OpenAI()

# Load configuration
def load_config():
    try:
        config_dir = os.path.join(os.path.dirname(__file__), 'N2G/config')
        with open(os.path.join(config_dir, 'agents.yaml'), 'r') as f:
            agents_config = yaml.safe_load(f)
        with open(os.path.join(config_dir, 'tasks.yaml'), 'r') as f:
            tasks_config = yaml.safe_load(f)
        return agents_config, tasks_config
    except Exception as e:
        print(f"Error loading configuration: {e}")
        return None, None

agents_config, tasks_config = load_config()

if not agents_config or not tasks_config:
    print("Failed to load configuration. Using default values.")
    agents_config = {
        'creative_writer': {
            'role': 'Creative Writing Expert',
            'goal': 'Generate imaginative and engaging story content',
            'backstory': 'You are a talented author who helps students by crafting short story beginnings.'
        },
        'story_partner': {
            'role': 'Story Continuation Specialist',
            'goal': 'Continue the student\'s story exactly as they wrote it',
            'backstory': 'You are a co-author and writing partner.'
        }
    }
    tasks_config = {
        'generate_prompt': {
            'description': 'Start a story with a short, imaginative opening for {grade_level} level in the {genre} genre.'
        },
        'continue_story': {
            'description': 'Continue the following story using the same characters, setting, and tone: {story_so_far}'
        }
    }

# Create agents
creative_writer = Agent(
    role=agents_config['creative_writer']['role'],
    goal=agents_config['creative_writer']['goal'],
    backstory=agents_config['creative_writer']['backstory']
)

story_partner = Agent(
    role=agents_config['story_partner']['role'],
    goal=agents_config['story_partner']['goal'],
    backstory=agents_config['story_partner']['backstory']
)

def count_sentences(text):
    # Split by common sentence endings and filter out empty strings
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    return len(sentences)

def limit_to_three_sentences(text):
    # Split by common sentence endings and filter out empty strings
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    # Take only the first three sentences
    limited_sentences = sentences[:3]
    # Join them back with periods
    return '. '.join(limited_sentences) + '.'

def generate_story_with_openai(grade_level, story_so_far, challenge):
    try:
        if not story_so_far:
            # Generate story starter
            prompt = f"""Create a short, engaging story starter (2-3 sentences) for a {grade_level} student.
            The story should be about a {challenge} theme.
            Make it creative and age-appropriate.
            IMPORTANT: Limit your response to exactly 3 sentences."""
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a creative writing expert who creates engaging story starters for students. Always limit your response to exactly 3 sentences."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=100
            )
            story = response.choices[0].message.content.strip()
            return limit_to_three_sentences(story)
        else:
            # Continue the story
            prompt = f"""Continue the following story for a {grade_level} student. 
            Keep the same characters, setting, and tone.
            IMPORTANT: Limit your response to exactly 3 sentences.
            
            Story so far:
            {story_so_far}
            
            Continue the story:"""
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a story continuation expert who maintains story coherence and character consistency. Always limit your response to exactly 3 sentences."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150
            )
            story = response.choices[0].message.content.strip()
            return limit_to_three_sentences(story)
    except Exception as e:
        print(f"Error with OpenAI: {e}")
        return generate_fallback_story(grade_level, story_so_far, challenge)

def generate_fallback_story(grade_level, story_so_far, challenge):
    # Fallback story generation logic
    story_continuations = {
        "animal": {
            "K-2": [
                "The rabbit's ears twitched as it heard a rustling sound. The friendly rabbit hopped around, looking for new friends. The little rabbit's nose wiggled as it sniffed the air.",
                "Max found a cozy spot under a big tree. He curled up and took a short nap. When he woke up, he felt refreshed and ready for more adventures.",
                "The forest was full of interesting sounds. Max listened carefully to each one. He wondered what new friends he might meet today."
            ],
            "3-5": [
                "The rabbit discovered a secret burrow in the garden. Inside, he found a collection of shiny objects. Each one seemed to tell a different story.",
                "Max's special abilities started to manifest. He could understand what the other animals were saying. This made his adventures even more exciting.",
                "The magical stick began to glow brighter. Max felt a strange energy flowing through his paws. He knew something extraordinary was about to happen."
            ]
        }
    }
    
    if not story_so_far:
        return "Once upon a time, in a magical garden, there lived a special red rabbit named Max. He loved exploring the forest and making new friends. Every day brought new adventures for the curious little rabbit."
    
    # Try to extract the last sentence from the story
    last_sentence = story_so_far.split('.')[-2].strip() if len(story_so_far.split('.')) > 1 else story_so_far
    
    # Generate a more contextual continuation
    if "stick" in last_sentence.lower():
        return "The stick began to glow with a magical light, and Max's eyes widened in wonder. He carefully picked it up, feeling a strange warmth in his paws. The forest around him seemed to come alive with energy."
    elif "forest" in last_sentence.lower():
        return "The forest was full of mysterious sounds and shadows, making Max's adventure even more exciting. He hopped carefully between the trees, his ears perked up for any unusual noises. Suddenly, he spotted something sparkling in the distance."
    elif "hopping" in last_sentence.lower():
        return "As Max hopped along, he discovered a hidden path that seemed to lead somewhere special. The path was covered in soft moss and tiny flowers. His heart raced with excitement as he wondered where it might lead."
    
    # If no specific context is found, use the challenge-based continuations
    continuations = story_continuations.get(challenge, {}).get(grade_level, 
        ["The story continued with new adventures. The characters discovered something interesting. Something magical happened in the garden.",
         "Max found a new friend in the forest. They played together all afternoon. The sun began to set, painting the sky in beautiful colors.",
         "A gentle breeze rustled through the leaves. Birds sang their evening songs. Max felt happy and content in his magical garden home."])
    
    import random
    return random.choice(continuations)

@app.route('/')
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Story server is running',
        'endpoints': {
            '/api/start-story': 'POST - Start a new story',
            '/api/continue-story': 'POST - Continue an existing story'
        }
    })

@app.route('/api/start-story', methods=['POST'])
def start_story():
    data = request.get_json()
    grade_level = data.get('gradeLevel')
    challenge = data.get('challenge')
    
    if not grade_level:
        return jsonify({'error': 'Grade level is required'}), 400
    
    try:
        story = generate_story_with_openai(grade_level, '', challenge)
        return jsonify({'story': story})
    except Exception as e:
        print(f"Error in /api/start-story: {e}")
        return jsonify({'error': 'Failed to generate story'}), 500

@app.route('/api/continue-story', methods=['POST'])
def continue_story():
    data = request.get_json()
    grade_level = data.get('gradeLevel')
    story_so_far = data.get('storySoFar')
    challenge = data.get('challenge')
    
    if not grade_level or not story_so_far:
        return jsonify({'error': 'Grade level and story so far are required'}), 400
    
    try:
        story = generate_story_with_openai(grade_level, story_so_far, challenge)
        return jsonify({'story': story})
    except Exception as e:
        print(f"Error in /api/continue-story: {e}")
        return jsonify({'error': 'Failed to continue story'}), 500

if __name__ == '__main__':
    print("Story server starting...")
    print("Available endpoints:")
    print("  GET  /              - Health check")
    print("  POST /api/start-story     - Start a new story")
    print("  POST /api/continue-story  - Continue an existing story")
    app.run(port=5002) 