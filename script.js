/* ============================================================
   TerraBean Cafe — gamified interactions + 60fps scroll
   All scroll work is batched into a single requestAnimationFrame
   tick and only touches transform/opacity for smoothness.
   ============================================================ */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Elements ---------- */
  const hud = document.getElementById('hud');
  const beanCountEl = document.getElementById('beanCount');
  const roastFill = document.getElementById('roastFill');
  const scrollProgress = document.getElementById('scrollProgress');
  const journeyLine = document.getElementById('journeyLine');
  const journeyTrack = document.querySelector('.journey__track');
  const toast = document.getElementById('toast');
  const toastDesc = document.getElementById('toastDesc');
  const finalScore = document.getElementById('finalScore');
  const heroBeans = document.getElementById('heroBeans');

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Game state ---------- */
  let beans = 0;
  let displayedBeans = 0;
  const harvested = new WeakSet();      // journey steps counted once
  const achievementsHit = new Set();

  const achievements = [
    { at: 1, text: 'First Harvest 🌱' },
    { at: 20, text: 'Bean Collector 🫘' },
    { at: 40, text: 'Master Roaster 🔥' },
    { at: 60, text: 'Full Menu Tasted ☕' },
  ];

  function addBeans(n) {
    beans += n;
    checkAchievements();
  }

  function checkAchievements() {
    achievements.forEach((a) => {
      if (beans >= a.at && !achievementsHit.has(a.at)) {
        achievementsHit.add(a.at);
        showToast(a.text);
      }
    });
  }

  let toastTimer;
  function showToast(text) {
    toastDesc.textContent = text;
    toast.classList.add('toast--show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('toast--show'), 2600);
  }

  /* Smoothly count the HUD number up to the real total */
  function animateCounter() {
    if (displayedBeans !== beans) {
      const diff = beans - displayedBeans;
      displayedBeans += Math.ceil(diff / 6);
      if (displayedBeans > beans) displayedBeans = beans;
      beanCountEl.textContent = displayedBeans;
      if (finalScore) finalScore.textContent = beans;
    }
    requestAnimationFrame(animateCounter);
  }
  requestAnimationFrame(animateCounter);

  /* ---------- Reveal on scroll (IntersectionObserver) ---------- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Harvest beans from journey steps as they appear
          const reward = entry.target.dataset.bean;
          if (reward && !harvested.has(entry.target) && !entry.target.classList.contains('card')) {
            harvested.add(entry.target);
            addBeans(parseInt(reward, 10));
          }
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  /* ---------- Animated number figures ---------- */
  const figureObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const dur = 1400;
        const start = performance.now();
        function tick(now) {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        figureObserver.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  document.querySelectorAll('.figure__num').forEach((el) => figureObserver.observe(el));

  /* ---------- Menu cards: tap to collect ---------- */
  document.querySelectorAll('.card').forEach((card) => {
    function collect() {
      if (card.classList.contains('collected')) return;
      card.classList.add('collected');
      const pop = card.querySelector('.card__pop');
      if (pop) {
        pop.classList.add('show');
        pop.addEventListener('animationend', () => pop.classList.remove('show'), { once: true });
      }
      addBeans(parseInt(card.dataset.bean, 10));
      flyBean(card);
    }
    card.addEventListener('click', collect);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); collect(); }
    });
  });

  /* A little bean that flies from the card to the HUD counter */
  function flyBean(fromEl) {
    if (prefersReduced) return;
    const rect = fromEl.getBoundingClientRect();
    const target = beanCountEl.getBoundingClientRect();
    const bean = document.createElement('span');
    bean.className = 'fly-bean';
    bean.textContent = '🫘';
    bean.style.left = rect.left + rect.width / 2 + 'px';
    bean.style.top = rect.top + 'px';
    document.body.appendChild(bean);
    const dx = target.left - (rect.left + rect.width / 2);
    const dy = target.top - rect.top;
    bean.animate(
      [
        { transform: 'translate(0,0) scale(1.4)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.4)`, opacity: 0 },
      ],
      { duration: 800, easing: 'cubic-bezier(0.5, 0, 0.5, 1)' }
    ).onfinish = () => bean.remove();
  }

  /* ---------- Floating hero beans (built once) ---------- */
  if (heroBeans && !prefersReduced) {
    const frag = document.createDocumentFragment();
    const positions = [];
    for (let i = 0; i < 14; i++) {
      const b = document.createElement('span');
      b.className = 'bean';
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const depth = 0.2 + Math.random() * 0.8;   // parallax factor
      b.style.left = x + '%';
      b.style.top = y + '%';
      b.style.transform = `scale(${0.6 + depth})`;
      positions.push({ el: b, depth });
      frag.appendChild(b);
    }
    heroBeans.appendChild(frag);
    heroBeans._positions = positions;
  }

  /* ---------- Single rAF-driven scroll loop ---------- */
  let lastScroll = 0;
  let lastY = window.scrollY;
  let ticking = false;

  function onScrollFrame() {
    const y = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? y / docHeight : 0;

    // Top progress bar
    scrollProgress.style.transform = `scaleX(${progress})`;

    // Roast meter mirrors scroll depth
    roastFill.style.width = (progress * 100).toFixed(1) + '%';

    // Hide HUD when scrolling down, reveal when scrolling up
    if (y > lastScroll && y > 120) hud.classList.add('hud--hidden');
    else hud.classList.remove('hud--hidden');
    lastScroll = y;

    // Journey line fills as the section passes through the viewport
    if (journeyTrack && journeyLine) {
      const r = journeyTrack.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(Math.max((vh - r.top) / (vh + r.height), 0), 1);
      journeyLine.style.width = (p * 100).toFixed(1) + '%';
    }

    // Hero bean parallax (transform only)
    if (heroBeans && heroBeans._positions && y < window.innerHeight) {
      heroBeans._positions.forEach((p) => {
        const base = parseFloat(p.el.style.transform.match(/scale\(([^)]+)\)/)[1]);
        p.el.style.transform = `translateY(${y * p.depth * 0.4}px) scale(${base})`;
      });
    }

    ticking = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScrollFrame);
      }
    },
    { passive: true }
  );
  onScrollFrame();

  /* Welcome nudge */
  setTimeout(() => showToast('Scroll & tap to harvest beans!'), 1200);

  /* Expose a tiny API so the focus rail can feed the same bean economy */
  window.TerraBean = { addBeans, showToast };
})();
