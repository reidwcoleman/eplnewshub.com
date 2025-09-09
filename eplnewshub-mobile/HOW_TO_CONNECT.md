# 📱 How to Connect to EPL News Hub Mobile App

## Current Expo Go App Connection Methods:

### Method 1: Development Build URL (Recommended)
In the **Expo Go** app on your phone:

1. Open Expo Go
2. Look for these options:
   - **"Scan QR code"** - Tap this and point at QR code
   - **"Enter URL"** section - If visible, enter: `exp://100.115.92.200:8081`
   - **Projects** tab - Your project may appear here automatically

### Method 2: Using the Terminal QR Code
1. Look at your terminal where `npx expo start` is running
2. You should see a QR code displayed
3. **On iPhone**: Open Camera app and scan the QR code
4. **On Android**: Open Expo Go and tap "Scan QR code"

### Method 3: Press 'c' in Terminal
1. In the terminal running Expo, press the key `c`
2. This will show connection options and regenerate the QR code

### Method 4: Web Browser (Easiest for Testing)
Simply open in your browser:
```
http://localhost:8081
```

### Method 5: Direct Metro Bundle URL
Try opening this URL in your phone's browser:
```
http://100.115.92.200:8081
```
Then it should prompt to open in Expo Go.

## If You Still Can't Connect:

### Try Tunnel Mode (Works from Anywhere):
```bash
# Kill current server with Ctrl+C, then run:
npx expo start --tunnel
```
This will generate a public URL that works from any network.

### Check Your Setup:
1. **Phone and computer on same WiFi?** - This is required for local connection
2. **Firewall blocking port 8081?** - May need to allow through firewall
3. **Expo Go app up to date?** - Update from app store if needed

## Alternative: Use Expo Snack (Online)
You can also test the app online without any setup:
1. Go to https://snack.expo.dev
2. Paste the App.tsx code
3. Scan the QR code from there

## What The Terminal Shows:
When you run `npx expo start`, look for:
- Metro waiting on: `http://localhost:8081`
- A large QR code in ASCII art
- Press `?` to show all commands
- Press `c` to show connection info
- Press `w` to open in web browser

The app is running and ready - we just need to get your phone connected to it!