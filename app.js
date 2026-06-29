const categories = ['Software', 'Hardware', 'Concepts', 'Article'];

let projects = [];
let tagColors = {};
let tagOrder = [];
let activeTags = new Set();
let collapsedCats = new Set();
let sort = 'newest';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtDate = iso => { const [y, m, d] = String(iso).split('-'); return `${d}/${m}/${y}`; };

/* turn a title into a URL slug (used to link each project to its detail page) */
const TR = { 'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'I': 'i', 'İ': 'i', 'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u' };
const slugify = s => String(s)
  .replace(/[çÇğĞıIİöÖşŞüÜ]/g, c => TR[c] || c)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

/* light / dark theme toggle — remembers the last choice in localStorage */
const themeBtn = $('theme');
if (themeBtn) {
  const root = document.documentElement;
  // sync the button to whatever theme is already applied (set pre-paint in <head>)
  themeBtn.setAttribute('aria-pressed', root.getAttribute('data-theme') === 'dark' ? 'true' : 'false');
  themeBtn.addEventListener('click', () => {
    const isDark = root.getAttribute('data-theme') === 'dark';
    if (isDark) { root.removeAttribute('data-theme'); themeBtn.setAttribute('aria-pressed', 'false'); }
    else { root.setAttribute('data-theme', 'dark'); themeBtn.setAttribute('aria-pressed', 'true'); }
    try { localStorage.setItem('theme', isDark ? 'light' : 'dark'); } catch (e) {}
  });
}

function tagHTML(t) {
  const c = tagColors[t] || '#777777';
  return `<span class="tag" style="--c:${c}"><span class="dot"></span><span class="lbl">${esc(t)}</span></span>`;
}
function entryHTML(p) {
  const tags = (p.tags && p.tags.length) ? p.tags.map(tagHTML).join('') : '';
  return `<div class="entry"><span class="date">${fmtDate(p.date)}</span> ${tags}<a class="title" href="project.html?p=${encodeURIComponent(slugify(p.title))}">${esc(p.title)}</a></div>`;
}

function render() {
  const presentTags = new Set(projects.flatMap(p => p.tags || []));

  $('tagbar').innerHTML = tagOrder.filter(t => presentTags.has(t)).map(t =>
    `<button class="chip" data-tag="${t}" style="--c:${tagColors[t]}" aria-pressed="${activeTags.has(t)}">`
    + `<span class="dot"></span><span class="lbl">${t}</span></button>`
  ).join('');

  let items = projects.filter(p =>
    activeTags.size === 0 || (p.tags || []).some(t => activeTags.has(t))
  );
  items.sort((a, b) => sort === 'newest' ? String(b.date).localeCompare(a.date) : String(a.date).localeCompare(b.date));

  let html = '';
  categories.forEach(cat => {
    const group = items.filter(p => p.category === cat);
    if (!group.length) return;
    const collapsed = collapsedCats.has(cat);
    html += `<section class="cat-section${collapsed ? ' collapsed' : ''}" data-cat="${esc(cat)}">`
      + `<button class="cat-head" type="button" aria-expanded="${!collapsed}">`
      + `<span class="cat-arrow" aria-hidden="true">↓</span><span>${esc(cat)}</span></button>`
      + `<div class="cat-body">` + group.map(entryHTML).join('') + `</div>`
      + `</section>`;
  });
  $('list').innerHTML = html || `<p class="empty">No projects match this filter.</p>`;

  $('count').textContent = `${items.length} project${items.length === 1 ? '' : 's'}`;
  $('sort').textContent = sort === 'newest' ? 'date ↓' : 'date ↑';
  $('clear').hidden = activeTags.size === 0;
}

$('tagbar').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const t = b.dataset.tag;
  activeTags.has(t) ? activeTags.delete(t) : activeTags.add(t);
  render();
});
$('sort').addEventListener('click', () => { sort = sort === 'newest' ? 'oldest' : 'newest'; render(); });
$('clear').addEventListener('click', () => { activeTags.clear(); render(); });

// click a category heading to collapse/expand its projects (state is remembered)
$('list').addEventListener('click', e => {
  const head = e.target.closest('.cat-head'); if (!head) return;
  const section = head.closest('.cat-section');
  const cat = section.dataset.cat;
  const collapse = !section.classList.contains('collapsed');
  section.classList.toggle('collapsed', collapse);
  head.setAttribute('aria-expanded', String(!collapse));
  if (collapse) collapsedCats.add(cat); else collapsedCats.delete(cat);
});

async function load() {
  try {
    const [pData, tData] = await Promise.all([
      fetch('data/projects.json').then(r => r.json()),
      fetch('data/tags.json').then(r => r.json())
    ]);
    projects = pData.items || [];
    const tagsArr = tData.items || [];
    tagOrder = tagsArr.map(x => x.name);
    tagColors = Object.fromEntries(tagsArr.map(x => [x.name, x.color]));
    render();
  } catch (err) {
    $('list').innerHTML = `<p class="empty">Couldn't load data. (If you opened this locally you need a simple server; it works fine on the live site.)</p>`;
  }
}
load();
