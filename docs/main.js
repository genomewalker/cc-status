/* ============================================================
   CC-STATUS — Cockpit HUD Interface
   Terminal demo · sweep · scroll reveals · copy
   ============================================================ */

(function () {
  'use strict';

  // ── Render terminal demo ──
  function renderTerminal() {
    var conv = document.getElementById('terminal-conv');
    var status = document.getElementById('terminal-status');
    if (!conv || !status) return;

    conv.innerHTML = [
      '<span class="t-dim">&gt; </span><span class="t-text">I\'ll help implement that feature. Let me read the</span>',
      '<span class="t-text">  relevant files first.</span>',
      '',
      '<span class="t-muted">  Reading src/server.ts...</span>',
      '<span class="t-green">  \u2713 Read src/server.ts</span><span class="t-dim"> (245 lines)</span>',
      '',
      '<span class="t-text">  I see the issue in the request handler. The</span>',
      '<span class="t-text">  validation runs after the transform, but it</span>',
      '<span class="t-text">  should run before.</span> <span class="terminal-cursor"></span>',
    ].join('\n');

    var line1 = [
      '<span class="t-white">myproject</span>',
      '<span class="t-dim">:</span>',
      '<span class="t-white">main</span>',
      ' <span class="t-dim">|</span> ',
      '<span class="t-teal">[Opus 4.5]</span>',
      ' <span class="t-dim">|</span> ',
      '<span class="t-white">5m</span>',
      ' <span class="t-dim">|</span> ',
      '<span class="t-dim">+230/-34</span>',
      ' <span class="t-dim">|</span> ',
      '<span class="t-green">[</span>',
      '<span class="t-green" id="bar-fill"></span>',
      '<span class="t-dim" id="bar-empty"></span>',
      '<span class="t-green">]</span>',
      ' <span class="t-green">74%</span>',
      ' <span class="t-dim">120K\u2193 15K\u2191</span>',
    ].join('');

    var line2 = [
      '<span class="t-green">42.0\u00A2 $5.04/h</span>',
      ' <span class="t-dim">|</span> ',
      '<span class="t-dim">27K/m</span>',
      ' <span class="t-dim">|</span> ',
      '<span class="t-dim">wait 28%</span>',
      ' <span class="t-dim">|</span> ',
      '<span class="t-teal">cache 4%</span>',
      ' <span class="t-dim">|</span> ',
      '<span class="t-dim">3 MCPs</span>',
    ].join('');

    var line3 = [
      '<span class="t-magenta">*</span>',
      ' <span class="t-dim">v3.30.1</span>',
      ' <span class="t-dim">n:</span><span class="t-white">4</span>',
      ' <span class="t-dim">t:</span><span class="t-white">71.0K</span>',
      ' <span class="t-dim">c:</span><span class="t-green">95%</span>',
    ].join('');

    status.innerHTML = line1 + '\n' + line2 + '\n' + line3;
    animateBar();
  }

  // ── Animate context bar ──
  function animateBar() {
    var fill = document.getElementById('bar-fill');
    var empty = document.getElementById('bar-empty');
    if (!fill || !empty) return;

    var total = 15;
    var target = 4;
    var current = 0;

    function step() {
      if (current <= target) {
        fill.textContent = '='.repeat(current);
        empty.textContent = '-'.repeat(total - current);
        current++;
        setTimeout(step, 80);
      }
    }

    fill.textContent = '';
    empty.textContent = '-'.repeat(total);
    setTimeout(step, 600);
  }

  // ── Scroll reveals ──
  function setupObserver() {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) e.target.classList.add('in-view');
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );

    document.querySelectorAll('.reveal')
      .forEach(function (el) { observer.observe(el); });
  }

  // ── Copy button ──
  function setupCopy() {
    document.querySelectorAll('.copy-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = btn.dataset.copy;
        if (!text) return;
        navigator.clipboard.writeText(text).then(function () {
          btn.classList.add('copied');
          setTimeout(function () { btn.classList.remove('copied'); }, 1400);
        });
      });
    });
  }

  // ── Mobile nav toggle ──
  function setupNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('header nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('nav-open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Close menu on link click
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('nav-open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ── Init ──
  document.addEventListener('DOMContentLoaded', function () {
    renderTerminal();
    setupObserver();
    setupCopy();
    setupNav();
  });
})();
