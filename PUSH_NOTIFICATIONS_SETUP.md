# 🔔 Push Notifications Setup Guide - EPL News Hub

This guide will help you set up and test push notifications for both web and mobile versions of EPL News Hub.

## 📋 What's Been Set Up

✅ **Capacitor Push Notifications Plugin** - Installed and configured  
✅ **Web Push Service Worker** - Enhanced with push notification support  
✅ **Push Notification Service** - Unified service for web and native notifications  
✅ **Server-side API** - Endpoints for registration and sending notifications  
✅ **Management Interface** - UI for testing and managing notifications  

## 🚀 Quick Start

### 1. Start the Server
```bash
node server.js
```

### 2. Open the Notification Manager
Navigate to: `http://localhost:3000/push-notification-manager.html`

### 3. Enable Notifications
- Click "Enable Notifications" 
- Grant permission when prompted
- You should see "Push notifications are enabled"

### 4. Send a Test Notification
- Click "Send Test Notification"
- You should receive a notification on your device

## 📱 Mobile App Setup

### For Android:
1. Build the app: `npm run build:android`
2. Open Android Studio: `npm run open:android`
3. Run the app on a device or emulator
4. Grant notification permissions when prompted

### For iOS:
1. Build the app: `npm run build:ios`
2. Open Xcode: `npm run open:ios`
3. Configure signing and provisioning profiles
4. Run the app on a device or simulator
5. Grant notification permissions when prompted

## 🔧 Configuration

### VAPID Keys (for Web Push)
You need to generate VAPID keys for web push notifications:

```bash
# Install web-push CLI globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys
```

Update these files with your keys:
- `push-notification-service.js` - Update `vapidPublicKey`
- `push-notification-server.js` - Update `vapidKeys`

### Firebase Setup (for Mobile)
For production mobile push notifications, you'll need Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Add Android/iOS apps
4. Download configuration files:
   - `google-services.json` for Android
   - `GoogleService-Info.plist` for iOS
5. Update `push-notification-server.js` with Firebase credentials

## 📊 API Endpoints

### Register Native Token
```
POST /api/push-notification/register
{
  "token": "device-token",
  "platform": "android|ios",
  "userId": "user-id"
}
```

### Register Web Subscription
```
POST /api/push-notification/subscribe
{
  "subscription": {...},
  "userId": "user-id"
}
```

### Send Test Notification
```
POST /api/push-notification/send-test
{
  "userId": "user-id",
  "title": "Test Title",
  "body": "Test message",
  "url": "/article/url"
}
```

### Send to All Users
```
POST /api/push-notification/send-all
{
  "title": "Breaking News",
  "body": "Liverpool signs new striker!",
  "url": "/articles/liverpool-signing"
}
```

## 🧪 Testing

### Web Testing:
1. Open Chrome DevTools
2. Go to Application > Service Workers
3. Check if service worker is registered
4. Go to Application > Storage > Service Worker Storage
5. Test notifications in the manager interface

### Mobile Testing:
1. Install the app on a physical device
2. Enable notifications when prompted
3. Use the notification manager to send test notifications
4. Check device notification center

## 🔒 Security & Best Practices

### Production Checklist:
- [ ] Replace default VAPID keys with your own
- [ ] Set up proper Firebase credentials
- [ ] Use HTTPS for web push notifications
- [ ] Implement proper user authentication
- [ ] Add rate limiting to prevent spam
- [ ] Store subscriptions in a proper database (not JSON files)
- [ ] Implement unsubscribe functionality
- [ ] Add notification preference management

### Privacy:
- Always request permission before registering for notifications
- Provide easy unsubscribe options
- Respect user notification preferences
- Don't send spam or irrelevant notifications

## 📚 File Structure

```
/push-notification-service.js     # Client-side notification service
/push-notification-server.js      # Server-side notification handler
/push-notification-manager.html   # Management interface
/sw.js                            # Service worker (already had push support)
/capacitor.config.json            # Updated with push notification config
/server.js                        # Updated with push notification routes
```

## 🐛 Troubleshooting

### Common Issues:

**"Push notifications not supported"**
- Check if you're using HTTPS (required for web push)
- Ensure service worker is properly registered
- Check browser compatibility

**"Permission denied"**
- User needs to manually grant permission
- Check browser notification settings
- Clear browser data and try again

**"No registration token"**
- Check if Capacitor plugin is properly installed
- Ensure device has Google Play Services (Android)
- Check iOS provisioning profile

**"Test notification not received"**
- Check notification permissions
- Verify registration was successful
- Check browser/device notification settings
- Look for errors in console/logs

### Debug Mode:
Enable debug logging by opening browser console and running:
```javascript
localStorage.setItem('debug-push-notifications', 'true');
```

## 🚀 Next Steps

1. **Set up Firebase** for production mobile notifications
2. **Generate proper VAPID keys** for web push
3. **Implement user segmentation** for targeted notifications
4. **Add notification scheduling** for automated news updates
5. **Create notification templates** for different content types
6. **Set up analytics** to track notification performance

## 📞 Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all dependencies are installed
3. Ensure proper permissions are granted
4. Check the troubleshooting section above

Your push notification system is now ready! 🎉