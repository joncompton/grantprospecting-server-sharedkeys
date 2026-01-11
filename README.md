# Grant Prospecting Tool - Backend Version

AI-powered grant discovery using Claude Research Mode and Candid data. API keys stored securely on the server - users never see or manage them.

## 🎯 What This Is

- API keys are stored on the server (in `.env` file)
- Users see only: system prompt, context parameters, organization description
- **No API key inputs in the interface** - completely hidden
- Backend handles all Claude API calls
- Professional Word document export

Perfect for teams and organizations who want centralized API key management.

---

## 🚀 Quick Start (5 minutes)

### 1. Download Files
Download these 7 files:
- `grant-prospecting.html`
- `backend-server.js`
- `word-generator.js`
- `package.json`
- `.env`
- `.gitignore`
- `SETUP.md` (detailed guide)

### 2. Install Dependencies
```bash
npm install
```

### 3. Add Your API Key
Edit:
```env
CLAUDE_API_KEY=sk-ant-your-actual-key-here
```

### 4. Start Backend
```bash
node backend-server.js
```

### 5. Open Frontend
Open `grant-prospecting.html` in your browser

**Done!** 🎉

---

## 📁 File Overview

| File | Purpose |
|------|---------|
| `grant-prospecting.html` | Frontend interface (what users see) |
| `backend-server.js` | API server (handles Claude calls) |
| `word-generator.js` | Creates Word documents |
| `package.json` | Node.js dependencies |
| `.env` | API keys (YOU create this from example) |
| `.gitignore` | Prevents committing sensitive files |

---

## 🎨 User Interface

Users see:
- ✅ System Prompt editor
- ✅ 20+ Context Parameter checkboxes (501c3, Education, Health, etc.)
- ✅ Organization Description textarea
- ✅ "Start Grant Research" button
- ✅ Results display
- ✅ "Download Word" button

Users **DON'T** see:
- ❌ API key inputs
- ❌ Authentication forms
- ❌ Settings or configuration

---

## 🔒 Security

- API keys stored in `.env` file on server
- Never exposed to browser/client
- Never committed to Git (`.gitignore` protects you)
- Rate limiting built-in (10 requests per 15 min)
- CORS configured

---

## 🌐 Deployment

### For Testing (Local):
```bash
# Just run the backend
node backend-server.js

# Open grant-prospecting.html in browser
# That's it!
```

### For Production:

**Heroku (Easiest):**
```bash
heroku create your-app-name
heroku config:set CLAUDE_API_KEY=sk-ant-your-key
git push heroku main
```
Then update `API_BASE_URL` in `grant-prospecting.html` to your Heroku URL.

**Railway, DigitalOcean, or any Node.js host:**
See `ORIGINAL_VERSION_SETUP.md` for detailed deployment guides.

---

## 💡 Why This Version?

Choose this if you:
- ✅ Want users to NOT see/manage API keys
- ✅ Have a team sharing one API key
- ✅ Want centralized control
- ✅ Can deploy a backend server
- ✅ Prefer professional architecture

Choose the **standalone version** if you:
- ❌ Don't want to manage a server
- ❌ Are just one person
- ❌ Want it to work immediately with no setup
- ❌ Are okay with API keys in browser storage

---

## 🆚 Comparison

| Feature | This (Backend) | Standalone |
|---------|---------------|------------|
| API Keys | Server (.env) | Browser (localStorage) |
| User Setup | None | Enter API key once |
| Deployment | Requires server | Just open HTML |
| Best For | Teams | Individuals |
| Security | Higher | Lower |
| Maintenance | Server upkeep | None |
| Cost | ~$7/month hosting | Free |

---

## 📝 Usage Example

1. User opens `grant-prospecting.html`
2. Selects context parameters:
   - ☑ 501(c)(3) Status
   - ☑ Education
   - ☑ Youth Development
   - ☑ Local/Community Focus
3. Describes organization:
   > "We provide after-school tutoring for underserved youth in Richmond, VA"
4. Clicks "Start Grant Research"
5. Claude searches for relevant grants
6. Results appear in seconds
7. Clicks "Download Word" for professional report

---

## 🔧 Configuration

**Frontend (`grant-prospecting.html`):**
Line 10 - Update backend URL:
```javascript
const API_BASE_URL = 'https://your-backend-url.herokuapp.com';
```

**Backend (`.env`):**
```env
CLAUDE_API_KEY=sk-ant-your-key
CANDID_API_KEY=optional-candid-key
PORT=3000
```
---

## 🐛 Troubleshooting

**"Research request failed"**
→ Backend not running. Run: `node backend-server.js`

**"Invalid API key"**
→ Check `.env` has correct key starting with `sk-ant-`

**Can't download Word**
→ Make sure `docx` installed: `npm install docx`

**CORS errors**
→ Update `API_BASE_URL` in HTML to match your backend URL

More help: See `ORIGINAL_VERSION_SETUP.md`

---

## 📚 Documentation Files

- **ORIGINAL_VERSION_SETUP.md** - Complete setup guide (read this for details!)
- **README.md** - This file (quick overview)
- **.env.example-original** - Template for your `.env` file

---

## 🎉 Summary

- No user-facing API key management
- Server-side API calls
- Word document export
- 20+ context parameters
- Better for organizations and teams.

**Get Started:** Download the files above, run `npm install`, add your API key to `.env`, and run `node backend-server.js`.

---

**Questions?** See the detailed `SETUP.md` guide for everything you need to know.
