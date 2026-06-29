/* =========================================================
   PROJELER — yeni proje eklemek için bu listeye bir satır ekle.
   Tarih biçimi: 'YYYY-MM-DD'  (otomatik olarak GG.AA.YYYY gösterilir)
   ========================================================= */
const projects = [
  { date:'2025-03-01', category:'Article',  tags:['essay'],                  title:'Neden statik siteler?',                 url:'#' },
  { date:'2025-02-14', category:'Concepts', tags:['math'],                   title:'Fourier dönüşümünü görselleştirmek',    url:'#' },
  { date:'2025-01-09', category:'Software', tags:['frontend'],               title:'Gerçek zamanlı analiz panosu',          url:'#' },
  { date:'2024-11-02', category:'Software', tags:['datascience','backend'],  title:'Film öneri motoru',                     url:'#' },
  { date:'2024-09-12', category:'Article',  tags:['essay'],                  title:'Öğrenmeyi belgelemek üzerine',          url:'#' },
  { date:'2024-07-18', category:'Software', tags:['backend'],                title:'Dağıtık görev kuyruğu',                 url:'#' },
  { date:'2024-05-30', category:'Concepts', tags:['algorithms'],             title:'A* yol bulmayı derinlemesine',          url:'#' },
  { date:'2024-03-22', category:'Hardware', tags:['fpga'],                   title:'FPGA üzerinde kenar algılama',          url:'#' },
  { date:'2023-12-01', category:'Hardware', tags:['embedded'],               title:'STM32 ile sıcaklık günlükçüsü',         url:'#' },
];

/* Etiket renkleri — yeni etiket eklersen rengini de buraya ekle */
const tagColors = {
  datascience:'#2f6fb0',
  backend:'#b8402f',
  frontend:'#1f8a6d',
  fpga:'#a23e86',
  embedded:'#c2792a',
  math:'#4f7a34',
  algorithms:'#6a51a3',
  essay:'#6b6357',
};

/* Kategori sırası ve etiketlerin çubuktaki sırası */
const categories = ['Software','Hardware','Concepts','Article'];
const tagOrder = ['datascience','backend','frontend','fpga','embedded','math','algorithms','essay'];

/* ---- durum ---- */
let activeCat = 'all';
let activeTags = new Set();
let sort = 'newest';

const presentTags = new Set(projects.flatMap(p => p.tags));
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmtDate = iso => { const [y,m,d] = iso.split('-'); return `${d}.${m}.${y}`; };

function tagHTML(t){
  const c = tagColors[t] || '#6b6357';
  return `<span class="tag" style="--c:${c}"><span class="dot"></span><span class="lbl">${esc(t)}</span></span>`;
}
function entryHTML(p){
  const tags = p.tags.length ? `<span class="tags">${p.tags.map(tagHTML).join('')}</span>` : '';
  return `<a class="entry" href="${esc(p.url||'#')}">`
       + `<span class="date">${fmtDate(p.date)}</span>${tags}`
       + `<span class="entry-title">${esc(p.title)}</span></a>`;
}

function render(){
  /* kategori sekmeleri */
  $('cats').innerHTML = ['all', ...categories].map(c =>
    `<button data-cat="${c}" class="${c===activeCat?'active':''}">${c==='all'?'hepsi':c.toLowerCase()}</button>`
  ).join('');

  /* etiket çubuğu */
  $('tagbar').innerHTML = tagOrder.filter(t => presentTags.has(t)).map(t =>
    `<button class="chip" data-tag="${t}" style="--c:${tagColors[t]}" aria-pressed="${activeTags.has(t)}">`
    + `<span class="dot"></span><span class="lbl">${t}</span></button>`
  ).join('');

  /* süz + sırala */
  let items = projects.filter(p =>
    (activeCat === 'all' || p.category === activeCat) &&
    (activeTags.size === 0 || p.tags.some(t => activeTags.has(t)))
  );
  items.sort((a,b) => sort==='newest' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));

  /* kategoriye göre grupla */
  let html = '';
  categories.forEach(cat => {
    const group = items.filter(p => p.category === cat);
    if(!group.length) return;
    html += `<section class="cat-section"><h2 class="cat-head">${cat.toLowerCase()} — ${group.length}</h2>`
          + group.map(entryHTML).join('') + `</section>`;
  });
  $('list').innerHTML = html || `<p class="empty">Bu süzgeçle eşleşen proje yok. Bir etiketi kaldırmayı dene.</p>`;

  /* meta */
  $('count').textContent = `${items.length} proje`;
  $('sort').textContent = sort==='newest' ? 'tarih ↓' : 'tarih ↑';
  $('clear').hidden = !(activeCat !== 'all' || activeTags.size > 0);
}

/* ---- etkileşim ---- */
$('cats').addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  activeCat = b.dataset.cat; render();
});
$('tagbar').addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  const t = b.dataset.tag;
  activeTags.has(t) ? activeTags.delete(t) : activeTags.add(t);
  render();
});
$('sort').addEventListener('click', () => { sort = sort==='newest' ? 'oldest' : 'newest'; render(); });
$('clear').addEventListener('click', () => { activeCat='all'; activeTags.clear(); render(); });

render();
