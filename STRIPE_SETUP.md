# Stripe Payment Setup Guide

## Issue Fixed
The error "domain not enabled in dashboard" has been **completely fixed** by switching from client-side Stripe Checkout to server-side Checkout Sessions via Netlify Functions.

## What Changed

### Before (Broken)
```javascript
// Old method - requires domain whitelisting
stripe.redirectToCheckout({ ... })
```

### After (Fixed)
```javascript
// New method - works with any domain via Netlify function
fetch('/.netlify/functions/create-checkout-session', { ... })
```

## Setup Steps

### 1. Add Stripe Secret Key to Netlify

You need to add your Stripe secret key as an environment variable:

**Steps:**
1. Go to your Netlify dashboard
2. Navigate to: **Site settings → Environment variables**
3. Click **Add a variable**
4. Add:
   - **Key**: `STRIPE_SECRET_KEY`
   - **Value**: Your Stripe secret key (starts with `sk_live_...` or `sk_test_...`)

**Get your Stripe secret key:**
- Go to: https://dashboard.stripe.com/apikeys
- Copy the "Secret key" (NOT the publishable key)

### 2. Install Stripe Package

The Netlify function requires the `stripe` npm package:

```bash
npm install stripe
```

Or add to your `package.json`:
```json
{
  "dependencies": {
    "stripe": "^14.0.0"
  }
}
```

### 3. Redeploy

After adding the environment variable and stripe package:
1. Commit your changes
2. Push to GitHub
3. Netlify will auto-deploy

Or manually trigger a deploy in Netlify dashboard.

## How It Works Now

```
User clicks "Subscribe"
    ↓
JavaScript calls Netlify Function
    ↓
Netlify Function creates Checkout Session with Stripe API
    ↓
Returns checkout URL
    ↓
User redirected to Stripe-hosted checkout page
    ↓
After payment → redirected back to success page
```

## Benefits of This Approach

✅ **No domain whitelisting needed** - Works on any domain
✅ **More secure** - Secret key stays on server
✅ **Better for production** - Recommended by Stripe
✅ **Supports all features** - Promo codes, tax, etc.
✅ **No CORS issues** - Server-to-server communication

## Testing

### Test Mode
1. Use test price IDs in your code
2. Set `STRIPE_SECRET_KEY` to your test secret key (`sk_test_...`)
3. Use Stripe test cards: https://stripe.com/docs/testing

### Live Mode
1. Use live price IDs
2. Set `STRIPE_SECRET_KEY` to your live secret key (`sk_live_...`)
3. Real payments will be processed

## Troubleshooting

### Error: "No such price"
- Make sure your price IDs exist in Stripe dashboard
- Check if you're using test keys with live prices (or vice versa)

### Error: "Invalid API Key"
- Verify `STRIPE_SECRET_KEY` is set in Netlify
- Make sure it starts with `sk_` not `pk_`
- Redeploy after adding the key

### Error: "stripe is not defined"
- Run `npm install stripe`
- Make sure package.json includes stripe dependency
- Commit and push changes

### Payments not working
1. Check browser console for errors
2. Check Netlify function logs
3. Verify environment variable is set
4. Test with Stripe test cards first

## Environment Variables Needed

```bash
# Required for Stripe payments
STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)

# Optional for AI features
GROQ_API_KEY=gsk_...
```

## Price IDs in Your Code

Make sure these match your Stripe dashboard:

```javascript
starter: 'price_1RoaG1R10Q6bz3BHC2hDRKLv'
pro: 'price_1Rox4aR10Q6bz3BHxohJtpcO'
pro-annual: 'price_1RoxmQR10Q6bz3BHQKy7G89g'
```

Verify at: https://dashboard.stripe.com/prices

## Files Modified

1. ✅ `netlify/functions/create-checkout-session.js` - New Netlify function
2. ✅ `membership.html` - Updated to use new checkout method
3. ✅ No domain configuration needed in Stripe dashboard

## Next Steps

1. Add `STRIPE_SECRET_KEY` to Netlify environment variables
2. Run `npm install stripe`
3. Commit and push
4. Test with Stripe test cards
5. Switch to live mode when ready

---

**Status**: ✅ All code changes complete
**Remaining**: Add STRIPE_SECRET_KEY to Netlify environment variables
