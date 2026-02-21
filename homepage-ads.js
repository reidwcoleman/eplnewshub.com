// Homepage Ad Placement System for EPL News Hub
// Places 7 designated ad units across the homepage.
// Only ads inside .hp-ad-unit containers are shown; all others are killed.

(function () {
  'use strict';

  var AD_CLIENT = 'ca-pub-6480210605786899';
  var AD_SLOT = '2887667887';

  function injectStyles() {
    if (document.getElementById('hp-ad-styles')) return;

    var style = document.createElement('style');
    style.id = 'hp-ad-styles';
    style.textContent =
      '.hp-ad-unit {' +
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

      '.hp-ad-unit::before {' +
        'content: "";' +
        'display: block;' +
        'width: 48px;' +
        'height: 1px;' +
        'background: rgba(240, 236, 228, 0.12);' +
        'margin: 0 auto 16px;' +
      '}' +

      '.hp-ad-unit::after {' +
        'content: "";' +
        'display: block;' +
        'width: 48px;' +
        'height: 1px;' +
        'background: rgba(240, 236, 228, 0.12);' +
        'margin: 16px auto 0;' +
      '}' +

      '.hp-ad-unit ins.adsbygoogle {' +
        'display: block !important;' +
        'width: 100% !important;' +
        'min-height: 90px;' +
        'max-width: 100%;' +
        'overflow: hidden;' +
      '}' +

      '.hp-ad-label {' +
        'display: block;' +
        'font-family: "DM Sans", -apple-system, sans-serif;' +
        'font-size: 9px;' +
        'font-weight: 500;' +
        'letter-spacing: 0.12em;' +
        'text-transform: uppercase;' +
        'color: rgba(138, 133, 120, 0.5);' +
        'margin-bottom: 12px;' +
      '}' +

      // Hide ALL Google ads not inside our designated containers
      'body > ins.adsbygoogle,' +
      'html > ins.adsbygoogle,' +
      'ins.adsbygoogle:not(.hp-ad-unit ins):not(.ed-ad-unit ins) {' +
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
      'ins.adsbygoogle[data-ad-status="filled"]:not(.hp-ad-unit ins):not(.ed-ad-unit ins),' +
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

      // Block ads from injecting into layout-critical sections
      '.hero ins.adsbygoogle,' +
      '.hero .google-auto-placed,' +
      '.secondary-row ins.adsbygoogle,' +
      '.secondary-row .google-auto-placed,' +
      '.headlines-grid ins.adsbygoogle,' +
      '.headlines-grid .google-auto-placed,' +
      '.tools-strip ins.adsbygoogle,' +
      '.tools-strip .google-auto-placed {' +
        'display: none !important;' +
        'height: 0 !important;' +
      '}' +

      // Mobile responsive — edge-to-edge ads using viewport width
      '@media (max-width: 768px) {' +
        '.hp-ad-unit {' +
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
        '.hp-ad-unit::before, .hp-ad-unit::after {' +
          'display: none;' +
        '}' +
        '.hp-ad-unit ins.adsbygoogle {' +
          'min-height: 100px;' +
          'max-height: 300px;' +
        '}' +
        '.hp-ad-label { font-size: 8px; margin-bottom: 8px; }' +
      '}' +

      '@media (max-width: 480px) {' +
        '.hp-ad-unit {' +
          'margin: 18px 0;' +
          'padding: 14px 12px;' +
        '}' +
      '}' +

      '@media (max-width: 360px) {' +
        '.hp-ad-unit {' +
          'margin: 14px 0;' +
          'padding: 12px 10px;' +
        '}' +
      '}';

    document.head.appendChild(style);
  }

  function createAdUnit(position) {
    var wrapper = document.createElement('div');
    wrapper.className = 'hp-ad-unit';
    wrapper.setAttribute('data-position', position);

    var label = document.createElement('span');
    label.className = 'hp-ad-label';
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

  function placeAds() {
    // Prevent double-run
    if (document.querySelector('.hp-ad-unit')) return;

    injectStyles();

    // AD 1: After hero section
    var hero = document.querySelector('.hero');
    if (hero) {
      insertAfter(createAdUnit('hp-1'), hero);
      pushAdSlot();
    }

    // AD 2: After tools strip
    var tools = document.querySelector('.tools-strip');
    if (tools) {
      insertAfter(createAdUnit('hp-2'), tools);
      pushAdSlot();
    }

    // AD 3: Between live scores and standings widgets
    var widgetRows = document.querySelectorAll('.widgets-row');
    if (widgetRows.length >= 2) {
      insertBefore(createAdUnit('hp-3'), widgetRows[1]);
      pushAdSlot();
    }

    // AD 4: After standings widget (before headlines divider)
    var lastWidget = widgetRows[widgetRows.length - 1];
    if (lastWidget) {
      insertAfter(createAdUnit('hp-4'), lastWidget);
      pushAdSlot();
    }

    // ADS 5 & 6: Split the 12-card headlines grid into 3 groups of 4
    var grid = document.querySelector('.headlines-grid');
    if (grid) {
      var cards = Array.prototype.slice.call(grid.querySelectorAll('.headline-card'));
      if (cards.length > 4) {
        var parent = grid.parentNode;

        // Create 3 sub-grids
        var grid1 = document.createElement('div');
        grid1.className = 'headlines-grid';
        var grid2 = document.createElement('div');
        grid2.className = 'headlines-grid';
        var grid3 = document.createElement('div');
        grid3.className = 'headlines-grid';

        cards.forEach(function (card, i) {
          if (i < 4) grid1.appendChild(card);
          else if (i < 8) grid2.appendChild(card);
          else grid3.appendChild(card);
        });

        // Replace original grid with the 3 sub-grids + ads between them
        parent.insertBefore(grid1, grid);

        var ad5 = createAdUnit('hp-5');
        parent.insertBefore(ad5, grid);
        pushAdSlot();

        parent.insertBefore(grid2, grid);

        var ad6 = createAdUnit('hp-6');
        parent.insertBefore(ad6, grid);
        pushAdSlot();

        parent.insertBefore(grid3, grid);

        // Remove original empty grid
        grid.remove();
      }
    }

    // AD 7: After headlines section, before bottom CTA
    var headlinesSection = document.querySelector('.headlines-section');
    if (headlinesSection) {
      insertAfter(createAdUnit('hp-7'), headlinesSection);
      pushAdSlot();
    }
  }

  // Kill any Google-injected ad that is NOT inside our designated containers
  function killRogueAds() {
    document.querySelectorAll('ins.adsbygoogle').forEach(function (el) {
      if (el.closest('.hp-ad-unit') || el.closest('.ed-ad-unit')) return;
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
