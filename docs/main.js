/* ============================================================
   cc-status — Terminal HUD landing page
   ============================================================ */

(function () {
  'use strict';

  // ── Render the terminal block with ANSI coloring ──
  function renderTerminal() {
    const el = document.getElementById('term-body');
    if (!el) return;

    // Line 1: session
    const line1 = [
      '<span class="t-white">opencode-bridge</span>',
      '<span class="t-dim">:</span>',
      '<span class="t-white">main</span>',
      ' <span class="t-dim">|</span> ',
      '<span class="t-cyan">[Opus 4.5]</span>',
      ' <span class="t-dim">|</span> ',
      '<span class="t-white">5m</span>',
      ' <span class="t-dim">|</span> ',
      '<span class="t-dim">+230/-34</span>',
      ' <span class="t-dim">|</span> ',
      '<span class="bar-glow">',
        '<span class="t-green">[</span>',
        '<span class="t-green" id="ctx-fill"></span>',
        '<span class="t-dim" id="ctx-empty"></span>',
        '<span class="t-green">]</span>',
      '</span>',
      ' <span class="t-green">74%</span>',
      ' <span class="t-dim">120K\u2193</span><span class="t-dim">15K\u2191</span>',
    ].join('');

    // Line 2: info
    const line2 = [
      '<span class="t-green">$42.0\u00a2 $5.04/h</span>',
      ' <span class="t-dim">|</span> ',
      '<span class="t-dim">27K/m</span>',
      ' <span class="t-dim">|</span> ',
      '<span class="t-dim">api 28%</span>',
      ' <span class="t-dim">|</span> ',
      '<span class="t-blue">cache 4%</span>',
      ' <span class="t-dim">|</span> ',
      '<span class="t-dim">3 MCPs</span>',
    ].join('');

    // Line 3: soul
    const line3 = [
      '<span class="t-magenta">*</span>',
      ' <span class="t-dim">v3.30.1</span>',
      ' <span class="t-dim">?</span>',
      ' <span class="t-dim">n:</span><span class="t-white">4</span>',
      ' <span class="t-dim">t:</span><span class="t-white">71.0K</span>',
      ' <span class="t-dim">c:</span><span class="t-green">95%</span>',
    ].join('');

    el.innerHTML =
      line1 + '\n' +
      line2 + '\n' +
      line3 + '\n' +
      '<span class="terminal-cursor"></span>';

    animateBar();
  }

  // ── Animate context bar fill ──
  function animateBar() {
    const fillEl = document.getElementById('ctx-fill');
    const emptyEl = document.getElementById('ctx-empty');
    if (!fillEl || !emptyEl) return;

    const total = 15;
    const target = 4; // ~26% used = 74% remaining
    let current = 0;

    function step() {
      if (current <= target) {
        fillEl.textContent = '='.repeat(current);
        emptyEl.textContent = '-'.repeat(total - current);
        current++;
        setTimeout(step, 70);
      }
    }

    fillEl.textContent = '';
    emptyEl.textContent = '-'.repeat(total);
    setTimeout(step, 500);
  }

  // ── Scroll-triggered reveals ──
  function setupObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );

    const selectors = '.section, .module, .reason, .data-item';
    document.querySelectorAll(selectors).forEach((el) => observer.observe(el));
  }

  // ── Copy button ──
  function setupCopy() {
    document.querySelectorAll('.copy-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const text = btn.dataset.copy;
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
          btn.classList.add('copied');
          setTimeout(() => btn.classList.remove('copied'), 1400);
        });
      });
    });
  }

  // ── Init ──
  document.addEventListener('DOMContentLoaded', () => {
    renderTerminal();
    setupObserver();
    setupCopy();
  });
})();
