import type { RendererExport } from '../../../_shared/types'

/**
 * Flipcard renderer — fully inlined, no external script load.
 *
 * Converted from the CDN-loader pattern (flipcard-runtime.js) to match
 * all other formats: CSS in `css`, logic in `renderFlipcard(root, cfg)`.
 * The CDN bundle is now a single script with zero additional network requests.
 */
export const flipcardRenderer: RendererExport = {
  functionName: 'renderFlipcard',
  css: `
    .st-fc-wrap { width:100%; height:100%; font-family:system-ui,sans-serif; display:flex; align-items:center; justify-content:center; }
    .st-fc-persp { width:100%; height:100%; perspective:1000px; }
    .st-fc-tilt { width:100%; height:100%; transform-style:preserve-3d; transition:transform 0.15s ease; }
    .st-fc-card { position:relative; width:100%; height:100%; transform-style:preserve-3d; transition:transform 0.95s cubic-bezier(0.22,1.61,0.36,1); border-radius:18px; cursor:pointer; }
    .st-fc-card.is-flipped { transform:rotateY(180deg); }
    .st-fc-card.is-idle { animation:st-fc-idle 3s ease-in-out infinite; }
    @keyframes st-fc-idle { 0%,100% { transform:rotateY(0deg) rotateX(-2deg); } 50% { transform:rotateY(8deg) rotateX(2deg); } }
    .st-fc-face { position:absolute; width:100%; height:100%; backface-visibility:hidden; -webkit-backface-visibility:hidden; border-radius:18px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:16px; gap:10px; overflow:hidden; box-shadow:0 10px 40px rgba(0,0,0,0.18); }
    .st-fc-front { z-index:2; }
    .st-fc-back { transform:rotateY(180deg); z-index:1; color:#fff; }
    .is-flipped .st-fc-back { z-index:3; }
    .st-fc-img { max-width:78%; max-height:36%; object-fit:contain; border-radius:12px; box-shadow:0 6px 20px rgba(0,0,0,0.12); }
    .st-fc-h { font-size:clamp(14px,4vw,22px); font-weight:700; line-height:1.2; margin:0; }
    .st-fc-p { font-size:clamp(11px,2.5vw,14px); line-height:1.5; margin:0; opacity:0.85; }
    .st-fc-hint { position:absolute; bottom:12px; right:14px; background:rgba(0,0,0,0.6); color:#fff; padding:5px 11px; border-radius:20px; font-size:11px; pointer-events:none; }
    .st-fc-cta { display:inline-block; padding:9px 22px; background:#2563eb; color:#fff !important; text-decoration:none; border-radius:8px; font-weight:600; font-size:clamp(12px,2.5vw,15px); margin-top:4px; cursor:pointer; transition:opacity 0.2s; }
    .st-fc-cta:hover { opacity:0.88; }
  `,
  js: `
    function renderFlipcard(root, cfg) {
      var frontColorStart = cfg.frontColorStart || '#fefefe';
      var frontColorEnd   = cfg.frontColorEnd   || '#eef3f7';
      var backColorStart  = cfg.backColorStart  || '#1f2937';
      var backColorEnd    = cfg.backColorEnd    || '#111827';

      var frontImg = cfg.frontImageUrl
        ? '<img class="st-fc-img" src="' + sanitize(cfg.frontImageUrl) + '" alt="" />'
        : '';
      var backImg = cfg.backImageUrl
        ? '<img class="st-fc-img" src="' + sanitize(cfg.backImageUrl) + '" alt="" />'
        : '';
      var ctaHtml = cfg.ctaText
        ? '<a class="st-fc-cta" href="' + sanitize(cfg.ctaUrl || '#') + '" target="_blank">' + sanitize(cfg.ctaText) + '</a>'
        : '';
      var hintHtml = cfg.hintText
        ? '<div class="st-fc-hint">&#8646; ' + sanitize(cfg.hintText) + '</div>'
        : '';

      root.innerHTML =
        '<div class="st-fc-wrap">' +
          '<div class="st-fc-persp">' +
            '<div class="st-fc-tilt" id="st-fc-tilt">' +
              '<div class="st-fc-card is-idle" id="st-fc-card">' +
                '<div class="st-fc-face st-fc-front" id="st-fc-front"' +
                  ' style="background:linear-gradient(135deg,' + sanitize(frontColorStart) + ' 0%,' + sanitize(frontColorEnd) + ' 100%);color:#111;">' +
                  frontImg +
                  '<h2 class="st-fc-h">' + sanitize(cfg.frontHeadline || 'Unveil the Experience') + '</h2>' +
                  '<p class="st-fc-p">' + sanitize(cfg.frontBodyText || 'Click to discover.') + '</p>' +
                  hintHtml +
                '</div>' +
                '<div class="st-fc-face st-fc-back"' +
                  ' style="background:linear-gradient(145deg,' + sanitize(backColorStart) + ' 0%,' + sanitize(backColorEnd) + ' 100%);">' +
                  backImg +
                  '<h2 class="st-fc-h">' + sanitize(cfg.backHeadline || 'Limited Time Deal') + '</h2>' +
                  '<p class="st-fc-p">' + sanitize(cfg.backBodyText || 'Get 30% off today only.') + '</p>' +
                  ctaHtml +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      var card  = document.getElementById('st-fc-card');
      var tilt  = document.getElementById('st-fc-tilt');
      var front = document.getElementById('st-fc-front');
      if (!card || !tilt || !front) return;

      var isFlipped = false;

      tilt.addEventListener('mousemove', function(e) {
        if (isFlipped) return;
        card.classList.remove('is-idle');
        var rect = front.getBoundingClientRect();
        var x =  ((e.clientX - rect.left) / rect.width  - 0.5) * 20;
        var y = -((e.clientY - rect.top)  / rect.height - 0.5) * 20;
        tilt.style.transform = 'rotateY(' + x + 'deg) rotateX(' + y + 'deg)';
      });

      tilt.addEventListener('mouseleave', function() {
        if (!isFlipped) {
          tilt.style.transform = 'rotateY(0deg) rotateX(0deg)';
          card.classList.add('is-idle');
        }
      });

      function doFlip() {
        if (isFlipped) return;
        isFlipped = true;
        card.classList.add('is-flipped');
        card.classList.remove('is-idle');
        tilt.style.transform = 'rotateY(0deg) rotateX(0deg)';
      }

      front.addEventListener('click', doFlip);
      front.addEventListener('touchend', function(e) { e.preventDefault(); doFlip(); });
    }
  `,
}
