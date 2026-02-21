// Editorial Ad Placement System for EPL News Hub
// Places clean, well-spaced ad units throughout articles.
// Positions: after hero, every 2 h2 sections, after body, after related, before comments.

(function () {
  'use strict';

  var AD_CLIENT = 'ca-pub-6480210605786899';

  function getArticleBody() {
    return (
      document.querySelector('.article-body') ||
      document.querySelector('.article-content') ||
      document.querySelector('.nyt-article')
    );
  }

  // Remove any old static ad blocks from the HTML template
  function removeOldAds() {
    document.querySelectorAll('.article-ad').forEach(function (el) {
      var ins = el.querySelector('ins.adsbygoogle');
      if (ins) ins.remove();
      el.remove();
    });
  }

  function injectStyles() {
    if (document.getElementById('editorial-ad-styles')) return;

    var style = document.createElement('style');
    style.id = 'editorial-ad-styles';
    style.textContent =
      '.ed-ad-unit {' +
        'margin: 40px auto;' +
        'padding: 20px 0;' +
        'width: 100%;' +
        'max-width: 728px;' +
        'text-align: center;' +
        'background: transparent;' +
        'position: relative;' +
        'clear: both;' +
        'overflow: hidden;' +
        'z-index: 1;' +
      '}' +

      '.ed-ad-unit::before {' +
        'content: "";' +
        'display: block;' +
        'width: 48px;' +
        'height: 1px;' +
        'background: rgba(240, 236, 228, 0.12);' +
        'margin: 0 auto 16px;' +
      '}' +

      '.ed-ad-unit::after {' +
        'content: "";' +
        'display: block;' +
        'width: 48px;' +
        'height: 1px;' +
        'background: rgba(240, 236, 228, 0.12);' +
        'margin: 16px auto 0;' +
      '}' +

      '.ed-ad-unit ins.adsbygoogle {' +
        'display: block !important;' +
        'width: 100% !important;' +
        'min-height: 90px;' +
        'max-width: 100%;' +
        'overflow: hidden;' +
      '}' +

      '.ed-ad-label {' +
        'display: block;' +
        'font-family: "DM Sans", -apple-system, sans-serif;' +
        'font-size: 9px;' +
        'font-weight: 500;' +
        'letter-spacing: 0.12em;' +
        'text-transform: uppercase;' +
        'color: rgba(138, 133, 120, 0.5);' +
        'margin-bottom: 12px;' +
      '}' +

      // Outer ad units (hero, related, comments) get subtle background
      '.ed-ad-unit[data-position="hero"],' +
      '.ed-ad-unit[data-position="post-related"],' +
      '.ed-ad-unit[data-position="pre-comments"] {' +
        'padding: 24px 16px;' +
        'background: rgba(240, 236, 228, 0.02);' +
        'border-radius: 2px;' +
      '}' +

      // Hide ALL Google ads that are NOT inside our .ed-ad-unit containers
      'body > ins.adsbygoogle,' +
      'html > ins.adsbygoogle,' +
      'ins.adsbygoogle:not(.ed-ad-unit ins) {' +
        'display: none !important;' +
        'height: 0 !important;' +
        'max-height: 0 !important;' +
        'visibility: hidden !important;' +
        'overflow: hidden !important;' +
        'position: absolute !important;' +
        'pointer-events: none !important;' +
      '}' +

      // Kill anchor/banner/vignette/overlay ads (all screen sizes)
      'ins.adsbygoogle[data-anchor-shown],' +
      'ins.adsbygoogle[data-anchor-status],' +
      'ins.adsbygoogle[data-ad-status="filled"]:not(.ed-ad-unit ins),' +
      'div[id^="google_ads_iframe"][style*="position: fixed"],' +
      'div[id^="aswift_"][style*="position: fixed"],' +
      'iframe[id^="aswift_"][style*="position: fixed"],' +
      '#mobile-sticky-banner,' +
      '#sticky-sidebar-ad,' +
      'div[style*="position: fixed"][style*="bottom: 0"],' +
      'div[style*="position: fixed"][style*="z-index: 2147"],' +
      'aside[style*="position: fixed"] {' +
        'display: none !important;' +
        'height: 0 !important;' +
        'max-height: 0 !important;' +
        'visibility: hidden !important;' +
        'overflow: hidden !important;' +
      '}' +

      // Mobile: optimized ads — all positions visible, full width, clean spacing
      '@media (max-width: 600px) {' +
        '.ed-ad-unit {' +
          'margin: 24px -16px;' +
          'padding: 16px 12px;' +
          'max-width: none;' +
          'width: calc(100% + 32px);' +
        '}' +
        '.ed-ad-unit ins.adsbygoogle {' +
          'min-height: 100px;' +
          'max-height: 300px;' +
        '}' +
        '.ed-ad-unit::before, .ed-ad-unit::after {' +
          'width: 32px;' +
          'margin-bottom: 10px;' +
          'margin-top: 10px;' +
        '}' +
        '.ed-ad-label { font-size: 8px; margin-bottom: 8px; }' +
        // Outer units same treatment on mobile
        '.ed-ad-unit[data-position="hero"],' +
        '.ed-ad-unit[data-position="post-related"],' +
        '.ed-ad-unit[data-position="pre-comments"] {' +
          'padding: 16px 12px;' +
        '}' +
      '}';

    document.head.appendChild(style);
  }

  function createAdUnit(position) {
    var wrapper = document.createElement('div');
    wrapper.className = 'ed-ad-unit';
    wrapper.setAttribute('data-position', position);

    var label = document.createElement('span');
    label.className = 'ed-ad-label';
    label.textContent = 'Advertisement';

    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.style.minHeight = '90px';
    ins.setAttribute('data-ad-client', AD_CLIENT);
    ins.setAttribute('data-ad-slot', '2887667887');
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');

    wrapper.appendChild(label);
    wrapper.appendChild(ins);
    return wrapper;
  }

  // Find the last element before the next h2 (or end of parent)
  function findSectionEnd(h2) {
    var node = h2.nextElementSibling;
    while (node && node.tagName !== 'H2') {
      var next = node.nextElementSibling;
      if (!next || next.tagName === 'H2') return node;
      node = next;
    }
    return h2;
  }

  function pushAdSlot() {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) { /* AdSense will pick it up later */ }
  }

  function insertAfter(newNode, refNode) {
    if (refNode.nextSibling) {
      refNode.parentNode.insertBefore(newNode, refNode.nextSibling);
    } else {
      refNode.parentNode.appendChild(newNode);
    }
  }

  function insertBefore(newNode, refNode) {
    refNode.parentNode.insertBefore(newNode, refNode);
  }

  function placeAds() {
    var body = getArticleBody();
    if (!body) return;

    // Prevent double-run
    if (document.querySelector('.ed-ad-unit')) return;

    removeOldAds();
    injectStyles();

    var adsPlaced = 0;

    // 1. After hero image
    var hero = document.querySelector('.article-hero');
    if (hero) {
      var heroAd = createAdUnit('hero');
      insertAfter(heroAd, hero);
      pushAdSlot();
      adsPlaced++;
    }

    // 2. In-article ads: after every 2nd h2 section
    var h2s = body.querySelectorAll('h2');
    var count = h2s.length;
    var inArticlePositions = [];

    if (count >= 2) {
      // Place after section 2, 4, 6, etc. — every 2 sections
      for (var i = 1; i < count; i += 2) {
        inArticlePositions.push(i);
      }
    }

    // Cap in-article ads: max 3 for articles, scale with length
    var maxInArticle = Math.min(3, inArticlePositions.length);
    // For short articles (<=3 h2s), only 1 in-article ad
    if (count <= 3) maxInArticle = Math.min(1, inArticlePositions.length);

    for (var j = 0; j < maxInArticle; j++) {
      var idx = inArticlePositions[j];
      var h2 = h2s[idx];
      if (!h2) continue;

      var posName = j === 0 ? 'upper' : (j === 1 ? 'mid' : 'mid-lower');
      var anchor = findSectionEnd(h2);
      var adEl = createAdUnit(posName);
      insertAfter(adEl, anchor);
      pushAdSlot();
      adsPlaced++;
    }

    // 3. After article body (before tags)
    var tagsRow = document.querySelector('.tags-row');
    if (tagsRow) {
      var lowerAd = createAdUnit('lower');
      insertBefore(lowerAd, tagsRow);
      pushAdSlot();
      adsPlaced++;
    } else {
      var lowerAd2 = createAdUnit('lower');
      insertAfter(lowerAd2, body);
      pushAdSlot();
      adsPlaced++;
    }

    // 4. After related articles section
    var relatedSection = document.querySelector('.related-section');
    if (relatedSection) {
      var postRelatedAd = createAdUnit('post-related');
      insertAfter(postRelatedAd, relatedSection);
      pushAdSlot();
      adsPlaced++;
    }

    // 5. Before comments section
    var commentsSection = document.querySelector('.comments-section');
    if (commentsSection) {
      var preCommentsAd = createAdUnit('pre-comments');
      insertBefore(preCommentsAd, commentsSection);
      pushAdSlot();
      adsPlaced++;
    }
  }

  // Kill any Google-injected ad that is NOT inside our .ed-ad-unit containers
  function killRogueAds() {
    document.querySelectorAll('ins.adsbygoogle').forEach(function (el) {
      if (el.closest('.ed-ad-unit')) return; // Don't touch our own ads
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('height', '0', 'important');
      el.style.setProperty('max-height', '0', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
      el.style.setProperty('overflow', 'hidden', 'important');
    });

    // Also kill fixed-position ad iframes/divs
    document.querySelectorAll(
      'div[id^="aswift_"][style*="position: fixed"],' +
      'iframe[id^="aswift_"][style*="position: fixed"],' +
      'div[id^="google_ads_iframe"][style*="position: fixed"]'
    ).forEach(function (el) {
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('height', '0', 'important');
    });
  }

  // Watch for Google injecting new ads and kill them immediately
  function watchForRogueAds() {
    killRogueAds(); // Initial sweep

    var observer = new MutationObserver(function (mutations) {
      var needsCheck = false;
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (node.nodeType !== 1) continue;
          if (node.tagName === 'INS' || node.tagName === 'IFRAME' || node.tagName === 'DIV') {
            needsCheck = true;
            break;
          }
        }
        if (needsCheck) break;
      }
      if (needsCheck) killRogueAds();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      placeAds();
      watchForRogueAds();
    });
  } else {
    placeAds();
    watchForRogueAds();
  }
})();
