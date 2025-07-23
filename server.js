const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('./'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
}));
app.use(passport.initialize());
app.use(passport.session()); // Serve static files

// Ensure data files exist
const usersFile = path.join(__dirname, 'users.json');
const subscriptionsFile = path.join(__dirname, 'subscriptions.json');

if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
}

if (!fs.existsSync(subscriptionsFile)) {
    fs.writeFileSync(subscriptionsFile, JSON.stringify([]));
}

// Helper functions
function readUsers() {
    try {
        return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    } catch (error) {
        console.error('Error reading users file:', error);
        return [];
    }
}

function writeUsers(users) {
    try {
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing users file:', error);
        return false;
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function generateUserId() {
    return crypto.randomBytes(16).toString('hex');
}

// Passport configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
    scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const users = readUsers();
        
        // Check if user already exists
        let user = users.find(u => u.email === profile.emails[0].value);
        
        if (user) {
            // Update last login
            user.lastLogin = new Date().toISOString();
            writeUsers(users);
            return done(null, user);
        } else {
            // Create new user
            const newUser = {
                id: generateUserId(),
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                email: profile.emails[0].value,
                password: null, // No password for Google users
                country: 'Unknown',
                favoriteTeams: [],
                newsletter: false,
                createdAt: new Date().toISOString(),
                verified: true, // Google accounts are pre-verified
                verificationToken: null,
                lastLogin: new Date().toISOString(),
                isActive: true,
                provider: 'google',
                googleId: profile.id
            };
            
            users.push(newUser);
            writeUsers(users);
            return done(null, newUser);
        }
    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    const users = readUsers();
    const user = users.find(u => u.id === id);
    done(null, user);
});

// Endpoint to create account
app.post('/api/create-account', async (req, res) => {
    try {
        const { 
            firstName, 
            lastName, 
            email, 
            password, 
            country, 
            favoriteTeams, 
            newsletter,
            createdAt 
        } = req.body;

        // Validation
        if (!firstName || firstName.trim().length < 2) {
            return res.status(400).json({ message: 'First name must be at least 2 characters long' });
        }

        if (!lastName || lastName.trim().length < 2) {
            return res.status(400).json({ message: 'Last name must be at least 2 characters long' });
        }

        if (!email || !isValidEmail(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        if (!password || password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        if (!country) {
            return res.status(400).json({ message: 'Please select your country' });
        }

        // Check if user already exists
        const users = readUsers();
        const existingUser = users.find(user => user.email.toLowerCase() === email.toLowerCase());
        
        if (existingUser) {
            return res.status(409).json({ message: 'An account with this email already exists' });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user object
        const newUser = {
            id: generateUserId(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            country,
            favoriteTeams: favoriteTeams || [],
            newsletter: Boolean(newsletter),
            createdAt: createdAt || new Date().toISOString(),
            verified: false,
            verificationToken: crypto.randomBytes(32).toString('hex'),
            lastLogin: null,
            isActive: true
        };

        // Add user to database
        users.push(newUser);
        
        if (!writeUsers(users)) {
            return res.status(500).json({ message: 'Failed to save user data. Please try again.' });
        }

        // If user subscribed to newsletter, add to subscriptions
        if (newsletter) {
            try {
                const subscriptions = JSON.parse(fs.readFileSync(subscriptionsFile, 'utf8'));
                subscriptions.push({
                    name: `${firstName} ${lastName}`,
                    email: email,
                    source: 'account_creation',
                    createdAt: new Date().toISOString()
                });
                fs.writeFileSync(subscriptionsFile, JSON.stringify(subscriptions, null, 2));
            } catch (error) {
                console.error('Error adding to newsletter:', error);
            }
        }

        // Log successful account creation (without sensitive data)
        console.log(`New account created: ${email} at ${new Date().toISOString()}`);

        // Send success response (excluding sensitive data)
        res.status(201).json({
            message: 'Account created successfully',
            user: {
                id: newUser.id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                country: newUser.country,
                favoriteTeams: newUser.favoriteTeams,
                newsletter: newUser.newsletter,
                createdAt: newUser.createdAt
            }
        });

    } catch (error) {
        console.error('Account creation error:', error);
        res.status(500).json({ message: 'Internal server error. Please try again later.' });
    }
});

// Endpoint to handle subscription
app.post('/subscribe', (req, res) => {
    const { name, email, address } = req.body;

    try {
        const subscriptions = JSON.parse(fs.readFileSync(subscriptionsFile, 'utf8'));
        subscriptions.push({ 
            name, 
            email, 
            address,
            source: 'newsletter_signup',
            createdAt: new Date().toISOString()
        });
        fs.writeFileSync(subscriptionsFile, JSON.stringify(subscriptions, null, 2));
        res.json({ message: 'Subscription successful!' });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ message: 'Subscription failed. Please try again.' });
    }
});

// Endpoint to get user statistics (for admin)
app.get('/api/admin/stats', (req, res) => {
    try {
        const users = readUsers();
        const subscriptions = JSON.parse(fs.readFileSync(subscriptionsFile, 'utf8'));
        
        const stats = {
            totalUsers: users.length,
            totalSubscriptions: subscriptions.length,
            verifiedUsers: users.filter(user => user.verified).length,
            activeUsers: users.filter(user => user.isActive).length,
            usersByCountry: users.reduce((acc, user) => {
                acc[user.country] = (acc[user.country] || 0) + 1;
                return acc;
            }, {}),
            usersWithNewsletter: users.filter(user => user.newsletter).length
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ message: 'Failed to fetch statistics' });
    }
});

// Endpoint to get all newsletter subscribers (for admin)
app.get('/api/admin/subscribers', (req, res) => {
    try {
        const subscriptions = JSON.parse(fs.readFileSync(subscriptionsFile, 'utf8'));
        res.json(subscriptions);
    } catch (error) {
        console.error('Subscribers fetch error:', error);
        res.status(500).json({ message: 'Failed to fetch subscribers' });
    }
});

// Endpoint to clear all subscribers (for admin)
app.delete('/api/admin/clear-subscribers', (req, res) => {
    try {
        fs.writeFileSync(subscriptionsFile, JSON.stringify([]));
        res.json({ message: 'All subscribers cleared successfully' });
    } catch (error) {
        console.error('Clear subscribers error:', error);
        res.status(500).json({ message: 'Failed to clear subscribers' });
    }
});

// Google OAuth configuration endpoint
app.get('/api/google-config', (req, res) => {
    res.json({
        clientId: process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
        configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    });
});

// Check authentication status
app.get('/api/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            authenticated: true,
            user: {
                id: req.user.id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                email: req.user.email
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Google OAuth routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/signin.html' }),
    (req, res) => {
        // Successful authentication
        res.redirect('/');
    }
);

// Logout route
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.redirect('/');
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Account creation API available at: POST /api/create-account');
    console.log('Google OAuth available at: GET /auth/google');
    console.log(`Google OAuth configured: ${!!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}`);
});
