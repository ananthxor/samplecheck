import type { RendererExport } from '../../../_shared/types'

export const accordionRenderer: RendererExport = {
  functionName: 'renderAccordion',
  css: `
    .acc-container { width:100%; height:100%; overflow-y:auto; padding:8px; }
    .acc-section { border:1px solid #e5e7eb; border-radius:8px; margin-bottom:6px; overflow:hidden; }
    .acc-header { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; cursor:pointer; background:#f9fafb; font-weight:600; font-size:clamp(12px,2.5vw,15px); user-select:none; }
    .acc-header:hover { background:#f3f4f6; }
    .acc-arrow { transition:transform 0.3s; font-size:12px; }
    .acc-arrow.open { transform:rotate(180deg); }
    .acc-body { max-height:0; overflow:hidden; transition:max-height 0.3s ease; }
    .acc-body-inner { padding:10px 14px; font-size:clamp(11px,2vw,13px); line-height:1.5; }
    .acc-body-inner img { max-width:100%; border-radius:4px; margin-top:6px; }
  `,
  js: `
    function renderAccordion(root, cfg) {
      var sections = cfg.sections || [];
      if (sections.length === 0) { renderPlaceholder(root, cfg); return; }

      var html = '<div class="acc-container">';
      for (var i = 0; i < sections.length; i++) {
        var s = sections[i];
        var imgHtml = s.imageUrl ? '<img src="' + sanitize(s.imageUrl) + '" alt="Section image" />' : '';
        html += '<div class="acc-section"><div class="acc-header" data-idx="' + i + '"><span>' + sanitize(s.title || '') + '</span><span class="acc-arrow' + (i === 0 ? ' open' : '') + '">\u25BC</span></div>'
          + '<div class="acc-body" id="acc-body-' + i + '"><div class="acc-body-inner">' + sanitize(s.content || '') + imgHtml + '</div></div></div>';
      }
      if (cfg.ctaText) {
        html += '<div style="text-align:center;padding:8px 0"><a class="sb-cta" href="' + sanitize(cfg.ctaUrl || '#') + '" target="_blank" rel="noopener" style="background-color:#2563eb">' + sanitize(cfg.ctaText) + '</a></div>';
      }
      html += '</div>';
      root.innerHTML = html;

      var firstBody = document.getElementById('acc-body-0');
      if (firstBody) { firstBody.style.maxHeight = firstBody.querySelector('.acc-body-inner').scrollHeight + 'px'; }

      var headers = root.querySelectorAll('.acc-header');
      for (var h = 0; h < headers.length; h++) {
        headers[h].addEventListener('click', function(e) {
          var header = e.currentTarget;
          var idx = header.dataset.idx;
          var arrow = header.querySelector('.acc-arrow');
          var body = document.getElementById('acc-body-' + idx);
          var inner = body.querySelector('.acc-body-inner');
          
          if (typeof window.ScrollTodaySDK !== 'undefined') {
            window.ScrollTodaySDK.track('engagement', { type: 'accordion_expand', section_index: idx });
          }
          
          if (arrow.classList.contains('open')) { arrow.classList.remove('open'); body.style.maxHeight = '0'; }
          else { arrow.classList.add('open'); body.style.maxHeight = inner.scrollHeight + 'px'; }
        });
      }
    }
  `,
}
