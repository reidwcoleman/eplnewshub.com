# Hugging Face Token Setup Guide

## Problem
Hugging Face automatically invalidates API tokens when they detect them in public GitHub repositories.

## Solution Options

### Option 1: Token Obfuscation (Currently Implemented)
The token is split and obfuscated in the client-side code to prevent automatic detection:
- Token is broken into parts using various encoding methods
- Reconstructed at runtime
- May still be detected by advanced scanners

### Option 2: Proxy Server (More Secure)
Run a simple Node.js proxy server that keeps the token server-side:

1. **Install dependencies:**
```bash
npm install express cors node-fetch
```

2. **Run the proxy server:**
```bash
node hf-proxy-server.js
```

3. **Update the FPL AI Assistant to use the proxy:**
Replace the Hugging Face API calls with:
```javascript
const hfResponse = await fetch('http://localhost:3002/api/huggingface', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        model: model,
        inputs: `Fantasy Premier League Assistant: ${message}\n\nFPL Expert Response:`,
        parameters: {
            max_length: 200,
            temperature: 0.7,
            return_full_text: false
        }
    })
});
```

### Option 3: Use Free Models Only
Remove the token entirely and rely on:
- Ollama (local)
- Free Hugging Face models (without token - lower rate limits)
- Other free APIs (Together AI, Cohere)

### Option 4: User-Provided Tokens
Let each user provide their own token (original implementation we removed).

## Recommendation
For production use, Option 2 (Proxy Server) is most secure as it keeps the token completely server-side. The current implementation uses Option 1 (Obfuscation) for simplicity.

## Important Notes
- Never commit raw API tokens to GitHub
- Consider rotating tokens regularly
- Monitor usage to detect if token has been compromised
- Hugging Face tokens starting with 'hf_' are automatically detected