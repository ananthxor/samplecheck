import type { FormatDefinition } from './types'

/**
 * Composes a self-contained HTML document from a format's renderer CSS/JS and config.
 * Replaces the monolithic generatePreviewHtml() in renderer.ts.
 */
export function buildPreviewHtml(
  format: FormatDefinition,
  config: Record<string, unknown>
): string {
  const configJson = JSON.stringify(config).replace(/<\//g, '<\\/')
  if (!format.renderer) {
    return `<!DOCTYPE html><html><body><p>No renderer available for this format.</p></body></html>`
  }
  const { css, js, functionName } = format.renderer as Extract<typeof format.renderer, { css: string }>

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      width: 100%;
      height: 100vh;
    }
    #creative-root {
      width: 100%;
      height: 100%;
      position: relative;
    }

    /* Shared CTA style */
    .sb-cta {
      display: inline-block; padding: 8px 20px;
      color: #fff; text-decoration: none;
      border-radius: 6px; font-weight: 600;
      font-size: clamp(11px, 2vw, 14px);
      cursor: pointer; margin-top: 4px;
    }

    /* Placeholder */
    .placeholder {
      width: 100%; height: 100%;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      color: #9ca3af; font-size: 14px; text-align: center;
      background: #f9fafb;
    }
    .placeholder span { font-size: 32px; margin-bottom: 8px; }

    /* Format-specific CSS */
    ${css}
  </style>
</head>
<body>
  <div id="creative-root"></div>
  <script>
    var currentConfig = ${configJson};
    var frameTimer = null;
    var dwellTimer = null;

    function sanitize(str) {
      if (typeof str !== 'string') return '';
      return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }

    /**
     * ScrollToday Tracking Helper
     * Fires a 1x1 pixel beacon to the track-event endpoint.
     */
    window.stTrack = function(eventType, extra) {
      // These params are injected into currentConfig during the serve-ad process
      // In preview mode, some may be missing; we fail gracefully.
      var rid = currentConfig.requestId || '';
      var cid = currentConfig.id || '';
      var aid = currentConfig.advertiserId || '';
      var cmpid = currentConfig.campaignId || '';
      
      var url = '/track-event?type=' + encodeURIComponent(eventType) +
                '&rid=' + encodeURIComponent(rid) +
                '&cid=' + encodeURIComponent(cid) +
                '&aid=' + encodeURIComponent(aid) +
                '&cmpid=' + encodeURIComponent(cmpid) +
                '&cb=' + Date.now();

      if (extra && typeof extra === 'object') {
        for (var key in extra) {
          if (extra.hasOwnProperty(key)) {
            url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(extra[key]);
          }
        }
      }

      var img = new Image();
      img.src = url;
    };

    /**
     * Dwell Time Heartbeat
     * Every 5 seconds of active presence, fire an engagement event.
     */
    function startDwellHeartbeat() {
      if (dwellTimer) clearInterval(dwellTimer);
      dwellTimer = setInterval(function() {
        if (!document.hidden) {
          window.stTrack('presence', { dwell_time_ms: 5000 });
        }
      }, 5000);
    }

    function renderPlaceholder(root, cfg) {
      root.innerHTML =
        '<div class="placeholder">'
        + '<span>&#9881;</span>'
        + '<div>Preview for <strong>' + sanitize(cfg.type || 'unknown') + '</strong></div>'
        + '</div>';
    }

    ${js}

    function render(cfg) {
      var root = document.getElementById('creative-root');
      if (!root) return;
      if (frameTimer) { clearInterval(frameTimer); frameTimer = null; }
      if (dwellTimer) { clearInterval(dwellTimer); dwellTimer = null; }
      
      // Cleanup video elements (prevent ghost audio on re-render)
      var videos = root.querySelectorAll('video');
      for (var v = 0; v < videos.length; v++) {
        videos[v].pause();
        videos[v].removeAttribute('src');
        videos[v].load();
      }

      // GLOBAL CLICK LISTENER: Intercepts all clicks in the creative
      root.onclick = function(e) {
        var target = e.target.closest('a') || (e.target.classList.contains('sb-cta') ? e.target : null);
        if (target) {
          window.stTrack('click');
        }
      };
      
      if (typeof ${functionName} === 'function') {
        ${functionName}(root, cfg);
        startDwellHeartbeat();
      } else {
        renderPlaceholder(root, cfg);
      }
    }

    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'CONFIG_UPDATE') {
        currentConfig = event.data.payload;
        render(currentConfig);
      }
    });

    render(currentConfig);

    // Initial presence hit so Avg Dwell is not 0 for short views
    window.stTrack('presence', { dwell_time_ms: 1000 });
  </script>
</body>
</html>`
}
