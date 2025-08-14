// Push Notification Service for EPL News Hub
// Handles both web push notifications and native mobile notifications via Capacitor

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

class PushNotificationService {
    constructor() {
        this.isSupported = false;
        this.isPermissionGranted = false;
        this.registrationToken = null;
        this.vapidPublicKey = 'BMfWK9G4cVz6KJf8gH6JQ5q8mQ6vM3zH8fZl8nT5qFZ5fZl8nT5qFZ5fZl8nT5qFZ'; // Replace with your VAPID key
        
        this.init();
    }

    async init() {
        // Check if running on native mobile platform
        if (Capacitor.isNativePlatform()) {
            await this.initNativePushNotifications();
        } else {
            await this.initWebPushNotifications();
        }
    }

    // Initialize native push notifications for mobile apps
    async initNativePushNotifications() {
        console.log('Initializing native push notifications...');
        
        try {
            // Check if push notifications are available
            const permission = await PushNotifications.checkPermissions();
            console.log('Native push permission status:', permission);

            if (permission.receive === 'prompt') {
                // Request permission if not granted
                const requestResult = await PushNotifications.requestPermissions();
                this.isPermissionGranted = requestResult.receive === 'granted';
            } else {
                this.isPermissionGranted = permission.receive === 'granted';
            }

            if (this.isPermissionGranted) {
                // Register for push notifications
                await PushNotifications.register();
                this.isSupported = true;
                
                // Set up event listeners
                this.setupNativeEventListeners();
                
                console.log('Native push notifications initialized successfully');
            } else {
                console.warn('Push notification permission not granted');
            }
        } catch (error) {
            console.error('Failed to initialize native push notifications:', error);
        }
    }

    // Initialize web push notifications for browsers
    async initWebPushNotifications() {
        console.log('Initializing web push notifications...');
        
        try {
            // Check if service worker and push notifications are supported
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                this.isSupported = true;
                
                // Register service worker
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
                
                // Check notification permission
                const permission = await Notification.requestPermission();
                this.isPermissionGranted = permission === 'granted';
                
                if (this.isPermissionGranted) {
                    // Subscribe to push notifications
                    await this.subscribeToWebPush(registration);
                    console.log('Web push notifications initialized successfully');
                } else {
                    console.warn('Notification permission not granted');
                }
            } else {
                console.warn('Push notifications not supported in this browser');
            }
        } catch (error) {
            console.error('Failed to initialize web push notifications:', error);
        }
    }

    // Set up event listeners for native notifications
    setupNativeEventListeners() {
        // Called when the app is registered for push notifications
        PushNotifications.addListener('registration', (token) => {
            console.log('Push registration success, token: ' + token.value);
            this.registrationToken = token.value;
            this.sendTokenToServer(token.value);
        });

        // Called when registration fails
        PushNotifications.addListener('registrationError', (error) => {
            console.error('Push registration error:', error);
        });

        // Called when a push notification is received
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push notification received:', notification);
            this.handleNotificationReceived(notification);
        });

        // Called when a push notification is tapped
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push notification action performed:', notification);
            this.handleNotificationTapped(notification);
        });
    }

    // Subscribe to web push notifications
    async subscribeToWebPush(registration) {
        try {
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
            });

            console.log('Web push subscription:', subscription);
            this.sendSubscriptionToServer(subscription);
        } catch (error) {
            console.error('Failed to subscribe to web push:', error);
        }
    }

    // Convert VAPID key from base64 to Uint8Array
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Send registration token to your server
    async sendTokenToServer(token) {
        try {
            const response = await fetch('/api/push-notification/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    platform: Capacitor.getPlatform(),
                    userId: this.getCurrentUserId() // Implement this based on your auth system
                })
            });

            if (response.ok) {
                console.log('Token registered successfully on server');
            } else {
                console.error('Failed to register token on server');
            }
        } catch (error) {
            console.error('Error sending token to server:', error);
        }
    }

    // Send web push subscription to your server
    async sendSubscriptionToServer(subscription) {
        try {
            const response = await fetch('/api/push-notification/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription: subscription,
                    userId: this.getCurrentUserId()
                })
            });

            if (response.ok) {
                console.log('Subscription registered successfully on server');
            } else {
                console.error('Failed to register subscription on server');
            }
        } catch (error) {
            console.error('Error sending subscription to server:', error);
        }
    }

    // Handle notification received (when app is in foreground)
    handleNotificationReceived(notification) {
        // You can customize this based on your needs
        console.log('Notification received in foreground:', notification);
        
        // Show a custom in-app notification or update UI
        this.showInAppNotification(notification);
    }

    // Handle notification tapped
    handleNotificationTapped(notification) {
        console.log('Notification tapped:', notification);
        
        // Navigate to specific page based on notification data
        const url = notification.data?.url || '/';
        if (Capacitor.isNativePlatform()) {
            // Handle navigation in native app
            window.location.href = url;
        } else {
            // Handle navigation in web app
            window.open(url, '_blank');
        }
    }

    // Show in-app notification (for foreground notifications)
    showInAppNotification(notification) {
        // Create a custom notification element
        const notificationEl = document.createElement('div');
        notificationEl.className = 'in-app-notification';
        notificationEl.innerHTML = `
            <div class="notification-content">
                <h4>${notification.title}</h4>
                <p>${notification.body}</p>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add styles
        notificationEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notificationEl);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notificationEl.parentElement) {
                notificationEl.remove();
            }
        }, 5000);
    }

    // Request notification permission
    async requestPermission() {
        if (Capacitor.isNativePlatform()) {
            const result = await PushNotifications.requestPermissions();
            this.isPermissionGranted = result.receive === 'granted';
        } else {
            const permission = await Notification.requestPermission();
            this.isPermissionGranted = permission === 'granted';
        }
        
        return this.isPermissionGranted;
    }

    // Send a test notification (for testing purposes)
    async sendTestNotification() {
        if (!this.isPermissionGranted) {
            console.warn('Notification permission not granted');
            return;
        }

        try {
            const response = await fetch('/api/push-notification/send-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.getCurrentUserId(),
                    title: 'Test Notification',
                    body: 'This is a test notification from EPL News Hub!',
                    url: '/'
                })
            });

            if (response.ok) {
                console.log('Test notification sent successfully');
            } else {
                console.error('Failed to send test notification');
            }
        } catch (error) {
            console.error('Error sending test notification:', error);
        }
    }

    // Get current user ID (implement based on your auth system)
    getCurrentUserId() {
        // This should return the current user's ID
        // You can get this from localStorage, a global variable, or your auth service
        return localStorage.getItem('userId') || 'anonymous';
    }

    // Check if notifications are supported and enabled
    isEnabled() {
        return this.isSupported && this.isPermissionGranted;
    }

    // Get registration token (for native apps)
    getRegistrationToken() {
        return this.registrationToken;
    }
}

// Add CSS for in-app notifications
if (!document.querySelector('#push-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'push-notification-styles';
    style.textContent = `
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
        
        .in-app-notification {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .notification-content h4 {
            margin: 0 0 8px 0;
            color: #333;
            font-size: 16px;
            font-weight: 600;
        }
        
        .notification-content p {
            margin: 0;
            color: #666;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .notification-content button {
            position: absolute;
            top: 8px;
            right: 8px;
            background: none;
            border: none;
            font-size: 18px;
            color: #999;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .notification-content button:hover {
            color: #666;
        }
    `;
    document.head.appendChild(style);
}

// Export for use in other modules
export default PushNotificationService;

// Also make it available globally for non-module usage
window.PushNotificationService = PushNotificationService;