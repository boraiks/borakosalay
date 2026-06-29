const categories = ['Software', 'Hardware', 'Concepts', 'Article'];

let projects = [];
let tagColors = {};
let tagOrder = [];
let activeTags = new Set();
let sort = 'newest';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtDate = iso => { const [y, m, d] = String(iso).split('-'); return `${d}/${m}/${y}`; };

const themeBtn = $('theme');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const root = document.documentElement;
    const isDark = root.getAttribute('data-theme') === 'dark';
    if (isDark) { root.removeAttribute('data-theme'); themeBtn.setAttribute('aria-pressed', 'false'); }
    else { root.setAttribute('data-theme', 'dark'); themeBtn.setAttribute('aria-pressed', 'true'); }
  });
}

function tagHTML(t) {
  const c = tagColors[t] || '#777777';
  return `<span class="tag" style="--c:${c}"><span class="dot"></span><span class="lbl">${esc(t)}</span></span>`;
}
function entryHTML(p) {
  const tags = (p.tags && p.tags.length) ? p.tags.map(tagHTML).join('') : '';
  return `<div class="entry"><span class="date">${fmtDate(p.date)}</span> ${tags}<a class="title" href="${esc(p.url || '#')}">${esc(p.title)}</a></div>`;
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
    html += `<section class="cat-section"><h2 class="cat-head">${esc(cat)}</h2>`
      + group.map(entryHTML).join('') + `</section>`;
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
