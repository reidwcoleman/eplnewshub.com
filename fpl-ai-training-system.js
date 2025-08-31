// FPL AI Assistant Training System with Data Learning Capabilities
class FPLAITrainingSystem {
    constructor() {
        this.trainingData = this.loadTrainingData();
        this.customResponses = new Map();
        this.playerStats = new Map();
        this.learnedPatterns = [];
        this.feedbackHistory = [];
        this.modelVersion = '1.0.0';
        this.initializeTrainingInterface();
    }

    loadTrainingData() {
        // Load existing training data from localStorage
        const saved = localStorage.getItem('fpl_ai_training_data');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.log('Creating new training dataset');
            }
        }
        
        return {
            responses: {},
            players: {},
            teams: {},
            fixtures: {},
            patterns: [],
            corrections: [],
            userFeedback: [],
            lastUpdated: new Date().toISOString()
        };
    }

    initializeTrainingInterface() {
        // Add training mode toggle
        this.addTrainingControls();
        
        // Initialize data import/export
        this.setupDataManagement();
        
        // Setup learning from user interactions
        this.setupLearningSystem();
    }

    addTrainingControls() {
        // Create training panel
        const trainingPanel = document.createElement('div');
        trainingPanel.id = 'ai-training-panel';
        trainingPanel.className = 'ai-training-panel hidden';
        trainingPanel.innerHTML = `
            <div class="training-header">
                <h3>🧠 AI Training Mode</h3>
                <button onclick="aiTrainer.togglePanel()" class="close-btn">×</button>
            </div>
            <div class="training-tabs">
                <button onclick="aiTrainer.showTab('teach')" class="tab-btn active">Teach</button>
                <button onclick="aiTrainer.showTab('data')" class="tab-btn">Data</button>
                <button onclick="aiTrainer.showTab('test')" class="tab-btn">Test</button>
                <button onclick="aiTrainer.showTab('export')" class="tab-btn">Export</button>
            </div>
            <div class="training-content">
                <div id="teach-tab" class="tab-content active">
                    <h4>Teach New Response</h4>
                    <input type="text" id="train-question" placeholder="Enter question/keyword pattern" class="train-input">
                    <textarea id="train-response" placeholder="Enter the response AI should give" class="train-textarea"></textarea>
                    <select id="response-category" class="train-select">
                        <option value="general">General</option>
                        <option value="captain">Captain Advice</option>
                        <option value="transfer">Transfer Advice</option>
                        <option value="player">Player Analysis</option>
                        <option value="strategy">Strategy</option>
                        <option value="stats">Statistics</option>
                    </select>
                    <button onclick="aiTrainer.teachResponse()" class="train-btn">Teach AI</button>
                    
                    <h4>Add Player Data</h4>
                    <div class="player-data-form">
                        <input type="text" id="player-name" placeholder="Player Name" class="train-input">
                        <input type="text" id="player-team" placeholder="Team" class="train-input">
                        <input type="number" id="player-price" placeholder="Price" step="0.1" class="train-input">
                        <input type="number" id="player-points" placeholder="Total Points" class="train-input">
                        <input type="number" id="player-ownership" placeholder="Ownership %" step="0.1" class="train-input">
                        <textarea id="player-notes" placeholder="Notes about player (injuries, form, etc.)" class="train-textarea"></textarea>
                        <button onclick="aiTrainer.addPlayerData()" class="train-btn">Add Player</button>
                    </div>
                </div>
                
                <div id="data-tab" class="tab-content">
                    <h4>Training Data Management</h4>
                    <div class="data-stats">
                        <p>📚 Learned Responses: <span id="response-count">0</span></p>
                        <p>👥 Player Profiles: <span id="player-count">0</span></p>
                        <p>📊 Pattern Matches: <span id="pattern-count">0</span></p>
                        <p>💾 Last Updated: <span id="last-updated">Never</span></p>
                    </div>
                    
                    <h4>Import Training Data</h4>
                    <textarea id="import-data" placeholder="Paste JSON data or CSV here" class="train-textarea"></textarea>
                    <button onclick="aiTrainer.importData()" class="train-btn">Import Data</button>
                    
                    <h4>Bulk Train from CSV</h4>
                    <input type="file" id="csv-upload" accept=".csv" onchange="aiTrainer.handleCSVUpload(event)">
                    <div id="csv-preview"></div>
                </div>
                
                <div id="test-tab" class="tab-content">
                    <h4>Test AI Responses</h4>
                    <input type="text" id="test-question" placeholder="Enter test question" class="train-input">
                    <button onclick="aiTrainer.testResponse()" class="train-btn">Test</button>
                    <div id="test-result" class="test-result"></div>
                    
                    <h4>Response Feedback</h4>
                    <div id="recent-responses" class="recent-responses"></div>
                </div>
                
                <div id="export-tab" class="tab-content">
                    <h4>Export Training Data</h4>
                    <button onclick="aiTrainer.exportJSON()" class="train-btn">Export as JSON</button>
                    <button onclick="aiTrainer.exportCSV()" class="train-btn">Export as CSV</button>
                    <button onclick="aiTrainer.clearData()" class="train-btn danger">Clear All Data</button>
                    
                    <h4>Backup & Restore</h4>
                    <button onclick="aiTrainer.createBackup()" class="train-btn">Create Backup</button>
                    <button onclick="aiTrainer.restoreBackup()" class="train-btn">Restore from Backup</button>
                    
                    <div id="export-result"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(trainingPanel);
        
        // Add feed mode buttons to chat interface
        const chatHeader = document.querySelector('.ai-chat-header');
        if (chatHeader) {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'mode-buttons';
            buttonContainer.style.cssText = 'display: flex; gap: 8px; margin-left: auto;';
            
            const feedBtn = document.createElement('button');
            feedBtn.id = 'feedModeMainBtn';
            feedBtn.className = 'mode-btn';
            feedBtn.innerHTML = '📝 Feed Data';
            feedBtn.onclick = () => {
                if (window.toggleFeedMode) {
                    window.toggleFeedMode();
                    // Update this button too
                    const otherBtn = document.getElementById('feedModeBtn');
                    if (otherBtn && feedBtn.textContent === '💬 Chat Mode') {
                        otherBtn.textContent = '💬 Chat Mode';
                        otherBtn.style.background = '#10b981';
                    } else if (otherBtn) {
                        otherBtn.textContent = '📝 Feed Data';
                        otherBtn.style.background = '';
                    }
                }
            };
            
            const dataBtn = document.createElement('button');
            dataBtn.className = 'mode-btn';
            dataBtn.innerHTML = '🔍 My Data';
            dataBtn.onclick = () => {
                if (window.showStoredData) {
                    window.showStoredData();
                }
            };
            
            buttonContainer.appendChild(feedBtn);
            buttonContainer.appendChild(dataBtn);
            chatHeader.appendChild(buttonContainer);
        }
        
        // Add CSS for training panel
        this.addTrainingStyles();
    }

    addTrainingStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .ai-training-panel {
                position: fixed;
                right: 20px;
                top: 100px;
                width: 400px;
                max-height: 80vh;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                z-index: 10000;
                overflow: hidden;
                transition: all 0.3s ease;
            }
            
            .ai-training-panel.hidden {
                transform: translateX(450px);
            }
            
            .training-header {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .training-header h3 {
                margin: 0;
                font-size: 1.2rem;
            }
            
            .close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .training-tabs {
                display: flex;
                background: #f5f5f5;
                border-bottom: 1px solid #ddd;
            }
            
            .tab-btn {
                flex: 1;
                padding: 10px;
                background: none;
                border: none;
                cursor: pointer;
                font-weight: 500;
                color: #666;
                transition: all 0.3s;
            }
            
            .tab-btn.active {
                background: white;
                color: #667eea;
                border-bottom: 2px solid #667eea;
            }
            
            .training-content {
                padding: 20px;
                max-height: calc(80vh - 120px);
                overflow-y: auto;
            }
            
            .tab-content {
                display: none;
            }
            
            .tab-content.active {
                display: block;
            }
            
            .train-input, .train-textarea, .train-select {
                width: 100%;
                padding: 10px;
                margin-bottom: 10px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
            }
            
            .train-textarea {
                min-height: 100px;
                resize: vertical;
            }
            
            .train-btn {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s;
                margin-right: 10px;
                margin-bottom: 10px;
            }
            
            .train-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }
            
            .train-btn.danger {
                background: linear-gradient(135deg, #ef4444, #dc2626);
            }
            
            .mode-btn {
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 0.85rem;
                font-weight: 600;
                transition: all 0.3s;
            }
            
            .mode-btn:hover {
                background: rgba(255,255,255,0.3);
                transform: scale(1.05);
            }
            
            .mode-buttons {
                display: flex;
                gap: 8px;
                margin-left: auto;
            }
            
            .data-stats {
                background: #f9f9f9;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            
            .data-stats p {
                margin: 5px 0;
                color: #333;
            }
            
            .player-data-form {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }
            
            .player-data-form textarea {
                grid-column: span 2;
            }
            
            .player-data-form button {
                grid-column: span 2;
            }
            
            .test-result {
                background: #f9f9f9;
                padding: 15px;
                border-radius: 8px;
                margin-top: 15px;
                min-height: 100px;
            }
            
            .recent-responses {
                max-height: 300px;
                overflow-y: auto;
            }
            
            .response-item {
                background: #f5f5f5;
                padding: 10px;
                margin-bottom: 10px;
                border-radius: 6px;
            }
            
            .feedback-btns {
                display: flex;
                gap: 10px;
                margin-top: 10px;
            }
            
            .feedback-btn {
                padding: 5px 10px;
                border: 1px solid #ddd;
                background: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .feedback-btn.good {
                border-color: #10b981;
                color: #10b981;
            }
            
            .feedback-btn.bad {
                border-color: #ef4444;
                color: #ef4444;
            }
            
            @media (max-width: 768px) {
                .ai-training-panel {
                    width: 90%;
                    right: 5%;
                }
            }
        `;
        document.head.appendChild(style);
    }

    togglePanel() {
        const panel = document.getElementById('ai-training-panel');
        panel.classList.toggle('hidden');
        this.updateStats();
    }

    showTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(`${tabName}-tab`).classList.add('active');
        event.target.classList.add('active');
        
        if (tabName === 'data') {
            this.updateStats();
        }
    }

    teachResponse() {
        const question = document.getElementById('train-question').value.trim();
        const response = document.getElementById('train-response').value.trim();
        const category = document.getElementById('response-category').value;
        
        if (!question || !response) {
            alert('Please enter both question pattern and response');
            return;
        }
        
        // Store the new response pattern
        if (!this.trainingData.responses[category]) {
            this.trainingData.responses[category] = [];
        }
        
        this.trainingData.responses[category].push({
            patterns: question.toLowerCase().split(',').map(p => p.trim()),
            response: response,
            confidence: 1.0,
            created: new Date().toISOString(),
            usage: 0
        });
        
        // Save to localStorage
        this.saveTrainingData();
        
        // Clear form
        document.getElementById('train-question').value = '';
        document.getElementById('train-response').value = '';
        
        this.showNotification('Response pattern learned successfully!');
    }

    addPlayerData() {
        const playerData = {
            name: document.getElementById('player-name').value.trim(),
            team: document.getElementById('player-team').value.trim(),
            price: parseFloat(document.getElementById('player-price').value),
            points: parseInt(document.getElementById('player-points').value),
            ownership: parseFloat(document.getElementById('player-ownership').value),
            notes: document.getElementById('player-notes').value.trim(),
            added: new Date().toISOString()
        };
        
        if (!playerData.name) {
            alert('Please enter player name');
            return;
        }
        
        // Store player data
        this.trainingData.players[playerData.name.toLowerCase()] = playerData;
        this.playerStats.set(playerData.name.toLowerCase(), playerData);
        
        // Save
        this.saveTrainingData();
        
        // Clear form
        document.querySelectorAll('.player-data-form input, .player-data-form textarea').forEach(el => {
            el.value = '';
        });
        
        this.showNotification(`Player ${playerData.name} added to database!`);
    }

    importData() {
        const importText = document.getElementById('import-data').value.trim();
        
        if (!importText) {
            alert('Please paste data to import');
            return;
        }
        
        try {
            // Try parsing as JSON first
            const data = JSON.parse(importText);
            
            if (data.responses) {
                Object.assign(this.trainingData.responses, data.responses);
            }
            if (data.players) {
                Object.assign(this.trainingData.players, data.players);
            }
            if (data.fixtures) {
                Object.assign(this.trainingData.fixtures, data.fixtures);
            }
            
            this.saveTrainingData();
            this.showNotification('Data imported successfully!');
            document.getElementById('import-data').value = '';
            
        } catch (e) {
            // Try parsing as CSV
            this.parseCSV(importText);
        }
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            
            if (values.length === headers.length) {
                // Detect if it's player data or response data
                if (headers.includes('name') && headers.includes('price')) {
                    // Player data
                    const player = {};
                    headers.forEach((header, index) => {
                        player[header] = values[index];
                    });
                    this.trainingData.players[player.name.toLowerCase()] = player;
                } else if (headers.includes('question') && headers.includes('response')) {
                    // Response data
                    const category = values[headers.indexOf('category')] || 'general';
                    if (!this.trainingData.responses[category]) {
                        this.trainingData.responses[category] = [];
                    }
                    this.trainingData.responses[category].push({
                        patterns: [values[headers.indexOf('question')].toLowerCase()],
                        response: values[headers.indexOf('response')],
                        confidence: 1.0,
                        created: new Date().toISOString()
                    });
                }
            }
        }
        
        this.saveTrainingData();
        this.showNotification('CSV data imported!');
    }

    handleCSVUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const csvText = e.target.result;
            this.parseCSV(csvText);
            
            // Show preview
            const preview = document.getElementById('csv-preview');
            preview.innerHTML = `<p>✅ Imported ${csvText.split('\n').length - 1} rows</p>`;
        };
        reader.readAsText(file);
    }

    testResponse() {
        const question = document.getElementById('test-question').value.trim();
        if (!question) return;
        
        const response = this.findBestResponse(question);
        const resultDiv = document.getElementById('test-result');
        
        resultDiv.innerHTML = `
            <strong>Question:</strong> ${question}<br>
            <strong>Response:</strong> ${response.text}<br>
            <strong>Confidence:</strong> ${(response.confidence * 100).toFixed(0)}%<br>
            <strong>Category:</strong> ${response.category}
        `;
    }

    findBestResponse(question) {
        const lower = question.toLowerCase();
        let bestMatch = null;
        let highestConfidence = 0;
        
        // Search through all trained responses
        for (const [category, responses] of Object.entries(this.trainingData.responses)) {
            for (const response of responses) {
                for (const pattern of response.patterns) {
                    if (lower.includes(pattern)) {
                        const confidence = this.calculateConfidence(pattern, lower);
                        if (confidence > highestConfidence) {
                            highestConfidence = confidence;
                            bestMatch = {
                                text: response.response,
                                confidence: confidence,
                                category: category
                            };
                        }
                    }
                }
            }
        }
        
        if (!bestMatch) {
            return {
                text: "I don't have a specific trained response for this question yet.",
                confidence: 0,
                category: 'untrained'
            };
        }
        
        return bestMatch;
    }

    calculateConfidence(pattern, question) {
        // Calculate confidence based on pattern match
        const words = pattern.split(' ');
        const questionWords = question.split(' ');
        let matches = 0;
        
        for (const word of words) {
            if (questionWords.includes(word)) {
                matches++;
            }
        }
        
        return matches / words.length;
    }

    exportJSON() {
        const dataStr = JSON.stringify(this.trainingData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `fpl-ai-training-${Date.now()}.json`;
        a.click();
        
        this.showNotification('Training data exported as JSON!');
    }

    exportCSV() {
        // Export responses as CSV
        let csv = 'category,question,response,confidence,usage\n';
        
        for (const [category, responses] of Object.entries(this.trainingData.responses)) {
            for (const response of responses) {
                csv += `${category},"${response.patterns.join(';')}","${response.response}",${response.confidence},${response.usage || 0}\n`;
            }
        }
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `fpl-ai-responses-${Date.now()}.csv`;
        a.click();
        
        this.showNotification('Responses exported as CSV!');
    }

    clearData() {
        if (confirm('Are you sure you want to clear all training data? This cannot be undone.')) {
            this.trainingData = {
                responses: {},
                players: {},
                teams: {},
                fixtures: {},
                patterns: [],
                corrections: [],
                userFeedback: [],
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.removeItem('fpl_ai_training_data');
            this.showNotification('All training data cleared!');
            this.updateStats();
        }
    }

    createBackup() {
        const backup = {
            version: this.modelVersion,
            timestamp: new Date().toISOString(),
            data: this.trainingData
        };
        
        localStorage.setItem('fpl_ai_backup', JSON.stringify(backup));
        this.showNotification('Backup created successfully!');
    }

    restoreBackup() {
        const backup = localStorage.getItem('fpl_ai_backup');
        if (!backup) {
            alert('No backup found!');
            return;
        }
        
        if (confirm('Restore from backup? Current data will be overwritten.')) {
            const backupData = JSON.parse(backup);
            this.trainingData = backupData.data;
            this.saveTrainingData();
            this.showNotification(`Restored backup from ${new Date(backupData.timestamp).toLocaleString()}`);
            this.updateStats();
        }
    }

    updateStats() {
        let responseCount = 0;
        for (const responses of Object.values(this.trainingData.responses)) {
            responseCount += responses.length;
        }
        
        document.getElementById('response-count').textContent = responseCount;
        document.getElementById('player-count').textContent = Object.keys(this.trainingData.players).length;
        document.getElementById('pattern-count').textContent = this.trainingData.patterns?.length || 0;
        document.getElementById('last-updated').textContent = this.trainingData.lastUpdated ? 
            new Date(this.trainingData.lastUpdated).toLocaleString() : 'Never';
    }

    saveTrainingData() {
        this.trainingData.lastUpdated = new Date().toISOString();
        localStorage.setItem('fpl_ai_training_data', JSON.stringify(this.trainingData));
    }

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'training-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10001;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    setupLearningSystem() {
        // Track user interactions for learning
        document.addEventListener('click', (e) => {
            if (e.target.matches('.ai-message')) {
                this.trackInteraction('message_view', e.target.textContent);
            }
        });
        
        // Learn from corrections
        this.enableResponseCorrection();
    }

    enableResponseCorrection() {
        // Add feedback buttons to AI responses
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.classList && node.classList.contains('ai-message')) {
                        this.addFeedbackButtons(node);
                    }
                });
            });
        });
        
        const messagesDiv = document.getElementById('chatMessages');
        if (messagesDiv) {
            observer.observe(messagesDiv, { childList: true });
        }
    }

    addFeedbackButtons(messageElement) {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'message-feedback';
        feedbackDiv.innerHTML = `
            <button onclick="aiTrainer.recordFeedback('good', this)" class="feedback-btn good">👍</button>
            <button onclick="aiTrainer.recordFeedback('bad', this)" class="feedback-btn bad">👎</button>
            <button onclick="aiTrainer.correctResponse(this)" class="feedback-btn">✏️ Correct</button>
        `;
        
        messageElement.appendChild(feedbackDiv);
    }

    recordFeedback(type, button) {
        const messageElement = button.closest('.ai-message').querySelector('.message-text') || 
                             button.closest('.ai-message').querySelector('.message-content');
        const message = messageElement ? messageElement.textContent : '';
        
        this.feedbackHistory.push({
            type: type,
            message: message,
            timestamp: new Date().toISOString()
        });
        
        // Update response confidence based on feedback
        this.updateResponseConfidence(message, type);
        
        button.textContent = type === 'good' ? '👍 Thanks!' : '👎 Noted';
        button.disabled = true;
    }

    correctResponse(button) {
        const messageElement = button.closest('.ai-message').querySelector('.message-text') || 
                             button.closest('.ai-message').querySelector('.message-content');
        const message = messageElement ? messageElement.textContent : '';
        const correction = prompt('Please provide the correct response:');
        
        if (correction) {
            this.trainingData.corrections.push({
                original: message,
                correction: correction,
                timestamp: new Date().toISOString()
            });
            
            this.saveTrainingData();
            this.showNotification('Correction recorded. AI will learn from this!');
        }
    }

    updateResponseConfidence(message, feedbackType) {
        // Adjust confidence scores based on user feedback
        for (const responses of Object.values(this.trainingData.responses)) {
            for (const response of responses) {
                if (response.response === message) {
                    if (feedbackType === 'good') {
                        response.confidence = Math.min(1, response.confidence + 0.1);
                        response.usage = (response.usage || 0) + 1;
                    } else {
                        response.confidence = Math.max(0.1, response.confidence - 0.1);
                    }
                }
            }
        }
        
        this.saveTrainingData();
    }

    trackInteraction(action, data) {
        // Track user interactions for learning patterns
        if (!this.trainingData.patterns) {
            this.trainingData.patterns = [];
        }
        
        this.trainingData.patterns.push({
            action: action,
            data: data,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 100 interactions
        if (this.trainingData.patterns.length > 100) {
            this.trainingData.patterns = this.trainingData.patterns.slice(-100);
        }
        
        this.saveTrainingData();
    }

    // Integration with main AI assistant
    getTrainedResponse(question) {
        return this.findBestResponse(question);
    }

    getPlayerData(playerName) {
        return this.trainingData.players[playerName.toLowerCase()] || null;
    }

    getAllTrainedPlayers() {
        return Object.values(this.trainingData.players);
    }

    // Process information fed by user
    processInformation(analysis) {
        console.log('Training system processing:', analysis);
        
        switch (analysis.type) {
            case 'player_update':
                console.log('Updating player info...');
                this.updatePlayerInfo(analysis);
                break;
            case 'price_update':
                console.log('Updating price info...');
                this.updatePlayerPrice(analysis);
                break;
            case 'injury_update':
                console.log('Updating injury info...');
                this.updatePlayerInjury(analysis);
                break;
            case 'fixture_update':
                console.log('Updating fixture info...');
                this.updateFixtureInfo(analysis);
                break;
            default:
                console.log('Adding general knowledge...');
                this.addGeneralKnowledge(analysis);
        }
        
        this.saveTrainingData();
        console.log('Training data saved. Current data:', this.trainingData);
    }

    updatePlayerInfo(analysis) {
        const playerKey = analysis.player.toLowerCase();
        
        if (!this.trainingData.players[playerKey]) {
            this.trainingData.players[playerKey] = {
                name: analysis.player,
                team: 'Unknown',
                price: 0,
                points: 0,
                ownership: 0,
                notes: '',
                added: new Date().toISOString()
            };
        }
        
        const player = this.trainingData.players[playerKey];
        
        // Update with new data
        if (analysis.data.points) {
            player.recentPoints = analysis.data.points;
            player.notes += ` Recent: ${analysis.data.points} points.`;
        }
        
        if (analysis.data.goals) {
            player.notes += ` Goals: ${analysis.data.goals}.`;
        }
        
        if (analysis.data.assists) {
            player.notes += ` Assists: ${analysis.data.assists}.`;
        }
        
        player.lastUpdated = new Date().toISOString();
        player.notes = player.notes.trim();
    }

    updatePlayerPrice(analysis) {
        if (analysis.player) {
            const playerKey = analysis.player.toLowerCase();
            if (this.trainingData.players[playerKey]) {
                this.trainingData.players[playerKey].price = analysis.data.price;
                this.trainingData.players[playerKey].notes += ` Price updated to £${analysis.data.price}m.`;
            }
        }
    }

    updatePlayerInjury(analysis) {
        if (analysis.player) {
            const playerKey = analysis.player.toLowerCase();
            if (this.trainingData.players[playerKey]) {
                this.trainingData.players[playerKey].status = analysis.data.status;
                this.trainingData.players[playerKey].notes += ` Injury status: ${analysis.data.status}.`;
            }
        }
    }

    updateFixtureInfo(analysis) {
        if (!this.trainingData.fixtures.general) {
            this.trainingData.fixtures.general = [];
        }
        
        this.trainingData.fixtures.general.push({
            info: analysis.summary,
            timestamp: new Date().toISOString()
        });
    }

    addGeneralKnowledge(analysis) {
        if (!this.trainingData.general) {
            this.trainingData.general = [];
        }
        
        this.trainingData.general.push({
            info: analysis.summary,
            type: analysis.type,
            timestamp: new Date().toISOString()
        });
    }
}

// Initialize training system
const aiTrainer = new FPLAITrainingSystem();

// Extend the main AI assistant to use training data
function extendAIWithTraining() {
    if (window.fplIntelligent && window.fplIntelligent.generateIntelligentResponse) {
        const originalGenerateResponse = window.fplIntelligent.generateIntelligentResponse.bind(window.fplIntelligent);
        
        window.fplIntelligent.generateIntelligentResponse = function(analysis, originalQuery) {
            // Check for trained responses first
            const trainedResponse = aiTrainer.getTrainedResponse(originalQuery);
            
            if (trainedResponse.confidence > 0.7) {
                // Use trained response if confidence is high
                return trainedResponse.text;
            }
            
            // Otherwise use original logic
            return originalGenerateResponse(analysis, originalQuery);
        };
        
        // Extend player database with trained data
        if (window.fplIntelligent.loadKnowledgeBase) {
            const originalLoadKnowledgeBase = window.fplIntelligent.loadKnowledgeBase.bind(window.fplIntelligent);
            
            window.fplIntelligent.loadKnowledgeBase = function() {
                const baseKnowledge = originalLoadKnowledgeBase();
                
                // Add trained players to knowledge base
                const trainedPlayers = aiTrainer.getAllTrainedPlayers();
                if (trainedPlayers.length > 0) {
                    baseKnowledge.playerDatabase.trained = trainedPlayers;
                }
                
                return baseKnowledge;
            };
        }
        
        console.log('AI Training System integrated successfully!');
        return true;
    }
    return false;
}

// Try to extend immediately, and set up polling if not ready
if (!extendAIWithTraining()) {
    const checkInterval = setInterval(() => {
        if (extendAIWithTraining()) {
            clearInterval(checkInterval);
        }
    }, 100);
    
    // Stop checking after 10 seconds
    setTimeout(() => clearInterval(checkInterval), 10000);
}

// Add notification animations
const animStyle = document.createElement('style');
animStyle.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .message-feedback {
        display: flex;
        gap: 5px;
        margin-top: 10px;
        opacity: 0.7;
        transition: opacity 0.3s;
    }
    
    .message-feedback:hover {
        opacity: 1;
    }
    
    .feedback-btn {
        padding: 4px 8px;
        border: 1px solid #e0e0e0;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
    }
    
    .feedback-btn:hover {
        background: #f5f5f5;
    }
    
    .feedback-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;
document.head.appendChild(animStyle);

// Export for global access
window.aiTrainer = aiTrainer;