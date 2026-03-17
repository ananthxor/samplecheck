/**
 * ScrollToday Ad Tag Bundler
 * 
 * Generates self-contained HTML/JS payloads for ad creatives.
 * Injects the Telemetry Engine, CSS, and format-specific JS.
 */

// We inject a pre-compiled (or plain JS) string of the telemetry engine
// so it can run securely inside the isolated ad tag environment without dependencies.
export const TELEMETRY_SCRIPT = `
  class Telemetry {
    constructor(config) {
      this.config = config;
      this.requestId = config.requestId || 
        (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2) + Date.now().toString(36));
      this.dwellTimer = null;
      this.viewabilityTimer = null;
      this.hasTrackedImpression = false;
      this.hasTrackedViewable = false;
    }

    track(eventType, extraData) {
      if (!this.config.trackUrl || !this.config.creativeId || !this.config.advertiserId) {
        return;
      }

      var url = this.config.trackUrl + '?type=' + encodeURIComponent(eventType) +
                '&cid=' + encodeURIComponent(this.config.creativeId) +
                '&aid=' + encodeURIComponent(this.config.advertiserId) +
                '&rid=' + encodeURIComponent(this.requestId) +
                '&cb=' + Date.now();

      if (this.config.campaignId) {
        url += '&cmpid=' + encodeURIComponent(this.config.campaignId);
      }

      if (extraData) {
        for (var key in extraData) {
          if (Object.prototype.hasOwnProperty.call(extraData, key)) {
            url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(String(extraData[key]));
          }
        }
      }

      try {
        new Image().src = url;
      } catch (e) {}
    }

    initStandardTracking() {
      if (!this.hasTrackedImpression) {
        this.track('impression_served');
        this.hasTrackedImpression = true;
        this.track('presence', { dwell_time_ms: 1000 });
      }
      this.startDwellHeartbeat();
      this.startViewabilityMonitor();
    }

    startDwellHeartbeat() {
      if (this.dwellTimer) clearInterval(this.dwellTimer);
      this.dwellTimer = setInterval(() => {
        if (!document.hidden) {
          this.track('presence', { dwell_time_ms: 5000 });
        }
      }, 5000);
    }

    startViewabilityMonitor() {
      if (this.hasTrackedViewable) return;
      if (typeof IntersectionObserver === 'undefined') return;

      var viewTimer = null;
      var observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (!viewTimer) {
                viewTimer = setTimeout(() => {
                  if (!this.hasTrackedViewable) {
                    this.track('impression_viewable');
                    this.hasTrackedViewable = true;
                    observer.disconnect();
                  }
                }, 1000);
              }
            } else {
              if (viewTimer) {
                clearTimeout(viewTimer);
                viewTimer = null;
              }
            }
          });
        },
        { threshold: 0.5 }
      );

      var root = document.getElementById('creative-root') || document.body;
      if (root) observer.observe(root);
    }

    destroy() {
      if (this.dwellTimer) clearInterval(this.dwellTimer);
      if (this.viewabilityTimer) clearTimeout(this.viewabilityTimer);
    }
  }

  // Expose to global scope for formats to use
  window.ScrollTodaySDK = {
    Telemetry: Telemetry,
    // Provide a global instance placeholder. The serve-ad or editor will initialize this.
    instance: null,
    track: function(type, extra) {
      if (window.ScrollTodaySDK.instance) {
        window.ScrollTodaySDK.instance.track(type, extra);
      }
    }
  };
`;

export interface EngagementDef {
  id: string
  name: string
  description: string
  /** DOM event name, e.g. "click", "mousemove" */
  event?: string
  /** CSS selector scoped to creative root; omit to attach to root */
  selector?: string
  /** Only fire when e.target.closest(targetSelector) matches */
  targetSelector?: string
  /** Fire only once per creative load */
  once?: boolean
}

export interface BundlerOptions {
  config: Record<string, unknown>
  formatCss: string
  formatJs: string
  formatFunctionName: string
  /**
   * Safe base tracking URL (e.g. '/track-event' or 'https://api.../functions/v1/track-event')
   * Left blank during editor preview; injected dynamically by serve-ad.
   */
  trackUrl?: string
  /**
   * Format-specific engagement definitions baked into the bundle.
   * Available at runtime as window.__ST_ENGAGEMENTS__ for analytics tooling.
   */
  engagements?: EngagementDef[]
}

/**
 * Composes a completely self-contained HTML document payload.
 * This is used for Editor Preview and for delivering the final GAM tag payload.
 */
export function buildAdPayload(options: BundlerOptions): string {
  // Apply default ctaUrl so ads always have a valid click destination
  const configWithDefaults = {
    ...options.config,
    ctaUrl: (options.config.ctaUrl as string) || 'https://scrolltoday.com',
  }

  const enableFeedback = Boolean(options.config.enableFeedback)

  // Use unicode escape for the less-than sign to prevent </script> injection breaking the payload
  const configJson = JSON.stringify(configWithDefaults).replace(/</g, '\\\\u003c')
  
  // Extract essential tracking identifiers from the config (injected by Editor or serve-ad)
  const cid = (options.config.id as string) || ''
  const aid = (options.config.advertiserId as string) || ''
  const cmpid = (options.config.campaignId as string) || ''
  const rid = (options.config.requestId as string) || ''
  // Use ?? (not ||) so an explicit empty string disables tracking in preview mode
  const trackUrl = options.trackUrl ?? '/track-event'
  const engagementsJson = JSON.stringify(options.engagements ?? [])

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
      user-select: none;
      -webkit-user-select: none;
    }
    #creative-root {
      width: 100%;
      height: 100%;
      position: relative;
      cursor: pointer;
    }
    /* Shared CTA style */
    .sb-cta {
      display: inline-block; padding: 8px 20px;
      color: #fff; text-decoration: none;
      border-radius: 6px; font-weight: 600;
      font-size: clamp(11px, 2vw, 14px);
      cursor: pointer; margin-top: 4px;
    }
    .placeholder {
      width: 100%; height: 100%; display: flex; flex-direction: column;
      align-items: center; justify-content: center; color: #9ca3af; 
      font-size: 14px; text-align: center; background: #f9fafb;
    }
    .placeholder span { font-size: 32px; margin-bottom: 8px; }
    ${options.formatCss}
    ${enableFeedback ? `
    /* ── Ad Choices & Feedback Overlay ── */
    .st-ad-choices-wrap {
      position: absolute; top: 6px; right: 6px;
      display: flex; align-items: center; gap: 4px; z-index: 50;
    }
    .st-ad-choices-pill {
      display: flex; align-items: center;
      background: rgba(255,255,255,0.9); backdrop-filter: blur(8px);
      padding: 3px 6px; border-radius: 20px;
      border: 1px solid rgba(0,0,0,0.08);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      cursor: default; transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
    }
    .st-ad-choices-text {
      font-size: 9px; font-weight: 800; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.03em;
      max-width: 0; opacity: 0; overflow: hidden; white-space: nowrap;
      transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
    }
    .st-ad-choices-pill:hover { padding-left: 10px; }
    .st-ad-choices-pill:hover .st-ad-choices-text { max-width: 120px; opacity: 1; margin-right: 6px; }
    .st-ad-choices-pill svg { color: #64748b; width: 11px; height: 11px; }
    .st-ad-close-btn {
      width: 20px; height: 20px;
      background: rgba(255,255,255,0.9); backdrop-filter: blur(8px);
      border: 1px solid rgba(0,0,0,0.08); border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #64748b; transition: all 0.2s;
    }
    .st-ad-close-btn:hover { background: #fff; color: #ef4444; transform: scale(1.1); box-shadow: 0 2px 10px rgba(239,68,68,0.15); }
    .st-feedback-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: #f5f3ff; z-index: 100;
      padding: 20px; display: none; flex-direction: column;
      animation: stFeedbackSlide 0.3s cubic-bezier(0.4,0,0.2,1);
      overflow: auto;
    }
    .st-feedback-overlay.st-visible { display: flex; }
    @keyframes stFeedbackSlide {
      from { transform: translateY(10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .st-feedback-head {
      display: flex; justify-content: space-between; align-items: start;
      margin: -20px -20px 16px; padding: 16px 20px;
      background: #fff; border-bottom: 1px solid #f1f5f9;
    }
    .st-feedback-head-text { display: flex; flex-direction: column; gap: 4px; }
    .st-feedback-head-title { font-size: 14px; font-weight: 800; color: #1e293b; }
    .st-feedback-head-desc { font-size: 12px; font-weight: 400; color: #1e293b; }
    .st-feedback-close {
      background: none; border: none; cursor: pointer; color: #94a3b8;
      padding: 4px; transition: all 0.2s;
      display: flex; align-items: center; justify-content: center;
    }
    .st-feedback-close:hover { color: #334155; background: #f1f5f9; border-radius: 4px; }
    .st-feedback-list { display: flex; flex-direction: column; gap: 8px; flex: 1; }
    .st-feedback-item {
      text-align: left; padding: 12px 16px; background: #fff;
      border: 1.5px solid #f1f5f9; border-radius: 12px;
      font-size: 13px; font-weight: 700; color: #475569;
      cursor: pointer; transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .st-feedback-item:hover {
      background: #fff; border-color: #6366f1; color: #6366f1;
      transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,0.1);
    }
    .st-feedback-footer { padding-top: 12px; margin-top: auto; }
    .st-feedback-footer p { font-size: 11px; color: #94a3b8; text-align: center; font-weight: 600; font-style: italic; margin: 0; }
    .st-ad-hidden .st-ad-main-content { display: none; }
    .st-ad-main-content { width: 100%; height: 100%; }
    ` : ''}
  </style>
</head>
<body>
  <div id="creative-root"></div>
  ${enableFeedback ? `
  <div id="st-ad-choices" class="st-ad-choices-wrap">
    <div class="st-ad-choices-pill">
      <span class="st-ad-choices-text">Ads by Scroll Today</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
    </div>
    <button class="st-ad-close-btn" id="st-close-btn" title="Close ad">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>
  <div id="st-feedback" class="st-feedback-overlay">
    <div class="st-feedback-head">
      <div class="st-feedback-head-text">
        <span class="st-feedback-head-title">Why hide this ad?</span>
        <span class="st-feedback-head-desc">This ad is served by Scroll Today. We prioritize your privacy and experience.</span>
      </div>
      <button class="st-feedback-close" id="st-feedback-close">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="st-feedback-list">
      <button class="st-feedback-item" data-reason="already_purchased">Already purchased</button>
      <button class="st-feedback-item" data-reason="irrelevant">Irrelevant</button>
      <button class="st-feedback-item" data-reason="seen_too_often">Seen too often</button>
      <button class="st-feedback-item" data-reason="offensive">Offensive</button>
    </div>
    <div class="st-feedback-footer"><p>This ad will be hidden for you.</p></div>
  </div>
  ` : ''}
  <script>
    function sanitize(str) {
      if (typeof str !== 'string') return '';
      return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }
    
    // --- 1. Load Telemetry Engine ---
    ${TELEMETRY_SCRIPT}

    // --- 2. Engagement definitions for this format ---
    window.__ST_ENGAGEMENTS__ = ${engagementsJson};

    // --- 3. Initialize Telemetry with Ad Context ---
    var serveConfig = window.__ST_SERVE_CONFIG__ || {};
    window.ScrollTodaySDK.instance = new window.ScrollTodaySDK.Telemetry({
      trackUrl: serveConfig.trackUrl || '${trackUrl}',
      creativeId: serveConfig.creativeId || '${cid}',
      advertiserId: serveConfig.advertiserId || '${aid}',
      campaignId: serveConfig.campaignId || '${cmpid}',
      requestId: serveConfig.requestId || '${rid}'
    });

    var currentConfig = ${configJson};
    var frameTimer = null;

    // --- 4. Format Specific Logic ---
    ${options.formatJs}

    function renderPlaceholder(root, cfg) {
      root.innerHTML =
        '<div class="placeholder"><span>&#9881;</span>'
        + '<div>Preview for <strong>' + sanitize(cfg.type || 'unknown') + '</strong></div></div>';
    }

    function render(cfg) {
      // Ensure ctaUrl is always set (may be missing after CONFIG_UPDATE from editor)
      cfg.ctaUrl = cfg.ctaUrl || 'https://scrolltoday.com';
      var root = document.getElementById('creative-root');
      if (!root) return;
      if (frameTimer) { clearInterval(frameTimer); frameTimer = null; }
      
      var videos = root.querySelectorAll('video');
      for (var v = 0; v < videos.length; v++) {
        videos[v].pause();
        videos[v].removeAttribute('src');
        videos[v].load();
      }

      // GLOBAL CLICK LISTENER — entire ad is clickable
      // If user clicks a CTA <a> with href, browser navigates via the link naturally.
      // If user clicks anywhere else on the ad (image-only, no CTA), open ctaUrl.
      root.onclick = function(e) {
        // Always track the click event
        window.ScrollTodaySDK.track('click');
        // If the click landed on an <a> with a real href, let the browser handle it
        var link = e.target.closest('a[href]');
        if (link && link.getAttribute('href') !== '#') return;
        // Otherwise, open the click-through URL for the whole-ad click
        if (cfg.ctaUrl && cfg.ctaUrl !== '#') {
          e.preventDefault();
          window.open(cfg.ctaUrl, '_blank', 'noopener');
        }
      };
      
      if (typeof ${options.formatFunctionName} === 'function') {
        ${options.formatFunctionName}(root, cfg);
        window.ScrollTodaySDK.instance.initStandardTracking();

        // --- 5. Auto-wire format-specific engagement events ---
        // Reads window.__ST_ENGAGEMENTS__ (baked in at publish time) and attaches
        // one listener per engagement definition. No tracking code in renderer.ts.
        (function() {
          var _engs = window.__ST_ENGAGEMENTS__ || [];
          for (var _i = 0; _i < _engs.length; _i++) {
            (function(eng) {
              if (!eng.event) return;
              var _el = eng.selector ? root.querySelector(eng.selector) : root;
              if (!_el) return;
              var _fired = false;
              _el.addEventListener(eng.event, function(e) {
                if (eng.once && _fired) return;
                if (eng.targetSelector && !e.target.closest(eng.targetSelector)) return;
                _fired = true;
                window.ScrollTodaySDK.track('engagement', { id: eng.id, name: eng.name });
              });
            })(_engs[_i]);
          }
        })();
      } else {
        renderPlaceholder(root, cfg);
      }
    }

    // Support Editor live-updates
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'CONFIG_UPDATE') {
        currentConfig = event.data.payload;
        render(currentConfig);
      }
    });

    render(currentConfig);

    // --- 6. Ad Choices & Feedback Overlay ---
    ${enableFeedback ? `
    (function() {
      var closeBtn = document.getElementById('st-close-btn');
      var feedbackEl = document.getElementById('st-feedback');
      var feedbackCloseBtn = document.getElementById('st-feedback-close');
      var adChoicesEl = document.getElementById('st-ad-choices');
      var rootEl = document.getElementById('creative-root');
      if (!closeBtn || !feedbackEl) return;

      closeBtn.addEventListener('click', function() {
        feedbackEl.classList.add('st-visible');
        if (adChoicesEl) adChoicesEl.style.display = 'none';
        if (rootEl) rootEl.style.display = 'none';
        window.ScrollTodaySDK.track('ad_close');
      });

      if (feedbackCloseBtn) {
        feedbackCloseBtn.addEventListener('click', function() {
          feedbackEl.classList.remove('st-visible');
          if (adChoicesEl) adChoicesEl.style.display = 'flex';
          if (rootEl) rootEl.style.display = '';
        });
      }

      var items = feedbackEl.querySelectorAll('.st-feedback-item');
      for (var i = 0; i < items.length; i++) {
        items[i].addEventListener('click', function() {
          var reason = this.getAttribute('data-reason') || 'unknown';
          window.ScrollTodaySDK.track('ad_feedback', { reason: reason });
          feedbackEl.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:8px;">'
            + '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
            + '<p style="font-size:13px;font-weight:700;color:#334155;">Thanks for your feedback</p>'
            + '<p style="font-size:11px;color:#94a3b8;">This ad will be hidden for you.</p></div>';
        });
      }
    })();
    ` : ''}
  </script>
</body>
</html>`
}
