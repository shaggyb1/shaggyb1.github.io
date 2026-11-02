/* Builds the project list and the skills table from data.js. */

function projectLinks(p) {
  const row = el('p', 'links');
  const add = (node) => {
    if (row.childNodes.length) row.append(' · ');
    row.append(node);
  };
  if (p.live) {
    const a = el('a', '', p.live.label);
    a.href = p.live.url; a.target = '_blank'; a.rel = 'noopener';
    add(a);
  } else if (p.liveNote) {
    add(p.liveNote);
  }
  if (p.repo && p.repo.private) {
    add('Private code, walkthrough on request');
  } else if (p.repo) {
    const a = el('a', '', 'Code on GitHub');
    a.href = p.repo.url; a.target = '_blank'; a.rel = 'noopener';
    add(a);
  } else {
    add(p.repoNote);
  }
  if (p.sample) {
    const a = el('a', '', p.sample.label);
    a.href = p.sample.url; a.target = '_blank'; a.rel = 'noopener';
    add(a);
  }
  return row;
}

function demoBlock(p) {
  const box = el('details', 'try');
  box.append(el('summary', '', 'Try a small version: ' + p.demoTitle));
  const panel = el('div', 'p-demo');
  const body = el('div', 'demo-body');
  const note = el('p', 'demo-note');
  note.innerHTML = p.demoNote;
  if (p.live) {
    const a = el('a', '', p.live.label);
    a.href = p.live.url; a.target = '_blank'; a.rel = 'noopener';
    note.append(' The real product is at ', a, '.');
  }
  panel.append(body, note);
  box.append(panel);
  try { DEMOS[p.demo](body); } catch (err) { body.textContent = 'This demo could not start.'; console.error(err); }
  return box;
}

function headBlock(p, tag) {
  const head = el('header', 'p-head');
  const logo = el('img', 'p-logo');
  logo.src = p.logo; logo.alt = ''; logo.width = 44; logo.height = 44;
  const text = el('div');
  text.append(el(tag, '', p.name), el('p', 'p-kind', p.kind + '. ' + p.status + '.'));
  head.append(logo, text);
  return head;
}

function shotImage(p) {
  if (p.video) {
    const video = el('video', 'p-shot');
    video.src = p.video; video.poster = p.shot; video.controls = true; video.preload = 'none';
    video.setAttribute('aria-label', 'Demo video of ' + p.name);
    return video;
  }
  const shot = el('img', 'p-shot');
  shot.src = p.shot; shot.alt = 'Screenshot of ' + p.name;
  shot.width = 960; shot.height = 600; shot.loading = 'lazy';
  return shot;
}

const list = document.getElementById('project-list');
const cards = el('div', 'cards');
PROJECTS.forEach(p => {
  const item = el('article', p.feature ? 'project feature' : 'project small');
  item.id = p.id;
  item.style.setProperty('--p', p.accent);
  if (p.feature) {
    const lede = el('p', 'p-lede', p.line);
    const cols = el('div', 'p-sections');
    p.sections.forEach(([h, t]) => {
      const s = el('section');
      s.append(el('h4', '', h), el('p', '', t));
      cols.append(s);
    });
    const hist = el('details', 'try');
    hist.append(el('summary', '', 'Version history'));
    const ol = el('ol', 'history');
    p.log.forEach(([k, v]) => {
      const li = el('li');
      li.append(el('b', '', k), ' ' + v);
      ol.append(li);
    });
    hist.append(ol);
    item.append(headBlock(p, 'h3'), lede, shotImage(p), cols, projectLinks(p), el('p', 'p-tech', 'Tech stack: ' + p.tech), demoBlock(p), hist);
  } else {
    if (p.shot) item.append(shotImage(p));
    item.append(headBlock(p, 'h3'), el('p', 'p-note', p.note), projectLinks(p), el('p', 'p-tech', 'Tech stack: ' + p.tech), demoBlock(p));
  }
  (p.feature ? list : cards).append(item);
});

list.append(cards);

const filter = document.getElementById('project-filter');
['All', 'Live', 'AI', 'Mobile', 'Business'].forEach(tag => {
  const b = el('button', 'filter', tag);
  b.type = 'button';
  b.setAttribute('aria-pressed', tag === 'All');
  b.onclick = () => {
    filter.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    PROJECTS.forEach(p => {
      document.getElementById(p.id).hidden = tag !== 'All' && !p.tags.includes(tag);
    });
  };
  filter.append(b);
});

const ICONS = 'https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/';
const skills = document.getElementById('skills-list');
const grid = el('ul', 'skill-grid');
MAIN_SKILLS.forEach(([name, icon]) => {
  const li = el('li');
  const img = el('img');
  img.src = ICONS + icon.split('-')[0] + '/' + icon + '.svg';
  img.alt = ''; img.width = 62; img.height = 62; img.loading = 'lazy';
  li.append(img, el('span', '', name));
  grid.append(li);
});
const others = el('dl', 'skill-lines');
OTHER_SKILLS.forEach(([group, items]) => {
  const row = el('div');
  row.append(el('dt', '', group), el('dd', '', items));
  others.append(row);
});
skills.append(grid, others);

/* The page has no server, so the form opens the visitor's email app with the message filled in. */
document.getElementById('contact-form').onsubmit = e => {
  e.preventDefault();
  const f = e.target;
  const a = document.createElement('a');
  a.href = 'mailto:bhushan20082@gmail.com?subject=' + encodeURIComponent('Portfolio enquiry from ' + f.elements.name.value.trim()) + '&body=' + encodeURIComponent(f.elements.message.value.trim());
  a.click();
};
