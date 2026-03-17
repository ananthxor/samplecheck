import type { RendererExport } from '../../_shared/types'

/**
 * Leaderboard renderer — 728×90 standard display banner.
 *
 * Layout (horizontal, image-as-background):
 *   - Full-bleed background image covering entire ad
 *   - Semi-transparent overlay for text readability
 *   - Logo (left), Headline (center), CTA button (right)
 *   - All text optional — empty fields = pure image ad
 */
export const leaderboardRenderer: RendererExport = {
  functionName: 'renderLeaderboard',
  css: `
    .st-lb-wrap {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex; align-items: center;
    }
    .st-lb-bg {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      object-fit: cover; display: block;
    }
    .st-lb-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    }
    .st-lb-content {
      position: relative; z-index: 2; display: flex; align-items: center;
      width: 100%; height: 100%; padding: 0 16px; gap: 12px;
    }
    .st-lb-logo {
      max-width: 40px; max-height: 40px; object-fit: contain; flex-shrink: 0;
    }
    .st-lb-headline {
      flex: 1; font-size: clamp(14px, 2.5vw, 20px); font-weight: 700;
      line-height: 1.2; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis;
    }
    .st-lb-cta {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 8px 22px; border-radius: 4px;
      font-size: clamp(10px, 1.8vw, 13px); font-weight: 700;
      text-decoration: none; cursor: pointer;
      text-transform: uppercase; letter-spacing: 0.04em;
      transition: opacity 0.2s;
      border: none; white-space: nowrap; flex-shrink: 0;
    }
    .st-lb-cta:hover { opacity: 0.85; }
    .st-lb-no-img {
      width: 100%; height: 100%;
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    }
  `,
  js: `
    function renderLeaderboard(root, cfg) {
      var textColor = cfg.textColor || '#ffffff';
      var overlayColor = cfg.overlayColor || 'rgba(0,0,0,0.4)';
      var ctaBgColor = cfg.ctaBgColor || '#e23b3b';
      var ctaTextColor = cfg.ctaTextColor || '#ffffff';

      var bgHtml = cfg.imageUrl
        ? '<img class="st-lb-bg" src="' + sanitize(cfg.imageUrl) + '" alt="" />'
        : '<div class="st-lb-bg st-lb-no-img"></div>';

      var logoHtml = cfg.logoUrl
        ? '<img class="st-lb-logo" src="' + sanitize(cfg.logoUrl) + '" alt="" />'
        : '';

      var headlineHtml = cfg.headline
        ? '<span class="st-lb-headline" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.headline) + '</span>'
        : '';

      var ctaHtml = cfg.ctaText
        ? '<a class="st-lb-cta" style="background:' + sanitize(ctaBgColor) + ';color:' + sanitize(ctaTextColor) + ';">' + sanitize(cfg.ctaText) + '</a>'
        : '';

      root.innerHTML =
        '<div class="st-lb-wrap">'
        + bgHtml
        + '<div class="st-lb-overlay" style="background:' + sanitize(overlayColor) + ';"></div>'
        + '<div class="st-lb-content">'
          + logoHtml
          + headlineHtml
          + ctaHtml
        + '</div>'
        + '</div>';
    }
  `,
}
