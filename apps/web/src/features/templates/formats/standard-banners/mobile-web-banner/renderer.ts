import type { RendererExport } from '../../_shared/types'

/**
 * Mobile Web Banner renderer — 340×180 mobile-friendly banner.
 *
 * Layout (compact, image-as-background):
 *   - Full-bleed background image covering entire ad
 *   - Semi-transparent overlay for text readability
 *   - Brand name (top-left), Headline (below), CTA button (bottom)
 *   - All text optional — empty fields = pure image ad
 */
export const mobileWebBannerRenderer: RendererExport = {
  functionName: 'renderMobileWebBanner',
  css: `
    .st-mw-wrap {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex; flex-direction: column;
    }
    .st-mw-bg {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      object-fit: cover; display: block;
    }
    .st-mw-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    }
    .st-mw-content {
      position: relative; z-index: 2; display: flex; flex-direction: column;
      justify-content: flex-end;
      width: 100%; height: 100%; padding: 16px 18px;
    }
    .st-mw-brand {
      font-size: clamp(20px, 7vw, 30px); font-weight: 700;
      line-height: 1.1;
    }
    .st-mw-headline {
      font-size: clamp(10px, 3vw, 13px); font-weight: 400;
      opacity: 0.9; margin-top: 2px;
    }
    .st-mw-cta {
      display: inline-block; margin-top: 10px;
      padding: 6px 18px; border-radius: 4px; width: fit-content;
      font-size: clamp(9px, 3vw, 11px); font-weight: 700;
      text-decoration: none; cursor: pointer;
      text-transform: uppercase; letter-spacing: 0.04em;
      transition: opacity 0.2s; border: none;
    }
    .st-mw-cta:hover { opacity: 0.85; }
    .st-mw-no-img {
      width: 100%; height: 100%;
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    }
  `,
  js: `
    function renderMobileWebBanner(root, cfg) {
      var textColor = cfg.textColor || '#ffffff';
      var overlayColor = cfg.overlayColor || 'rgba(0,0,0,0.45)';
      var ctaBgColor = cfg.ctaBgColor || '#e23b3b';
      var ctaTextColor = cfg.ctaTextColor || '#ffffff';

      var bgHtml = cfg.imageUrl
        ? '<img class="st-mw-bg" src="' + sanitize(cfg.imageUrl) + '" alt="" />'
        : '<div class="st-mw-bg st-mw-no-img"></div>';

      var brandHtml = cfg.brandName
        ? '<div class="st-mw-brand" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.brandName) + '</div>'
        : '';

      var headlineHtml = cfg.headline
        ? '<div class="st-mw-headline" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.headline) + '</div>'
        : '';

      var ctaHtml = cfg.ctaText
        ? '<a class="st-mw-cta" style="background:' + sanitize(ctaBgColor) + ';color:' + sanitize(ctaTextColor) + ';">' + sanitize(cfg.ctaText) + '</a>'
        : '';

      root.innerHTML =
        '<div class="st-mw-wrap">'
        + bgHtml
        + '<div class="st-mw-overlay" style="background:' + sanitize(overlayColor) + ';"></div>'
        + '<div class="st-mw-content">'
          + brandHtml
          + headlineHtml
          + ctaHtml
        + '</div>'
        + '</div>';
    }
  `,
}
