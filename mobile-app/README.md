# EPL News Hub Mobile App

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator
- Apple Developer Account ($99/year) for iOS
- Google Play Developer Account ($25 one-time) for Android

### Installation

```bash
# Navigate to mobile app directory
cd mobile-app

# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

## 📱 Development Workflow

### 1. Running the App
```bash
# Start Expo development server
npx expo start

# Press 'i' for iOS simulator
# Press 'a' for Android emulator
# Scan QR code with Expo Go app on physical device
```

### 2. Testing on Physical Device
1. Install Expo Go app from App Store/Play Store
2. Run `npx expo start`
3. Scan the QR code with:
   - iOS: Camera app
   - Android: Expo Go app

### 3. Building for Production

#### iOS Build
```bash
# Build for iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --latest
```

#### Android Build
```bash
# Build for Android
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android --latest
```

## 🔧 Configuration

### API Setup
1. Update `API_BASE_URL` in `/services/api.ts` with your backend URL
2. Configure environment variables in `eas.json`

### AdMob Setup
1. Create AdMob account at https://admob.google.com
2. Create app and ad units
3. Update ad unit IDs in:
   - `app.json` (App IDs)
   - Components using ads (Ad Unit IDs)

### Push Notifications
1. Configure FCM for Android (Firebase Console)
2. Configure APNs for iOS (Apple Developer Portal)
3. Update push notification credentials in Expo dashboard

## 🎨 Customization

### App Icons & Splash Screen
Replace the following files in `/assets/`:
- `icon.png` (1024x1024px)
- `splash.png` (1284x2778px)
- `adaptive-icon.png` (1024x1024px for Android)
- `favicon.png` (48x48px for web)

Generate all required sizes:
```bash
npx expo-optimize
```

### Theme Colors
Update colors in:
- `/constants/Colors.ts`
- `app.json` (splash screen background)
- Component StyleSheets

## 📊 Analytics Setup

### Google Analytics
1. Create GA4 property
2. Add tracking ID to `/services/analytics.ts`
3. Configure events to track

### Revenue Tracking
Set up AdMob and IAP analytics in:
- Google Play Console
- App Store Connect
- Firebase Analytics

## 🏪 App Store Submission

### iOS App Store
1. Create app in App Store Connect
2. Prepare:
   - App description (max 4000 chars)
   - Keywords (max 100 chars)
   - Screenshots (6.5", 5.5", iPad)
   - App preview video (optional)
   - Privacy policy URL
   - Support URL

3. Build and submit:
```bash
eas build --platform ios --profile production
eas submit --platform ios --latest
```

### Google Play Store
1. Create app in Play Console
2. Prepare:
   - App description
   - Short description (80 chars)
   - Feature graphic (1024x500px)
   - Screenshots (phone & tablet)
   - Privacy policy URL
   - Content rating questionnaire

3. Build and submit:
```bash
eas build --platform android --profile production
eas submit --platform android --latest
```

## 🐛 Debugging

### Using React Native Debugger
```bash
# Install React Native Debugger
brew install --cask react-native-debugger

# Start debugger
open -a "React Native Debugger"

# Press Cmd+D in iOS simulator or Cmd+M in Android
```

### Console Logs
```bash
# View logs for iOS
npx react-native log-ios

# View logs for Android
npx react-native log-android
```

### Performance Profiling
1. Enable Performance Monitor in dev menu
2. Use React DevTools Profiler
3. Monitor with Flipper

## 📦 Key Dependencies

- **Navigation**: React Navigation v6
- **State Management**: Zustand
- **UI Components**: React Native Elements
- **Animations**: React Native Reanimated 3
- **Lists**: FlashList (60 FPS scrolling)
- **Images**: Expo Image (optimized caching)
- **Ads**: React Native Google Mobile Ads
- **Analytics**: Firebase Analytics
- **Notifications**: Expo Notifications
- **Storage**: AsyncStorage
- **Networking**: Axios

## 🚀 Performance Tips

1. **Image Optimization**
   - Use WebP format when possible
   - Implement progressive loading
   - Cache images aggressively

2. **List Performance**
   - Use FlashList instead of FlatList
   - Implement proper `keyExtractor`
   - Set `estimatedItemSize` correctly

3. **Bundle Size**
   - Enable Hermes for Android
   - Use dynamic imports for large screens
   - Remove unused dependencies

4. **Memory Management**
   - Clear image cache periodically
   - Unmount heavy components when not visible
   - Use `useFocusEffect` for screen-specific logic

## 📈 Monitoring

### Crash Reporting
```bash
# Install Sentry
npm install @sentry/react-native

# Configure in App.tsx
Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
});
```

### Performance Monitoring
- Use Firebase Performance Monitoring
- Track key metrics:
  - App start time
  - Screen load time
  - API response time
  - FPS drops

## 🔗 Useful Links

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [App Store Guidelines](https://developer.apple.com/app-store/guidelines/)
- [Play Store Guidelines](https://play.google.com/console/about/guides/)

## 📝 License

Copyright © 2024 EPL News Hub. All rights reserved.

---

For support, email: support@eplnewshub.com