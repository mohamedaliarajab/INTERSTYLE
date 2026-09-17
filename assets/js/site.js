/* ==========================================================================
   INTERSTYLE — Brand page behaviour
   Nav · scroll reveal · about carousel · product modal · contact form
   ========================================================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  // Gallery files get saved as .png / .jpeg / .webp as often as .jpg, so before
  // declaring an image missing, retry the same basename with the other common
  // extensions. Only ever costs extra requests on slots that are genuinely empty.
  var ALT_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

  function markMissing(imgs, onFail, probeExtensions) {
    imgs.forEach(function (img) {
      var tried = 0;
      var base = (img.getAttribute('src') || '').replace(/\.[A-Za-z0-9]+$/, '');

      function fail() {
        if (!probeExtensions) { onFail(img); return; }
        while (tried < ALT_EXT.length) {
          var ext = ALT_EXT[tried++];
          if (img.getAttribute('src') !== base + ext) {
            img.setAttribute('src', base + ext);
            return;
          }
        }
        onFail(img);
      }

      img.addEventListener('error', fail);
      if (img.complete && img.naturalWidth === 0) fail();
    });
  }

  /* ====================================================================== 1
     Navigation — solid on scroll, drawer on small screens
     ====================================================================== */

  var nav = $('[data-nav]');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('is-scrolled', window.pageYOffset > 60);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var toggle = $('[data-nav-toggle]', nav);
    if (toggle) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      // Any link inside the drawer closes it.
      $$('a', nav).forEach(function (a) {
        a.addEventListener('click', function () {
          nav.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  /* ====================================================================== 1b
     Back to top — shows once the hero is behind you, and docks above the
     footer bar so it never sits on top of the copyright line
     ====================================================================== */

  var toTop = $('[data-to-top]');
  if (toTop) {
    var footBar = $('.footer__bar');
    var lastLift = -1;

    var placeToTop = function () {
      var vh = window.innerHeight;
      toTop.classList.toggle('is-visible', window.pageYOffset > vh * 0.9);

      // Lift by however much of the footer bar has scrolled into view.
      var lift = footBar ? Math.max(0, Math.round(vh - footBar.getBoundingClientRect().top)) : 0;
      if (lift !== lastLift) {
        toTop.style.setProperty('--to-top-lift', lift + 'px');
        lastLift = lift;
      }
    };

    window.addEventListener('scroll', placeToTop, { passive: true });
    window.addEventListener('resize', placeToTop);
    window.addEventListener('orientationchange', placeToTop);
    window.addEventListener('load', placeToTop);
    placeToTop();

    toTop.addEventListener('click', function (e) {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      // Activated from the keyboard (detail 0): move focus back to the top as
      // well, so the next Tab starts from the nav rather than the footer.
      var brand = $('.nav__brand');
      if (e.detail === 0 && brand) brand.focus({ preventScroll: true });
    });
  }

  /* ====================================================================== 1c
     Client reviews — four reviews picked at random on every visit; "See
     other reviews" moves through the rest. The hero badge shows the overall
     Google rating.
     Data: assets/js/reviews.js. Runs before the reveal setup below so the
     first cards fade in with the rest of the page.
     ====================================================================== */

  var REVIEWS = window.INTERSTYLE_REVIEWS;
  var reviewsSection = $('[data-reviews]');
  if (reviewsSection && REVIEWS && REVIEWS.reviews && REVIEWS.reviews.length) {
    var places = REVIEWS.places || [];
    var total = places.reduce(function (n, p) { return n + p.count; }, 0);
    var score = total
      ? places.reduce(function (s, p) { return s + p.rating * p.count; }, 0) / total
      : 5;
    var fillStars = function (el, value) { el.style.setProperty('--pct', (value / 5 * 100) + '%'); };

    $$('[data-reviews-score]').forEach(function (el) { el.textContent = score.toFixed(1); });
    $$('[data-reviews-count]').forEach(function (el) { el.textContent = total; });
    $$('[data-reviews-stars]').forEach(function (el) { fillStars(el, score); });
    var badge = $('[data-reviews-badge]');
    if (badge && total) badge.hidden = false;

    // A fresh random order on every visit.
    var pool = REVIEWS.reviews.slice();
    for (var ri = pool.length - 1; ri > 0; ri--) {
      var rj = Math.floor(Math.random() * (ri + 1));
      var swap = pool[ri]; pool[ri] = pool[rj]; pool[rj] = swap;
    }

    var PER_VIEW = 4;
    var first = 0;
    var reviewList = $('[data-reviews-list]', reviewsSection);

    var reviewCard = function (item) {
      var li = document.createElement('li');
      li.className = 'review';
      var stars = document.createElement('span');
      stars.className = 'stars';
      stars.setAttribute('role', 'img');
      stars.setAttribute('aria-label', item.stars + ' out of 5 stars');
      fillStars(stars, item.stars);
      var quote = document.createElement('blockquote');
      quote.className = 'review__text';
      quote.textContent = item.text;
      var by = document.createElement('p');
      by.className = 'review__by';
      var name = document.createElement('span');
      name.className = 'review__name';
      name.textContent = item.name;
      var src = document.createElement('span');
      src.className = 'review__src';
      src.textContent = item.city + ' · Google review';
      by.appendChild(name);
      by.appendChild(src);
      li.appendChild(stars);
      li.appendChild(quote);
      li.appendChild(by);
      return li;
    };

    var showReviews = function (onLoad) {
      reviewList.innerHTML = '';
      for (var k = 0; k < Math.min(PER_VIEW, pool.length); k++) {
        var cardEl = reviewCard(pool[(first + k) % pool.length]);
        // First set reveals on scroll like the page; later sets fade straight in.
        if (onLoad) cardEl.setAttribute('data-inview', '');
        else cardEl.classList.add('is-swapped');
        reviewList.appendChild(cardEl);
      }
    };
    showReviews(true);

    var moreReviews = $('[data-reviews-more]', reviewsSection);
    if (moreReviews) {
      moreReviews.hidden = pool.length <= PER_VIEW;
      moreReviews.addEventListener('click', function () {
        first = (first + PER_VIEW) % pool.length;
        showReviews(false);
        reviewList.scrollLeft = 0;
      });
    }

    reviewsSection.hidden = false;
  }

  /* ====================================================================== 2
     Scroll reveal
     ====================================================================== */

  var revealTargets = $$('[data-inview]');
  if (!('IntersectionObserver' in window) || reduceMotion.matches) {
    revealTargets.forEach(function (el) { el.classList.add('is-inview'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var target = entry.target;
        target.classList.add('is-inview');
        io.unobserve(target);
        // The stagger delay is only for the entrance; clear it afterwards so
        // hover effects (card zoom) respond immediately.
        setTimeout(function () { target.style.transitionDelay = ''; }, 1400);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
    revealTargets.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 80 + 'ms';
      io.observe(el);
    });
  }

  // Footer copyright year: 2026 is in the markup; keep it current from here on.
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Brand logos: a missing file degrades to the brand name.
  markMissing($$('.brand img'), function (img) {
    img.parentNode.classList.add('is-missing');
  });

  // Hero and About photography: degrade to the studio placeholder rather than
  // a broken image, so a page reads properly before its shots are supplied.
  markMissing($$('.hero__media img, .about__carousel .carousel__slide img'), function (img) {
    img.parentNode.classList.add('is-missing');
  }, true);

  /* ====================================================================== 2b
     Parallax — layered depth on scroll

     Elements drift at different rates so the page reads in planes rather
     than as one flat sheet. Everything here is deliberately small: the
     largest move is the hero photograph, and text never travels far enough
     to fight the reading position.
     ====================================================================== */

  // selector, base speed, per-item variance (staggers items in a row)
  var PARALLAX_AUTO = [
    ['.hero__media img',                            0.16, 0],
    ['.about__carousel .carousel__slide img',       0.09, 0],
    ['.section__head',                              0.05, 0],
    ['.about__body',                                0.03, 0],
    ['.statboxes',                                  0.07, 0],
    ['.products .product',                          0.035, 0.5],
    // Product icons drift faster than their card, like the showroom numbers.
    ['.products .product__ic',                      0.16, 0.35],
    ['.brands .brand',                              0.03, 0.6],
    ['.locations .location',                        0.055, 0.55],
    // Showroom numbers drift faster than their card, so each card reads in
    // two planes as the section scrolls past.
    ['.locations .location__n',                     0.16, 0.35],
    ['.contact__list',                              0.045, 0],
    ['.form',                                       0.03, 0],
    ['.footer__brand',                              0.035, 0],
    ['.footer__col',                                0.025, 0.7]
  ];

  PARALLAX_AUTO.forEach(function (rule) {
    $$(rule[0]).forEach(function (el, i) {
      if (el.hasAttribute('data-parallax')) return;      // explicit wins
      var speed = rule[1] * (1 + (i % 3) * rule[2]);
      el.setAttribute('data-parallax', speed.toFixed(3));
    });
  });

  var pxItems = $$('[data-parallax]').map(function (el) {
    return {
      el: el,
      speed: parseFloat(el.getAttribute('data-parallax')) || 0,
      // Photographs need a little scale so drifting never exposes an edge.
      cover: el.tagName === 'IMG',
      last: null
    };
  });

  if (pxItems.length && !reduceMotion.matches) {
    var pxTicking = false;

    function place() {
      var vh = window.innerHeight;

      pxItems.forEach(function (it) {
        var r = it.el.getBoundingClientRect();
        if (r.bottom < -300 || r.top > vh + 300) return;

        // -1 when the element sits a screen below, +1 a screen above.
        var progress = ((r.top + r.height / 2) - vh / 2) / vh;
        if (progress < -1.4) progress = -1.4;
        if (progress > 1.4) progress = 1.4;

        var y = -progress * it.speed * 100;
        var t = it.cover
          ? 'translate3d(0,' + y.toFixed(2) + 'px,0) scale(1.12)'
          : 'translate3d(0,' + y.toFixed(2) + 'px,0)';

        if (t !== it.last) { it.el.style.transform = t; it.last = t; }
      });

      pxTicking = false;
    }

    window.addEventListener('scroll', function () {
      if (pxTicking) return;
      pxTicking = true;
      window.requestAnimationFrame(place);
    }, { passive: true });
    window.addEventListener('resize', place);
    window.addEventListener('load', place);
    place();
  }

  /* ====================================================================== 3
     Carousel — used by the About media panel and by the product modal
     ====================================================================== */

  function Carousel(root, options) {
    var opts = options || {};
    var slides = $$('[data-slide]', root);
    var dots   = $$('[data-dot]', root);
    var count  = $('[data-count]', root);
    var index  = 0;
    var timer  = null;

    function paint() {
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === index); });
      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === index);
        d.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
      if (count) count.textContent = (index + 1) + ' / ' + slides.length;
      if (opts.onChange) opts.onChange(index);
    }

    function go(n) {
      if (!slides.length) return;
      index = (n + slides.length) % slides.length;
      paint();
    }

    function restart() {
      if (!opts.interval || slides.length < 2 || reduceMotion.matches) return;
      clearInterval(timer);
      timer = setInterval(function () { go(index + 1); }, opts.interval);
    }

    $$('[data-prev]', root).forEach(function (b) {
      b.addEventListener('click', function () { go(index - 1); restart(); });
    });
    $$('[data-next]', root).forEach(function (b) {
      b.addEventListener('click', function () { go(index + 1); restart(); });
    });
    dots.forEach(function (d, i) {
      d.addEventListener('click', function () { go(i); restart(); });
    });

    // Touch: a clear sideways swipe changes the photo. Mostly-vertical moves
    // are left alone so the page (or the pop-up) still scrolls.
    var touchX = null, touchY = 0;
    root.addEventListener('touchstart', function (e) {
      touchX = e.touches.length === 1 ? e.touches[0].clientX : null;
      if (touchX !== null) touchY = e.touches[0].clientY;
    }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (touchX === null || slides.length < 2) return;
      var dx = e.changedTouches[0].clientX - touchX;
      var dy = e.changedTouches[0].clientY - touchY;
      touchX = null;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      go(dx < 0 ? index + 1 : index - 1);
      restart();
    }, { passive: true });

    paint();
    restart();

    return {
      go: function (n) { go(n); restart(); },
      next: function () { go(index + 1); restart(); },
      prev: function () { go(index - 1); restart(); },
      stop: function () { clearInterval(timer); },
      get index() { return index; }
    };
  }

  $$('[data-carousel]').forEach(function (el) {
    Carousel(el, { interval: parseInt(el.getAttribute('data-interval'), 10) || 0 });
  });

  /* ====================================================================== 4
     Product modal — gallery carousel plus information
     ====================================================================== */

  var ARROW_L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  var ARROW_R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';


  var modal = $('[data-modal]');
  var DATA = window.INTERSTYLE_PRODUCTS || {};

  if (modal) {
    var mTitle    = $('[data-modal-title]', modal);
    var mStage    = $('[data-modal-stage]', modal);
    var mThumbs   = $('[data-modal-thumbs]', modal);
    var mDesc     = $('[data-modal-desc]', modal);
    var mFeatures = $('[data-modal-features]', modal);
    var mMore     = $('[data-modal-more]', modal);
    var mRanges   = $('[data-modal-ranges]', modal);
    var mSpecs    = $('[data-modal-specs]', modal);
    var mEnquire  = $('[data-modal-enquire]', modal);
    var mNote     = $('[data-modal-note]', modal);
    var lastFocus = null;
    var gallery   = null;

    // `shuffle: true` in the data keeps the first photo fixed and mixes the
    // rest into a new order each time the pop-up opens.
    function galleryImages(item) {
      var images = (item.images || []).slice();
      if (item.shuffle) {
        for (var i = images.length - 1; i > 1; i--) {
          var j = 1 + Math.floor(Math.random() * i);
          var t = images[i]; images[i] = images[j]; images[j] = t;
        }
      }
      return images;
    }

    function buildStage(item, images) {
      if (!images.length) {
        mStage.innerHTML =
          '<div class="carousel__ph"><span>' + item.title +
          '<br>Photography coming soon</span></div>';
        mThumbs.hidden = true;
        return null;
      }

      var slides = images.map(function (src, i) {
        return '<div class="carousel__slide' + (i === 0 ? ' is-active' : '') +
               '" data-slide><img src="' + src + '" alt="' + item.title +
               ' — image ' + (i + 1) + '"></div>';
      }).join('');

      var controls = '';
      var dots = '';
      if (images.length > 1) {
        dots = images.map(function (_, i) {
          return '<button class="carousel__dot' + (i === 0 ? ' is-active' : '') +
                 '" data-dot type="button" aria-label="Image ' + (i + 1) + '"></button>';
        }).join('');
        controls =
          '<button class="carousel__nav carousel__nav--prev" data-prev type="button" aria-label="Previous image">' + ARROW_L + '</button>' +
          '<button class="carousel__nav carousel__nav--next" data-next type="button" aria-label="Next image">' + ARROW_R + '</button>' +
          '<div class="carousel__dots">' + dots + '</div>' +
          '<div class="carousel__count" data-count>1 / ' + images.length + '</div>';
      }

      mStage.innerHTML = slides + controls;

      mThumbs.hidden = images.length < 2;
      mThumbs.innerHTML = images.map(function (src, i) {
        return '<button class="modal__thumb' + (i === 0 ? ' is-active' : '') +
               '" type="button" aria-label="Show image ' + (i + 1) +
               '"><img src="' + src + '" alt=""></button>';
      }).join('');

      // A file that has not been supplied yet degrades to the studio
      // placeholder instead of a broken-image icon.
      markMissing($$('img', mStage), function (img) {
        img.parentNode.classList.add('is-missing');
      }, true);
      markMissing($$('img', mThumbs), function (img) {
        img.style.visibility = 'hidden';
      }, true);

      // Near-square and portrait photos are shown whole, over a blurred copy
      // of themselves, rather than cropped to the wide frame, which could cut
      // the product itself in half (a water heater, a tap).
      $$('img', mStage).forEach(function (img) {
        function fit() {
          if (!img.naturalWidth || img.naturalWidth / img.naturalHeight >= 1.2) return;
          img.parentNode.classList.add('is-fit');
          img.parentNode.style.setProperty('--slide-bg', 'url("' + (img.currentSrc || img.src) + '")');
        }
        if (img.complete) fit();
        img.addEventListener('load', fit);
      });

      var thumbs = $$('.modal__thumb', mThumbs);
      var car = Carousel(mStage, {
        onChange: function (i) {
          thumbs.forEach(function (t, ti) { t.classList.toggle('is-active', ti === i); });
          // Keep the active thumbnail in view along the strip (sideways only,
          // so the pop-up itself never jumps).
          var active = thumbs[i];
          if (active && mThumbs.scrollWidth > mThumbs.clientWidth) {
            var strip = mThumbs.getBoundingClientRect();
            var box = active.getBoundingClientRect();
            var target = mThumbs.scrollLeft + (box.left - strip.left) - (strip.width - box.width) / 2;
            mThumbs.scrollTo({ left: target, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
          }
        }
      });
      thumbs.forEach(function (t, i) {
        t.addEventListener('click', function () { car.go(i); });
      });
      return car;
    }

    function open(key) {
      var item = DATA[key];
      if (!item) return;

      lastFocus = document.activeElement;

      mTitle.textContent = item.title;
      mDesc.textContent = item.desc || '';

      // Optional long-form sections; each stays hidden when a gallery has none.
      var more = item.more || [];
      mMore.innerHTML = more.map(function (p) { return '<p>' + p + '</p>'; }).join('');
      mMore.hidden = !more.length;

      var ranges = item.ranges || [];
      mRanges.innerHTML = ranges.map(function (r) {
        return '<li><span class="modal__range-nm">' + r[0] + '</span>' +
               '<span class="modal__range-tx">' + r[1] + '</span></li>';
      }).join('');
      mRanges.parentNode.hidden = !ranges.length;

      var features = item.features || [];
      mFeatures.innerHTML = features.map(function (f) { return '<li>' + f + '</li>'; }).join('');
      mFeatures.parentNode.hidden = !features.length;

      var specs = item.details || [];
      mSpecs.innerHTML = specs.map(function (s) {
        return '<dt>' + s[0] + '</dt><dd>' + s[1] + '</dd>';
      }).join('');
      mSpecs.hidden = !specs.length;

      mNote.hidden = !!(item.images && item.images.length);
      mEnquire.setAttribute('data-enquiry', item.enquiry || item.title);

      gallery = buildStage(item, galleryImages(item));

      // A fresh pop-up always starts at the top of its text.
      $('.modal__body', modal).scrollTop = 0;
      $('.modal__info', modal).scrollTop = 0;

      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      $('[data-modal-close]', modal).focus();
    }

    function close() {
      if (gallery) { gallery.stop(); gallery = null; }
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      if (lastFocus) lastFocus.focus();
    }

    $$('[data-product]').forEach(function (card) {
      card.addEventListener('click', function () {
        open(card.getAttribute('data-product'));
      });
    });

    $$('[data-modal-close]', modal).forEach(function (b) {
      b.addEventListener('click', close);
    });
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });

    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (!gallery) return;
      if (e.key === 'ArrowRight') gallery.next();
      if (e.key === 'ArrowLeft')  gallery.prev();
    });

    // "Enquire about this range" — close, jump to the form, preselect the option.
    if (mEnquire) {
      mEnquire.addEventListener('click', function (e) {
        e.preventDefault();
        var want = mEnquire.getAttribute('data-enquiry');
        close();
        var select = $('[data-enquiry-select]');
        if (select) {
          $$('option', select).forEach(function (o) {
            if (o.value === want || o.textContent.trim() === want) select.value = o.value;
          });
        }
        var target = $(mEnquire.getAttribute('href') || '#contact');
        if (target) target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      });
    }
  }

  /* ====================================================================== 5
     Contact form — validate, submit to Netlify Forms, confirm, reset
     ====================================================================== */

  var form = $('[data-form]');
  if (form) {
    var result = $('[data-form-result]', form);
    var submit = $('[type="submit"]', form);
    var label  = submit ? ($('.btn__text', submit) || submit) : null;
    var labelText = label ? label.textContent : 'Send Enquiry';
    var busy = false;

    function say(message, isError) {
      if (!result) return;
      result.textContent = message;
      result.classList.toggle('form__result--error', !!isError);
      result.hidden = false;
    }

    function reset() {
      form.reset();
      form.classList.remove('is-validated');
      if (label) label.textContent = labelText;
      if (submit) { submit.classList.remove('is-sent'); submit.disabled = false; }
      if (result) { result.hidden = true; result.textContent = ''; }
      busy = false;
    }

    // Netlify Forms wants the fields url-encoded, including the form name.
    function encode(fd) {
      var out = [];
      fd.forEach(function (v, k) {
        out.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
      });
      return out.join('&');
    }

    function succeed() {
      if (label) label.textContent = 'Enquiry Sent';
      if (submit) submit.classList.add('is-sent');
      say('Message received, we will get back to you shortly.');
      setTimeout(reset, 5000);
    }

    // Native validation blocks the submit event entirely, so the styling hook
    // has to come from the `invalid` events instead. They do not bubble —
    // hence the capture phase.
    form.addEventListener('invalid', function () {
      form.classList.add('is-validated');
    }, true);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;

      // Every field is required; show the browser's own message on the first
      // one that fails, and mark the rest.
      form.classList.add('is-validated');
      if (!form.checkValidity()) {
        var bad = $(':invalid', form);
        if (bad) {
          bad.focus();
          if (typeof bad.reportValidity === 'function') bad.reportValidity();
        }
        return;
      }

      busy = true;
      if (submit) submit.disabled = true;
      if (label) label.textContent = 'Sending';

      var body = encode(new FormData(form));

      // No form backend when running from a local static server, so confirm
      // the flow rather than reporting a failure that is not real.
      var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
      if (local) { setTimeout(succeed, 700); return; }

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        succeed();
      }).catch(function () {
        if (label) label.textContent = labelText;
        if (submit) submit.disabled = false;
        busy = false;
        // The site itself still browses offline, so say why the send failed.
        say(navigator.onLine === false
          ? 'You are offline, so your enquiry was not sent. Please try again once you are connected, or call 0706 667 7555.'
          : 'Sorry — that did not send. Please email info@isc-ng.com or call 0706 667 7555.', true);
      });
    });
  }
})();
