/* ============================================================
   TerraBean Cafe — interactions
   Preloader, reveal-on-scroll, count-up stats, sticky nav,
   mobile menu, flavours carousel. Vanilla JS, no dependencies.
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Preloader ---------- */
  var pre = document.getElementById('preloader');
  function hidePre() {
    if (!pre) return;
    pre.classList.add('done');
    setTimeout(function () { if (pre && pre.parentNode) pre.parentNode.removeChild(pre); }, 800);
  }
  if (reduce) {
    hidePre();
  } else {
    window.addEventListener('load', function () { setTimeout(hidePre, 1900); });
    // Safety net: never let the loader trap the page.
    setTimeout(hidePre, 4200);
  }

  /* ---------- Year ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Reveal on scroll ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------- Count-up stats ---------- */
  var co = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, target = parseInt(el.dataset.count, 10), start = performance.now();
      (function tick(now) {
        var p = Math.min((now - start) / 1300, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(function (el) { co.observe(el); });

  /* ---------- Sticky nav ---------- */
  var nav = document.getElementById('nav');
  function onScroll() { nav.classList.toggle('nav--scrolled', window.scrollY > 20); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById('navToggle');
  var links = document.querySelector('.nav__links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Flavours carousel ---------- */
  var track = document.getElementById('flTrack');
  if (track) {
    var amount = function () { return track.clientWidth * 0.8; };
    var prev = document.getElementById('flPrev');
    var next = document.getElementById('flNext');
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -amount(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: amount(), behavior: 'smooth' }); });
  }
})();
