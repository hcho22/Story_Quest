// Supabase configuration
let SUPABASE_URL = '';
let SUPABASE_ANON_KEY = '';

// Fetch configuration from server
async function loadConfig() {
    try {
        const response = await fetch('/api/config', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const config = await response.json();
        if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
            throw new Error('Missing Supabase credentials in response');
        }
        
        SUPABASE_URL = config.SUPABASE_URL;
        SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY;
        console.log('Configuration loaded successfully');
    } catch (error) {
        console.error('Error loading configuration:', error);
        // Set default values or handle the error appropriately
        SUPABASE_URL = '';
        SUPABASE_ANON_KEY = '';
    }
}

// Load configuration when the script loads
loadConfig(); 