# EPL News Hub Mobile App - Connection Guide

## 📱 How to Connect to Your Mobile App

### Your Connection Details:
- **Local IP Address:** 100.115.92.200
- **Port:** 8081
- **Status:** Ready to connect!

## Method 1: Manual Connection (Most Reliable)

1. **Install Expo Go** on your phone:
   - iOS: Download from App Store
   - Android: Download from Google Play Store

2. **Open Expo Go** on your phone

3. **Enter URL Manually:**
   - Tap "Enter URL manually" at the bottom
   - Type exactly: `exp://100.115.92.200:8081`
   - Press "Connect"

## Method 2: Web Browser Testing

Open in your computer's browser:
- http://localhost:8081

## Method 3: QR Code (if available)

When you run `npx expo start`, a QR code will appear in the terminal.
- iOS: Scan with Camera app
- Android: Scan with Expo Go app

## Troubleshooting

### If connection fails:

1. **Check both devices are on same WiFi network**
   - Your phone and computer must be on the same network

2. **Check firewall settings**
   - May need to allow port 8081 through firewall
   - On Windows: Windows Defender may block the connection
   - On Mac: System Preferences > Security > Firewall

3. **Try tunnel mode** (slower but works anywhere):
   ```bash
   npx expo start --tunnel
   ```

4. **Use web version** for quick testing:
   ```bash
   npx expo start --web
   ```

## Starting the App

From the terminal:
```bash
cd /home/reidwcoleman/eplnewshub-mobile
npx expo start
```

Then use one of the connection methods above.

## Current App Features

✅ News feed with latest EPL articles
✅ FPL tools section
✅ Responsive design for all screen sizes
✅ Native navigation
✅ Touch-optimized interface

The app is fully functional and ready for testing!