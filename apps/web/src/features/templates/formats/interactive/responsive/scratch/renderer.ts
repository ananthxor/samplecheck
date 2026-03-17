import type { RendererExport } from '../../../_shared/types'

export const scratchRenderer: RendererExport = {
  functionName: 'renderScratch',
  css: `
    .sc-container { width:100%; height:100%; position:relative; overflow:hidden; }
    .sc-reveal { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:16px; gap:8px; }
    .sc-reveal img.sc-img { max-width:60%; max-height:30%; object-fit:contain; }
    .sc-reveal h2 { font-size:clamp(14px,3vw,22px); font-weight:700; line-height:1.2; }
    .sc-reveal p { font-size:clamp(11px,2vw,14px); line-height:1.4; }
    .sc-canvas { position:absolute; top:0; left:0; width:100%; height:100%; cursor:crosshair; touch-action:none; }
  `,
  js: `
    function renderScratch(root, cfg) {
      var revealImg = cfg.revealImageUrl ? '<img class="sc-img" src="' + sanitize(cfg.revealImageUrl) + '" alt="Reveal image" />' : '';
      var ctaHtml = cfg.ctaText ? '<a class="sb-cta" href="' + sanitize(cfg.ctaUrl || '#') + '" target="_blank" rel="noopener" style="background-color:#2563eb">' + sanitize(cfg.ctaText) + '</a>' : '';

      root.innerHTML = '<div class="sc-container"><div class="sc-reveal">' + revealImg + '<h2>' + sanitize(cfg.headline || '') + '</h2><p>' + sanitize(cfg.bodyText || '') + '</p>' + ctaHtml + '</div><canvas id="scratch-canvas" class="sc-canvas"></canvas></div>';

      var canvas = document.getElementById('scratch-canvas');
      var container = root.querySelector('.sc-container');
      var dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width = container.clientWidth + 'px';
      canvas.style.height = container.clientHeight + 'px';

      var ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(0, 0, container.clientWidth, container.clientHeight);
      ctx.fillStyle = '#999';
      ctx.font = '16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Scratch here!', container.clientWidth / 2, container.clientHeight / 2);

      if (cfg.overlayImageUrl) {
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
          ctx.globalCompositeOperation = 'source-over';
          ctx.drawImage(img, 0, 0, container.clientWidth, container.clientHeight);
        };
        img.src = cfg.overlayImageUrl;
      }

      var scratching = false;
      var trackedEngagement = false;
      canvas.addEventListener('pointerdown', function(e) { 
        scratching = true; 
        canvas.setPointerCapture(e.pointerId); 
        scratch(e);
        if (!trackedEngagement && typeof window.ScrollTodaySDK !== 'undefined') {
          window.ScrollTodaySDK.track('engagement', { type: 'scratch' });
          trackedEngagement = true;
        }
      });
      canvas.addEventListener('pointermove', function(e) { if (scratching) scratch(e); });
      canvas.addEventListener('pointerup', function() { scratching = false; checkReveal(); });

      function scratch(e) {
        var rect = canvas.getBoundingClientRect();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(e.clientX - rect.left, e.clientY - rect.top, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      function checkReveal() {
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var total = canvas.width * canvas.height;
        var cleared = 0;
        for (var i = 3; i < imageData.data.length; i += 4) { if (imageData.data[i] === 0) cleared++; }
        if (cleared / total > 0.5) { canvas.style.transition = 'opacity 0.5s'; canvas.style.opacity = '0'; }
      }
    }
  `,
}
