# Stripe Payment Integration Setup Guide

This guide will help you set up Stripe payment processing for EPL News Hub Premium memberships.

## Step 1: Create a Stripe Account

1. Go to [stripe.com](https://stripe.com) and click "Start now"
2. Create your account and complete the verification process
3. Once verified, you'll have access to your Stripe Dashboard

## Step 2: Get Your API Keys

1. In your Stripe Dashboard, go to "Developers" → "API keys"
2. You'll see two types of keys:
   - **Publishable key** (starts with `pk_`): Safe to use in client-side code
   - **Secret key** (starts with `sk_`): Keep this secure, server-side only

3. Copy your **Publishable key** for now

## Step 3: Update Your Membership Page

In `membership.html`, replace the placeholder Stripe key (line ~690):

```javascript
// Replace this line:
const stripe = Stripe('pk_test_your_stripe_publishable_key_here');

// With your actual publishable key:
const stripe = Stripe('pk_test_your_actual_key_here');
```

## Step 4: Create Products and Prices in Stripe

### Method 1: Using Stripe Dashboard (Recommended for beginners)

1. Go to "Products" in your Stripe Dashboard
2. Click "Add product"
3. Create these products:

#### Starter Monthly
- **Name**: EPL News Hub Starter
- **Pricing**: £4.99/month (recurring)
- **Copy the Price ID** (starts with `price_`)

#### Pro Monthly  
- **Name**: EPL News Hub Pro
- **Pricing**: £9.99/month (recurring)

#### Elite Monthly
- **Name**: EPL News Hub Elite  
- **Pricing**: £19.99/month (recurring)

#### Annual Plans
- **Starter Annual**: £49.99/year
- **Pro Annual**: £99.99/year  
- **Elite Annual**: £199.99/year

### Method 2: Using Stripe CLI (Advanced)

```bash
# Install Stripe CLI first
stripe products create --name="EPL News Hub Starter" --description="Access to exclusive EPL articles"
stripe prices create --product=prod_xxx --unit-amount=499 --currency=gbp --recurring-interval=month
```

## Step 5: Update Price IDs in Your Code

In `membership.html`, update the `selectPlan()` function calls with your actual Price IDs:

```html
<!-- Replace these placeholder IDs -->
<button onclick="selectPlan('starter', 'price_actual_starter_monthly_id')">
<button onclick="selectPlan('pro', 'price_actual_pro_monthly_id')">
<button onclick="selectPlan('elite', 'price_actual_elite_monthly_id')">
```

## Step 6: Set Up Checkout Sessions (Backend Required)

For production, you'll need a backend service to create secure checkout sessions. Here are your options:

### Option A: Netlify Functions (Recommended for static sites)

1. Create `netlify/functions/create-checkout.js`:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { priceId, userId } = JSON.parse(event.body);

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}/membership`,
      client_reference_id: userId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

2. Update your `selectPlan()` function in `membership.html`:

```javascript
async function selectPlan(planType, priceId) {
    const user = window.auth.currentUser;
    if (!user) {
        alert('Please sign in first');
        return;
    }

    try {
        // Call your backend to create checkout session
        const response = await fetch('/.netlify/functions/create-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priceId, userId: user.uid })
        });

        const { sessionId } = await response.json();
        
        // Redirect to Stripe Checkout
        const { error } = await stripe.redirectToCheckout({ sessionId });
        
        if (error) {
            console.error('Stripe error:', error);
            alert('Payment failed. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Something went wrong. Please try again.');
    }
}
```

### Option B: Vercel Functions

Similar to Netlify, but create `api/create-checkout.js` instead.

### Option C: Firebase Functions

If you want to stick with Firebase ecosystem:

```javascript
const functions = require('firebase-functions');
const stripe = require('stripe')(functions.config().stripe.secret_key);

exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  const { priceId } = data;
  const userId = context.auth.uid;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: 'https://eplnewshub.com/success',
    cancel_url: 'https://eplnewshub.com/membership',
    client_reference_id: userId,
  });

  return { sessionId: session.id };
});
```

## Step 7: Handle Successful Payments

Create `success.html` to handle post-payment:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Payment Successful | EPL News Hub</title>
</head>
<body>
    <h1>🎉 Welcome to EPL News Hub Premium!</h1>
    <p>Your payment was successful. You now have access to exclusive content.</p>
    <a href="/">Return to Homepage</a>
    
    <script>
        // Update user's membership status
        const membership = {
            plan: 'premium',
            status: 'active',
            startDate: new Date().toISOString(),
            nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        localStorage.setItem('membership', JSON.stringify(membership));
    </script>
</body>
</html>
```

## Step 8: Set Up Webhooks (Important!)

1. In Stripe Dashboard, go to "Developers" → "Webhooks"
2. Click "Add endpoint"
3. Add your endpoint URL: `https://yoursite.com/.netlify/functions/stripe-webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

5. Create the webhook handler:

```javascript
// netlify/functions/stripe-webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  const sig = event.headers['stripe-signature'];
  
  try {
    const stripeEvent = stripe.webhooks.constructEvent(
      event.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        // Update user's membership in your database
        console.log('Payment successful:', stripeEvent.data.object);
        break;
      case 'customer.subscription.deleted':
        // Cancel user's membership
        console.log('Subscription cancelled:', stripeEvent.data.object);
        break;
    }

    return { statusCode: 200, body: 'OK' };
  } catch (error) {
    console.error('Webhook error:', error);
    return { statusCode: 400, body: 'Webhook Error' };
  }
};
```

## Step 9: Environment Variables

Set these environment variables in your hosting platform:

```
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key  
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Step 10: Test Your Integration

1. Use Stripe's test card numbers:
   - Success: `4242 4242 4242 4242`
   - Failure: `4000 0000 0000 0002`

2. Test the complete flow:
   - Sign in to your site
   - Go to membership page
   - Select a plan
   - Complete payment with test card
   - Verify access to premium content

## Step 11: Go Live

1. In Stripe Dashboard, toggle from "Test mode" to "Live mode"
2. Update your code with live API keys
3. Test with a small real payment first
4. Monitor your Stripe Dashboard for issues

## Security Best Practices

- ✅ Never expose your secret key in client-side code
- ✅ Always validate webhooks with signatures
- ✅ Use HTTPS for all webhook endpoints
- ✅ Store sensitive data server-side only
- ✅ Implement proper error handling
- ✅ Log important events for debugging

## Troubleshooting

### Common Issues:

1. **"No such price"** error
   - Check that your Price IDs are correct
   - Ensure you're using the right test/live mode

2. **Webhook not working**
   - Verify your endpoint URL is accessible
   - Check webhook secret is correct
   - Look at webhook logs in Stripe Dashboard

3. **Payment not updating membership**
   - Check webhook handler is working
   - Verify database updates are happening
   - Look at server logs for errors

## Cost Breakdown

**Stripe Fees:**
- 2.9% + 30p per successful transaction
- No monthly fees or setup costs
- Additional fees for international cards

**Example:** £9.99 subscription = £0.59 Stripe fee (you receive £9.40)

---

This setup gives you a professional, secure payment system that scales with your business. The current implementation uses localStorage for simplicity, but you should integrate with a proper database for production use.