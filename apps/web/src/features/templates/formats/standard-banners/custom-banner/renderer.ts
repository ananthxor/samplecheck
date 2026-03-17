import type { RendererExport } from '../../_shared/types'

/**
 * Custom Banner renderer — responsive image-overlay banner for any size.
 *
 * Layout (image-as-background, centered flex-wrap):
 *   - Full-bleed background image
 *   - Semi-transparent overlay
 *   - Centered content: logo → subtitle → headline → CTA pill
 *   - Flex-wrap layout adapts to any width/height ratio
 */
export const customBannerRenderer: RendererExport = {
  functionName: 'renderCustomBanner',
  css: `
    .st-cb-wrap {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex; align-items: center; justify-content: center;
      padding: 12px; text-align: center;
    }
    .st-cb-bg {
      position: absolute; inset: 0;
      background-size: cover; background-position: center;
    }
    .st-cb-overlay {
      position: absolute; inset: 0;
      pointer-events: none;
    }
    .st-cb-content {
      position: relative; z-index: 2;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 6px; max-width: 100%;
    }
    .st-cb-logo {
      max-width: 80px; max-height: 40px; object-fit: contain;
    }
    .st-cb-subtitle {
      font-size: 12px; font-style: italic;
      line-height: 1.3;
      overflow: hidden; text-overflow: ellipsis;
    }
    .st-cb-headline {
      font-size: 20px; font-weight: 800;
      line-height: 1.2; text-transform: uppercase;
      overflow: hidden; text-overflow: ellipsis;
    }
    .st-cb-cta {
      display: inline-block;
      padding: 6px 18px; border-radius: 4px;
      font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.3px;
      text-decoration: none; cursor: pointer;
      text-align: center; border: none;
      white-space: nowrap;
      transition: opacity 0.2s;
    }
    .st-cb-cta:hover { opacity: 0.85; }
  `,
  js: `
    function renderCustomBanner(root, cfg) {
      var textColor = cfg.textColor || '#ffffff';
      var ctaBgColor = cfg.ctaBgColor || '#ffffff';
      var ctaTextColor = cfg.ctaTextColor || '#e23b3b';
      var overlayColor = cfg.overlayColor || 'rgba(0,0,0,0.4)';

      var bgHtml = cfg.imageUrl
        ? '<div class="st-cb-bg" style="background-image:url(' + sanitize(cfg.imageUrl) + ');"></div>'
        : '<div class="st-cb-bg" style="background:#1a1a1a;"></div>';

      var overlayHtml = '<div class="st-cb-overlay" style="background:' + sanitize(overlayColor) + ';"></div>';

      var logoHtml = cfg.logoUrl
        ? '<img class="st-cb-logo" src="' + sanitize(cfg.logoUrl) + '" alt="Logo" />'
        : '';

      var subtitleHtml = cfg.subtitle
        ? '<div class="st-cb-subtitle" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.subtitle) + '</div>'
        : '';

      var headlineHtml = cfg.headline
        ? '<div class="st-cb-headline" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.headline) + '</div>'
        : '';

      var ctaHtml = cfg.ctaText
        ? '<div class="st-cb-cta" style="background:' + sanitize(ctaBgColor) + ';color:' + sanitize(ctaTextColor) + ';">' + sanitize(cfg.ctaText) + '</div>'
        : '';

      root.innerHTML =
        '<div class="st-cb-wrap">'
        + bgHtml
        + overlayHtml
        + '<div class="st-cb-content">'
          + logoHtml
          + subtitleHtml
          + headlineHtml
          + ctaHtml
        + '</div>'
        + '</div>';
    }
  `,
}
