/* ==========================================================================
   INTERSTYLE — Offline support (registers /sw.js)

   Once the worker is running, hand it everything this page loaded before
   it took control — including the hero width the browser picked for this
   screen — then ask it to save the rest of the site in the background.
   The gallery download is skipped when the visitor has Data Saver on or is
   on a 2G connection; those galleries still save as they are opened.
   ========================================================================== */

(function () {
  'use strict';

  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').then(function () {
      return navigator.serviceWorker.ready;
    }).then(function (reg) {
      var worker = reg.active;
      if (!worker) return;

      var loaded = [];
      if (window.performance && performance.getEntriesByType) {
        loaded = performance.getEntriesByType('resource').map(function (e) { return e.name; });
      }
      worker.postMessage({ type: 'save', urls: loaded });

      var c = navigator.connection;
      var frugal = c && (c.saveData || /2g$/.test(c.effectiveType || ''));
      if (!frugal) worker.postMessage({ type: 'save-all' });
    }).catch(function () { /* offline support is a bonus, never an error */ });
  });
})();
