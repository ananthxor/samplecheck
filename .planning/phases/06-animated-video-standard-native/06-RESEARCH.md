# Phase 6: Animated, Video, Standard & Native Formats - Research

**Researched:** 2026-02-20
**Domain:** Vanilla HTML/CSS/JS renderers for animated banners, countdown timers, video ads, static banners, multi-frame rotators, and native in-feed ads inside sandboxed iframe
**Confidence:** HIGH

## Summary

Phase 6 completes the remaining seven format renderers, bringing the total from seven (Phase 5 interactive formats) to fourteen. The seven formats split into four categories: animated (animated-banner, countdown), video (video-endcard, click-to-play), standard (static-banner, multi-frame), and native (in-feed). All format folders already exist with `config.ts`, `renderer.ts`, and `index.ts` files. The configs are complete with field definitions, template presets, and Zod schemas auto-generated via `buildZodSchema()`. The renderers currently have basic placeholder implementations that render static HTML without the format-specific behaviors (no animations, no video playback, no countdown ticking, no frame rotation).

The architecture is fully established from Phase 5's modular refactor: each format folder exports a `FormatDefinition` with a `RendererExport` containing CSS and JS strings. The `renderer-shell.ts` composes these into a self-contained HTML document injected via `srcdoc` into a sandboxed iframe (`sandbox="allow-scripts"`). The `render()` function in the shell calls the format's named function (e.g., `renderAnimatedBanner(root, cfg)`) on initial load and on every `CONFIG_UPDATE` postMessage from the editor. Two of the seven formats already have substantially complete renderers: **static-banner** (fully functional as-is, just renders content) and **in-feed** (already has sponsor bar, image, body text, and CTA link layout). The remaining five need substantive new implementations.

**Primary recommendation:** Use CSS `@keyframes` with `animation-delay` for animated banner entrance sequences (no GSAP needed -- CSS-only keeps the iframe self-contained and follows the Phase 5 precedent). Use `setInterval` + `Date.now()` delta calculation for the countdown timer. Use the HTML5 `<video>` element with `ended` event for video-endcard and click/play state toggling for click-to-play. The static-banner and in-feed renderers need only minor enhancements. The multi-frame renderer is already substantially complete from Phase 4. Two infrastructure changes are required: the iframe `sandbox` attribute must add `allow="autoplay"` for muted video autoplay, and the `renderer-shell.ts` global `frameTimer` cleanup pattern must also handle video element cleanup on re-render.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| CSS `@keyframes` + `animation-delay` | N/A (browser built-in) | Animated banner entrance sequences (fade, slide, bounce, zoom) | CSS animations are hardware-accelerated, self-contained in the HTML string, and require zero external dependencies. Phase 5 established CSS-only as the approach. |
| HTML5 `<video>` element | N/A (browser built-in) | Video playback for video-endcard and click-to-play formats | Native video element handles codec negotiation, controls, and fullscreen. The `ended` event provides reliable end-of-video detection. |
| `Date.now()` + `setInterval` | N/A (browser built-in) | Countdown timer tick calculation | `Date.now()` provides wall-clock time immune to tab-throttling drift. `setInterval` at 1000ms updates the display every second. |
| CSS `transition` + `opacity`/`transform` | N/A (browser built-in) | Frame transitions in multi-frame, endcard reveal animation | CSS transitions are hardware-accelerated and well-established from Phase 5 renderers. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None required | N/A | N/A | All seven format renderers are achievable with browser built-in APIs. No new npm dependencies needed. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS `@keyframes` (animated banner) | GSAP 3 (now 100% free via Webflow partnership) | GSAP offers timeline sequencing, easing functions, and `stagger()` that CSS cannot match. However, it would require loading a CDN script inside the srcdoc iframe, adding ~50KB, network dependency, and a deviation from the CSS-only precedent set in Phase 5. GSAP is better suited for a future "advanced animation" editor, not the current config-driven approach. |
| `setInterval` + `Date.now()` (countdown) | `requestAnimationFrame` loop | rAF is more precise and battery-friendly, but for a 1-second tick interval the difference is negligible. `setInterval` is simpler and matches the existing `frameTimer` pattern used by multi-frame and carousel auto-play. |
| HTML5 `<video>` (video formats) | Video.js / Plyr.js player library | Cannot include npm libraries in srcdoc inline HTML. The native `<video>` element handles all required functionality (play, pause, ended event, poster image). |
| Static text input for videoUrl | Dedicated `video` FieldType with upload | The current `text` field type works for v1 (paste a URL). A dedicated video upload field type could be added later but is outside Phase 6 scope. |

**Installation:**
```bash
# No new packages needed. All renderers use browser built-in APIs.
```

## Architecture Patterns

### Existing Renderer Architecture (Modular Format System)

Phase 5's refactor established a modular architecture where each format is a self-contained folder:

```
apps/web/src/features/templates/formats/
├── _shared/
│   ├── types.ts             # FormatDefinition, FieldDefinition, RendererExport
│   ├── schema-builder.ts    # buildZodSchema(formatType, fields)
│   └── renderer-shell.ts    # buildPreviewHtml(format, config) -> HTML string
├── animated-banner/
│   ├── config.ts            # fields[], metadata, templates[] (EXISTS, COMPLETE)
│   ├── renderer.ts          # CSS + JS strings (EXISTS, NEEDS UPDATE)
│   └── index.ts             # re-exports FormatDefinition (EXISTS)
├── countdown/               # Same structure (EXISTS, NEEDS UPDATE)
├── video-endcard/            # Same structure (EXISTS, NEEDS UPDATE)
├── click-to-play/            # Same structure (EXISTS, NEEDS UPDATE)
├── static-banner/            # Same structure (EXISTS, MINOR UPDATES)
├── multi-frame/              # Same structure (EXISTS, MOSTLY COMPLETE)
├── in-feed/                  # Same structure (EXISTS, MINOR UPDATES)
└── registry.ts              # Central format registry (EXISTS, NO CHANGES NEEDED)
```

The editor infrastructure is fully wired:
```
apps/web/src/features/editor/
├── lib/
│   ├── renderer.ts            # generatePreviewHtml() -> delegates to format registry
│   └── preview-message.ts     # CONFIG_UPDATE postMessage sender
├── components/
│   ├── editor-form.tsx        # Tabbed form using DynamicFormFields
│   ├── editor-preview.tsx     # iframe with srcdoc + postMessage updates
│   ├── dynamic-form-fields.tsx # Generic field renderer driven by FieldDefinition[]
│   └── ...
```

### Pattern 1: CSS @keyframes Animation Sequencing (Animated Banner)

**What:** Define `@keyframes` for each animation type (fade, slide, bounce, zoom) and apply them to banner elements with staggered `animation-delay` values so elements appear sequentially.
**When to use:** Animated banner format only.
**Example:**
```css
/* Source: MDN CSS @keyframes, CSS-Tricks staggered animations */
@keyframes ab-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ab-slide-in {
  from { opacity: 0; transform: translateX(-30px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes ab-bounce-in {
  0%   { opacity: 0; transform: scale(0.3); }
  50%  { transform: scale(1.05); }
  70%  { transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes ab-zoom-in {
  from { opacity: 0; transform: scale(0); }
  to   { opacity: 1; transform: scale(1); }
}

.ab-animated { opacity: 0; animation-fill-mode: forwards; }
.ab-animated:nth-child(1) { animation-delay: 0s; }
.ab-animated:nth-child(2) { animation-delay: 0.3s; }
.ab-animated:nth-child(3) { animation-delay: 0.6s; }
.ab-animated:nth-child(4) { animation-delay: 0.9s; }
```
```javascript
// In JS: set animation-name based on cfg.animationType
var items = root.querySelectorAll('.ab-animated');
for (var i = 0; i < items.length; i++) {
  items[i].style.animationName = 'ab-' + (cfg.animationType || 'fade') + '-in';
  items[i].style.animationDuration = '0.6s';
}
```

### Pattern 2: Countdown Timer with Date.now() Delta

**What:** Calculate the remaining time by subtracting `Date.now()` from the target date on each tick. Display days, hours, minutes, seconds in styled boxes.
**When to use:** Countdown timer format only.
**Example:**
```javascript
// Source: Standard countdown timer pattern
function renderCountdown(root, cfg) {
  var target = new Date(cfg.targetDate).getTime();
  // Build HTML with placeholder spans for digits
  root.innerHTML = '...countdown HTML with #cd-days, #cd-hours, #cd-mins, #cd-secs...';

  function tick() {
    var now = Date.now();
    var diff = Math.max(0, target - now);
    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff % 86400000) / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    document.getElementById('cd-days').textContent = String(d).padStart(2, '0');
    document.getElementById('cd-hours').textContent = String(h).padStart(2, '0');
    document.getElementById('cd-mins').textContent = String(m).padStart(2, '0');
    document.getElementById('cd-secs').textContent = String(s).padStart(2, '0');
    if (diff <= 0) { clearInterval(frameTimer); }
  }
  tick(); // immediate first render
  frameTimer = setInterval(tick, 1000);
}
```

### Pattern 3: Video with End Card Transition

**What:** Create a `<video>` element that plays the video. Listen for the `ended` event to hide the video layer and show the end card layer with a CSS fade transition.
**When to use:** Video-endcard format.
**Example:**
```javascript
// Source: MDN HTMLMediaElement ended event
function renderVideoEndcard(root, cfg) {
  root.innerHTML =
    '<div class="ve-container">'
    + '<div class="ve-video-layer" id="ve-video">'
    + '<video id="ve-player" width="100%" height="100%"'
    + (cfg.autoplay ? ' autoplay muted playsinline' : ' playsinline')
    + ' src="' + sanitize(cfg.videoUrl || '') + '"'
    + ' style="object-fit:contain;width:100%;height:100%"></video>'
    + '</div>'
    + '<div class="ve-endcard-layer" id="ve-endcard" style="opacity:0;pointer-events:none">'
    + '...endcard content...'
    + '</div></div>';

  var video = document.getElementById('ve-player');
  var endcard = document.getElementById('ve-endcard');
  var videoLayer = document.getElementById('ve-video');
  video.addEventListener('ended', function() {
    videoLayer.style.opacity = '0';
    endcard.style.opacity = '1';
    endcard.style.pointerEvents = 'auto';
  });
}
```

### Pattern 4: Click-to-Play State Toggle

**What:** Show a thumbnail image with a play button overlay. On click, replace the thumbnail with a `<video>` element and start playback.
**When to use:** Click-to-play video format.
**Example:**
```javascript
// Source: Standard click-to-play pattern
function renderClickToPlay(root, cfg) {
  root.innerHTML =
    '<div class="ctp-container">'
    + '<div id="ctp-thumb" class="ctp-thumbnail">'
    + '<img src="' + sanitize(cfg.thumbnailImageUrl || '') + '" ... />'
    + '<div class="ctp-play-btn">&#9654;</div>'
    + '</div>'
    + '<div id="ctp-player" class="ctp-player" style="display:none">'
    + '<video id="ctp-video" width="100%" height="100%" playsinline controls'
    + ' src="' + sanitize(cfg.videoUrl || '') + '"></video>'
    + '</div></div>';

  document.getElementById('ctp-thumb').addEventListener('click', function() {
    document.getElementById('ctp-thumb').style.display = 'none';
    document.getElementById('ctp-player').style.display = 'block';
    document.getElementById('ctp-video').play();
  });
}
```

### Anti-Patterns to Avoid

- **Loading GSAP from CDN inside srcdoc:** Adds network dependency, 50KB+ payload, and breaks the self-contained principle. CSS `@keyframes` with `animation-delay` can achieve the four animation types (fade, slide, bounce, zoom) specified in the config without any library.
- **Using `setTimeout` chains for countdown:** Drifts over time. Use `setInterval` with `Date.now()` delta calculation to always display the correct remaining time regardless of timer drift.
- **Creating `<video>` elements without cleanup on re-render:** The `render()` function rebuilds `root.innerHTML` on each config update. Any playing video must be paused/removed before re-render to prevent ghost audio. The existing `frameTimer` cleanup pattern (clearing intervals) needs extension to also pause active video elements.
- **Forgetting `playsinline` on video elements:** Without `playsinline`, iOS Safari opens video in fullscreen mode, breaking the ad preview layout.
- **Using `autoplay` without `muted`:** Browsers universally block unmuted autoplay. The video-endcard format's `autoplay` config option must always pair `autoplay` with `muted`.
- **Not adding `allow="autoplay"` to the iframe:** The current iframe has `sandbox="allow-scripts"` but no `allow` attribute. Without `allow="autoplay"`, even muted autoplay may be blocked in some browsers.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animation sequencing | Custom JS `requestAnimationFrame` loop for entrance animations | CSS `@keyframes` + `animation-delay` per element | Browser handles timing, GPU acceleration, and easing. Four keyframe definitions cover all four animation types. |
| Countdown arithmetic | Manual modulo calculations with floating point | `Math.floor(diff / 86400000)` with integer millisecond delta from `Date.now()` | Standard pattern; avoids floating point errors and timezone issues. |
| Video playback | Custom `<canvas>` video rendering or third-party player | Native `<video>` element with `ended`, `play`, `pause` events | Browser handles codec negotiation, buffering, controls, fullscreen. ~10 lines of code vs. 500+ for a custom player. |
| Time formatting | Custom digit padding logic | `String(n).padStart(2, '0')` | Built-in method, universally supported, zero edge cases. |
| Native ad responsive layout | Complex media queries for in-feed | CSS flexbox with `flex: 1` on content image | Already implemented in the existing in-feed renderer. Flexbox handles responsive sizing natively. |

**Key insight:** Phase 6 formats are simpler than Phase 5's interactive formats. The animated banner is CSS animation (no interaction physics). The countdown is arithmetic + interval (no user interaction). The video formats use the native `<video>` element (browser handles all complexity). The standard/native formats are largely static layout. The main complexity is in edge cases: video autoplay policies, countdown expiry states, and iframe sandbox permissions for video.

## Common Pitfalls

### Pitfall 1: Video Autoplay Blocked by Browser Policy
**What goes wrong:** The video-endcard format has an `autoplay` config option, but the video doesn't play automatically in the iframe preview.
**Why it happens:** Modern browsers require three conditions for autoplay: (1) the video must be `muted`, (2) the `<video>` element must have `playsinline`, and (3) the iframe must have `allow="autoplay"` in its attributes. The current iframe only has `sandbox="allow-scripts"` and no `allow` attribute.
**How to avoid:** Add `allow="autoplay"` to the iframe element in both `editor-preview.tsx` and `preview-page.tsx`. Always emit `muted playsinline` attributes on `<video>` when `cfg.autoplay` is true.
**Warning signs:** Video shows first frame but doesn't play; console shows "play() request was interrupted" or "autoplay was prevented."

### Pitfall 2: Ghost Audio from Video on Re-render
**What goes wrong:** When the editor sends a `CONFIG_UPDATE`, the `render()` function sets `root.innerHTML = ...` which destroys the DOM but doesn't explicitly pause the `<video>` element. In some browsers, the audio track continues playing even after the element is removed from the DOM.
**Why it happens:** Browser implementations differ on whether removing a playing `<video>` from the DOM immediately stops playback. Some browsers keep the media session alive briefly.
**How to avoid:** Before setting `root.innerHTML`, find and explicitly pause any `<video>` elements: `var videos = root.querySelectorAll('video'); for (var i = 0; i < videos.length; i++) { videos[i].pause(); videos[i].src = ''; }`. This should be added to the `render()` function in `renderer-shell.ts`, alongside the existing `frameTimer` cleanup.
**Warning signs:** Hearing audio from the previous render while the new render plays different content.

### Pitfall 3: Countdown Timer Shows Negative Values After Expiry
**What goes wrong:** If the target date is in the past, the countdown shows negative days/hours/minutes/seconds.
**Why it happens:** `Date.now()` exceeds the target timestamp, producing a negative delta. Without a floor at zero, the arithmetic produces negative values.
**How to avoid:** Clamp the delta: `var diff = Math.max(0, target - now)`. When `diff === 0`, clear the interval timer and optionally show an "expired" state or the CTA.
**Warning signs:** Countdown displays "-1 days, -5 hours" or similar negative values.

### Pitfall 4: CSS Animations Don't Replay on Config Update
**What goes wrong:** When the user changes the animation type in the editor, the animated banner doesn't replay the animation because the CSS `animation-name` is the same and the browser considers the animation already complete.
**Why it happens:** CSS animations only play once when first applied. Re-setting `innerHTML` should trigger a fresh animation, but if the browser reuses cached animation state (particularly when only the config values change, not the DOM structure), the animation may not replay.
**How to avoid:** Force animation restart by briefly setting `animation-name: none` then resetting it in a `requestAnimationFrame` callback. Alternatively, the full `innerHTML` replacement on each `render()` call naturally creates fresh elements, which should trigger fresh animations -- but test this explicitly.
**Warning signs:** Animation plays on first load but doesn't replay when changing animation type in the editor.

### Pitfall 5: Multi-frame Timer Not Cleared on Re-render
**What goes wrong:** This is already handled by the existing architecture. The `renderer-shell.ts` clears `frameTimer` via `clearInterval(frameTimer)` before each `render()` call. This pattern works for both multi-frame auto-rotation and countdown timer intervals.
**Why it matters:** The countdown timer format uses `frameTimer = setInterval(tick, 1000)`, which follows the exact same pattern as the multi-frame and carousel auto-play timers. The existing cleanup mechanism handles it correctly.
**How to verify:** Confirm that `render()` in `renderer-shell.ts` calls `if (frameTimer) { clearInterval(frameTimer); frameTimer = null; }` before invoking the format's render function.

### Pitfall 6: Video URL Format Compatibility
**What goes wrong:** User pastes a YouTube/Vimeo URL into the video URL field, expecting it to play. The `<video>` element cannot play YouTube/Vimeo URLs -- it only plays direct video file URLs (`.mp4`, `.webm`, `.ogg`).
**Why it happens:** YouTube/Vimeo URLs are web page URLs, not direct media files. They require their respective embed APIs or iframe embeds.
**How to avoid:** For v1, document that the video URL must be a direct link to a video file (e.g., from a CDN or Supabase storage). Add validation hint text to the field. Consider adding YouTube/Vimeo embed support as a future enhancement.
**Warning signs:** Video element shows nothing or throws a media error when given a YouTube URL.

## Code Examples

Verified patterns from official sources and the existing codebase:

### Animated Banner Renderer (CSS @keyframes Sequencing)
```javascript
// Source: MDN CSS @keyframes, CSS-Tricks staggered animations, existing renderer pattern
function renderAnimatedBanner(root, cfg) {
  var imgHtml = cfg.imageUrl
    ? '<img class="ab-animated" src="' + sanitize(cfg.imageUrl) + '" alt="Creative image" />'
    : '';
  root.innerHTML =
    '<div class="ab-container" style="background-color:'
    + sanitize(cfg.backgroundColor || '#ffffff') + ';color:'
    + sanitize(cfg.textColor || '#000000') + '">'
    + imgHtml
    + '<h1 class="ab-animated">' + sanitize(cfg.headline || '') + '</h1>'
    + '<p class="ab-animated">' + sanitize(cfg.bodyText || '') + '</p>'
    + '<a class="sb-cta ab-animated" href="' + sanitize(cfg.ctaUrl || '#')
    + '" style="background-color:' + sanitize(cfg.ctaColor || '#2563eb') + '">'
    + sanitize(cfg.ctaText || 'Learn More') + '</a>'
    + '</div>';

  // Apply animation based on config type
  var animName = 'ab-' + (cfg.animationType || 'fade') + '-in';
  var items = root.querySelectorAll('.ab-animated');
  for (var i = 0; i < items.length; i++) {
    items[i].style.animationName = animName;
    items[i].style.animationDuration = '0.6s';
    items[i].style.animationDelay = (i * 0.3) + 's';
  }
}
```
```css
/* CSS for animated banner */
.ab-container {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center; padding: 16px; gap: 8px;
  overflow: hidden;
}
.ab-container img { max-width: 60%; max-height: 30%; object-fit: contain; }
.ab-container h1 { font-size: clamp(14px, 3vw, 24px); font-weight: 700; line-height: 1.2; }
.ab-container p { font-size: clamp(11px, 2vw, 14px); line-height: 1.4; }
.ab-animated {
  opacity: 0;
  animation-fill-mode: forwards;
  animation-timing-function: ease-out;
}

@keyframes ab-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ab-slide-in {
  from { opacity: 0; transform: translateX(-30px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes ab-bounce-in {
  0%   { opacity: 0; transform: scale(0.3); }
  50%  { opacity: 1; transform: scale(1.05); }
  70%  { transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes ab-zoom-in {
  from { opacity: 0; transform: scale(0); }
  to   { opacity: 1; transform: scale(1); }
}
```

### Countdown Timer Renderer
```javascript
// Source: Standard countdown pattern, MDN Date.now()
function renderCountdown(root, cfg) {
  var target = new Date(cfg.targetDate).getTime();
  root.innerHTML =
    '<div class="cd-container" style="background-color:'
    + sanitize(cfg.backgroundColor || '#ffffff') + ';color:'
    + sanitize(cfg.textColor || '#000000') + '">'
    + '<h1>' + sanitize(cfg.headline || '') + '</h1>'
    + '<p>' + sanitize(cfg.bodyText || '') + '</p>'
    + '<div class="cd-timer">'
    + '<div class="cd-unit"><span id="cd-days" class="cd-value">00</span><span class="cd-label">Days</span></div>'
    + '<div class="cd-sep">:</div>'
    + '<div class="cd-unit"><span id="cd-hours" class="cd-value">00</span><span class="cd-label">Hours</span></div>'
    + '<div class="cd-sep">:</div>'
    + '<div class="cd-unit"><span id="cd-mins" class="cd-value">00</span><span class="cd-label">Mins</span></div>'
    + '<div class="cd-sep">:</div>'
    + '<div class="cd-unit"><span id="cd-secs" class="cd-value">00</span><span class="cd-label">Secs</span></div>'
    + '</div>'
    + '<a class="sb-cta" href="' + sanitize(cfg.ctaUrl || '#')
    + '" style="background-color:#2563eb">'
    + sanitize(cfg.ctaText || 'Learn More') + '</a>'
    + '</div>';

  function tick() {
    var diff = Math.max(0, target - Date.now());
    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff % 86400000) / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    var de = document.getElementById('cd-days');
    if (de) de.textContent = String(d).padStart(2, '0');
    var he = document.getElementById('cd-hours');
    if (he) he.textContent = String(h).padStart(2, '0');
    var me = document.getElementById('cd-mins');
    if (me) me.textContent = String(m).padStart(2, '0');
    var se = document.getElementById('cd-secs');
    if (se) se.textContent = String(s).padStart(2, '0');
    if (diff <= 0) clearInterval(frameTimer);
  }
  tick();
  frameTimer = setInterval(tick, 1000);
}
```

### Video Endcard Renderer
```javascript
// Source: MDN HTMLMediaElement ended event, MDN <video> element
function renderVideoEndcard(root, cfg) {
  var autoAttrs = cfg.autoplay ? ' autoplay muted' : '';
  root.innerHTML =
    '<div class="ve-container">'
    + '<div class="ve-video-layer" id="ve-video">'
    + '<video id="ve-player"' + autoAttrs + ' playsinline'
    + ' src="' + sanitize(cfg.videoUrl || '') + '"'
    + ' style="width:100%;height:100%;object-fit:contain"></video>'
    + (cfg.autoplay ? '' : '<div class="ve-play-overlay" id="ve-play">&#9654;</div>')
    + '</div>'
    + '<div class="ve-endcard" id="ve-endcard">'
    + (cfg.endcardImageUrl ? '<img src="' + sanitize(cfg.endcardImageUrl) + '" alt="" style="max-width:60%;max-height:30%;object-fit:contain" />' : '')
    + '<h1>' + sanitize(cfg.endcardHeadline || '') + '</h1>'
    + '<p>' + sanitize(cfg.endcardBodyText || '') + '</p>'
    + '<a class="sb-cta" href="' + sanitize(cfg.ctaUrl || '#')
    + '" style="background-color:#2563eb">'
    + sanitize(cfg.ctaText || 'Learn More') + '</a>'
    + '</div></div>';

  var video = document.getElementById('ve-player');
  var videoLayer = document.getElementById('ve-video');
  var endcard = document.getElementById('ve-endcard');

  video.addEventListener('ended', function() {
    videoLayer.style.opacity = '0';
    videoLayer.style.pointerEvents = 'none';
    endcard.style.opacity = '1';
    endcard.style.pointerEvents = 'auto';
  });

  if (!cfg.autoplay) {
    var playBtn = document.getElementById('ve-play');
    if (playBtn) {
      playBtn.addEventListener('click', function() {
        video.play();
        playBtn.style.display = 'none';
      });
    }
  }
}
```

### Click-to-Play Renderer
```javascript
// Source: Standard click-to-play UX pattern
function renderClickToPlay(root, cfg) {
  var thumbImg = cfg.thumbnailImageUrl
    ? '<img src="' + sanitize(cfg.thumbnailImageUrl) + '" alt="Video thumbnail" style="width:100%;height:100%;object-fit:cover" />'
    : '<div style="width:100%;height:100%;background:#1e293b"></div>';

  root.innerHTML =
    '<div class="ctp-container">'
    + '<div id="ctp-thumb" class="ctp-thumbnail">'
    + thumbImg
    + '<div class="ctp-play-btn">&#9654;</div>'
    + (cfg.headline ? '<h1 class="ctp-headline">' + sanitize(cfg.headline) + '</h1>' : '')
    + '</div>'
    + '<div id="ctp-player" class="ctp-player-wrap" style="display:none">'
    + '<video id="ctp-video" playsinline controls'
    + ' src="' + sanitize(cfg.videoUrl || '') + '"'
    + ' style="width:100%;height:100%;object-fit:contain"></video>'
    + '</div>'
    + (cfg.ctaText ? '<a class="sb-cta" style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);background-color:#2563eb;z-index:10" href="' + sanitize(cfg.ctaUrl || '#') + '">' + sanitize(cfg.ctaText) + '</a>' : '')
    + '</div>';

  document.getElementById('ctp-thumb').addEventListener('click', function() {
    document.getElementById('ctp-thumb').style.display = 'none';
    var playerWrap = document.getElementById('ctp-player');
    playerWrap.style.display = 'block';
    document.getElementById('ctp-video').play();
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flash video ads | HTML5 `<video>` element with MP4/WebM | Flash EOL 2020 | All modern ad creative uses HTML5 video; no Flash fallback needed |
| GSAP/JS animation sequences | CSS `@keyframes` for simple entrance effects | CSS Animations Level 1 (stable since 2013) | CSS handles the four animation types needed; GSAP reserved for complex timeline work |
| jQuery countdown plugins | Vanilla JS `Date.now()` + `setInterval` | jQuery decline since ~2018 | Zero-dependency countdown; `Date.now()` provides wall-clock accuracy |
| Fixed-size ad banners | Responsive/fluid layouts with `clamp()` sizing | IAB New Ad Portfolio 2017+ | Existing codebase already uses `clamp()` for responsive text sizing |
| VPAID for interactive video ads | SIMID (Secure Interactive Media Interface Definition) | VPAID deprecated 2020, SIMID emerging | For internal preview, native `<video>` + `ended` event is sufficient. VAST/SIMID only needed for ad server delivery. |

**Deprecated/outdated:**
- VPAID (Video Player-Ad Interface Definition): Deprecated by IAB in favor of SIMID. Not relevant for this phase -- we use native `<video>` directly.
- Flash-based ad creative: Completely dead. All rendering is HTML5.
- jQuery `.animate()` for countdown effects: Vanilla JS `setInterval` is simpler and lighter.

## Open Questions

1. **GSAP for future "Advanced Animation Editor"**
   - What we know: GSAP is now 100% free (Webflow partnership, April 2025). It provides timeline sequencing, custom easing, and stagger effects that CSS cannot match. The current animated banner config has only four preset animation types.
   - What's unclear: Whether a future phase should introduce GSAP for a more powerful animation editor where users can define custom timelines, or whether CSS-only remains sufficient.
   - Recommendation: Keep CSS-only for Phase 6 (matches Phase 5 precedent, keeps iframe self-contained). Defer GSAP to a potential "Advanced Animation" feature in a future phase. Note: GSAP license is now fully free for commercial use -- the licensing concern from earlier research is resolved.

2. **Video URL validation and supported formats**
   - What we know: The `<video>` element supports MP4 (H.264), WebM (VP8/VP9), and OGG. The `videoUrl` field is currently a plain text input with no validation beyond string type.
   - What's unclear: Should we validate that the URL ends in a supported extension? Should we support YouTube/Vimeo embed URLs?
   - Recommendation: For v1, accept any URL and let the `<video>` element handle it (it will show an error state for unsupported URLs). Add placeholder/helper text indicating "Direct video URL (MP4, WebM)" to guide users. YouTube/Vimeo support is a future enhancement.

3. **Countdown timer expiry behavior**
   - What we know: When the countdown reaches zero, the timer should stop. The current config has no "expired" state design.
   - What's unclear: Should the expired state show "00:00:00:00", a custom message, or transition to a CTA-focused view?
   - Recommendation: Show "00:00:00:00" and keep the CTA visible. This is the simplest behavior and lets the advertiser's CTA remain prominent. A configurable expiry message could be added as a future enhancement (new field in config).

4. **iframe `allow` attribute for video autoplay**
   - What we know: The iframe currently has `sandbox="allow-scripts"` only. Video autoplay (even muted) may be blocked without `allow="autoplay"` on the iframe element.
   - What's unclear: Whether all target browsers require the `allow` attribute or just some.
   - Recommendation: Add `allow="autoplay"` to both `editor-preview.tsx` and `preview-page.tsx` iframe elements. This is a low-risk change that ensures muted autoplay works across all browsers.

5. **Video element cleanup on re-render**
   - What we know: The `renderer-shell.ts` `render()` function clears `frameTimer` before re-rendering, but has no mechanism to pause/cleanup `<video>` elements.
   - What's unclear: Whether ghost audio is a real issue in the `srcdoc` context or only in `src`-based iframes.
   - Recommendation: Add video cleanup to the `render()` function in `renderer-shell.ts`: query all `<video>` elements, pause them, and clear their `src` before `innerHTML` replacement. This is a small, defensive change.

## Infrastructure Changes Required

### Change 1: Add `allow="autoplay"` to iframe elements

**Files to modify:**
- `apps/web/src/features/editor/components/editor-preview.tsx` (line 55)
- `apps/web/src/features/preview/pages/preview-page.tsx` (line 80)

**What:** Add `allow="autoplay"` attribute alongside `sandbox="allow-scripts"`.

**Why:** Required for muted video autoplay to work inside the sandboxed iframe across all browsers.

### Change 2: Add video cleanup to renderer-shell.ts

**File to modify:**
- `apps/web/src/features/templates/formats/_shared/renderer-shell.ts`

**What:** In the `render()` function (inside the generated HTML script), before clearing `frameTimer`, also find and pause any `<video>` elements in the root.

**Pattern:**
```javascript
function render(cfg) {
  var root = document.getElementById('creative-root');
  if (!root) return;
  // Cleanup timers
  if (frameTimer) { clearInterval(frameTimer); frameTimer = null; }
  // Cleanup video elements
  var videos = root.querySelectorAll('video');
  for (var v = 0; v < videos.length; v++) {
    videos[v].pause();
    videos[v].removeAttribute('src');
    videos[v].load();
  }
  // Render format
  if (typeof ${functionName} === 'function') {
    ${functionName}(root, cfg);
  } else {
    renderPlaceholder(root, cfg);
  }
}
```

## Assessment of Current Renderer State

### Formats Needing Substantive Updates (NEW renderer implementations)

| Format | Current State | Work Needed |
|--------|--------------|-------------|
| `animated-banner` | Static layout, no animations | Add CSS @keyframes for 4 animation types, add staggered `animation-delay` logic in JS |
| `countdown` | Static layout, no timer | Add countdown digit display HTML, `setInterval` tick function with `Date.now()` delta |
| `video-endcard` | Static endcard text only, no video | Add `<video>` element, `ended` event listener, video/endcard layer toggling |
| `click-to-play` | Static thumbnail, no video | Add play button overlay, click handler to swap to `<video>`, `play()` call |

### Formats Needing Minor Updates (existing renderers are close)

| Format | Current State | Work Needed |
|--------|--------------|-------------|
| `static-banner` | Fully functional | Already complete. Consider minor polish (hover state on CTA). |
| `multi-frame` | Fully functional with auto-rotation and cross-fade | Already complete from Phase 4/5 refactor. Confirm frameDuration config is wired. |
| `in-feed` | Fully functional with sponsor bar, image, body, CTA | Already complete. Consider adding "Sponsored" disclosure badge per IAB native ad guidelines. |

## Sources

### Primary (HIGH confidence)
- **Existing codebase** -- All 7 format folders (`animated-banner/`, `countdown/`, `video-endcard/`, `click-to-play/`, `static-banner/`, `multi-frame/`, `in-feed/`), `renderer-shell.ts`, `registry.ts`, `editor-preview.tsx`, `preview-page.tsx` -- inspected directly
- [MDN CSS @keyframes](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@keyframes) -- Animation definition syntax
- [MDN CSS animation-delay](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-delay) -- Staggered animation sequencing
- [MDN HTMLMediaElement ended event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/ended_event) -- Video completion detection
- [MDN `<video>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video) -- Video element attributes (autoplay, muted, playsinline)
- [MDN Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) -- Browser autoplay policies
- [MDN `<iframe>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe) -- Sandbox and allow attributes

### Secondary (MEDIUM confidence)
- [CSS-Tricks: Different Approaches for Staggered Animation](https://css-tricks.com/different-approaches-for-creating-a-staggered-animation/) -- Staggered animation patterns
- [CSS-Tricks: Handy System for Animated Entrances](https://css-tricks.com/a-handy-little-system-for-animated-entrances-in-css/) -- CSS entrance animation system
- [Webflow blog: GSAP 100% free](https://webflow.com/blog/gsap-becomes-free) -- GSAP licensing change confirmation
- [CSS-Tricks: GSAP free for commercial use](https://css-tricks.com/gsap-is-now-completely-free-even-for-commercial-use/) -- Independent confirmation of GSAP free license
- [Google Ad Manager: HTML5 video ad guidelines](https://support.google.com/admanager/answer/6391192?hl=en) -- Video ad implementation standards
- [web.dev: Sandboxed IFrames](https://web.dev/articles/sandboxed-iframes) -- iframe sandbox attribute behavior
- [SitePoint: Creating Accurate Timers in JavaScript](https://www.sitepoint.com/creating-accurate-timers-in-javascript/) -- Timer drift and accuracy patterns

### Tertiary (LOW confidence)
- None. All findings verified with primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All implementations use browser built-in APIs (CSS @keyframes, `<video>`, `Date.now()`). No library selection decisions needed. The iframe srcdoc architecture constrains the solution space to vanilla HTML/CSS/JS only, same as Phase 5.
- Architecture: HIGH -- The modular format folder architecture is fully established. All 7 format folders already exist with complete configs. Phase 6 only updates `renderer.ts` files in existing folders, plus two small infrastructure changes (iframe allow attribute, video cleanup in renderer-shell).
- Pitfalls: HIGH -- Video autoplay policies and countdown timer drift are well-documented browser platform issues with established solutions. The video cleanup and iframe allow attribute changes are small, defensive, and low-risk.

**Research date:** 2026-02-20
**Valid until:** 2026-04-20 (60 days -- browser APIs are extremely stable; no churn expected)
