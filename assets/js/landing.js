/* ==========================================================================
   INTERSTYLE — Landing interactions

   The ENTER anchors are the real navigation; everything here is enhancement.
   With JavaScript disabled the page still works: two links, two destinations.
   ========================================================================== */

(function () {
  'use strict';

  var split  = document.querySelector('[data-split]');
  if (!split) return;

  var panels = Array.prototype.slice.call(split.querySelectorAll('[data-panel]'));
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var EXIT_MS = 760;
  var navigating = false;

  /* --- Enter a brand path -------------------------------------------------- */

  function enter(panel, event) {
    var link = panel.querySelector('[data-enter]');
    if (!link || navigating) return;

    if (event) event.preventDefault();

    if (reduceMotion.matches) {
      window.location.href = link.href;
      return;
    }

    navigating = true;

    panels.forEach(function (p) {
      p.classList.add(p === panel ? 'is-chosen' : 'is-leaving');
    });
    split.classList.add('is-exiting');

    window.setTimeout(function () {
      window.location.href = link.href;
    }, EXIT_MS);
  }

  /* --- Wiring -------------------------------------------------------------- */

  panels.forEach(function (panel) {
    var link = panel.querySelector('[data-enter]');

    // The whole panel is a target, not just the button.
    panel.addEventListener('click', function (event) {
      // Let modified clicks (new tab, download) behave normally.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      enter(panel, event);
    });

    // Warm the destination the moment intent is shown.
    var prefetched = false;
    function prefetch() {
      if (prefetched || !link) return;
      prefetched = true;
      var hint = document.createElement('link');
      hint.rel = 'prefetch';
      hint.href = link.getAttribute('href');
      document.head.appendChild(hint);
    }
    panel.addEventListener('pointerenter', prefetch, { once: true });
    panel.addEventListener('focusin', prefetch, { once: true });
  });

  /* --- Keyboard: arrow between the two paths ------------------------------- */

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    var links = panels.map(function (p) { return p.querySelector('[data-enter]'); });
    var current = links.indexOf(document.activeElement);
    var next = event.key === 'ArrowRight'
      ? Math.min(links.length - 1, current + 1)
      : Math.max(0, current - 1);

    if (current === -1) next = event.key === 'ArrowRight' ? 1 : 0;
    if (links[next]) {
      links[next].focus();
      event.preventDefault();
    }
  });

  /* --- Pointer parallax ----------------------------------------------------
     The landing does not scroll, so depth comes from the pointer instead:
     content, texture and the blueprint rule drift by different amounts, the
     backgrounds moving against the content. Values are lerped each frame so
     it glides rather than snapping to the cursor.
     -------------------------------------------------------------------------- */

  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  if (finePointer.matches && !reduceMotion.matches) {
    var layers = [];

    function collect(sel, depth) {
      $$(sel).forEach(function (el) {
        layers.push({ el: el, depth: depth, x: 0, y: 0, tx: 0, ty: 0 });
      });
    }

    collect('.panel__drift', 12);
    collect('.panel__texture', -26);      // negative: moves against the content

    var running = false;

    function frame() {
      var moving = false;
      layers.forEach(function (l) {
        l.x += (l.tx - l.x) * 0.08;
        l.y += (l.ty - l.y) * 0.08;
        if (Math.abs(l.tx - l.x) > 0.05 || Math.abs(l.ty - l.y) > 0.05) moving = true;
        l.el.style.transform = 'translate3d(' + l.x.toFixed(2) + 'px,' + l.y.toFixed(2) + 'px,0)';
      });
      if (moving) window.requestAnimationFrame(frame);
      else running = false;
    }

    window.addEventListener('pointermove', function (e) {
      var nx = (e.clientX / window.innerWidth) - 0.5;
      var ny = (e.clientY / window.innerHeight) - 0.5;
      layers.forEach(function (l) {
        l.tx = nx * l.depth;
        l.ty = ny * l.depth;
      });
      if (!running) { running = true; window.requestAnimationFrame(frame); }
    }, { passive: true });

    // Settle back to centre when the pointer leaves the window.
    window.addEventListener('pointerleave', function () {
      layers.forEach(function (l) { l.tx = 0; l.ty = 0; });
      if (!running) { running = true; window.requestAnimationFrame(frame); }
    });
  }

  /* --- Returning via the back button restores a clean split ---------------- */

  window.addEventListener('pageshow', function (event) {
    if (!event.persisted) return;
    navigating = false;
    split.classList.remove('is-exiting');
    panels.forEach(function (p) {
      p.classList.remove('is-chosen', 'is-leaving');
    });
  });
})();
