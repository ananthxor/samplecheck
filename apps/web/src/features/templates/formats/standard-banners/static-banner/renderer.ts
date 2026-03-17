import type { RendererExport } from '../../_shared/types'

export const staticBannerRenderer: RendererExport = {
  functionName: 'renderStaticBanner',
  css: `
    .sb-container {
      width: 100%; height: 100%;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      text-align: center; padding: 16px; gap: 8px;
      overflow: hidden;
    }
    .sb-container img {
      max-width: 60%; max-height: 30%; object-fit: contain;
    }
    .sb-container h1 {
      font-size: clamp(14px, 3vw, 24px); font-weight: 700;
      line-height: 1.2; word-break: break-word;
    }
    .sb-container p {
      font-size: clamp(11px, 2vw, 14px); line-height: 1.4;
      word-break: break-word;
    }
    .sb-container .sb-cta { transition: opacity 0.2s ease, transform 0.2s ease; }
    .sb-container .sb-cta:hover { opacity: 0.9; transform: translateY(-1px); }
  `,
  js: `
    function renderStaticBanner(root, cfg) {
      var imgHtml = cfg.imageUrl
        ? '<img src="' + sanitize(cfg.imageUrl) + '" alt="Creative image" />'
        : '';

      root.innerHTML =
        '<div class="sb-container" style="background-color:' + sanitize(cfg.backgroundColor || '#ffffff') + ';color:' + sanitize(cfg.textColor || '#000000') + '">'
        + imgHtml
        + '<h1>' + sanitize(cfg.headline || '') + '</h1>'
        + '<p>' + sanitize(cfg.bodyText || '') + '</p>'
        + '<a class="sb-cta" href="' + sanitize(cfg.ctaUrl || '#') + '" target="_blank" rel="noopener" style="background-color:' + sanitize(cfg.ctaColor || '#2563eb') + '">'
        + sanitize(cfg.ctaText || 'Learn More')
        + '</a>'
        + '</div>';
    }
  `,
}
