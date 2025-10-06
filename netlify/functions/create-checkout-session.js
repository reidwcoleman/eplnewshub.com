// Netlify function to create Stripe Checkout Sessions
// This bypasses domain whitelisting issues

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { priceId, customerEmail, planType, userId } = JSON.parse(event.body);

        if (!priceId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Price ID is required' })
            };
        }

        // Determine the domain dynamically
        const origin = event.headers.origin || 'https://eplnewshub.com';
        const protocol = origin.startsWith('https') ? 'https' : 'http';
        const host = origin.replace(/^https?:\/\//, '');

        const successUrl = `${protocol}://${host}/membership-success.html?plan=${planType}&email=${encodeURIComponent(customerEmail)}&session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${protocol}://${host}/membership.html`;

        console.log('Creating checkout session for:', {
            priceId,
            customerEmail,
            planType,
            successUrl,
            cancelUrl
        });

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: customerEmail,
            client_reference_id: userId, // For tracking
            metadata: {
                planType: planType,
                userId: userId
            },
            allow_promotion_codes: true, // Allow discount codes
            billing_address_collection: 'auto',
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                sessionId: session.id,
                url: session.url
            })
        };

    } catch (error) {
        console.error('Stripe Checkout Session Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to create checkout session',
                message: error.message
            })
        };
    }
};
