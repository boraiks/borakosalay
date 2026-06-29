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

    // 3D model (optional): build Google's <model-viewer> from the uploaded file.
    const modelTag = p.model
      ? `<model-viewer src="${esc(p.model)}" camera-controls auto-rotate shadow-intensity="1" alt="${esc(p.title)} — 3D model"></model-viewer>`
      : '';

    // A {{model}} placeholder anywhere in the body marks where the viewer should appear.
    // Split the raw markdown on it so the model sits cleanly between blocks (top if absent).
    const parts = p.body ? p.body.split(/\{\{\s*model\s*\}\}/ig) : [''];
    const placedInBody = !!modelTag && parts.length > 1;
    let bodyHTML = '';
    if (p.body) {
      bodyHTML = placedInBody
        ? parts.map(part => renderMarkdown(part)).join(modelTag)
        : renderMarkdown(p.body.replace(/\{\{\s*model\s*\}\}/ig, ''));
    }
    const bodyBlock = bodyHTML ? `<div class="project-body">${bodyHTML}</div>` : '';

    $('project').innerHTML =
      `<h1 class="project-title">${esc(p.title)}</h1>`
      + `<div class="project-meta"><span class="date">${fmtDate(p.date)}</span> ${tags}<span class="cat">${esc(p.category)}</span></div>`
      + (placedInBody ? '' : modelTag)   // top by default; skipped if placed in the body via {{model}}
      + bodyBlock
      + linksHTML;

    // if the body embeds a 3D model, load Google's <model-viewer> on demand
    if (document.querySelector('model-viewer') && !window.__modelViewerLoaded) {
      window.__modelViewerLoaded = true;
      const s = document.createElement('script');
      s.type = 'module';
      s.src = 'https://cdn.jsdelivr.net/npm/@google/model-viewer/dist/model-viewer.min.js';
      document.head.appendChild(s);
    }

  } catch (err) {
    $('project').innerHTML = `<p class="empty">Couldn't load this project. <a href="index.html">Back to home</a>.</p>`;
  }
}
load();
