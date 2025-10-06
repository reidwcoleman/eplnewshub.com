# How to Add Your Hugging Face Token

## Quick Setup (2 steps)

1. **Open the file `fpl-ai-huggingface-token.js`**
2. **Find line 10 and replace `YOUR_HF_TOKEN_HERE` with your actual token:**

```javascript
// Line 10 - Replace this:
this.hfToken = 'YOUR_HF_TOKEN_HERE';

// With your actual token (example):
this.hfToken = 'hf_abcdefghijklmnopqrstuvwxyz123456';
```

## What You Get With Your Token

### ✅ Premium Models
- **Flan-T5-XL** - Google's advanced text generation
- **DialoGPT-Large** - Microsoft's conversational AI
- **Blenderbot-1B** - Facebook's chat model
- **GPT-2-Large** - OpenAI's text generation

### ✅ Better Performance
- Higher rate limits (no 503 errors)
- Faster response times
- More reliable connections
- Longer conversation memory

### ✅ Enhanced Features
- Better context understanding
- More natural conversations
- Improved FPL analysis
- General knowledge capabilities

## How to Get a Free Token

1. Go to: https://huggingface.co/settings/tokens
2. Click "New token"
3. Name it (e.g., "FPL Assistant")
4. Keep "Read" permissions
5. Click "Generate token"
6. Copy the token (starts with `hf_`)

## Testing Your Token

After adding your token, open the browser console (F12) and look for:
- ✅ "Hugging Face token configured!"
- ✅ "Hugging Face API working with token!"

If you see these messages, your token is working!

## Security Note

Your token is only stored locally in your browser. It's never sent to any server except Hugging Face's official API.