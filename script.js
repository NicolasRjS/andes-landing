(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  // ---------- Mobile navigation toggle ----------
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setOpen(false);
    });
  }

  // ---------- Header state, progress bar, back-to-top ----------
  var header = document.querySelector('.site-header');
  var progress = document.querySelector('.scroll-progress');
  var toTop = document.querySelector('.to-top');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var max = root.scrollHeight - window.innerHeight;
    header.classList.toggle('is-scrolled', y > 8);
    if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (toTop) toTop.classList.toggle('is-visible', y > window.innerHeight);
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  // ---------- Active section in the nav ----------
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav a'));
  if (hasIO && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.remove('is-active'); });
        var link = byId[entry.target.id];
        if (link) link.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  // ---------- Financial table: inline bars ----------
  document.querySelectorAll('.fin-table tbody tr').forEach(function (row) {
    var cells = Array.prototype.slice.call(row.querySelectorAll('td'));
    var values = cells.map(function (td) { return parseFloat(td.textContent.replace(/[^\d.]/g, '')); });
    var max = Math.max.apply(null, values);
    cells.forEach(function (td, i) {
      var bar = document.createElement('span');
      bar.className = 'bar';
      bar.setAttribute('aria-hidden', 'true');
      bar.style.setProperty('--w', (values[i] / max * 100).toFixed(1) + '%');
      td.appendChild(bar);
    });
  });

  // Everything below is motion; skip it when the visitor prefers less.
  if (reduceMotion || !hasIO) return;

  root.classList.add('motion');

  // ---------- Reveal on scroll ----------
  var revealSelectors = [
    '.hero-inner > *',
    '.section-head',
    '.prose',
    '.brand-grid > *',
    '.service',
    '.alt-option',
    '.andes-position',
    '.fin-card',
    '.table-wrap',
    '.fact',
    '.identity-item',
    '.compete',
    '.mix'
  ];
  var revealEls = document.querySelectorAll(revealSelectors.join(','));

  revealEls.forEach(function (el) {
    var siblings = Array.prototype.filter.call(el.parentNode.children, function (c) {
      return c.matches(revealSelectors.join(','));
    });
    var idx = siblings.indexOf(el);
    el.classList.add('reveal');
    el.style.transitionDelay = Math.min(idx, 5) * 70 + 'ms';
  });

  var revealer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      el.classList.add('is-visible');
      el.classList.add('bars-in');
      revealer.unobserve(el);
      // Once revealed, drop the reveal styles so hover transitions stay snappy.
      setTimeout(function () {
        el.classList.remove('reveal', 'is-visible');
        el.style.transitionDelay = '';
      }, 1200);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

  revealEls.forEach(function (el) { revealer.observe(el); });

  // ---------- Count-up numbers ----------
  var numberPattern = /\d[\d,]*(\.\d+)?/;

  function countUp(el) {
    var text = el.textContent;
    var match = text.match(numberPattern);
    if (!match) return;
    var raw = match[0];
    // Leave years (e.g. "Lima, 2015") as they are.
    if (/^(19|20)\d\d$/.test(raw)) return;

    var target = parseFloat(raw.replace(/,/g, ''));
    var decimals = match[1] ? match[1].length - 1 : 0;
    var useCommas = raw.indexOf(',') !== -1;
    var before = text.slice(0, match.index);
    var after = text.slice(match.index + raw.length);
    var duration = 1400;
    var start = null;

    function format(n) {
      var s = n.toFixed(decimals);
      return useCommas ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : s;
    }

    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = before + format(target * eased) + after;
      if (t < 1) window.requestAnimationFrame(step);
    }

    el.textContent = before + format(0) + after;
    window.requestAnimationFrame(step);
  }

  var counter = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      countUp(entry.target);
      counter.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('.hero-stats dd, .fin-value, .fact-figure').forEach(function (el) {
    counter.observe(el);
  });
})();
