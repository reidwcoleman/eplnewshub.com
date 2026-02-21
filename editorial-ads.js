// Editorial Ad Placement System for EPL News Hub
// Removes old crammed ad blocks and injects 3 strategically placed,
// editorially styled ad units (upper ~30%, mid ~60%, lower after body).

(function () {
  'use strict';

  var AD_CLIENT = 'ca-pub-6480210605786899';

  // Detect article body container
  function getArticleBody() {
    return (
      document.querySelector('.article-body') ||
      document.querySelector('.article-content') ||
      document.querySelector('.nyt-article')
    );
  }

  // Remove existing static ad blocks
  function removeOldAds() {
    var oldAds = document.querySelectorAll('.article-ad');
    oldAds.forEach(function (el) { el.remove(); });
  }

  // Inject editorial CSS once
  function injectStyles() {
    if (document.getElementById('editorial-ad-styles')) return;

    var style = document.createElement('style');
    style.id = 'editorial-ad-styles';
    style.textContent =
      // Editorial ad wrapper
      '.ed-ad-unit {' +
        'margin: 48px 0;' +
        'padding: 24px 0;' +
        'border-top: 1px solid rgba(240, 236, 228, 0.10);' +
        'border-bottom: 1px solid rgba(240, 236, 228, 0.10);' +
        'text-align: center;' +
        'background: transparent;' +
      '}' +

      '.ed-ad-label {' +
        'display: block;' +
        'font-family: "DM Sans", sans-serif;' +
        'font-size: 10px;' +
        'font-weight: 500;' +
        'letter-spacing: 0.08em;' +
        'text-transform: uppercase;' +
        'color: var(--ash, #6b6560);' +
        'margin-bottom: 12px;' +
      '}' +

      // Suppress Google auto-injected ads inside article body
      '.article-body > ins.adsbygoogle,' +
      '.article-content > ins.adsbygoogle,' +
      '.nyt-article > ins.adsbygoogle {' +
        'display: none !important;' +
      '}' +

      // Hide mid-article ad on mobile
      '@media (max-width: 768px) {' +
        '.ed-ad-unit[data-position="mid"] {' +
          'display: none !important;' +
        '}' +
      '}';

    document.head.appendChild(style);
  }

  // Create a single editorial ad unit
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
    ins.setAttribute('data-ad-client', AD_CLIENT);
    ins.setAttribute('data-ad-slot', 'auto');
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');

    wrapper.appendChild(label);
    wrapper.appendChild(ins);

    return wrapper;
  }

  // Find the end-of-section node for a given h2.
  // Walks forward until the next h2 or end of parent.
  function findSectionEnd(h2) {
    var node = h2.nextElementSibling;
    while (node && node.tagName !== 'H2') {
      var next = node.nextElementSibling;
      if (!next || next.tagName === 'H2') return node;
      node = next;
    }
    return h2;
  }

  // Main placement logic
  function placeAds() {
    var body = getArticleBody();
    if (!body) return;

    removeOldAds();
    injectStyles();

    var h2s = body.querySelectorAll('h2');
    var count = h2s.length;
    var units = [];

    if (count < 3) {
      // Short article: only the Lower unit (after body, before tags)
      units.push({ position: 'lower' });
    } else if (count <= 4) {
      // Medium article: Upper + Lower
      units.push({ position: 'upper', afterH2Index: 1 }); // after 2nd h2 section
      units.push({ position: 'lower' });
    } else {
      // Full-length article: Upper + Mid + Lower
      var upperIdx = 1; // after 2nd h2 (~30%)
      var midIdx = Math.round(count * 0.6) - 1; // ~60%
      // Ensure mid is at least 2 sections after upper
      if (midIdx <= upperIdx + 1) midIdx = upperIdx + 2;
      if (midIdx >= count) midIdx = count - 1;

      units.push({ position: 'upper', afterH2Index: upperIdx });
      units.push({ position: 'mid', afterH2Index: midIdx });
      units.push({ position: 'lower' });
    }

    // Inject in-article units (upper and mid)
    units.forEach(function (unit) {
      if (unit.position === 'lower') return; // handled separately

      var h2 = h2s[unit.afterH2Index];
      if (!h2) return;

      var anchor = findSectionEnd(h2);
      var adEl = createAdUnit(unit.position);

      if (anchor.nextSibling) {
        anchor.parentNode.insertBefore(adEl, anchor.nextSibling);
      } else {
        anchor.parentNode.appendChild(adEl);
      }
    });

    // Inject lower unit: after article body, before tags
    var hasLower = units.some(function (u) { return u.position === 'lower'; });
    if (hasLower) {
      var adEl = createAdUnit('lower');
      var tagsRow = document.querySelector('.tags-row');
      if (tagsRow) {
        tagsRow.parentNode.insertBefore(adEl, tagsRow);
      } else {
        // Fallback: append after article body
        body.parentNode.insertBefore(adEl, body.nextSibling);
      }
    }

    // Push adsbygoogle for each injected unit
    var allUnits = document.querySelectorAll('.ed-ad-unit ins.adsbygoogle');
    allUnits.forEach(function () {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        // AdSense not loaded yet — silent fail
      }
    });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', placeAds);
  } else {
    placeAds();
  }
})();
