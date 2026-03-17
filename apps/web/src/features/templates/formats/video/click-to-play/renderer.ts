import type { RendererExport } from '../../_shared/types'

export const clickToPlayRenderer: RendererExport = {
  functionName: 'renderClickToPlay',
  css: `
    .ctp-container {
      position: relative; width: 100%; height: 100%; overflow: hidden;
    }
    .ctp-thumbnail {
      position: relative; width: 100%; height: 100%; cursor: pointer;
    }
    .ctp-thumbnail img { width: 100%; height: 100%; object-fit: cover; }
    .ctp-thumb-placeholder {
      width: 100%; height: 100%; background: #1e293b;
      display: flex; align-items: center; justify-content: center;
      color: #94a3b8; font-size: 13px;
    }
    .ctp-play-btn {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 64px; height: 64px; background: rgba(0,0,0,0.6); border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 26px; transition: background 0.2s;
    }
    .ctp-thumbnail:hover .ctp-play-btn { background: rgba(0,0,0,0.8); }
    .ctp-headline {
      position: absolute; bottom: 16px; left: 16px; right: 16px;
      color: #fff; font-size: clamp(14px, 3vw, 22px); font-weight: 700;
      text-shadow: 0 1px 4px rgba(0,0,0,0.5); line-height: 1.2;
    }
    .ctp-player-wrap { width: 100%; height: 100%; }
  `,
  js: `
    function renderClickToPlay(root, cfg) {
      var thumbContent = cfg.thumbnailImageUrl
        ? '<img src="' + sanitize(cfg.thumbnailImageUrl) + '" alt="Video thumbnail" />'
        : '<div class="ctp-thumb-placeholder">No thumbnail</div>';

      var headlineHtml = cfg.headline
        ? '<h1 class="ctp-headline">' + sanitize(cfg.headline) + '</h1>'
        : '';

      var ctaHtml = cfg.ctaText
        ? '<a class="sb-cta" href="' + sanitize(cfg.ctaUrl || '#') + '" target="_blank" rel="noopener"'
          + ' style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);background-color:'
          + sanitize(cfg.ctaColor || '#2563eb') + ';z-index:10">'
          + sanitize(cfg.ctaText) + '</a>'
        : '';

      root.innerHTML =
        '<div class="ctp-container">'
        + '<div id="ctp-thumb" class="ctp-thumbnail">'
          + thumbContent
          + '<div class="ctp-play-btn">&#9654;</div>'
          + headlineHtml
        + '</div>'
        + '<div id="ctp-player" class="ctp-player-wrap" style="display:none">'
          + '<video id="ctp-video" playsinline controls'
          + ' src="' + sanitize(cfg.videoUrl || '') + '"'
          + ' style="width:100%;height:100%;object-fit:contain"></video>'
        + '</div>'
        + ctaHtml
        + '</div>';

      var thumb = document.getElementById('ctp-thumb');
      var playerWrap = document.getElementById('ctp-player');
      var video = document.getElementById('ctp-video');

      if (thumb && playerWrap && video) {
        thumb.addEventListener('click', function() {
          thumb.style.display = 'none';
          playerWrap.style.display = 'block';
          video.play();
        });
      }
    }
  `,
}
