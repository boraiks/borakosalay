/* Projeler ve etiketler artık /data klasöründeki JSON dosyalarından okunuyor.
   Bu dosyaları elle değil, /admin panelinden düzenliyorsun.
   Kategoriler sabit (4 tane) olduğu için burada duruyor. */

const categories = ['Software', 'Hardware', 'Concepts', 'Article'];

let projects = [];
let tagColors = {};
let tagOrder = [];

let activeCat = 'all';
let activeTags = new Set();
let sort = 'newest';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtDate = iso => { const [y, m, d] = String(iso).split('-'); return `${d}.${m}.${y}`; };

function tagHTML(t) {
  const c = tagColors[t] || '#6b6357';
  return `<span class="tag" style="--c:${c}"><span class="dot"></span><span class="lbl">${esc(t)}</span></span>`;
}
function entryHTML(p) {
  const tags = (p.tags && p.tags.length) ? `<span class="tags">${p.tags.map(tagHTML).join('')}</span>` : '';
  return `<a class="entry" href="${esc(p.url || '#')}">`
    + `<span class="date">${fmtDate(p.date)}</span>${tags}`
    + `<span class="entry-title">${esc(p.title)}</span></a>`;
}

function render() {
  const presentTags = new Set(projects.flatMap(p => p.tags || []));

  $('cats').innerHTML = ['all', ...categories].map(c =>
    `<button data-cat="${c}" class="${c === activeCat ? 'active' : ''}">${c === 'all' ? 'hepsi' : c.toLowerCase()}</button>`
  ).join('');

  $('tagbar').innerHTML = tagOrder.filter(t => presentTags.has(t)).map(t =>
    `<button class="chip" data-tag="${t}" style="--c:${tagColors[t]}" aria-pressed="${activeTags.has(t)}">`
    + `<span class="dot"></span><span class="lbl">${t}</span></button>`
  ).join('');

  let items = projects.filter(p =>
    (activeCat === 'all' || p.category === activeCat) &&
    (activeTags.size === 0 || (p.tags || []).some(t => activeTags.has(t)))
  );
  items.sort((a, b) => sort === 'newest' ? String(b.date).localeCompare(a.date) : String(a.date).localeCompare(b.date));

  let html = '';
  categories.forEach(cat => {
    const group = items.filter(p => p.category === cat);
    if (!group.length) return;
    html += `<section class="cat-section"><h2 class="cat-head">${cat.toLowerCase()} — ${group.length}</h2>`
      + group.map(entryHTML).join('') + `</section>`;
  });
  $('list').innerHTML = html || `<p class="empty">Bu süzgeçle eşleşen proje yok. Bir etiketi kaldırmayı dene.</p>`;

  $('count').textContent = `${items.length} proje`;
  $('sort').textContent = sort === 'newest' ? 'tarih ↓' : 'tarih ↑';
  $('clear').hidden = !(activeCat !== 'all' || activeTags.size > 0);
}

$('cats').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  activeCat = b.dataset.cat; render();
});
$('tagbar').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const t = b.dataset.tag;
  activeTags.has(t) ? activeTags.delete(t) : activeTags.add(t);
  render();
});
$('sort').addEventListener('click', () => { sort = sort === 'newest' ? 'oldest' : 'newest'; render(); });
$('clear').addEventListener('click', () => { activeCat = 'all'; activeTags.clear(); render(); });

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
    $('list').innerHTML = `<p class="empty">Veriler yüklenemedi. (Yerelde açtıysan basit bir sunucu gerekiyor; canlı sitede sorunsuz çalışır.)</p>`;
  }
}
load();
