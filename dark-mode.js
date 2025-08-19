// Dark Mode Toggle Functionality

(function() {
    // Constants
    const THEME_KEY = 'eplnewshub-theme';
    const DARK_THEME = 'dark';
    const LIGHT_THEME = 'light';
    
    // Initialize theme on page load
    function initializeTheme() {
        // Check localStorage for saved theme preference
        const savedTheme = localStorage.getItem(THEME_KEY);
        
        // Check system preference if no saved theme
        if (!savedTheme) {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            const defaultTheme = prefersDark ? DARK_THEME : LIGHT_THEME;
            setTheme(defaultTheme, false);
        } else {
            setTheme(savedTheme, false);
        }
        
        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Only apply system preference if user hasn't manually set a theme
                if (!localStorage.getItem(THEME_KEY)) {
                    setTheme(e.matches ? DARK_THEME : LIGHT_THEME, false);
                }
            });
        }
    }
    
    // Set theme function
    function setTheme(theme, savePreference = true) {
        // Set data attribute on root element
        document.documentElement.setAttribute('data-theme', theme);
        
        // Add transition class for smooth switching
        document.body.classList.add('theme-transitioning');
        setTimeout(() => {
            document.body.classList.remove('theme-transitioning');
        }, 300);
        
        // Save preference to localStorage if requested
        if (savePreference) {
            localStorage.setItem(THEME_KEY, theme);
        }
        
        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.content = theme === DARK_THEME ? '#1a1a1a' : '#38003c';
        }
        
        // Dispatch custom event for other scripts to listen to
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme: theme }
        }));
    }
    
    // Toggle theme function (exposed globally)
    window.toggleTheme = function() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || LIGHT_THEME;
        const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
        setTheme(newTheme);
        
        // Show notification
        showThemeNotification(newTheme);
    };
    
    // Get current theme (exposed globally)
    window.getCurrentTheme = function() {
        return document.documentElement.getAttribute('data-theme') || LIGHT_THEME;
    };
    
    // Set theme programmatically (exposed globally)
    window.setTheme = function(theme) {
        if (theme === DARK_THEME || theme === LIGHT_THEME) {
            setTheme(theme);
        }
    };
    
    // Show theme change notification
    function showThemeNotification(theme) {
        // Remove existing notification if any
        const existingNotification = document.querySelector('.theme-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'theme-notification';
        notification.innerHTML = `
            <span>${theme === DARK_THEME ? '🌙 Dark mode enabled' : '☀️ Light mode enabled'}</span>
        `;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${theme === DARK_THEME ? 'linear-gradient(135deg, #2d2d30, #3e3e42)' : 'linear-gradient(135deg, #38003c, #00ff87)'};
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: 600;
            font-size: 0.95rem;
            animation: slideUp 0.3s ease, fadeOut 0.3s ease 1.7s forwards;
            pointer-events: none;
        `;
        
        // Add animation styles if not already present
        if (!document.querySelector('style[data-theme-animations]')) {
            const style = document.createElement('style');
            style.setAttribute('data-theme-animations', 'true');
            style.textContent = `
                @keyframes slideUp {
                    from {
                        transform: translateX(-50%) translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                }
                @keyframes fadeOut {
                    from {
                        opacity: 1;
                    }
                    to {
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after animation
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 2000);
    }
    
    // Initialize on DOM content loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTheme);
    } else {
        // DOM is already loaded
        initializeTheme();
    }
    
    // Apply theme immediately to prevent flash
    (function() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', DARK_THEME);
        }
    })();
})();

// Keyboard shortcut for theme toggle (Alt + T or Cmd + Shift + L)
document.addEventListener('keydown', function(e) {
    // Alt + T
    if (e.altKey && e.key === 't') {
        e.preventDefault();
        window.toggleTheme();
    }
    // Cmd/Ctrl + Shift + L
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        window.toggleTheme();
    }
});

// Add theme toggle to mobile menu if it doesn't exist
document.addEventListener('DOMContentLoaded', function() {
    const mobileNavLinks = document.querySelector('.mobile-nav-links');
    if (mobileNavLinks && !mobileNavLinks.querySelector('.mobile-theme-toggle')) {
        // Create mobile theme toggle item
        const divider = document.createElement('li');
        divider.className = 'nav-divider';
        
        const themeToggleItem = document.createElement('li');
        themeToggleItem.className = 'mobile-theme-toggle';
        themeToggleItem.innerHTML = `
            <a href="#" onclick="event.preventDefault(); toggleTheme(); toggleMobileMenu();">
                <span class="theme-mobile-icon">🌓</span> Toggle Dark Mode
            </a>
        `;
        
        // Add before the last divider or at the end
        const lastDivider = Array.from(mobileNavLinks.children)
            .reverse()
            .find(child => child.classList.contains('nav-divider'));
        
        if (lastDivider) {
            mobileNavLinks.insertBefore(divider, lastDivider);
            mobileNavLinks.insertBefore(themeToggleItem, lastDivider);
        } else {
            mobileNavLinks.appendChild(divider);
            mobileNavLinks.appendChild(themeToggleItem);
        }
    }
});

// Persist theme across page navigation
window.addEventListener('pageshow', function(event) {
    // Re-apply theme when navigating back/forward
    if (event.persisted) {
        const savedTheme = localStorage.getItem('eplnewshub-theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
    }
});

// Export functions for use in other scripts
window.ThemeManager = {
    toggle: window.toggleTheme,
    getCurrent: window.getCurrentTheme,
    set: window.setTheme,
    DARK: 'dark',
    LIGHT: 'light'
};