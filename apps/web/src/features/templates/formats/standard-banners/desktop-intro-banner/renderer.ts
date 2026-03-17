import type { RendererExport } from '../../_shared/types'

/**
 * Desktop Intro Banner renderer — 1600×450 large intro banner.
 *
 * Layout (wide horizontal, image-as-background):
 *   - Full-bleed background image covering entire ad
 *   - Semi-transparent overlay for text readability
 *   - Logo (left), Brand + Headline (center-left), CTA button (right)
 *   - All text optional — empty fields = pure image ad
 */
export const desktopIntroBannerRenderer: RendererExport = {
  functionName: 'renderDesktopIntroBanner',
  css: `
    .st-di-wrap {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex; align-items: center;
    }
    .st-di-bg {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      object-fit: cover; display: block;
    }
    .st-di-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    }
    .st-di-content {
      position: relative; z-index: 2; display: flex; align-items: center;
      width: 100%; height: 100%; padding: 0 50px; gap: 30px;
    }
    .st-di-logo {
      max-width: 80px; max-height: 80px; object-fit: contain; flex-shrink: 0;
    }
    .st-di-text {
      flex: 1; display: flex; flex-direction: column; gap: 4px;
      min-width: 0;
    }
    .st-di-brand {
      font-size: clamp(36px, 4vw, 56px); font-weight: 700;
      line-height: 1.1;
    }
    .st-di-headline {
      font-size: clamp(14px, 1.5vw, 20px); font-weight: 400;
      opacity: 0.9; margin-top: 4px;
    }
    .st-di-cta {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 14px 36px; border-radius: 4px;
      font-size: clamp(13px, 1.5vw, 18px); font-weight: 700;
      text-decoration: none; cursor: pointer;
      text-transform: uppercase; letter-spacing: 0.04em;
      transition: opacity 0.2s;
      border: none; white-space: nowrap; flex-shrink: 0;
    }
    .st-di-cta:hover { opacity: 0.85; }
    .st-di-no-img {
      width: 100%; height: 100%;
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    }
  `,
  js: `
    function renderDesktopIntroBanner(root, cfg) {
      var textColor = cfg.textColor || '#ffffff';
      var overlayColor = cfg.overlayColor || 'rgba(0,0,0,0.4)';
      var ctaBgColor = cfg.ctaBgColor || '#e23b3b';
      var ctaTextColor = cfg.ctaTextColor || '#ffffff';

      var bgHtml = cfg.imageUrl
        ? '<img class="st-di-bg" src="' + sanitize(cfg.imageUrl) + '" alt="" />'
        : '<div class="st-di-bg st-di-no-img"></div>';

      var logoHtml = cfg.logoUrl
        ? '<img class="st-di-logo" src="' + sanitize(cfg.logoUrl) + '" alt="" />'
        : '';

      var brandHtml = cfg.brandName
        ? '<div class="st-di-brand" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.brandName) + '</div>'
        : '';

      var headlineHtml = cfg.headline
        ? '<div class="st-di-headline" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.headline) + '</div>'
        : '';

      var textHtml = (brandHtml || headlineHtml)
        ? '<div class="st-di-text">' + brandHtml + headlineHtml + '</div>'
        : '';

      var ctaHtml = cfg.ctaText
        ? '<a class="st-di-cta" style="background:' + sanitize(ctaBgColor) + ';color:' + sanitize(ctaTextColor) + ';">' + sanitize(cfg.ctaText) + '</a>'
        : '';

      root.innerHTML =
        '<div class="st-di-wrap">'
        + bgHtml
        + '<div class="st-di-overlay" style="background:' + sanitize(overlayColor) + ';"></div>'
        + '<div class="st-di-content">'
          + logoHtml
          + textHtml
          + ctaHtml
        + '</div>'
        + '</div>';
    }
  `,
}
