// Universal Ad Placement System for EPL News Hub
// Loads on every page via header.html. Skips pages that have their own ad scripts.
// Places clean, designated ad units and kills all rogue Google auto-ads.

(function () {
  'use strict';

  var AD_CLIENT = 'ca-pub-6480210605786899';
  var AD_SLOT = '2887667887';

  // Ensure the AdSense library is loaded (covers pages that don't have it in <head>)
  function ensureAdSenseLoaded() {
    if (document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle"]')) return;
    var s = document.createElement('script');
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + AD_CLIENT;
    s.async = true;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
  }

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
      'ins.adsbygoogle:not(.sa-ad-unit ins):not(.hp-ad-unit ins):not(.ed-ad-unit ins):not(.article-ad ins) {' +
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

  // Find the main content area of any page
  function findMainContent() {
    return (
      document.querySelector('main') ||
      document.querySelector('article') ||
      document.querySelector('.article-container') ||
      document.querySelector('.article-body') ||
      document.querySelector('.nyt-article') ||
      document.querySelector('.site-content') ||
      document.querySelector('.page-content') ||
      document.querySelector('.container') ||
      document.querySelector('[role="main"]')
    );
  }

  // Get visible content children of an element
  function getVisibleChildren(parent) {
    var result = [];
    var children = parent.children;
    for (var i = 0; i < children.length; i++) {
      var el = children[i];
      var tag = el.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'LINK' || tag === 'META') continue;
      if (el.offsetHeight === 0 && el.offsetWidth === 0) continue;
      if (el.offsetHeight < 20) continue;
      if (el.classList.contains('sa-ad-unit')) continue;
      if (el.classList.contains('header') || el.classList.contains('footer')) continue;
      result.push(el);
    }
    return result;
  }

  // Check if an element uses a vertical (block/column) layout
  function isVerticalLayout(el) {
    var style = window.getComputedStyle(el);
    var display = style.display;
    if (display === 'block' || display === 'flow-root' || display === 'list-item') return true;
    if (display === 'flex') {
      var dir = style.flexDirection;
      return dir === 'column' || dir === 'column-reverse';
    }
    if (display === 'grid') {
      var cols = style.gridTemplateColumns;
      if (!cols || cols === 'none') return true;
      var colParts = cols.split(/\s+/).filter(function (c) { return c && c !== '0px'; });
      return colParts.length <= 1;
    }
    return false;
  }

  // Check if an element uses a multi-column grid or flex-row wrap layout
  function isMultiColumnGrid(el) {
    var style = window.getComputedStyle(el);
    if (style.display === 'grid') {
      var cols = style.gridTemplateColumns;
      if (cols && cols !== 'none') {
        var colParts = cols.split(/\s+/).filter(function (c) { return c && c !== '0px'; });
        return colParts.length > 1;
      }
    }
    if (style.display === 'flex') {
      var dir = style.flexDirection;
      if (dir === 'row' || dir === 'row-reverse') {
        if (style.flexWrap === 'wrap' || style.flexWrap === 'wrap-reverse') {
          return el.children.length > 2;
        }
      }
    }
    return false;
  }

  // Split a multi-column grid into sub-grids with ad insertion points between them
  function splitGrid(gridEl, groupSize) {
    var visible = getVisibleChildren(gridEl);
    if (visible.length <= groupSize) return null;

    var parent = gridEl.parentNode;
    if (!parent) return null;

    var groups = [];
    for (var i = 0; i < visible.length; i += groupSize) {
      groups.push(visible.slice(i, i + groupSize));
    }
    if (groups.length <= 1) return null;

    var adPoints = [];

    for (var g = 0; g < groups.length; g++) {
      var subGrid = document.createElement('div');
      subGrid.className = gridEl.className;

      groups[g].forEach(function (child) {
        subGrid.appendChild(child);
      });

      parent.insertBefore(subGrid, gridEl);

      if (g < groups.length - 1) {
        adPoints.push(subGrid);
      }
    }

    gridEl.remove();
    return adPoints;
  }

  // Recursively flatten the DOM tree into ad placement points
  // Drills into tall vertical containers, splits multi-column grids
  function collectPlacementPoints(parent, depth) {
    if (depth > 4) return [];

    var visible = getVisibleChildren(parent);
    if (visible.length === 0) return [];

    var points = [];

    for (var i = 0; i < visible.length; i++) {
      var el = visible[i];

      // If element is tall with children, try to drill deeper for better placement
      if (el.offsetHeight > 600 && el.children.length > 2) {
        if (isMultiColumnGrid(el)) {
          // Split the grid into sub-grids with ad points between
          var splits = splitGrid(el, 6);
          if (splits) {
            points = points.concat(splits);
            continue;
          }
        } else if (isVerticalLayout(el)) {
          // Drill into vertical containers
          var inner = collectPlacementPoints(el, depth + 1);
          if (inner.length > 1) {
            points = points.concat(inner);
            continue;
          }
        }
      }

      points.push(el);
    }

    return points;
  }

  function placeAds() {
    if (shouldSkip()) return;

    injectStyles();

    var main = findMainContent();
    if (!main) return;

    // Unwrap single-child nesting (some pages nest containers deeply)
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

    // Collect placement points by drilling into the DOM tree
    var points = collectPlacementPoints(content, 0);
    if (points.length < 2) return;

    var adsPlaced = 0;
    var maxAds = 5;
    var MIN_GAP = 800; // minimum pixels between ads
    var FIRST_GAP = 300; // smaller gap for the first ad
    var lastAdY = 0;

    for (var i = 0; i < points.length - 1 && adsPlaced < maxAds; i++) {
      var el = points[i];
      if (!el.parentNode) continue;

      var rect = el.getBoundingClientRect();
      var bottomY = rect.bottom + window.scrollY;
      var gapNeeded = adsPlaced === 0 ? FIRST_GAP : MIN_GAP;

      if (bottomY - lastAdY >= gapNeeded) {
        var ad = createAdUnit('sa-' + (adsPlaced + 1));
        insertAfter(ad, el);
        pushAdSlot();
        adsPlaced++;
        lastAdY = bottomY;
      }
    }

    // Bottom ad if enough distance from last ad
    if (adsPlaced < maxAds && points.length > 0) {
      var last = points[points.length - 1];
      if (last.parentNode &&
          (!last.nextElementSibling || !last.nextElementSibling.classList.contains('sa-ad-unit'))) {
        var lastRect = last.getBoundingClientRect();
        var lastY = lastRect.bottom + window.scrollY;
        if (lastY - lastAdY >= 400) {
          insertAfter(createAdUnit('sa-bottom'), last);
          pushAdSlot();
        }
      }
    }
  }

  // Kill rogue ads on all pages (even pages with their own scripts, as a safety net)
  function killRogueAds() {
    document.querySelectorAll('ins.adsbygoogle').forEach(function (el) {
      if (el.closest('.sa-ad-unit') || el.closest('.hp-ad-unit') || el.closest('.ed-ad-unit') || el.closest('.article-ad')) return;
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
    ensureAdSenseLoaded();

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

    // Fallback: if content is loaded dynamically (e.g. news.html fetches articles.json),
    // watch for content being added and place ads once it appears
    if (!document.querySelector('.sa-ad-unit') && !shouldSkip()) {
      var main = findMainContent();
      if (main) {
        var contentObserver = new MutationObserver(function () {
          if (!document.querySelector('.sa-ad-unit') && !shouldSkip()) {
            var visible = getVisibleChildren(main);
            if (visible.length > 2) {
              contentObserver.disconnect();
              setTimeout(placeAds, 200);
            }
          }
        });
        contentObserver.observe(main, { childList: true, subtree: true });
        setTimeout(function () { contentObserver.disconnect(); }, 10000);
      }
    }

    killRogueAds();
  });
})();
