const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();
const port = 8000;

// Enable CORS
app.use(cors());

// Serve static files
app.use(express.static('.'));

// Endpoint to get environment variables
app.get('/api/config', (req, res) => {
    // Check if environment variables exist
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        return res.status(500).json({
            error: 'Missing Supabase configuration'
        });
    }

    // Return the configuration
    res.json({
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!'
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 