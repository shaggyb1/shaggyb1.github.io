/* One small working demo per project. Each function receives its panel element. */

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const calmMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(r => setTimeout(r, calmMotion() ? 0 : ms));

const DEMOS = {

  /* Upsoar: a scripted agent run that fills a week calendar. */
  upsoar(root) {
    const PLANS = {
      'Plan next week': [
        ['list_posts', 'read 12 recent posts'], ['analyze', 'carousels did best on Tuesday'], ['create_drafts', 'wrote 5 drafts']
      ],
      'Find a trend for my niche': [
        ['web_search', 'checked rising topics'], ['rank', 'picked the top 3 trends'], ['create_drafts', 'wrote 3 drafts']
      ],
      'Fill my quiet days': [
        ['check_calendar', 'Wednesday and Saturday are empty'], ['preflight', 'accounts are connected'], ['schedule', 'scheduled 2 posts']
      ]
    };
    const WEEK = {
      'Plan next week': { Mon: 'LI', Tue: 'IG', Wed: 'X', Thu: 'TH', Fri: 'IG' },
      'Find a trend for my niche': { Tue: 'X', Thu: 'LI', Sat: 'IG' },
      'Fill my quiet days': { Wed: 'BS', Sat: 'FB' }
    };
    const NETWORKS = { LI: 'LinkedIn', IG: 'Instagram', X: 'X', TH: 'Threads', BS: 'Bluesky', FB: 'Facebook' };
    const chips = el('div', 'chip-row');
    const steps = el('ol', 'tool-steps');
    steps.setAttribute('aria-live', 'polite');
    const cal = el('div', 'week');
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const cells = {};
    days.forEach(d => {
      const c = el('div', 'day');
      c.append(el('small', '', d));
      cells[d] = el('span', 'draft');
      c.append(cells[d]);
      cal.append(c);
    });
    let run = 0;
    async function ask(prompt, btn) {
      const me = ++run;
      chips.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === btn));
      steps.replaceChildren();
      days.forEach(d => { cells[d].textContent = ''; cells[d].parentElement.classList.remove('on'); });
      for (const [tool, result] of PLANS[prompt]) {
        const li = el('li');
        li.append(el('code', '', tool), el('span', '', result));
        steps.append(li);
        await wait(520);
        if (me !== run) return;
      }
      for (const [d, net] of Object.entries(WEEK[prompt])) {
        cells[d].textContent = net;
        cells[d].title = NETWORKS[net];
        cells[d].parentElement.classList.add('on');
        await wait(150);
        if (me !== run) return;
      }
    }
    Object.keys(PLANS).forEach(p => {
      const b = el('button', 'chip', p);
      b.type = 'button';
      b.onclick = () => ask(p, b);
      chips.append(b);
    });
    root.append(chips, steps, cal);
  },

  /* TradeWire: keyword rules tag a headline, and the gauge keeps score. */
  tradewire(root) {
    const RULES = [
      { re: /rate cut|cuts? (repo|rate)|lowers? (repo|rate)/i, impact: 'High', dir: 'Bullish', sectors: 'Banks, NBFCs, Realty, Autos' },
      { re: /rate hike|hikes? (repo|rate)|raises? (repo|rate)/i, impact: 'High', dir: 'Bearish', sectors: 'Banks, Realty, Autos' },
      { re: /holds?|unchanged|status quo/i, impact: 'Medium', dir: 'Mixed', sectors: 'Banks, Realty' },
      { re: /inflation.*(rise|jump|up|high)|cpi.*(rise|jump|up|high)/i, impact: 'High', dir: 'Bearish', sectors: 'FMCG, Consumption' },
      { re: /inflation.*(fall|cool|ease|low)|cpi.*(fall|cool|ease|low)/i, impact: 'High', dir: 'Bullish', sectors: 'FMCG, Banks' },
      { re: /crude.*(rise|jump|surge|up)|oil.*(rise|jump|surge|up)/i, impact: 'Medium', dir: 'Bearish', sectors: 'Oil marketing, Paints, Aviation' },
      { re: /crude.*(fall|drop|slip|down)|oil.*(fall|drop|slip|down)/i, impact: 'Medium', dir: 'Bullish', sectors: 'Oil marketing, Paints, Aviation' },
      { re: /gdp.*(grow|rise|beat|up)/i, impact: 'High', dir: 'Bullish', sectors: 'Broad market' },
      { re: /penalty|ban|fraud|probe|barred/i, impact: 'Medium', dir: 'Bearish', sectors: 'Named companies' },
      { re: /sebi|circular|guideline/i, impact: 'Low', dir: 'Mixed', sectors: 'Brokers, Exchanges' }
    ];
    const SAMPLES = ['RBI cuts repo rate by 25 bps', 'Crude oil prices surge 4%', 'SEBI bars firm over fraud', 'India GDP growth beats estimates'];
    const form = el('form', 'inline-form');
    const input = el('input');
    input.placeholder = 'Type a market headline';
    input.setAttribute('aria-label', 'Market headline');
    const go = el('button', 'btn', 'Tag it');
    form.append(input, go);
    const chips = el('div', 'chip-row');
    const out = el('div', 'tag-out');
    out.setAttribute('aria-live', 'polite');
    const mood = el('div', 'mood');
    const bar = el('i');
    const score = el('small', '', 'News mood: no headlines yet');
    const track = el('div', 'mood-track');
    track.append(bar);
    mood.append(track, score);
    let bull = 0, bear = 0;

    function tag(text) {
      const hit = RULES.find(r => r.re.test(text));
      out.replaceChildren();
      if (!hit) {
        out.append(el('p', 'muted', 'No rule matched. Try words like rate cut, crude, inflation or GDP.'));
        return;
      }
      out.append(el('span', 'pill imp-' + hit.impact.toLowerCase(), hit.impact + ' impact'),
        el('span', 'pill dir-' + hit.dir.toLowerCase(), { Bullish: '▲ ', Bearish: '▼ ', Mixed: '◆ ' }[hit.dir] + hit.dir),
        el('p', '', 'Usually moves: ' + hit.sectors));
      if (hit.dir === 'Bullish') bull++;
      if (hit.dir === 'Bearish') bear++;
      const total = bull + bear;
      if (total) {
        bar.style.width = (bull / total * 100) + '%';
        score.textContent = 'News mood: ' + bull + ' bullish, ' + bear + ' bearish';
      }
    }
    form.onsubmit = e => { e.preventDefault(); if (input.value.trim()) tag(input.value); };
    SAMPLES.forEach(s => {
      const b = el('button', 'chip', s);
      b.type = 'button';
      b.onclick = () => { input.value = s; tag(s); };
      chips.append(b);
    });
    root.append(form, chips, out, mood);
  },

  /* Naad: Web Audio plays Raga Bhupali over a tanpura-like drone, drawn on a ring. */
  naad(root) {
    const NOTES = [['Sa', 0], ['Re', 2], ['Ga', 4], ['Pa', 7], ['Dha', 9], ["Sa'", 12]];
    const BASE = 196;
    const canvas = el('canvas', 'naad-ring');
    canvas.setAttribute('aria-hidden', 'true');
    const play = el('button', 'btn', 'Play Raga Bhupali');
    play.type = 'button';
    const keys = el('div', 'swara');
    let ctx, master, analyser, drone = [], timer = null, data;

    function ensure() {
      if (ctx) return ctx.state === 'suspended' ? ctx.resume() : null;
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = .55;
      analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      data = new Uint8Array(analyser.frequencyBinCount);
      master.connect(analyser);
      analyser.connect(ctx.destination);
    }
    function pluck(semi, keyBtn) {
      ensure();
      const f = BASE * Math.pow(2, semi / 12), t = ctx.currentTime;
      [1, 2, 3].forEach((h, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = i ? 'sine' : 'triangle';
        o.frequency.setValueAtTime(f * h * .985, t);
        o.frequency.exponentialRampToValueAtTime(f * h, t + .09);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(.34 / h, t + .015);
        g.gain.exponentialRampToValueAtTime(.0008, t + 1.3);
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + 1.35);
      });
      if (keyBtn) {
        keyBtn.classList.add('hit');
        setTimeout(() => keyBtn.classList.remove('hit'), 240);
      }
    }
    NOTES.forEach(([name, semi]) => {
      const b = el('button', 'key', name);
      b.type = 'button';
      b.onclick = () => pluck(semi, b);
      keys.append(b);
    });
    const buttons = () => keys.querySelectorAll('button');
    const PHRASE = [0, 1, 2, 3, 2, 4, 3, 2, 1, 0, 2, 3, 4, 5, 4, 3, 2, 1, 2, 0];

    function stop() {
      clearTimeout(timer); timer = null;
      drone.forEach(o => { try { o.stop(); } catch (_) {} });
      drone = [];
      play.textContent = 'Play Raga Bhupali';
    }
    function start() {
      ensure();
      [[BASE / 2, .1], [BASE * .75, .05], [BASE, .06]].forEach(([f, v]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.value = f; g.gain.value = v * .35;
        o.connect(g); g.connect(master); o.start();
        drone.push(o);
      });
      let i = 0;
      const step = () => {
        const n = PHRASE[i % PHRASE.length];
        pluck(NOTES[n][1], buttons()[n]);
        i++;
        timer = setTimeout(step, i % 5 === 0 ? 760 : 420);
      };
      step();
      play.textContent = 'Stop';
    }
    play.onclick = () => (timer ? stop() : start());

    const c = canvas.getContext('2d');
    const accent = '#f77fa8';
    let t = 0, visible = false, raf = 0;
    function frame() {
      raf = visible ? requestAnimationFrame(frame) : 0;
      const dpr = Math.min(devicePixelRatio || 1, 2), w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== w * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, h);
      if (analyser) analyser.getByteFrequencyData(data);
      const r = Math.min(w, h) * .27, bars = 72;
      c.strokeStyle = accent; c.lineCap = 'round'; c.lineWidth = 2.4;
      t += .012;
      for (let i = 0; i < bars; i++) {
        const a = i / bars * Math.PI * 2 - Math.PI / 2;
        const mirror = i < bars / 2 ? i : bars - i;
        const level = data ? data[Math.min(mirror * 2, data.length - 1)] / 255 : 0;
        const idle = calmMotion() ? 3 : 3 + 2.5 * Math.sin(t * 2 + i * .5);
        const len = idle + level * r * .95;
        c.globalAlpha = .35 + level * .65;
        c.beginPath();
        c.moveTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r);
        c.lineTo(w / 2 + Math.cos(a) * (r + len), h / 2 + Math.sin(a) * (r + len));
        c.stroke();
      }
      c.globalAlpha = 1;
      c.fillStyle = accent;
      c.font = '600 24px "Bricolage Grotesque", sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('नाद', w / 2, h / 2);
    }
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
      if (!visible && timer) stop();
    }).observe(canvas);
    root.append(canvas, play, keys);
  },

  /* Local Distributor: turns a mixed Hindi and English list into cart lines. */
  parchi(root) {
    const ITEMS = {
      atta: 'Atta', aata: 'Atta', flour: 'Atta', 'आटा': 'Atta',
      cheeni: 'Cheeni', chini: 'Cheeni', sugar: 'Cheeni', 'चीनी': 'Cheeni',
      ande: 'Ande', anda: 'Ande', egg: 'Ande', eggs: 'Ande', 'अंडे': 'Ande',
      doodh: 'Doodh', dudh: 'Doodh', milk: 'Doodh', 'दूध': 'Doodh',
      chawal: 'Chawal', rice: 'Chawal', 'चावल': 'Chawal',
      tel: 'Tel', oil: 'Tel', 'तेल': 'Tel',
      dal: 'Dal', daal: 'Dal', 'दाल': 'Dal',
      namak: 'Namak', salt: 'Namak', 'नमक': 'Namak',
      chai: 'Chai patti', tea: 'Chai patti', 'चाय': 'Chai patti',
      sabun: 'Sabun', soap: 'Sabun', 'साबुन': 'Sabun'
    };
    const UNITS = { kilo: 'kg', kg: 'kg', किलो: 'kg', litre: 'L', liter: 'L', ltr: 'L', लीटर: 'L', packet: 'pack', pack: 'pack', पैकेट: 'pack', gram: 'g', g: 'g' };
    const DEFAULT = { Atta: 'kg', Cheeni: 'kg', Chawal: 'kg', Dal: 'kg', Namak: 'kg', Tel: 'L', Doodh: 'L', Ande: 'pcs', 'Chai patti': 'pack', Sabun: 'pack' };
    const ta = el('textarea');
    ta.rows = 2;
    ta.value = 'atta 5 kilo, cheeni 2, 1 darjan ande, doodh 2 litre, sabun';
    ta.setAttribute('aria-label', 'Shopping list');
    const cart = el('ul', 'cart');
    cart.setAttribute('aria-live', 'polite');

    function parse() {
      cart.replaceChildren();
      ta.value.split(/[,\n।]+/).map(s => s.trim()).filter(Boolean).forEach(line => {
        const words = line.toLowerCase().split(/\s+/);
        let qty = 1, unit = null, name = null;
        words.forEach(w => {
          if (/^\d+(\.\d+)?$/.test(w)) qty = parseFloat(w);
          else if (w === 'darjan' || w === 'dozen' || w === 'दर्जन') { qty *= 12; unit = 'pcs'; }
          else if (UNITS[w]) unit = UNITS[w];
          else if (ITEMS[w]) name = ITEMS[w];
        });
        const li = el('li', name ? '' : 'miss');
        if (name) li.append(el('span', '', name), el('b', '', qty + ' ' + (unit || DEFAULT[name])));
        else li.append(el('span', '', line), el('b', '', 'send on WhatsApp'));
        cart.append(li);
      });
    }
    ta.oninput = parse;
    parse();
    root.append(ta, cart);
  },

  /* Derma: marking a session done updates the count and next due date. */
  derma(root) {
    const COURSES = [
      { name: 'Chemical peel', total: 4, gap: 15 },
      { name: 'Laser hair reduction', total: 6, gap: 30 }
    ];
    let course = COURSES[0], done = 0;
    const tabs = el('div', 'chip-row');
    const dots = el('div', 'dots');
    const info = el('p', 'course-info');
    info.setAttribute('aria-live', 'polite');
    const bubble = el('div', 'wa');
    const btn = el('button', 'btn', 'Mark session done');
    btn.type = 'button';
    const fmt = d => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    function draw() {
      dots.replaceChildren();
      for (let i = 0; i < course.total; i++) dots.append(el('i', i < done ? 'on' : ''));
      const finished = done >= course.total;
      if (finished) {
        info.textContent = course.name + ': all ' + course.total + ' sessions done.';
        bubble.textContent = 'Your course is complete. Thank you for visiting.';
        btn.textContent = 'Start again';
      } else {
        const due = new Date(Date.now() + (done ? course.gap : 0) * 864e5);
        info.textContent = 'Session ' + (done + 1) + ' of ' + course.total + ' due ' + (done ? fmt(due) : 'today') + '. Sessions are ' + course.gap + ' days apart.';
        bubble.textContent = 'Hello Asha, session ' + (done + 1) + ' of your ' + course.name.toLowerCase() + ' is due ' + (done ? 'on ' + fmt(due) : 'today') + '. Tap to book your slot.';
        btn.textContent = 'Mark session done';
      }
    }
    COURSES.forEach((c, i) => {
      const b = el('button', 'chip', c.name);
      b.type = 'button';
      b.setAttribute('aria-pressed', i === 0);
      b.onclick = () => {
        course = c; done = 0;
        tabs.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
        draw();
      };
      tabs.append(b);
    });
    btn.onclick = () => { done = done >= course.total ? 0 : done + 1; draw(); };
    draw();
    root.append(tabs, dots, info, bubble, btn);
  },

  /* Consultancy: the form fills a sheet row. It sends nothing. */
  leads(root) {
    const form = el('form', 'lead-form');
    const name = el('input');
    name.placeholder = 'Your name';
    name.required = true;
    name.setAttribute('aria-label', 'Your name');
    const service = el('select');
    service.setAttribute('aria-label', 'Service');
    ['GeM registration', 'GeM bidding', 'Amazon account', 'Flipkart account'].forEach(s => service.append(el('option', '', s)));
    form.append(name, service, el('button', 'btn', 'Send enquiry'));
    const sheet = el('table', 'sheet');
    sheet.innerHTML = '<caption>Leads tab</caption><thead><tr><th scope="col">Time</th><th scope="col">Name</th><th scope="col">Service</th></tr></thead>';
    const body = el('tbody');
    sheet.append(body);
    const mail = el('p', 'mail-note', 'Waiting for an enquiry.');
    mail.setAttribute('aria-live', 'polite');
    form.onsubmit = e => {
      e.preventDefault();
      const tr = el('tr', 'new');
      const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      [time, name.value.trim(), service.value].forEach(v => tr.append(el('td', '', v)));
      body.prepend(tr);
      while (body.children.length > 3) body.lastChild.remove();
      mail.textContent = 'Owner emailed: new enquiry from ' + name.value.trim() + '.';
      form.reset();
    };
    root.append(form, sheet, mail);
  },

  /* Calculator: its own tokenizer with operator order, no eval. */
  calculator(root) {
    const shown = el('output', 'calc-screen', '0');
    const grid = el('div', 'calc-grid');
    let expr = '', justDone = false;
    const OPS = '+-×÷';

    function compute(s) {
      const parts = s.match(/\d*\.?\d+|\d+\.|[+\-×÷]/g);
      if (!parts) return 0;
      const list = [];
      parts.forEach((p, i) => {
        if (p === '-' && (i === 0 || OPS.includes(parts[i - 1]))) list.push('neg');
        else if (OPS.includes(p)) list.push(p);
        else {
          let v = parseFloat(p);
          if (list[list.length - 1] === 'neg') { list.pop(); v = -v; }
          list.push(v);
        }
      });
      while (OPS.includes(list[list.length - 1])) list.pop();
      const pass = (a, b, fnA, fnB) => {
        for (let i = 1; i < list.length - 1;) {
          if (list[i] === a || list[i] === b) {
            list.splice(i - 1, 3, list[i] === a ? fnA(list[i - 1], list[i + 1]) : fnB(list[i - 1], list[i + 1]));
          } else i += 2;
        }
      };
      pass('×', '÷', (x, y) => x * y, (x, y) => x / y);
      pass('+', '-', (x, y) => x + y, (x, y) => x - y);
      return parseFloat(list[0].toPrecision(12));
    }
    const lastNumber = () => expr.match(/\d*\.?\d*$/)[0];
    function press(k) {
      if (k === 'C') expr = '';
      else if (k === '⌫') expr = expr.slice(0, -1);
      else if (k === '=') {
        if (!expr) return;
        const v = compute(expr);
        if (!isFinite(v)) { expr = ''; shown.textContent = "Can't divide by 0"; return; }
        expr = String(v);
        justDone = true;
        shown.textContent = expr;
        return;
      } else if (k === '%') {
        const n = lastNumber();
        if (n) expr = expr.slice(0, -n.length) + parseFloat((parseFloat(n) / 100).toPrecision(12));
      } else if (OPS.includes(k)) {
        if (!expr && k !== '-') return;
        if (OPS.includes(expr.slice(-1))) expr = expr.slice(0, -1);
        expr += k;
      } else if (k === '.') {
        if (justDone) expr = '';
        if (!lastNumber().includes('.')) expr += lastNumber() ? '.' : '0.';
      } else {
        if (justDone) expr = '';
        expr += k;
      }
      justDone = false;
      shown.textContent = expr || '0';
    }
    ['C', '⌫', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='].forEach(k => {
      const b = el('button', OPS.includes(k) || k === '=' ? 'op' : (k === 'C' || k === '⌫' || k === '%') ? 'fn' : '', k);
      b.type = 'button';
      if (k === '0') b.classList.add('wide');
      if (k === '⌫') b.setAttribute('aria-label', 'Delete');
      b.onclick = () => press(k);
      grid.append(b);
    });
    root.tabIndex = 0;
    root.classList.add('calc-keys');
    root.addEventListener('keydown', e => {
      const map = { '*': '×', '/': '÷', Enter: '=', Backspace: '⌫', Escape: 'C' };
      const k = map[e.key] || e.key;
      if (/^[0-9.+\-%×÷=⌫C]$/.test(k)) {
        if (e.key === 'Enter' && e.target.tagName === 'BUTTON') return;
        e.preventDefault();
        press(k);
      }
    });
    root.append(shown, grid);
  }
};
