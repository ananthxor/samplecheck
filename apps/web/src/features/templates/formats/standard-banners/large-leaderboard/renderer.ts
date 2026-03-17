import type { RendererExport } from '../../_shared/types'

/**
 * Large Leaderboard renderer — 728×300 image-overlay banner.
 *
 * Layout:
 *   - Full-bleed background image
 *   - Logo image in top-left corner
 *   - Subtitle (italic) + headline (large bold) center-left
 *   - CTA pill button below headline
 *   - Text overlays on dark background image
 */
export const largeLeaderboardRenderer: RendererExport = {
  functionName: 'renderLargeLeaderboard',
  css: `
    .st-ll-wrap {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex; flex-direction: column; justify-content: center;
      padding: 24px 30px;
    }
    .st-ll-bg {
      position: absolute; inset: 0;
      background-size: cover; background-position: center;
    }
    .st-ll-overlay {
      position: absolute; inset: 0;
      pointer-events: none;
    }
    .st-ll-logo {
      position: absolute; top: 16px; left: 20px;
      width: 70px; height: 70px; object-fit: contain;
      z-index: 2;
    }
    .st-ll-content {
      position: relative; z-index: 2;
      display: flex; flex-direction: column;
      margin-top: 40px;
    }
    .st-ll-subtitle {
      font-size: clamp(13px, 2vw, 17px); font-style: italic;
      line-height: 1.3;
    }
    .st-ll-headline {
      font-size: clamp(24px, 4vw, 38px); font-weight: 800;
      line-height: 1.15; margin-top: 2px;
      text-transform: uppercase;
    }
    .st-ll-cta {
      display: inline-block; margin-top: 14px;
      padding: 10px 28px; border-radius: 4px;
      font-size: clamp(12px, 1.8vw, 16px); font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.5px;
      text-align: center; width: fit-content;
    }
  `,
  js: `
    function renderLargeLeaderboard(root, cfg) {
      var textColor = cfg.textColor || '#ffffff';
      var ctaBgColor = cfg.ctaBgColor || '#ffffff';
      var ctaTextColor = cfg.ctaTextColor || '#e23b3b';
      var overlayColor = cfg.overlayColor || 'rgba(0,0,0,0.3)';

      var bgHtml = cfg.imageUrl
        ? '<div class="st-ll-bg" style="background-image:url(' + sanitize(cfg.imageUrl) + ');"></div>'
        : '<div class="st-ll-bg" style="background:#1a1a1a;"></div>';

      var overlayHtml = '<div class="st-ll-overlay" style="background:' + sanitize(overlayColor) + ';"></div>';

      var logoHtml = cfg.logoUrl
        ? '<img class="st-ll-logo" src="' + sanitize(cfg.logoUrl) + '" alt="Logo" />'
        : '';

      var subtitleHtml = cfg.subtitle
        ? '<div class="st-ll-subtitle" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.subtitle) + '</div>'
        : '';

      var headlineHtml = cfg.headline
        ? '<div class="st-ll-headline" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.headline) + '</div>'
        : '';

      var ctaHtml = cfg.ctaText
        ? '<div class="st-ll-cta" style="background:' + sanitize(ctaBgColor) + ';color:' + sanitize(ctaTextColor) + ';">' + sanitize(cfg.ctaText) + '</div>'
        : '';

      var contentHtml = '<div class="st-ll-content">'
        + subtitleHtml
        + headlineHtml
        + ctaHtml
        + '</div>';

      root.innerHTML =
        '<div class="st-ll-wrap">'
        + bgHtml
        + overlayHtml
        + logoHtml
        + contentHtml
        + '</div>';
    }
  `,
}
