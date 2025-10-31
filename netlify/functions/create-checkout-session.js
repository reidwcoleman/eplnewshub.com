require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  try {
    const { email, userId } = JSON.parse(event.body);

    if (!email || !email.includes('@')) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Please provide a valid email address'
        })
      };
    }

    // Get the origin from headers
    const origin = event.headers.origin || event.headers.referer?.replace(/\/$/, '') || 'https://eplnewshub.com';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/family-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/family-join.html`,
      customer_email: email,
      client_reference_id: userId || email,
      metadata: {
        email: email,
        userId: userId || '',
        accessType: 'family'
      }
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        success: true,
        sessionId: session.id,
        url: session.url
      })
    };

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Failed to create checkout session. Please try again.'
      })
    };
  }
};
