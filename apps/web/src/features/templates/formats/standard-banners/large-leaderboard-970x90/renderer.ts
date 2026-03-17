import type { RendererExport } from '../../_shared/types'

/**
 * Large Leaderboard 970×90 renderer — wide image-overlay banner.
 *
 * Layout (image-as-background, horizontal arrangement for 90px height):
 *   - Full-bleed background image
 *   - Semi-transparent overlay
 *   - Logo (left), subtitle + headline (center), CTA pill (right)
 */
export const largeLeaderboard970x90Renderer: RendererExport = {
  functionName: 'renderLargeLeaderboard970x90',
  css: `
    .st-l0-wrap {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex; align-items: center;
      padding: 0 24px; gap: 20px;
    }
    .st-l0-bg {
      position: absolute; inset: 0;
      background-size: cover; background-position: center;
    }
    .st-l0-overlay {
      position: absolute; inset: 0;
      pointer-events: none;
    }
    .st-l0-logo {
      position: relative; z-index: 2;
      width: 60px; height: 60px; object-fit: contain;
      flex-shrink: 0;
    }
    .st-l0-content {
      position: relative; z-index: 2;
      display: flex; flex-direction: column;
      flex: 1; min-width: 0;
    }
    .st-l0-subtitle {
      font-size: 12px; font-style: italic;
      line-height: 1.3;
    }
    .st-l0-headline {
      font-size: 22px; font-weight: 800;
      line-height: 1.15; text-transform: uppercase;
    }
    .st-l0-cta {
      position: relative; z-index: 2;
      display: inline-block; flex-shrink: 0;
      padding: 8px 24px; border-radius: 4px;
      font-size: 13px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.5px;
      text-decoration: none; cursor: pointer;
      text-align: center; border: none;
      transition: opacity 0.2s;
    }
    .st-l0-cta:hover { opacity: 0.85; }
  `,
  js: `
    function renderLargeLeaderboard970x90(root, cfg) {
      var textColor = cfg.textColor || '#ffffff';
      var ctaBgColor = cfg.ctaBgColor || '#ffffff';
      var ctaTextColor = cfg.ctaTextColor || '#e23b3b';
      var overlayColor = cfg.overlayColor || 'rgba(0,0,0,0.35)';

      var bgHtml = cfg.imageUrl
        ? '<div class="st-l0-bg" style="background-image:url(' + sanitize(cfg.imageUrl) + ');"></div>'
        : '<div class="st-l0-bg" style="background:#1a1a1a;"></div>';

      var overlayHtml = '<div class="st-l0-overlay" style="background:' + sanitize(overlayColor) + ';"></div>';

      var logoHtml = cfg.logoUrl
        ? '<img class="st-l0-logo" src="' + sanitize(cfg.logoUrl) + '" alt="Logo" />'
        : '';

      var subtitleHtml = cfg.subtitle
        ? '<div class="st-l0-subtitle" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.subtitle) + '</div>'
        : '';

      var headlineHtml = cfg.headline
        ? '<div class="st-l0-headline" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.headline) + '</div>'
        : '';

      var ctaHtml = cfg.ctaText
        ? '<div class="st-l0-cta" style="background:' + sanitize(ctaBgColor) + ';color:' + sanitize(ctaTextColor) + ';">' + sanitize(cfg.ctaText) + '</div>'
        : '';

      root.innerHTML =
        '<div class="st-l0-wrap">'
        + bgHtml
        + overlayHtml
        + logoHtml
        + '<div class="st-l0-content">'
          + subtitleHtml
          + headlineHtml
        + '</div>'
        + ctaHtml
        + '</div>';
    }
  `,
}
