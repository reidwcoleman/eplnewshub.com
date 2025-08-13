# EPL News Hub Mobile App Guide

Your website has been successfully converted into a mobile app using Capacitor! This guide will help you build and deploy your app to the Google Play Store and Apple App Store.

## 🎯 What's Been Created

- ✅ **Capacitor Project**: Your website is now wrapped as a native mobile app
- ✅ **Android Project**: Ready for Google Play Store submission
- ✅ **iOS Project**: Ready for Apple App Store submission  
- ✅ **App Icons & Splash Screens**: Generated for all device sizes
- ✅ **Build Scripts**: Automated build process for both platforms

## 📁 Project Structure

```
eplnewshub.com/
├── android/                 # Android app project
├── ios/                     # iOS app project
├── dist/                    # Built website (web assets)
├── capacitor.config.json    # Capacitor configuration
└── resources/               # App icons and splash screens
```

## 🚀 Building Your Apps

### Prerequisites

**For Android:**
- Android Studio installed
- Android SDK and build tools
- Java 8+ installed

**For iOS:**
- Xcode installed (macOS only)
- Apple Developer Account
- CocoaPods installed

### Build Commands

```bash
# Build website and sync to mobile apps
npm run build:mobile

# Open Android Studio to build APK/AAB
npm run open:android

# Open Xcode to build IPA (macOS only)
npm run open:ios

# Run on connected Android device
npm run dev:android

# Run on iOS simulator (macOS only)
npm run dev:ios
```

## 📱 App Store Deployment

### Google Play Store (Android)

1. **Open Android Studio**:
   ```bash
   npm run open:android
   ```

2. **Generate Signed Bundle**:
   - Go to `Build > Generate Signed Bundle/APK`
   - Select `Android App Bundle (AAB)`
   - Create/use your keystore
   - Select `release` build variant

3. **Upload to Play Console**:
   - Go to [Google Play Console](https://play.google.com/console)
   - Create new app or use existing
   - Upload your `.aab` file
   - Fill in app details and submit for review

### Apple App Store (iOS)

1. **Open Xcode** (macOS required):
   ```bash
   npm run open:ios
   ```

2. **Configure Signing**:
   - Select your team in Project settings
   - Ensure provisioning profiles are set up
   - Update bundle identifier if needed

3. **Archive and Upload**:
   - Go to `Product > Archive`
   - Once archived, click `Distribute App`
   - Choose `App Store Connect`
   - Upload and submit for review

## ⚙️ Configuration Options

### App Metadata
Edit `capacitor.config.json` to customize:

```json
{
  "appId": "com.eplnewshub.app",
  "appName": "EPL News Hub",
  "webDir": "dist",
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 3000,
      "backgroundColor": "#262627"
    }
  }
}
```

### Android-specific settings
- **App ID**: Change in `android/app/build.gradle` (`applicationId`)
- **Version**: Update `versionCode` and `versionName` in same file
- **Permissions**: Modify `android/app/src/main/AndroidManifest.xml`

### iOS-specific settings  
- **Bundle ID**: Change in Xcode project settings
- **Version**: Update in Xcode under General tab
- **Permissions**: Add to `ios/App/App/Info.plist`

## 🔧 Adding Native Features

Your app can now access native device features:

```javascript
import { Camera } from '@capacitor/camera';
import { PushNotifications } from '@capacitor/push-notifications';
import { StatusBar } from '@capacitor/status-bar';

// Take photos
const image = await Camera.getPhoto({
  quality: 90,
  allowEditing: true,
  resultType: CameraResultType.Uri
});

// Push notifications
await PushNotifications.requestPermissions();

// Status bar customization
StatusBar.setBackgroundColor({ color: '#262627' });
```

## 📊 App Store Requirements

### Both Stores
- App icons (1024x1024 PNG)
- Screenshots (multiple device sizes)
- App description and metadata
- Privacy policy URL
- Age rating/content rating

### Google Play Store Additional
- Feature graphic (1024x500)
- High-res icon (512x512)
- Short description (80 chars)
- Full description (4000 chars)

### Apple App Store Additional  
- App preview videos (optional)
- Keywords for search
- App Store categories
- Pricing and availability

## 🔄 Updating Your App

When you update your website:

1. **Update web content** (modify your React components/HTML)
2. **Build and sync**:
   ```bash
   npm run build:mobile
   ```
3. **Test on devices**:
   ```bash
   npm run dev:android
   npm run dev:ios
   ```
4. **Update version numbers** in `android/app/build.gradle` and iOS project
5. **Build and upload** new versions to app stores

## 🛠️ Troubleshooting

### Common Android Issues
- **Build failures**: Check Android SDK version compatibility
- **Signing issues**: Ensure keystore is properly configured
- **Package conflicts**: Clear cache: `cd android && ./gradlew clean`

### Common iOS Issues
- **Code signing**: Verify Apple Developer account and certificates
- **Simulator issues**: Reset simulator data
- **Archive failures**: Check deployment target matches your iOS version

### Web Content Issues
- **Assets not loading**: Ensure `npx cap sync` was run after changes
- **JavaScript errors**: Check browser console in app for debugging
- **Performance**: Large apps may need code splitting

## 📈 Performance Tips

1. **Optimize images**: Use WebP format for better compression
2. **Minimize JavaScript bundles**: Enable tree shaking in Vite
3. **Cache static assets**: Configure service worker caching
4. **Lazy load content**: Implement progressive loading for articles
5. **Native navigation**: Use Capacitor's native navigation for better UX

## 🎉 Success!

Your EPL News Hub website is now a fully functional mobile app ready for the app stores! The app will:

- Load your website content natively
- Work offline (if configured)
- Access device features like camera, push notifications
- Provide a native app experience
- Update automatically when you update your website

For questions or issues, refer to the [Capacitor documentation](https://capacitorjs.com/docs) or check the troubleshooting section above.