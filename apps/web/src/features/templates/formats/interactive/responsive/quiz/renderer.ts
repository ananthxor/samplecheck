import type { RendererExport } from '../../../_shared/types'

export const quizRenderer: RendererExport = {
  functionName: 'renderQuiz',
  css: `
    .qz-container { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:16px; gap:12px; }
    .qz-question { width:100%; text-align:center; }
    .qz-question h2 { font-size:clamp(14px,3vw,20px); font-weight:700; line-height:1.3; margin-bottom:12px; }
    .qz-options { display:flex; flex-direction:column; gap:8px; width:100%; max-width:280px; }
    .qz-option { padding:10px 16px; border:2px solid #e5e7eb; border-radius:8px; background:#ffffff; font-size:clamp(12px,2.5vw,14px); cursor:pointer; transition:all 0.2s; text-align:left; }
    .qz-option:hover { border-color:#93c5fd; background:#eff6ff; }
    .qz-option:disabled { cursor:default; opacity:0.8; }
    .qz-option.selected { border-color:#2563eb; background:#dbeafe; }
    .qz-option.correct { border-color:#16a34a; background:#dcfce7; }
    .qz-option.wrong { border-color:#dc2626; background:#fef2f2; }
    .qz-result { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:16px; gap:12px; }
    .qz-result h2 { font-size:clamp(14px,3vw,20px); font-weight:700; }
  `,
  js: `
    function renderQuiz(root, cfg) {
      var options = cfg.options || [];
      if (!options.length) { renderPlaceholder(root, cfg); return; }

      var html = '<div class="qz-container"><div id="qz-question" class="qz-question"><h2>' + sanitize(cfg.question || '') + '</h2><div class="qz-options">';
      for (var i = 0; i < options.length; i++) {
        html += '<button class="qz-option" data-idx="' + i + '" data-correct="' + (!!options[i].isCorrect) + '">' + sanitize(options[i].text || '') + '</button>';
      }
      html += '</div></div><div id="qz-result" class="qz-result" style="display:none"><h2>' + sanitize(cfg.resultText || '') + '</h2>';
      if (cfg.ctaText) { html += '<a class="sb-cta" href="' + sanitize(cfg.ctaUrl || '#') + '" target="_blank" rel="noopener" style="background-color:#2563eb">' + sanitize(cfg.ctaText) + '</a>'; }
      html += '</div></div>';
      root.innerHTML = html;

      var btns = root.querySelectorAll('.qz-option');
      for (var b = 0; b < btns.length; b++) {
        btns[b].addEventListener('click', function(e) {
          var btn = e.currentTarget;
          var idx = btn.getAttribute('data-idx');
          var isCorrect = btn.getAttribute('data-correct') === 'true';
          
          if (typeof window.ScrollTodaySDK !== 'undefined') {
            window.ScrollTodaySDK.track('engagement', { type: 'quiz', choice: idx, correct: isCorrect });
          }
          
          for (var j = 0; j < btns.length; j++) {
            btns[j].disabled = true;
            btns[j].classList.add(btns[j].getAttribute('data-correct') === 'true' ? 'correct' : 'wrong');
          }
          btn.classList.add('selected');
          setTimeout(function() {
            document.getElementById('qz-question').style.display = 'none';
            document.getElementById('qz-result').style.display = 'flex';
          }, 1000);
        });
      }
    }
  `,
}
