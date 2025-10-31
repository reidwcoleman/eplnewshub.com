require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');
const path = require('path');

const usersFile = path.join('/tmp', 'users.json');

function readUsers() {
  try {
    if (fs.existsSync(usersFile)) {
      return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    }
    return [];
  } catch (error) {
    console.error('Error reading users:', error);
    return [];
  }
}

function writeUsers(users) {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing users:', error);
    return false;
  }
}

function generateUserId() {
  return require('crypto').randomBytes(16).toString('hex');
}

exports.handler = async (event, context) => {
  const sessionId = event.path.split('/').pop();

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const email = session.customer_email || session.metadata.email;

      // Grant family access
      const users = readUsers();
      let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        // Create new user with family access
        user = {
          id: generateUserId(),
          firstName: '',
          lastName: '',
          email: email.toLowerCase().trim(),
          password: null,
          country: 'Unknown',
          favoriteTeams: [],
          newsletter: false,
          createdAt: new Date().toISOString(),
          verified: true,
          verificationToken: null,
          lastLogin: new Date().toISOString(),
          isActive: true,
          familyAccess: true,
          familyAccessGrantedAt: new Date().toISOString(),
          stripeSessionId: session.id,
          subscription: {
            tier: 'free',
            status: 'inactive'
          }
        };
        users.push(user);
      } else {
        // Update existing user
        user.familyAccess = true;
        user.familyAccessGrantedAt = new Date().toISOString();
        user.stripeSessionId = session.id;
      }

      writeUsers(users);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          message: 'Family access granted!',
          user: {
            email: user.email,
            familyAccess: true
          }
        })
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Payment not completed'
        })
      };
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Failed to verify payment'
      })
    };
  }
};
