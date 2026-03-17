import { TELEMETRY_SCRIPT } from '@scrolltoday/ad-sdk'
import type { FormatDefinition } from '../../../_shared/types'

function buildTracking(config: Record<string, unknown>, trackUrl: string): string {
  if (!trackUrl) return ''
  const cid = JSON.stringify((config.id as string) || '')
  const aid = JSON.stringify((config.advertiserId as string) || '')
  const cmpid = JSON.stringify((config.campaignId as string) || '')
  return `<script>
${TELEMETRY_SCRIPT}
window.ScrollTodaySDK.instance = new window.ScrollTodaySDK.Telemetry({
  trackUrl: ${JSON.stringify(trackUrl)},
  creativeId: ${cid},
  advertiserId: ${aid},
  campaignId: ${cmpid}
});
document.addEventListener('DOMContentLoaded', function() {
  if (window.ScrollTodaySDK && window.ScrollTodaySDK.instance) {
    window.ScrollTodaySDK.instance.initStandardTracking();
  }
});
<\/script>`
}

export const cubeFormat: FormatDefinition = {
  type: 'cube',
  name: 'Spin Cube',
  description: 'Draggable 3D cube that auto-rotates through 4 image faces',
  category: 'interactive',
  fields: [
    { id: 'face1',      label: 'Face 1 Image',   type: 'image', default: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=80', tab: 'content' },
    { id: 'face2',      label: 'Face 2 Image',   type: 'image', default: 'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=400&q=80', tab: 'content' },
    { id: 'face3',      label: 'Face 3 Image',   type: 'image', default: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=80', tab: 'content' },
    { id: 'face4',      label: 'Face 4 Image',   type: 'image', default: 'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=400&q=80', tab: 'content' },
    { id: 'clickUrl',   label: 'Destination URL', type: 'url',  default: 'https://scrolltoday.com',                                                                       tab: 'content' },
    { id: 'themeColor', label: 'Accent Color',   type: 'color', default: '#667eea',                                                                                       tab: 'style' },
  ],
  renderer: {
    type: 'html',
    render(config, trackUrl) {
      const c = config as Record<string, string>
      const tracking = buildTracking(config, trackUrl)
      return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  html, body { margin: 0; padding: 0; height: 100%; width: 100%; display: flex; align-items: center; justify-content: center; background: transparent; overflow: hidden; }
  .ad-container { width: 300px; height: 250px; background: #111; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
  .viewport { width: 300px; height: 250px; perspective: 1000px; cursor: grab; }
  .viewport:active { cursor: grabbing; }
  .cube { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1); }
  .face { position: absolute; width: 250px; height: 250px; left: 25px; border: 1px solid ${c.themeColor}; background: #000; backface-visibility: hidden; }
  .face img { width: 100%; height: 100%; object-fit: contain; user-select: none; -webkit-user-drag: none; pointer-events: none; }
  .f0 { transform: rotateY(0deg) translateZ(125px); }
  .f1 { transform: rotateY(90deg) translateZ(125px); }
  .f2 { transform: rotateY(180deg) translateZ(125px); }
  .f3 { transform: rotateY(-90deg) translateZ(125px); }
</style>
${tracking}
</head>
<body>
  <div class="ad-container">
    <div class="viewport" id="viewport">
      <div class="cube" id="cube">
        <div class="face f0"><img src="${c.face1}" alt=""></div>
        <div class="face f1"><img src="${c.face2}" alt=""></div>
        <div class="face f2"><img src="${c.face3}" alt=""></div>
        <div class="face f3"><img src="${c.face4}" alt=""></div>
      </div>
    </div>
  </div>
  <script>
    var current = 0;
    var startX = 0;
    var isDragging = false;
    var cube = document.getElementById('cube');
    var viewport = document.getElementById('viewport');
    var clickUrl = ${JSON.stringify(c.clickUrl || 'https://scrolltoday.com')};

    function rotate() { cube.style.transform = 'rotateY(' + (current * -90) + 'deg)'; }

    var autoTimer = setInterval(function() { current++; rotate(); }, 3000);

    function handleStart(x) {
      startX = x;
      isDragging = true;
      clearInterval(autoTimer);
    }

    function handleEnd(x) {
      if (!isDragging) return;
      var diff = startX - x;
      if (Math.abs(diff) > 50) {
        if (diff > 0) current++; else current--;
        rotate();
      } else {
        if (window.ScrollTodaySDK) window.ScrollTodaySDK.track('click');
        window.open(clickUrl, '_blank');
      }
      isDragging = false;
      autoTimer = setInterval(function() { current++; rotate(); }, 3000);
    }

    viewport.addEventListener('mousedown', function(e) { handleStart(e.clientX); });
    window.addEventListener('mouseup', function(e) { handleEnd(e.clientX); });
    viewport.addEventListener('touchstart', function(e) { handleStart(e.touches[0].clientX); }, { passive: true });
    viewport.addEventListener('touchend', function(e) { handleEnd(e.changedTouches[0].clientX); }, { passive: true });
  <\/script>
</body>
</html>`
    },
  },
  templates: [
    {
      id: 'cube-default',
      name: 'Spin Cube',
      description: 'Draggable 3D cube that auto-rotates through 4 image faces',
      thumbnailUrl: '',
      sizes: [{ width: 300, height: 250, label: '300×250' }],
      defaultConfig: {
        type: 'cube',
        face1: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=80',
        face2: 'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=400&q=80',
        face3: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=80',
        face4: 'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=400&q=80',
        clickUrl: 'https://scrolltoday.com',
        themeColor: '#667eea',
      },
    },
  ],
}
