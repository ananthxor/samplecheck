import type { RendererExport } from '../../_shared/types'

/**
 * Half Page renderer — 300×600 tall vertical ad.
 *
 * Layout (matches reference — vertical stack, solid bg):
 *   - Solid background color filling entire ad
 *   - Logo image (top-left)
 *   - Headline text (center area, large multi-line)
 *   - CTA as bold letter-spaced text (below headline)
 *   - All elements optional — empty fields = solid color ad
 */
export const halfPageRenderer: RendererExport = {
  functionName: 'renderHalfPage',
  css: `
    .st-hp-wrap {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex; flex-direction: column;
    }
    .st-hp-logo {
      position: absolute; top: 20px; left: 20px;
      max-width: 100px; max-height: 36px; object-fit: contain;
      z-index: 2;
    }
    .st-hp-content {
      position: relative; z-index: 2;
      display: flex; flex-direction: column; align-items: flex-start;
      justify-content: center;
      flex: 1; padding: 24px 24px 32px;
      gap: 12px;
    }
    .st-hp-headline {
      font-size: 36px; font-weight: 300;
      line-height: 1.15; text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .st-hp-headline strong { font-weight: 800; }
    .st-hp-cta {
      display: inline-block; margin-top: 8px;
      font-size: 13px; font-weight: 700;
      text-decoration: none; cursor: pointer;
      text-transform: uppercase; letter-spacing: 0.25em;
      transition: opacity 0.2s; border: none;
      background: none; padding: 0;
    }
    .st-hp-cta:hover { opacity: 0.75; }
  `,
  js: `
    function renderHalfPage(root, cfg) {
      var bgColor = cfg.bgColor || '#4caf50';
      var textColor = cfg.textColor || '#ffffff';
      var ctaColor = cfg.ctaColor || '#ffffff';

      var logoHtml = cfg.logoUrl
        ? '<img class="st-hp-logo" src="' + sanitize(cfg.logoUrl) + '" alt="" />'
        : '';

      var headlineHtml = cfg.headline
        ? '<div class="st-hp-headline" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.headline) + '</div>'
        : '';

      var ctaHtml = cfg.ctaText
        ? '<a class="st-hp-cta" style="color:' + sanitize(ctaColor) + ';">' + sanitize(cfg.ctaText) + '</a>'
        : '';

      root.innerHTML =
        '<div class="st-hp-wrap" style="background:' + sanitize(bgColor) + ';">'
        + logoHtml
        + '<div class="st-hp-content">'
          + headlineHtml
          + ctaHtml
        + '</div>'
        + '</div>';
    }
  `,
}
