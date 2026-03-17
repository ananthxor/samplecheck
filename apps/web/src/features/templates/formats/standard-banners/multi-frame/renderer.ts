import type { RendererExport } from '../../_shared/types'

export const multiFrameRenderer: RendererExport = {
  functionName: 'renderMultiFrame',
  css: `
    .mf-frame {
      width: 100%; height: 100%;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      text-align: center; padding: 16px; gap: 8px;
      position: absolute; top: 0; left: 0;
      opacity: 0; transition: opacity 0.5s ease;
    }
    .mf-frame.active { opacity: 1; }
    .mf-frame img {
      max-width: 60%; max-height: 30%; object-fit: contain;
    }
    .mf-frame h2 {
      font-size: clamp(14px, 3vw, 22px); font-weight: 700; line-height: 1.2;
    }
    .mf-frame p {
      font-size: clamp(11px, 2vw, 14px); line-height: 1.4;
    }
    .mf-dots {
      position: absolute; bottom: 8px; left: 50%;
      transform: translateX(-50%); display: flex; gap: 6px; z-index: 5;
    }
    .mf-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: rgba(255,255,255,0.5); transition: background 0.3s;
    }
    .mf-dot.active { background: rgba(255,255,255,0.95); }
  `,
  js: `
    function renderMultiFrame(root, cfg) {
      var frames = cfg.frames || [];
      if (frames.length === 0) { renderPlaceholder(root, cfg); return; }

      var html = '<div style="position:relative;width:100%;height:100%">';
      for (var i = 0; i < frames.length; i++) {
        var f = frames[i];
        var imgHtml = f.imageUrl
          ? '<img src="' + sanitize(f.imageUrl) + '" alt="Frame image" />'
          : '';
        html += '<div class="mf-frame' + (i === 0 ? ' active' : '') + '" data-frame="' + i + '" style="background-color:' + sanitize(f.backgroundColor || '#ffffff') + '">'
          + imgHtml
          + '<h2>' + sanitize(f.headline || '') + '</h2>'
          + '<p>' + sanitize(f.bodyText || '') + '</p>'
          + '</div>';
      }

      if (frames.length > 1) {
        html += '<div class="mf-dots">';
        for (var d = 0; d < frames.length; d++) {
          html += '<div class="mf-dot' + (d === 0 ? ' active' : '') + '" data-dot="' + d + '"></div>';
        }
        html += '</div>';
      }

      if (cfg.ctaText) {
        html += '<a class="sb-cta" style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);background-color:#2563eb;z-index:10" href="' + sanitize(cfg.ctaUrl || '#') + '" target="_blank" rel="noopener">'
          + sanitize(cfg.ctaText) + '</a>';
      }

      html += '</div>';
      root.innerHTML = html;

      if (frames.length > 1) {
        var current = 0;
        var allFrames = root.querySelectorAll('.mf-frame');
        frameTimer = setInterval(function() {
          allFrames[current].classList.remove('active');
          current = (current + 1) % frames.length;
          allFrames[current].classList.add('active');
          var allDots = root.querySelectorAll('.mf-dot');
          for (var di = 0; di < allDots.length; di++) { allDots[di].classList.remove('active'); }
          if (allDots[current]) { allDots[current].classList.add('active'); }
        }, cfg.frameDuration || 3000);
      }
    }
  `,
}
