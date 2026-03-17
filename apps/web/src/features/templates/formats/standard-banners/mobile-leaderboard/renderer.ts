import type { RendererExport } from '../../_shared/types'

/**
 * Mobile Leaderboard renderer — 320×50 standard mobile banner.
 *
 * Layout (compact horizontal):
 *   - Full background image covering the entire ad
 *   - Right-aligned: Logo + Brand name + CTA pill button
 *   - Very compact — only 50px tall
 */
export const mobileLeaderboardRenderer: RendererExport = {
  functionName: 'renderMobileLeaderboard',
  css: `
    .st-ml-wrap {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex; align-items: center;
    }
    .st-ml-bg {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      object-fit: cover; display: block;
    }
    .st-ml-no-bg {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      color: rgba(0,0,0,0.15); font-size: 9px;
    }
    .st-ml-content {
      position: relative; z-index: 2; margin-left: auto;
      display: flex; align-items: center; gap: 6px;
      padding: 0 10px;
    }
    .st-ml-logo {
      max-width: 20px; max-height: 20px; object-fit: contain; flex-shrink: 0;
    }
    .st-ml-brand {
      font-size: 11px; font-weight: 700; white-space: nowrap;
      letter-spacing: 0.02em; text-transform: uppercase;
    }
    .st-ml-cta {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 4px 12px; border-radius: 3px;
      font-size: 9px; font-weight: 700;
      text-decoration: none; cursor: pointer;
      text-transform: uppercase; letter-spacing: 0.04em;
      transition: opacity 0.2s; border: none; white-space: nowrap;
    }
    .st-ml-cta:hover { opacity: 0.85; }
  `,
  js: `
    function renderMobileLeaderboard(root, cfg) {
      var bgColor = cfg.bgColor || '#fef9ef';
      var textColor = cfg.textColor || '#1e293b';
      var ctaBgColor = cfg.ctaBgColor || '#e23b3b';
      var ctaTextColor = cfg.ctaTextColor || '#ffffff';

      var bgHtml = cfg.imageUrl
        ? '<img class="st-ml-bg" src="' + sanitize(cfg.imageUrl) + '" alt="" />'
        : '<div class="st-ml-no-bg">No image</div>';

      var logoHtml = cfg.logoUrl
        ? '<img class="st-ml-logo" src="' + sanitize(cfg.logoUrl) + '" alt="" />'
        : '';

      var brandHtml = cfg.brandName
        ? '<span class="st-ml-brand" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.brandName) + '</span>'
        : '';

      var ctaHtml = cfg.ctaText
        ? '<a class="st-ml-cta" style="background:' + sanitize(ctaBgColor) + ';color:' + sanitize(ctaTextColor) + ';" href="' + sanitize(cfg.ctaUrl || '#') + '" target="_blank" rel="noopener">' + sanitize(cfg.ctaText) + '</a>'
        : '';

      root.innerHTML =
        '<div class="st-ml-wrap" style="background:' + sanitize(bgColor) + ';">'
        + bgHtml
        + '<div class="st-ml-content">'
          + logoHtml
          + brandHtml
          + ctaHtml
        + '</div>'
        + '</div>';
    }
  `,
}
