# StoryQuest: Turn-Based Story Adventure

An interactive story-writing game where players collaborate with an AI to create engaging stories while completing writing challenges.

## Features

- Turn-based story writing with AI collaboration
- Grade-level appropriate writing challenges
- Voice input support
- Real-time challenge tracking
- Timer-based gameplay
- Score tracking and saving

## Prerequisites

- Node.js (v14 or higher)
- Python 3.8 or higher
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/storyquest.git
cd storyquest
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory with your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```

## Running the Application

1. Start the main server:
```bash
node server.js
```

2. Start the story server:
```bash
python story-server.py
```

3. Open your browser and navigate to `http://localhost:8000`

## Project Structure

- `index.html` - Main game interface
- `game.js` - Game logic and UI interactions
- `server.js` - Main Express server
- `story-server.py` - Story generation server
- `styles.css` - Game styling
- `config.js` - Configuration and environment variables

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for providing the GPT API
- Express.js for the web server
- Flask for the Python server 