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

exports.handler = async (event, context) => {
  const email = event.path.split('/').pop();

  if (!email || !email.includes('@')) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        message: 'Please provide a valid email address'
      })
    };
  }

  try {
    const users = readUsers();
    const user = users.find(u => u.email.toLowerCase() === decodeURIComponent(email).toLowerCase());

    if (!user) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          hasAccess: false
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        hasAccess: !!user.familyAccess,
        grantedAt: user.familyAccessGrantedAt || null
      })
    };
  } catch (error) {
    console.error('Family access check error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'An error occurred while checking access'
      })
    };
  }
};
