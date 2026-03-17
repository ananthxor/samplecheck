import type { RendererExport } from '../../_shared/types'

/**
 * Interstitial renderer — 320×480 mobile fullscreen ad.
 *
 * Layout (matches reference — vertical stack, solid bg + product image):
 *   - Solid background color filling entire ad
 *   - Logo image (top-left)
 *   - Headline text (centered, below logo)
 *   - Product image (centered, large)
 *   - CTA pill button (bottom-center)
 *   - All elements optional — empty fields = solid color ad
 */
export const interstitialRenderer: RendererExport = {
  functionName: 'renderInterstitial',
  css: `
    .st-it-wrap {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex; flex-direction: column; align-items: center;
    }
    .st-it-logo {
      position: absolute; top: 16px; left: 16px;
      max-width: 64px; max-height: 40px; object-fit: contain;
      z-index: 2;
    }
    .st-it-headline {
      margin-top: 56px;
      font-size: 22px; font-weight: 400;
      text-align: center; line-height: 1.3;
      padding: 0 24px; z-index: 2;
    }
    .st-it-headline strong { font-weight: 700; }
    .st-it-product {
      flex: 1; display: flex; align-items: center; justify-content: center;
      padding: 8px 20px; z-index: 2;
    }
    .st-it-product img {
      max-width: 100%; max-height: 100%; object-fit: contain;
    }
    .st-it-cta {
      display: inline-block; margin-bottom: 32px;
      padding: 12px 40px; border-radius: 999px;
      font-size: 15px; font-weight: 600;
      text-decoration: none; cursor: pointer;
      letter-spacing: 0.02em;
      transition: opacity 0.2s; border: none;
      white-space: nowrap; z-index: 2;
    }
    .st-it-cta:hover { opacity: 0.85; }
  `,
  js: `
    function renderInterstitial(root, cfg) {
      var bgColor = cfg.bgColor || '#d32f2f';
      var textColor = cfg.textColor || '#ffffff';
      var ctaBgColor = cfg.ctaBgColor || '#ffffff';
      var ctaTextColor = cfg.ctaTextColor || '#d32f2f';

      var logoHtml = cfg.logoUrl
        ? '<img class="st-it-logo" src="' + sanitize(cfg.logoUrl) + '" alt="" />'
        : '';

      var headlineHtml = cfg.headline
        ? '<div class="st-it-headline" style="color:' + sanitize(textColor) + ';">' + sanitize(cfg.headline) + '</div>'
        : '';

      var productHtml = cfg.productImageUrl
        ? '<div class="st-it-product"><img src="' + sanitize(cfg.productImageUrl) + '" alt="" /></div>'
        : '<div class="st-it-product"></div>';

      var ctaHtml = cfg.ctaText
        ? '<a class="st-it-cta" style="background:' + sanitize(ctaBgColor) + ';color:' + sanitize(ctaTextColor) + ';">' + sanitize(cfg.ctaText) + '</a>'
        : '';

      root.innerHTML =
        '<div class="st-it-wrap" style="background:' + sanitize(bgColor) + ';">'
        + logoHtml
        + headlineHtml
        + productHtml
        + ctaHtml
        + '</div>';
    }
  `,
}
