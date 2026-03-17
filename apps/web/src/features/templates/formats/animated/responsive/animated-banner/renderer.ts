import type { RendererExport } from '../../../_shared/types'

export const animatedBannerRenderer: RendererExport = {
  functionName: 'renderAnimatedBanner',
  css: `
    .ab-container {
      width: 100%; height: 100%;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      text-align: center; padding: 16px; gap: 8px;
      overflow: hidden;
    }
    .ab-container img { max-width: 60%; max-height: 30%; object-fit: contain; }
    .ab-container h1 { font-size: clamp(14px, 3vw, 24px); font-weight: 700; line-height: 1.2; word-break: break-word; }
    .ab-container p { font-size: clamp(11px, 2vw, 14px); line-height: 1.4; word-break: break-word; }

    /* Animation keyframes */
    @keyframes ab-fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes ab-slide-in {
      from { opacity: 0; transform: translateX(-30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes ab-bounce-in {
      0% { opacity: 0; transform: scale(0.3); }
      50% { opacity: 1; transform: scale(1.05); }
      70% { transform: scale(0.95); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes ab-zoom-in {
      from { opacity: 0; transform: scale(0); }
      to { opacity: 1; transform: scale(1); }
    }
    .ab-animated {
      opacity: 0;
      animation-fill-mode: forwards;
      animation-timing-function: ease-out;
    }
  `,
  js: `
    function renderAnimatedBanner(root, cfg) {
      var imgHtml = cfg.imageUrl ? '<img class="ab-animated" src="' + sanitize(cfg.imageUrl) + '" alt="Creative image" />' : '';
      root.innerHTML =
        '<div class="ab-container" style="background-color:' + sanitize(cfg.backgroundColor || '#ffffff') + ';color:' + sanitize(cfg.textColor || '#000000') + '">'
        + imgHtml
        + '<h1 class="ab-animated">' + sanitize(cfg.headline || '') + '</h1>'
        + '<p class="ab-animated">' + sanitize(cfg.bodyText || '') + '</p>'
        + '<a class="sb-cta ab-animated" href="' + sanitize(cfg.ctaUrl || '#') + '" target="_blank" rel="noopener" style="background-color:' + sanitize(cfg.ctaColor || '#2563eb') + '">' + sanitize(cfg.ctaText || 'Learn More') + '</a>'
        + '</div>';

      var animatedEls = root.querySelectorAll('.ab-animated');
      for (var i = 0; i < animatedEls.length; i++) {
        animatedEls[i].style.animationName = 'ab-' + (cfg.animationType || 'fade') + '-in';
        animatedEls[i].style.animationDuration = '0.6s';
        animatedEls[i].style.animationDelay = (i * 0.3) + 's';
      }
    }
  `,
}
