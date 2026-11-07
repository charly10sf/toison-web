/* Páginas legales de toison.es (privacidad/ y borrar-cuenta/): idioma ES / EN con los textos de js/en.js.
   El español va escrito en cada página (data-t = clave). Mismo idioma guardado que la portada («toison-lang»);
   también vale ?lang=en o ?lang=es en la dirección (para enlazar la versión en inglés desde la ficha de Play). */
(function () {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const EN = window.TEXTOS_EN || {};
  const html = document.documentElement;
  const P = document.body.dataset.p || '';
  let lang = 'es';
  try {
    const q = new URLSearchParams(location.search).get('lang');
    lang = q === 'en' || q === 'es' ? q : (localStorage.getItem('toison-lang') || ((navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'es'));
  } catch (e) {}
  if (lang !== 'en') lang = 'es';

  const ES = new Map();   // lo que había escrito en español, para volver a él
  const guarda = (el, k, v) => { if (!ES.has(el)) ES.set(el, {}); const g = ES.get(el); if (!(k in g)) g[k] = v; return g[k]; };
  function aplica() {
    html.lang = lang;
    const t = document.querySelector('title'), d = document.querySelector('meta[name="description"]');
    const t0 = guarda(t, 'title', t.textContent), d0 = guarda(d, 'desc', d.content);
    t.textContent = lang === 'en' && EN[P + 'Title'] ? EN[P + 'Title'] : t0;
    d.content = lang === 'en' && EN[P + 'Desc'] ? EN[P + 'Desc'] : d0;
    $$('[data-t]').forEach((el) => { const k = el.dataset.t, es = guarda(el, 't', el.innerHTML); el.innerHTML = lang === 'en' && EN[k] != null ? EN[k] : es; });
    $$('[data-t-aria]').forEach((el) => { const k = el.dataset.tAria, es = guarda(el, 'a', el.getAttribute('aria-label')); el.setAttribute('aria-label', lang === 'en' && EN[k] != null ? EN[k] : es); });
    $$('[data-t-href]').forEach((el) => { const k = el.dataset.tHref, es = guarda(el, 'h', el.getAttribute('href')); el.setAttribute('href', lang === 'en' && EN[k] != null ? EN[k] : es); });
    $$('.idioma button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === lang));
  }
  $$('.idioma button').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.lang === lang) return;
    lang = b.dataset.lang; aplica();
    try { localStorage.setItem('toison-lang', lang); } catch (e) {}
  }));
  aplica();
})();
