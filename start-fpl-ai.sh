#!/bin/bash

echo "🚀 Starting FPL AI Assistant with Ollama LLM..."

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama not found. Installing..."
    curl -fsSL https://ollama.ai/install.sh | sh
fi

# Check if model exists
if ! ollama list | grep -q "llama3.1:8b"; then
    echo "📥 Downloading Llama 3.1 8B model..."
    ollama pull llama3.1:8b
fi

# Start Ollama service in background
echo "🧠 Starting Ollama service..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to be ready..."
sleep 5

# Test Ollama connection
until curl -s http://localhost:11434/api/tags > /dev/null; do
    echo "⏳ Waiting for Ollama..."
    sleep 2
done

echo "✅ Ollama ready!"

# Start search server
echo "🔍 Starting search server..."
node search-server.js &
SEARCH_PID=$!

echo "✅ FPL AI Assistant ready!"
echo "🌐 Open fpl-ai-assistant.html in your browser"
echo ""
echo "💡 To stop services:"
echo "   kill $OLLAMA_PID $SEARCH_PID"

# Wait for user interrupt
wait