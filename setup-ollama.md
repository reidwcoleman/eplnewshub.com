# FPL AI Assistant - Ollama Setup Guide

## Overview
Your FPL AI Assistant now uses Ollama (open source LLM) instead of hardcoded responses. This provides more natural, contextual conversations while maintaining the existing data integration.

## Quick Setup

### 1. Install Ollama
```bash
# Linux/macOS
curl -fsSL https://ollama.ai/install.sh | sh

# Or download from: https://ollama.ai/download
```

### 2. Pull the Model
```bash
# Download the model (this will take a few minutes)
ollama pull llama3.1:8b
```

### 3. Start Ollama Service
```bash
# Start Ollama service (runs on port 11434)
ollama serve
```

### 4. Start Your Servers
```bash
# Terminal 1: Start search server with Ollama integration
node search-server.js

# Terminal 2: Serve your website (if needed)
python -m http.server 8000
# Or any static file server
```

## How It Works

1. **User asks question** → FPL AI Assistant analyzes intent and extracts player data
2. **Calls Ollama LLM** → Sends structured prompt to local Llama 3.1 model  
3. **Enhances response** → Adds your real player data, community insights, and search results
4. **Displays answer** → Shows natural LLM response + your structured data

## Models Supported

- `llama3.1:8b` (default) - Good balance of speed and quality
- `llama3.1:70b` - Higher quality, slower (if you have powerful hardware)
- `mistral:7b` - Faster alternative
- `qwen2.5:7b` - Another good option

To change models, update the `model` field in `search-server.js` line 43.

## Benefits

✅ **Natural conversations** - No more robotic responses  
✅ **Preserves your data** - Still uses your player database and community insights  
✅ **Offline capable** - Works without internet once model is downloaded  
✅ **Privacy focused** - All processing happens locally  
✅ **Customizable** - Easy to adjust prompts and model parameters  

## Troubleshooting

**Ollama not responding?**
- Check if Ollama service is running: `ollama list`
- Restart service: `ollama serve`

**Model not found?**
- Ensure model is pulled: `ollama pull llama3.1:8b`

**Poor responses?**
- Try a larger model: `ollama pull llama3.1:70b`
- Adjust temperature in `search-server.js` (lower = more focused)

## Performance Notes

- **8B model**: ~4GB RAM, fast responses
- **70B model**: ~40GB RAM, better quality but slower
- First query after restart takes longer (model loading)