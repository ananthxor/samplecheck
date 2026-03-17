import type { RendererExport } from '../../_shared/types'

export const videoEndcardRenderer: RendererExport = {
  functionName: 'renderVideoEndcard',
  css: `
    .ve-container {
      position: relative; width: 100%; height: 100%; overflow: hidden;
    }
    .ve-video-layer {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      transition: opacity 0.5s ease; z-index: 2;
    }
    .ve-endcard {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; padding: 16px; gap: 8px;
      opacity: 0; pointer-events: none; transition: opacity 0.5s ease; z-index: 1;
    }
    .ve-endcard.active { opacity: 1; pointer-events: auto; }
    .ve-endcard img { max-width: 60%; max-height: 30%; object-fit: contain; }
    .ve-endcard h1 { font-size: clamp(14px, 3vw, 24px); font-weight: 700; line-height: 1.2; word-break: break-word; }
    .ve-endcard p { font-size: clamp(11px, 2vw, 14px); line-height: 1.4; word-break: break-word; }
    .ve-play-overlay {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 60px; height: 60px; background: rgba(0,0,0,0.6); border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 24px; cursor: pointer; z-index: 3;
    }
    .ve-play-overlay:hover { background: rgba(0,0,0,0.8); }
    .ve-no-video {
      width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
      background: #1e293b; color: #94a3b8; font-size: 13px;
    }
  `,
  js: `
    function renderVideoEndcard(root, cfg) {
      var videoHtml = '';
      if (!cfg.videoUrl) {
        videoHtml = '<div class="ve-no-video">No video URL</div>';
      } else {
        var autoplayAttr = cfg.autoplay ? ' autoplay muted' : '';
        videoHtml =
          '<video id="ve-player" playsinline' + autoplayAttr
          + ' style="width:100%;height:100%;object-fit:contain"'
          + ' src="' + sanitize(cfg.videoUrl) + '"></video>';
        if (!cfg.autoplay) {
          videoHtml += '<div id="ve-play" class="ve-play-overlay">&#9654;</div>';
        }
      }

      var ecImgHtml = cfg.endcardImageUrl
        ? '<img src="' + sanitize(cfg.endcardImageUrl) + '" alt="End card" />'
        : '';

      root.innerHTML =
        '<div class="ve-container">'
        + '<div id="ve-video" class="ve-video-layer">' + videoHtml + '</div>'
        + '<div id="ve-endcard" class="ve-endcard">'
          + ecImgHtml
          + '<h1>' + sanitize(cfg.endcardHeadline || '') + '</h1>'
          + '<p>' + sanitize(cfg.endcardBodyText || '') + '</p>'
          + '<a class="sb-cta" href="' + sanitize(cfg.ctaUrl || '#') + '" target="_blank" rel="noopener" style="background-color:#2563eb">' + sanitize(cfg.ctaText || 'Learn More') + '</a>'
        + '</div>'
        + '</div>';

      var player = document.getElementById('ve-player');
      var videoLayer = document.getElementById('ve-video');
      var endcard = document.getElementById('ve-endcard');

      if (player && videoLayer && endcard) {
        var quartiles = { q1: false, q2: false, q3: false };
        
        player.addEventListener('play', function() {
          if (typeof window.ScrollTodaySDK !== 'undefined') window.ScrollTodaySDK.track('video_play');
          });
          player.addEventListener('pause', function() {
          if (!player.ended && typeof window.ScrollTodaySDK !== 'undefined') window.ScrollTodaySDK.track('video_pause');
          });
          player.addEventListener('timeupdate', function() {
          if (typeof window.ScrollTodaySDK === 'undefined' || !player.duration) return;
          var p = player.currentTime / player.duration;
          if (p >= 0.25 && !quartiles.q1) { window.ScrollTodaySDK.track('video_quartile', { quartile: 25 }); quartiles.q1 = true; }
          if (p >= 0.50 && !quartiles.q2) { window.ScrollTodaySDK.track('video_quartile', { quartile: 50 }); quartiles.q2 = true; }
          if (p >= 0.75 && !quartiles.q3) { window.ScrollTodaySDK.track('video_quartile', { quartile: 75 }); quartiles.q3 = true; }
          });
          player.addEventListener('ended', function() {
          endcard.style.display = 'flex';
          if (typeof window.ScrollTodaySDK !== 'undefined') window.ScrollTodaySDK.track('video_complete');
          videoLayer.style.opacity = '0';
          videoLayer.style.pointerEvents = 'none';
          endcard.classList.add('active');
        });
      }

      if (!cfg.autoplay && player) {
        var playBtn = document.getElementById('ve-play');
        if (playBtn) {
          playBtn.addEventListener('click', function() {
            player.play();
            playBtn.style.display = 'none';
          });
        }
      }
    }
  `,
}
