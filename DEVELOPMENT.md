# EPL News Hub - Development Setup Guide

## Quick Start

### Option 1: Python (Simplest - No dependencies)
```bash
python3 dev-server.py
```
This will automatically:
- Start server on http://localhost:8080
- Open your browser to the membership page
- Enable development mode with test keys

### Option 2: Node.js
```bash
node dev-server.js
```

### Option 3: Any HTTP Server
```bash
# Python
python -m http.server 8080

# Node.js (npx)
npx http-server -p 8080

# PHP
php -S localhost:8080
```
Then visit: http://localhost:8080/membership.html?dev=true

## Development Mode Features

### 🚧 Dev Mode Banner
When in development mode, you'll see an orange banner at the top showing:
- Current mode (DEV/PRODUCTION)
- Active Stripe keys (TEST/LIVE)
- Quick access buttons for test cards and mode toggle

### ⌨️ Keyboard Shortcuts
- **Ctrl+Shift+D**: Toggle development mode on/off
- **Ctrl+Shift+T**: Show test card reference modal

### 🔧 URL Parameters
Add these to any page URL to control dev mode:
- `?dev=true` - Force development mode on
- `?dev=false` - Force production mode

### 💾 Local Storage
Dev mode preference is saved in localStorage:
```javascript
localStorage.setItem('dev_mode', 'true');  // Enable
localStorage.setItem('dev_mode', 'false'); // Disable
```

## Test Credentials

### Stripe Test Cards
| Card Type | Number | Description |
|-----------|--------|-------------|
| Success | 4242 4242 4242 4242 | Always succeeds |
| Decline | 4000 0000 0000 0002 | Always declines |
| Auth Required | 4000 0025 0000 3155 | Requires 3D Secure |
| Insufficient Funds | 4000 0000 0000 9995 | Fails with insufficient funds |

**For all test cards use:**
- Any future expiry date (e.g., 12/34)
- Any 3-digit CVC (e.g., 123)
- Any 5-digit ZIP (e.g., 12345)

### Test User Accounts
Create test accounts at `/create-account.html`:
- testuser@example.com / password123
- premium@example.com / password123
- free@example.com / password123

## Development Configuration

### Files Structure
```
/dev-config.js        - Main development configuration
/dev-server.js        - Node.js development server
/dev-server.py        - Python development server
/DEVELOPMENT.md       - This file
```

### Configuration Options
Edit `dev-config.js` to customize:

```javascript
features: {
    showDevBanner: true,      // Show/hide dev banner
    enableLogging: true,      // Console logging
    bypassPayment: false,     // Skip payment (testing)
    freeMessageLimit: 100,    // AI message limit
    showTestCards: true       // Test card helper
}
```

## Testing Workflow

### 1. Test Sign Up Flow
1. Start dev server: `python3 dev-server.py`
2. Visit: http://localhost:8080/create-account.html
3. Create account with test email
4. Verify account creation

### 2. Test Membership Purchase
1. Go to: http://localhost:8080/membership.html
2. Select a plan (Starter or Pro)
3. Use test card: 4242 4242 4242 4242
4. Complete checkout
5. Verify membership activation

### 3. Test Premium Access
1. Visit any premium tool (e.g., `/fpl-ai-assistant.html`)
2. Verify access with active membership
3. Test message limits for free users
4. Test upgrade prompts

### 4. Test Membership Management
1. Go to: http://localhost:8080/account.html
2. Check membership status
3. Test subscription management

## API Endpoints (Development)

When in dev mode, API calls go to:
- Local: http://localhost:3000
- Or your development server URL

Configure in `dev-config.js`:
```javascript
apiEndpoints: {
    test: {
        baseUrl: 'http://localhost:3000',
        checkoutSession: '/api/create-checkout-session',
        checkMembership: '/api/check-membership'
    }
}
```

## Troubleshooting

### Stripe Keys Not Working
1. Check you're in dev mode (banner visible)
2. Verify test keys in console: `window.devConfig.getConfig()`
3. Clear cache and reload

### Firebase Auth Issues
1. Check Firebase console for test users
2. Verify auth state: `window.auth.currentUser`
3. Clear localStorage and re-authenticate

### Development Mode Not Activating
1. Add `?dev=true` to URL
2. Or run: `localStorage.setItem('dev_mode', 'true')`
3. Refresh the page

## Security Notes

⚠️ **NEVER commit real API keys to version control**
- Test keys (pk_test_*) are safe to expose
- Live keys (pk_live_*, sk_live_*) must remain secret
- Use environment variables for sensitive data

## Support

For development issues:
1. Check browser console for errors
2. Verify dev mode is active: `window.devConfig.isDevelopment()`
3. Check network tab for API calls
4. Review this guide for common issues

---

Happy developing! 🚀