import type { RendererExport } from '../../_shared/types'

/**
 * Small Square renderer — 200×200 standard display banner.
 *
 * Layout:
 *   - Background image with dark gradient overlay
 *   - Brand name (uppercase, spaced)
 *   - Headline text
 *   - Subtitle + promo badge (accent-colored)
 *   - Description text
 *   - CTA button (rounded pill)
 */
export const smallSquareRenderer: RendererExport = {
  functionName: 'renderSmallSquare',
  css: `
    .st-ss-wrap {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      background: #000; display: flex; flex-direction: column;
    }
    .st-ss-bg {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      object-fit: cover; display: block;
    }
    .st-ss-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.92) 100%);
    }
    .st-ss-content {
      position: relative; z-index: 2; display: flex; flex-direction: column;
      align-items: center; justify-content: flex-end;
      width: 100%; height: 100%; padding: 8px 10px 10px; text-align: center;
      gap: 2px;
    }
    .st-ss-brand {
      font-size: clamp(14px, 6vw, 20px); font-weight: 300;
      letter-spacing: 0.2em; text-transform: uppercase;
      margin-bottom: 1px;
    }
    .st-ss-headline {
      font-size: clamp(8px, 3vw, 11px); font-weight: 400;
      line-height: 1.25; margin: 0; padding: 0 2px;
    }
    .st-ss-sub {
      font-size: clamp(7px, 2.5vw, 9px); font-weight: 400;
      margin: 0;
    }
    .st-ss-promo {
      display: inline-block; padding: 2px 8px; border-radius: 3px;
      font-size: clamp(8px, 3vw, 11px); font-weight: 700;
      letter-spacing: 0.03em; margin: 2px 0 1px;
      color: #000;
    }
    .st-ss-desc {
      font-size: clamp(7px, 2.5vw, 9px); font-weight: 400;
      margin: 0;
    }
    .st-ss-cta {
      display: inline-block; margin-top: 4px;
      padding: 4px 14px; border-radius: 14px;
      font-size: clamp(8px, 2.5vw, 10px); font-weight: 600;
      text-decoration: none; cursor: pointer;
      text-transform: uppercase; letter-spacing: 0.03em;
      transition: opacity 0.2s;
      border: none;
    }
    .st-ss-cta:hover { opacity: 0.85; }
    .st-ss-no-img {
      width: 100%; height: 100%;
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      display: flex; align-items: center; justify-content: center;
      color: rgba(255,255,255,0.3); font-size: 10px;
    }
  `,
  js: `
    function renderSmallSquare(root, cfg) {
      var textColor = cfg.textColor || '#ffffff';
      var accentColor = cfg.accentColor || '#00d4ff';
      var ctaBg = cfg.ctaBgColor || '#000000';
      var ctaTextColor = cfg.ctaTextColor || '#ffffff';

      var bgHtml = cfg.imageUrl
        ? '<img class="st-ss-bg" src="' + sanitize(cfg.imageUrl) + '" alt="" />'
        : '<div class="st-ss-bg st-ss-no-img">No image</div>';

      var brandHtml = cfg.brandName
        ? '<div class="st-ss-brand" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.brandName) + '</div>'
        : '';

      var headlineHtml = cfg.headline
        ? '<p class="st-ss-headline" style="color:' + sanitize(textColor) + ';opacity:0.9;">' + sanitize(cfg.headline) + '</p>'
        : '';

      var subHtml = cfg.subtitle
        ? '<p class="st-ss-sub" style="color:' + sanitize(textColor) + ';opacity:0.7;">' + sanitize(cfg.subtitle) + '</p>'
        : '';

      var promoHtml = cfg.promoText
        ? '<div class="st-ss-promo" style="background:' + sanitize(accentColor) + ';">' + sanitize(cfg.promoText) + '</div>'
        : '';

      var descHtml = cfg.description
        ? '<p class="st-ss-desc" style="color:' + sanitize(textColor) + ';opacity:0.75;">' + sanitize(cfg.description) + '</p>'
        : '';

      var ctaHtml = cfg.ctaText
        ? '<a class="st-ss-cta" style="background:' + sanitize(ctaBg) + ';color:' + sanitize(ctaTextColor) + ';" href="' + sanitize(cfg.ctaUrl || '#') + '" target="_blank" rel="noopener">' + sanitize(cfg.ctaText) + '</a>'
        : '';

      root.innerHTML =
        '<div class="st-ss-wrap">'
        + bgHtml
        + '<div class="st-ss-overlay"></div>'
        + '<div class="st-ss-content">'
          + brandHtml
          + headlineHtml
          + subHtml
          + promoHtml
          + descHtml
          + ctaHtml
        + '</div>'
        + '</div>';
    }
  `,
}
