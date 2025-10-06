// Hugging Face Proxy Server
// This server acts as a proxy to hide the API token from client-side code

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3002;

// Your Hugging Face token (keep this server-side only)
const HF_TOKEN = process.env.HF_TOKEN || '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';

app.use(cors());
app.use(express.json());

// Proxy endpoint for Hugging Face API
app.post('/api/huggingface', async (req, res) => {
    try {
        const { model, inputs, parameters } = req.body;
        
        const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${HF_TOKEN}`
            },
            body: JSON.stringify({
                inputs,
                parameters
            })
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('HF Proxy error:', error);
        res.status(500).json({ error: 'Proxy server error' });
    }
});

app.listen(PORT, () => {
    console.log(`HF Proxy server running on port ${PORT}`);
    console.log('This keeps your token secure on the server side');
});