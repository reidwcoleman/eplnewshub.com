# Netlify Deployment Guide for EPL News Hub

## Step 1: Connect to Netlify

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub" and authorize Netlify
4. Select repository: `reidwcoleman/eplnewshub.com`

## Step 2: Configure Build Settings

- **Build command:** Leave empty (static site)
- **Publish directory:** `.` (root)
- **Functions directory:** `netlify/functions` (auto-detected)

## Step 3: Set Environment Variables

In Netlify Dashboard → Site settings → Environment variables, add:

```
STRIPE_SECRET_KEY=<your-stripe-secret-key-from-stripe-dashboard>
STRIPE_PRICE_ID=price_1SOOX5R10Q6bz3BHHG41VhbP
```

Get your Stripe secret key from: https://dashboard.stripe.com/apikeys

## Step 4: Configure Custom Domain

1. In Netlify Dashboard → Domain settings → Add custom domain
2. Enter: `eplnewshub.com`
3. Netlify will provide DNS settings

## Step 5: Update DNS (at your domain registrar)

### Option A: Use Netlify DNS (Recommended)
1. Go to your domain registrar (where you bought eplnewshub.com)
2. Change nameservers to Netlify's (they'll provide these)

### Option B: Use A Record
1. Go to your domain registrar's DNS settings
2. Delete existing A records for GitHub Pages
3. Add new A record pointing to Netlify's IP (they'll provide this)
4. Add CNAME for www subdomain

## Step 6: Enable HTTPS

Netlify will automatically provision SSL certificate for eplnewshub.com (takes ~1 minute)

## Step 7: Test Payment Flow

1. Visit https://eplnewshub.com/family-join.html
2. Enter test email
3. Should redirect to Stripe checkout
4. After payment, redirects to family-success.html
5. Access family-public.html and family-private.html with email

## API Endpoints

Once deployed, these endpoints will be available:

- `https://eplnewshub.com/api/create-checkout-session` - Create Stripe checkout
- `https://eplnewshub.com/api/verify-payment/:sessionId` - Verify payment
- `https://eplnewshub.com/api/family-access/:email` - Check family access

## Troubleshooting

### Functions not working?
- Check environment variables are set correctly
- Check function logs: Netlify Dashboard → Functions → Logs

### Payment not processing?
- Verify STRIPE_SECRET_KEY is the live key (starts with sk_live_)
- Check Stripe Dashboard for payment events

### Domain not working?
- DNS changes can take 24-48 hours to propagate
- Use https://dnschecker.org to verify DNS changes
