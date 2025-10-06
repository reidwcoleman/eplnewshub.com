// Test script for FPL AI Assistant LLM integration
async function testLLMIntegration() {
    console.log('🧪 Testing FPL AI Assistant LLM Integration...\n');
    
    // Test 1: Check if search server is running
    try {
        const response = await fetch('http://localhost:3001/api/ai-query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: "Who should I captain this week?",
                context: "Testing FPL AI integration"
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Search server responding');
            console.log('📊 Response source:', data.source);
            console.log('💬 Sample response:', data.response.substring(0, 150) + '...\n');
        } else {
            console.log('❌ Search server not responding properly');
        }
    } catch (error) {
        console.log('❌ Cannot connect to search server:', error.message);
        console.log('💡 Make sure to run: node search-server.js\n');
    }
    
    // Test 2: Check Ollama directly
    try {
        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama3.1:8b',
                prompt: 'Hello, can you help with Fantasy Premier League?',
                stream: false
            })
        });
        
        if (ollamaResponse.ok) {
            const data = await ollamaResponse.json();
            console.log('✅ Ollama is running and responding');
            console.log('🤖 Model response:', data.response.substring(0, 100) + '...\n');
        } else {
            console.log('❌ Ollama not responding');
        }
    } catch (error) {
        console.log('❌ Ollama not available:', error.message);
        console.log('💡 Make sure Ollama is installed and running:');
        console.log('   1. ollama serve');
        console.log('   2. ollama pull llama3.1:8b\n');
    }
    
    // Test 3: Check model availability
    try {
        const listResponse = await fetch('http://localhost:11434/api/tags');
        if (listResponse.ok) {
            const models = await listResponse.json();
            console.log('📋 Available models:', models.models?.map(m => m.name).join(', ') || 'None');
        }
    } catch (error) {
        console.log('Cannot check available models');
    }
}

// Run the test
testLLMIntegration().then(() => {
    console.log('\n🎯 Integration test complete!');
    console.log('\n📖 Setup instructions:');
    console.log('1. Install Ollama: curl -fsSL https://ollama.ai/install.sh | sh');
    console.log('2. Start Ollama: ollama serve');
    console.log('3. Download model: ollama pull llama3.1:8b');
    console.log('4. Start search server: node search-server.js');
    console.log('5. Open fpl-ai-assistant.html in browser');
    process.exit(0);
});