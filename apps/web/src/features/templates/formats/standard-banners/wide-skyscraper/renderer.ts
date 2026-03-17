import type { RendererExport } from '../../_shared/types'

/**
 * Wide Skyscraper renderer — 160×600 tall sidebar ad.
 *
 * Layout (tall vertical, image-as-background):
 *   - Full-bleed background image covering entire ad
 *   - Dark gradient overlay for text readability
 *   - Brand name (top), Headline (center), CTA button (bottom)
 *   - All text optional — empty fields = pure image ad
 */
export const wideSkyscraperRenderer: RendererExport = {
  functionName: 'renderWideSkyscraper',
  css: `
    .st-ws-wrap {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex; flex-direction: column;
    }
    .st-ws-bg {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      object-fit: cover; display: block;
    }
    .st-ws-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    }
    .st-ws-content {
      position: relative; z-index: 2; display: flex; flex-direction: column;
      align-items: center; justify-content: flex-end;
      width: 100%; height: 100%; padding: 16px 10px 20px;
      text-align: center; gap: 8px;
    }
    .st-ws-brand {
      font-size: clamp(16px, 12vw, 22px); font-weight: 300;
      letter-spacing: 0.2em; text-transform: uppercase;
    }
    .st-ws-headline {
      font-size: clamp(10px, 8vw, 13px); font-weight: 400;
      line-height: 1.3; word-wrap: break-word;
      padding: 0 4px;
    }
    .st-ws-cta {
      display: inline-block; margin-top: 4px;
      padding: 8px 16px; border-radius: 4px;
      font-size: clamp(9px, 7vw, 12px); font-weight: 700;
      text-decoration: none; cursor: pointer;
      text-transform: uppercase; letter-spacing: 0.04em;
      transition: opacity 0.2s; border: none;
      white-space: nowrap;
    }
    .st-ws-cta:hover { opacity: 0.85; }
    .st-ws-no-img {
      width: 100%; height: 100%;
      background: linear-gradient(180deg, #1e293b 0%, #334155 100%);
    }
  `,
  js: `
    function renderWideSkyscraper(root, cfg) {
      var textColor = cfg.textColor || '#ffffff';
      var overlayColor = cfg.overlayColor || 'rgba(0,0,0,0.5)';
      var ctaBgColor = cfg.ctaBgColor || '#e23b3b';
      var ctaTextColor = cfg.ctaTextColor || '#ffffff';

      var bgHtml = cfg.imageUrl
        ? '<img class="st-ws-bg" src="' + sanitize(cfg.imageUrl) + '" alt="" />'
        : '<div class="st-ws-bg st-ws-no-img"></div>';

      var brandHtml = cfg.brandName
        ? '<div class="st-ws-brand" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.brandName) + '</div>'
        : '';

      var headlineHtml = cfg.headline
        ? '<div class="st-ws-headline" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.headline) + '</div>'
        : '';

      var ctaHtml = cfg.ctaText
        ? '<a class="st-ws-cta" style="background:' + sanitize(ctaBgColor) + ';color:' + sanitize(ctaTextColor) + ';">' + sanitize(cfg.ctaText) + '</a>'
        : '';

      root.innerHTML =
        '<div class="st-ws-wrap">'
        + bgHtml
        + '<div class="st-ws-overlay" style="background:' + sanitize(overlayColor) + ';"></div>'
        + '<div class="st-ws-content">'
          + brandHtml
          + headlineHtml
          + ctaHtml
        + '</div>'
        + '</div>';
    }
  `,
}
