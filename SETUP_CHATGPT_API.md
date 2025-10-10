# Setting Up ChatGPT API for FPL AI Assistant

This guide will help you integrate real ChatGPT (OpenAI API) with your FPL AI Assistant.

## Prerequisites

1. **OpenAI API Key**: Get one from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Node.js**: Version 14 or higher installed
3. **A server**: To host the API proxy (local or cloud)

## Quick Setup

### Step 1: Install Dependencies

```bash
# Install the required packages
npm install express cors axios dotenv

# Or use the prepared package.json
cp package-api.json package.json
npm install
```

### Step 2: Configure API Key

Create a `.env` file in your project root:

```env
OPENAI_API_KEY=your_actual_api_key_here
PORT=3001
OPENAI_MODEL=gpt-3.5-turbo
```

### Step 3: Start the API Server

```bash
# Run the API proxy server
node fpl-ai-api-proxy.js

# Or with npm script
npm start
```

The server will start on `http://localhost:3001`

### Step 4: Update Your HTML

Replace the current script reference in `fpl-ai-assistant.html`:

```html
<!-- Replace this line -->
<script src="fpl-ai-assistant-enhanced.js"></script>

<!-- With this -->
<script src="fpl-ai-assistant-gpt.js"></script>
```

### Step 5: Configure the API Endpoint

In `fpl-ai-assistant-gpt.js`, update the API endpoint for production:

```javascript
getApiEndpoint() {
    const isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
    
    return isDevelopment 
        ? 'http://localhost:3001/api/chat'  // Local development
        : 'https://your-production-server.com/api/chat'; // Your production API server
}
```

## Deployment Options

### Option 1: Local Development
- Run the API server locally
- Perfect for testing
- No deployment needed

### Option 2: Deploy to Vercel
1. Create a new Vercel project
2. Deploy the API proxy as a serverless function
3. Update the production endpoint

### Option 3: Deploy to Heroku
1. Create a Heroku app
2. Add the OpenAI API key as config var
3. Deploy the API proxy
4. Update the production endpoint

### Option 4: Deploy to AWS/GCP/Azure
- Use their respective services
- Set up environment variables
- Configure CORS properly

## How It Works

1. **User sends message** → Frontend (fpl-ai-assistant-gpt.js)
2. **Frontend sends to proxy** → API Proxy Server (fpl-ai-api-proxy.js)
3. **Proxy calls OpenAI** → OpenAI ChatGPT API
4. **Response flows back** → User sees AI response

## Features

- ✅ Real ChatGPT responses
- ✅ FPL-specialized system prompt
- ✅ Conversation context maintained
- ✅ Fallback responses when API unavailable
- ✅ Secure API key handling (server-side)
- ✅ CORS configured for production
- ✅ Rate limiting ready
- ✅ Error handling

## Cost Considerations

- **GPT-3.5-turbo**: ~$0.002 per 1K tokens (cheaper, good quality)
- **GPT-4**: ~$0.03 per 1K tokens (best quality, more expensive)
- Average conversation: 500-1000 tokens
- Estimated cost: $0.001-0.03 per conversation

## Testing

1. Start the API server
2. Open your FPL AI Assistant page
3. Try these test messages:
   - "Who should I captain this week?"
   - "What's the weather like?"
   - "Tell me a joke"
   - "Should I wildcard?"

## Troubleshooting

### API Key Issues
- Make sure your `.env` file is in the root directory
- Check that the API key is valid
- Ensure you have credits in your OpenAI account

### CORS Errors
- Update the `cors` configuration in `fpl-ai-api-proxy.js`
- Add your domain to the allowed origins

### No Response
- Check if the API server is running
- Verify the endpoint URL is correct
- Check browser console for errors

## Security Best Practices

1. **Never expose API key in frontend code**
2. **Use environment variables**
3. **Implement rate limiting** (optional but recommended)
4. **Add request validation**
5. **Use HTTPS in production**

## Optional Enhancements

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

### Request Validation
```javascript
app.post('/api/chat', (req, res) => {
    const { message } = req.body;
    if (!message || message.length > 1000) {
        return res.status(400).json({ error: 'Invalid message' });
    }
    // ... rest of the code
});
```

## Support

If you encounter issues:
1. Check the server logs
2. Verify API key is correct
3. Ensure all dependencies are installed
4. Check network/firewall settings

---

**Note**: The fallback mode (without API key) still provides intelligent FPL responses using pattern matching and pre-programmed logic.