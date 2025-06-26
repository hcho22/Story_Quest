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

# Create images directory if it doesn't exist
IMAGES_DIR = 'generated_images'
if not os.path.exists(IMAGES_DIR):
    os.makedirs(IMAGES_DIR)

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
        
        # Create a prompt for image generation based on the story
        prompt = (
            f"Create a beautiful, child-friendly illustration for this story: {story[:1000]}. "
            "Do not include any text, words, or letters in the image. Only show the scene visually."
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