import type { RendererExport } from '../../../_shared/types'

export const cubeRenderer: RendererExport = {
  functionName: 'renderCube',
  css: `
    .cube-scene { width:100%; height:100%; perspective:600px; overflow:hidden; }
    .cube-container { width:100%; height:100%; position:relative; transform-style:preserve-3d; -webkit-transform-style:preserve-3d; transition:transform 1s; }
    .cube-face { position:absolute; width:100%; height:100%; backface-visibility:hidden; -webkit-backface-visibility:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:16px; gap:8px; background:#ffffff; border:1px solid #e5e7eb; }
    .cube-face img { max-width:50%; max-height:25%; object-fit:contain; }
    .cube-face h2 { font-size:clamp(14px,3vw,20px); font-weight:700; line-height:1.2; }
    .cube-face p { font-size:clamp(11px,2vw,13px); line-height:1.4; }
  `,
  js: `
    function renderCube(root, cfg) {
      var faces = cfg.faces || [];
      if (faces.length !== 4) { renderPlaceholder(root, cfg); return; }

      // Build HTML with placeholder translateZ; applyDepth() fixes it once layout is known
      var rotations = [0, 90, 180, -90];
      var html = '<div class="cube-scene"><div class="cube-container" id="cube-box">';
      for (var i = 0; i < 4; i++) {
        var f = faces[i];
        var imgHtml = f.imageUrl ? '<img src="' + sanitize(f.imageUrl) + '" alt="Cube face" />' : '';
        html += '<div class="cube-face" data-rot="' + rotations[i] + '">'
          + imgHtml + '<h2>' + sanitize(f.headline || '') + '</h2><p>' + sanitize(f.bodyText || '') + '</p></div>';
      }
      html += '</div>';
      if (cfg.ctaText) {
        html += '<a class="sb-cta" style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);background-color:#2563eb;z-index:10" href="' + sanitize(cfg.ctaUrl || '#') + '" target="_blank" rel="noopener">' + sanitize(cfg.ctaText) + '</a>';
      }
      html += '</div>';
      root.innerHTML = html;

      var cube = document.getElementById('cube-box');
      var currentFace = 0;
      var scene = root.querySelector('.cube-scene');
      var startX = 0;

      // Apply translateZ after layout is available — defers if clientWidth is 0
      function applyDepth() {
        var w = root.clientWidth;
        if (!w) { requestAnimationFrame(applyDepth); return; }
        var halfW = w / 2;
        var faceEls = cube.querySelectorAll('.cube-face');
        for (var i = 0; i < faceEls.length; i++) {
          var rot = faceEls[i].getAttribute('data-rot');
          faceEls[i].style.transform = 'rotateY(' + rot + 'deg) translateZ(' + halfW + 'px)';
        }
      }
      applyDepth();

      var resumeTimer = null;

      function startAutoRotate() {
        frameTimer = setInterval(function() {
          currentFace = (currentFace + 1) % 4;
          cube.style.transform = 'rotateY(' + (-90 * currentFace) + 'deg)';
        }, cfg.rotationSpeed || 4000);
      }

      function stopAutoRotate() {
        clearInterval(frameTimer);
        frameTimer = null;
        if (resumeTimer) { clearTimeout(resumeTimer); resumeTimer = null; }
      }

      startAutoRotate();

      scene.addEventListener('pointerdown', function(e) { startX = e.clientX; });
      scene.addEventListener('pointerup', function(e) {
        var dx = e.clientX - startX;
        if (Math.abs(dx) > 30) {
          stopAutoRotate();
          currentFace = dx < 0 ? (currentFace + 1) % 4 : (currentFace + 3) % 4;
          cube.style.transform = 'rotateY(' + (-90 * currentFace) + 'deg)';
          if (typeof window.ScrollTodaySDK !== 'undefined') {
            window.ScrollTodaySDK.track('engagement', { type: 'cube_rotate', face_index: currentFace });
          }
          resumeTimer = setTimeout(startAutoRotate, 5000);
        }
      });
    }
  `,
}
