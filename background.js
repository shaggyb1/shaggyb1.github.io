/* A trip through space behind the page. Scrolling flies the camera forward: past a ringed planet, an ice planet
   and a nebula, ending at a black hole at the bottom of the page. The far sky (Milky Way, a galaxy) stays put,
   with a slight pull toward the pointer. Also starts the 3D stack in the hero. */
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

  /* Planets, a nebula and the black hole sit at fixed depths. x is in half screen-widths from the centre, so they
     land on screen on phones too; y and size are in screen-heights.
     Each one stays hidden until it is closer than `show`, and they pass along the edges, so they don't sit behind text. */
  const BODIES = [
    { z: 1.9, x: .7, y: -.22, r: .07, kind: 'ringed', show: 2.3 },
    { z: 2.7, x: -.75, y: .28, r: .05, kind: 'ice', show: 2.3 },
    { z: 3.1, x: .25, y: .1, r: .3, kind: 'nebula', show: 2.6 },
    { z: TRAVEL + .55, x: .2, y: -.02, r: .085, kind: 'hole', show: 2.2 }
  ];

  function build() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight; F = H * .9;
    canvas.width = W * dpr; canvas.height = H * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    sky.width = W * dpr; sky.height = H * dpr;
    s.setTransform(dpr, 0, 0, dpr, 0, 0);
    const rnd = seeded(7);

    /* The far sky: the Milky Way as a soft diagonal band, thick with faint stars, and a small spiral galaxy. */
    s.clearRect(0, 0, W, H);
    s.save();
    s.translate(W / 2, H / 2);
    s.rotate(-Math.atan2(H, W * 1.2));
    const band = s.createLinearGradient(0, -H * .22, 0, H * .22);
    band.addColorStop(0, 'rgba(150, 170, 255, 0)');
    band.addColorStop(.42, 'rgba(170, 185, 255, .1)');
    band.addColorStop(.5, 'rgba(230, 220, 255, .16)');
    band.addColorStop(.58, 'rgba(170, 185, 255, .1)');
    band.addColorStop(1, 'rgba(150, 170, 255, 0)');
    s.fillStyle = band;
    s.fillRect(-W, -H * .22, W * 2, H * .44);
    s.restore();
    for (let i = 0, n = Math.round(W * H / 1400); i < n; i++) {
      const t = rnd(), off = (rnd() + rnd() + rnd() - 1.5) * H * .14;
      const inBand = rnd() < .6;
      const x = inBand ? -.1 * W + t * 1.2 * W + off * .6 : rnd() * W;
      const y = inBand ? .95 * H - t * H + off : rnd() * H;
      s.globalAlpha = .12 + rnd() * .45;
      s.fillStyle = COLORS[rnd() * COLORS.length | 0];
      s.fillRect(x, y, rnd() < .9 ? .8 : 1.3, rnd() < .9 ? .8 : 1.3);
    }
    s.save();
    s.translate(W * .88, H * .86);
    s.rotate(-.5);
    s.scale(1, .42);
    const size = Math.min(W, H) * .1, core = s.createRadialGradient(0, 0, 0, 0, 0, size * .35);
    core.addColorStop(0, 'rgba(255, 236, 200, .55)');
    core.addColorStop(1, 'rgba(255, 236, 200, 0)');
    s.globalAlpha = 1;
    s.fillStyle = core;
    s.fillRect(-size, -size, size * 2, size * 2);
    for (let i = 0; i < 900; i++) {
      const d = Math.pow(rnd(), .7) * size, a = d / size * 5.5 + (i % 2) * Math.PI + (rnd() - .5) * .7;
      s.globalAlpha = (1 - d / size) * .5;
      s.fillStyle = d < size * .25 ? '#ffe9c4' : '#b9c8ff';
      s.fillRect(Math.cos(a) * d, Math.sin(a) * d, 1, 1);
    }
    s.restore();
    s.globalAlpha = 1;

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

  function sphere(x, y, r, light, mid, dark) {
    const g = c.createRadialGradient(x - r * .4, y - r * .45, r * .1, x, y, r);
    g.addColorStop(0, light);
    g.addColorStop(.55, mid);
    g.addColorStop(1, dark);
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r, 0, 6.283);
    c.fill();
  }

  function ring(x, y, r, from, to, alpha) {
    c.save();
    c.translate(x, y);
    c.rotate(-.35);
    c.scale(1, .28);
    c.globalAlpha *= alpha;
    for (const [rr, col, w] of [[1.75, '#e9d3a6', .18], [2.05, '#c7a978', .12], [2.3, '#8f7a5a', .08]]) {
      c.strokeStyle = col;
      c.lineWidth = r * w * 3.4;
      c.beginPath();
      c.arc(0, 0, r * rr, from, to);
      c.stroke();
    }
    c.restore();
  }

  function blackHole(x, y, r, t) {
    const halo = c.createRadialGradient(x, y, r, x, y, r * 4);
    halo.addColorStop(0, 'rgba(255, 170, 70, .35)');
    halo.addColorStop(.4, 'rgba(255, 120, 40, .1)');
    halo.addColorStop(1, 'rgba(255, 120, 40, 0)');
    c.fillStyle = halo;
    c.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
    const disk = (from, to) => {
      c.save();
      c.translate(x, y);
      c.rotate(-.12);
      c.scale(1, .24);
      /* Keep this half of the disk, streaks included, on its own side of the hole. */
      c.beginPath();
      c.rect(-r * 4, from === 0 ? 0 : -r * 4, r * 8, r * 4);
      c.clip();
      const g = c.createRadialGradient(0, 0, r * 1.15, 0, 0, r * 3.1);
      g.addColorStop(0, 'rgba(255, 246, 220, .95)');
      g.addColorStop(.35, 'rgba(255, 196, 92, .8)');
      g.addColorStop(.75, 'rgba(214, 102, 40, .35)');
      g.addColorStop(1, 'rgba(160, 60, 30, 0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(0, 0, r * 3.1, from, to);
      c.arc(0, 0, r * 1.15, to, from, true);
      c.fill();
      /* Hot streaks circling in the disk. */
      c.strokeStyle = 'rgba(255, 240, 210, .2)';
      c.lineWidth = r * .05 / .24;
      for (let k = 0; k < 7; k++) {
        const rr = r * (1.35 + k * .15), a = t * (1.6 - k * .15) + k;
        c.beginPath();
        c.arc(0, 0, rr, a, a + .6);
        c.stroke();
      }
      c.restore();
    };
    disk(Math.PI, Math.PI * 2);
    /* Light from the far side of the disk bends up over the hole, which makes the arc on top. */
    c.save();
    c.translate(x, y);
    c.scale(1, .9);
    const arc = c.createRadialGradient(0, 0, r * 1.1, 0, 0, r * 1.75);
    arc.addColorStop(0, 'rgba(255, 236, 190, .85)');
    arc.addColorStop(.5, 'rgba(255, 180, 80, .45)');
    arc.addColorStop(1, 'rgba(255, 140, 50, 0)');
    c.fillStyle = arc;
    c.beginPath();
    c.arc(0, 0, r * 1.75, Math.PI, Math.PI * 2);
    c.arc(0, 0, r * 1.1, Math.PI * 2, Math.PI, true);
    c.fill();
    c.restore();
    /* The thin bright ring right at the edge of the hole. */
    c.strokeStyle = 'rgba(255, 214, 140, .9)';
    c.lineWidth = r * .1;
    c.beginPath();
    c.arc(x, y, r * 1.12, 0, 6.283);
    c.stroke();
    c.fillStyle = '#000';
    c.beginPath();
    c.arc(x, y, r, 0, 6.283);
    c.fill();
    disk(0, Math.PI);
  }

  function nebula(x, y, r) {
    c.globalCompositeOperation = 'lighter';
    for (const [dx, dy, rr, col] of [[0, 0, 1, '120, 80, 255'], [.35, -.2, .7, '40, 160, 255'], [-.3, .25, .6, '255, 90, 170'], [.1, .3, .5, '255, 190, 90']]) {
      const g = c.createRadialGradient(x + dx * r, y + dy * r, 0, x + dx * r, y + dy * r, rr * r);
      g.addColorStop(0, 'rgba(' + col + ', .22)');
      g.addColorStop(1, 'rgba(' + col + ', 0)');
      c.fillStyle = g;
      c.fillRect(x + dx * r - rr * r, y + dy * r - rr * r, rr * r * 2, rr * r * 2);
    }
    c.globalCompositeOperation = 'source-over';
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
        const [px, py] = project(st.x, st.y, rel + speed * 8);
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

    /* Planets, the nebula and the black hole, farthest first. Bodies fade as they rush past the camera. */
    const bodies = BODIES.map(b => ({ ...b, rel: b.z - camShown })).filter(b => b.rel > .06).sort((a, b) => b.rel - a.rel);
    for (const b of bodies) {
      /* On phones the text fills the width, so bodies are smaller and the black hole settles lower, near the footer. */
      const phone = W < 760, lower = phone && b.kind === 'hole' ? .26 : 0;
      const x = W / 2 - look.x * 24 + b.x * W / 2 / b.rel, y = H / 2 - look.y * 16 + (b.y + lower) * F / b.rel;
      const r = b.r * F / b.rel * (phone ? .6 : 1);
      if (x + r * 4 < 0 || x - r * 4 > W || y + r * 4 < 0 || y - r * 4 > H) continue;
      c.globalAlpha = Math.min(1, (b.rel - .06) / .3) * Math.min(1, Math.max(0, (b.show - b.rel) / .8));
      if (W < 760) c.globalAlpha *= .75;
      if (c.globalAlpha <= 0) continue;
      if (b.kind === 'ringed') {
        ring(x, y, r, Math.PI, Math.PI * 2, 1);
        sphere(x, y, r, '#f6e2b8', '#c9925a', '#3a2412');
        ring(x, y, r, 0, Math.PI, 1);
      } else if (b.kind === 'ice') {
        sphere(x, y, r, '#e6f4ff', '#5ea8e8', '#0b2347');
        sphere(x + r * 1.9, y - r * .8, r * .27, '#f2f2f2', '#9aa3ad', '#2b3036');
      } else if (b.kind === 'nebula') {
        nebula(x, y, r);
      } else {
        blackHole(x, y, r, still ? 0 : t / 1000);
      }
    }
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
