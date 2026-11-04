(() => {
  'use strict';
  const html = document.documentElement;
  html.classList.add('js');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const EN = window.TEXTOS_EN || {};
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fino = matchMedia('(pointer: fine)').matches;
  const NB = ' ';
  let lang = 'es';
  const L = (es, en) => (lang === 'en' ? en : es);

  /* ---------- la dirección de la app: UNA constante (toison.es/app redirige a la app mientras no viva ahí) ---------- */
  const APP = 'https://toison.es/app';
  $$('[data-app]').forEach((a) => { a.href = APP; });

  /* ---------- la lista de espera: Firestore del proyecto, colección «acceso» (reglas en claude/web-toison.md) ---------- */
  const ACCESO = 'https://firestore.googleapis.com/v1/projects/growfolio-a79a9/databases/(default)/documents/acceso?key=AIzaSyAECqndaNt3kRC6HBLnWehTmvEWVpuIJbM';

  /* ---------- números ---------- */
  function fmt(n, d = 0) {
    const s = Math.abs(n).toFixed(d).split('.');
    const mil = lang === 'en' ? ',' : '.', dec = lang === 'en' ? '.' : ',';
    s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, mil);
    return (n < 0 ? '−' : '') + s.join(dec);
  }
  function eur(n, d = 0) {
    const v = fmt(Math.abs(n), d), signo = n < 0 ? '−' : '';
    return lang === 'en' ? signo + '€' + v : signo + v + NB + '€';
  }
  const pct = (n, d = 2) => (n > 0 ? '+' : '') + fmt(n, d) + (lang === 'en' ? '%' : NB + '%');
  const pc = (n) => fmt(n, 0) + (lang === 'en' ? '%' : NB + '%');
  const flecha = (n) => (n >= 0 ? '▲ ' : '▼ ') + pct(n);
  function azar(semilla) {
    let a = semilla >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const serie = (semilla, n, tend) => { const r = azar(semilla); let v = 50; const p = []; for (let i = 0; i < n; i++) { v += (r() - 0.5) * 3.2 + tend; p.push(v); } return p; };
  const trazo = (p, w, h, m = 2) => { const mn = Math.min(...p), mx = Math.max(...p); return p.map((y, i) => [i * w / (p.length - 1), m + (h - 2 * m) * (1 - (y - mn) / (mx - mn || 1))]); };
  const linea = (pts) => pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('');
  const mini = (semilla, tend, cls, w = 60, h = 20, pref = 'a-') => `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${linea(trazo(serie(semilla, 24, tend), w, h))}" fill="none" stroke="var(--${pref}${cls})" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

  /* ================= textos (ES / EN) ================= */
  const ES = new Map();
  function aplicaTextos() {
    html.lang = lang;
    document.title = L('Toisón · Todas tus inversiones, en un solo sitio', 'Toisón · All your investments, in one place');
    const d = $('meta[name="description"]');
    if (d) { if (!ES.has(d)) ES.set(d, d.content); d.content = lang === 'en' && EN.metaDesc ? EN.metaDesc : ES.get(d); }
    const pon = (attr, sel, leer, poner) => $$(sel).forEach((el) => {
      const k = el.getAttribute(attr); const clave = attr + ':' + k;
      if (!ES.has(el)) ES.set(el, {});
      const g = ES.get(el); if (!(clave in g)) g[clave] = leer(el);
      poner(el, lang === 'en' && EN[k] != null ? EN[k] : g[clave]);
    });
    pon('data-t', '[data-t]', (e) => e.innerHTML, (e, v) => { e.innerHTML = v; });
    pon('data-t-aria', '[data-t-aria]', (e) => e.getAttribute('aria-label'), (e, v) => e.setAttribute('aria-label', v));
    pon('data-t-ph', '[data-t-ph]', (e) => e.placeholder, (e, v) => { e.placeholder = v; });
    pon('data-t-alt', '[data-t-alt]', (e) => e.alt, (e, v) => { e.alt = v; });
    $$('.idioma button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === lang));
  }
  function ponLang(l, guardar) {
    lang = l === 'en' ? 'en' : 'es';
    aplicaTextos();
    pintaTodo();
    if (guardar) { try { localStorage.setItem('toison-lang', lang); } catch (e) {} }
  }
  $$('.idioma button').forEach((b) => b.addEventListener('click', () => ponLang(b.dataset.lang, true)));

  /* ================= pantallas de la app (ordenador) ================= */
  const grafCartera = () => {
    const pts = trazo(serie(48215, 60, 0.55), 340, 70, 6), d = linea(pts), u = pts[pts.length - 1];
    return `<svg class="spark" viewBox="0 0 340 70" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="gc" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--a-graf)" stop-opacity=".3"/><stop offset="1" stop-color="var(--a-graf)" stop-opacity="0"/></linearGradient></defs>
      <path class="ar" d="${d}L340 70L0 70Z" fill="url(#gc)"/><path class="ln" pathLength="1" d="${d}" fill="none" stroke="var(--a-graf)" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
      <circle class="halo" cx="${u[0]}" cy="${u[1]}" r="4"/><circle class="punta" cx="${u[0]}" cy="${u[1]}" r="3.5"/></svg>`;
  };
  const av = (t, c) => `<span class="av" style="background:${c}">${t}</span>`;
  const pos = (ab, c, n, br, v, d) => `<div class="pos">${av(ab, c)}<div><b>${n}</b><small>${br}</small></div><div class="d"><b class="num">${eur(v, 2)}</b></div><div class="d ${d >= 0 ? 'sube' : 'baja'}"><small class="num">${flecha(d)}</small></div></div>`;
  const anillo = (f) => `<svg class="anillo" viewBox="0 0 46 46" aria-hidden="true"><circle class="fondo" cx="23" cy="23" r="18"/><circle class="lleno" cx="23" cy="23" r="18" pathLength="1" style="stroke-dashoffset:${1 - f}"/></svg>`;
  const SG = { '+': ['▲', 'p'], '-': ['▼', 'n'], '=': ['=', 'e'], '±': ['◆', 'm'] };
  const pesos = (n) => `<span class="pesos">${[1, 2, 3].map((k) => `<i class="${k <= n ? 'on' : ''}"></i>`).join('')}</span>`;
  const FACT = [[['Negocio', 'Business'], '+', 3], [['Sector', 'Sector'], '+', 2], [['Economía', 'Economy'], '=', 1], [['Política y leyes', 'Politics and law'], '±', 2], [['Sociedad', 'Society'], '+', 1], [['Mercado', 'Market'], '-', 2]];
  const ejemplo = () => `<span class="ejemplo">${L('Ejemplo', 'Example')}</span>`;

  const PANTALLAS = {
    cartera: () => `<div class="pantalla p-cartera">
      <div class="tarj"><div class="et"><span>${L('Patrimonio', 'Net worth')}</span><span>${L('Hoy, 17:35', 'Today, 17:35')}</span></div><div class="cifra num">${eur(48215.3, 2)}</div>
        <div class="delta sube num">▲ +${eur(1204.1, 2)} (${pct(2.56)}) <span>${L('este año', 'this year')}</span></div>${grafCartera()}
        <div class="rango"><i>${L('1S', '1W')}</i><i>1M</i><i class="on">${L('1A', '1Y')}</i><i>${L('Máx', 'Max')}</i></div></div>
      <div style="display:grid;gap:12px;align-content:start">
        <div class="tarj"><div class="et">${L('Reparto', 'Allocation')}</div>
          <div class="reparto"><span style="--i:0;flex:58;background:var(--a-graf)"></span><span style="--i:1;flex:26;background:#2f5d8c"></span><span style="--i:2;flex:10;background:#7b6bae"></span><span style="--i:3;flex:6;background:#3f8a6b"></span></div>
          <div class="ley"><span><i style="background:var(--a-graf)"></i>${L('Fondos', 'Funds')}<b>${pc(58)}</b></span><span><i style="background:#2f5d8c"></i>ETF<b>${pc(26)}</b></span><span><i style="background:#7b6bae"></i>${L('Oro', 'Gold')}<b>${pc(10)}</b></span><span><i style="background:#3f8a6b"></i>${L('Cripto', 'Crypto')}<b>${pc(6)}</b></span></div></div>
        <div class="tarj"><div class="et"><span>${L('Riesgo: ', 'Risk: ')}<b style="color:var(--a-txt)">${L('4 de 7', '4 of 7')}</b></span></div><div class="riesgo">${[1, 2, 3, 4, 5, 6, 7].map((k) => `<i class="${k <= 4 ? 'on' : ''}"></i>`).join('')}</div></div>
      </div>
      <div class="tarj lista">
        ${pos('FM', '#8a6216', L('Fondo indexado mundial', 'Global index fund'), 'MyInvestor · ' + L('Fondo', 'Fund'), 18420.55, 0.92)}
        ${pos('US', '#2f5d8c', L('ETF de EE. UU.', 'US ETF'), 'Trade Republic · ETF', 12310, -0.31)}
        ${pos('RF', '#8a6216', L('Fondo de renta fija', 'Bond fund'), 'MyInvestor · ' + L('Fondo', 'Fund'), 9643.06, 0.12)}
      </div></div>`,
    paso: () => `<div class="pantalla p-paso">
      <div class="tarj"><div class="et"><span>${L('Noviembre · tu mes', 'November · your month')}</span><span>${L('1 de 4 hecho', '1 of 4 done')}</span></div>
        <div style="display:flex;gap:14px;align-items:center;margin-top:8px">${anillo(0.25)}<div><b style="font-size:14px">${L('Lo que hay que vigilar', 'What to keep an eye on')}</b><div style="font-size:11px;color:var(--a-txt2)">${L('Lo decides tú. Toisón solo lleva la cuenta.', 'Your call. Toisón just keeps track.')}</div></div></div>
        <div class="check ok"><i></i><div>${L('Tu aportación programada: ' + eur(200) + ' al fondo mundial', 'Your scheduled contribution: ' + eur(200) + ' to the global fund')}<small>${L('En la renta: nada', 'Tax effect: none')}</small></div></div>
        <div class="check"><i></i><div>${L('Resultados de dos empresas tuyas', 'Earnings from two of your companies')}<small>${L('Jueves 12 y martes 17', 'Thursday 12 and Tuesday 17')}</small></div></div>
        <div class="check"><i></i><div>${L('Tecnología: ' + pc(34) + ', tu límite es ' + pc(30), 'Tech: ' + pc(34) + ', your limit is ' + pc(30))}<span class="chip">${L('Lo decides tú', 'Your call')}</span></div></div>
        <div class="check"><i></i><div>${L('31 dic: cierra el año fiscal', '31 Dec: tax year ends')}<small>${L('Después, todo cuenta para 2027', 'After that, it counts for 2027')}</small></div></div></div>
      <div style="display:grid;gap:12px;align-content:start">
        <div class="tarj"><div class="et">${L('Renta de 2026 hasta hoy', '2026 tax so far')}</div><div class="cifra num" style="font-size:24px">${eur(241.76, 2)}</div><div style="font-size:11px;color:var(--a-txt2)">${L('Ya retenido: ' + eur(59.36, 2), 'Already withheld: ' + eur(59.36, 2))}</div></div>
        <div class="nota-app"><b>${L('La IA explica', 'The AI explains')}</b>${L('El límite del ' + pc(30) + ' lo pusiste tú. Lo ha pasado el fabricante de chips. Tu regla, tu decisión.', 'You set the ' + pc(30) + ' limit. The chipmaker pushed it over. Your rule, your decision.')}</div>
      </div></div>`,
    mercados: () => `<div class="pantalla p-mercados">
      <div class="tarj" style="padding-top:6px;padding-bottom:6px">
        <div class="idx"><div><b>S&amp;P 500</b><small>${L('EE. UU.', 'US')}</small></div>${mini(1, -0.12, 'baja')}<span class="num baja">${flecha(-0.3)}</span></div>
        <div class="idx"><div><b>Ibex 35</b><small>${L('España', 'Spain')}</small></div>${mini(2, 0.2, 'sube')}<span class="num sube">${flecha(0.6)}</span></div>
        <div class="idx"><div><b>Euro Stoxx 50</b><small>${L('Zona euro', 'Eurozone')}</small></div>${mini(4, 0.1, 'sube')}<span class="num sube">${flecha(0.2)}</span></div>
        <div class="idx"><div><b>${L('Euro / dólar', 'Euro / dollar')}</b><small>${L('Divisas', 'Currencies')}</small></div>${mini(3, 0.15, 'sube')}<span class="num sube">${flecha(0.5)}</span></div>
        <div class="idx"><div><b>${L('Oro', 'Gold')}</b><small>${L('Materias primas', 'Commodities')}</small></div>${mini(5, 0.08, 'sube')}<span class="num sube">${flecha(1.1)}</span></div>
      </div>
      <div style="display:grid;gap:12px;align-content:start">
        <div class="tarj"><div class="et"><span>${L('Bolsas hoy', 'Markets today')}</span><span class="sube">▲ ${L('7 de 10 suben', '7 of 10 up')}</span></div><div style="font-size:12px;margin-top:6px">${L('Asia cerró mixta, Europa sube con la banca y EE. UU. abre plano a la espera de resultados.', 'Asia closed mixed, Europe is up on banks and the US opens flat ahead of earnings.')}</div></div>
        <div class="nota-app"><b>${L('Para tu cartera', 'For your portfolio')}</b>${L('El euro sube: lo tuyo en dólares vale unos ' + eur(61) + ' menos.', 'The euro is up: your dollar holdings are worth about ' + eur(61) + ' less.')}</div>
      </div></div>`,
    expertos: () => `<div class="pantalla p-mercados">
      <div class="tarj"><b style="font-size:14px">${L('Fabricante de chips', 'Chipmaker')}</b><small style="display:block;color:var(--a-txt2)">${L('EE. UU. · Semiconductores · en tu cartera', 'US · Semiconductors · in your portfolio')}</small>
        <div class="fila" style="margin-top:10px"><span>${L('En tu cartera', 'In your portfolio')}</span><b class="num">${fmt(2.1, 1)}${lang === 'en' ? '%' : NB + '%'} · ${L('vía ETF', 'via ETF')}</b></div>
        <div class="fila"><span>${L('Última ficha', 'Last profile')}</span><b>${L('Hoy, 15:40', 'Today, 15:40')}</b></div>
        <div class="fila"><span>${L('Radar de Toisón', 'Toisón radar')}</span><b>${L('840 empresas', '840 companies')}</b></div>
        <small style="display:block;margin-top:8px;color:var(--a-txt2)">${L('Hechos y opiniones por separado, con las fuentes.', 'Facts and opinions kept apart, with sources.')}</small></div>
      <div class="tarj"><div class="et" style="margin-bottom:4px">${L('Lo que dice la prensa, por factores', 'What the press says, by factor')}</div>
        ${FACT.map(([n, s, p]) => `<div class="ff"><span>${L(n[0], n[1])}</span><span class="sg ${SG[s][1]}">${SG[s][0]}</span>${pesos(p)}</div>`).join('')}
        <small style="display:block;margin-top:8px;color:var(--a-txt2)">${L('Análisis con IA · decides tú', 'AI analysis · your call')}</small></div></div>`,
    hacienda: () => `<div class="pantalla p-hacienda">
      <div class="tarj"><div class="et"><span>${L('Renta de 2026 · lo que supondría hoy', '2026 tax · what it would mean today')}</span></div><div class="cifra num">${eur(241.76, 2)}</div>
        <div class="fila" style="margin-top:8px"><span>${L('Ganancias realizadas', 'Realised gains')}</span><b class="num">${eur(1080, 2)}</b></div>
        <div class="fila"><span>${L('Dividendos', 'Dividends')}</span><b class="num">${eur(312.4, 2)}</b></div>
        <div class="fila"><span>${L('Pérdidas que compensan', 'Losses offset')}</span><b class="num">−${eur(120, 2)}</b></div>
        <div class="fila"><span>${L('Ya retenido', 'Already withheld')}</span><b class="num">${eur(59.36, 2)}</b></div>
        <div class="fila"><span><b>${L('Quedaría por pagar', 'Left to pay')}</b></span><b class="num">${eur(182.4, 2)}</b></div></div>
      <div style="display:grid;gap:12px;align-content:start">
        <div class="tarj"><div class="et">${L('Por tramos', 'By bracket')}</div>
          <div class="tramo"><span>${L('Hasta 6.000 € · 19' + NB + '%', 'Up to €6,000 · 19%')}</span><b class="num">${eur(241.76, 2)}</b><i style="--w:21%"></i></div>
          <div class="tramo"><span>${L('6.000 a 50.000 € · 21' + NB + '%', '€6,000 to €50,000 · 21%')}</span><b class="num">${eur(0, 2)}</b><i style="--w:0%"></i></div></div>
        <div class="nota-app"><b>${L('Guía de la renta', 'Tax return guide')}</b>${L('Casillas, plazos y papeles de cada bróker.', 'Boxes, deadlines and each broker’s documents.')}</div>
      </div></div>`
  };
  let pantallaActual = 'cartera';
  const cuerpo = $('#app-cuerpo');
  function ponPantalla(k) {
    pantallaActual = k;
    cuerpo.innerHTML = PANTALLAS[k]();
    $$('.app-tabs button').forEach((b) => b.setAttribute('aria-selected', b.dataset.p === k));
  }
  $$('.app-tabs button').forEach((b) => b.addEventListener('click', () => ponPantalla(b.dataset.p)));

  /* ================= el móvil ================= */
  const ICON = {
    ini: '<path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>',
    paso: '<path d="M8 6h11M8 12h11M8 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
    merc: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.5 2.5 2.5 13.5 0 16M12 4c-2.5 2.5-2.5 13.5 0 16"/>',
    not: '<path d="M5 5h11v14H7a2 2 0 0 1-2-2zM16 9h3v8a2 2 0 0 1-2 2"/><path d="M8 9h5M8 12h5M8 15h3"/>',
    exp: '<path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z"/>'
  };
  const navApp = (act) => '<div class="barra-nav">' + [['ini', 'Inicio', 'Home'], ['paso', 'Paso a paso', 'Steps'], ['merc', 'Mercados', 'Markets'], ['not', 'Noticias', 'News'], ['exp', 'Expertos', 'Experts']]
    .map(([k, es, en], i) => `<span class="${i === act ? 'act' : ''}"><svg viewBox="0 0 24 24">${ICON[k]}</svg>${L(es, en)}</span>`).join('') + '</div>';
  const ESTADO = '<div class="estado"><span>9:41</span><span><svg viewBox="0 0 18 11"><rect x="0" y="7" width="3" height="4" rx=".7"/><rect x="5" y="5" width="3" height="6" rx=".7"/><rect x="10" y="2.5" width="3" height="8.5" rx=".7"/><rect x="15" y="0" width="3" height="11" rx=".7"/></svg></span></div>';
  const yo = '<span class="yo"><svg viewBox="-82 -78 164 147" aria-hidden="true"><use class="s-o" href="#o"/><use class="s-t" href="#t"/></svg></span>';
  function pintaMovil() {
    $('#movil').innerHTML = `<div class="pant">${ESTADO}<div class="capa">
      <div class="hola"><div><small>${L('Noviembre', 'November')}</small><b>${L('Paso a paso', 'Step by step')}</b></div>${yo}</div>
      <div class="tarj" style="display:flex;align-items:center;gap:8px">${anillo(0.25)}<div><b style="font-size:11px">${L('1 de 4 hecho', '1 of 4 done')}</b><small style="display:block;color:var(--a-txt2)">${L('Tu mes', 'Your month')}</small></div><span class="ejemplo" style="margin-left:auto;font-size:7px;padding:2px 5px">${L('Ejemplo', 'Example')}</span></div>
      <div class="tarj">
        <div class="check ok"><i></i><div>${L('Tu aportación programada: ' + eur(200), 'Your scheduled contribution: ' + eur(200))}<small>${L('En la renta: nada', 'Tax effect: none')}</small></div></div>
        <div class="check"><i></i><div>${L('Resultados de dos empresas tuyas', 'Earnings from two of your companies')}<small>${L('Jueves 12 y martes 17', 'Thursday 12 and Tuesday 17')}</small></div></div>
        <div class="check"><i></i><div>${L('Tecnología: ' + pc(34) + ', tu límite es ' + pc(30), 'Tech: ' + pc(34) + ', your limit is ' + pc(30))}<span class="chip">${L('Lo decides tú', 'Your call')}</span></div></div>
      </div>
      <div class="tarj"><div class="et">${L('Renta de 2026 hasta hoy', '2026 tax so far')}</div><div class="cifra num">${eur(241.76, 2)}</div></div>
      <div class="tarj solo-movil"><div class="et" style="display:flex;justify-content:space-between"><span>${L('Bolsas hoy', 'Markets today')}</span><span class="sube">▲ ${L('7 de 10 suben', '7 of 10 up')}</span></div></div>
      ${navApp(1)}</div></div>`;
  }

  /* ---------- la maqueta de la app escala a lo ancho ---------- */
  const wrap = $('.demo-wrap'), demo = $('#demo');
  function escala() {
    const cs = getComputedStyle(wrap), W = +cs.getPropertyValue('--demo-w'), H = +cs.getPropertyValue('--demo-h');
    const s = Math.min(W <= 300 ? 1.3 : 1, wrap.clientWidth / W);
    demo.style.transform = `scale(${s})`;
    wrap.style.height = Math.round(H * s) + 'px';
  }
  new ResizeObserver(escala).observe(wrap);
  escala();

  /* ---------- inclinación suave con el ratón ---------- */
  if (fino && !reducir) {
    const vent = $('#ventana'), mov = $('#movil');
    wrap.addEventListener('pointermove', (e) => {
      const r = wrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      vent.style.setProperty('--ry', (x * 6).toFixed(2) + 'deg');
      vent.style.setProperty('--rx', (-y * 5).toFixed(2) + 'deg');
      mov.style.setProperty('--mx', (x * -14).toFixed(1) + 'px');
      mov.style.setProperty('--my', (y * -10).toFixed(1) + 'px');
    });
    wrap.addEventListener('pointerleave', () => { ['--ry', '--rx'].forEach((p) => vent.style.removeProperty(p)); ['--mx', '--my'].forEach((p) => mov.style.removeProperty(p)); });
  }

  /* ================= cinta ================= */
  function pintaCinta() {
    const items = [['MyInvestor', 1], [L('Fondos', 'Funds'), 0], ['Trade Republic', 1], [L('Acciones', 'Shares'), 0], ['Revolut', 1], ['ETF', 0], ['Interactive Brokers', 1], [L('Oro', 'Gold'), 0], ['Bitvavo', 1], [L('Cripto', 'Crypto'), 0], [L('Cualquier otro bróker', 'Any other broker'), 1], [L('Precios al día', 'Up-to-date prices'), 0], [L('Widget en el móvil', 'Home-screen widget'), 0]];
    const una = items.map(([t, m]) => `<span class="${m ? 'marca' : ''}">${t}</span>`).join('');
    $('#cinta').innerHTML = una + una;
  }

  /* ================= producto ================= */
  function pintaProducto() {
    $('#mini-precios').innerHTML = [
      [L('Fondo indexado mundial', 'Global index fund'), L('Fondo · ISIN', 'Fund · ISIN'), 11, 0.3, 0.92],
      [L('ETF de EE. UU.', 'US ETF'), 'ETF', 12, -0.1, -0.31],
      [L('Oro', 'Gold'), L('Materias primas', 'Commodities'), 13, 0.2, 1.1],
      ['Bitcoin', L('Cripto', 'Crypto'), 14, 0.4, 3.4]
    ].map(([n, t, s, tend, d]) => `<div class="fila-p"><div><b>${n}</b><small>${t}</small></div>${mini(s, tend, d >= 0 ? 'sube' : 'baja', 64, 22, '')}<span class="num ${d >= 0 ? 'sube' : 'baja'}">${flecha(d)}</span></div>`).join('');

    const partes = [[L('Fondos', 'Funds'), 58, 'var(--oro)'], ['ETF', 26, '#2f5d8c'], [L('Oro', 'Gold'), 10, '#7b6bae'], [L('Cripto', 'Crypto'), 6, '#3f8a6b']];
    $('#reparto-g').innerHTML = `<div class="riesgo-lab" style="margin:0 0 10px"><span>${L('Patrimonio', 'Net worth')}</span><b class="num">${eur(48215.3, 2)}</b></div>
      <div class="riesgo-lab" style="margin:0 0 14px"><span>${L('Lo que has puesto · ganancia', 'What you put in · gain')}</span><b class="num">${eur(41500)} · <span class="sube">+${eur(6715.3, 2)}</span></b></div>
      <div class="barra">${partes.map(([n, v, c], i) => `<span style="--i:${i};flex:${v};background:${c}"></span>`).join('')}</div>
      <div class="ley" style="display:grid;grid-template-columns:1fr 1fr">${partes.map(([n, v, c]) => `<span><i style="background:${c}"></i>${n}<b style="margin-left:auto">${pc(v)}</b></span>`).join('')}</div>
      <div class="riesgo-lab"><span>${L('Riesgo de la cartera', 'Portfolio risk')}</span><b>${L('4 de 7', '4 of 7')}</b></div>
      <div class="riesgo" style="display:flex;gap:3px">${[1, 2, 3, 4, 5, 6, 7].map((k) => `<i style="flex:1;border-radius:3px" class="${k <= 4 ? 'on' : ''}"></i>`).join('')}</div>
      <div class="riesgo-lab"><span>${L('Coste medio de tus fondos y ETF (TER)', 'Average cost of your funds and ETFs (TER)')}</span><b class="num">0,21${lang === 'en' ? '%' : NB + '%'}</b></div>`;

    $('#lista-paso').innerHTML = [
      [1, L('Tu aportación programada: ' + eur(200) + ' al fondo mundial', 'Your scheduled contribution: ' + eur(200) + ' to the global fund'), L('En la renta: nada', 'Tax effect: none')],
      [0, L('Resultados de dos empresas tuyas', 'Earnings from two of your companies'), L('Jueves 12 y martes 17', 'Thursday 12 and Tuesday 17')],
      [0, L('Tecnología: ' + pc(34) + ', tu límite es ' + pc(30), 'Tech: ' + pc(34) + ', your limit is ' + pc(30)), L('Lo decides tú', 'Your call')],
      [0, L('31 de diciembre: cierra el año fiscal', '31 December: tax year ends'), L('Lo que vendas después cuenta para 2027', 'Anything sold after that counts for 2027')]
    ].map(([ok, t, s]) => `<li class="${ok ? 'ok' : ''}"><i></i><div>${t}<small>${s}</small></div></li>`).join('');

    $('#limites').innerHTML = [
      [L('Tecnología', 'Technology'), 34, 30], [L('Una sola empresa', 'A single company'), 9, 10], [L('Cripto', 'Crypto'), 6, 10], [L('Fuera del euro', 'Outside the euro'), 61, 70]
    ].map(([n, v, lim]) => `<div class="limite ${v > lim ? 'pasa' : ''}"><div class="lab"><span>${n}</span><b>${pc(v)} <span style="color:var(--txt2);font-weight:400">· ${L('límite', 'limit')} ${pc(lim)}</span></b></div>
      <div class="pista"><i style="--w:${v * 2}%"></i><u style="--l:${lim * 2}%"></u></div>${v > lim ? `<span class="chip">${L('Pasa del límite · lo decides tú', 'Over the limit · your call')}</span>` : ''}</div>`).join('');
  }

  /* ================= hasta dónde podrías llegar ================= */
  const R = [-0.01, 0.04, 0.07];
  function futuro() {
    const apo = +$('#r-apo').value, anos = +$('#r-anos').value, ini = 5000;
    $('#o-apo').value = eur(apo); $('#o-anos').value = anos;
    const vf = (r, n) => { const m = r / 12, k = n * 12; return ini * Math.pow(1 + m, k) + apo * (Math.pow(1 + m, k) - 1) / m; };
    const fin = R.map((r) => vf(r, anos)), puesto = ini + apo * 12 * anos;
    $('#v-mal').textContent = eur(fin[0]); $('#v-med').textContent = eur(fin[1]); $('#v-bien').textContent = eur(fin[2]);
    const W = 420, H = 160, top = fin[2] * 1.05, N = 40;
    const curva = (r) => linea(Array.from({ length: N + 1 }, (_, i) => [i * W / N, H - 6 - (H - 12) * vf(r, anos * i / N) / top]));
    const apor = linea(Array.from({ length: N + 1 }, (_, i) => [i * W / N, H - 6 - (H - 12) * (ini + apo * 12 * anos * i / N) / top]));
    $('#fut-svg').innerHTML = `<path class="apo" d="${apor}"/><path class="mal" d="${curva(R[0])}"/><path class="bien" d="${curva(R[2])}"/><path class="med" d="${curva(R[1])}"/>`;
    $('#fut-ejes').innerHTML = `<span>${L('Hoy', 'Today')}</span><span>${L('Aportado: ' + eur(puesto), 'Put in: ' + eur(puesto))}</span><span>${anos} ${L('años', 'years')}</span>`;
    $('#fut-nota').textContent = L(`Partiendo de ${eur(ini)} y aportando ${eur(apo)} al mes durante ${anos} años, con rentabilidades anuales de ejemplo del −1 %, 4 % y 7 %, sin costes, inflación ni impuestos. La línea de puntos es lo aportado. No es un indicador fiable de resultados futuros: puedes recuperar menos de lo aportado.`,
      `Starting from ${eur(ini)} and putting in ${eur(apo)} a month for ${anos} years, with example annual returns of −1%, 4% and 7%, before costs, inflation and taxes. The dotted line is what you put in. Not a reliable indicator of future results: you may get back less than you put in.`);
  }
  ['r-apo', 'r-anos'].forEach((id) => $('#' + id).addEventListener('input', futuro));

  /* ================= la IA: así lee una noticia ================= */
  const NOTICIAS = [
    { t: ['El fabricante de chips sube su previsión de ventas para el año', 'Chipmaker raises its sales forecast for the year'], m: ['Semiconductores · EE. UU. · hace 3 min', 'Semiconductors · US · 3 min ago'], s: '+',
      h: ['La empresa eleva la previsión un 8 % por la demanda de centros de datos. Resultados el jueves.', 'The company lifts its forecast by 8% on data-centre demand. Earnings on Thursday.'],
      q: ['A la propia empresa y a sus proveedores europeos de maquinaria. Al sector, en menor medida.', 'The company itself and its European equipment suppliers. The sector, to a lesser degree.'],
      f: [['Negocio', 'Business', '+', 3], ['Sector', 'Sector', '+', 2], ['Mercado', 'Market', '±', 1]],
      c: ['Tienes esta empresa en tu ETF de EE. UU. (un 2,1 % de tu cartera). La tecnología ya pesa un 34 % y tu límite es el 30 %.', 'You hold this company through your US ETF (2.1% of your portfolio). Tech already weighs 34% and your limit is 30%.'] },
    { t: ['El BCE mantiene los tipos de interés y no descarta bajarlos en marzo', 'The ECB holds rates and does not rule out a cut in March'], m: ['Bancos centrales · zona euro · hace 18 min', 'Central banks · eurozone · 18 min ago'], s: '=',
      h: ['Tipos sin cambios por tercera reunión seguida. El comunicado habla de «datos» para marzo.', 'Rates unchanged for the third meeting in a row. The statement points to “data” for March.'],
      q: ['A la banca europea (margen) y a la renta fija (precio). A tu fondo de renta fija, directamente.', 'European banks (margins) and bonds (prices). Your bond fund, directly.'],
      f: [['Economía', 'Economy', '=', 2], ['Política y leyes', 'Politics and law', '=', 1], ['Mercado', 'Market', '+', 1]],
      c: ['Tu fondo de renta fija (un 20 % de tu cartera) suele subir cuando bajan los tipos. No cambia nada hoy; lo seguimos en marzo.', 'Your bond fund (20% of your portfolio) tends to rise when rates fall. Nothing changes today; we follow it again in March.'] },
    { t: ['Nuevos aranceles a los coches importados desde el 1 de enero', 'New tariffs on imported cars from 1 January'], m: ['Comercio · Europa · hace 40 min', 'Trade · Europe · 40 min ago'], s: '-',
      h: ['Arancel del 15 % a los coches de fuera de la UE. Las marcas europeas con fábricas fuera, las más expuestas.', '15% tariff on cars from outside the EU. European brands with plants abroad are the most exposed.'],
      q: ['A los fabricantes de coches europeos y a sus proveedores. Al Ibex, poco.', 'European carmakers and their suppliers. Little effect on the Ibex.'],
      f: [['Política y leyes', 'Politics and law', '-', 3], ['Sector', 'Sector', '-', 2], ['Sociedad', 'Society', '±', 1]],
      c: ['No tienes fabricantes de coches. Tu fondo indexado mundial los lleva, pero pesan menos de un 1 % de tu cartera.', 'You hold no carmakers directly. Your global index fund has some, but they weigh under 1% of your portfolio.'] }
  ];
  let notActual = 0;
  function pintaNoticias() {
    $('#titulares').innerHTML = NOTICIAS.map((n, i) => `<button type="button" role="tab" aria-selected="${i === notActual}" data-i="${i}"><span>${L(n.t[0], n.t[1])}<small>${L(n.m[0], n.m[1])}</small></span><span class="sg ${SG[n.s][1]}">${SG[n.s][0]}</span></button>`).join('');
    $$('#titulares button').forEach((b) => b.addEventListener('click', () => { notActual = +b.dataset.i; pintaNoticias(); }));
    const n = NOTICIAS[notActual];
    $('#lectura').innerHTML = `<div class="paso-l"><i>1</i><div><b>${L('Qué ha pasado', 'What happened')}</b>${L(n.h[0], n.h[1])}</div></div>
      <div class="paso-l"><i>2</i><div><b>${L('A quién afecta', 'Who it affects')}</b>${L(n.q[0], n.q[1])}</div></div>
      <div class="paso-l"><i>3</i><div><b>${L('Factores', 'Factors')}</b><div class="factores">${n.f.map(([es, en, s, p]) => `<span>${L(es, en)} <span class="sg ${SG[s][1]}">${SG[s][0]}</span>${pesos(p)}</span>`).join('')}</div></div></div>
      <div class="paso-l"><i>4</i><div><b>${L('Qué supone para tu cartera', 'What it means for your portfolio')}</b>${L(n.c[0], n.c[1])}</div></div>
      <div class="decides"><b>${L('Decides tú.', 'Your call.')}</b> ${L('Toisón no te dice qué hacer: te cuenta lo que pasa y lo que supondría para ti.', 'Toisón doesn’t tell you what to do: it tells you what is going on and what it would mean for you.')}</div>`;
  }

  /* ================= hacienda: tramos ================= */
  const TRAMOS = [[6000, 0.19], [50000, 0.21], [200000, 0.23], [300000, 0.27], [Infinity, 0.30]];
  function tramos() {
    const g = +$('#r-gan').value;
    $('#o-gan').value = eur(g);
    let resto = g, desde = 0, total = 0, out = '';
    TRAMOS.forEach(([hasta, t]) => {
      const base = Math.max(0, Math.min(resto, hasta - desde)), cuota = base * t;
      total += cuota;
      const lab = hasta === Infinity ? L('Más de ' + fmt(desde) + ' €', 'Over €' + fmt(desde)) : (desde ? L(fmt(desde) + ' a ' + fmt(hasta) + ' €', '€' + fmt(desde) + ' to €' + fmt(hasta)) : L('Hasta ' + fmt(hasta) + ' €', 'Up to €' + fmt(hasta)));
      out += `<div class="tramo"><span>${lab} · ${fmt(t * 100)}${lang === 'en' ? '%' : NB + '%'}</span><b class="num">${eur(cuota, 2)}</b><i style="--w:${hasta === Infinity ? Math.min(100, base / 100000 * 100) : (base / (hasta - desde) * 100)}%"></i></div>`;
      resto -= base; desde = hasta;
    });
    $('#tramos').innerHTML = out;
    $('#t-tot').textContent = eur(total, 2);
  }
  $('#r-gan').addEventListener('input', tramos);

  /* ================= mercados: el mapa ================= */
  const BOLSAS = { US: ['S&P 500', -0.3, 14.2], ES: ['Ibex 35', 0.6, 21.5], DE: ['DAX', 0.4, 16.8], FR: ['CAC 40', 0.2, 6.1], GB: ['FTSE 100', -0.1, 8.7], JP: ['Nikkei 225', 1.1, 11.9], CN: ['Shanghai', -0.8, 7.4], IN: ['Nifty 50', 0.5, 9.8], BR: ['Bovespa', -0.4, 12.3], CA: ['TSX', 0.3, 10.4], AU: ['ASX 200', 0.2, 7.9], KR: ['Kospi', 1.4, 18.2], CH: ['SMI', 0.1, 5.2], NL: ['AEX', 0.3, 9.1], IT: ['FTSE MIB', 0.5, 13.6], MX: ['IPC', -0.2, 6.6], TW: ['Taiex', 1.2, 17.5], ZA: ['JSE', 0.0, 8.3] };
  const COL = { hoy: 1, anio: 2 }, TOPE = { hoy: 1.2, anio: 20 };
  const TUYO = { US: 48, ES: 14, DE: 6, FR: 5, JP: 5, GB: 4, CH: 3, NL: 3, CN: 3, IN: 2, TW: 2, CA: 2, KR: 1.5, AU: 1.5 };
  const TOTAL = 48215.3;
  const VIA = {
    US: [[['ETF de EE. UU.', 'US ETF'], 0.53], [['Fondo indexado mundial', 'Global index fund'], 0.47]],
    ES: [[['Acciones españolas', 'Spanish shares'], 0.62], [['Fondo de renta fija', 'Bond fund'], 0.38]],
    CN: [[['Fondo de emergentes', 'Emerging markets fund'], 0.7], [['Fondo indexado mundial', 'Global index fund'], 0.3]],
    IN: [[['Fondo de emergentes', 'Emerging markets fund'], 0.75], [['Fondo indexado mundial', 'Global index fund'], 0.25]],
    TW: [[['Fondo de emergentes', 'Emerging markets fund'], 0.7], [['Fondo indexado mundial', 'Global index fund'], 0.3]],
    KR: [[['Fondo de emergentes', 'Emerging markets fund'], 0.7], [['Fondo indexado mundial', 'Global index fund'], 0.3]]
  };
  let geo = null, modo = 'hoy', paisSel = 'ES';
  const BASE = 'color-mix(in srgb, var(--txt) 15%, var(--surf))';
  function colorPais(c, m) {
    if (m === 'tuyo') { const t = TUYO[c]; return t ? `color-mix(in srgb, var(--oro) ${Math.round(18 + 82 * Math.sqrt(t / 48))}%, ${BASE})` : BASE; }
    const b = BOLSAS[c]; if (!b) return BASE;
    const x = b[COL[m]], k = Math.round(35 + 65 * Math.min(1, Math.abs(x) / TOPE[m]));
    return `color-mix(in srgb, var(${x >= 0 ? '--sube' : '--baja'}) ${k}%, ${BASE})`;
  }
  const nomPais = (c) => (c === 'US' ? L('EE. UU.', 'United States') : geo && geo.n[c] ? L(geo.n[c][0], geo.n[c][1]) : c);
  async function cargaMapa() {
    try { const r = await fetch('mapa-mundo.json'); geo = await r.json(); } catch (e) { geo = null; }
    if (!geo) { $('.mapa-g').hidden = true; return; }
    $('#mapa').innerHTML = Object.entries(geo.mundo).map(([c, d]) => `<path data-c="${c}" class="${BOLSAS[c] || TUYO[c] ? 'con' : ''}" d="${d}"/>`).join('');
    pintaMapa();
    const caja = $('#mapa'), tip = $('#mapa-tip');
    caja.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const p = e.target.closest('path');
      if (!p) { tip.hidden = true; return; }
      const c = p.dataset.c;
      let v;
      if (modo === 'tuyo') v = TUYO[c] ? L(`${fmt(TUYO[c], TUYO[c] % 1 ? 1 : 0)}${NB}% de tu cartera`, `${fmt(TUYO[c], TUYO[c] % 1 ? 1 : 0)}% of your portfolio`) : L('Aquí no tienes nada', 'Nothing here');
      else v = BOLSAS[c] ? `${BOLSAS[c][0]}: <span class="tip-${BOLSAS[c][COL[modo]] >= 0 ? 's' : 'b'}">${flecha(BOLSAS[c][COL[modo]])}</span>` : L('No seguimos su bolsa', 'We don’t track its market');
      tip.innerHTML = `<b>${nomPais(c)}</b>${v}`;
      const rc = $('.mapa-caja').getBoundingClientRect();
      tip.style.left = (e.clientX - rc.left) + 'px'; tip.style.top = (e.clientY - rc.top) + 'px';
      tip.hidden = false;
    });
    caja.addEventListener('pointerleave', () => { tip.hidden = true; });
    caja.addEventListener('click', (e) => { const p = e.target.closest('path'); if (p && p.classList.contains('con')) { paisSel = p.dataset.c; tip.hidden = true; pintaMapa(); } });
  }
  function pintaFicha() {
    const c = paisSel, b = BOLSAS[c], t = TUYO[c];
    const celda = (x) => `<td class="${x >= 0 ? 'sube' : 'baja'}">${pct(x, x === b[1] ? 2 : 1)}</td>`;
    const tabla = b ? `<table><thead><tr><th scope="col">${L('Índice', 'Index')}</th><th scope="col">${L('Hoy', 'Today')}</th><th scope="col">${L('En el año', 'This year')}</th></tr></thead><tbody><tr><th scope="row">${b[0]}</th>${celda(b[1])}${celda(b[2])}</tr></tbody></table>` : '';
    const via = (VIA[c] || [[['Fondo indexado mundial', 'Global index fund'], 1]]);
    const tuyo = t ? `<div class="tuyo"><small>${L('Tu dinero aquí', 'Your money here')}</small><b class="num">${eur(TOTAL * t / 100)}</b> <span style="color:var(--txt2);font-size:13px">· ${fmt(t, t % 1 ? 1 : 0)}${L(NB + '% de tu cartera', '% of your portfolio')}</span>
      <ul>${via.map(([n, f]) => `<li><span>${L(n[0], n[1])}</span><b class="num">${eur(TOTAL * t / 100 * f)}</b></li>`).join('')}</ul></div>` : `<div class="tuyo"><small>${L('Tu dinero aquí', 'Your money here')}</small><b>${L('Nada', 'None')}</b></div>`;
    $('#ficha-p').innerHTML = `<div class="anim"><div style="display:flex;justify-content:space-between;align-items:center"><span class="k" style="margin:0">${L('Ficha del país', 'Country profile')}</span>${ejemplo()}</div>
      <h4>${nomPais(c)}</h4><p class="sub2">${b ? L('Bolsa principal: ', 'Main index: ') + b[0] : L('Sin bolsa seguida', 'No tracked market')}</p>${tabla}${tuyo}
      <p class="nota-p">${L('Lo que tienes en fondos se reparte por países como sus índices. Toca otro país del mapa.', 'What you hold in funds is split by country like their indices. Tap another country on the map.')}</p></div>`;
  }
  function pintaMapa() {
    if (!geo) return;
    $$('#mapa path').forEach((p) => { p.style.fill = colorPais(p.dataset.c, modo); p.classList.toggle('foco', p.dataset.c === paisSel); });
    const esc = $('#escala');
    if (modo === 'tuyo') esc.innerHTML = `<span>${pc(0)}</span><i style="background:linear-gradient(90deg, ${BASE}, var(--oro))"></i><span>${pc(48)}</span>`;
    else { const t = TOPE[modo], d = modo === 'hoy' ? 1 : 0; esc.innerHTML = `<span>${pct(-t, d)}</span><i style="background:linear-gradient(90deg, var(--baja), ${BASE}, var(--sube))"></i><span>${pct(t, d)}</span>`; }
    $('#paises').innerHTML = Object.keys(BOLSAS).sort((a, b) => nomPais(a).localeCompare(nomPais(b))).map((c) => `<li><button type="button" data-c="${c}" aria-pressed="${c === paisSel}">${nomPais(c)}</button></li>`).join('');
    $$('#paises button').forEach((b) => b.addEventListener('click', () => { paisSel = b.dataset.c; pintaMapa(); }));
    pintaFicha();
  }
  $$('#mapa-modos button').forEach((b) => b.addEventListener('click', () => { modo = b.dataset.modo; $$('#mapa-modos button').forEach((x) => x.setAttribute('aria-pressed', x === b)); pintaMapa(); }));

  /* ================= pedir acceso ================= */
  async function pedirAcceso(e) {
    e.preventDefault();
    const f = e.currentTarget, inp = $('input[type="email"]', f), nota = $('.nota', f), aviso = $('.aviso-f', f), boton = $('button', f);
    const correo = inp.value.trim().toLowerCase();
    if ($('input[name="web"]', f).value) return; // trampa para robots
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) { aviso.innerHTML = `<b>${L('Revisa el correo:', 'Check the address:')}</b> ${L('parece que falta algo.', 'something seems to be missing.')} `; inp.focus(); return; }
    aviso.textContent = '';
    boton.disabled = true;
    try {
      const r = await fetch(ACCESO, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { correo: { stringValue: correo }, cuando: { stringValue: new Date().toISOString() }, idioma: { stringValue: lang }, desde: { stringValue: 'web' } } }) });
      if (!r.ok) throw new Error(r.status);
      f.classList.add('hecho');
      $('.campo', f).hidden = true;
      nota.innerHTML = `<b>${L('Apuntado.', 'You’re on the list.')}</b> ${L('Te avisamos en ' + correo + ' cuando puedas entrar.', 'We’ll email ' + correo + ' when you can get in.')}`;
    } catch (err) {
      aviso.innerHTML = `<b>${L('No se ha podido guardar.', 'It couldn’t be saved.')}</b> ${L('Prueba otra vez en un momento o escríbenos a hola@toison.es.', 'Try again in a moment or write to hola@toison.es.')} `;
    }
    boton.disabled = false;
  }
  $$('form.acceso').forEach((f) => f.addEventListener('submit', pedirAcceso));

  /* ================= aparecer al bajar ================= */
  function revela() {
    const els = $$('.r');
    if (reducir || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((ents) => ents.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((e, i) => { e.style.setProperty('--d', ((i % 4) * 0.08).toFixed(2) + 's'); io.observe(e); });
  }

  /* ================= vetas del mármol (solo en la portada) ================= */
  function generaVetas() {
    const svg = $('.vetas');
    if (html.dataset.dir !== 'marmol') { svg.innerHTML = ''; return; }
    const W = html.clientWidth, H = Math.min(html.scrollHeight, 1600);
    svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const rnd = azar(1430);
    let out = '';
    const veta = (x, y, ang, largo, tipo, ancho) => {
      let d = `M${x.toFixed(1)} ${y.toFixed(1)}`, ramas = [];
      const pasos = Math.max(6, Math.round(largo / 18));
      for (let i = 0; i < pasos; i++) {
        ang += (rnd() - 0.5) * 0.55;
        const l = 12 + rnd() * 14;
        x += Math.cos(ang) * l; y += Math.sin(ang) * l;
        d += `L${x.toFixed(1)} ${y.toFixed(1)}`;
        if (tipo !== 'v-f' && rnd() < 0.05) ramas.push([x, y, ang + (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.6)]);
      }
      out += `<path class="${tipo}" pathLength="1" stroke-width="${ancho}" d="${d}" style="stroke-dashoffset:0"/>`;
      ramas.forEach(([rx, ry, ra]) => veta(rx, ry, ra, 120 + rnd() * 260, 'v-f', 0.6));
    };
    const n = Math.round(H / 220);
    for (let i = 0; i < n; i++) {
      const tipo = rnd() < 0.2 ? 'v-o' : 'v-b';
      const y = (i / n) * H + rnd() * 200;
      const izq = rnd() < 0.5;
      const x = izq ? -20 + rnd() * W * 0.25 : W * 0.75 + rnd() * W * 0.25 + 20;
      const ang = izq ? 0.5 + rnd() * 0.6 : Math.PI - 0.5 - rnd() * 0.6;
      veta(x, y, ang, 500 + rnd() * 900, tipo, tipo === 'v-o' ? 1.3 : 0.9 + rnd() * 0.5);
    }
    svg.innerHTML = out;
  }
  const brillo = $('.brillo');
  if (fino && !reducir) {
    addEventListener('pointermove', (e) => { brillo.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; brillo.classList.add('on'); }, { passive: true });
  }

  /* ================= estilo ================= */
  const DIRS = ['marmol', 'marfil', 'borgona'];
  function ponDir(d, guardar) {
    if (!DIRS.includes(d)) d = 'marmol';
    html.dataset.dir = d;
    $('meta[name="theme-color"]').content = { marmol: '#151817', marfil: '#faf2e8', borgona: '#4e101d' }[d];
    // Marfil es claro: «only light» le dice al navegador que no lo oscurezca aunque el móvil esté en modo oscuro
    $('meta[name="color-scheme"]').content = d === 'marfil' ? 'only light' : 'dark';
    $$('.estilo button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.dir === d));
    generaVetas();
    if (guardar) { try { localStorage.setItem('toison-estilo', d); } catch (e) {} }
  }
  $$('.estilo button').forEach((b) => b.addEventListener('click', () => ponDir(b.dataset.dir, true)));
  addEventListener('resize', () => requestAnimationFrame(generaVetas));

  /* ================= menú del móvil ================= */
  const mb = $('.menu-btn'), mm = $('#menu-movil');
  const ponMenu = (abierto) => { mm.hidden = !abierto; mb.setAttribute('aria-expanded', abierto); mb.classList.toggle('abierto', abierto); };
  mb.addEventListener('click', () => ponMenu(mm.hidden));
  $$('#menu-movil a').forEach((a) => a.addEventListener('click', () => ponMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mm.hidden) { ponMenu(false); mb.focus(); } });
  addEventListener('click', (e) => { if (!mm.hidden && !e.target.closest('.nav')) ponMenu(false); });

  /* ================= todo lo que se pinta con textos ================= */
  function pintaTodo() {
    if (fino) { const t = $('.mapa-toca'); if (t) t.textContent = L('Pasa el ratón o toca un país', 'Hover or tap a country'); }
    ponPantalla(pantallaActual);
    pintaMovil();
    pintaCinta();
    pintaProducto();
    futuro();
    pintaNoticias();
    tramos();
    pintaMapa();
  }

  /* ================= arranque ================= */
  let dir = 'marmol', l = 'es';
  try {
    dir = localStorage.getItem('toison-estilo') || 'marmol';
    l = localStorage.getItem('toison-lang') || ((navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'es');
  } catch (e) {}
  const h = location.hash.slice(1);
  if (DIRS.includes(h)) dir = h;
  lang = l;
  ponDir(dir, false);
  aplicaTextos();
  pintaTodo();
  revela();
  cargaMapa();
  requestAnimationFrame(generaVetas);
})();
