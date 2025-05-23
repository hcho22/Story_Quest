from flask import Flask, request, jsonify
from flask_cors import CORS
import yaml
from crewai import Crew, Agent, Task
import os
from openai import OpenAI
import json
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:8000"}})

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

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
    """Count the number of sentences in a text."""
    # Split by common sentence endings followed by space or end of string
    sentences = re.split(r'[.!?]+(?:\s|$)', text)
    # Filter out empty strings
    sentences = [s.strip() for s in sentences if s.strip()]
    return len(sentences)

def limit_sentences(text, max_sentences=2):
    """Limit text to a maximum number of sentences."""
    sentences = re.split(r'([.!?]+(?:\s|$))', text)
    result = []
    count = 0
    
    for i in range(0, len(sentences)-1, 2):
        if count >= max_sentences:
            break
        sentence = sentences[i].strip()
        if sentence:
            result.append(sentence + sentences[i+1])
            count += 1
    
    return ''.join(result).strip()

def generate_story_with_openai(grade_level, challenge, story_so_far=None):
    """Generate story content using OpenAI API."""
    try:
        if not story_so_far:
            # Generate story starter
            prompt = f"""Create a creative and engaging story starter for a {grade_level} grade level student.
            The story should be appropriate for their age and reading level.
            Keep it to 2 sentences maximum.
            Make it engaging and leave room for continuation.
            Grade level: {grade_level}
            Challenge type: {challenge}"""
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a creative writing assistant that helps students write stories."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.7
            )
            
            story = response.choices[0].message.content.strip()
            return limit_sentences(story, 2)
        else:
            # Generate story continuation
            prompt = f"""Continue the story in a creative and engaging way.
            Keep it to 2 sentences maximum.
            Make sure to maintain consistency with the previous story.
            Previous story: {story_so_far}
            Grade level: {grade_level}
            Challenge type: {challenge}"""
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a creative writing assistant that helps students write stories."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.7
            )
            
            continuation = response.choices[0].message.content.strip()
            return limit_sentences(continuation, 2)
            
    except Exception as e:
        print(f"Error generating story: {str(e)}")
        return generate_fallback_story(grade_level, challenge, story_so_far)

def generate_fallback_story(grade_level, challenge, story_so_far=None):
    """Generate a fallback story if OpenAI API fails."""
    if not story_so_far:
        # Return a simple starter
        return "Once upon a time, there was a magical forest. The trees whispered secrets to anyone who would listen."
    else:
        # Return a simple continuation
        return "The forest creatures gathered to hear the trees' stories. They learned about the magic that lived in their home."

@app.route('/api/start-story', methods=['POST'])
def start_story():
    try:
        data = request.get_json()
        grade_level = data.get('grade_level', '3rd')
        challenge = data.get('challenge', 'creative')
        
        story = generate_story_with_openai(grade_level, challenge)
        return jsonify({
            'story': story,
            'grade_level': grade_level,
            'challenge': challenge
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/continue-story', methods=['POST'])
def continue_story():
    try:
        data = request.get_json()
        story_so_far = data.get('story', '')
        grade_level = data.get('grade_level', '3rd')
        challenge = data.get('challenge', 'creative')
        
        continuation = generate_story_with_openai(grade_level, challenge, story_so_far)
        return jsonify({
            'story': continuation,
            'grade_level': grade_level,
            'challenge': challenge
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'endpoints': {
            '/api/start-story': 'POST - Start a new story',
            '/api/continue-story': 'POST - Continue an existing story'
        }
    })

if __name__ == '__main__':
    app.run(port=5002, debug=True) 