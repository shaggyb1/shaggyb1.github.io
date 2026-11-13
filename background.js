/* A trip through space behind the page, made from real photos. Scrolling flies the camera forward past Saturn,
   Jupiter and Neptune, through the Carina Nebula, to the M87 black hole at the bottom of the page. The far sky is
   the real Milky Way and stays put, with a slight pull toward the pointer. Also starts the 3D stack in the hero.
   Photo credits are in the footer. */
(function background() {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('bg-space');
  const c = canvas.getContext('2d');
  const sky = document.createElement('canvas');
  const s = sky.getContext('2d');
  /* Star colours by temperature, hot blue to cool orange, weighted toward white like the real sky. */
  const COLORS = ['#9bb0ff', '#aabfff', '#cad7ff', '#cad7ff', '#f8f7ff', '#f8f7ff', '#f8f7ff', '#fff4ea', '#fff4ea', '#ffd2a1', '#ffcc6f'];
  const DEPTH = 4, TRAVEL = 3.2;
  let W = 0, H = 0, F = 1, stars = [], cam = 0, camShown = 0;
  const look = { x: 0, y: 0 }, aim = { x: 0, y: 0 };

  /* A seeded random, so the same sky comes back after a resize instead of every star jumping. */
  function seeded(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Photos sit at fixed depths. x is in half screen-widths from the centre, so they land on screen on phones too;
     y and width are in screen-heights. Each one stays hidden until it is closer than `show`, and they pass along
     the edges, so they don't sit behind text. All the photos are on black, and they are drawn with "screen"
     blending, which makes the black see-through. */
  const BODIES = [
    { z: 1.7, x: .62, y: -.2, w: .5, src: 'saturn', show: 2.3 },
    { z: 2.35, x: -.72, y: .22, w: .26, src: 'jupiter', show: 2.3 },
    { z: 2.9, x: .7, y: .16, w: .24, src: 'neptune', show: 2.3 },
    { z: 3.3, x: .1, y: 0, w: 1.5, src: 'carina', show: 2.7, alpha: .55 },
    { z: TRAVEL + .55, x: .2, y: -.02, w: .62, src: 'black-hole', show: 1.3, hole: true }
  ];
  const photos = {};
  function loadPhotos() {
    for (const name of ['milky-way', 'saturn', 'jupiter', 'neptune', 'carina', 'black-hole']) {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        /* The nebula and black hole photos are not on pure black, so their edges are faded out once here. */
        photos[name] = name === 'milky-way' ? band(img) : name === 'carina' || name === 'black-hole' ? feather(img) : img;
        if (name === 'milky-way') { paintSky(); draw(performance.now()); }
      };
      img.src = 'assets/space/' + name + '.jpg';
    }
  }
  function feather(img) {
    const f = document.createElement('canvas'), g = f.getContext('2d');
    f.width = img.width; f.height = img.height;
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'destination-in';
    /* An oval fade that reaches zero at every edge. */
    g.translate(f.width / 2, f.height / 2);
    g.scale(1, f.height / f.width);
    const m = g.createRadialGradient(0, 0, f.width * .12, 0, 0, f.width * .49);
    m.addColorStop(0, '#000');
    m.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = m;
    g.fillRect(-f.width / 2, -f.width / 2, f.width, f.width);
    return f;
  }

  /* The middle of the Milky Way panorama, with its edges faded so no straight line shows. */
  function band(img) {
    const f = document.createElement('canvas'), g = f.getContext('2d');
    f.width = img.width * .64; f.height = img.height * .5;
    g.drawImage(img, img.width * .18, img.height * .25, f.width, f.height, 0, 0, f.width, f.height);
    g.globalCompositeOperation = 'destination-in';
    for (const [x1, y1] of [[0, f.height], [f.width, 0]]) {
      const m = g.createLinearGradient(0, 0, x1, y1);
      m.addColorStop(0, 'rgba(0, 0, 0, 0)');
      m.addColorStop(.25, '#000');
      m.addColorStop(.75, '#000');
      m.addColorStop(1, 'rgba(0, 0, 0, 0)');
      g.fillStyle = m;
      g.fillRect(0, 0, f.width, f.height);
    }
    return f;
  }

  /* The far sky: the middle of ESO's Milky Way panorama, tilted into a diagonal band, over a few faint stars. */
  function paintSky() {
    const rnd = seeded(11);
    s.clearRect(0, 0, W, H);
    for (let i = 0, n = Math.round(W * H / 2600); i < n; i++) {
      s.globalAlpha = .12 + rnd() * .4;
      s.fillStyle = COLORS[rnd() * COLORS.length | 0];
      s.fillRect(rnd() * W, rnd() * H, .9, .9);
    }
    const mw = photos['milky-way'];
    if (mw) {
      s.save();
      s.globalAlpha = W < 760 ? .4 : .55;
      s.globalCompositeOperation = 'screen';
      /* The bright core of the galaxy sits right of centre, away from the text column. */
      s.translate(W < 760 ? W * .6 : W * .68, H * .42);
      s.rotate(-Math.atan2(H, W * 1.2));
      const span = Math.hypot(W, H) * 1.1, tall = span * .5;
      s.drawImage(mw, -span / 2, -tall / 2, span, tall);
      s.restore();
    }
    s.globalAlpha = 1;
  }

  function build() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight; F = H * .9;
    canvas.width = W * dpr; canvas.height = H * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    sky.width = W * dpr; sky.height = H * dpr;
    s.setTransform(dpr, 0, 0, dpr, 0, 0);
    const rnd = seeded(7);
    paintSky();

    /* Stars in 3D. They repeat every DEPTH units, so flying forward never runs out of stars. */
    const spreadX = W / 2 / F * DEPTH, spreadY = H / 2 / F * DEPTH;
    stars = Array.from({ length: Math.round(W * H / 2000) }, () => ({
      x: (rnd() * 2 - 1) * spreadX, y: (rnd() * 2 - 1) * spreadY, z: rnd() * DEPTH,
      color: COLORS[rnd() * COLORS.length | 0], phase: rnd() * 6.28, speed: .6 + rnd() * 1.2
    }));
  }

  function project(x, y, rel) {
    return [W / 2 - look.x * 24 + x / rel * F, H / 2 - look.y * 16 + y / rel * F];
  }

  function draw(t) {
    look.x += (aim.x - look.x) * .06;
    look.y += (aim.y - look.y) * .06;
    const before = camShown;
    camShown += (cam - camShown) * (still ? 1 : .12);
    const speed = camShown - before;
    c.clearRect(0, 0, W, H);
    c.drawImage(sky, -look.x * 8, -look.y * 6, W, H);

    /* Stars. While the camera moves they stretch into short streaks, like jumping to light speed. */
    for (const st of stars) {
      const rel = ((st.z - camShown) % DEPTH + DEPTH) % DEPTH + .05;
      const [x, y] = project(st.x, st.y, rel);
      if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
      const near = 1 - rel / DEPTH, r = .5 + near * 1.5;
      const twinkle = still ? 1 : .75 + .25 * Math.sin(t / 1000 * st.speed + st.phase);
      c.globalAlpha = Math.min(1, .3 + near * 1.1) * twinkle;
      c.fillStyle = c.strokeStyle = st.color;
      if (Math.abs(speed) > .002 && rel > .2) {
        /* Capped, so a fast fling doesn't smear the whole screen. */
        const [px, py] = project(st.x, st.y, rel + Math.max(-.2, Math.min(.2, speed * 8)));
        c.lineWidth = r;
        c.beginPath();
        c.moveTo(px, py);
        c.lineTo(x, y);
        c.stroke();
      } else {
        c.beginPath();
        c.arc(x, y, r, 0, 6.283);
        c.fill();
      }
    }

    /* The photos, farthest first. They fade in as they approach and fade out as they rush past the camera. */
    const bodies = BODIES.map(b => ({ ...b, rel: b.z - camShown })).filter(b => b.rel > .06 && photos[b.src]).sort((a, b) => b.rel - a.rel);
    c.globalCompositeOperation = 'screen';
    for (const b of bodies) {
      /* On phones the text fills the width, so photos are smaller and the black hole settles lower, near the footer. */
      const phone = W < 760, lower = phone && b.hole ? .17 : 0;
      const img = photos[b.src], w = b.w * F / b.rel * (phone ? .6 : 1), h = w * img.height / img.width;
      const x = W / 2 - look.x * 24 + b.x * W / 2 / b.rel, y = H / 2 - look.y * 16 + (b.y + lower) * F / b.rel;
      if (x + w / 2 < 0 || x - w / 2 > W || y + h / 2 < 0 || y - h / 2 > H) continue;
      c.globalAlpha = Math.min(1, (b.rel - .06) / .3) * Math.min(1, Math.max(0, (b.show - b.rel) / .8)) * (b.alpha || 1) * (phone ? .75 : 1);
      if (c.globalAlpha <= 0) continue;
      c.drawImage(img, x - w / 2, y - h / 2, w, h);
    }
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
  }

  function scrollTarget() {
    const max = document.documentElement.scrollHeight - innerHeight;
    cam = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) * TRAVEL : 0;
  }

  let last = 0;
  function tick(t) {
    requestAnimationFrame(tick);
    /* 30 frames a second is plenty for twinkling and the flight, and saves battery. */
    if (t - last < 33 || document.hidden) return;
    last = t;
    draw(t);
  }

  /* Phones resize the window when the address bar slides in and out while scrolling.
     Only rebuild for a real change, so the sky doesn't flicker. */
  let resizeTimer, builtW = 0, builtH = 0;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (innerWidth === builtW && Math.abs(innerHeight - builtH) < 160) return;
      builtW = innerWidth; builtH = innerHeight;
      build(); scrollTarget(); draw(performance.now());
    }, 150);
  });
  builtW = innerWidth; builtH = innerHeight;
  build();
  loadPhotos();
  scrollTarget();
  camShown = cam;
  draw(0);
  addEventListener('scroll', () => { scrollTarget(); if (still) draw(0); }, { passive: true });
  if (!still) {
    if (matchMedia('(pointer: fine)').matches) {
      addEventListener('pointermove', e => { aim.x = e.clientX / W - .5; aim.y = e.clientY / H - .5; }, { passive: true });
    }
    requestAnimationFrame(tick);
  }

  stack(still);
})();

/* The hero stack: four layers you can lift. Skills mode shows what I build at each layer,
   projects mode shows the products, linked to their cards below. */
function stack(still) {
  const visual = document.querySelector('.hero-visual');
  if (!visual) return;
  const rig = visual.querySelector('.stack-rig');
  const info = visual.querySelector('.stack-info');
  const byId = id => PROJECTS.find(p => p.id === id);

  /* Bottom layer first. */
  const MODES = {
    skills: {
      hint: 'Hover or tap a layer to see what I build there.',
      layers: [
        { label: 'database', text: '<b>database</b> · PostgreSQL, Drizzle ORM, SQLite, Firebase' },
        { label: 'ai', text: '<b>ai</b> · Claude API, agents with tools, prompt caching, model routing' },
        { label: 'api', text: '<b>api</b> · Node.js, Next.js routes, REST, OAuth, Razorpay and Stripe' },
        { label: 'ui', text: '<b>ui</b> · React, Next.js, TypeScript, React Native', top: true }
      ]
    },
    projects: {
      hint: 'Hover or tap a project. Click it again to jump to it.',
      layers: ['naad', 'distributor', 'tradewire', 'upsoar'].map((id, i) => {
        const p = byId(id);
        return { label: p.name.toLowerCase(), color: p.accent, id, top: i === 3,
          text: '<b>' + p.name + '</b> · ' + p.kind + '. ' + p.status + '.' };
      })
    }
  };

  let mode = 'skills', plates = [], active = -1;

  function build() {
    rig.innerHTML = '';
    plates = MODES[mode].layers.map((l, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'plate';
      b.style.setProperty('--i', i);
      if (l.color) { b.style.setProperty('--c', l.color); b.style.color = l.color; }
      b.setAttribute('aria-label', l.label);
      b.textContent = l.label;
      if (l.top) {
        const m = document.createElement('span');
        m.className = 'mark';
        m.innerHTML = '<span>Bhushan<br><i>Kumbhare</i></span>';
        b.append(m);
      }
      b.addEventListener('mouseenter', () => pick(i));
      b.addEventListener('focus', () => pick(i));
      b.addEventListener('click', () => {
        if (l.id && active === i) document.getElementById(l.id).scrollIntoView({ behavior: still ? 'auto' : 'smooth' });
        pick(i);
      });
      rig.append(b);
      return b;
    });
    [0, 1, 2].forEach(k => {
      const d = document.createElement('span');
      d.className = 'packet' + (k === 1 ? ' alt' : '');
      d.style.left = -64 + k * 8 + 'px';
      d.style.top = (k - 1) * 44 - 4 + 'px';
      d.style.animationDelay = -k * 0.8 + 's';
      rig.append(d);
    });
    active = -1;
    info.style.removeProperty('--c');
    info.textContent = MODES[mode].hint;
  }

  function pick(i) {
    active = i;
    const l = MODES[mode].layers[i];
    plates.forEach((p, k) => {
      p.classList.toggle('on', k === i);
      p.style.setProperty('--lift', k === i ? '22px' : '0px');
    });
    if (l.color) info.style.setProperty('--c', l.color); else info.style.removeProperty('--c');
    info.innerHTML = l.text;
  }

  function reset() {
    active = -1;
    plates.forEach(p => { p.classList.remove('on'); p.style.setProperty('--lift', '0px'); });
    info.style.removeProperty('--c');
    info.textContent = MODES[mode].hint;
  }

  visual.querySelectorAll('.stack-mode').forEach(btn => btn.addEventListener('click', () => {
    mode = btn.dataset.mode;
    visual.querySelectorAll('.stack-mode').forEach(b => b.setAttribute('aria-pressed', b === btn));
    build();
    open();
  }));
  visual.querySelector('.stack-scene').addEventListener('mouseleave', reset);

  /* The layers start pressed together and spread apart, like an exploded diagram. */
  function open() {
    if (still) return;
    visual.style.setProperty('--gap', '6px');
    requestAnimationFrame(() => requestAnimationFrame(() => visual.style.removeProperty('--gap')));
  }

  build();
  open();
  if (still) return;

  /* When idle the stack sways slowly; when the mouse is over it, it tilts toward the pointer. */
  const fine = matchMedia('(pointer: fine)').matches;
  let rz = -40, rx = 58, tz = -40, tx = 58, over = false, last = 0;
  if (fine) {
    visual.addEventListener('pointermove', e => {
      const r = visual.getBoundingClientRect();
      over = true;
      tz = -40 + ((e.clientX - r.left) / r.width - .5) * 36;
      tx = 58 - ((e.clientY - r.top) / r.height - .5) * 14;
    });
    visual.addEventListener('pointerleave', () => { over = false; });
  }
  function frame(t) {
    requestAnimationFrame(frame);
    if (document.hidden || t - last < 33) return;
    last = t;
    if (!over) { tz = -40 + Math.sin(t / 3200) * 14; tx = 58; }
    rz += (tz - rz) * .08;
    rx += (tx - rx) * .08;
    rig.style.setProperty('--rz', rz.toFixed(2) + 'deg');
    rig.style.setProperty('--rx', rx.toFixed(2) + 'deg');
  }
  requestAnimationFrame(frame);
}
