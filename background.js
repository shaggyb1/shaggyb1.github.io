/* A night sky behind the page: stars in their real colours, the Milky Way, a distant galaxy and the odd shooting star.
   Near stars drift a little with the pointer and the scroll, so the sky has depth. Also starts the 3D stack in the hero. */
(function background() {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('bg-space');
  const c = canvas.getContext('2d');
  const sky = document.createElement('canvas');
  const s = sky.getContext('2d');
  const PAD = 60;
  /* Star colours by temperature, hot blue to cool orange, weighted toward white like the real sky. */
  const COLORS = ['#9bb0ff', '#aabfff', '#cad7ff', '#cad7ff', '#f8f7ff', '#f8f7ff', '#f8f7ff', '#fff4ea', '#fff4ea', '#ffd2a1', '#ffcc6f'];
  let W = 0, H = 0, near = [], shooting = null, nextShot = 0;
  const look = { x: 0, y: 0 }, aim = { x: 0, y: 0 };
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = list => list[Math.random() * list.length | 0];

  /* The Milky Way runs diagonally from the lower left to the upper right. */
  function bandDistance(x, y) {
    const x1 = -.1 * W, y1 = .95 * H, x2 = 1.1 * W, y2 = -.05 * H;
    return Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / Math.hypot(x2 - x1, y2 - y1);
  }

  function galaxy(cx, cy, size, tilt) {
    s.save();
    s.translate(cx, cy);
    s.rotate(tilt);
    s.scale(1, .42);
    const core = s.createRadialGradient(0, 0, 0, 0, 0, size * .35);
    core.addColorStop(0, 'rgba(255, 236, 200, .55)');
    core.addColorStop(1, 'rgba(255, 236, 200, 0)');
    s.fillStyle = core;
    s.fillRect(-size, -size, size * 2, size * 2);
    for (let i = 0; i < 900; i++) {
      const arm = i % 2, d = Math.pow(Math.random(), .7) * size, a = d / size * 5.5 + arm * Math.PI + rand(-.35, .35);
      s.globalAlpha = (1 - d / size) * .5;
      s.fillStyle = d < size * .25 ? '#ffe9c4' : '#b9c8ff';
      s.fillRect(Math.cos(a) * d, Math.sin(a) * d, 1, 1);
    }
    s.restore();
    s.globalAlpha = 1;
  }

  /* Everything far away is drawn once onto a slightly larger canvas, so it can shift for parallax without redrawing. */
  function build() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    sky.width = (W + PAD * 2) * dpr; sky.height = (H + PAD * 2) * dpr;
    s.setTransform(dpr, 0, 0, dpr, 0, 0);
    s.clearRect(0, 0, W + PAD * 2, H + PAD * 2);
    s.translate(PAD, PAD);

    /* The glow of the Milky Way. */
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

    /* Distant stars, thickest along the band. */
    const count = Math.round(W * H / 900);
    for (let i = 0; i < count; i++) {
      let x = rand(-PAD, W + PAD), y = rand(-PAD, H + PAD);
      if (Math.random() < .55) {
        const t = Math.random(), off = (Math.random() + Math.random() + Math.random() - 1.5) * H * .14;
        x = -.1 * W + t * 1.2 * W; y = .95 * H - t * H;
        x += off * .6; y += off;
      } else if (bandDistance(x, y) < H * .1 && Math.random() < .5) continue;
      s.globalAlpha = rand(.15, .7);
      s.fillStyle = pick(COLORS);
      const r = Math.random() < .9 ? rand(.3, .7) : rand(.7, 1);
      s.beginPath();
      s.arc(x, y, r, 0, 6.283);
      s.fill();
    }
    s.globalAlpha = 1;
    galaxy(W * .88, H * .86, Math.min(W, H) * .1, -.5);
    s.setTransform(1, 0, 0, 1, 0, 0);

    /* Closer, brighter stars that twinkle and drift. A few of the brightest get light spikes. */
    near = Array.from({ length: Math.round(W * H / 9000) }, () => ({
      x: rand(0, W), y: rand(0, H), r: rand(.7, 1.6), depth: rand(.4, 1),
      color: pick(COLORS), phase: rand(0, 6.28), speed: rand(.6, 1.8)
    }));
    for (let i = 0; i < Math.max(4, near.length / 40); i++) Object.assign(near[i], { r: rand(1.6, 2.2), depth: 1, spikes: true });
  }

  function star(x, y, r, color, alpha, spikes) {
    c.globalAlpha = alpha * .22;
    c.fillStyle = color;
    c.beginPath();
    c.arc(x, y, r * 3.2, 0, 6.283);
    c.fill();
    c.globalAlpha = alpha;
    c.beginPath();
    c.arc(x, y, r, 0, 6.283);
    c.fill();
    if (spikes) {
      c.globalAlpha = alpha * .45;
      c.strokeStyle = color;
      c.lineWidth = .7;
      c.beginPath();
      c.moveTo(x - r * 7, y); c.lineTo(x + r * 7, y);
      c.moveTo(x, y - r * 7); c.lineTo(x, y + r * 7);
      c.stroke();
    }
  }

  function draw(t) {
    look.x += (aim.x - look.x) * .05;
    look.y += (aim.y - look.y) * .05;
    const scroll = scrollY;
    c.clearRect(0, 0, W, H);
    c.drawImage(sky, -PAD - look.x * 10, -PAD - look.y * 10 - (scroll * .01) % PAD, W + PAD * 2, H + PAD * 2);
    for (const n of near) {
      const x = (n.x - look.x * 30 * n.depth + W) % W;
      const y = ((n.y - look.y * 20 * n.depth - scroll * .04 * n.depth) % H + H) % H;
      const twinkle = still ? .85 : .6 + .4 * Math.sin(t / 1000 * n.speed + n.phase);
      star(x, y, n.r, n.color, twinkle, n.spikes);
    }
    if (shooting) {
      const k = (t - shooting.t) / 900;
      if (k > 1) shooting = null;
      else {
        const hx = shooting.x + shooting.dx * k, hy = shooting.y + shooting.dy * k;
        const tail = c.createLinearGradient(hx, hy, hx - shooting.dx * .18, hy - shooting.dy * .18);
        tail.addColorStop(0, 'rgba(255, 244, 220, ' + (1 - k) + ')');
        tail.addColorStop(1, 'rgba(255, 244, 220, 0)');
        c.globalAlpha = 1;
        c.strokeStyle = tail;
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(hx, hy);
        c.lineTo(hx - shooting.dx * .18, hy - shooting.dy * .18);
        c.stroke();
      }
    } else if (!still && t > nextShot) {
      shooting = { x: rand(W * .3, W * 1.05), y: rand(-20, H * .3), dx: -rand(500, 800), dy: rand(220, 380), t };
      nextShot = t + rand(7000, 15000);
    }
    c.globalAlpha = 1;
  }

  let last = 0;
  function tick(t) {
    requestAnimationFrame(tick);
    /* 30 frames a second is plenty for twinkling, and saves battery. */
    if (t - last < 33 || document.hidden) return;
    last = t;
    draw(t);
  }

  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { build(); draw(performance.now()); }, 150);
  });
  build();
  nextShot = 2500;
  draw(0);
  if (!still) {
    if (matchMedia('(pointer: fine)').matches) {
      addEventListener('pointermove', e => { aim.x = e.clientX / W - .5; aim.y = e.clientY / H - .5; }, { passive: true });
    }
    addEventListener('scroll', () => { if (still) draw(performance.now()); }, { passive: true });
    requestAnimationFrame(tick);
  } else {
    addEventListener('scroll', () => draw(performance.now()), { passive: true });
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
