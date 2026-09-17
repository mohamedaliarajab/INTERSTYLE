/* ==========================================================================
   INTERSTYLE — Service worker: load once, browse offline

   Pages     network first (fresh copy when online); after 3s on a slow
             connection, or with no connection, the saved copy is served.
   CSS / JS  cache first. Links carry a content hash (?v=…), so a changed
             file is a new URL and can never be served stale.
   Images    cache first, refreshed quietly in the background. Filenames
             are never reused for a different picture (see INTERSTYLE.md).
   Fonts     Google Fonts, cached on first use.

   After the first visit the page asks this worker to save everything it
   has already loaded, the images on all three pages, and — unless the
   visitor has Data Saver on — the gallery photography, so the whole site
   browses with no connection.

   VERSION is stamped by tools/version-assets.py whenever CSS or JS
   changes; a new version re-saves the pages and drops the old files.
   ========================================================================== */

'use strict';

var VERSION = 'da97eb37';
var CORE  = 'interstyle-core-' + VERSION;   // pages, CSS, JS
var MEDIA = 'interstyle-media';             // photography and logos
var FONTS = 'interstyle-fonts';

var PAGES = ['/', '/interstyle/', '/home/'];
var DATA  = ['/assets/js/products.js', '/assets/js/products-home.js'];
var FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
var NETWORK_WAIT = 3000;

/* --- Install: save the three pages and every stylesheet and script they
       link to, straight from the network ---------------------------------- */

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CORE).then(function (cache) {
      return Promise.all(PAGES.map(function (page) {
        return fetch(page, { cache: 'reload' }).then(function (res) {
          if (!res.ok) throw new Error(page + ' ' + res.status);
          return res.clone().text().then(function (html) {
            var assets = match(html, /(?:href|src)="(\/assets\/(?:css|js)\/[^"]+)"/g);
            return Promise.all([cache.put(page, res)].concat(assets.map(function (url) {
              return cache.match(url).then(function (hit) {
                return hit || fetch(url, { cache: 'reload' }).then(function (r) {
                  if (r.ok) return cache.put(url, r);
                });
              });
            })));
          });
        });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k.indexOf('interstyle-core-') === 0 && k !== CORE;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* --- Requests --------------------------------------------------------------- */

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;                 // form posts go straight out
  var url = new URL(req.url);

  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate')                    return event.respondWith(page(req, event));
    if (/^\/assets\/(css|js)\//.test(url.pathname)) return event.respondWith(cacheFirst(req, CORE));
    if (/^\/assets\/img\//.test(url.pathname))      return event.respondWith(image(req, event));
    return;
  }
  if (FONT_HOSTS.indexOf(url.hostname) !== -1)      return event.respondWith(cacheFirst(fontRequest(req.url), FONTS));
});

function page(req, event) {
  var network = fetch(req).then(function (res) {
    // A redirected response cannot be replayed for a navigation, so only
    // direct answers are kept.
    if (res.ok && !res.redirected) {
      var copy = res.clone();
      event.waitUntil(caches.open(CORE).then(function (c) { return c.put(pathOf(req.url), copy); }));
    }
    return res;
  });

  var saved = caches.open(CORE).then(function (c) {
    var path = pathOf(req.url);
    return c.match(path)
      .then(function (hit) { return hit || c.match(path.replace(/\/?$/, '/')); })
      .then(function (hit) { return hit || c.match('/'); });
  });

  // Whichever is useful first: the network, or — once it is clearly slow or
  // has failed — the saved page.
  return new Promise(function (resolve) {
    var done = false;
    function useSaved() {
      saved.then(function (hit) { if (!done && hit) { done = true; resolve(hit); } });
    }
    var timer = setTimeout(useSaved, NETWORK_WAIT);
    network.then(function (res) {
      clearTimeout(timer);
      if (!done) { done = true; resolve(res); }
    }, function () {
      clearTimeout(timer);
      saved.then(function (hit) {
        if (!done) { done = true; resolve(hit || Response.error()); }
      });
    });
  });
}

function cacheFirst(req, name) {
  return caches.open(name).then(function (cache) {
    // Google Fonts varies its CSS by browser; this device only ever asks as itself.
    return cache.match(req, { ignoreVary: true }).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res.ok) cache.put(req, res.clone());
        return res;
      });
    });
  });
}

// Fetch fonts with CORS so the saved copy is a readable response rather than
// an opaque one (opaque entries count as several MB each against storage).
function fontRequest(href) {
  return new Request(href, { mode: 'cors', credentials: 'omit' });
}

function image(req, event) {
  return caches.open(MEDIA).then(function (cache) {
    var key = pathOf(req.url);
    return cache.match(key).then(function (hit) {
      var fresh = fetch(req).then(function (res) {
        if (res.ok) return cache.put(key, res.clone()).then(function () { return res; });
        return res;
      });
      if (hit) {
        event.waitUntil(fresh.catch(function () {}));
        return hit;
      }
      // Offline and never saved at this width: any saved width of the same
      // hero will do (hero-<name>-<hash>-<width>.jpg).
      return fresh.catch(function () { return otherWidth(cache, key); });
    });
  });
}

function otherWidth(cache, path) {
  var m = /^(.*\/hero-[a-z0-9]+-[0-9a-f]{6}-)\d+\.jpg$/.exec(path);
  if (!m) return Response.error();
  return cache.keys().then(function (keys) {
    var best = null, bestW = 0;
    keys.forEach(function (k) {
      var p = pathOf(k.url);
      if (p.indexOf(m[1]) !== 0) return;
      var w = parseInt(p.slice(m[1].length), 10);
      if (w > bestW) { best = k; bestW = w; }
    });
    return best ? cache.match(best) : Response.error();
  });
}

/* --- Messages from the page ------------------------------------------------ */

self.addEventListener('message', function (event) {
  var msg = event.data || {};
  if (msg.type === 'save')     event.waitUntil(save(msg.urls || []));
  if (msg.type === 'save-all') event.waitUntil(saveAll());
});

// URLs the page loaded before this worker was in control.
function save(urls) {
  return queue(urls.filter(function (u) {
    var url = new URL(u, self.location.href);
    return url.origin === self.location.origin
      ? /^\/assets\/img\//.test(url.pathname)
      : FONT_HOSTS.indexOf(url.hostname) !== -1;
  }));
}

// Every image on the three pages, then the gallery photography.
function saveAll() {
  return caches.open(CORE).then(function (cache) {
    return Promise.all(PAGES.concat(DATA).map(function (p) {
      return cache.match(p, { ignoreSearch: true }).then(function (hit) {
        return hit ? hit.text() : fetch(p).then(function (r) { return r.ok ? r.text() : ''; });
      }).catch(function () { return ''; });
    }));
  }).then(function (texts) {
    var pages = texts.slice(0, PAGES.length).join('\n');
    var data  = texts.slice(PAGES.length).join('\n');
    // Page images by their plain src (the hero src is its 1920 width); the
    // gallery paths are quoted strings in the data files.
    return queue(match(pages, /\ssrc="(\/assets\/img\/[^"]+)"/g)
      .concat(match(data, /['"](\/assets\/img\/[^'"]+)['"]/g)));
  });
}

// Two at a time, skipping anything already saved, so a slow connection is
// never flooded and an interrupted run simply resumes next visit.
function queue(urls) {
  var list = urls.filter(function (u, i) { return urls.indexOf(u) === i; });
  return caches.open(MEDIA).then(function (media) {
    return caches.open(FONTS).then(function (fonts) {
      var i = 0;
      function worker() {
        if (i >= list.length) return Promise.resolve();
        var u = list[i++];
        var url = new URL(u, self.location.href);
        var own = url.origin === self.location.origin;
        var cache = own ? media : fonts;
        var key = own ? url.pathname : url.href;
        return cache.match(key, { ignoreVary: true }).then(function (hit) {
          if (hit) return;
          return fetch(own ? key : fontRequest(url.href))
            .then(function (res) { if (res.ok) return cache.put(own ? key : fontRequest(url.href), res); });
        }).catch(function () {}).then(worker);
      }
      return Promise.all([worker(), worker()]);
    });
  });
}

function match(text, re) {
  var out = [], m;
  while ((m = re.exec(text))) out.push(m[1]);
  return out;
}

function pathOf(href) {
  return new URL(href, self.location.href).pathname;
}
