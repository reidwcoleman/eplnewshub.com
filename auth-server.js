require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('./'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
}));

// Database files
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize users file
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
}

// Helper functions
function readUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading users:', error);
        return [];
    }
}

function writeUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing users:', error);
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

// Authentication middleware
function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).json({ success: false, message: 'Not authenticated' });
}

// ==================== API ROUTES ====================

// Create account
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters'
            });
        }

        const users = readUsers();

        // Check if user already exists
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: generateUserId(),
            email: email.toLowerCase(),
            name: name || email.split('@')[0],
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            hasPremium: true, // All authenticated users get premium access
            tier: 'premium'
        };

        users.push(newUser);
        writeUsers(users);

        // Create session
        req.session.userId = newUser.id;
        req.session.email = newUser.email;

        res.json({
            success: true,
            message: 'Account created successfully',
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                hasPremium: newUser.hasPremium
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// Sign in
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const users = readUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        writeUsers(users);

        // Create session
        req.session.userId = user.id;
        req.session.email = user.email;

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                hasPremium: user.hasPremium,
                lastLogin: user.lastLogin
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// Sign out
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error logging out'
            });
        }
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    });
});

// Check authentication status
app.get('/api/auth/status', (req, res) => {
    if (req.session && req.session.userId) {
        const users = readUsers();
        const user = users.find(u => u.id === req.session.userId);

        if (user) {
            return res.json({
                authenticated: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    hasPremium: user.hasPremium,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin
                }
            });
        }
    }

    res.json({ authenticated: false });
});

// Get user profile (protected route)
app.get('/api/auth/profile', isAuthenticated, (req, res) => {
    const users = readUsers();
    const user = users.find(u => u.id === req.session.userId);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    res.json({
        success: true,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            hasPremium: user.hasPremium,
            tier: user.tier,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
        }
    });
});

// Update user profile (protected route)
app.put('/api/auth/profile', isAuthenticated, async (req, res) => {
    try {
        const { name, currentPassword, newPassword } = req.body;
        const users = readUsers();
        const userIndex = users.findIndex(u => u.id === req.session.userId);

        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[userIndex];

        // Update name if provided
        if (name) {
            user.name = name;
        }

        // Update password if provided
        if (currentPassword && newPassword) {
            const isValidPassword = await bcrypt.compare(currentPassword, user.password);

            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            if (newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'New password must be at least 8 characters'
                });
            }

            user.password = await bcrypt.hash(newPassword, 10);
        }

        users[userIndex] = user;
        writeUsers(users);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                hasPremium: user.hasPremium
            }
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating profile'
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        usersCount: readUsers().length
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Authentication Server Running`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🔐 Session Secret: ${process.env.SESSION_SECRET ? 'Configured' : 'Using generated secret'}`);
    console.log(`📁 Users Database: ${USERS_FILE}`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`   POST   /api/auth/register  - Create new account`);
    console.log(`   POST   /api/auth/login     - Sign in`);
    console.log(`   POST   /api/auth/logout    - Sign out`);
    console.log(`   GET    /api/auth/status    - Check auth status`);
    console.log(`   GET    /api/auth/profile   - Get user profile (protected)`);
    console.log(`   PUT    /api/auth/profile   - Update profile (protected)`);
    console.log(`   GET    /api/health         - Health check`);
    console.log(`\n✅ Server ready to accept requests\n`);
});

module.exports = app;
