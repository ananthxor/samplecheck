import type { RendererExport } from '../../_shared/types'

/**
 * Skyscraper renderer — 120×600 tall sidebar ad.
 *
 * Layout (very narrow vertical, image-as-background):
 *   - Full-bleed background image covering entire ad
 *   - Dark gradient overlay for text readability
 *   - Headline (top area), CTA button (bottom)
 *   - All text optional — empty fields = pure image ad
 *   - Very narrow (120px) — minimal text overlay
 */
export const skyscraperRenderer: RendererExport = {
  functionName: 'renderSkyscraper',
  css: `
    .st-sk-wrap {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex; flex-direction: column;
    }
    .st-sk-bg {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      object-fit: cover; display: block;
    }
    .st-sk-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    }
    .st-sk-content {
      position: relative; z-index: 2; display: flex; flex-direction: column;
      align-items: center; justify-content: flex-end;
      width: 100%; height: 100%; padding: 16px 8px 16px;
      text-align: center; gap: 8px;
    }
    .st-sk-headline {
      font-size: clamp(14px, 12vw, 20px); font-weight: 700;
      line-height: 1.2; word-wrap: break-word;
    }
    .st-sk-cta {
      display: inline-block; margin-top: 4px;
      padding: 8px 14px; border-radius: 4px;
      font-size: clamp(9px, 7vw, 11px); font-weight: 700;
      text-decoration: none; cursor: pointer;
      text-transform: uppercase; letter-spacing: 0.04em;
      transition: opacity 0.2s; border: none;
      white-space: nowrap;
    }
    .st-sk-cta:hover { opacity: 0.85; }
    .st-sk-no-img {
      width: 100%; height: 100%;
      background: linear-gradient(180deg, #1e293b 0%, #334155 100%);
    }
  `,
  js: `
    function renderSkyscraper(root, cfg) {
      var textColor = cfg.textColor || '#ffffff';
      var overlayColor = cfg.overlayColor || 'rgba(0,0,0,0.45)';
      var ctaBgColor = cfg.ctaBgColor || '#e23b3b';
      var ctaTextColor = cfg.ctaTextColor || '#ffffff';

      var bgHtml = cfg.imageUrl
        ? '<img class="st-sk-bg" src="' + sanitize(cfg.imageUrl) + '" alt="" />'
        : '<div class="st-sk-bg st-sk-no-img"></div>';

      var headlineHtml = cfg.headline
        ? '<div class="st-sk-headline" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.headline) + '</div>'
        : '';

      var ctaHtml = cfg.ctaText
        ? '<a class="st-sk-cta" style="background:' + sanitize(ctaBgColor) + ';color:' + sanitize(ctaTextColor) + ';">' + sanitize(cfg.ctaText) + '</a>'
        : '';

      root.innerHTML =
        '<div class="st-sk-wrap">'
        + bgHtml
        + '<div class="st-sk-overlay" style="background:' + sanitize(overlayColor) + ';"></div>'
        + '<div class="st-sk-content">'
          + headlineHtml
          + ctaHtml
        + '</div>'
        + '</div>';
    }
  `,
}
