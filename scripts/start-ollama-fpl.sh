#!/bin/bash

echo "🚀 Starting FPL AI Assistant with Ollama"
echo "========================================"

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed. Please install it first:"
    echo "   curl -fsSL https://ollama.com/install.sh | sh"
    exit 1
fi

# Start Ollama serve in background
echo "Starting Ollama server..."
ollama serve > /dev/null 2>&1 &
OLLAMA_PID=$!

# Wait for Ollama to start
sleep 3

# Check if Mistral model exists
echo "Checking for Mistral model..."
if ! ollama list | grep -q "mistral"; then
    echo "📦 Mistral not found. Pulling model (this may take a few minutes)..."
    ollama pull mistral
fi

# Install npm dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

# Start the FPL server
echo "✅ Starting FPL AI Server on http://localhost:3001"
echo "======================================"
echo "📌 Your FPL AI Assistant is ready!"
echo "📌 Open fpl-ai-assistant.html in your browser"
echo "📌 The AI will use local Ollama (FREE) instead of paid APIs"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start Node.js server
node ollama-fpl-server.js

# Cleanup on exit
trap "kill $OLLAMA_PID 2>/dev/null; exit" EXIT INT TERM