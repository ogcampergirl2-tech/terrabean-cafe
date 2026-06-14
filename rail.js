/* ============================================================
   Bean Journey — Focus Rail
   Vanilla port of the React/framer-motion FocusRail component,
   themed to TerraBean's coffee palette. Drag / wheel / keyboard /
   button navigation, 3D depth, ambient backdrop, and a bouncy
   "tap" overshoot on the centred card. Feeds the bean economy
   exposed by script.js (window.TerraBean).
   ============================================================ */
(function () {
  'use strict';

  const stage = document.getElementById('railStage');
  if (!stage) return;

  const ambience = document.getElementById('railAmbience');
  const metaEl = document.getElementById('railMeta');
  const titleEl = document.getElementById('railTitle');
  const descEl = document.getElementById('railDesc');
  const countEl = document.getElementById('railCount');
  const prevBtn = document.getElementById('railPrev');
  const nextBtn = document.getElementById('railNext');
  const rail = document.getElementById('beanRail');

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Inline lucide icons (no network dependency) */
  const I = (paths) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  const icons = {
    chevronLeft: I('<path d="m15 18-6-6 6-6"/>'),
    chevronRight: I('<path d="m9 18 6-6-6-6"/>'),
    sprout: I('<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>'),
    hand: I('<path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>'),
    flame: I('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'),
    coffee: I('<path d="M10 2v2"/><path d="M14 2v2"/><path d="M6 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/>'),
    cup: I('<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/>'),
  };

  /* The five stops of the journey (coffee-themed Unsplash imagery) */
  const ITEMS = [
    {
      title: 'Grown',
      meta: 'Stage 01 • Farm',
      icon: icons.sprout,
      desc: 'Heirloom Arabica nurtured on our shaded highland farm, 1,500m above sea level.',
      img: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=800&auto=format&fit=crop',
    },
    {
      title: 'Harvested',
      meta: 'Stage 02 • Hand-picked',
      icon: icons.hand,
      desc: 'Only the ripest cherries, hand-picked at peak sweetness — never machine-stripped.',
      img: 'https://images.unsplash.com/photo-1459755486867-b55449bb39ff?q=80&w=800&auto=format&fit=crop',
    },
    {
      title: 'Roasted',
      meta: 'Stage 03 • Small-batch',
      icon: icons.flame,
      desc: 'Roasted in-house each morning to unlock deep chocolate & caramel notes.',
      img: 'https://images.unsplash.com/photo-1524350876685-274059332603?q=80&w=800&auto=format&fit=crop',
    },
    {
      title: 'Brewed',
      meta: 'Stage 04 • Crafted',
      icon: icons.coffee,
      desc: 'Pulled and poured by baristas who know every bean by name.',
      img: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=800&auto=format&fit=crop',
    },
    {
      title: 'Served',
      meta: 'Stage 05 • Your cup',
      icon: icons.cup,
      desc: 'Enjoyed slowly on our hillside terrace — the final stop of every bean.',
      img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800&auto=format&fit=crop',
    },
  ];

  const count = ITEMS.length;
  let active = 0;
  const visited = new Set();
  const game = window.TerraBean || { addBeans() {}, showToast() {} };

  /* Build the cards once; we reposition them rather than remount (no image flicker) */
  const cards = ITEMS.map((item, i) => {
    const card = document.createElement('div');
    card.className = 'rail-card';
    const img = document.createElement('img');
    img.className = 'rail-card__img';
    img.src = item.img;
    img.alt = item.title;
    img.loading = 'lazy';
    img.addEventListener('error', () => (img.style.visibility = 'hidden'));
    card.innerHTML = `<div class="rail-card__inner"><span class="rail-card__badge">${item.icon}</span></div>`;
    card.querySelector('.rail-card__inner').prepend(img);
    card.addEventListener('click', () => {
      const off = offsetFor(i);
      if (off !== 0) go(active + off);
    });
    stage.appendChild(card);
    return card;
  });

  /* Shortest signed offset of item i from the active card (handles loop wrap) */
  function offsetFor(i) {
    let off = i - active;
    if (off > count / 2) off -= count;
    if (off < -count / 2) off += count;
    return off;
  }

  function baseX() {
    const w = stage.clientWidth;
    return w < 640 ? 150 : w < 900 ? 235 : 300;
  }

  /* Render all cards at their 3D positions; dragX adds live drag feedback */
  function render(dragX) {
    const bx = baseX();
    cards.forEach((card, i) => {
      const off = offsetFor(i);
      const dist = Math.abs(off);
      const x = off * bx + (dragX || 0);
      const z = -dist * 160;
      const rotateY = off * -18;
      const isCenter = off === 0;
      const scale = isCenter ? 1 : 0.82;
      const opacity = isCenter ? 1 : Math.max(0.12, 1 - dist * 0.45);
      const blur = isCenter ? 0 : dist * 5;
      const brightness = isCenter ? 1 : 0.55;

      card.style.transform = `translate(-50%, -50%) translate3d(${x}px, 0, ${z}px) rotateY(${rotateY}deg)`;
      card.style.opacity = opacity;
      card.style.filter = `blur(${blur}px) brightness(${brightness})`;
      card.style.zIndex = String(20 - dist);
      card.classList.toggle('is-center', isCenter);
      card.querySelector('.rail-card__inner').style.transform = `scale(${scale})`;
    });
  }

  function updateInfo() {
    const item = ITEMS[active];
    metaEl.innerHTML = `${item.icon}<span>${item.meta}</span>`;
    titleEl.textContent = item.title;
    descEl.textContent = item.desc;
    countEl.textContent = `${active + 1} / ${count}`;
    if (ambience) {
      ambience.style.backgroundImage = `url("${item.img}")`;
      ambience.classList.add('show');
    }
    // re-trigger the text swap animation
    const info = document.getElementById('railInfo');
    info.classList.remove('swap');
    void info.offsetWidth;
    info.classList.add('swap');
  }

  /* Navigate to an (un-wrapped) index, reward first visits */
  function go(target) {
    active = ((target % count) + count) % count;
    if (!visited.has(active)) {
      visited.add(active);
      game.addBeans(8);
      game.showToast(`Reached: ${ITEMS[active].title} ${visited.size === count ? '🏆' : ''}`);
    }
    render(0);
    updateInfo();
  }

  const next = () => go(active + 1);
  const prev = () => go(active - 1);

  prevBtn.innerHTML = icons.chevronLeft;
  nextBtn.innerHTML = icons.chevronRight;
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  /* Keyboard */
  rail.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
  });

  /* Wheel / trackpad — debounced, with a threshold (mirrors the original) */
  let lastWheel = 0;
  rail.addEventListener(
    'wheel',
    (e) => {
      const now = Date.now();
      if (now - lastWheel < 400) return;
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const delta = horizontal ? e.deltaX : e.deltaY;
      if (Math.abs(delta) > 20) {
        if (horizontal || e.shiftKey) e.preventDefault();
        delta > 0 ? next() : prev();
        lastWheel = now;
      }
    },
    { passive: false }
  );

  /* Pointer drag / swipe with live follow + snap on release */
  let dragging = false;
  let startX = 0;
  let dragX = 0;
  let pointerId = null;

  stage.addEventListener('pointerdown', (e) => {
    dragging = true;
    startX = e.clientX;
    dragX = 0;
    pointerId = e.pointerId;
    stage.setPointerCapture(pointerId);
    stage.classList.add('grabbing');
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    dragX = e.clientX - startX;
    if (!prefersReduced) render(dragX * 0.6);
  });
  function endDrag() {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('grabbing');
    if (pointerId !== null) {
      try { stage.releasePointerCapture(pointerId); } catch (_) {}
      pointerId = null;
    }
    const threshold = stage.clientWidth * 0.12;
    if (dragX < -threshold) next();
    else if (dragX > threshold) prev();
    else render(0);
    dragX = 0;
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  window.addEventListener('resize', () => render(0));

  /* First paint */
  go(0);
})();
