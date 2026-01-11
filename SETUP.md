# Original Grant Prospecting Tool - Backend Version

## 📦 Files for the Original Version

This is the **first version** we built - clean interface, API keys stored on the server, no client-side key management.

### Core Files:
1. **grant-prospecting.html** - Frontend (no API key inputs visible)
2. **backend-server.js** - Backend server
3. **word-generator.js** - Word document generator
4. **package.json** - Dependencies

---

## 🎯 How This Version Works

### User Side:
- Opens `grant-prospecting.html`
- Sees only: system prompt, context parameters, organization description
- **No API key inputs** - completely hidden from users
- Clicks "Start Grant Research"
- Gets results and downloads Word documents

### Server Side:
- API keys stored in `.env` file on server
- Backend handles all Claude API calls
- Backend generates Word documents
- Users never see or manage API keys

---

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

This installs:
- express (web server)
- cors (cross-origin requests)
- axios (HTTP client)
- docx (Word generation)
- dotenv (environment variables)
- express-rate-limit (security)

### 2. Create `.env` File
```bash
# Create the file
touch .env

# Add your API keys
echo 'CLAUDE_API_KEY=sk-ant-your-key-here' >> .env
echo 'CANDID_API_KEY=your-candid-key-here' >> .env
echo 'PORT=3000' >> .env
```

Or manually create `.env`:
```env
# Claude API Key (Required)
CLAUDE_API_KEY=sk-ant-api03-your-actual-key-here

# Candid API Key (Optional)
CANDID_API_KEY=your-candid-key-if-you-have-one

# Server Port
PORT=3000
```

### 3. Start the Backend
```bash
node backend-server.js
```

You should see:
```
Grant Prospecting Backend running on port 3000
```

### 4. Configure Frontend
Open `grant-prospecting.html` and update line ~10:

```javascript
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000'
    : 'https://your-deployed-backend.herokuapp.com';  // ← Update this!
```

### 5. Open Frontend
- For local testing: Just open `grant-prospecting.html` in browser
- For production: Upload to web host or GitHub Pages

---

## 📁 File Structure

```
grantprospecting/
├── grant-prospecting.html    # Frontend (users see this)
├── backend-server.js          # Backend API server
├── word-generator.js          # Word document creation
├── package.json               # Node dependencies
├── .env                       # API keys (create this - never commit!)
└── .gitignore                # Git ignore file
```

### Create `.gitignore`:
```
node_modules/
.env
*.log
.DS_Store
```

---

## 🔧 Backend Endpoints

### POST `/api/research`
Performs grant research using Claude

**Request:**
```json
{
  "prompt": "System prompt text...",
  "orgDescription": "Organization description...",
  "contextParameters": [
    {"id": "education", "label": "Education", "description": "K-12 programs"}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [{"text": "Grant research results..."}]
  }
}
```

### POST `/api/generate-word`
Generates Word document from results

**Request:**
```json
{
  "text": "Grant results...",
  "orgDescription": "Org description...",
  "contextParameters": [...],
  "timestamp": "2026-01-11T..."
}
```

**Response:** Binary `.docx` file download

### GET `/api/health`
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-11T..."
}
```

---

## 🚀 Deployment Options

### Option 1: Heroku (Recommended)
```bash
# Install Heroku CLI, then:
heroku login
heroku create your-app-name
heroku config:set CLAUDE_API_KEY=sk-ant-your-key
heroku config:set CANDID_API_KEY=your-candid-key
git push heroku main

# Your backend will be at:
# https://your-app-name.herokuapp.com
```

### Option 2: Railway
1. Go to railway.app
2. "New Project" → "Deploy from GitHub"
3. Select your repository
4. Add environment variables in dashboard:
   - `CLAUDE_API_KEY`
   - `CANDID_API_KEY`
   - `PORT`
5. Deploy automatically

### Option 3: DigitalOcean App Platform
1. Create new app from GitHub
2. Configure:
   - Build: `npm install`
   - Run: `node backend-server.js`
3. Add environment variables
4. Deploy

---

## 🔒 Security

### API Keys:
- ✅ Stored in `.env` on server only
- ✅ Never exposed to client/browser
- ✅ Never committed to Git (use .gitignore)

### Rate Limiting:
- Built-in: 10 requests per 15 minutes per IP
- Prevents abuse

### CORS:
- Configured for cross-origin requests
- Update in `backend-server.js` if needed

---

## 🧪 Testing

### Test Backend is Running:
```bash
# Health check
curl http://localhost:3000/api/health

# Should return:
{"status":"healthy","timestamp":"..."}
```

### Test Research Endpoint:
```bash
curl -X POST http://localhost:3000/api/research \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Find grants","orgDescription":"We help youth","contextParameters":[]}'
```

### Test Frontend:
1. Open `grant-prospecting.html` in browser
2. Fill in org description
3. Select context parameters
4. Click "Start Grant Research"
5. Should see loading spinner, then results
6. Click "Download Word" to test Word generation

---

## 🐛 Troubleshooting

### "Research request failed"
- Check backend is running: `node backend-server.js`
- Verify `API_BASE_URL` in HTML matches backend URL
- Check browser console for errors

### "Invalid API key"
- Verify `.env` has correct Claude API key
- Key should start with `sk-ant-`
- Restart backend after changing `.env`

### "Failed to generate Word document"
- Check `word-generator.js` exists
- Verify `docx` package installed: `npm install docx`
- Check backend console for errors

### CORS errors
- Update CORS configuration in `backend-server.js`
- For localhost: should work by default
- For production: add your frontend domain to allowed origins

---

## 📊 Key Differences from Standalone Version

| Feature | Backend Version (This) | Standalone Version |
|---------|----------------------|-------------------|
| API Keys | Stored on server | Stored in browser |
| User Management | Not needed | Each user manages own key |
| Setup | Requires server deployment | Just open HTML file |
| Best For | Teams, organizations | Individuals |
| Security | Higher (keys on server) | Lower (keys in browser) |
| Maintenance | Requires server upkeep | None needed |
| Cost | Hosting fees (~$7/mo) | Free |

---

## ✨ This Version is Best For:

✅ **Organizations** - Centralized API key management  
✅ **Teams** - Multiple users, one API key  
✅ **Professional Use** - Better security model  
✅ **Users who want simplicity** - No API key management for end users  
✅ **Controlled environments** - IT team manages infrastructure  

---

## 📝 Summary

The original backend version is clean and professional:
- Users never see API keys
- Simple interface - just context parameters and org description
- All API management handled server-side
- Word export through backend
- Better for teams and organizations

**To use:**
1. Download the 4 files above
2. Create `.env` with your API key
3. Run `npm install`
4. Run `node backend-server.js`
5. Open `grant-prospecting.html` in browser
6. Done!

No user-side API key management, no credential systems, just a clean tool that works.
