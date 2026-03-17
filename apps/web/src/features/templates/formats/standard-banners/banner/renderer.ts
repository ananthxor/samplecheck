import type { RendererExport } from '../../_shared/types'

/**
 * Banner renderer — 468×60 standard display banner.
 *
 * Layout (horizontal, single row):
 *   - Full background image
 *   - Light/dark overlay for text readability
 *   - Logo (left), Brand Name (center), CTA button (right)
 *   - Very compact — only 60px height
 */
export const bannerRenderer: RendererExport = {
  functionName: 'renderBanner',
  css: `
    .st-bn-wrap {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      background: #f8f8f0; display: flex; align-items: center;
    }
    .st-bn-bg {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      object-fit: cover; display: block;
    }
    .st-bn-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(255,255,255,0.25);
    }
    .st-bn-content {
      position: relative; z-index: 2; display: flex; align-items: center;
      justify-content: center; gap: 12px;
      width: 100%; height: 100%; padding: 0 16px;
    }
    .st-bn-logo {
      max-width: 32px; max-height: 32px; object-fit: contain;
      flex-shrink: 0;
    }
    .st-bn-brand {
      font-size: clamp(14px, 3vw, 20px); font-weight: 700;
      letter-spacing: 0.04em; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis;
    }
    .st-bn-tagline {
      font-size: clamp(9px, 1.8vw, 12px); font-weight: 400;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      opacity: 0.8;
    }
    .st-bn-cta {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 6px 18px; border-radius: 4px;
      font-size: clamp(9px, 2vw, 12px); font-weight: 700;
      text-decoration: none; cursor: pointer;
      text-transform: uppercase; letter-spacing: 0.04em;
      transition: opacity 0.2s;
      border: none; white-space: nowrap; flex-shrink: 0;
    }
    .st-bn-cta:hover { opacity: 0.85; }
    .st-bn-no-img {
      width: 100%; height: 100%;
      background: linear-gradient(90deg, #fef9ef 0%, #fdf2e9 50%, #fef9ef 100%);
    }
  `,
  js: `
    function renderBanner(root, cfg) {
      var textColor = cfg.textColor || '#222222';
      var ctaBg = cfg.ctaBgColor || '#e23b3b';
      var ctaTextColor = cfg.ctaTextColor || '#ffffff';

      var bgHtml = cfg.imageUrl
        ? '<img class="st-bn-bg" src="' + sanitize(cfg.imageUrl) + '" alt="" />'
        : '<div class="st-bn-bg st-bn-no-img"></div>';

      var logoHtml = cfg.logoUrl
        ? '<img class="st-bn-logo" src="' + sanitize(cfg.logoUrl) + '" alt="" />'
        : '';

      var brandHtml = cfg.brandName
        ? '<span class="st-bn-brand" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.brandName) + '</span>'
        : '';

      var taglineHtml = cfg.tagline
        ? '<span class="st-bn-tagline" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.tagline) + '</span>'
        : '';

      var ctaHtml = cfg.ctaText
        ? '<a class="st-bn-cta" style="background:' + sanitize(ctaBg) + ';color:' + sanitize(ctaTextColor) + ';" href="' + sanitize(cfg.ctaUrl || '#') + '" target="_blank" rel="noopener">' + sanitize(cfg.ctaText) + '</a>'
        : '';

      root.innerHTML =
        '<div class="st-bn-wrap">'
        + bgHtml
        + '<div class="st-bn-overlay"></div>'
        + '<div class="st-bn-content">'
          + logoHtml
          + brandHtml
          + taglineHtml
          + ctaHtml
        + '</div>'
        + '</div>';
    }
  `,
}
