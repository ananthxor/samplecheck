import type { RendererExport } from '../../_shared/types'

/**
 * Large Rectangle renderer — 336×280 standard display ad.
 *
 * Layout (vertical, image-as-background):
 *   - Full-bleed background image covering entire ad
 *   - Dark gradient overlay for text readability
 *   - Logo + Brand name (top), Headline (center), CTA button (bottom)
 *   - All text optional — empty fields = pure image ad
 */
export const largeRectangleRenderer: RendererExport = {
  functionName: 'renderLargeRectangle',
  css: `
    .st-lr-wrap {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex; flex-direction: column;
    }
    .st-lr-bg {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      object-fit: cover; display: block;
    }
    .st-lr-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    }
    .st-lr-content {
      position: relative; z-index: 2; display: flex; flex-direction: column;
      align-items: center; justify-content: flex-end;
      width: 100%; height: 100%; padding: 14px 16px 16px; text-align: center;
      gap: 4px;
    }
    .st-lr-logo {
      max-width: 32px; max-height: 32px; object-fit: contain;
      margin-bottom: 2px;
    }
    .st-lr-brand {
      font-size: clamp(16px, 5vw, 22px); font-weight: 300;
      letter-spacing: 0.2em; text-transform: uppercase;
      margin-bottom: 1px;
    }
    .st-lr-headline {
      font-size: clamp(11px, 3vw, 14px); font-weight: 400;
      line-height: 1.3; margin: 0; padding: 0 4px;
    }
    .st-lr-cta {
      display: inline-block; margin-top: 8px;
      padding: 8px 24px; border-radius: 4px;
      font-size: clamp(11px, 3vw, 13px); font-weight: 700;
      text-decoration: none; cursor: pointer;
      text-transform: uppercase; letter-spacing: 0.04em;
      transition: opacity 0.2s;
      border: none;
    }
    .st-lr-cta:hover { opacity: 0.85; }
    .st-lr-no-img {
      width: 100%; height: 100%;
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    }
  `,
  js: `
    function renderLargeRectangle(root, cfg) {
      var textColor = cfg.textColor || '#ffffff';
      var overlayColor = cfg.overlayColor || 'rgba(0,0,0,0.5)';
      var ctaBgColor = cfg.ctaBgColor || '#e23b3b';
      var ctaTextColor = cfg.ctaTextColor || '#ffffff';

      var bgHtml = cfg.imageUrl
        ? '<img class="st-lr-bg" src="' + sanitize(cfg.imageUrl) + '" alt="" />'
        : '<div class="st-lr-bg st-lr-no-img"></div>';

      var logoHtml = cfg.logoUrl
        ? '<img class="st-lr-logo" src="' + sanitize(cfg.logoUrl) + '" alt="" />'
        : '';

      var brandHtml = cfg.brandName
        ? '<div class="st-lr-brand" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.brandName) + '</div>'
        : '';

      var headlineHtml = cfg.headline
        ? '<p class="st-lr-headline" style="color:' + sanitize(textColor) + ';opacity:0.9;">' + sanitize(cfg.headline) + '</p>'
        : '';

      var ctaHtml = cfg.ctaText
        ? '<a class="st-lr-cta" style="background:' + sanitize(ctaBgColor) + ';color:' + sanitize(ctaTextColor) + ';">' + sanitize(cfg.ctaText) + '</a>'
        : '';

      root.innerHTML =
        '<div class="st-lr-wrap">'
        + bgHtml
        + '<div class="st-lr-overlay" style="background:' + sanitize(overlayColor) + ';"></div>'
        + '<div class="st-lr-content">'
          + logoHtml
          + brandHtml
          + headlineHtml
          + ctaHtml
        + '</div>'
        + '</div>';
    }
  `,
}
