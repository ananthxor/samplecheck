import type { TemplateConfig } from '@/features/templates/formats/registry'
import { getFormat } from '@/features/templates/formats/registry'
import { buildAdPayload } from '@scrolltoday/ad-sdk'

/**
 * Generates a self-contained HTML document for the iframe srcdoc.
 * Delegates to per-format renderers registered in the modular formats system.
 *
 * @param trackUrl - Leave undefined/empty for editor preview (disables telemetry).
 *                   Pass the absolute track-event URL for published/CDN builds.
 */
const DEFAULT_CTA_URL = 'https://www.scrolltoday.com'

export function generatePreviewHtml(config: TemplateConfig, trackUrl = ''): string {
  const format = getFormat(config.type)
  if (!format) {
    return buildPlaceholderHtml(config)
  }

  // Apply fallback CTA URL so no ad ever has a dead link
  const normalizedConfig = {
    ...config,
    ctaUrl: (config as Record<string, unknown>).ctaUrl || DEFAULT_CTA_URL,
  }

  const r = format.renderer
  if (!r) return buildPlaceholderHtml(config)

  if (r.type === 'html') {
    let html = r.render(normalizedConfig as Record<string, unknown>, trackUrl)
    // Inject feedback overlay for HTML renderers that bypass buildAdPayload
    if ((normalizedConfig as Record<string, unknown>).enableFeedback) {
      html = injectFeedbackOverlay(html)
    }
    return html
  }

  return buildAdPayload({
    config: normalizedConfig,
    formatCss: r.css,
    formatJs: r.js,
    formatFunctionName: r.functionName,
    trackUrl,
    engagements: format.engagements,
  })
}

/**
 * Injects the Ad Choices & Feedback overlay into a complete HTML document.
 * Used for HTML-type renderers that produce their own markup (bypassing buildAdPayload).
 */
function injectFeedbackOverlay(html: string): string {
  const feedbackCss = `
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
    .st-feedback-footer p { font-size: 11px; color: #94a3b8; text-align: center; font-weight: 600; font-style: italic; margin: 0; }`

  const feedbackHtml = `
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
  </div>`

  const feedbackJs = `
  <script>
  (function() {
    var closeBtn = document.getElementById('st-close-btn');
    var feedbackEl = document.getElementById('st-feedback');
    var feedbackCloseBtn = document.getElementById('st-feedback-close');
    var adChoicesEl = document.getElementById('st-ad-choices');
    if (!closeBtn || !feedbackEl) return;
    closeBtn.addEventListener('click', function() {
      feedbackEl.classList.add('st-visible');
      if (adChoicesEl) adChoicesEl.style.display = 'none';
      if (window.ScrollTodaySDK) window.ScrollTodaySDK.track('ad_close');
    });
    if (feedbackCloseBtn) {
      feedbackCloseBtn.addEventListener('click', function() {
        feedbackEl.classList.remove('st-visible');
        if (adChoicesEl) adChoicesEl.style.display = 'flex';
      });
    }
    var items = feedbackEl.querySelectorAll('.st-feedback-item');
    for (var i = 0; i < items.length; i++) {
      items[i].addEventListener('click', function() {
        var reason = this.getAttribute('data-reason') || 'unknown';
        if (window.ScrollTodaySDK) window.ScrollTodaySDK.track('ad_feedback', { reason: reason });
        feedbackEl.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:8px;">'
          + '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
          + '<p style="font-size:13px;font-weight:700;color:#334155;">Thanks for your feedback</p>'
          + '<p style="font-size:11px;color:#94a3b8;">This ad will be hidden for you.</p></div>';
      });
    }
  })();
  <\/script>`

  // Inject CSS before </style> or </head>
  if (html.includes('</style>')) {
    html = html.replace('</style>', feedbackCss + '\n</style>')
  } else {
    html = html.replace('</head>', '<style>' + feedbackCss + '</style>\n</head>')
  }

  // Inject HTML + JS before </body>
  html = html.replace('</body>', feedbackHtml + '\n' + feedbackJs + '\n</body>')

  return html
}

function buildPlaceholderHtml(config: TemplateConfig): string {
  const type = config.type || 'unknown'
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div>
    <div style="font-size:32px;margin-bottom:8px">&#9881;</div>
    <div>Preview for <strong>${type}</strong></div>
  </div>
</body>
</html>`
}
