import type { RendererExport } from '../../_shared/types'

/**
 * Large Leaderboard 970×250 renderer.
 *
 * Layout (matches reference — wide horizontal, image-as-background):
 *   - Full-bleed background image covering entire ad
 *   - Semi-transparent overlay for text readability
 *   - Left side: logo (top-left), subtitle (italic), headline (large bold)
 *   - Right side: CTA pill button (vertically centered)
 *   - All text optional — empty fields = pure image ad
 */
export const largeLeaderboard970x250Renderer: RendererExport = {
  functionName: 'renderLargeLeaderboard970x250',
  css: `
    .st-l9-wrap {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .st-l9-bg {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      object-fit: cover; display: block;
    }
    .st-l9-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    }
    .st-l9-content {
      position: relative; z-index: 2;
      display: flex; align-items: stretch; justify-content: space-between;
      width: 100%; height: 100%; padding: 20px 32px;
    }
    .st-l9-left {
      display: flex; flex-direction: column; justify-content: flex-end;
      gap: 4px; max-width: 55%;
    }
    .st-l9-logo {
      max-width: 70px; max-height: 70px; object-fit: contain;
      margin-bottom: auto;
    }
    .st-l9-subtitle {
      font-size: 16px; font-weight: 300; font-style: italic;
      letter-spacing: 0.02em;
    }
    .st-l9-headline {
      font-size: 28px; font-weight: 800;
      letter-spacing: 0.04em; text-transform: uppercase;
      line-height: 1.1;
    }
    .st-l9-right {
      display: flex; align-items: center; justify-content: center;
    }
    .st-l9-cta {
      display: inline-block;
      padding: 14px 36px; border-radius: 999px;
      font-size: 16px; font-weight: 700;
      text-decoration: none; cursor: pointer;
      text-transform: uppercase; letter-spacing: 0.06em;
      transition: opacity 0.2s; border: none;
      white-space: nowrap;
    }
    .st-l9-cta:hover { opacity: 0.85; }
    .st-l9-no-img {
      width: 100%; height: 100%;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }
  `,
  js: `
    function renderLargeLeaderboard970x250(root, cfg) {
      var textColor = cfg.textColor || '#ffffff';
      var overlayColor = cfg.overlayColor || 'rgba(0,0,0,0.3)';
      var ctaBgColor = cfg.ctaBgColor || '#ffffff';
      var ctaTextColor = cfg.ctaTextColor || '#c41230';

      var bgHtml = cfg.imageUrl
        ? '<img class="st-l9-bg" src="' + sanitize(cfg.imageUrl) + '" alt="" />'
        : '<div class="st-l9-bg st-l9-no-img"></div>';

      var logoHtml = cfg.logoUrl
        ? '<img class="st-l9-logo" src="' + sanitize(cfg.logoUrl) + '" alt="" />'
        : '';

      var subtitleHtml = cfg.subtitle
        ? '<div class="st-l9-subtitle" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.subtitle) + '</div>'
        : '';

      var headlineHtml = cfg.headline
        ? '<div class="st-l9-headline" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.headline) + '</div>'
        : '';

      var ctaHtml = cfg.ctaText
        ? '<a class="st-l9-cta" style="background:' + sanitize(ctaBgColor) + ';color:' + sanitize(ctaTextColor) + ';">' + sanitize(cfg.ctaText) + '</a>'
        : '';

      root.innerHTML =
        '<div class="st-l9-wrap">'
        + bgHtml
        + '<div class="st-l9-overlay" style="background:' + sanitize(overlayColor) + ';"></div>'
        + '<div class="st-l9-content">'
          + '<div class="st-l9-left">'
            + logoHtml
            + subtitleHtml
            + headlineHtml
          + '</div>'
          + '<div class="st-l9-right">'
            + ctaHtml
          + '</div>'
        + '</div>'
        + '</div>';
    }
  `,
}
