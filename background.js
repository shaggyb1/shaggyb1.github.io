/* A field of large raised hexagon prisms behind the page. Prisms near the pointer rise and their tops turn gold;
   a click sends a wave outward. Also starts the 3D stack in the hero. */
(function background() {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('bg-honeycomb');
  const c = canvas.getContext('2d');
  const NAVY = [14, 22, 46], SIDE = [20, 30, 62], SIDE_HOT = [90, 70, 30], TOP_HOT = [60, 48, 22];
  const BLUE = [127, 176, 255], GOLD = [245, 196, 81];
  let W = 0, H = 0, R = 46, cells = [], ripples = [];
  const pointer = { x: 0, y: 0, on: false };

  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgba = (col, a) => 'rgba(' + col[0] + ', ' + col[1] + ', ' + col[2] + ', ' + a.toFixed(3) + ')';
  function corners(x, y, r) {
    const p = [];
    for (let k = 0; k < 6; k++) {
      const a = Math.PI / 3 * k - Math.PI / 2;
      p.push([x + r * Math.cos(a), y + r * Math.sin(a)]);
    }
    return p;
  }
  function fill(points, color) {
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fillStyle = color;
    c.fill();
  }

  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    R = W < 760 ? 32 : 46;
    canvas.width = W * dpr; canvas.height = H * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = Math.sqrt(3) * R, step = 1.5 * R;
    cells = [];
    for (let row = 0, y = -R; y < H + R * 2; row++, y += step) {
      for (let x = row % 2 ? w / 2 : 0; x < W + w; x += w) {
        /* About one cell in eight catches a faint gold shine, like honey in the light. */
        cells.push({ x, y, lift: 0, shine: Math.random() < .12 ? .35 : 0 });
      }
    }
  }

  function draw(t) {
    c.clearRect(0, 0, W, H);
    ripples = ripples.filter(r => t - r.t < 1600);
    for (const cell of cells) {
      let target = 0;
      if (pointer.on) target = Math.max(0, 1 - Math.hypot(cell.x - pointer.x, cell.y - pointer.y) / 170);
      for (const r of ripples) {
        const ring = (t - r.t) * .5, d = Math.hypot(cell.x - r.x, cell.y - r.y);
        target = Math.max(target, (1 - Math.abs(d - ring) / 60) * (1 - (t - r.t) / 1600));
      }
      cell.lift += (Math.max(0, target) - cell.lift) * (still ? 1 : .14);
      const v = cell.lift;
      /* Cells fade toward the left so the text there stays easy to read. */
      const side = W < 760 ? .45 : Math.min(1, Math.max(.25, cell.x / (W * .55)));
      const gold = Math.min(1, v + cell.shine * side);
      const lift = 5 + v * 16, r = R - 3;
      const base = corners(cell.x, cell.y, r), top = corners(cell.x, cell.y - lift, r);
      c.globalAlpha = .38 + side * .37;
      fill(base, rgba(mix(SIDE, SIDE_HOT, v), 1));
      [[1, 2, 1], [2, 3, .8], [3, 4, .65], [4, 5, .5]].forEach(([a, b, shade]) =>
        fill([top[a], top[b], base[b], base[a]], rgba(mix(SIDE, SIDE_HOT, v).map(x => x * shade + 6), 1)));
      fill(top, rgba(mix(NAVY, TOP_HOT, gold * .9), 1));
      c.strokeStyle = rgba(mix(BLUE, GOLD, gold), (.12 + v * .7) * side + .05);
      c.lineWidth = 1;
      c.stroke();
    }
    c.globalAlpha = 1;
  }

  let last = 0, idle = 0;
  function tick(t) {
    requestAnimationFrame(tick);
    if (t - last < 33 || document.hidden) return;
    /* Nothing moves once the cells have settled, so stop redrawing until the pointer moves again. */
    if (!pointer.on && !ripples.length && cells.every(k => k.lift < .002)) { if (idle++ > 2) return; } else idle = 0;
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
