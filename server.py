from flask import Flask, request, jsonify
from flask_cors import CORS
from N2G.crew import build_prompt_only_crew, build_continue_only_crew
import os
import traceback
import logging
from dotenv import load_dotenv

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
CORS(app, resources={r"/api/*": {"origins": "*"}})

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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    logger.info(f"Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True) 