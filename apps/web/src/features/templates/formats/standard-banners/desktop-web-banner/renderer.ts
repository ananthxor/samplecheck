import type { RendererExport } from '../../_shared/types'

/**
 * Desktop Web Banner renderer — 1055×180 wide desktop banner.
 *
 * Layout (horizontal, image-as-background):
 *   - Full-bleed background image covering entire ad
 *   - Semi-transparent overlay for text readability
 *   - Logo (left), Brand + Headline (center), CTA button (right)
 *   - All text optional — empty fields = pure image ad
 */
export const desktopWebBannerRenderer: RendererExport = {
  functionName: 'renderDesktopWebBanner',
  css: `
    .st-dw-wrap {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex; align-items: center;
    }
    .st-dw-bg {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      object-fit: cover; display: block;
    }
    .st-dw-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    }
    .st-dw-content {
      position: relative; z-index: 2; display: flex; align-items: center;
      width: 100%; height: 100%; padding: 0 30px; gap: 20px;
    }
    .st-dw-logo {
      max-width: 60px; max-height: 60px; object-fit: contain; flex-shrink: 0;
    }
    .st-dw-text {
      flex: 1; display: flex; flex-direction: column; gap: 2px;
      min-width: 0;
    }
    .st-dw-brand {
      font-size: clamp(22px, 3vw, 32px); font-weight: 700;
      letter-spacing: 0.02em; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis;
    }
    .st-dw-headline {
      font-size: clamp(12px, 1.5vw, 16px); font-weight: 400;
      opacity: 0.9; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis;
    }
    .st-dw-cta {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 10px 28px; border-radius: 4px;
      font-size: clamp(11px, 1.5vw, 14px); font-weight: 700;
      text-decoration: none; cursor: pointer;
      text-transform: uppercase; letter-spacing: 0.04em;
      transition: opacity 0.2s;
      border: none; white-space: nowrap; flex-shrink: 0;
    }
    .st-dw-cta:hover { opacity: 0.85; }
    .st-dw-no-img {
      width: 100%; height: 100%;
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    }
  `,
  js: `
    function renderDesktopWebBanner(root, cfg) {
      var textColor = cfg.textColor || '#ffffff';
      var overlayColor = cfg.overlayColor || 'rgba(0,0,0,0.45)';
      var ctaBgColor = cfg.ctaBgColor || '#e23b3b';
      var ctaTextColor = cfg.ctaTextColor || '#ffffff';

      var bgHtml = cfg.imageUrl
        ? '<img class="st-dw-bg" src="' + sanitize(cfg.imageUrl) + '" alt="" />'
        : '<div class="st-dw-bg st-dw-no-img"></div>';

      var logoHtml = cfg.logoUrl
        ? '<img class="st-dw-logo" src="' + sanitize(cfg.logoUrl) + '" alt="" />'
        : '';

      var brandHtml = cfg.brandName
        ? '<div class="st-dw-brand" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.brandName) + '</div>'
        : '';

      var headlineHtml = cfg.headline
        ? '<div class="st-dw-headline" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.headline) + '</div>'
        : '';

      var textHtml = (brandHtml || headlineHtml)
        ? '<div class="st-dw-text">' + brandHtml + headlineHtml + '</div>'
        : '';

      var ctaHtml = cfg.ctaText
        ? '<a class="st-dw-cta" style="background:' + sanitize(ctaBgColor) + ';color:' + sanitize(ctaTextColor) + ';">' + sanitize(cfg.ctaText) + '</a>'
        : '';

      root.innerHTML =
        '<div class="st-dw-wrap">'
        + bgHtml
        + '<div class="st-dw-overlay" style="background:' + sanitize(overlayColor) + ';"></div>'
        + '<div class="st-dw-content">'
          + logoHtml
          + textHtml
          + ctaHtml
        + '</div>'
        + '</div>';
    }
  `,
}
