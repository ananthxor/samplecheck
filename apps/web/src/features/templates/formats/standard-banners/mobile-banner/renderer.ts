import type { RendererExport } from '../../_shared/types'

/**
 * Mobile Banner 320×100 renderer — compact image-overlay banner.
 *
 * Layout (image-as-background, horizontal):
 *   - Full-bleed background image
 *   - Semi-transparent overlay
 *   - Left: subtitle (italic) + headline (bold), stacked
 *   - Right: logo badge + small CTA pill below
 */
export const mobileBannerRenderer: RendererExport = {
  functionName: 'renderMobileBanner',
  css: `
    .st-mb-wrap {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex; align-items: center;
      padding: 0 12px; gap: 10px;
    }
    .st-mb-bg {
      position: absolute; inset: 0;
      background-size: cover; background-position: center;
    }
    .st-mb-overlay {
      position: absolute; inset: 0;
      pointer-events: none;
    }
    .st-mb-content {
      position: relative; z-index: 2;
      display: flex; flex-direction: column;
      flex: 1; min-width: 0; justify-content: center;
    }
    .st-mb-subtitle {
      font-size: 11px; font-style: italic;
      line-height: 1.3; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis;
    }
    .st-mb-headline {
      font-size: 16px; font-weight: 800;
      line-height: 1.2; text-transform: uppercase;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .st-mb-right {
      position: relative; z-index: 2;
      display: flex; flex-direction: column;
      align-items: center; gap: 6px; flex-shrink: 0;
    }
    .st-mb-logo {
      width: 48px; height: 48px; object-fit: contain;
    }
    .st-mb-cta {
      display: inline-block;
      padding: 4px 12px; border-radius: 3px;
      font-size: 9px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.3px;
      text-decoration: none; cursor: pointer;
      text-align: center; border: none;
      white-space: nowrap;
      transition: opacity 0.2s;
    }
    .st-mb-cta:hover { opacity: 0.85; }
  `,
  js: `
    function renderMobileBanner(root, cfg) {
      var textColor = cfg.textColor || '#ffffff';
      var ctaBgColor = cfg.ctaBgColor || '#ffffff';
      var ctaTextColor = cfg.ctaTextColor || '#e23b3b';
      var overlayColor = cfg.overlayColor || 'rgba(0,0,0,0.4)';

      var bgHtml = cfg.imageUrl
        ? '<div class="st-mb-bg" style="background-image:url(' + sanitize(cfg.imageUrl) + ');"></div>'
        : '<div class="st-mb-bg" style="background:#1a1a1a;"></div>';

      var overlayHtml = '<div class="st-mb-overlay" style="background:' + sanitize(overlayColor) + ';"></div>';

      var subtitleHtml = cfg.subtitle
        ? '<div class="st-mb-subtitle" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.subtitle) + '</div>'
        : '';

      var headlineHtml = cfg.headline
        ? '<div class="st-mb-headline" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.headline) + '</div>'
        : '';

      var logoHtml = cfg.logoUrl
        ? '<img class="st-mb-logo" src="' + sanitize(cfg.logoUrl) + '" alt="Logo" />'
        : '';

      var ctaHtml = cfg.ctaText
        ? '<div class="st-mb-cta" style="background:' + sanitize(ctaBgColor) + ';color:' + sanitize(ctaTextColor) + ';">' + sanitize(cfg.ctaText) + '</div>'
        : '';

      root.innerHTML =
        '<div class="st-mb-wrap">'
        + bgHtml
        + overlayHtml
        + '<div class="st-mb-content">'
          + subtitleHtml
          + headlineHtml
        + '</div>'
        + '<div class="st-mb-right">'
          + logoHtml
          + ctaHtml
        + '</div>'
        + '</div>';
    }
  `,
}
