// EPL News Hub - Engagement Maximizer & User Retention System
// Keeps users on site longer and encourages return visits

(function() {
    'use strict';
    
    // Push Notifications Setup
    function setupPushNotifications() {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            // Create notification opt-in banner
            const notificationBanner = document.createElement('div');
            notificationBanner.className = 'notification-banner';
            notificationBanner.innerHTML = `
                <style>
                    .notification-banner {
                        position: fixed;
                        top: 70px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 15px 20px;
                        border-radius: 50px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                        z-index: 10000;
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        max-width: 500px;
                        animation: dropDown 0.5s ease;
                    }
                    
                    @keyframes dropDown {
                        from {
                            top: -100px;
                            opacity: 0;
                        }
                        to {
                            top: 70px;
                            opacity: 1;
                        }
                    }
                    
                    .notification-icon {
                        font-size: 24px;
                    }
                    
                    .notification-text {
                        flex: 1;
                        font-size: 14px;
                        font-weight: 500;
                    }
                    
                    .notification-buttons {
                        display: flex;
                        gap: 10px;
                    }
                    
                    .notification-btn {
                        padding: 8px 16px;
                        border: none;
                        border-radius: 20px;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 14px;
                        transition: transform 0.2s;
                    }
                    
                    .notification-btn:hover {
                        transform: scale(1.05);
                    }
                    
                    .notification-btn.allow {
                        background: white;
                        color: #667eea;
                    }
                    
                    .notification-btn.later {
                        background: transparent;
                        color: white;
                        border: 1px solid white;
                    }
                    
                    @media (max-width: 768px) {
                        .notification-banner {
                            width: 90%;
                            max-width: none;
                            padding: 12px 15px;
                        }
                        
                        .notification-text {
                            font-size: 13px;
                        }
                    }
                </style>
                
                <span class="notification-icon">🔔</span>
                <span class="notification-text">Get instant EPL news alerts! Never miss breaking transfers & match updates</span>
                <div class="notification-buttons">
                    <button class="notification-btn allow" onclick="enableNotifications()">Enable</button>
                    <button class="notification-btn later" onclick="this.parentElement.parentElement.remove()">Later</button>
                </div>
            `;
            
            // Only show if not already accepted/rejected
            if (!localStorage.getItem('notificationPrompted')) {
                setTimeout(() => {
                    document.body.appendChild(notificationBanner);
                    localStorage.setItem('notificationPrompted', 'true');
                    
                    // Auto-hide after 10 seconds
                    setTimeout(() => {
                        if (notificationBanner.parentElement) {
                            notificationBanner.style.animation = 'dropDown 0.5s ease reverse';
                            setTimeout(() => notificationBanner.remove(), 500);
                        }
                    }, 10000);
                }, 5000); // Show after 5 seconds on page
            }
        }
    }
    
    // Enable push notifications
    window.enableNotifications = function() {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                // Show success message
                showNotificationSuccess();
                
                // Send test notification
                new Notification('EPL News Hub', {
                    body: '✅ You\'ll now receive breaking EPL news instantly!',
                    icon: '/eplnewshubnewlogo.png',
                    badge: '/eplnewshubnewlogo.png',
                    vibrate: [200, 100, 200]
                });
                
                // Store permission
                localStorage.setItem('pushEnabled', 'true');
            }
        });
        
        // Remove banner
        document.querySelector('.notification-banner')?.remove();
    };
    
    // Show notification success
    function showNotificationSuccess() {
        const success = document.createElement('div');
        success.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 100000;
            animation: slideInRight 0.5s ease;
        `;
        success.innerHTML = '✅ Notifications enabled successfully!';
        document.body.appendChild(success);
        
        setTimeout(() => success.remove(), 3000);
    }
    
    // Create reading progress bar
    function createProgressBar() {
        const progressBar = document.createElement('div');
        progressBar.className = 'reading-progress';
        progressBar.innerHTML = `
            <style>
                .reading-progress {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 4px;
                    z-index: 10000;
                    background: #f0f0f0;
                }
                
                .reading-progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                    width: 0%;
                    transition: width 0.2s ease;
                    box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
                }
                
                .reading-time-indicator {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    background: white;
                    padding: 10px 15px;
                    border-radius: 20px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    font-size: 12px;
                    font-weight: 600;
                    color: #666;
                    z-index: 9999;
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                
                .reading-time-indicator.visible {
                    opacity: 1;
                }
            </style>
            
            <div class="reading-progress-bar"></div>
        `;
        
        document.body.appendChild(progressBar);
        
        // Create time indicator
        const timeIndicator = document.createElement('div');
        timeIndicator.className = 'reading-time-indicator';
        document.body.appendChild(timeIndicator);
        
        // Update progress on scroll
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            
            document.querySelector('.reading-progress-bar').style.width = progress + '%';
            
            // Update time remaining
            if (progress > 10 && progress < 90) {
                const wordsRemaining = Math.max(0, Math.floor((100 - progress) * 3));
                const timeRemaining = Math.ceil(wordsRemaining / 200); // 200 words per minute
                
                timeIndicator.textContent = `${timeRemaining} min left`;
                timeIndicator.classList.add('visible');
            } else {
                timeIndicator.classList.remove('visible');
            }
            
            // Show completion message
            if (progress > 95 && !sessionStorage.getItem('articleCompleted')) {
                sessionStorage.setItem('articleCompleted', 'true');
                showCompletionMessage();
            }
        });
    }
    
    // Show article completion message with recommendations
    function showCompletionMessage() {
        const completion = document.createElement('div');
        completion.className = 'completion-message';
        completion.innerHTML = `
            <style>
                .completion-message {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: white;
                    padding: 20px;
                    border-radius: 15px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    max-width: 350px;
                    z-index: 10000;
                    animation: slideUp 0.5s ease;
                }
                
                @keyframes slideUp {
                    from {
                        bottom: -100px;
                        opacity: 0;
                    }
                    to {
                        bottom: 20px;
                        opacity: 1;
                    }
                }
                
                .completion-title {
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 10px;
                    color: #333;
                }
                
                .completion-text {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 15px;
                }
                
                .completion-cta {
                    width: 100%;
                    padding: 12px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                
                .completion-cta:hover {
                    transform: scale(1.02);
                }
                
                .completion-close {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #999;
                }
            </style>
            
            <button class="completion-close" onclick="this.parentElement.remove()">×</button>
            <div class="completion-title">🎉 Great read!</div>
            <div class="completion-text">You might also like our latest transfer news</div>
            <button class="completion-cta" onclick="window.location.href='/transfer-hub.html'">
                View Transfer Hub →
            </button>
        `;
        
        document.body.appendChild(completion);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (completion.parentElement) {
                completion.remove();
            }
        }, 10000);
    }
    
    // Create exit intent popup
    function createExitIntent() {
        let exitIntentShown = false;
        
        document.addEventListener('mouseout', (e) => {
            if (!exitIntentShown && e.clientY < 10 && e.relatedTarget === null) {
                exitIntentShown = true;
                
                const popup = document.createElement('div');
                popup.className = 'exit-intent-popup';
                popup.innerHTML = `
                    <style>
                        .exit-intent-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: rgba(0,0,0,0.7);
                            z-index: 99998;
                            animation: fadeIn 0.3s ease;
                        }
                        
                        .exit-intent-popup {
                            position: fixed;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            background: white;
                            padding: 40px;
                            border-radius: 20px;
                            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                            max-width: 500px;
                            z-index: 99999;
                            text-align: center;
                            animation: popIn 0.5s ease;
                        }
                        
                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        
                        @keyframes popIn {
                            from {
                                transform: translate(-50%, -50%) scale(0.8);
                                opacity: 0;
                            }
                            to {
                                transform: translate(-50%, -50%) scale(1);
                                opacity: 1;
                            }
                        }
                        
                        .exit-emoji {
                            font-size: 48px;
                            margin-bottom: 20px;
                        }
                        
                        .exit-title {
                            font-size: 28px;
                            font-weight: 800;
                            margin-bottom: 15px;
                            color: #333;
                        }
                        
                        .exit-text {
                            font-size: 16px;
                            color: #666;
                            margin-bottom: 25px;
                            line-height: 1.5;
                        }
                        
                        .exit-email {
                            width: 100%;
                            padding: 15px;
                            border: 2px solid #e0e0e0;
                            border-radius: 10px;
                            font-size: 16px;
                            margin-bottom: 15px;
                        }
                        
                        .exit-btn {
                            width: 100%;
                            padding: 15px;
                            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                            color: white;
                            border: none;
                            border-radius: 10px;
                            font-size: 16px;
                            font-weight: 700;
                            cursor: pointer;
                            transition: transform 0.2s;
                        }
                        
                        .exit-btn:hover {
                            transform: scale(1.02);
                        }
                        
                        .exit-close {
                            position: absolute;
                            top: 20px;
                            right: 20px;
                            background: none;
                            border: none;
                            font-size: 30px;
                            cursor: pointer;
                            color: #999;
                        }
                        
                        .exit-footer {
                            margin-top: 15px;
                            font-size: 12px;
                            color: #999;
                        }
                    </style>
                    
                    <div class="exit-intent-overlay" onclick="this.parentElement.remove()"></div>
                    
                    <button class="exit-close" onclick="this.parentElement.remove()">×</button>
                    <div class="exit-emoji">⚽</div>
                    <div class="exit-title">Wait! Don't Miss Out!</div>
                    <div class="exit-text">Get exclusive EPL news, transfer alerts, and FPL tips delivered to your inbox!</div>
                    <input type="email" class="exit-email" placeholder="Enter your email address">
                    <button class="exit-btn" onclick="subscribeEmail(this)">Get Free Updates</button>
                    <div class="exit-footer">Join 50,000+ EPL fans. Unsubscribe anytime.</div>
                `;
                
                document.body.appendChild(popup);
            }
        });
    }
    
    // Subscribe email function
    window.subscribeEmail = function(button) {
        const email = button.parentElement.querySelector('.exit-email').value;
        
        if (email && email.includes('@')) {
            // Store email
            const subscribers = JSON.parse(localStorage.getItem('eplSubscribers') || '[]');
            subscribers.push({
                email: email,
                date: new Date().toISOString(),
                source: 'exit-intent'
            });
            localStorage.setItem('eplSubscribers', JSON.stringify(subscribers));
            
            // Show success
            button.textContent = '✓ Subscribed!';
            button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            
            // Remove popup
            setTimeout(() => {
                button.closest('.exit-intent-popup').remove();
            }, 1500);
            
            // Track conversion
            if (typeof gtag !== 'undefined') {
                gtag('event', 'conversion', {
                    'event_category': 'engagement',
                    'event_label': 'email_signup'
                });
            }
        }
    };
    
    // Create sticky newsletter bar
    function createNewsletterBar() {
        const bar = document.createElement('div');
        bar.className = 'newsletter-bar';
        bar.innerHTML = `
            <style>
                .newsletter-bar {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(90deg, #37003c 0%, #6366f1 100%);
                    color: white;
                    padding: 15px;
                    z-index: 9998;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                    transform: translateY(100%);
                    transition: transform 0.5s ease;
                }
                
                .newsletter-bar.visible {
                    transform: translateY(0);
                }
                
                .newsletter-bar-text {
                    font-weight: 600;
                    font-size: 14px;
                }
                
                .newsletter-bar-input {
                    padding: 8px 15px;
                    border: none;
                    border-radius: 20px;
                    font-size: 14px;
                    width: 250px;
                }
                
                .newsletter-bar-btn {
                    padding: 8px 20px;
                    background: white;
                    color: #37003c;
                    border: none;
                    border-radius: 20px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                
                .newsletter-bar-btn:hover {
                    transform: scale(1.05);
                }
                
                .newsletter-bar-close {
                    position: absolute;
                    right: 15px;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                }
                
                @media (max-width: 768px) {
                    .newsletter-bar {
                        flex-direction: column;
                        padding: 20px;
                    }
                    
                    .newsletter-bar-input {
                        width: 100%;
                    }
                }
            </style>
            
            <span class="newsletter-bar-text">📧 Get Daily EPL Updates</span>
            <input type="email" class="newsletter-bar-input" placeholder="Your email address">
            <button class="newsletter-bar-btn" onclick="subscribeFromBar(this)">Subscribe</button>
            <button class="newsletter-bar-close" onclick="this.parentElement.classList.remove('visible')">×</button>
        `;
        
        document.body.appendChild(bar);
        
        // Show after scrolling
        window.addEventListener('scroll', () => {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            
            if (scrollPercent > 50 && !bar.classList.contains('visible') && !sessionStorage.getItem('newsletterShown')) {
                bar.classList.add('visible');
                sessionStorage.setItem('newsletterShown', 'true');
            }
        });
    }
    
    // Subscribe from bar
    window.subscribeFromBar = function(button) {
        const email = button.parentElement.querySelector('.newsletter-bar-input').value;
        
        if (email && email.includes('@')) {
            button.textContent = '✓ Subscribed!';
            setTimeout(() => {
                button.closest('.newsletter-bar').classList.remove('visible');
            }, 2000);
        }
    };
    
    // Initialize all engagement features
    function init() {
        setupPushNotifications();
        createProgressBar();
        createExitIntent();
        createNewsletterBar();
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();