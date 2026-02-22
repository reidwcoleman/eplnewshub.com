// Universal Ad Placement System for EPL News Hub
// Loads on every page via header.html. Skips pages that have their own ad scripts.
// Places clean, designated ad units and kills all rogue Google auto-ads.

(function () {
  'use strict';

  var AD_CLIENT = 'ca-pub-6480210605786899';
  var AD_SLOT = '2887667887';

  // Pages that should never show ads
  var NO_AD_PAGES = [
    '/signin.html', '/create-account.html', '/account.html',
    '/membership.html', '/membership-success.html', '/membership-old.html',
    '/private_policy.html', '/terms.html', '/cookies.html',
    '/manage-subscription.html', '/unsubscribe.html',
    '/admin.html', '/offline.html'
  ];

  function shouldSkip() {
    var path = window.location.pathname;

    // Skip no-ad pages
    for (var i = 0; i < NO_AD_PAGES.length; i++) {
      if (path === NO_AD_PAGES[i]) return true;
    }

    // Skip if homepage-ads.js or editorial-ads.js already placed ads
    if (document.querySelector('.hp-ad-unit') || document.querySelector('.ed-ad-unit')) return true;

    // Skip if we already ran
    if (document.querySelector('.sa-ad-unit')) return true;

    return false;
  }

  function injectStyles() {
    if (document.getElementById('sa-ad-styles')) return;

    var style = document.createElement('style');
    style.id = 'sa-ad-styles';
    style.textContent =
      '.sa-ad-unit {' +
        'margin: 32px auto;' +
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

      '.sa-ad-unit::before {' +
        'content: "";' +
        'display: block;' +
        'width: 48px;' +
        'height: 1px;' +
        'background: rgba(240, 236, 228, 0.12);' +
        'margin: 0 auto 16px;' +
      '}' +

      '.sa-ad-unit::after {' +
        'content: "";' +
        'display: block;' +
        'width: 48px;' +
        'height: 1px;' +
        'background: rgba(240, 236, 228, 0.12);' +
        'margin: 16px auto 0;' +
      '}' +

      '.sa-ad-unit ins.adsbygoogle {' +
        'display: block !important;' +
        'width: 100% !important;' +
        'min-height: 90px;' +
        'max-width: 100%;' +
        'overflow: hidden;' +
      '}' +

      '.sa-ad-label {' +
        'display: block;' +
        'font-family: "DM Sans", -apple-system, sans-serif;' +
        'font-size: 9px;' +
        'font-weight: 500;' +
        'letter-spacing: 0.12em;' +
        'text-transform: uppercase;' +
        'color: rgba(138, 133, 120, 0.5);' +
        'margin-bottom: 12px;' +
      '}' +

      // Hide ALL Google ads not inside any designated container
      'ins.adsbygoogle:not(.sa-ad-unit ins):not(.hp-ad-unit ins):not(.ed-ad-unit ins) {' +
        'display: none !important;' +
        'height: 0 !important;' +
        'max-height: 0 !important;' +
        'visibility: hidden !important;' +
        'overflow: hidden !important;' +
        'position: absolute !important;' +
        'pointer-events: none !important;' +
      '}' +

      // Kill anchor/banner/vignette/overlay ads
      'ins.adsbygoogle[data-anchor-shown],' +
      'ins.adsbygoogle[data-anchor-status],' +
      'div[id^="google_ads_iframe"][style*="position: fixed"],' +
      'div[id^="aswift_"][style*="position: fixed"],' +
      'iframe[id^="aswift_"][style*="position: fixed"],' +
      'div[style*="position: fixed"][style*="bottom: 0"],' +
      'div[style*="position: fixed"][style*="z-index: 2147"] {' +
        'display: none !important;' +
        'height: 0 !important;' +
        'max-height: 0 !important;' +
        'visibility: hidden !important;' +
        'overflow: hidden !important;' +
      '}' +

      // Mobile responsive — edge-to-edge using viewport width
      '@media (max-width: 768px) {' +
        '.sa-ad-unit {' +
          'position: relative;' +
          'left: 50%;' +
          'transform: translateX(-50%);' +
          'width: 100vw;' +
          'max-width: 100vw;' +
          'margin: 24px 0;' +
          'padding: 16px 16px;' +
          'background: rgba(240, 236, 228, 0.02);' +
          'border-top: 1px solid rgba(240, 236, 228, 0.06);' +
          'border-bottom: 1px solid rgba(240, 236, 228, 0.06);' +
          'box-sizing: border-box;' +
          'overflow: hidden;' +
        '}' +
        '.sa-ad-unit::before, .sa-ad-unit::after { display: none; }' +
        '.sa-ad-unit ins.adsbygoogle { min-height: 100px; max-height: 300px; }' +
        '.sa-ad-label { font-size: 8px; margin-bottom: 8px; }' +
      '}' +

      '@media (max-width: 480px) {' +
        '.sa-ad-unit { margin: 18px 0; padding: 14px 12px; }' +
      '}' +

      '@media (max-width: 360px) {' +
        '.sa-ad-unit { margin: 14px 0; padding: 12px 10px; }' +
      '}';

    document.head.appendChild(style);
  }

  function createAdUnit(position) {
    var wrapper = document.createElement('div');
    wrapper.className = 'sa-ad-unit';
    wrapper.setAttribute('data-position', position);

    var label = document.createElement('span');
    label.className = 'sa-ad-label';
    label.textContent = 'Advertisement';

    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.style.minHeight = '90px';
    ins.setAttribute('data-ad-client', AD_CLIENT);
    ins.setAttribute('data-ad-slot', AD_SLOT);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');

    wrapper.appendChild(label);
    wrapper.appendChild(ins);
    return wrapper;
  }

  function pushAdSlot() {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) { /* AdSense picks it up later */ }
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

  // Find the main content area of any page
  function findMainContent() {
    return (
      document.querySelector('main') ||
      document.querySelector('.site-content') ||
      document.querySelector('.page-content') ||
      document.querySelector('.container') ||
      document.querySelector('[role="main"]')
    );
  }

  // Get significant child elements (skip tiny elements, scripts, styles)
  function getContentSections(parent) {
    var children = parent.children;
    var sections = [];
    for (var i = 0; i < children.length; i++) {
      var el = children[i];
      var tag = el.tagName;

      // Skip non-content elements
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'LINK' || tag === 'META') continue;

      // Skip hidden elements
      if (el.offsetHeight === 0 && el.offsetWidth === 0) continue;

      // Skip header/footer includes (they have their own treatment)
      if (el.classList.contains('header') || el.classList.contains('footer')) continue;

      // Skip elements that are just wrappers with no real content
      if (el.offsetHeight < 20) continue;

      sections.push(el);
    }
    return sections;
  }

  function placeAds() {
    if (shouldSkip()) return;

    injectStyles();

    var main = findMainContent();
    if (!main) return;

    // Find the deepest single-child container (some pages nest containers)
    var content = main;
    while (content.children.length === 1 && content.firstElementChild &&
           !content.firstElementChild.classList.contains('header') &&
           !content.firstElementChild.classList.contains('footer')) {
      var child = content.firstElementChild;
      var tag = child.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE') break;
      if (child.children.length === 0) break;
      content = child;
    }

    var sections = getContentSections(content);
    if (sections.length === 0) return;

    var adsPlaced = 0;
    var maxAds = 5;

    // Determine placement interval based on section count
    // Aim for an ad every 2-3 sections, max 5 ads
    var interval;
    if (sections.length <= 3) {
      interval = 1; // Ad after every section (but max 2 on small pages)
      maxAds = Math.min(2, sections.length);
    } else if (sections.length <= 6) {
      interval = 2;
      maxAds = 3;
    } else {
      interval = Math.max(2, Math.floor(sections.length / 5));
      maxAds = 5;
    }

    // Place ads between content sections
    for (var i = 0; i < sections.length && adsPlaced < maxAds; i++) {
      // Place after every `interval` sections, starting after the first
      if ((i + 1) % interval === 0 && i < sections.length - 1) {
        var ad = createAdUnit('sa-' + (adsPlaced + 1));
        insertAfter(ad, sections[i]);
        pushAdSlot();
        adsPlaced++;
      }
    }

    // Always place one ad at the bottom of content if we haven't hit max
    if (adsPlaced < maxAds && sections.length > 0) {
      var lastSection = sections[sections.length - 1];
      // Only if we didn't just place one after the last section
      if (!lastSection.nextElementSibling || !lastSection.nextElementSibling.classList.contains('sa-ad-unit')) {
        var bottomAd = createAdUnit('sa-bottom');
        insertAfter(bottomAd, lastSection);
        pushAdSlot();
        adsPlaced++;
      }
    }
  }

  // Kill rogue ads on all pages (even pages with their own scripts, as a safety net)
  function killRogueAds() {
    document.querySelectorAll('ins.adsbygoogle').forEach(function (el) {
      if (el.closest('.sa-ad-unit') || el.closest('.hp-ad-unit') || el.closest('.ed-ad-unit')) return;
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('height', '0', 'important');
      el.style.setProperty('max-height', '0', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
      el.style.setProperty('overflow', 'hidden', 'important');
    });

    document.querySelectorAll(
      'div[id^="aswift_"][style*="position: fixed"],' +
      'iframe[id^="aswift_"][style*="position: fixed"],' +
      'div[id^="google_ads_iframe"][style*="position: fixed"]'
    ).forEach(function (el) {
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('height', '0', 'important');
    });
  }

  function watchForRogueAds() {
    killRogueAds();

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

  // Wait for page to be ready — includes may still be loading
  function init() {
    // On pages with homepage-ads.js or editorial-ads.js, just do rogue ad killing
    if (document.querySelector('.hp-ad-unit') || document.querySelector('.ed-ad-unit')) {
      watchForRogueAds();
      return;
    }

    placeAds();
    watchForRogueAds();
  }

  // Run after a short delay to let includes load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(init, 300);
    });
  } else {
    setTimeout(init, 300);
  }

  // Also re-check after window load (includes may finish later)
  window.addEventListener('load', function () {
    if (!document.querySelector('.sa-ad-unit') && !shouldSkip()) {
      placeAds();
    }
    killRogueAds();
  });
})();
