# Phase 5: Interactive Ad Formats - Research

**Researched:** 2026-02-20
**Domain:** Vanilla HTML/CSS/JS interactive renderers inside sandboxed iframe (no React in output)
**Confidence:** HIGH

## Summary

Phase 5 implements seven interactive format renderers within the existing iframe-based preview architecture established in Phase 4. The critical architectural insight is that **renderers execute as vanilla HTML/CSS/JS inside a sandboxed iframe via `srcdoc`** -- they are NOT React components. The `renderer.ts` file generates a self-contained HTML document string with inline styles and scripts. Each interactive format renderer must follow this same pattern: a `renderXxx(root, cfg)` function inside the generated HTML that handles DOM creation, event binding, and animation.

All seven Zod schemas, editor form fields, template registry entries, and content field components already exist from Phase 4. The `editor-form.tsx` already has `CarouselContentFields`, `CubeContentFields`, `ScratchContentFields`, `FlipcardContentFields`, `QuizContentFields`, `SliderContentFields`, and `AccordionContentFields` wired up and functional. The Zod discriminated union in `template-schemas.ts` includes all seven interactive format schemas. The template registry has curated templates for all seven formats. The only missing piece is the **renderer implementations** -- currently, all seven formats hit the `default` case in the renderer's switch statement and show a placeholder: "Full renderer coming in Phase 5/6".

**Primary recommendation:** Implement each renderer as a pure vanilla JS `renderXxx(root, cfg)` function added to the switch statement in `renderer.ts`. Use CSS transforms (not libraries) for 3D effects, HTML5 Canvas for scratch-to-reveal, and Pointer Events API for unified touch/mouse handling. No new npm dependencies are needed.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| HTML5 Canvas API | N/A (browser built-in) | Scratch-to-reveal overlay rendering and pixel manipulation | Only way to do pixel-level "erase" effects; globalCompositeOperation destination-out is the standard technique |
| CSS 3D Transforms | N/A (browser built-in) | Cube carousel rotation, flipcard flip animation | `transform-style: preserve-3d`, `perspective`, `backface-visibility: hidden` are the standard CSS approach for 3D card effects |
| Pointer Events API | N/A (browser built-in) | Unified mouse + touch input handling for all formats | Single API handles mouse, touch, and pen; replaces need for separate mouse/touch event listeners |
| CSS Transitions/Animations | N/A (browser built-in) | Slide transitions, accordion expand/collapse, flipcard flip | CSS transitions are hardware-accelerated and performant for simple property animations |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None required | N/A | N/A | All interaction effects are achievable with browser built-ins |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS 3D Transforms (cube/flipcard) | Three.js / WebGL | Massive overkill for 4-face cube rotation; adds 500KB+ to inline HTML; CSS transforms are perfectly adequate |
| Pointer Events API | Separate touch + mouse listeners | Pointer Events API is universally supported (99%+ caniuse); separate listeners mean duplicate code and edge case differences |
| Vanilla Canvas scratch | ScratchCard.js library | Cannot include external libraries in srcdoc inline HTML; the technique (globalCompositeOperation destination-out) is only ~40 lines of code |
| Vanilla swipe detection | Hammer.js / Swiper.js | Cannot include npm libraries in inline srcdoc HTML; swipe detection is ~30 lines with Pointer Events |
| CSS scroll-snap carousel | Full JS carousel | CSS scroll-snap provides native momentum scrolling, but gives less control over slide indicators and auto-play timing |

**Installation:**
```bash
# No new packages needed. All renderers use browser built-in APIs.
```

## Architecture Patterns

### Existing Renderer Architecture (from Phase 4)

The renderer lives in a single file that generates a self-contained HTML page:

```
apps/web/src/features/editor/
├── lib/
│   ├── renderer.ts            # generatePreviewHtml() -- THE file to modify
│   └── preview-message.ts     # postMessage protocol
├── components/
│   ├── editor-form.tsx        # Already has all 7 interactive format form fields
│   ├── editor-preview.tsx     # iframe with srcdoc, sends CONFIG_UPDATE via postMessage
│   ├── editor-layout.tsx      # Split pane layout
│   ├── editor-toolbar.tsx     # Toolbar with save, device toggle, size picker
│   └── device-frame.tsx       # Desktop/mobile frame wrapper
├── hooks/
│   └── use-editor-state.ts    # Config state management
└── pages/
    └── editor-page.tsx        # Page component (new/edit modes)
```

### Pattern 1: Renderer Function Pattern (Existing)

**What:** Each format type gets a `renderXxx(root, cfg)` function inside the inline `<script>` in the generated HTML string.
**When to use:** Every format renderer follows this exact pattern.
**Example:**
```typescript
// Source: apps/web/src/features/editor/lib/renderer.ts (existing pattern)
// Inside the generated HTML template literal:
function render(cfg) {
  var root = document.getElementById('creative-root');
  if (!root) return;
  if (frameTimer) { clearInterval(frameTimer); frameTimer = null; }

  switch (cfg.type) {
    case 'static-banner': renderStaticBanner(root, cfg); break;
    case 'multi-frame':   renderMultiFrame(root, cfg); break;
    case 'in-feed':       renderInFeed(root, cfg); break;
    // Phase 5 adds these 7 cases:
    case 'carousel':      renderCarousel(root, cfg); break;
    case 'cube':          renderCube(root, cfg); break;
    case 'scratch':       renderScratch(root, cfg); break;
    case 'flipcard':      renderFlipcard(root, cfg); break;
    case 'quiz':          renderQuiz(root, cfg); break;
    case 'slider':        renderSlider(root, cfg); break;
    case 'accordion':     renderAccordion(root, cfg); break;
    default:              renderPlaceholder(root, cfg); break;
  }
}
```

### Pattern 2: CSS-in-JS-String for Format-Specific Styles

**What:** Each format's CSS is added to the `<style>` block in the generated HTML string.
**When to use:** All renderers that need custom CSS (which is all of them).
**Example:**
```typescript
// Each format adds its CSS classes to the shared <style> block:
/* Flipcard */
.fc-scene { width: 100%; height: 100%; perspective: 800px; cursor: pointer; }
.fc-card { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform 0.6s; }
.fc-card.is-flipped { transform: rotateY(180deg); }
.fc-face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.fc-back { transform: rotateY(180deg); }
```

### Pattern 3: Pointer Events for Unified Input (NEW for Phase 5)

**What:** Use `pointerdown`, `pointermove`, `pointerup` instead of separate mouse/touch events.
**When to use:** Carousel swipe, scratch interaction, slider drag, cube rotation.
**Example:**
```javascript
// Source: MDN Pointer Events API
root.addEventListener('pointerdown', function(e) {
  startX = e.clientX;
  dragging = true;
  root.setPointerCapture(e.pointerId);
});
root.addEventListener('pointermove', function(e) {
  if (!dragging) return;
  var dx = e.clientX - startX;
  // Use dx for swipe/drag calculation
});
root.addEventListener('pointerup', function(e) {
  dragging = false;
  root.releasePointerCapture(e.pointerId);
  // Determine if swipe threshold was met
});
```

### Pattern 4: Canvas Scratch-to-Reveal

**What:** HTML5 Canvas overlay with `globalCompositeOperation: 'destination-out'` for pixel erasing.
**When to use:** Scratch-to-reveal format only.
**Example:**
```javascript
// Source: Envato Tuts+ scratch card tutorial, MDN Canvas API
var canvas = document.getElementById('scratch-canvas');
var ctx = canvas.getContext('2d');
// Fill canvas with overlay image or solid color
ctx.fillStyle = '#888';
ctx.fillRect(0, 0, canvas.width, canvas.height);

canvas.addEventListener('pointermove', function(e) {
  if (!scratching) return;
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(e.offsetX, e.offsetY, 20, 0, Math.PI * 2);
  ctx.fill();
  checkRevealPercentage();
});

function checkRevealPercentage() {
  var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  var total = canvas.width * canvas.height;
  var cleared = 0;
  for (var i = 3; i < data.length; i += 4) {
    if (data[i] === 0) cleared++;
  }
  if (cleared / total > 0.5) {
    canvas.style.display = 'none'; // Full reveal
  }
}
```

### Anti-Patterns to Avoid

- **Importing npm libraries in renderer.ts output:** The generated HTML is a self-contained string. You cannot `import` from npm packages inside the inline `<script>`. All code must be vanilla JS written directly in the template literal.
- **Using React inside the iframe:** The iframe renders raw HTML, not React. There is no JSX, no hooks, no component lifecycle. All DOM manipulation is imperative via `innerHTML` and `addEventListener`.
- **Using `innerHTML +=` for incremental updates:** This destroys existing DOM nodes and event listeners. Build the full HTML string first, then set `innerHTML` once, then attach event listeners to the rendered elements.
- **Forgetting `touch-action: none` on drag surfaces:** Without this CSS property, the browser will try to scroll/zoom on touch devices during swipe/drag gestures, fighting with the custom interaction.
- **Using hover for flip/interaction triggers:** Hover doesn't exist on touch devices. Always use click/tap (pointer events) as the primary trigger.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pixel erasing | Custom pixel manipulation loops | Canvas `globalCompositeOperation: 'destination-out'` | Built-in GPU-accelerated compositing; handles anti-aliasing automatically |
| 3D cube rotation | WebGL/Three.js scene | CSS `transform-style: preserve-3d` + `rotateY`/`rotateX` | CSS 3D transforms are hardware-accelerated, require no library, and work perfectly for simple geometric rotations |
| Swipe gesture detection | Complex velocity/distance calculations | Simple pointer delta with threshold (30px+) | Over-engineering swipe detection causes more bugs than it solves; a simple "did pointer move > 30px horizontally?" check is sufficient |
| Accordion animation | Manual height calculations | CSS `max-height` transition with `overflow: hidden` | Browser handles the animation smoothly; manual height measurement creates layout thrashing |

**Key insight:** All seven interactive formats can be implemented with browser built-in APIs. The iframe srcdoc architecture means no external library can be imported anyway -- the renderer output must be a single self-contained HTML string. This is actually a strength: it forces simplicity and guarantees zero external dependencies in the ad output.

## Common Pitfalls

### Pitfall 1: Touch Scrolling Conflicts with Swipe/Drag Gestures
**What goes wrong:** On mobile, the browser's native scroll/zoom gesture intercepts `pointermove` events, causing carousel swipes and slider drags to scroll the page instead.
**Why it happens:** Browser default touch behavior includes scrolling and zooming. The interactive element's gesture competes with these defaults.
**How to avoid:** Add `touch-action: none` CSS to all interactive drag/swipe surfaces. For carousel, use `touch-action: pan-y` if you want to allow vertical scrolling but capture horizontal swipes.
**Warning signs:** The interaction works on desktop with mouse but fails or stutters on mobile.

### Pitfall 2: Canvas DPI Scaling on Retina/HiDPI Displays
**What goes wrong:** Scratch-to-reveal canvas looks blurry on high-DPI screens; scratch radius appears at wrong position.
**Why it happens:** Canvas CSS size and pixel buffer size differ on retina displays. `e.offsetX` returns CSS pixels but canvas draws in device pixels.
**How to avoid:** Scale canvas buffer: `canvas.width = canvas.clientWidth * window.devicePixelRatio; canvas.height = canvas.clientHeight * window.devicePixelRatio; ctx.scale(devicePixelRatio, devicePixelRatio)`. Then use CSS size for positioning.
**Warning signs:** Scratch circle appears offset from pointer position; canvas looks pixelated.

### Pitfall 3: Event Listeners Lost on Re-render
**What goes wrong:** When the editor sends a `CONFIG_UPDATE` postMessage, the renderer re-executes `render(cfg)`, which sets `root.innerHTML = ...`. This destroys all existing DOM nodes and their attached event listeners.
**Why it happens:** The current pattern uses `innerHTML` assignment which replaces the entire DOM subtree.
**How to avoid:** Two approaches: (a) Only re-render content that changed (text, images), not the interactive container -- check `cfg.type` hasn't changed before full re-render. (b) Accept full re-render but always re-attach event listeners in the render function after setting innerHTML. The existing codebase uses approach (b) -- the `render()` function is called on every config update and rebuilds everything.
**Warning signs:** Interaction stops working after editing form fields in the editor.

### Pitfall 4: Inline HTML String Escaping
**What goes wrong:** Config values containing `</script>`, quotes, or HTML entities break the generated HTML page.
**Why it happens:** Config values (headlines, body text) are interpolated into the HTML string. A headline like `"Buy <script>alert('xss')</script>"` would break the page.
**How to avoid:** The existing `sanitize()` function in the renderer handles HTML entity escaping. Always use `sanitize()` for ALL user-provided text. The JSON config is escaped with `.replace(/<\//g, '<\\/')` for safe embedding in `<script>`.
**Warning signs:** Preview breaks or shows raw HTML when user types special characters.

### Pitfall 5: CSS 3D Transform Browser Inconsistencies
**What goes wrong:** `backface-visibility: hidden` doesn't work in some browsers without the `-webkit-` prefix. Cube faces flicker or show through incorrectly.
**Why it happens:** Safari and older WebKit browsers require `-webkit-backface-visibility: hidden` in addition to the standard property.
**How to avoid:** Always include both: `backface-visibility: hidden; -webkit-backface-visibility: hidden;`. Also add `-webkit-transform-style: preserve-3d` alongside the standard property.
**Warning signs:** Flipcard shows both sides simultaneously; cube faces overlap or flicker.

### Pitfall 6: getImageData() Performance on Large Canvas
**What goes wrong:** Checking scratch reveal percentage via `getImageData()` on every pointer move causes frame drops.
**Why it happens:** `getImageData()` forces a GPU-to-CPU readback which is expensive. Doing it 60 times per second on a 300x250 canvas reads 300,000 pixels per frame.
**How to avoid:** Throttle the percentage check to run only on `pointerup` (when scratching stops), not on every `pointermove`. Alternatively, check every 10th move event.
**Warning signs:** Scratch interaction feels laggy, especially on mobile.

### Pitfall 7: Accordion Content Overflow and Height Calculation
**What goes wrong:** Accordion sections have dynamic content length. Using fixed `max-height` for animation causes either clipping (value too small) or slow animation (value too large like 9999px).
**Why it happens:** CSS `max-height` transition requires a concrete value; `auto` doesn't animate. If you set `max-height: 500px` but content is only 80px, the transition takes the same duration to cover 500px, making it feel sluggish.
**How to avoid:** Use `scrollHeight` to measure actual content height, then set `max-height` to that value dynamically. Or use the CSS `display: grid; grid-template-rows: 0fr` to `1fr` animation pattern (supported in modern browsers).
**Warning signs:** Accordion animation feels too slow or content gets cut off.

## Code Examples

Verified patterns from official sources and the existing codebase:

### Carousel Renderer (swipe + indicators)
```javascript
// Source: MDN Pointer Events + existing renderer.ts pattern
function renderCarousel(root, cfg) {
  var slides = cfg.slides || [];
  if (slides.length === 0) { renderPlaceholder(root, cfg); return; }

  var html = '<div class="car-container" style="touch-action:pan-y">';
  html += '<div class="car-track">';
  for (var i = 0; i < slides.length; i++) {
    var s = slides[i];
    var imgHtml = s.imageUrl
      ? '<img src="' + sanitize(s.imageUrl) + '" alt="" class="car-img" />'
      : '';
    html += '<div class="car-slide">' + imgHtml
      + '<h2>' + sanitize(s.headline || '') + '</h2>'
      + '<p>' + sanitize(s.bodyText || '') + '</p>'
      + '</div>';
  }
  html += '</div>';
  // Indicators
  html += '<div class="car-dots">';
  for (var j = 0; j < slides.length; j++) {
    html += '<span class="car-dot' + (j === 0 ? ' active' : '') + '" data-idx="' + j + '"></span>';
  }
  html += '</div>';
  if (cfg.ctaText) {
    html += '<a class="sb-cta" href="' + sanitize(cfg.ctaUrl || '#') + '" style="background-color:#2563eb">' + sanitize(cfg.ctaText) + '</a>';
  }
  html += '</div>';
  root.innerHTML = html;

  // Swipe logic
  var track = root.querySelector('.car-track');
  var dots = root.querySelectorAll('.car-dot');
  var current = 0;
  var startX = 0, dragging = false;

  track.addEventListener('pointerdown', function(e) {
    startX = e.clientX; dragging = true;
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener('pointerup', function(e) {
    if (!dragging) return;
    dragging = false;
    var dx = e.clientX - startX;
    if (Math.abs(dx) > 30) {
      current = dx < 0
        ? Math.min(current + 1, slides.length - 1)
        : Math.max(current - 1, 0);
    }
    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    dots.forEach(function(d, i) { d.classList.toggle('active', i === current); });
  });

  // Auto-play
  if (cfg.autoPlay) {
    frameTimer = setInterval(function() {
      current = (current + 1) % slides.length;
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      dots.forEach(function(d, i) { d.classList.toggle('active', i === current); });
    }, cfg.autoPlayInterval || 3000);
  }
}
```

### Flipcard Renderer (CSS 3D flip)
```javascript
// Source: 3dtransforms.desandro.com/card-flip, MDN backface-visibility
function renderFlipcard(root, cfg) {
  var frontImg = cfg.frontImageUrl
    ? '<img src="' + sanitize(cfg.frontImageUrl) + '" alt="" class="fc-img" />'
    : '';
  var backImg = cfg.backImageUrl
    ? '<img src="' + sanitize(cfg.backImageUrl) + '" alt="" class="fc-img" />'
    : '';

  root.innerHTML =
    '<div class="fc-scene">'
    + '<div class="fc-card" id="fc-card">'
    + '<div class="fc-face fc-front">'
    + frontImg
    + '<h2>' + sanitize(cfg.frontHeadline || '') + '</h2>'
    + '<p>' + sanitize(cfg.frontBodyText || '') + '</p>'
    + '</div>'
    + '<div class="fc-face fc-back">'
    + backImg
    + '<h2>' + sanitize(cfg.backHeadline || '') + '</h2>'
    + '<p>' + sanitize(cfg.backBodyText || '') + '</p>'
    + '<a class="sb-cta" href="' + sanitize(cfg.ctaUrl || '#') + '" style="background-color:#2563eb">' + sanitize(cfg.ctaText || 'Learn More') + '</a>'
    + '</div>'
    + '</div>'
    + '</div>';

  var card = document.getElementById('fc-card');
  root.querySelector('.fc-scene').addEventListener('click', function() {
    card.classList.toggle('is-flipped');
  });
}

/* CSS for flipcard:
.fc-scene { width:100%; height:100%; perspective:800px; cursor:pointer; }
.fc-card { width:100%; height:100%; position:relative; transform-style:preserve-3d; -webkit-transform-style:preserve-3d; transition:transform 0.6s; }
.fc-card.is-flipped { transform:rotateY(180deg); }
.fc-face { position:absolute; width:100%; height:100%; backface-visibility:hidden; -webkit-backface-visibility:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:16px; gap:8px; }
.fc-front { background:#ffffff; }
.fc-back { background:#f8fafc; transform:rotateY(180deg); }
*/
```

### Scratch-to-Reveal Renderer (Canvas)
```javascript
// Source: MDN Canvas globalCompositeOperation, Envato Tuts+ tutorial
function renderScratch(root, cfg) {
  root.innerHTML =
    '<div class="sc-container">'
    + '<div class="sc-reveal">'
    + (cfg.revealImageUrl ? '<img src="' + sanitize(cfg.revealImageUrl) + '" alt="" class="sc-img" />' : '')
    + '<h2>' + sanitize(cfg.headline || '') + '</h2>'
    + '<p>' + sanitize(cfg.bodyText || '') + '</p>'
    + '<a class="sb-cta" href="' + sanitize(cfg.ctaUrl || '#') + '" style="background-color:#2563eb">' + sanitize(cfg.ctaText || '') + '</a>'
    + '</div>'
    + '<canvas id="scratch-canvas" class="sc-canvas"></canvas>'
    + '</div>';

  var canvas = document.getElementById('scratch-canvas');
  var container = root.querySelector('.sc-container');
  canvas.width = container.clientWidth * (window.devicePixelRatio || 1);
  canvas.height = container.clientHeight * (window.devicePixelRatio || 1);
  canvas.style.width = container.clientWidth + 'px';
  canvas.style.height = container.clientHeight + 'px';

  var ctx = canvas.getContext('2d');
  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

  // Draw overlay
  if (cfg.overlayImageUrl) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      ctx.drawImage(img, 0, 0, container.clientWidth, container.clientHeight);
    };
    img.src = cfg.overlayImageUrl;
  } else {
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(0, 0, container.clientWidth, container.clientHeight);
    ctx.fillStyle = '#999';
    ctx.font = '16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Scratch here!', container.clientWidth / 2, container.clientHeight / 2);
  }

  var scratching = false;
  canvas.style.touchAction = 'none';

  canvas.addEventListener('pointerdown', function(e) {
    scratching = true;
    canvas.setPointerCapture(e.pointerId);
    scratch(e);
  });
  canvas.addEventListener('pointermove', function(e) {
    if (scratching) scratch(e);
  });
  canvas.addEventListener('pointerup', function(e) {
    scratching = false;
    checkReveal();
  });

  function scratch(e) {
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  function checkReveal() {
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var total = canvas.width * canvas.height;
    var cleared = 0;
    for (var i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) cleared++;
    }
    if (cleared / total > 0.5) {
      canvas.style.transition = 'opacity 0.5s';
      canvas.style.opacity = '0';
    }
  }
}
```

### CSS for 3D Cube Carousel
```css
/* Source: 3dtransforms.desandro.com/cube */
.cube-scene { width:100%; height:100%; perspective:600px; overflow:hidden; }
.cube-container { width:100%; height:100%; position:relative; transform-style:preserve-3d; -webkit-transform-style:preserve-3d; transition:transform 1s; }
.cube-face { position:absolute; width:100%; height:100%; backface-visibility:hidden; -webkit-backface-visibility:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:16px; }
.cube-face--front  { transform: rotateY(  0deg) translateZ(VAR_HALF_WIDTH); }
.cube-face--right  { transform: rotateY( 90deg) translateZ(VAR_HALF_WIDTH); }
.cube-face--back   { transform: rotateY(180deg) translateZ(VAR_HALF_WIDTH); }
.cube-face--left   { transform: rotateY(-90deg) translateZ(VAR_HALF_WIDTH); }
```

### Quiz/Poll Renderer
```javascript
// Source: Original implementation following existing renderer.ts pattern
function renderQuiz(root, cfg) {
  var options = cfg.options || [];
  var html = '<div class="qz-container">';
  html += '<div id="qz-question" class="qz-question">';
  html += '<h2>' + sanitize(cfg.question || '') + '</h2>';
  html += '<div class="qz-options">';
  for (var i = 0; i < options.length; i++) {
    html += '<button class="qz-option" data-idx="' + i + '" data-correct="' + options[i].isCorrect + '">'
      + sanitize(options[i].text || '')
      + '</button>';
  }
  html += '</div></div>';
  html += '<div id="qz-result" class="qz-result" style="display:none">';
  html += '<h2>' + sanitize(cfg.resultText || '') + '</h2>';
  if (cfg.ctaText) {
    html += '<a class="sb-cta" href="' + sanitize(cfg.ctaUrl || '#') + '" style="background-color:#2563eb">' + sanitize(cfg.ctaText) + '</a>';
  }
  html += '</div></div>';
  root.innerHTML = html;

  root.querySelectorAll('.qz-option').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var isCorrect = btn.getAttribute('data-correct') === 'true';
      root.querySelectorAll('.qz-option').forEach(function(b) {
        b.disabled = true;
        if (b.getAttribute('data-correct') === 'true') b.classList.add('correct');
        else b.classList.add('wrong');
      });
      btn.classList.add('selected');
      setTimeout(function() {
        document.getElementById('qz-question').style.display = 'none';
        document.getElementById('qz-result').style.display = 'flex';
      }, 1000);
    });
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate `touchstart`/`mousedown` listeners | Unified `pointerdown`/`pointermove`/`pointerup` | Pointer Events API Level 2 (2019+) | Single set of event listeners handles all input types; 99%+ browser support |
| Fixed canvas pixel size | `devicePixelRatio`-scaled canvas | HiDPI displays became standard (~2015+) | Must scale canvas buffer for sharp rendering on retina displays |
| `hover` triggers for card flip | `click`/`pointer` triggers | Touch-first design became standard | Hover doesn't exist on touch devices; click works universally |
| jQuery `.animate()` for accordions | CSS `max-height` or `grid-template-rows: 0fr/1fr` transitions | CSS Grid animation support (Chrome 107+, 2022) | GPU-accelerated, no JS animation loop needed |
| `element.scrollLeft` manipulation | CSS `scroll-snap-type: x mandatory` | Widely supported since 2020 | Native momentum scrolling, but less control over indicators |

**Deprecated/outdated:**
- `mousedown`/`touchstart` dual listeners: Use Pointer Events API instead
- jQuery for DOM manipulation: Vanilla JS is sufficient and avoids library overhead
- `webkitRequestAnimationFrame`: Use standard `requestAnimationFrame` (universally supported)

## Open Questions

1. **Cube `translateZ` value for responsive sizing**
   - What we know: The cube face `translateZ` value must equal half the container width for faces to align correctly. The container width depends on the selected ad size (300x250, 320x480, etc.).
   - What's unclear: Should the translateZ be calculated dynamically in JS based on container dimensions, or should the cube schema include a fixed size?
   - Recommendation: Calculate dynamically using `container.clientWidth / 2` in the renderer. This keeps it responsive across all ad sizes.

2. **Scratch overlay image loading timing**
   - What we know: The overlay image loads asynchronously. The canvas must be fully painted before the user can scratch.
   - What's unclear: What happens if the user starts scratching before the overlay image loads?
   - Recommendation: Draw a solid gray overlay immediately as fallback, then replace with the image when it loads. Show "Scratch here!" text on the gray overlay.

3. **Renderer file size as formats accumulate**
   - What we know: `renderer.ts` currently has ~265 lines generating a single HTML page with 3 format renderers plus placeholder. Adding 7 more interactive renderers (each ~50-100 lines of JS + CSS) could push the file to 800-1200 lines.
   - What's unclear: Should renderers be split into separate files and composed, or kept in one file?
   - Recommendation: Extract per-format renderer functions into separate files (`renderers/carousel.ts`, `renderers/cube.ts`, etc.) that each export a CSS string and a JS function string. The main `renderer.ts` composes them into the final HTML. This keeps each renderer maintainable while preserving the single-HTML-output architecture.

4. **Auto-play vs user interaction conflict in carousel**
   - What we know: Carousel has `autoPlay` and `autoPlayInterval` config fields. If auto-play is active and user starts swiping, both fight for control of the current slide.
   - What's unclear: Best UX behavior when conflicts occur.
   - Recommendation: Pause auto-play on user interaction (pointerdown), resume after 5 seconds of inactivity.

## Sources

### Primary (HIGH confidence)
- **Existing codebase** - `renderer.ts`, `template-schemas.ts`, `template-registry.ts`, `editor-form.tsx`, `editor-preview.tsx` -- all inspected directly
- [MDN Pointer Events API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) - Unified input handling
- [MDN Canvas globalCompositeOperation](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation) - Scratch effect technique
- [MDN CSS transform-style](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-style) - 3D transforms for cube/flipcard
- [MDN iframe sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe) - Verified `allow-scripts` is sufficient for all interaction events
- [Intro to CSS 3D Transforms - Cube](https://3dtransforms.desandro.com/cube) - Cube geometry and face positioning
- [Intro to CSS 3D Transforms - Card Flip](https://3dtransforms.desandro.com/card-flip) - Flipcard CSS pattern

### Secondary (MEDIUM confidence)
- [Envato Tuts+ Scratch Card Tutorial](https://webdesign.tutsplus.com/how-to-create-a-scratch-card-effect-in-vanilla-javascript--cms-108922t) - Verified scratch implementation pattern
- [CSS-Tricks Simple Swipe](https://css-tricks.com/simple-swipe-with-vanilla-javascript/) - Swipe detection pattern
- [Chrome Developers - Accessible Carousels](https://developer.chrome.com/blog/accessible-carousel) - ARIA carousel patterns
- [Sara Soueidan - CSS Carousels Accessibility](https://www.sarasoueidan.com/blog/css-carousels-accessibility/) - Accessibility best practices
- [IAB MRAID 3.0](https://www.iab.com/guidelines/mraid/) - Industry standards for rich media ad interaction

### Tertiary (LOW confidence)
- None. All findings verified with primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All implementations use browser built-in APIs; no library choices to debate. The existing iframe srcdoc architecture constrains the solution space to vanilla HTML/CSS/JS only.
- Architecture: HIGH - The renderer pattern is already established with 3 working formats. Phase 5 extends the same pattern for 7 more formats. The file organization question (single file vs split) is the only architectural decision.
- Pitfalls: HIGH - All pitfalls are well-documented browser platform issues with established solutions (touch-action, devicePixelRatio, backface-visibility prefix, getImageData throttling).

**Research date:** 2026-02-20
**Valid until:** 2026-04-20 (60 days -- browser APIs are extremely stable; no churn expected)
