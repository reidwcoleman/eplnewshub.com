/**
 * FPL User Authentication & Account System
 * Handles user registration, login, and session management
 */

class FPLAuthSystem {
    constructor() {
        this.currentUser = null;
        this.sessionToken = null;
        this.apiBaseUrl = '/api/auth'; // Update with your actual API endpoint
        this.localStorageKey = 'fpl_auth_session';
        this.userDataKey = 'fpl_user_data';
        this.authCallbacks = new Set();
        
        // Initialize on creation
        this.init();
    }

    /**
     * Initialize authentication system
     */
    async init() {
        // Check for existing session
        this.loadSession();
        
        // Set up session heartbeat
        this.startSessionHeartbeat();
        
        // Listen for storage events (cross-tab sync)
        window.addEventListener('storage', (e) => {
            if (e.key === this.localStorageKey) {
                this.handleSessionChange(e);
            }
        });
    }

    /**
     * Load existing session from localStorage
     */
    loadSession() {
        try {
            const sessionData = localStorage.getItem(this.localStorageKey);
            if (sessionData) {
                const session = JSON.parse(sessionData);
                
                // Check if session is still valid
                if (session.expires > Date.now()) {
                    this.sessionToken = session.token;
                    this.currentUser = session.user;
                    this.notifyAuthChange(true);
                    return true;
                } else {
                    // Session expired, clear it
                    this.clearSession();
                }
            }
        } catch (error) {
            console.error('Error loading session:', error);
        }
        return false;
    }

    /**
     * Register new user
     */
    async register(userData) {
        try {
            // Validate input
            const validation = this.validateRegistration(userData);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            // Hash password client-side (additional server-side hashing required)
            const hashedPassword = await this.hashPassword(userData.password);

            // Prepare registration data
            const registrationData = {
                email: userData.email.toLowerCase().trim(),
                username: userData.username.trim(),
                password: hashedPassword,
                fplTeamId: userData.fplTeamId || null,
                preferences: {
                    favoriteTeam: userData.favoriteTeam || null,
                    notifications: userData.notifications || false,
                    publicProfile: userData.publicProfile || false
                },
                createdAt: Date.now()
            };

            // For demo purposes, using IndexedDB instead of real API
            const user = await this.createUserInDB(registrationData);
            
            // Auto-login after successful registration
            await this.login({
                email: userData.email,
                password: userData.password
            });

            return {
                success: true,
                user: user,
                message: 'Account created successfully!'
            };
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                message: error.message || 'Registration failed'
            };
        }
    }

    /**
     * User login
     */
    async login(credentials) {
        try {
            const { email, password } = credentials;
            
            // Validate input
            if (!email || !password) {
                throw new Error('Email and password are required');
            }

            // For demo purposes, using IndexedDB
            const user = await this.authenticateUser(email, password);
            
            if (!user) {
                throw new Error('Invalid email or password');
            }

            // Generate session token
            const sessionToken = this.generateSessionToken();
            const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

            // Store session
            const session = {
                token: sessionToken,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    fplTeamId: user.fplTeamId,
                    preferences: user.preferences,
                    stats: user.stats || {}
                },
                expires: sessionExpiry
            };

            this.sessionToken = sessionToken;
            this.currentUser = session.user;

            // Save to localStorage
            localStorage.setItem(this.localStorageKey, JSON.stringify(session));

            // Update last login
            await this.updateUserLastLogin(user.id);

            // Notify listeners
            this.notifyAuthChange(true);

            // Load user data
            await this.loadUserData();

            return {
                success: true,
                user: this.currentUser,
                token: sessionToken
            };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.message || 'Login failed'
            };
        }
    }

    /**
     * User logout
     */
    async logout() {
        try {
            // Clear session
            this.clearSession();
            
            // Notify listeners
            this.notifyAuthChange(false);
            
            // Clear user data from UI
            this.clearUserDataFromUI();
            
            return {
                success: true,
                message: 'Logged out successfully'
            };
        } catch (error) {
            console.error('Logout error:', error);
            return {
                success: false,
                message: 'Logout failed'
            };
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null && this.sessionToken !== null;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Update user profile
     */
    async updateProfile(updates) {
        if (!this.isAuthenticated()) {
            return { success: false, message: 'Not authenticated' };
        }

        try {
            // Update user in database
            const updatedUser = await this.updateUserInDB(this.currentUser.id, updates);
            
            // Update current user object
            this.currentUser = { ...this.currentUser, ...updatedUser };
            
            // Update session
            const session = JSON.parse(localStorage.getItem(this.localStorageKey));
            session.user = this.currentUser;
            localStorage.setItem(this.localStorageKey, JSON.stringify(session));
            
            return {
                success: true,
                user: this.currentUser,
                message: 'Profile updated successfully'
            };
        } catch (error) {
            console.error('Profile update error:', error);
            return {
                success: false,
                message: 'Failed to update profile'
            };
        }
    }

    /**
     * Clear session
     */
    clearSession() {
        this.sessionToken = null;
        this.currentUser = null;
        localStorage.removeItem(this.localStorageKey);
        localStorage.removeItem(this.userDataKey);
    }

    /**
     * Start session heartbeat
     */
    startSessionHeartbeat() {
        setInterval(() => {
            if (this.isAuthenticated()) {
                const session = JSON.parse(localStorage.getItem(this.localStorageKey));
                if (session && session.expires < Date.now() + (60 * 60 * 1000)) {
                    // Extend session if less than 1 hour remaining
                    session.expires = Date.now() + (24 * 60 * 60 * 1000);
                    localStorage.setItem(this.localStorageKey, JSON.stringify(session));
                }
            }
        }, 5 * 60 * 1000); // Check every 5 minutes
    }

    /**
     * Handle session changes (cross-tab sync)
     */
    handleSessionChange(event) {
        if (event.newValue) {
            // Session created or updated in another tab
            this.loadSession();
        } else {
            // Session cleared in another tab
            this.clearSession();
            this.notifyAuthChange(false);
        }
    }

    /**
     * Register auth state change callback
     */
    onAuthStateChange(callback) {
        this.authCallbacks.add(callback);
        
        // Return unsubscribe function
        return () => {
            this.authCallbacks.delete(callback);
        };
    }

    /**
     * Notify auth state change
     */
    notifyAuthChange(isAuthenticated) {
        this.authCallbacks.forEach(callback => {
            try {
                callback(isAuthenticated, this.currentUser);
            } catch (error) {
                console.error('Auth callback error:', error);
            }
        });
    }

    /**
     * Load user data (predictions, stats, etc.)
     */
    async loadUserData() {
        if (!this.isAuthenticated()) return;

        try {
            const userData = await this.getUserDataFromDB(this.currentUser.id);
            
            if (userData) {
                localStorage.setItem(this.userDataKey, JSON.stringify(userData));
                
                // Update UI with user data
                this.updateUIWithUserData(userData);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    /**
     * Update UI with user data
     */
    updateUIWithUserData(userData) {
        // Dispatch custom event for UI components
        window.dispatchEvent(new CustomEvent('fpl-user-data-loaded', {
            detail: userData
        }));
    }

    /**
     * Clear user data from UI
     */
    clearUserDataFromUI() {
        window.dispatchEvent(new CustomEvent('fpl-user-data-cleared'));
    }

    /**
     * Validate registration data
     */
    validateRegistration(data) {
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            return { valid: false, message: 'Invalid email address' };
        }

        // Username validation
        if (!data.username || data.username.length < 3) {
            return { valid: false, message: 'Username must be at least 3 characters' };
        }

        // Password validation
        if (!data.password || data.password.length < 8) {
            return { valid: false, message: 'Password must be at least 8 characters' };
        }

        // Password strength check
        const hasUpperCase = /[A-Z]/.test(data.password);
        const hasLowerCase = /[a-z]/.test(data.password);
        const hasNumbers = /\d/.test(data.password);
        const hasSpecialChar = /[!@#$%^&*]/.test(data.password);

        if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
            return { 
                valid: false, 
                message: 'Password must contain uppercase, lowercase, and numbers' 
            };
        }

        return { valid: true };
    }

    /**
     * Hash password (simplified - use proper hashing in production)
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode(...new Uint8Array(hash)));
    }

    /**
     * Generate session token
     */
    generateSessionToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode(...array));
    }

    /**
     * Database operations (IndexedDB for demo)
     */
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('FPLUserDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Users store
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
                    userStore.createIndex('email', 'email', { unique: true });
                    userStore.createIndex('username', 'username', { unique: true });
                }
                
                // User data store
                if (!db.objectStoreNames.contains('userData')) {
                    const dataStore = db.createObjectStore('userData', { keyPath: 'userId' });
                    dataStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    /**
     * Create user in database
     */
    async createUserInDB(userData) {
        if (!this.db) await this.initDatabase();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            
            const request = store.add(userData);
            
            request.onsuccess = () => {
                userData.id = request.result;
                resolve(userData);
            };
            
            request.onerror = () => {
                if (request.error.name === 'ConstraintError') {
                    reject(new Error('Email or username already exists'));
                } else {
                    reject(request.error);
                }
            };
        });
    }

    /**
     * Authenticate user
     */
    async authenticateUser(email, password) {
        if (!this.db) await this.initDatabase();
        
        return new Promise(async (resolve) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const index = store.index('email');
            
            const request = index.get(email.toLowerCase().trim());
            
            request.onsuccess = async () => {
                const user = request.result;
                if (user) {
                    // Verify password
                    const hashedPassword = await this.hashPassword(password);
                    if (user.password === hashedPassword) {
                        resolve(user);
                    } else {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            };
            
            request.onerror = () => resolve(null);
        });
    }

    /**
     * Update user in database
     */
    async updateUserInDB(userId, updates) {
        if (!this.db) await this.initDatabase();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            
            const getRequest = store.get(userId);
            
            getRequest.onsuccess = () => {
                const user = getRequest.result;
                const updatedUser = { ...user, ...updates, updatedAt: Date.now() };
                
                const putRequest = store.put(updatedUser);
                
                putRequest.onsuccess = () => resolve(updatedUser);
                putRequest.onerror = () => reject(putRequest.error);
            };
            
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * Update user last login
     */
    async updateUserLastLogin(userId) {
        return this.updateUserInDB(userId, { lastLogin: Date.now() });
    }

    /**
     * Get user data from database
     */
    async getUserDataFromDB(userId) {
        if (!this.db) await this.initDatabase();
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['userData'], 'readonly');
            const store = transaction.objectStore('userData');
            
            const request = store.get(userId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        });
    }
}

// Create singleton instance
const fplAuth = new FPLAuthSystem();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FPLAuthSystem;
}