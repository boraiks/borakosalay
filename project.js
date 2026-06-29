/* Detail page: reads ?p=<slug> from the URL, finds the matching project
   in data/projects.json, and renders its title, date, tags, Markdown body and links. */

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtDate = iso => { const [y, m, d] = String(iso).split('-'); return `${d}/${m}/${y}`; };

const TR = { 'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'I': 'i', 'İ': 'i', 'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u' };
const slugify = s => String(s)
  .replace(/[çÇğĞıIİöÖşŞüÜ]/g, c => TR[c] || c)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

/* light / dark theme toggle (default: light) */
const themeBtn = $('theme');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const root = document.documentElement;
    const isDark = root.getAttribute('data-theme') === 'dark';
    if (isDark) { root.removeAttribute('data-theme'); themeBtn.setAttribute('aria-pressed', 'false'); }
    else { root.setAttribute('data-theme', 'dark'); themeBtn.setAttribute('aria-pressed', 'true'); }
  });
}

const renderMarkdown = md => {
  if (!md) return '';
  if (window.marked) return marked.parse ? marked.parse(md) : marked(md);
  return `<p>${esc(md)}</p>`;
};

function tagHTML(t, colors) {
  const c = colors[t] || '#777777';
  return `<span class="tag" style="--c:${c}"><span class="dot"></span><span class="lbl">${esc(t)}</span></span>`;
}

async function load() {
  const want = new URLSearchParams(location.search).get('p');
  try {
    const [pData, tData] = await Promise.all([
      fetch('data/projects.json').then(r => r.json()),
      fetch('data/tags.json').then(r => r.json())
    ]);
    const projects = pData.items || [];
    const tagsArr = tData.items || [];
    const tagColors = Object.fromEntries(tagsArr.map(x => [x.name, x.color]));

    const p = projects.find(x => slugify(x.title) === want);
    if (!p) {
      $('project').innerHTML = `<p class="empty">Project not found. <a href="index.html">Back to home</a>.</p>`;
      return;
    }

    document.title = `${p.title} — Your Name`;

    const tags = (p.tags && p.tags.length) ? p.tags.map(t => tagHTML(t, tagColors)).join('') : '';

    // labeled links + a legacy single `url` as fallback
    let links = Array.isArray(p.links) ? p.links.filter(l => l && l.url) : [];
    if (!links.length && p.url && p.url !== '#') links = [{ label: 'Link', url: p.url }];
    const linksHTML = links.length
      ? `<div class="project-links">` + links.map(l =>
          `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label || 'Link')} &#8599;</a>`
        ).join('') + `</div>`
      : '';

    const bodyHTML = p.body
      ? `<div class="project-body">${renderMarkdown(p.body)}</div>`
      : '';

    $('project').innerHTML =
      `<h1 class="project-title">${esc(p.title)}</h1>`
      + `<div class="project-meta"><span class="date">${fmtDate(p.date)}</span> ${tags}<span class="cat">${esc(p.category)}</span></div>`
      + bodyHTML
      + linksHTML;

  } catch (err) {
    $('project').innerHTML = `<p class="empty">Couldn't load this project. <a href="index.html">Back to home</a>.</p>`;
  }
}
load();
