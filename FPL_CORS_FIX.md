# FPL API CORS Fix

## Problem
```
Access to fetch at 'https://fantasy.premierleague.com/api/bootstrap-static/'
from origin 'https://eplnewshub.com' has been blocked by CORS policy
```

## Solution
Created a Netlify serverless function to proxy FPL API requests.

## How to Use

### Old Code (Broken - CORS Error)
```javascript
// ❌ This causes CORS errors
fetch('https://fantasy.premierleague.com/api/bootstrap-static/')
```

### New Code (Fixed)
```javascript
// ✅ Use this instead
fetch('/.netlify/functions/fpl-proxy?endpoint=bootstrap-static')
```

## Available Endpoints

The proxy supports any FPL API endpoint:

```javascript
// Bootstrap data (players, teams, etc.)
fetch('/.netlify/functions/fpl-proxy?endpoint=bootstrap-static')

// Specific gameweek fixtures
fetch('/.netlify/functions/fpl-proxy?endpoint=fixtures')

// Entry data (specific team)
fetch('/.netlify/functions/fpl-proxy?endpoint=entry/123456')

// Gameweek live data
fetch('/.netlify/functions/fpl-proxy?endpoint=event/1/live')

// Player summary
fetch('/.netlify/functions/fpl-proxy?endpoint=element-summary/123')
```

## Files to Update

You need to update any file that calls the FPL API directly. Common files:

1. `sw.js` - Service worker
2. `fpl-ai-assistant.html` - AI assistant page
3. Any FPL tools pages
4. JavaScript files in `/js/fpl/` directory

### Example Fix

**Before:**
```javascript
const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
const data = await response.json();
```

**After:**
```javascript
const response = await fetch('/.netlify/functions/fpl-proxy?endpoint=bootstrap-static');
const data = await response.json();
```

## Benefits

✅ **No CORS errors** - Requests come from your server
✅ **Caching** - Responses cached for 5 minutes
✅ **Reliability** - Better error handling
✅ **Works everywhere** - localhost, staging, production

## Service Worker Fix

The service worker (`sw.js`) is trying to cache FPL API requests. Update it:

**Find this in sw.js (around line 32):**
```javascript
fetch('https://fantasy.premierleague.com/api/bootstrap-static/')
```

**Replace with:**
```javascript
fetch('/.netlify/functions/fpl-proxy?endpoint=bootstrap-static')
```

## Testing

1. Deploy the changes
2. Open browser console
3. Navigate to any FPL tool page
4. You should see successful API calls instead of CORS errors

## Caching

The proxy includes 5-minute caching:
- Reduces FPL API load
- Faster response times
- Respects FPL rate limits

To change cache duration, edit `netlify/functions/fpl-proxy.js`:
```javascript
'Cache-Control': 'public, max-age=300' // 300 seconds = 5 minutes
```

## Rate Limiting

FPL API has rate limits. The proxy helps by:
- Caching responses
- Adding proper User-Agent headers
- Reducing duplicate requests

## Error Handling

The proxy returns proper error messages:

```javascript
try {
  const response = await fetch('/.netlify/functions/fpl-proxy?endpoint=bootstrap-static');
  const data = await response.json();

  if (!response.ok) {
    console.error('FPL API Error:', data.error);
  }
} catch (error) {
  console.error('Network error:', error);
}
```

## No Setup Required

The FPL proxy works immediately - no environment variables or API keys needed!

---

**Status**: ✅ Proxy created and ready to use
**Next**: Update your JavaScript files to use the new endpoint
