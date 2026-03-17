/**
 * ScrollToday — Flip Card Creative Runtime
 * Loaded from CDN (or local /public/creatives/ in dev).
 * Reads window.__ST_CONFIG__ and window.__ST_MOUNT__ set by the renderer.
 *
 * Config shape (all fields optional with defaults):
 *   frontHeadline, frontBodyText, frontImageUrl, hintText,
 *   frontColorStart, frontColorEnd,
 *   backHeadline, backBodyText, backImageUrl,
 *   backColorStart, backColorEnd,
 *   ctaText, ctaUrl
 */
(function () {
  'use strict';

  var cfg   = window.__ST_CONFIG__ || {};
  var mount = window.__ST_MOUNT__;

  // Fallback mount: use body if renderer-shell mount not set
  if (!mount || !mount.isConnected) {
    mount = document.getElementById('creative-root') || document.body;
  }

  // Normalised config with defaults
  var c = {
    frontHeadline:   cfg.frontHeadline   || 'Unveil the Experience',
    frontBodyText:   cfg.frontBodyText   || 'Hover, tilt, or click to discover.',
    frontImageUrl:   cfg.frontImageUrl   || '',
    hintText:        cfg.hintText        || 'Tap to Flip',
    frontColorStart: cfg.frontColorStart || '#fefefe',
    frontColorEnd:   cfg.frontColorEnd   || '#eef3f7',
    backHeadline:    cfg.backHeadline    || 'Limited Time Deal',
    backBodyText:    cfg.backBodyText    || 'Get 30% off today only.',
    backImageUrl:    cfg.backImageUrl    || '',
    backColorStart:  cfg.backColorStart  || '#1f2937',
    backColorEnd:    cfg.backColorEnd    || '#111827',
    ctaText:         cfg.ctaText         || 'Learn More',
    ctaUrl:          cfg.ctaUrl          || '#',
  };

  // Short unique suffix so multiple instances on same page don't clash
  var uid = String(Date.now()).slice(-6);

  // -------------------------------------------------------------------------
  // Sanitize
  // -------------------------------------------------------------------------
  function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#39;');
  }

  // -------------------------------------------------------------------------
  // Styles
  // -------------------------------------------------------------------------
  function injectStyles() {
    var id = 'st-fc-style-' + uid;
    if (document.getElementById(id)) return;  // already injected

    var css = [
      // Reset & full-fill mount
      '#creative-root, .st-fc-wrap-' + uid + ' { width:100%; height:100%; }',

      // Outer wrapper
      '.st-fc-wrap-'    + uid + ' { font-family:system-ui,sans-serif; display:flex; align-items:center; justify-content:center; }',

      // Perspective layer
      '.st-fc-persp-'   + uid + ' { width:100%; height:100%; perspective:1000px; }',

      // Tilt layer
      '.st-fc-tilt-'    + uid + ' { width:100%; height:100%; transform-style:preserve-3d; transition:transform 0.15s ease; }',

      // Flip card
      '.st-fc-card-'    + uid + ' { position:relative; width:100%; height:100%; transform-style:preserve-3d; transition:transform 0.95s cubic-bezier(0.22,1.61,0.36,1); border-radius:18px; cursor:pointer; }',
      '.st-fc-card-'    + uid + '.is-flipped { transform:rotateY(180deg); }',

      // Idle float animation
      '.st-fc-card-'    + uid + '.is-idle { animation:st-fc-idle-' + uid + ' 3s ease-in-out infinite; }',
      '@keyframes st-fc-idle-' + uid + ' { 0%,100% { transform:rotateY(0deg) rotateX(-2deg); } 50% { transform:rotateY(8deg) rotateX(2deg); } }',

      // Faces
      '.st-fc-face-'    + uid + ' { position:absolute; width:100%; height:100%; backface-visibility:hidden; -webkit-backface-visibility:hidden; border-radius:18px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:16px; gap:10px; overflow:hidden; box-shadow:0 10px 40px rgba(0,0,0,0.18); }',
      '.st-fc-front-'   + uid + ' { z-index:2; background:linear-gradient(135deg,' + c.frontColorStart + ' 0%,' + c.frontColorEnd + ' 100%); color:#111; }',
      '.st-fc-back-'    + uid + ' { transform:rotateY(180deg); z-index:1; background:linear-gradient(145deg,' + c.backColorStart + ' 0%,' + c.backColorEnd + ' 100%); color:#fff; }',
      '.is-flipped .st-fc-back-' + uid + ' { z-index:3; }',

      // Media
      '.st-fc-img-'     + uid + ' { max-width:78%; max-height:36%; object-fit:contain; border-radius:12px; box-shadow:0 6px 20px rgba(0,0,0,0.12); }',

      // Text
      '.st-fc-h-'       + uid + ' { font-size:clamp(14px,4vw,22px); font-weight:700; line-height:1.2; margin:0; }',
      '.st-fc-p-'       + uid + ' { font-size:clamp(11px,2.5vw,14px); line-height:1.5; margin:0; opacity:0.85; }',

      // Hint chip (bottom-right corner of front)
      '.st-fc-hint-'    + uid + ' { position:absolute; bottom:12px; right:14px; background:rgba(0,0,0,0.6); color:#fff; padding:5px 11px; border-radius:20px; font-size:11px; pointer-events:none; }',

      // CTA button on back
      '.st-fc-cta-'     + uid + ' { display:inline-block; padding:9px 22px; background:#2563eb; color:#fff !important; text-decoration:none; border-radius:8px; font-weight:600; font-size:clamp(12px,2.5vw,15px); margin-top:4px; cursor:pointer; transition:opacity 0.2s; }',
      '.st-fc-cta-'     + uid + ':hover { opacity:0.88; }',
    ].join('\n');

    var style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  }

  // -------------------------------------------------------------------------
  // Self-tracking helpers — fire only when loaded standalone (not in a
  // serve-ad iframe). When window === top, there is no serve-ad wrapper
  // injecting tracking, so the runtime handles it directly.
  // -------------------------------------------------------------------------
  function fireTrackPixel(type) {
    if (window.self !== window.top) return; // inside serve-ad iframe — skip
    var trackUrl = cfg._trackUrl;
    var cid      = cfg._cid;
    var aid      = cfg._aid;
    if (!trackUrl || !cid || !aid) return;
    var rid = (crypto && crypto.randomUUID) ? crypto.randomUUID() : (Math.random().toString(36) + Math.random().toString(36)).slice(2, 38);
    try {
      new Image().src = trackUrl + '?type=' + type + '&cid=' + cid + '&aid=' + aid + '&rid=' + rid + '&cb=' + Date.now();
    } catch (_) {}
  }

  // -------------------------------------------------------------------------
  // Engagement — notify serve-ad wrapper, local listeners, and self-tracker
  // -------------------------------------------------------------------------
  function fireEngagement() {
    try { window.parent.postMessage({ type: 'st:engagement' }, '*'); } catch (_) {}
    try { window.dispatchEvent(new CustomEvent('st:engagement')); }    catch (_) {}
    // Use the universal tracking helper from the Ad SDK if available
    if (typeof window.ScrollTodaySDK !== 'undefined') {
      window.ScrollTodaySDK.track('engagement', { type: 'flip' });
    } else if (typeof window.stTrack === 'function') { // Fallback for old bundles
      window.stTrack('engagement', { type: 'flip' });
    } else {
      fireTrackPixel('engagement'); // Fallback for standalone outside SDK
    }
  }

  // -------------------------------------------------------------------------
  // Build DOM
  // -------------------------------------------------------------------------
  function buildHtml() {
    var frontImg = c.frontImageUrl
      ? '<img class="st-fc-img-' + uid + '" src="' + sanitize(c.frontImageUrl) + '" alt="front" />'
      : '';
    var backImg = c.backImageUrl
      ? '<img class="st-fc-img-' + uid + '" src="' + sanitize(c.backImageUrl) + '" alt="back" />'
      : '';
    var ctaHtml = c.ctaText
      ? '<a class="st-fc-cta-' + uid + '" href="' + sanitize(c.ctaUrl) + '" target="_blank">' + sanitize(c.ctaText) + '</a>'
      : '';
    var hintHtml = c.hintText
      ? '<div class="st-fc-hint-' + uid + '">&#8646; ' + sanitize(c.hintText) + '</div>'
      : '';

    return [
      '<div class="st-fc-wrap-' + uid + '">',
      '  <div class="st-fc-persp-' + uid + '">',
      '    <div class="st-fc-tilt-' + uid + '" id="st-fc-tilt-' + uid + '">',
      '      <div class="st-fc-card-' + uid + ' is-idle" id="st-fc-card-' + uid + '">',
      '        <div class="st-fc-face-' + uid + ' st-fc-front-' + uid + '" id="st-fc-front-' + uid + '">',
      '          ' + frontImg,
      '          <h2 class="st-fc-h-' + uid + '">' + sanitize(c.frontHeadline) + '</h2>',
      '          <p  class="st-fc-p-' + uid + '">' + sanitize(c.frontBodyText)  + '</p>',
      '          ' + hintHtml,
      '        </div>',
      '        <div class="st-fc-face-' + uid + ' st-fc-back-' + uid + '">',
      '          ' + backImg,
      '          <h2 class="st-fc-h-' + uid + '">' + sanitize(c.backHeadline) + '</h2>',
      '          <p  class="st-fc-p-' + uid + '">' + sanitize(c.backBodyText)  + '</p>',
      '          ' + ctaHtml,
      '        </div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>',
    ].join('');
  }

  // -------------------------------------------------------------------------
  // Interactions
  // -------------------------------------------------------------------------
  function attachEvents() {
    var card  = document.getElementById('st-fc-card-'  + uid);
    var tilt  = document.getElementById('st-fc-tilt-'  + uid);
    var front = document.getElementById('st-fc-front-' + uid);
    if (!card || !tilt || !front) return;

    var isFlipped = false;

    // Tilt on mouse move (front side only)
    tilt.addEventListener('mousemove', function (e) {
      if (isFlipped) return;
      card.classList.remove('is-idle');
      var rect = front.getBoundingClientRect();
      var x =  ((e.clientX - rect.left) / rect.width  - 0.5) * 20;
      var y = -((e.clientY - rect.top)  / rect.height - 0.5) * 20;
      tilt.style.transform = 'rotateY(' + x + 'deg) rotateX(' + y + 'deg)';
    });

    tilt.addEventListener('mouseleave', function () {
      if (!isFlipped) {
        tilt.style.transform = 'rotateY(0deg) rotateX(0deg)';
        card.classList.add('is-idle');
      }
    });

    // Flip on click (front face triggers flip; back face handles CTA via <a>)
    front.addEventListener('click', function () {
      if (isFlipped) return;
      isFlipped = true;
      card.classList.add('is-flipped');
      card.classList.remove('is-idle');
      tilt.style.transform = 'rotateY(0deg) rotateX(0deg)';
      fireEngagement();
    });

    // Touch: flip on tap
    front.addEventListener('touchend', function (e) {
      e.preventDefault();
      if (isFlipped) return;
      isFlipped = true;
      card.classList.add('is-flipped');
      card.classList.remove('is-idle');
      tilt.style.transform = 'rotateY(0deg) rotateX(0deg)';
      fireEngagement();
    });
  }

  // -------------------------------------------------------------------------
  // Init
  // -------------------------------------------------------------------------
  function init() {
    injectStyles();
    mount.innerHTML = buildHtml();
    attachEvents();
    fireTrackPixel('impression_served');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
