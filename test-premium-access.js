/**
 * Test Script for Premium Access
 * Run this in the browser console to test premium membership features
 */

// Function to simulate sign-in with premium membership
function testPremiumSignIn() {
    // Simulate a signed-in user
    const testUser = {
        uid: 'test-user-123',
        email: 'testuser@example.com',
        displayName: 'Test User',
        photoURL: null,
        emailVerified: true,
        provider: 'email',
        signedInAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
    };
    
    // Store user data
    localStorage.setItem('eplhub_user', JSON.stringify(testUser));
    localStorage.setItem('user', JSON.stringify(testUser)); // For backward compatibility
    
    // Create premium membership data
    const premiumMembership = {
        userId: testUser.uid,
        plan: 'pro', // Can be 'free', 'starter', or 'pro'
        status: 'active',
        startedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        billingCycle: 'monthly',
        features: [
            'FPL AI Assistant',
            'Transfer Simulator Pro',
            'Player Predictor',
            'Team Analyzer',
            'Advanced Analytics',
            'Ad-free experience',
            'Priority Support'
        ],
        paymentMethod: 'test',
        autoRenew: true,
        lastVerified: new Date().toISOString()
    };
    
    // Store membership data
    localStorage.setItem('eplhub_membership', JSON.stringify(premiumMembership));
    localStorage.setItem('membership', JSON.stringify(premiumMembership)); // For backward compatibility
    
    // Create user profile data
    const userProfile = {
        userId: testUser.uid,
        preferences: {
            favoriteTeam: 'Liverpool',
            favoritePlayer: 'Mohamed Salah',
            notifications: true,
            theme: 'light'
        },
        stats: {
            articlesRead: 42,
            predictionsMade: 15,
            toolsUsed: ['fpl-ai-assistant', 'transfer-simulator-pro'],
            lastVisit: new Date().toISOString()
        },
        fplData: {
            teamId: '1234567',
            currentRank: 50000,
            previousRanks: [75000, 60000, 50000],
            savedTeams: []
        },
        savedContent: {
            bookmarkedArticles: [],
            favoriteTools: ['fpl-ai-assistant'],
            notes: []
        },
        achievements: ['Early Adopter', 'Premium Member'],
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days ago
    };
    
    // Store user profile
    localStorage.setItem('eplhub_user_data', JSON.stringify(userProfile));
    
    console.log('✅ Test premium user signed in successfully!');
    console.log('User:', testUser);
    console.log('Membership:', premiumMembership);
    console.log('Profile:', userProfile);
    
    // Reload the page to apply changes
    console.log('🔄 Reloading page to apply changes...');
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// Function to test different membership levels
function testMembershipLevel(level = 'pro') {
    const membership = JSON.parse(localStorage.getItem('eplhub_membership') || '{}');
    membership.plan = level; // 'free', 'starter', or 'pro'
    
    if (level === 'free') {
        membership.status = 'active';
        membership.features = [
            'Read unlimited articles',
            'View live scores and standings',
            'Basic FPL tools',
            'Community features'
        ];
    } else if (level === 'starter') {
        membership.features = [
            'FPL AI Assistant',
            'Transfer Simulator',
            'Team Analyzer',
            'Player Statistics',
            'Ad-free experience'
        ];
    }
    
    localStorage.setItem('eplhub_membership', JSON.stringify(membership));
    localStorage.setItem('membership', JSON.stringify(membership));
    
    console.log(`✅ Membership level changed to: ${level}`);
    console.log('🔄 Reloading page...');
    
    setTimeout(() => {
        window.location.reload();
    }, 500);
}

// Function to test expired membership
function testExpiredMembership() {
    const membership = JSON.parse(localStorage.getItem('eplhub_membership') || '{}');
    membership.expiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Expired yesterday
    membership.status = 'expired';
    
    localStorage.setItem('eplhub_membership', JSON.stringify(membership));
    localStorage.setItem('membership', JSON.stringify(membership));
    
    console.log('✅ Membership set to expired');
    console.log('🔄 Reloading page...');
    
    setTimeout(() => {
        window.location.reload();
    }, 500);
}

// Function to clear all test data
function clearTestData() {
    const keysToRemove = [
        'eplhub_user',
        'eplhub_membership',
        'eplhub_user_data',
        'eplhub_session',
        'user',
        'membership',
        'eplMembership',
        'authToken'
    ];
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
    });
    
    console.log('✅ All test data cleared');
    console.log('🔄 Reloading page...');
    
    setTimeout(() => {
        window.location.reload();
    }, 500);
}

// Function to check current auth status
function checkAuthStatus() {
    if (window.userAuthManager) {
        console.log('Current User:', window.userAuthManager.currentUser);
        console.log('Is Premium Active:', window.userAuthManager.isPremiumActive());
        console.log('Current Plan:', window.userAuthManager.getCurrentPlan());
        console.log('Membership Data:', window.userAuthManager.membershipData);
        
        // Check access to specific tools
        const tools = ['fpl-ai-assistant', 'transfer-simulator-pro', 'team-analyzer'];
        tools.forEach(tool => {
            console.log(`Has access to ${tool}:`, window.userAuthManager.hasToolAccess(tool));
        });
    } else {
        console.error('❌ User Auth Manager not loaded');
    }
}

// Instructions
console.log(`
===========================================
🧪 PREMIUM ACCESS TEST SCRIPT LOADED
===========================================

Available test functions:

1. testPremiumSignIn()     - Sign in as a test user with Pro membership
2. testMembershipLevel('starter')  - Change membership level (free/starter/pro)
3. testExpiredMembership() - Test expired membership behavior
4. clearTestData()         - Clear all test data and sign out
5. checkAuthStatus()       - Check current authentication status

Example usage:
- Type: testPremiumSignIn()
- Then visit any premium tool page

===========================================
`);