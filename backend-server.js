// backend-server.js
// Example Node.js/Express backend for secure API handling
// This prevents exposing API keys in client-side code

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting to prevent abuse
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // limit each IP to 10 requests per windowMs
});

app.use('/api/', limiter);

// Environment variables (create .env file)
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CANDID_API_KEY = process.env.CANDID_API_KEY;

// In-memory session storage (use Redis in production)
const sessions = new Map();

// ============================================
// Authentication Endpoints
// ============================================

// Authenticate with Anthropic credentials
app.post('/api/auth/claude/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // In production, this would authenticate with Anthropic's auth system
    // For now, we'll validate against environment variables or a user database
    
    // Option 1: Use a predefined mapping of credentials to API keys
    const userCredentials = JSON.parse(process.env.CLAUDE_USERS || '{}');
    const userApiKey = userCredentials[email];
    
    if (!userApiKey || !validatePassword(password, email)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session
    const sessionId = generateSessionId();
    sessions.set(sessionId, {
      email: email,
      claudeApiKey: userApiKey,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    });

    res.json({
      success: true,
      sessionId: sessionId,
      expiresAt: sessions.get(sessionId).expiresAt
    });

  } catch (error) {
    console.error('Claude authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Authenticate with Candid credentials
app.post('/api/auth/candid/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Similar to Claude authentication
    const userCredentials = JSON.parse(process.env.CANDID_USERS || '{}');
    const userApiKey = userCredentials[email];
    
    if (!userApiKey || !validatePassword(password, email)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      success: true,
      apiKey: userApiKey
    });

  } catch (error) {
    console.error('Candid authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Session-based authentication middleware
function authenticateSession(req, res, next) {
  const sessionId = req.headers['x-session-id'];
  
  if (!sessionId) {
    return res.status(401).json({ error: 'Session ID required' });
  }

  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  if (session.expiresAt < Date.now()) {
    sessions.delete(sessionId);
    return res.status(401).json({ error: 'Session expired' });
  }

  req.session = session;
  next();
}

// Helper functions
function generateSessionId() {
  return require('crypto').randomBytes(32).toString('hex');
}

function validatePassword(password, email) {
  // In production, use proper password hashing (bcrypt, argon2)
  // This is a simplified example
  const hashedPasswords = JSON.parse(process.env.USER_PASSWORDS || '{}');
  return hashedPasswords[email] === password; // In production: bcrypt.compare(password, hash)
}

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  if (sessionId) {
    sessions.delete(sessionId);
  }
  res.json({ success: true });
});

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(sessionId);
    }
  }
}, 60 * 60 * 1000); // Every hour

// ============================================
// Claude API Endpoint (supports both auth methods)
// ============================================
app.post('/api/research', async (req, res) => {
  try {
    const { prompt, orgDescription, contextParameters } = req.body;

    // Validate input
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Determine API key source
    let claudeApiKey;
    const sessionId = req.headers['x-session-id'];
    const directApiKey = req.headers['x-claude-api-key'];

    if (sessionId) {
      // Session-based authentication (from credentials)
      const session = sessions.get(sessionId);
      if (!session || session.expiresAt < Date.now()) {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }
      claudeApiKey = session.claudeApiKey;
    } else if (directApiKey) {
      // Direct API key authentication
      claudeApiKey = directApiKey;
    } else if (CLAUDE_API_KEY) {
      // Fallback to server's API key
      claudeApiKey = CLAUDE_API_KEY;
    } else {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Build the full prompt
    let fullPrompt = prompt + '\n\n';
    
    if (orgDescription) {
      fullPrompt += `Organization Context:\n${orgDescription}\n\n`;
    }

    if (contextParameters && contextParameters.length > 0) {
      fullPrompt += 'Focus on grants that match these criteria:\n';
      contextParameters.forEach(ctx => {
        fullPrompt += `- ${ctx.label}: ${ctx.description}\n`;
      });
    }

    // Call Claude API
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: fullPrompt
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    // Return response to client
    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Claude API Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || 'Failed to complete research'
    });
  }
});

// ============================================
// Candid API Endpoint
// ============================================
app.post('/api/candid/search', async (req, res) => {
  try {
    const { 
      focusAreas, 
      geographicScope, 
      grantSize,
      organizationType 
    } = req.body;

    // Build Candid API query
    // Note: Adjust based on actual Candid API documentation
    const candidResponse = await axios.get(
      'https://api.candid.org/v1/grants/search',
      {
        params: {
          focus_areas: focusAreas?.join(','),
          geographic_scope: geographicScope,
          min_amount: grantSize?.min,
          max_amount: grantSize?.max,
          organization_type: organizationType
        },
        headers: {
          'Authorization': `Bearer ${CANDID_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      data: candidResponse.data
    });

  } catch (error) {
    console.error('Candid API Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to query Candid database'
    });
  }
});

// ============================================
// Combined Research Endpoint
// ============================================
app.post('/api/combined-research', async (req, res) => {
  try {
    const { 
      prompt, 
      orgDescription, 
      contextParameters,
      useCandid 
    } = req.body;

    let candidData = null;

    // Step 1: Query Candid if enabled
    if (useCandid && CANDID_API_KEY) {
      try {
        // Extract focus areas from context parameters
        const focusAreas = contextParameters
          .filter(ctx => ['education', 'health', 'environment', 'arts'].includes(ctx.id))
          .map(ctx => ctx.id);

        const candidResponse = await axios.get(
          'https://api.candid.org/v1/grants/search',
          {
            params: {
              focus_areas: focusAreas.join(','),
              limit: 50
            },
            headers: {
              'Authorization': `Bearer ${CANDID_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        candidData = candidResponse.data;
      } catch (candidError) {
        console.warn('Candid query failed, continuing with Claude only:', candidError.message);
      }
    }

    // Step 2: Build enhanced prompt for Claude
    let enhancedPrompt = prompt + '\n\n';
    
    if (orgDescription) {
      enhancedPrompt += `Organization Context:\n${orgDescription}\n\n`;
    }

    if (contextParameters && contextParameters.length > 0) {
      enhancedPrompt += 'Focus on grants that match these criteria:\n';
      contextParameters.forEach(ctx => {
        enhancedPrompt += `- ${ctx.label}: ${ctx.description}\n`;
      });
      enhancedPrompt += '\n';
    }

    if (candidData) {
      enhancedPrompt += 'Additionally, here is grant data from Candid database:\n';
      enhancedPrompt += JSON.stringify(candidData, null, 2);
      enhancedPrompt += '\n\nPlease analyze these grants and provide the most relevant opportunities.';
    }

    // Step 3: Query Claude
    const claudeResponse = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: enhancedPrompt
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    // Step 4: Return combined results
    res.json({
      success: true,
      data: {
        analysis: claudeResponse.data,
        candidGrants: candidData,
        usedCandid: !!candidData
      }
    });

  } catch (error) {
    console.error('Combined Research Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || 'Failed to complete combined research'
    });
  }
});

// ============================================
// Health Check
// ============================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    apis: {
      claude: !!CLAUDE_API_KEY,
      candid: !!CANDID_API_KEY
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Grant Prospecting Backend running on port ${PORT}`);
  console.log(`Claude API: ${CLAUDE_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`Candid API: ${CANDID_API_KEY ? 'Configured' : 'Missing'}`);
});

// ============================================
// Example .env file
// ============================================
/*
Create a file named .env in the same directory:

# Server Configuration
PORT=3000
NODE_ENV=production

# Option 1: Use server's API keys (all users share)
CLAUDE_API_KEY=sk-ant-your-key-here
CANDID_API_KEY=your-candid-key-here

# Option 2: Map user credentials to their API keys (recommended)
# Format: {"email@example.com": "sk-ant-api-key-123"}
CLAUDE_USERS={"user1@example.com":"sk-ant-key1","user2@example.com":"sk-ant-key2"}
CANDID_USERS={"user1@example.com":"candid-key1","user2@example.com":"candid-key2"}

# User password hashes (use bcrypt in production!)
# Format: {"email@example.com": "hashed_password"}
USER_PASSWORDS={"user1@example.com":"password123","user2@example.com":"password456"}

# Note: In production, NEVER store plain passwords. Use bcrypt:
# const bcrypt = require('bcrypt');
# const hash = await bcrypt.hash('password123', 10);
*/

// ============================================
// Installation Instructions
// ============================================
/*
1. Install dependencies:
   npm init -y
   npm install express cors axios dotenv express-rate-limit bcrypt

2. Create .env file with your configuration

3. Run the server:
   node backend-server.js

4. Update frontend to use backend:
   Change fetch URL to: http://localhost:3000/api/research
   
For credential-based auth:
   - Users login with email/password
   - Backend maps credentials to API keys
   - Returns session ID for subsequent requests
   
For direct API key auth:
   - Users provide API key directly
   - Frontend passes via X-Claude-API-Key header
*/
