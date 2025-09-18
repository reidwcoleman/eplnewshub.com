# FPL AI Assistant with Ollama (FREE Local AI)

## Overview
Your FPL AI Assistant now uses **Ollama** - a free, open-source solution that runs AI models locally on your machine. No API keys, no monthly fees, no usage limits!

## Setup Instructions

### 1. Install Ollama (if not already installed)
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Start the FPL AI Server
```bash
# Run this from your project directory
./start-ollama-fpl.sh
```

This script will:
- Start the Ollama server
- Download the Mistral model (first time only, ~4.4GB)
- Start the Node.js FPL server on port 3001
- Connect your FPL AI Assistant to use local AI

### 3. Open Your FPL AI Assistant
Open `fpl-ai-assistant.html` in your browser and start chatting!

## How It Works

1. **Ollama Server** - Runs the AI model locally on your machine
2. **FPL Server** (port 3001) - Connects your website to Ollama
3. **FPL AI Assistant** - Your HTML page that provides the chat interface

## Features

- ✅ **100% FREE** - No API costs ever
- ✅ **Unlimited Messages** - Chat as much as you want
- ✅ **Private** - All processing happens on your computer
- ✅ **Fast** - No internet latency for AI responses
- ✅ **FPL Optimized** - Pre-configured for Fantasy Premier League advice

## Manual Start (Alternative Method)

If you prefer to start services manually:

```bash
# Terminal 1 - Start Ollama
ollama serve

# Terminal 2 - Pull model (first time only)
ollama pull mistral

# Terminal 3 - Start FPL server
node ollama-fpl-server.js
```

## Troubleshooting

### "Ollama server is not running"
Make sure Ollama is running: `ollama serve`

### "Model not found"
Pull the Mistral model: `ollama pull mistral`

### Slow first response
The first response after starting may be slow as the model loads into memory. Subsequent responses will be much faster.

## Customization

### Try Different Models

You can use other Ollama models for different capabilities:

```bash
# Smaller, faster model
ollama pull phi

# Larger, smarter model  
ollama pull llama2:13b

# Code-focused model
ollama pull codellama
```

Then update `ollama-fpl-server.js` line 29 to use your chosen model:
```javascript
model: 'phi',  // or 'llama2:13b', etc.
```

## System Requirements

- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 5GB for Mistral model
- **OS**: Linux, macOS, or Windows (with WSL)

## Benefits Over Paid APIs

| Feature | Ollama (Local) | OpenAI/Claude API |
|---------|---------------|-------------------|
| Cost | FREE | $20-200/month |
| Privacy | 100% Private | Data sent to servers |
| Speed | Fast (after load) | Depends on internet |
| Limits | Unlimited | Token/request limits |
| Internet | Not required | Required |

## Support

For issues or questions:
1. Check Ollama docs: https://ollama.ai
2. Check if Ollama is running: `ollama list`
3. Restart services: `./start-ollama-fpl.sh`

---

Enjoy your FREE, unlimited FPL AI Assistant! 🚀⚽