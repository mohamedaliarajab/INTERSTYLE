/* ==========================================================================
   INTERSTYLE — Preloader

   Warms the imagery for the landing page AND the brand pages behind it, so
   the site is effectively loaded in one go and moving between pages is
   instant. Progress is real: it counts the assets as they arrive.

   Gallery photography (the pop-ups) is deliberately NOT preloaded — that is
   ~7MB sitting behind a click, and holding the entry screen for it would
   punish anyone on a mobile connection. It loads on demand instead.
   ========================================================================== */

(function () {
  'use strict';

  var root = document.documentElement;
  var el = document.querySelector('[data-preloader]');
  if (!el) return;

  // Already loaded earlier in this visit, so the head script left the loader
  // off: nothing to wait for, take it out of the page straight away.
  if (!root.classList.contains('is-preloading')) {
    if (el.parentNode) el.parentNode.removeChild(el);
    return;
  }

  var field = el.querySelector('[data-preloader-pixels]');
  var pct   = el.querySelector('[data-preloader-pct]');

  /* --- Build the pixel field ----------------------------------------------
     Cells are sorted by column with a little random jitter, so the fill
     advances left to right while looking scattered rather than wiped. */
  var COLS = 12, ROWS = 12;
  var cells = [];

  if (field) {
    field.style.setProperty('--cols', COLS);
    field.style.setProperty('--rows', ROWS);

    var order = [];
    for (var c = 0; c < COLS; c++) {
      for (var rw = 0; rw < ROWS; rw++) {
        order.push({ col: c, row: rw, key: c + Math.random() * 0.92 });
      }
    }
    order.sort(function (a, b) { return a.key - b.key; });

    var frag = document.createDocumentFragment();
    var byPos = {};
    for (var i = 0; i < order.length; i++) {
      var span = document.createElement('span');
      span.className = 'preloader__px';
      span.style.gridColumn = (order[i].col + 1);
      span.style.gridRow = (order[i].row + 1);
      frag.appendChild(span);
      cells.push(span);          // already in fill order
    }
    field.appendChild(frag);
  }

  var litCount = 0;
  function light(n) {
    n = Math.max(0, Math.min(cells.length, n));
    while (litCount < n) { cells[litCount].classList.add('is-on'); litCount++; }
    while (litCount > n) { litCount--; cells[litCount].classList.remove('is-on'); }
  }

  // Everything the visitor sees in the first screens of both journeys.
  var ASSETS = [
    '/assets/img/interstyle-logo.png',
    '/assets/img/interstyle-home-logo.png',
    '/assets/img/interstyle-logo-ondark.png',
    '/assets/img/ambiance/carousel-1.jpg',
    '/assets/img/ambiance/carousel-2.jpg',
    '/assets/img/ambiance/carousel-3.jpg',
    '/assets/img/ambiance/carousel-4.jpg',
    '/assets/img/ambiance/carousel-5.jpg',
    '/assets/img/ambiance/carousel-6.jpg',
    '/assets/img/ambiance/carousel-7.jpg',
    '/assets/img/ambiance/carousel-8.jpg',
    '/assets/img/ambiance/carousel-9.jpg',
    '/assets/img/ambiance/carousel-10.jpg',
    '/assets/img/home/about-1.jpg',
    '/assets/img/home/about-2.jpg',
    '/assets/img/home/about-3.jpg',
    '/assets/img/home/about-4.jpg',
    '/assets/img/home/about-5.jpg',
    '/assets/img/home/about-6.jpg',
    '/assets/img/brands/alumacer.png',
    '/assets/img/brands/ariston.png',
    '/assets/img/brands/astralpool.png',
    '/assets/img/brands/chakra.png',
    '/assets/img/brands/ecoceramic.jpg',
    '/assets/img/brands/epsilon-tile.png',
    '/assets/img/brands/ezpeleta.png',
    '/assets/img/brands/febal-casa.png',
    '/assets/img/brands/gala.png',
    '/assets/img/brands/geberit.png',
    '/assets/img/brands/hansgrohe.png',
    '/assets/img/brands/stn-ceramica.png',
    '/assets/img/brands/kludi.png',
    '/assets/img/brands/kohler.png',
    '/assets/img/brands/laticrete.png',
    '/assets/img/brands/legrand.png',
    '/assets/img/brands/living-ceramics.png',
    '/assets/img/brands/noken.png',
    '/assets/img/brands/porcelanosa.png',
    '/assets/img/brands/porte-imic.png',
    '/assets/img/brands/portobello.webp',
    '/assets/img/brands/rak-ceramics.png',
    '/assets/img/brands/rubi.png',
    '/assets/img/brands/sonia.png'
  ];

  // Heroes come in several widths. Loading them through the same srcset and
  // sizes as the brand pages makes the browser fetch exactly the file those
  // pages will ask for on this screen. tools/hero-image.py rewrites these.
  var HERO_SIZES = '(orientation: portrait) 160vw, 112vw';
  var HEROES = [
    { page: 'interstyle', srcset: '/assets/img/ambiance/hero-bathroom-9eeba7-1280.jpg 1280w, /assets/img/ambiance/hero-bathroom-9eeba7-1920.jpg 1920w, /assets/img/ambiance/hero-bathroom-9eeba7-2560.jpg 2560w, /assets/img/ambiance/hero-bathroom-9eeba7-3480.jpg 3480w, /assets/img/ambiance/hero-bathroom-9eeba7-4800.jpg 4800w, /assets/img/ambiance/hero-bathroom-9eeba7-6408.jpg 6408w' },
    { page: 'home', srcset: '/assets/img/home/hero-showroom-3a89ab-1280.jpg 1280w, /assets/img/home/hero-showroom-3a89ab-1920.jpg 1920w, /assets/img/home/hero-showroom-3a89ab-2560.jpg 2560w, /assets/img/home/hero-showroom-3a89ab-3480.jpg 3480w, /assets/img/home/hero-showroom-3a89ab-4800.jpg 4800w, /assets/img/home/hero-showroom-3a89ab-7200.jpg 7200w' }
  ];

  var total    = ASSETS.length + HEROES.length + 1;   // + the document's own load event
  var done     = 0;
  var shown    = 0;                   // the number on screen, eased upward
  var finished = false;
  var MIN_MS   = 900;                 // never flash past too quickly
  var started  = Date.now();

  function target() {
    return Math.round((done / total) * 100);
  }

  // Ease the counter toward the real figure. Time-based, not frame-based:
  // easing per frame made the count crawl whenever the frame rate dropped
  // (background tab, slow device) even though the assets were already in.
  var last = 0;
  var timer = null;

  function tick() {
    var now = Date.now();
    if (!last) last = now;
    var dt = Math.min(120, now - last);
    last = now;

    var want = target();
    // Converge ~63% of the remaining distance every 180ms, whatever the fps.
    shown += (want - shown) * (1 - Math.exp(-dt / 180));
    if (want - shown < 0.6) shown = want;
    if (shown > 100) shown = 100;

    var n = Math.round(shown);
    if (pct) pct.textContent = n;
    light(Math.round((shown / 100) * cells.length));

    if (n >= 100 && done >= total) {
      clearInterval(timer);
      complete();
    }
  }

  function step() {
    done++;
    if (done >= total) {
      var wait = Math.max(0, MIN_MS - (Date.now() - started));
      setTimeout(function () { /* let the counter catch up */ }, wait);
    }
  }

  function complete() {
    if (finished) return;
    // ?holdloader keeps the loader on screen for design work.
    if (/[?&]holdloader/.test(location.search)) return;
    var wait = Math.max(0, MIN_MS - (Date.now() - started));
    finished = true;
    try { sessionStorage.setItem('interstyle-loaded', '1'); } catch (e) {}
    setTimeout(function () {
      el.classList.add('is-done');
      root.classList.remove('is-preloading');
      // Drop it from the tree once the fade has run.
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 800);
    }, wait + 260);
  }

  ASSETS.forEach(function (src) {
    var img = new Image();
    img.onload = img.onerror = step;   // a missing file must not stall entry
    img.src = src;
  });

  HEROES.forEach(function (hero) {
    var img = new Image();
    img.onload = img.onerror = step;
    img.sizes = HERO_SIZES;            // sizes first, so the pick uses it
    img.srcset = hero.srcset;
  });

  if (document.readyState === 'complete') step();
  else window.addEventListener('load', step);

  // Absolute backstop: never trap a visitor behind the loader.
  setTimeout(function () { done = total; }, 12000);

  // A timer rather than requestAnimationFrame: rAF stops dead in a background
  // tab, which would leave the loader frozen mid-count until the tab is
  // focused. setInterval throttles but never stalls.
  timer = setInterval(tick, 33);
  tick();
})();
