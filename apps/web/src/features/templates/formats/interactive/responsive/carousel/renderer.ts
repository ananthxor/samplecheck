import type { RendererExport } from '../../../_shared/types'

export const carouselRenderer: RendererExport = {
  functionName: 'renderCarousel',
  css: `
    .car-container { width:100%; height:100%; position:relative; overflow:hidden; }
    .car-track { display:flex; width:100%; height:calc(100% - 40px); transition:transform 0.3s ease; touch-action:pan-y; }
    .car-slide { min-width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:16px; gap:8px; }
    .car-slide img.car-img { max-width:60%; max-height:30%; object-fit:contain; }
    .car-slide h2 { font-size:clamp(14px,3vw,22px); font-weight:700; line-height:1.2; }
    .car-slide p { font-size:clamp(11px,2vw,14px); line-height:1.4; }
    .car-dots { display:flex; justify-content:center; gap:6px; padding:8px 0; position:absolute; bottom:0; left:0; right:0; }
    .car-dot { width:8px; height:8px; border-radius:50%; background:#d1d5db; cursor:pointer; transition:background 0.2s; }
    .car-dot.active { background:#2563eb; }
  `,
  js: `
    function renderCarousel(root, cfg) {
      var slides = cfg.slides || [];
      if (slides.length === 0) { renderPlaceholder(root, cfg); return; }

      var html = '<div class="car-container"><div class="car-track" id="car-track">';
      for (var i = 0; i < slides.length; i++) {
        var s = slides[i];
        var imgHtml = s.imageUrl ? '<img class="car-img" src="' + sanitize(s.imageUrl) + '" alt="Slide image" />' : '';
        html += '<div class="car-slide">' + imgHtml + '<h2>' + sanitize(s.headline || '') + '</h2><p>' + sanitize(s.bodyText || '') + '</p></div>';
      }
      html += '</div><div class="car-dots">';
      for (var d = 0; d < slides.length; d++) {
        html += '<span class="car-dot' + (d === 0 ? ' active' : '') + '" data-idx="' + d + '"></span>';
      }
      html += '</div>';
      if (cfg.ctaText) {
        html += '<div style="display:block;text-align:center;padding:8px 0"><a class="sb-cta" href="' + sanitize(cfg.ctaUrl || '#') + '" target="_blank" rel="noopener" style="background-color:#2563eb">' + sanitize(cfg.ctaText) + '</a></div>';
      }
      html += '</div>';
      root.innerHTML = html;

      var track = document.getElementById('car-track');
      var dots = root.querySelectorAll('.car-dot');
      var current = 0;
      var dragging = false;
      var startX = 0;

      function goToSlide(idx) {
        current = idx;
        track.style.transform = 'translateX(-' + (current * 100) + '%)';
        for (var k = 0; k < dots.length; k++) { dots[k].classList.toggle('active', k === current); }
        // Track slide change engagement
        if (typeof window.ScrollTodaySDK !== 'undefined') {
          window.ScrollTodaySDK.track('engagement', { type: 'swipe', slide_index: current });
        }
      }

      track.addEventListener('pointerdown', function(e) {
        startX = e.clientX; dragging = true;
        track.setPointerCapture(e.pointerId);
        if (cfg.autoPlay && frameTimer) { clearInterval(frameTimer); frameTimer = null; }
      });
      track.addEventListener('pointerup', function(e) {
        if (!dragging) return; dragging = false;
        var dx = e.clientX - startX;
        if (Math.abs(dx) > 30) {
          if (dx < 0 && current < slides.length - 1) goToSlide(current + 1);
          else if (dx > 0 && current > 0) goToSlide(current - 1);
        }
        if (cfg.autoPlay) {
          setTimeout(function() {
            frameTimer = setInterval(function() { goToSlide((current + 1) % slides.length); }, cfg.autoPlayInterval || 3000);
          }, 5000);
        }
      });
      for (var di = 0; di < dots.length; di++) {
        dots[di].addEventListener('click', function(e) { goToSlide(parseInt(e.target.dataset.idx, 10)); });
      }
      if (cfg.autoPlay) {
        frameTimer = setInterval(function() { goToSlide((current + 1) % slides.length); }, cfg.autoPlayInterval || 3000);
      }
    }
  `,
}
