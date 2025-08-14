// Simple test server for push notifications without bcrypt dependency
const express = require('express');
const { createPushNotificationRouter } = require('./push-notification-server');

const app = express();
const PORT = 3001;

// Basic middleware
app.use(express.json());
app.use(express.static('./'));

// Push notification routes
app.use('/api/push-notification', createPushNotificationRouter());

// Basic test route
app.get('/test', (req, res) => {
    res.json({ message: 'Test server is working!' });
});

app.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
    console.log('Push notification API available at: /api/push-notification');
    console.log('Test page available at: /test-notifications.html');
    console.log('Notification manager available at: /push-notification-manager.html');
});