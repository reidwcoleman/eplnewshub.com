const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// Endpoint to handle subscription
app.post('/subscribe', (req, res) => {
    const { name, email, address } = req.body;

    // Store the data in a database or file
    // Example: Save to a JSON file
    const fs = require('fs');
    const subscriptions = JSON.parse(fs.readFileSync('subscriptions.json', 'utf8'));
    subscriptions.push({ name, email, address });
    fs.writeFileSync('subscriptions.json', JSON.stringify(subscriptions));

    res.json({ message: 'Subscription successful!' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
