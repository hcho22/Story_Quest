from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from N2G.crew import build_prompt_only_crew, build_continue_only_crew
import os
import traceback
import logging
from dotenv import load_dotenv
import openai
import base64
import uuid
import json
from openai import OpenAI
import re

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Validate environment variables
if not os.getenv("OPENAI_API_KEY"):
    logger.error("OPENAI_API_KEY environment variable is not set!")
    raise ValueError("OPENAI_API_KEY environment variable is required")

app = Flask(__name__)
# Configure CORS to allow all origins in development
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Configure OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Create images directory if it doesn't exist
IMAGES_DIR = 'generated_images'
if not os.path.exists(IMAGES_DIR):
    os.makedirs(IMAGES_DIR)

def contains_prohibited_content(text):
    # Basic keyword-based filter for profanity, hate speech, sexual content, violence, and dangerous acts
    # This is not exhaustive, but covers common cases
    prohibited_keywords = [
        # Profanity (sample, not exhaustive)
        'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'pussy', 'cunt', 'fag', 'slut', 'whore',
        # Hate speech
        'nigger', 'nigga', 'chink', 'spic', 'kike', 'faggot', 'tranny', 'retard', 'gook', 'wetback',
        # Sexual content
        'sex', 'sexual', 'nude', 'naked', 'porn', 'penis', 'vagina', 'boobs', 'breasts', 'cum', 'ejaculate', 'masturbate', 'orgasm',
        # Violence
        'kill', 'murder', 'rape', 'stab', 'shoot', 'gun', 'bomb', 'terrorist', 'terrorism', 'suicide', 'hang', 'lynch', 'molest',
        # Dangerous acts
        'overdose', 'self-harm', 'cutting', 'bleed', 'poison', 'chloroform', 'strangle', 'asphyxiate', 'arson', 'explosive', 'explosion'
    ]
    text_lower = text.lower()
    for word in prohibited_keywords:
        if word in text_lower:
            return True, word
    return False, None

def moderate_content(text):
    # First, check with built-in filter
    is_blocked, keyword = contains_prohibited_content(text)
    if is_blocked:
        print(f"Built-in filter blocked content for keyword: {keyword}")
        return False, {"error": f"Content blocked for safety reasons: contains prohibited word '{keyword}'"}
    try:
        response = client.moderations.create(input=text)
        results = response.results[0]
        if results.flagged:
            return False, results.categories
        return True, None
    except Exception as e:
        print(f"Moderation API error: {e}")
        return False, {"error": "Moderation API error"}

@app.route('/api/start-story', methods=['POST'])
def start_story():
    try:
        logger.debug("Received start-story request")
        data = request.json
        logger.debug(f"Request data: {data}")
        
        if not data:
            raise ValueError("No data received in request")
            
        grade_level = data.get('gradeLevel')
        if not grade_level:
            raise ValueError("gradeLevel is required")
            
        story_so_far = data.get('storySoFar', '')
        
        logger.debug(f"Building prompt crew with grade_level={grade_level}")
        try:
            crew = build_prompt_only_crew()
        except Exception as e:
            logger.error(f"Error building crew: {str(e)}")
            logger.error(traceback.format_exc())
            raise ValueError(f"Failed to initialize story generation: {str(e)}")
        
        logger.debug("Kicking off crew")
        try:
            result = str(crew.kickoff(inputs={
                "grade_level": grade_level,
                "story_so_far": story_so_far,
                "genre": "adventure",  # Add default genre
                "is_single_sentence": True  # Request a single sentence response
            })).strip()
            
            if not result:
                raise ValueError("No story was generated")
            
            # Moderation check
            is_safe, categories = moderate_content(result)
            if not is_safe:
                return jsonify({"error": f"Content blocked for safety reasons: {categories}"}), 400
            
            logger.debug(f"Generated story: {result}")
            return jsonify({"story": result})
        except Exception as e:
            logger.error(f"Error generating story: {str(e)}")
            logger.error(traceback.format_exc())
            raise ValueError(f"Failed to generate story: {str(e)}")
            
    except ValueError as ve:
        logger.error(f"Validation error in start_story: {str(ve)}")
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        logger.error(f"Error in start_story: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/continue-story', methods=['POST'])
def continue_story():
    try:
        logger.debug("Received continue-story request")
        data = request.json
        logger.debug(f"Request data: {data}")
        
        # Validate required fields
        if not data:
            raise ValueError("No data received in request")
            
        grade_level = data.get('gradeLevel')
        if not grade_level:
            raise ValueError("gradeLevel is required")
            
        story_so_far = data.get('storySoFar')
        if not story_so_far:
            raise ValueError("storySoFar is required")
            
        challenge = data.get('challenge')
        
        logger.debug(f"Building continue crew with grade_level={grade_level}")
        logger.debug(f"Story so far: {story_so_far[:100]}...")  # Log first 100 chars of story
        
        try:
            crew = build_continue_only_crew()
        except Exception as e:
            logger.error(f"Error building crew: {str(e)}")
            logger.error(traceback.format_exc())
            raise ValueError(f"Failed to initialize story continuation: {str(e)}")
        
        logger.debug("Kicking off crew")
        try:
            result = str(crew.kickoff(inputs={
                "grade_level": grade_level,
                "story_so_far": story_so_far,
                "challenge": challenge,
                "is_single_sentence": True  # Request a single sentence response
            })).strip()
            
            if not result:
                raise ValueError("No story continuation was generated")
            
            # Moderation check
            is_safe, categories = moderate_content(result)
            if not is_safe:
                return jsonify({"error": f"Content blocked for safety reasons: {categories}"}), 400
            
            logger.debug(f"Generated continuation: {result}")
            return jsonify({"story": result})
        except Exception as e:
            logger.error(f"Error generating continuation: {str(e)}")
            logger.error(traceback.format_exc())
            raise ValueError(f"Failed to generate story continuation: {str(e)}")
            
    except ValueError as ve:
        logger.error(f"Validation error in continue_story: {str(ve)}")
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        logger.error(f"Error in continue_story: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-image', methods=['POST'])
def generate_image():
    try:
        data = request.get_json()
        story = data.get('story', '')
        
        if not story:
            return jsonify({'error': 'Story text is required'}), 400
        
        # Preprocess the story: remove numbered lists and dialogue labels
        story_for_image = re.sub(r'\d+\.\s.*', '', story)  # Remove numbered lists
        story_for_image = re.sub(r'[A-Za-z]+:', '', story_for_image)  # Remove dialogue labels
        story_for_image = story_for_image.strip()
        
        # Create a prompt for image generation based on the story
        prompt = (
            "Absolutely do not include any text, words, numbers, or writing of any kind in the image. "
            "No signs, no books, no visible writing. "
            "Create a beautiful, child-friendly illustration summarizing this story visually: "
            f"{story_for_image[:1000]}"
        )
        
        # Generate image using OpenAI's DALL-E 3 (GPT-4o doesn't generate images, DALL-E 3 is the current image generation model)
        response = openai.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        
        # Get the image URL
        image_url = response.data[0].url
        
        # Generate a unique filename
        filename = f"story_image_{uuid.uuid4().hex[:8]}.png"
        
        # Save the image URL to a JSON file for reference
        image_data = {
            'filename': filename,
            'url': image_url,
            'story': story[:200] + "..." if len(story) > 200 else story,
            'timestamp': str(uuid.uuid4())
        }
        
        with open(os.path.join(IMAGES_DIR, f"{filename}.json"), 'w') as f:
            json.dump(image_data, f)
        
        return jsonify({
            'success': True,
            'image_url': image_url,
            'filename': filename
        })
        
    except Exception as e:
        print(f"Error generating image: {str(e)}")
        return jsonify({'error': f'Failed to generate image: {str(e)}'}), 500

@app.route('/api/images/<filename>')
def get_image(filename):
    """Serve generated images"""
    return send_from_directory(IMAGES_DIR, filename)

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    logger.info(f"Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True) 