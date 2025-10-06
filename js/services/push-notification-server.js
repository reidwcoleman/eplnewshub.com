// Server-side push notification handler for EPL News Hub
// Handles registration, subscription management, and sending notifications

const express = require('express');
const webpush = require('web-push');
const fs = require('fs').promises;
const path = require('path');

// VAPID keys for web push
const vapidKeys = {
    publicKey: 'BL5VL01cPRxVGIFos-hFQffeR4iOmCp1Pasa2i8_slDCxO5x_MNdAnJMiy75VIGbNDpdEznsSX2RXXCvaWTRj5c',
    privateKey: 'r8BcZ3qgje0Zrh8_hupDJIINvlRQQqGY4SWbuI3RGy4'
};

// Configure web-push
webpush.setVapidDetails(
    'mailto:admin@eplnewshub.com', // Replace with your email
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

class PushNotificationServer {
    constructor() {
        this.subscriptions = new Map(); // In production, use a database
        this.loadSubscriptions();
    }

    // Load subscriptions from file (in production, use a database)
    async loadSubscriptions() {
        try {
            const data = await fs.readFile(path.join(__dirname, 'push-subscriptions.json'), 'utf8');
            const subscriptions = JSON.parse(data);
            this.subscriptions = new Map(Object.entries(subscriptions));
            console.log(`Loaded ${this.subscriptions.size} push subscriptions`);
        } catch (error) {
            console.log('No existing subscriptions file found, starting fresh');
            this.subscriptions = new Map();
        }
    }

    // Save subscriptions to file (in production, use a database)
    async saveSubscriptions() {
        try {
            const subscriptionsObj = Object.fromEntries(this.subscriptions);
            await fs.writeFile(
                path.join(__dirname, 'push-subscriptions.json'),
                JSON.stringify(subscriptionsObj, null, 2)
            );
        } catch (error) {
            console.error('Failed to save subscriptions:', error);
        }
    }

    // Register a native mobile push token
    registerNativeToken(userId, token, platform) {
        const subscription = {
            type: 'native',
            token: token,
            platform: platform,
            registeredAt: new Date().toISOString(),
            enabled: true
        };

        this.subscriptions.set(`${userId}_native`, subscription);
        this.saveSubscriptions();
        
        console.log(`Registered native push token for user ${userId} on ${platform}`);
        return true;
    }

    // Register a web push subscription
    registerWebSubscription(userId, subscription) {
        const subscriptionData = {
            type: 'web',
            subscription: subscription,
            registeredAt: new Date().toISOString(),
            enabled: true
        };

        this.subscriptions.set(`${userId}_web`, subscriptionData);
        this.saveSubscriptions();
        
        console.log(`Registered web push subscription for user ${userId}`);
        return true;
    }

    // Send notification to a specific user
    async sendNotificationToUser(userId, notification) {
        const results = [];
        
        // Check for web subscription
        const webSubscription = this.subscriptions.get(`${userId}_web`);
        if (webSubscription && webSubscription.enabled) {
            try {
                const result = await this.sendWebNotification(webSubscription.subscription, notification);
                results.push({ type: 'web', success: true, result });
            } catch (error) {
                console.error(`Failed to send web notification to user ${userId}:`, error);
                results.push({ type: 'web', success: false, error: error.message });
            }
        }

        // Check for native subscription
        const nativeSubscription = this.subscriptions.get(`${userId}_native`);
        if (nativeSubscription && nativeSubscription.enabled) {
            try {
                const result = await this.sendNativeNotification(nativeSubscription, notification);
                results.push({ type: 'native', success: true, result });
            } catch (error) {
                console.error(`Failed to send native notification to user ${userId}:`, error);
                results.push({ type: 'native', success: false, error: error.message });
            }
        }

        return results;
    }

    // Send web push notification
    async sendWebNotification(subscription, notification) {
        const payload = JSON.stringify({
            title: notification.title,
            body: notification.body,
            icon: notification.icon || '/reidsnbest.webp',
            badge: notification.badge || '/reidsnbest.webp',
            url: notification.url || '/',
            timestamp: Date.now(),
            actions: [
                {
                    action: 'open',
                    title: 'Read Article'
                },
                {
                    action: 'close',
                    title: 'Close'
                }
            ]
        });

        return await webpush.sendNotification(subscription, payload);
    }

    // Send native push notification (placeholder - implement with your preferred service)
    async sendNativeNotification(subscription, notification) {
        // This is a placeholder. In production, you would use:
        // - Firebase Cloud Messaging (FCM) for Android
        // - Apple Push Notification Service (APNS) for iOS
        // - Or a service like OneSignal, Pusher, etc.
        
        console.log(`Would send native notification to ${subscription.platform}:`, {
            token: subscription.token,
            title: notification.title,
            body: notification.body,
            data: { url: notification.url }
        });
        
        // Return a mock success response
        return { success: true, messageId: 'mock-message-id' };
    }

    // Send notification to all subscribers
    async sendNotificationToAll(notification) {
        const results = [];
        const userIds = new Set();
        
        // Get unique user IDs
        for (const [key] of this.subscriptions) {
            const userId = key.split('_')[0];
            userIds.add(userId);
        }

        // Send to each user
        for (const userId of userIds) {
            const userResults = await this.sendNotificationToUser(userId, notification);
            results.push({ userId, results: userResults });
        }

        return results;
    }

    // Remove subscription
    removeSubscription(userId, type = 'both') {
        if (type === 'both' || type === 'web') {
            this.subscriptions.delete(`${userId}_web`);
        }
        if (type === 'both' || type === 'native') {
            this.subscriptions.delete(`${userId}_native`);
        }
        
        this.saveSubscriptions();
        console.log(`Removed ${type} subscription(s) for user ${userId}`);
    }

    // Get subscription status for a user
    getSubscriptionStatus(userId) {
        const webSub = this.subscriptions.get(`${userId}_web`);
        const nativeSub = this.subscriptions.get(`${userId}_native`);
        
        return {
            web: webSub ? { enabled: webSub.enabled, registeredAt: webSub.registeredAt } : null,
            native: nativeSub ? { 
                enabled: nativeSub.enabled, 
                platform: nativeSub.platform, 
                registeredAt: nativeSub.registeredAt 
            } : null
        };
    }

    // Get all subscriptions (for admin purposes)
    getAllSubscriptions() {
        const subscriptions = {};
        for (const [key, value] of this.subscriptions) {
            subscriptions[key] = value;
        }
        return subscriptions;
    }
}

// Create router for push notification endpoints
function createPushNotificationRouter() {
    const router = express.Router();
    const pushServer = new PushNotificationServer();

    // Register native push token
    router.post('/register', async (req, res) => {
        try {
            const { token, platform, userId } = req.body;
            
            if (!token || !platform || !userId) {
                return res.status(400).json({ 
                    error: 'Missing required fields: token, platform, userId' 
                });
            }

            const success = pushServer.registerNativeToken(userId, token, platform);
            
            if (success) {
                res.json({ message: 'Token registered successfully' });
            } else {
                res.status(500).json({ error: 'Failed to register token' });
            }
        } catch (error) {
            console.error('Error registering push token:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Register web push subscription
    router.post('/subscribe', async (req, res) => {
        try {
            const { subscription, userId } = req.body;
            
            if (!subscription || !userId) {
                return res.status(400).json({ 
                    error: 'Missing required fields: subscription, userId' 
                });
            }

            const success = pushServer.registerWebSubscription(userId, subscription);
            
            if (success) {
                res.json({ message: 'Subscription registered successfully' });
            } else {
                res.status(500).json({ error: 'Failed to register subscription' });
            }
        } catch (error) {
            console.error('Error registering web subscription:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Send test notification
    router.post('/send-test', async (req, res) => {
        try {
            const { userId, title, body, url } = req.body;
            
            if (!userId) {
                return res.status(400).json({ error: 'Missing userId' });
            }

            const notification = {
                title: title || 'Test Notification',
                body: body || 'This is a test notification from EPL News Hub!',
                url: url || '/'
            };

            const results = await pushServer.sendNotificationToUser(userId, notification);
            
            res.json({ 
                message: 'Test notification sent',
                results: results
            });
        } catch (error) {
            console.error('Error sending test notification:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Send notification to all users
    router.post('/send-all', async (req, res) => {
        try {
            const { title, body, url } = req.body;
            
            if (!title || !body) {
                return res.status(400).json({ error: 'Missing title or body' });
            }

            const notification = { title, body, url: url || '/' };
            const results = await pushServer.sendNotificationToAll(notification);
            
            res.json({ 
                message: 'Notification sent to all users',
                results: results
            });
        } catch (error) {
            console.error('Error sending notification to all:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Get subscription status
    router.get('/status/:userId', (req, res) => {
        try {
            const { userId } = req.params;
            const status = pushServer.getSubscriptionStatus(userId);
            res.json(status);
        } catch (error) {
            console.error('Error getting subscription status:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Remove subscription
    router.delete('/unsubscribe', (req, res) => {
        try {
            const { userId, type } = req.body;
            
            if (!userId) {
                return res.status(400).json({ error: 'Missing userId' });
            }

            pushServer.removeSubscription(userId, type);
            res.json({ message: 'Subscription removed successfully' });
        } catch (error) {
            console.error('Error removing subscription:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Admin endpoint to get all subscriptions
    router.get('/admin/subscriptions', (req, res) => {
        try {
            const subscriptions = pushServer.getAllSubscriptions();
            res.json(subscriptions);
        } catch (error) {
            console.error('Error getting all subscriptions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
}

module.exports = { PushNotificationServer, createPushNotificationRouter };