// Traffic Analytics and Monitoring for EPL News Hub
// Tracks user engagement and content performance

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        // Enable/disable different tracking features
        trackScrollDepth: true,
        trackTimeOnPage: true,
        trackClicks: true,
        trackSocialShares: true,
        trackSearchQueries: true,
        
        // Thresholds
        scrollThresholds: [25, 50, 75, 90, 100],
        timeThresholds: [30, 60, 120, 300], // seconds
        
        // Sampling rate (1.0 = 100%, 0.1 = 10%)
        samplingRate: 1.0
    };

    // Analytics data collection
    const analytics = {
        sessionData: {
            startTime: Date.now(),
            pageViews: 0,
            scrollDepth: 0,
            timeOnPage: 0,
            clicks: 0,
            socialShares: 0,
            searchQueries: 0
        },
        
        events: []
    };

    // 1. Page View Tracking
    function trackPageView() {
        analytics.sessionData.pageViews++;
        
        const pageData = {
            event: 'page_view',
            timestamp: Date.now(),
            url: window.location.href,
            title: document.title,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown'
        };
        
        analytics.events.push(pageData);
        sendToAnalytics('pageview', pageData);
    }

    // 2. Scroll Depth Tracking
    function initScrollTracking() {
        if (!CONFIG.trackScrollDepth) return;
        
        let maxScroll = 0;
        const trackedThresholds = new Set();
        
        function trackScroll() {
            const scrollPercent = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
            
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                analytics.sessionData.scrollDepth = maxScroll;
            }
            
            CONFIG.scrollThresholds.forEach(threshold => {
                if (scrollPercent >= threshold && !trackedThresholds.has(threshold)) {
                    trackedThresholds.add(threshold);
                    
                    const eventData = {
                        event: 'scroll_depth',
                        timestamp: Date.now(),
                        percentage: threshold,
                        url: window.location.href
                    };
                    
                    analytics.events.push(eventData);
                    sendToAnalytics('scroll', eventData);
                }
            });
        }
        
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(trackScroll, 100);
        }, { passive: true });
    }

    // 3. Time on Page Tracking
    function initTimeTracking() {
        if (!CONFIG.trackTimeOnPage) return;
        
        const trackedTimes = new Set();
        
        function checkTimeThresholds() {
            const timeOnPage = Math.round((Date.now() - analytics.sessionData.startTime) / 1000);
            analytics.sessionData.timeOnPage = timeOnPage;
            
            CONFIG.timeThresholds.forEach(threshold => {
                if (timeOnPage >= threshold && !trackedTimes.has(threshold)) {
                    trackedTimes.add(threshold);
                    
                    const eventData = {
                        event: 'time_on_page',
                        timestamp: Date.now(),
                        seconds: threshold,
                        url: window.location.href
                    };
                    
                    analytics.events.push(eventData);
                    sendToAnalytics('timing', eventData);
                }
            });
        }
        
        setInterval(checkTimeThresholds, 5000); // Check every 5 seconds
    }

    // 4. Click Tracking
    function initClickTracking() {
        if (!CONFIG.trackClicks) return;
        
        document.addEventListener('click', (event) => {
            analytics.sessionData.clicks++;
            
            const target = event.target;
            const clickData = {
                event: 'click',
                timestamp: Date.now(),
                element: target.tagName.toLowerCase(),
                className: target.className,
                id: target.id,
                text: target.textContent?.substring(0, 100),
                url: window.location.href,
                targetUrl: target.href || null
            };
            
            // Track specific elements of interest
            if (target.matches('a, button, .fpl-card, .stat-card, .share-btn')) {
                analytics.events.push(clickData);
                sendToAnalytics('click', clickData);
            }
            
            // Track internal vs external links
            if (target.tagName === 'A' && target.href) {
                const isInternal = target.href.includes(window.location.hostname);
                clickData.linkType = isInternal ? 'internal' : 'external';
                
                if (!isInternal) {
                    sendToAnalytics('outbound_click', clickData);
                }
            }
        }, true);
    }

    // 5. Social Share Tracking
    function initSocialShareTracking() {
        if (!CONFIG.trackSocialShares) return;
        
        // Track share button clicks
        document.addEventListener('click', (event) => {
            const target = event.target;
            
            if (target.matches('.share-btn, [class*="share"]')) {
                analytics.sessionData.socialShares++;
                
                const platform = target.className.includes('twitter') ? 'twitter' :
                               target.className.includes('facebook') ? 'facebook' :
                               target.className.includes('linkedin') ? 'linkedin' :
                               'other';
                
                const shareData = {
                    event: 'social_share',
                    timestamp: Date.now(),
                    platform: platform,
                    url: window.location.href,
                    title: document.title
                };
                
                analytics.events.push(shareData);
                sendToAnalytics('social', shareData);
            }
        });
    }

    // 6. Search Query Tracking (for site search)
    function initSearchTracking() {
        if (!CONFIG.trackSearchQueries) return;
        
        // Track search form submissions
        document.addEventListener('submit', (event) => {
            const form = event.target;
            const searchInput = form.querySelector('input[type="search"], input[name*="search"], input[name*="query"]');
            
            if (searchInput && searchInput.value.trim()) {
                analytics.sessionData.searchQueries++;
                
                const searchData = {
                    event: 'site_search',
                    timestamp: Date.now(),
                    query: searchInput.value.trim(),
                    url: window.location.href
                };
                
                analytics.events.push(searchData);
                sendToAnalytics('search', searchData);
            }
        });
    }

    // 7. Performance Metrics Tracking
    function trackPerformanceMetrics() {
        // Track page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                
                if (perfData) {
                    const performanceData = {
                        event: 'performance',
                        timestamp: Date.now(),
                        loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
                        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
                        url: window.location.href
                    };
                    
                    analytics.events.push(performanceData);
                    sendToAnalytics('performance', performanceData);
                }
            }, 1000);
        });
    }

    // 8. Content Performance Tracking
    function trackContentPerformance() {
        // Track which articles are most engaging
        const article = document.querySelector('.nyt-article');
        if (!article) return;
        
        const headings = article.querySelectorAll('h1, h2, h3');
        const wordCount = article.textContent.trim().split(/\s+/).length;
        
        const contentData = {
            event: 'content_analysis',
            timestamp: Date.now(),
            wordCount: wordCount,
            headingCount: headings.length,
            imageCount: article.querySelectorAll('img').length,
            linkCount: article.querySelectorAll('a').length,
            url: window.location.href,
            title: document.title
        };
        
        analytics.events.push(contentData);
        sendToAnalytics('content', contentData);
    }

    // 9. User Engagement Scoring
    function calculateEngagementScore() {
        const timeWeight = Math.min(analytics.sessionData.timeOnPage / 120, 1); // Cap at 2 minutes
        const scrollWeight = analytics.sessionData.scrollDepth / 100;
        const clickWeight = Math.min(analytics.sessionData.clicks / 5, 1); // Cap at 5 clicks
        const shareWeight = analytics.sessionData.socialShares > 0 ? 1 : 0;
        
        return Math.round((timeWeight * 0.4 + scrollWeight * 0.3 + clickWeight * 0.2 + shareWeight * 0.1) * 100);
    }

    // 10. Send data to analytics service
    function sendToAnalytics(type, data) {
        // Sample the data based on sampling rate
        if (Math.random() > CONFIG.samplingRate) return;
        
        // Send to Google Analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', type, {
                event_category: 'Engagement',
                event_label: data.url,
                value: data.percentage || data.seconds || 1,
                custom_map: { custom_data: JSON.stringify(data) }
            });
        }
        
        // Send to custom analytics endpoint (implement as needed)
        fetch('/api/analytics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: type,
                data: data,
                sessionId: getSessionId(),
                timestamp: Date.now()
            })
        }).catch(error => {
            console.log('Analytics tracking failed:', error);
        });
    }

    // Helper function to get/create session ID
    function getSessionId() {
        let sessionId = sessionStorage.getItem('eplnewshub_session');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('eplnewshub_session', sessionId);
        }
        return sessionId;
    }

    // 11. Session Summary on Page Unload
    function trackSessionEnd() {
        window.addEventListener('beforeunload', () => {
            const sessionSummary = {
                event: 'session_end',
                timestamp: Date.now(),
                sessionDuration: Date.now() - analytics.sessionData.startTime,
                engagementScore: calculateEngagementScore(),
                ...analytics.sessionData,
                url: window.location.href
            };
            
            // Use sendBeacon for reliable delivery
            if (navigator.sendBeacon) {
                navigator.sendBeacon('/api/analytics', JSON.stringify({
                    type: 'session_summary',
                    data: sessionSummary,
                    sessionId: getSessionId()
                }));
            }
        });
    }

    // 12. A/B Testing Support
    function initABTesting() {
        const tests = {
            'headline_style': ['original', 'bold', 'question'],
            'cta_color': ['green', 'blue', 'red'],
            'article_layout': ['standard', 'sidebar', 'minimal']
        };
        
        Object.entries(tests).forEach(([testName, variants]) => {
            if (!localStorage.getItem(`ab_test_${testName}`)) {
                const variant = variants[Math.floor(Math.random() * variants.length)];
                localStorage.setItem(`ab_test_${testName}`, variant);
                
                // Track the assignment
                sendToAnalytics('ab_test_assignment', {
                    testName: testName,
                    variant: variant,
                    url: window.location.href
                });
            }
        });
    }

    // Initialize all tracking
    function initTrafficAnalytics() {
        trackPageView();
        initScrollTracking();
        initTimeTracking();
        initClickTracking();
        initSocialShareTracking();
        initSearchTracking();
        trackPerformanceMetrics();
        trackContentPerformance();
        trackSessionEnd();
        initABTesting();
        
        console.log('Traffic analytics initialized');
    }

    // Export analytics object for debugging
    window.EPLAnalytics = {
        getSessionData: () => analytics.sessionData,
        getEvents: () => analytics.events,
        getEngagementScore: calculateEngagementScore,
        sendCustomEvent: (type, data) => sendToAnalytics(type, data)
    };

    // Start tracking when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTrafficAnalytics);
    } else {
        initTrafficAnalytics();
    }

})();