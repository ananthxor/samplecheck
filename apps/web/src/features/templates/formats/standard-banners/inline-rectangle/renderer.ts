import type { RendererExport } from '../../_shared/types'

/**
 * Inline Rectangle renderer — 300×250 standard display banner.
 *
 * Layout (top to bottom):
 *   - Background image with dark gradient overlay
 *   - Brand name / headline
 *   - Subtitle text
 *   - Highlighted promo badge (accent-colored)
 *   - Description text
 *   - CTA button
 */
export const inlineRectangleRenderer: RendererExport = {
  functionName: 'renderInlineRectangle',
  css: `
    .st-ir-wrap {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      background: #000; display: flex; flex-direction: column;
    }
    .st-ir-bg {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      object-fit: cover; display: block;
    }
    .st-ir-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 55%, rgba(0,0,0,0.92) 100%);
    }
    .st-ir-content {
      position: relative; z-index: 2; display: flex; flex-direction: column;
      align-items: center; justify-content: flex-end;
      width: 100%; height: 100%; padding: 14px 16px 16px; text-align: center;
      gap: 4px;
    }
    .st-ir-brand {
      font-size: clamp(18px, 5vw, 26px); font-weight: 300;
      letter-spacing: 0.25em; text-transform: uppercase;
      margin-bottom: 2px;
    }
    .st-ir-headline {
      font-size: clamp(11px, 3vw, 14px); font-weight: 400;
      line-height: 1.3; margin: 0;
    }
    .st-ir-sub {
      font-size: clamp(10px, 2.5vw, 12px); font-weight: 400;
      margin: 0;
    }
    .st-ir-promo {
      display: inline-block; padding: 4px 14px; border-radius: 4px;
      font-size: clamp(12px, 3vw, 15px); font-weight: 700;
      letter-spacing: 0.04em; margin: 4px 0 2px;
      color: #000;
    }
    .st-ir-desc {
      font-size: clamp(10px, 2.5vw, 12px); font-weight: 400;
      margin: 0;
    }
    .st-ir-cta {
      display: inline-block; margin-top: 6px;
      padding: 7px 24px; border-radius: 20px;
      font-size: clamp(11px, 2.8vw, 13px); font-weight: 600;
      text-decoration: none; cursor: pointer;
      transition: opacity 0.2s;
      border: none;
    }
    .st-ir-cta:hover { opacity: 0.85; }
    .st-ir-no-img {
      width: 100%; height: 100%;
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      display: flex; align-items: center; justify-content: center;
      color: rgba(255,255,255,0.3); font-size: 12px;
    }
  `,
  js: `
    function renderInlineRectangle(root, cfg) {
      var textColor = cfg.textColor || '#ffffff';
      var accentColor = cfg.accentColor || '#00d4ff';
      var ctaBg = cfg.ctaColor || '#000000';
      var ctaTextColor = cfg.ctaTextColor || '#ffffff';

      var bgHtml = cfg.imageUrl
        ? '<img class="st-ir-bg" src="' + sanitize(cfg.imageUrl) + '" alt="" />'
        : '<div class="st-ir-bg st-ir-no-img">No image</div>';

      var promoHtml = cfg.promoText
        ? '<div class="st-ir-promo" style="background:' + sanitize(accentColor) + ';">' + sanitize(cfg.promoText) + '</div>'
        : '';

      var subHtml = cfg.subtitle
        ? '<p class="st-ir-sub" style="color:' + sanitize(textColor) + ';opacity:0.7;">' + sanitize(cfg.subtitle) + '</p>'
        : '';

      var descHtml = cfg.description
        ? '<p class="st-ir-desc" style="color:' + sanitize(textColor) + ';opacity:0.75;">' + sanitize(cfg.description) + '</p>'
        : '';

      var ctaHtml = cfg.ctaText
        ? '<a class="st-ir-cta" style="background:' + sanitize(ctaBg) + ';color:' + sanitize(ctaTextColor) + ';" href="' + sanitize(cfg.ctaUrl || '#') + '" target="_blank" rel="noopener">' + sanitize(cfg.ctaText) + '</a>'
        : '';

      root.innerHTML =
        '<div class="st-ir-wrap">'
        + bgHtml
        + '<div class="st-ir-overlay"></div>'
        + '<div class="st-ir-content">'
          + '<div class="st-ir-brand" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.brandName || '') + '</div>'
          + '<p class="st-ir-headline" style="color:' + sanitize(textColor) + ';opacity:0.9;">' + sanitize(cfg.headline || '') + '</p>'
          + subHtml
          + promoHtml
          + descHtml
          + ctaHtml
        + '</div>'
        + '</div>';
    }
  `,
}
