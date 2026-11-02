/* Slow particles behind the page, and a slight parallax on the hero visual. */
(function background() {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('bg-particles');
  const c = canvas.getContext('2d');
  let W = 0, H = 0, dots = [];

  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = W < 760 ? 16 : 34;
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .1, vy: (Math.random() - .5) * .1,
      r: .6 + Math.random() * 1, a: .15 + Math.random() * .35
    }));
  }
  function draw() {
    c.clearRect(0, 0, W, H);
    for (const d of dots) {
      d.x = (d.x + d.vx + W) % W;
      d.y = (d.y + d.vy + H) % H;
      c.globalAlpha = d.a;
      c.fillStyle = '#a9c1ff';
      c.beginPath();
      c.arc(d.x, d.y, d.r, 0, 6.283);
      c.fill();
    }
  }

  let last = 0;
  function tick(t) {
    requestAnimationFrame(tick);
    /* 24 frames a second is plenty for dots this slow, and saves battery. */
    if (t - last < 41 || document.hidden) return;
    last = t;
    draw();
  }

  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { size(); if (still) draw(); }, 150);
  });
  size();
  if (still) draw(); else requestAnimationFrame(tick);

  const visual = document.querySelector('.hero-visual');
  if (visual && !still && matchMedia('(pointer: fine)').matches) {
    addEventListener('pointermove', e => {
      visual.style.setProperty('--px', (e.clientX / innerWidth - .5).toFixed(3));
      visual.style.setProperty('--py', (e.clientY / innerHeight - .5).toFixed(3));
    }, { passive: true });
  }
})();
