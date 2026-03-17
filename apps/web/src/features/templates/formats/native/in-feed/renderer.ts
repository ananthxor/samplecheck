import type { RendererExport } from '../../_shared/types'

export const inFeedRenderer: RendererExport = {
  functionName: 'renderInFeed',
  css: `
    .if-card {
      width: 100%; height: 100%;
      display: flex; flex-direction: column;
      background: #fff; overflow: hidden;
      position: relative;
    }
    .if-sponsor {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; font-size: 12px; color: #6b7280;
    }
    .if-sponsor img {
      width: 24px; height: 24px; border-radius: 50%; object-fit: cover;
    }
    .if-image {
      width: 100%; flex: 1; min-height: 0;
      object-fit: cover;
    }
    .if-body { padding: 12px 16px; }
    .if-body h2 { font-size: 16px; font-weight: 600; line-height: 1.3; color: #111827; }
    .if-body p { font-size: 13px; line-height: 1.4; color: #6b7280; margin-top: 4px; }
    .if-cta {
      display: inline-block; margin-top: 8px;
      color: #2563eb; font-weight: 600; font-size: 13px;
      text-decoration: none; cursor: pointer;
    }
    .if-cta:hover { text-decoration: underline; }
    .if-badge {
      position: absolute; top: 8px; right: 8px;
      background: rgba(0,0,0,0.6); color: #fff;
      font-size: 10px; padding: 2px 6px; border-radius: 3px;
      text-transform: uppercase; letter-spacing: 0.5px; z-index: 2;
    }
  `,
  js: `
    function renderInFeed(root, cfg) {
      var sponsorHtml = '';
      if (cfg.sponsorName || cfg.sponsorLogoUrl) {
        var logoHtml = cfg.sponsorLogoUrl
          ? '<img src="' + sanitize(cfg.sponsorLogoUrl) + '" alt="Sponsor logo" />'
          : '';
        sponsorHtml = '<div class="if-sponsor">' + logoHtml + '<span>Sponsored by ' + sanitize(cfg.sponsorName || '') + '</span></div>';
      }

      var imgHtml = cfg.imageUrl
        ? '<img class="if-image" src="' + sanitize(cfg.imageUrl) + '" alt="Content image" />'
        : '';

      root.innerHTML =
        '<div class="if-card">'
        + '<div class="if-badge">Sponsored</div>'
        + sponsorHtml + imgHtml
        + '<div class="if-body">'
        + '<h2>' + sanitize(cfg.headline || '') + '</h2>'
        + '<p>' + sanitize(cfg.bodyText || '') + '</p>'
        + '<a class="if-cta" href="' + sanitize(cfg.ctaUrl || '#') + '" target="_blank" rel="noopener">' + sanitize(cfg.ctaText || 'Read More') + '</a>'
        + '</div></div>';
    }
  `,
}
