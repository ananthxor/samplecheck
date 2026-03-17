import type { RendererExport } from '../../_shared/types'

/**
 * Mobile Intro Banner renderer — 540×350 mobile-friendly intro banner.
 *
 * Layout (vertical, image-as-background):
 *   - Full-bleed background image covering entire ad
 *   - Semi-transparent overlay for text readability
 *   - Brand name (top), Headline (center), CTA button (bottom)
 *   - All text optional — empty fields = pure image ad
 */
export const mobileIntroBannerRenderer: RendererExport = {
  functionName: 'renderMobileIntroBanner',
  css: `
    .st-mi-wrap {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex; flex-direction: column;
    }
    .st-mi-bg {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      object-fit: cover; display: block;
    }
    .st-mi-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    }
    .st-mi-content {
      position: relative; z-index: 2; display: flex; flex-direction: column;
      justify-content: flex-end;
      width: 100%; height: 100%; padding: 24px 24px;
    }
    .st-mi-brand {
      font-size: clamp(28px, 7vw, 42px); font-weight: 700;
      line-height: 1.1;
    }
    .st-mi-headline {
      font-size: clamp(12px, 3vw, 16px); font-weight: 400;
      opacity: 0.9; margin-top: 4px;
    }
    .st-mi-cta {
      display: inline-block; margin-top: 14px;
      padding: 8px 24px; border-radius: 4px; width: fit-content;
      font-size: clamp(11px, 3vw, 14px); font-weight: 700;
      text-decoration: none; cursor: pointer;
      text-transform: uppercase; letter-spacing: 0.04em;
      transition: opacity 0.2s; border: none;
    }
    .st-mi-cta:hover { opacity: 0.85; }
    .st-mi-no-img {
      width: 100%; height: 100%;
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    }
  `,
  js: `
    function renderMobileIntroBanner(root, cfg) {
      var textColor = cfg.textColor || '#ffffff';
      var overlayColor = cfg.overlayColor || 'rgba(0,0,0,0.4)';
      var ctaBgColor = cfg.ctaBgColor || '#e23b3b';
      var ctaTextColor = cfg.ctaTextColor || '#ffffff';

      var bgHtml = cfg.imageUrl
        ? '<img class="st-mi-bg" src="' + sanitize(cfg.imageUrl) + '" alt="" />'
        : '<div class="st-mi-bg st-mi-no-img"></div>';

      var brandHtml = cfg.brandName
        ? '<div class="st-mi-brand" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.brandName) + '</div>'
        : '';

      var headlineHtml = cfg.headline
        ? '<div class="st-mi-headline" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.headline) + '</div>'
        : '';

      var ctaHtml = cfg.ctaText
        ? '<a class="st-mi-cta" style="background:' + sanitize(ctaBgColor) + ';color:' + sanitize(ctaTextColor) + ';">' + sanitize(cfg.ctaText) + '</a>'
        : '';

      root.innerHTML =
        '<div class="st-mi-wrap">'
        + bgHtml
        + '<div class="st-mi-overlay" style="background:' + sanitize(overlayColor) + ';"></div>'
        + '<div class="st-mi-content">'
          + brandHtml
          + headlineHtml
          + ctaHtml
        + '</div>'
        + '</div>';
    }
  `,
}
