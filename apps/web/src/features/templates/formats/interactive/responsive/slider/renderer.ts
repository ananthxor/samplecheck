import type { RendererExport } from '../../../_shared/types'

export const sliderRenderer: RendererExport = {
  functionName: 'renderSlider',
  css: `
    .sl-container { width:100%; height:100%; position:relative; overflow:hidden; touch-action:none; cursor:ew-resize; }
    .sl-img { position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; }
    .sl-after-clip { position:absolute; top:0; left:0; width:100%; height:100%; overflow:hidden; }
    .sl-handle { position:absolute; top:0; width:3px; height:100%; background:#ffffff; box-shadow:0 0 4px rgba(0,0,0,0.5); z-index:10; }
    .sl-handle-circle { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:28px; height:28px; border-radius:50%; background:#ffffff; box-shadow:0 0 4px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; font-size:12px; color:#6b7280; }
    .sl-label { position:absolute; bottom:8px; padding:4px 10px; background:rgba(0,0,0,0.6); color:#fff; font-size:11px; border-radius:4px; z-index:5; }
    .sl-label-before { left:8px; }
    .sl-label-after { right:8px; }
  `,
  js: `
    function renderSlider(root, cfg) {
      var beforeImg = cfg.beforeImageUrl ? '<img class="sl-img" src="' + sanitize(cfg.beforeImageUrl) + '" alt="Before" />' : '';
      var afterImg = cfg.afterImageUrl ? '<img class="sl-img" src="' + sanitize(cfg.afterImageUrl) + '" alt="After" />' : '';
      var headlineHtml = cfg.headline ? '<div style="position:absolute;top:8px;left:50%;transform:translateX(-50%);padding:4px 12px;background:rgba(0,0,0,0.6);color:#fff;font-size:13px;border-radius:4px;z-index:5;white-space:nowrap">' + sanitize(cfg.headline) + '</div>' : '';
      var ctaHtml = cfg.ctaText ? '<a class="sb-cta" style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);background-color:#2563eb;z-index:10" href="' + sanitize(cfg.ctaUrl || '#') + '" target="_blank" rel="noopener">' + sanitize(cfg.ctaText) + '</a>' : '';

      root.innerHTML = '<div class="sl-container">' + beforeImg + '<div class="sl-after-clip" style="width:50%">' + afterImg + '</div><div class="sl-handle" style="left:50%"><div class="sl-handle-circle">\u25C0\u25B6</div></div><span class="sl-label sl-label-before">Before</span><span class="sl-label sl-label-after">After</span>' + headlineHtml + ctaHtml + '</div>';

      var slContainer = root.querySelector('.sl-container');
      var afterClip = root.querySelector('.sl-after-clip');
      var handle = root.querySelector('.sl-handle');
      var dragging = false;

      slContainer.addEventListener('pointerdown', function(e) { dragging = true; slContainer.setPointerCapture(e.pointerId); });
      slContainer.addEventListener('pointermove', function(e) {
        if (!dragging) return;
        var rect = slContainer.getBoundingClientRect();
        var pct = ((e.clientX - rect.left) / rect.width) * 100;
        if (pct < 5) pct = 5; if (pct > 95) pct = 95;
        afterClip.style.width = pct + '%'; handle.style.left = pct + '%';
      });
      slContainer.addEventListener('pointerup', function() { dragging = false; });
    }
  `,
}
