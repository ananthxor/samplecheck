import type { RendererExport } from '../../../_shared/types'

export const countdownRenderer: RendererExport = {
  functionName: 'renderCountdown',
  css: `
    .cd-wrap {
      width:100%; height:100%;
      display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      padding:16px; text-align:center;
      overflow:hidden;
    }
    .cd-inner {
      display:flex; flex-direction:column;
      align-items:center; gap:10px;
      max-width:100%;
    }
    .cd-headline {
      font-size:clamp(15px,4vw,24px); font-weight:800;
      line-height:1.2; margin:0;
    }
    .cd-body {
      font-size:clamp(11px,2.5vw,14px); line-height:1.4;
      margin:0; opacity:0.8; max-width:90%;
    }
    .cd-timer {
      display:flex; align-items:center;
      gap:4px; margin:8px 0;
    }
    .cd-unit {
      display:flex; flex-direction:column;
      align-items:center; gap:4px;
    }
    .cd-digit {
      background:rgba(255,255,255,0.15);
      border:1px solid rgba(255,255,255,0.12);
      border-radius:8px;
      font-size:clamp(20px,5.5vw,38px);
      font-weight:800;
      font-variant-numeric:tabular-nums;
      min-width:2.2ch;
      padding:5px 10px;
      text-align:center;
      line-height:1;
    }
    .cd-secs { animation:cd-pulse 1s ease-in-out infinite; }
    @keyframes cd-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    .cd-label {
      font-size:clamp(8px,1.8vw,11px); text-transform:uppercase;
      letter-spacing:0.05em; opacity:0.65; font-weight:600;
    }
    .cd-sep {
      font-size:clamp(16px,4.5vw,30px); font-weight:800;
      opacity:0.5; align-self:flex-start;
      margin-top:4px; line-height:1; padding:5px 0;
    }
    .cd-cta {
      display:inline-block; padding:9px 22px;
      color:#fff !important; text-decoration:none;
      border-radius:8px; font-weight:700;
      font-size:clamp(12px,2.5vw,15px);
      cursor:pointer; margin-top:4px;
      transition:opacity 0.2s;
    }
    .cd-cta:hover { opacity:0.85; }
    .cd-expired {
      font-size:clamp(12px,3vw,18px); font-weight:700;
      opacity:0.8; margin-top:4px;
    }
  `,
  js: `
    function renderCountdown(root, cfg) {
      var bgColor   = cfg.backgroundColor || '#111827';
      var textColor = cfg.textColor       || '#ffffff';
      var ctaColor  = cfg.ctaColor        || '#2563eb';
      var target    = new Date(cfg.targetDate).getTime();

      if (isNaN(target)) { renderPlaceholder(root, cfg); return; }

      var ctaHtml = cfg.ctaText
        ? '<a class="cd-cta" href="' + sanitize(cfg.ctaUrl || '#') + '" target="_blank" rel="noopener" style="background:' + sanitize(ctaColor) + '">' + sanitize(cfg.ctaText) + '</a>'
        : '';

      root.innerHTML =
        '<div class="cd-wrap" style="background:' + sanitize(bgColor) + ';color:' + sanitize(textColor) + '">'
        + '<div class="cd-inner">'
        +   '<h1 class="cd-headline">' + sanitize(cfg.headline || '') + '</h1>'
        +   '<p class="cd-body">' + sanitize(cfg.bodyText || '') + '</p>'
        +   '<div class="cd-timer">'
        +     '<div class="cd-unit"><div class="cd-digit cd-d">00</div><div class="cd-label">Days</div></div>'
        +     '<div class="cd-sep">:</div>'
        +     '<div class="cd-unit"><div class="cd-digit cd-h">00</div><div class="cd-label">Hours</div></div>'
        +     '<div class="cd-sep">:</div>'
        +     '<div class="cd-unit"><div class="cd-digit cd-m">00</div><div class="cd-label">Mins</div></div>'
        +     '<div class="cd-sep">:</div>'
        +     '<div class="cd-unit"><div class="cd-digit cd-secs cd-s">00</div><div class="cd-label">Secs</div></div>'
        +   '</div>'
        +   ctaHtml
        + '</div>'
        + '</div>';

      function pad(n) { return String(Math.floor(n)).padStart(2, '0'); }

      function tick() {
        var diff = Math.max(0, target - Date.now());
        var dEl = root.querySelector('.cd-d');
        var hEl = root.querySelector('.cd-h');
        var mEl = root.querySelector('.cd-m');
        var sEl = root.querySelector('.cd-s');

        if (dEl) dEl.textContent = pad(diff / 86400000);
        if (hEl) hEl.textContent = pad((diff % 86400000) / 3600000);
        if (mEl) mEl.textContent = pad((diff % 3600000) / 60000);
        if (sEl) sEl.textContent = pad((diff % 60000) / 1000);

        if (diff <= 0) {
          clearInterval(frameTimer);
          var sepsEl = root.querySelectorAll('.cd-sep');
          for (var i = 0; i < sepsEl.length; i++) { sepsEl[i].style.opacity = '0'; }
          var timerEl = root.querySelector('.cd-timer');
          if (timerEl) timerEl.style.display = 'none';
          var inner = root.querySelector('.cd-inner');
          if (inner) {
            var exp = document.createElement('div');
            exp.className = 'cd-expired';
            exp.textContent = 'Offer Expired';
            inner.insertBefore(exp, inner.querySelector('.cd-cta'));
          }
          if (typeof window.ScrollTodaySDK !== 'undefined') {
            window.ScrollTodaySDK.track('engagement', { type: 'countdown_complete' });
          }
        }
      }

      tick();
      frameTimer = setInterval(tick, 1000);
    }
  `,
}
