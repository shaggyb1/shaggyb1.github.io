/* A honeycomb behind the page that lights up around the pointer, a few slow particles, and the 3D stack in the hero. */
(function background() {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('bg-honeycomb');
  const c = canvas.getContext('2d');
  const grid = document.createElement('canvas');
  const g = grid.getContext('2d');
  let W = 0, H = 0, R = 26, cells = [], dots = [], ripples = [];
  const pointer = { x: 0, y: 0, on: false };

  function hexPath(ctx, x, y, r) {
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = Math.PI / 3 * k - Math.PI / 2;
      ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
    }
    ctx.closePath();
  }

  /* The plain grid never changes, so it is drawn once per resize onto a second canvas.
     It is brightest at the top right, under the glow, and fades out toward the bottom left. */
  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    R = W < 760 ? 20 : 26;
    for (const cv of [canvas, grid]) { cv.width = W * dpr; cv.height = H * dpr; }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = Math.sqrt(3) * R, step = 1.5 * R, far = Math.hypot(W, H);
    cells = [];
    g.clearRect(0, 0, W, H);
    g.lineWidth = 1;
    for (let row = 0, y = 0; y < H + R; row++, y += step) {
      for (let x = row % 2 ? w / 2 : 0; x < W + w; x += w) {
        const fade = Math.max(0, 1 - Math.hypot(x - W * .72, y - H * .2) / (far * .8));
        g.strokeStyle = 'rgba(150, 175, 255, ' + (.025 + fade * .085).toFixed(3) + ')';
        hexPath(g, x, y, R - 1);
        g.stroke();
        cells.push({ x, y, glow: 0 });
      }
    }
    const count = W < 760 ? 10 : 20;
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .1, vy: (Math.random() - .5) * .1,
      r: .6 + Math.random() * 1, a: .15 + Math.random() * .35
    }));
  }

  function draw(t) {
    c.clearRect(0, 0, W, H);
    c.drawImage(grid, 0, 0, W, H);
    ripples = ripples.filter(r => t - r.t < 1400);
    for (const cell of cells) {
      let target = 0;
      if (pointer.on) target = Math.max(0, 1 - Math.hypot(cell.x - pointer.x, cell.y - pointer.y) / 150);
      for (const r of ripples) {
        const ring = (t - r.t) * .55, d = Math.hypot(cell.x - r.x, cell.y - r.y);
        target = Math.max(target, (1 - Math.abs(d - ring) / 50) * (1 - (t - r.t) / 1400));
      }
      cell.glow += (Math.max(0, target) - cell.glow) * .16;
      if (cell.glow < .02) continue;
      hexPath(c, cell.x, cell.y, R - 2);
      c.fillStyle = 'rgba(127, 176, 255, ' + (cell.glow * .13).toFixed(3) + ')';
      c.fill();
      c.strokeStyle = 'rgba(167, 139, 255, ' + (cell.glow * .55).toFixed(3) + ')';
      c.stroke();
    }
    for (const d of dots) {
      d.x = (d.x + d.vx + W) % W;
      d.y = (d.y + d.vy + H) % H;
      c.globalAlpha = d.a;
      c.fillStyle = '#a9c1ff';
      c.beginPath();
      c.arc(d.x, d.y, d.r, 0, 6.283);
      c.fill();
    }
    c.globalAlpha = 1;
  }

  let last = 0;
  function tick(t) {
    requestAnimationFrame(tick);
    /* 30 frames a second keeps the glow smooth without draining battery. */
    if (t - last < 33 || document.hidden) return;
    last = t;
    draw(t);
  }

  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { size(); draw(performance.now()); }, 150);
  });
  size();
  draw(0);
  if (!still) {
    addEventListener('pointermove', e => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.on = true; }, { passive: true });
    document.addEventListener('pointerleave', () => { pointer.on = false; });
    addEventListener('blur', () => { pointer.on = false; });
    /* A click or tap sends a ring of light out through the cells. */
    addEventListener('pointerdown', e => {
      ripples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (ripples.length > 4) ripples.shift();
    }, { passive: true });
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
