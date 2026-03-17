import type { RendererExport } from '../../_shared/types'

/**
 * Square renderer — 250×250 standard display banner.
 *
 * Layout (same pattern as inline-rectangle):
 *   - Full background image with dark gradient overlay
 *   - Logo image (top-left)
 *   - Brand name text
 *   - Headline / tagline text
 *   - CTA button (rounded pill)
 */
export const squareRenderer: RendererExport = {
  functionName: 'renderSquare',
  css: `
    .st-sq-wrap {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      background: #000; display: flex; flex-direction: column;
    }
    .st-sq-bg {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      object-fit: cover; display: block;
    }
    .st-sq-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 50%, rgba(0,0,0,0.9) 100%);
    }
    .st-sq-content {
      position: relative; z-index: 2; display: flex; flex-direction: column;
      align-items: center; justify-content: flex-end;
      width: 100%; height: 100%; padding: 12px 14px 14px; text-align: center;
      gap: 3px;
    }
    .st-sq-logo {
      max-width: 36px; max-height: 36px; object-fit: contain;
      margin-bottom: 2px;
    }
    .st-sq-brand {
      font-size: clamp(15px, 5vw, 22px); font-weight: 300;
      letter-spacing: 0.2em; text-transform: uppercase;
      margin-bottom: 1px;
    }
    .st-sq-headline {
      font-size: clamp(10px, 3vw, 13px); font-weight: 400;
      line-height: 1.3; margin: 0; padding: 0 4px;
    }
    .st-sq-cta {
      display: inline-block; margin-top: 6px;
      padding: 6px 20px; border-radius: 20px;
      font-size: clamp(10px, 2.8vw, 12px); font-weight: 600;
      text-decoration: none; cursor: pointer;
      text-transform: uppercase; letter-spacing: 0.04em;
      transition: opacity 0.2s;
      border: none;
    }
    .st-sq-cta:hover { opacity: 0.85; }
    .st-sq-no-img {
      width: 100%; height: 100%;
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      display: flex; align-items: center; justify-content: center;
      color: rgba(255,255,255,0.3); font-size: 11px;
    }
  `,
  js: `
    function renderSquare(root, cfg) {
      var textColor = cfg.textColor || '#ffffff';
      var ctaBg = cfg.ctaBgColor || '#000000';
      var ctaTextColor = cfg.ctaTextColor || '#ffffff';

      var bgHtml = cfg.imageUrl
        ? '<img class="st-sq-bg" src="' + sanitize(cfg.imageUrl) + '" alt="" />'
        : '<div class="st-sq-bg st-sq-no-img">No image</div>';

      var logoHtml = cfg.logoUrl
        ? '<img class="st-sq-logo" src="' + sanitize(cfg.logoUrl) + '" alt="" />'
        : '';

      var brandHtml = cfg.brandName
        ? '<div class="st-sq-brand" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.brandName) + '</div>'
        : '';

      var ctaHtml = cfg.ctaText
        ? '<a class="st-sq-cta" style="background:' + sanitize(ctaBg) + ';color:' + sanitize(ctaTextColor) + ';" href="' + sanitize(cfg.ctaUrl || '#') + '" target="_blank" rel="noopener">' + sanitize(cfg.ctaText) + '</a>'
        : '';

      root.innerHTML =
        '<div class="st-sq-wrap">'
        + bgHtml
        + '<div class="st-sq-overlay"></div>'
        + '<div class="st-sq-content">'
          + logoHtml
          + brandHtml
          + '<p class="st-sq-headline" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.headline || '') + '</p>'
          + ctaHtml
        + '</div>'
        + '</div>';
    }
  `,
}
