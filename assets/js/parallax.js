/* ==========================================================================
   INTERSTYLE — Parallax + scroll reveal

   One rAF loop drives every layer. Elements opt in with:
     data-parallax="0.25"          translate factor relative to scroll
     data-parallax-fade            additionally fades the hero content out
     data-inview                   one-shot reveal when it enters the viewport
   ========================================================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------------------------------------------------------- reveal */

  var revealTargets = document.querySelectorAll('[data-inview]');

  if (!('IntersectionObserver' in window) || reduceMotion.matches) {
    Array.prototype.forEach.call(revealTargets, function (el) {
      el.classList.add('is-inview');
    });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-inview');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(revealTargets, function (el, i) {
      el.style.transitionDelay = (i % 4) * 90 + 'ms';
      observer.observe(el);
    });
  }

  /* -------------------------------------------------------------- parallax */

  var layers = Array.prototype.map.call(
    document.querySelectorAll('[data-parallax]'),
    function (el) {
      return {
        el: el,
        speed: parseFloat(el.getAttribute('data-parallax')) || 0,
        fade: el.hasAttribute('data-parallax-fade'),
        top: 0,
        height: 0
      };
    }
  );

  if (!layers.length || reduceMotion.matches) return;

  var viewportHeight = window.innerHeight;
  var ticking = false;

  function measure() {
    viewportHeight = window.innerHeight;
    var scrollY = window.pageYOffset;
    layers.forEach(function (layer) {
      // Neutralise the current transform so the measurement is the true position.
      layer.el.style.transform = '';
      var rect = layer.el.getBoundingClientRect();
      layer.top = rect.top + scrollY;
      layer.height = rect.height;
    });
    render();
  }

  function render() {
    var scrollY = window.pageYOffset;

    layers.forEach(function (layer) {
      // Progress of this layer through the viewport, centred on 0.
      var centre = layer.top + layer.height / 2;
      var delta = (scrollY + viewportHeight / 2) - centre;

      // Only pay for layers that are actually near the viewport.
      if (Math.abs(delta) > viewportHeight * 1.6 + layer.height) return;

      var shift = delta * layer.speed;
      layer.el.style.transform = 'translate3d(0,' + shift.toFixed(2) + 'px,0)';

      if (layer.fade) {
        var progress = Math.min(1, Math.max(0, scrollY / (viewportHeight * 0.75)));
        layer.el.style.opacity = String(1 - progress);
      }
    });

    ticking = false;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(render);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  measure();
})();
