(() => {
  'use strict';
  const html = document.documentElement;
  html.classList.add('js');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const EN = window.TEXTOS_EN || {};
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fino = matchMedia('(pointer: fine)').matches;
  const NB = '\u00a0';
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
  const pc = (n, d = 0) => fmt(n, d) + (lang === 'en' ? '%' : NB + '%');
  const flecha = (n, d = 2) => (n >= 0 ? '▲ ' : '▼ ') + pct(n, d);
  function azar(semilla) {
    let a = semilla >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const serie = (semilla, n, tend) => { const r = azar(semilla); let v = 50; const p = []; for (let i = 0; i < n; i++) { v += (r() - 0.5) * 3.2 + tend; p.push(v); } return p; };
  const trazo = (p, w, h, m = 2) => { const mn = Math.min(...p), mx = Math.max(...p); return p.map((y, i) => [i * w / (p.length - 1), m + (h - 2 * m) * (1 - (y - mn) / (mx - mn || 1))]); };
  const linea = (pts) => pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('');
  const mini = (semilla, tend, cls, w = 60, h = 20, pref = 'a-') => `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${linea(trazo(serie(semilla, 24, tend), w, h))}" fill="none" stroke="var(--${pref}${cls})" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
  // valor final de aportar cada mes (la misma cuenta en la proyección y en el asistente)
  const vf = (ini, apo, r, anos) => { const m = r / 12, k = anos * 12; return ini * Math.pow(1 + m, k) + apo * (Math.pow(1 + m, k) - 1) / m; };

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
    // las cifras con miles (2.800, 6.000) con el separador de cada idioma: «2,800» en inglés; las que aún no han
    // contado lo hacen al entrar en pantalla, ya con fmt
    $$('[data-count]').forEach((b) => { if (reducir || b.dataset.contado || +b.dataset.count >= 1000) b.textContent = fmt(+b.dataset.count); });
    partePalabras();
  }
  function ponLang(l, guardar) {
    lang = l === 'en' ? 'en' : 'es';
    aplicaTextos();
    pintaTodo();
    if (guardar) { try { localStorage.setItem('toison-lang', lang); } catch (e) {} }
    requestAnimationFrame(() => { vetasAlto = 0; generaVetas(); });
  }
  $$('.idioma button').forEach((b) => b.addEventListener('click', () => { if (b.dataset.lang !== lang) ponLang(b.dataset.lang, true); }));

  /* ---------- titulares palabra a palabra (se rehace al cambiar de idioma) ---------- */
  function partePalabras() {
    $$('[data-split]').forEach((el) => {
      let i = 0;
      const trozos = (txt) => txt.split(/(\s+)/).map((w) => (/^\s+$/.test(w) || !w ? w : `<span class="pal" style="--i:${i++}">${w}</span>`)).join('');
      const recorre = (nodo) => [...nodo.childNodes].map((n) => {
        if (n.nodeType === 3) return trozos(n.textContent);
        if (n.nodeType === 1) { const t = n.tagName.toLowerCase(); return `<${t}>${recorre(n)}</${t}>`; }
        return '';
      }).join('');
      el.innerHTML = recorre(el);
    });
  }

  /* ---------- cifras que cuentan al entrar en pantalla ---------- */
  function cuenta(b) {
    const fin = +b.dataset.count;
    if (reducir || b.dataset.contado) return;
    b.dataset.contado = '1';
    const t0 = performance.now(), dur = 1500;
    const paso = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      b.textContent = fmt(Math.round(fin * e));
      if (p < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }

  /* ================= la IA: seis factores (los mismos en la ficha de la app dibujada y en el diagrama) ================= */
  const SG = { '+': ['▲', 'p'], '-': ['▼', 'n'], '=': ['=', 'e'], '±': ['◆', 'm'] };
  const sg = (s) => `<span class="sg ${SG[s][1]}">${SG[s][0]}</span>`;
  const pesos = (n) => `<span class="pesos">${[1, 2, 3].map((k) => `<i class="${k <= n ? 'on' : ''}"></i>`).join('')}</span>`;
  const SIGNO_TXT = { '+': ['A favor', 'Positive'], '-': ['En contra', 'Negative'], '=': ['Neutra', 'Neutral'], '±': ['Mixta', 'Mixed'] };
  const PESO_TXT = ['', ['Poco', 'Minor'], ['Importante', 'Important'], ['Muy importante', 'Very important']];
  const FACT = [
    { k: 'negocio', n: ['Negocio', 'Business'], s: '+', p: 3, pl: ['Meses', 'Months'], f: 3,
      mira: ['Resultados, ventas, márgenes, deuda, previsiones, dividendos, contratos, directivos y compras de empresas.', 'Results, sales, margins, debt, guidance, dividends, contracts, management and acquisitions.'],
      lee: ['Resultados por encima de lo esperado y previsión de ventas al alza para el año.', 'Results above expectations and sales guidance raised for the year.'] },
    { k: 'sector', n: ['Sector', 'Sector'], s: '+', p: 2, pl: ['Meses', 'Months'], f: 4,
      mira: ['Lo que les pasa a su sector y a sus competidores, y los precios de lo que vende o de lo que compra.', 'What is happening to its sector and competitors, and the prices of what it sells or buys.'],
      lee: ['La demanda de los centros de datos sigue tirando de todo el sector.', 'Data-centre demand keeps pulling the whole sector along.'] },
    { k: 'macro', n: ['Economía', 'Economy'], s: '±', p: 1, pl: ['Días o semanas', 'Days or weeks'], f: 2,
      mira: ['Tipos de interés, inflación, divisa, materias primas y cómo va la economía de sus países.', 'Interest rates, inflation, currency, commodities and how its countries’ economies are doing.'],
      lee: ['El dólar fuerte resta algo a las ventas de fuera de EE. UU.; los tipos, sin cambios.', 'A strong dollar trims sales outside the US; rates unchanged.'] },
    { k: 'politico', n: ['Política y leyes', 'Politics and law'], s: '-', p: 2, pl: ['Meses', 'Months'], f: 5,
      mira: ['Aranceles, sanciones, elecciones, leyes, impuestos, multas, reguladores y juicios.', 'Tariffs, sanctions, elections, laws, taxes, fines, regulators and lawsuits.'],
      lee: ['Nuevas restricciones a la exportación de chips a algunos países.', 'New restrictions on exporting chips to some countries.'] },
    { k: 'social', n: ['Sociedad', 'Society'], s: '=', p: 1, pl: ['Años', 'Years'], f: 2,
      mira: ['Huelgas, boicots, quejas de clientes, reputación, hábitos de consumo y medio ambiente.', 'Strikes, boycotts, customer complaints, reputation, consumer habits and the environment.'],
      lee: ['Críticas por el consumo de agua de sus fábricas, sin efecto en las ventas por ahora.', 'Criticism over its factories’ water use, with no effect on sales so far.'] },
    { k: 'mercado', n: ['Mercado', 'Market'], s: '+', p: 2, pl: ['Días o semanas', 'Days or weeks'], f: 3,
      mira: ['Entradas y salidas de los índices, grandes accionistas que compran o venden, el volumen y la propia cotización.', 'Index additions and removals, large shareholders buying or selling, trading volume and the share price itself.'],
      lee: ['Entra en un índice de referencia a final de mes, lo que suele traer más volumen.', 'It joins a benchmark index at the end of the month, which usually brings more volume.'] }
  ];
  const ejemplo = () => `<span class="ejemplo">${L('Ejemplo', 'Example')}</span>`;

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
  const mapaMini = (corto) => `<div class="mapa-mini"><svg viewBox="${corto ? '0 18 1000 330' : '0 0 1000 439'}" aria-hidden="true"><use href="#mini-mundo"/></svg></div>`;

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
        <div class="check"><i></i><div>${L('Resultados de dos empresas de tu ETF', 'Earnings from two companies in your ETF')}<small>${L('Jueves 12 y martes 17', 'Thursday 12 and Tuesday 17')}</small></div></div>
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
        <div class="tarj"><div class="et"><span>${L('Bolsas hoy', 'Markets today')}</span><span class="sube">▲ ${L('12 de 18 suben', '12 of 18 up')}</span></div>${mapaMini()}</div>
        <div class="nota-app"><b>${L('Para tu cartera', 'For your portfolio')}</b>${L('El euro sube: lo tuyo en dólares vale unos ' + eur(efectoUSD()) + ' menos.', 'The euro is up: your dollar holdings are worth about ' + eur(efectoUSD()) + ' less.')}</div>
      </div></div>`,
    expertos: () => `<div class="pantalla p-mercados">
      <div class="tarj"><b style="font-size:14px">${L('Fabricante de chips', 'Chipmaker')}</b><small style="display:block;color:var(--a-txt2)">${L('EE. UU. · Semiconductores · en tu cartera', 'US · Semiconductors · in your portfolio')}</small>
        <div class="fila" style="margin-top:10px"><span>${L('En tu cartera', 'In your portfolio')}</span><b class="num">${pc(2.1, 1)} · ${L('vía ETF', 'via ETF')}</b></div>
        <div class="fila"><span>${L('Última ficha', 'Last profile')}</span><b>${L('Hoy, 15:40', 'Today, 15:40')}</b></div>
        <div class="fila"><span>${L('Radar de Toisón', 'Toisón radar')}</span><b>${L('840 empresas', '840 companies')}</b></div>
        <small style="display:block;margin-top:8px;color:var(--a-txt2)">${L('Hechos y opiniones por separado, con las fuentes.', 'Facts and opinions kept apart, with sources.')}</small></div>
      <div class="tarj"><div class="et" style="margin-bottom:4px">${L('Lo que dice la prensa, por factores', 'What the press says, by factor')}</div>
        ${FACT.map((f) => `<div class="ff"><span>${L(f.n[0], f.n[1])}</span>${sg(f.s)}${pesos(f.p)}</div>`).join('')}
        <small style="display:block;margin-top:8px;color:var(--a-txt2)">${L('Análisis con IA · decides tú', 'AI analysis · your call')}</small></div></div>`,
    hacienda: () => `<div class="pantalla p-hacienda">
      <div class="tarj"><div class="et"><span>${L('Renta de 2026 · lo que supondría hoy', '2026 tax · what it would mean today')}</span></div><div class="cifra num">${eur(241.76, 2)}</div>
        <div class="fila" style="margin-top:8px"><span>${L('Ganancias realizadas', 'Realised gains')}</span><b class="num">${eur(1080, 2)}</b></div>
        <div class="fila"><span>${L('Dividendos', 'Dividends')}</span><b class="num">${eur(312.4, 2)}</b></div>
        <div class="fila"><span>${L('Pérdidas que compensan', 'Losses offset')}</span><b class="num">${eur(-120, 2)}</b></div>
        <div class="fila"><span>${L('Ya retenido', 'Already withheld')}</span><b class="num">${eur(59.36, 2)}</b></div>
        <div class="fila"><span><b>${L('Quedaría por pagar', 'Left to pay')}</b></span><b class="num">${eur(182.4, 2)}</b></div></div>
      <div style="display:grid;gap:12px;align-content:start">
        <div class="tarj"><div class="et">${L('Por tramos', 'By bracket')}</div>
          <div class="tramo"><span>${L('Hasta 6.000 € · 19' + NB + '%', 'Up to €6,000 · 19%')}</span><b class="num">${eur(241.76, 2)}</b><i style="--w:21%"></i></div>
          <div class="tramo"><span>${L('6.000 a 50.000 € · 21' + NB + '%', '€6,000 to €50,000 · 21%')}</span><b class="num">${eur(0, 2)}</b><i style="--w:0%"></i></div></div>
        <div class="nota-app"><b>${L('Guía de la renta', 'Tax return guide')}</b>${L('Casillas, plazos y papeles de cada bróker.', 'Boxes, deadlines and each broker’s documents.')}</div>
      </div></div>`
  };
  function tabsTeclado(cont) {
    cont.addEventListener('keydown', (e) => {
      const bs = $$('[role="tab"]', cont), i = bs.indexOf(document.activeElement);
      if (i < 0) return;
      const j = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: bs.length - 1 }[e.key];
      if (j === undefined) return;
      e.preventDefault();
      const k = (j + bs.length) % bs.length;
      bs[k].click();
      $$('[role="tab"]', cont)[k].focus();
    });
  }
  function marcaTabs(cont, panel) {
    $$('[role="tab"]', cont).forEach((b, i) => {
      if (!b.id) b.id = panel.id + '-t' + i;
      b.setAttribute('aria-controls', panel.id);
      const sel = b.getAttribute('aria-selected') === 'true';
      b.tabIndex = sel ? 0 : -1;
      if (sel) panel.setAttribute('aria-labelledby', b.id);
    });
  }
  let pantallaActual = 'cartera';
  const cuerpo = $('#app-cuerpo');
  cuerpo.setAttribute('role', 'tabpanel');
  function ponPantalla(k) {
    pantallaActual = k;
    cuerpo.innerHTML = PANTALLAS[k]();
    $$('.app-tabs button').forEach((b) => b.setAttribute('aria-selected', b.dataset.p === k));
    marcaTabs($('.app-tabs'), cuerpo);
  }
  tabsTeclado($('.app-tabs'));
  $$('.app-tabs button').forEach((b) => b.addEventListener('click', () => ponPantalla(b.dataset.p)));

  /* ================= el móvil ================= */
  const ICON = {
    ini: '<path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>',
    paso: '<path d="M8 6h11M8 12h11M8 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
    merc: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.5 2.5 2.5 13.5 0 16M12 4c-2.5 2.5-2.5 13.5 0 16"/>',
    not: '<path d="M5 5h11v14H7a2 2 0 0 1-2-2zM16 9h3v8a2 2 0 0 1-2 2"/><path d="M8 9h5M8 12h5M8 15h3"/>',
    exp: '<path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z"/>'
  };
  const navApp = (act) => '<div class="barra-nav">' + [['ini', 'Inicio', 'Home'], ['paso', 'Paso a paso', 'Steps'], ['merc', 'Mercados', 'Markets'], ['not', 'Noticias', 'News'], ['exp', 'Radar', 'Radar']]
    .map(([k, es, en], i) => `<span class="${i === act ? 'act' : ''}"><svg viewBox="0 0 24 24">${ICON[k]}</svg>${L(es, en)}</span>`).join('') + '</div>';
  const ESTADO = '<div class="estado"><span>17:35</span><span><svg viewBox="0 0 18 11"><rect x="0" y="7" width="3" height="4" rx=".7"/><rect x="5" y="5" width="3" height="6" rx=".7"/><rect x="10" y="2.5" width="3" height="8.5" rx=".7"/><rect x="15" y="0" width="3" height="11" rx=".7"/></svg></span></div>';
  const yo = '<span class="yo"><svg viewBox="-82 -78 164 147" aria-hidden="true"><use class="s-o" href="#o"/><use class="s-t" href="#t"/></svg></span>';
  function pintaMovil() {
    $('#movil').innerHTML = `<div class="pant">${ESTADO}<div class="capa">
      <div class="hola"><div><small>${L('Noviembre', 'November')}</small><b>${L('Paso a paso', 'Step by step')}</b></div>${yo}</div>
      <div class="tarj" style="display:flex;align-items:center;gap:8px">${anillo(0.25)}<div><b style="font-size:11px">${L('1 de 4 hecho', '1 of 4 done')}</b><small style="display:block;color:var(--a-txt2)">${L('Tu mes', 'Your month')}</small></div><span class="ejemplo" style="margin-left:auto;font-size:7px;padding:2px 5px">${L('Ejemplo', 'Example')}</span></div>
      <div class="tarj">
        <div class="check ok"><i></i><div>${L('Tu aportación programada: ' + eur(200), 'Your scheduled contribution: ' + eur(200))}<small>${L('En la renta: nada', 'Tax effect: none')}</small></div></div>
        <div class="check"><i></i><div>${L('Resultados de dos empresas de tu ETF', 'Earnings from two companies in your ETF')}<small>${L('Jueves 12 y martes 17', 'Thursday 12 and Tuesday 17')}</small></div></div>
        <div class="check"><i></i><div>${L('Tecnología: ' + pc(34) + ', tu límite es ' + pc(30), 'Tech: ' + pc(34) + ', your limit is ' + pc(30))}<span class="chip">${L('Lo decides tú', 'Your call')}</span></div></div>
      </div>
      <div class="tarj"><div class="et">${L('Renta de 2026 hasta hoy', '2026 tax so far')}</div><div class="cifra num">${eur(241.76, 2)}</div></div>
      <div class="tarj solo-movil"><div class="et" style="display:flex;justify-content:space-between"><span>${L('Bolsas hoy', 'Markets today')}</span><span class="sube">▲ ${L('12 de 18 suben', '12 of 18 up')}</span></div>${mapaMini(true)}</div>
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
      <div class="riesgo-lab"><span>${L('Coste medio de tus fondos y ETF (TER)', 'Average cost of your funds and ETFs (TER)')}</span><b class="num">${pc(0.21, 2)}</b></div>`;

    $('#lista-paso').innerHTML = [
      [1, L('Tu aportación programada: ' + eur(200) + ' al fondo mundial', 'Your scheduled contribution: ' + eur(200) + ' to the global fund'), L('En la renta: nada', 'Tax effect: none')],
      [0, L('Resultados de dos empresas de tu ETF', 'Earnings from two companies in your ETF'), L('Jueves 12 y martes 17', 'Thursday 12 and Tuesday 17')],
      [0, L('Tecnología: ' + pc(34) + ', tu límite es ' + pc(30), 'Tech: ' + pc(34) + ', your limit is ' + pc(30)), L('Lo decides tú', 'Your call')],
      [0, L('31 de diciembre: cierra el año fiscal', '31 December: tax year ends'), L('Lo que vendas después cuenta para 2027', 'Anything sold after that counts for 2027')]
    ].map(([ok, t, s]) => `<li class="${ok ? 'ok' : ''}"><i></i><div>${t}<small>${s}</small></div></li>`).join('');

    $('#limites').innerHTML = [
      [L('Tecnología', 'Technology'), 34, 30], [L('Una sola empresa', 'A single company'), 4, 10], [L('Cripto', 'Crypto'), 6, 10], [L('Fuera del euro', 'Outside the euro'), 62, 70]
    ].map(([n, v, lim]) => `<div class="limite ${v > lim ? 'pasa' : ''}"><div class="lab"><span>${n}</span><b>${pc(v)} <span style="color:var(--txt2);font-weight:400">· ${L('límite', 'limit')} ${pc(lim)}</span></b></div>
      <div class="pista"><i style="--w:${v * 2}%"></i><u style="--l:${lim * 2}%"></u></div>${v > lim ? `<span class="chip">${L('Pasa del límite · lo decides tú', 'Over the limit · your call')}</span>` : ''}</div>`).join('');
  }

  /* ================= hasta dónde podrías llegar ================= */
  const R = [-0.01, 0.04, 0.07];
  function futuro() {
    const apo = +$('#r-apo').value, anos = +$('#r-anos').value, ini = TOTAL;
    $('#o-apo').value = eur(apo); $('#o-anos').value = anos;
    $('#r-apo').setAttribute('aria-valuetext', eur(apo) + L(' al mes', ' a month')); $('#r-anos').setAttribute('aria-valuetext', anos + L(' años', ' years'));
    const fin = R.map((r) => vf(ini, apo, r, anos)), puesto = ini + apo * 12 * anos;
    $('#v-mal').textContent = eur(fin[0]); $('#v-med').textContent = eur(fin[1]); $('#v-bien').textContent = eur(fin[2]);
    const W = 420, H = 160, top = fin[2] * 1.05, N = 40;
    const curva = (r) => linea(Array.from({ length: N + 1 }, (_, i) => [i * W / N, H - 6 - (H - 12) * vf(ini, apo, r, anos * i / N) / top]));
    const apor = linea(Array.from({ length: N + 1 }, (_, i) => [i * W / N, H - 6 - (H - 12) * (ini + apo * 12 * anos * i / N) / top]));
    $('#fut-svg').innerHTML = `<path class="apo" d="${apor}"/><path class="mal" d="${curva(R[0])}"/><path class="bien" d="${curva(R[2])}"/><path class="med" d="${curva(R[1])}"/>`;
    $('#fut-ejes').innerHTML = `<span>${L('Hoy', 'Today')}</span><span>${L('Aportado: ' + eur(puesto), 'Put in: ' + eur(puesto))}</span><span>${anos} ${L('años', 'years')}</span>`;
    $('#fut-nota').textContent = L(`Partiendo de los ${eur(ini, 2)} de la cartera de ejemplo y aportando ${eur(apo)} al mes durante ${anos} años, con rentabilidades anuales de ejemplo del −1 %, 4 % y 7 %, sin costes, inflación ni impuestos. La línea de puntos es lo aportado. No es un indicador fiable de resultados futuros: puedes recuperar menos de lo aportado.`,
      `Starting from the example portfolio’s ${eur(ini, 2)} and putting in ${eur(apo)} a month for ${anos} years, with example annual returns of −1%, 4% and 7%, before costs, inflation and taxes. The dotted line is what you put in. Not a reliable indicator of future results: you may get back less than you put in.`);
  }
  ['r-apo', 'r-anos'].forEach((id) => $('#' + id).addEventListener('input', futuro));

  /* ================= la IA: así lee una noticia ================= */
  const NOTICIAS = [
    { t: ['El fabricante de chips sube su previsión de ventas para el año', 'Chipmaker raises its sales forecast for the year'], m: ['Semiconductores · EE. UU. · hace 3 min', 'Semiconductors · US · 3 min ago'], s: '+',
      h: ['La empresa eleva la previsión un 8 % por la demanda de centros de datos. Resultados el jueves.', 'The company lifts its forecast by 8% on data-centre demand. Earnings on Thursday.'],
      q: ['A la propia empresa y a sus proveedores europeos de maquinaria. Al sector, en menor medida.', 'The company itself and its European equipment suppliers. The sector, to a lesser degree.'],
      f: [['Negocio', 'Business', '+', 3], ['Sector', 'Sector', '+', 2], ['Mercado', 'Market', '±', 1]],
      c: ['Tienes esta empresa en tu ETF de EE. UU. (un 2,1 % de tu cartera). La tecnología ya pesa un 34 % y tu límite es el 30 %.', 'You hold this company through your US ETF (2.1% of your portfolio). Tech already weighs 34% and your limit is 30%.'] },
    { t: ['El BCE mantiene los tipos de interés y no descarta bajarlos en marzo', 'The ECB holds rates and does not rule out a cut in March'], m: ['Bancos centrales · zona euro · hace 18 min', 'Central banks · eurozone · 18 min ago'], s: '=',
      h: ['Tipos sin cambios por tercera reunión seguida. El comunicado habla de «datos» para marzo.', 'Rates unchanged for the third meeting in a row. The statement points to “data” for March.'],
      q: ['A la banca europea (margen) y a la renta fija (precio). A tu fondo de renta fija, directamente.', 'European banks (margins) and bonds (prices). Your bond fund, directly.'],
      f: [['Economía', 'Economy', '=', 2], ['Política y leyes', 'Politics and law', '=', 1], ['Mercado', 'Market', '+', 1]],
      c: ['Tu fondo de renta fija (un 20 % de tu cartera) suele subir cuando bajan los tipos. No cambia nada hoy; lo seguimos en marzo.', 'Your bond fund (20% of your portfolio) tends to rise when rates fall. Nothing changes today; we follow it again in March.'] },
    { t: ['Nuevos aranceles a los coches importados desde el 1 de enero', 'New tariffs on imported cars from 1 January'], m: ['Comercio · Europa · hace 40 min', 'Trade · Europe · 40 min ago'], s: '-',
      h: ['Arancel del 15 % a los coches de fuera de la UE. Las marcas europeas con fábricas fuera, las más expuestas.', '15% tariff on cars from outside the EU. European brands with plants abroad are the most exposed.'],
      q: ['A los fabricantes de coches europeos y a sus proveedores. Al Ibex, poco.', 'European carmakers and their suppliers. Little effect on the Ibex.'],
      f: [['Política y leyes', 'Politics and law', '-', 3], ['Sector', 'Sector', '-', 2], ['Sociedad', 'Society', '±', 1]],
      c: ['No tienes fabricantes de coches. Tu fondo indexado mundial los lleva, pero pesan menos de un 1 % de tu cartera.', 'You hold no carmakers directly. Your global index fund has some, but they weigh under 1% of your portfolio.'] }
  ];
  let notActual = 0;
  $('#lectura').setAttribute('role', 'tabpanel');
  tabsTeclado($('#titulares'));
  function pintaNoticias() {
    $('#titulares').innerHTML = NOTICIAS.map((n, i) => `<button type="button" role="tab" aria-selected="${i === notActual}" data-i="${i}"><span>${L(n.t[0], n.t[1])}<small>${L(n.m[0], n.m[1])}</small></span><span class="sg ${SG[n.s][1]}">${SG[n.s][0]}</span></button>`).join('');
    $$('#titulares button').forEach((b) => b.addEventListener('click', () => { notActual = +b.dataset.i; pintaNoticias(); }));
    marcaTabs($('#titulares'), $('#lectura'));
    const n = NOTICIAS[notActual];
    $('#lectura').innerHTML = `<div class="paso-l"><i>1</i><div><b>${L('Qué ha pasado', 'What happened')}</b>${L(n.h[0], n.h[1])}</div></div>
      <div class="paso-l"><i>2</i><div><b>${L('A quién afecta', 'Who it affects')}</b>${L(n.q[0], n.q[1])}</div></div>
      <div class="paso-l"><i>3</i><div><b>${L('Factores', 'Factors')}</b><div class="factores">${n.f.map(([es, en, s, p]) => `<span>${L(es, en)} ${sg(s)}${pesos(p)}</span>`).join('')}</div></div></div>
      <div class="paso-l"><i>4</i><div><b>${L('Qué supone para tu cartera', 'What it means for your portfolio')}</b>${L(n.c[0], n.c[1])}</div></div>
      <div class="decides"><b>${L('Decides tú.', 'Your call.')}</b> ${L('Toisón no te dice qué hacer: te cuenta lo que pasa y lo que supondría para ti.', 'Toisón doesn’t tell you what to do: it tells you what is going on and what it would mean for you.')}</div>`;
  }

  /* ================= la IA: el diagrama de los seis factores ================= */
  let facSel = 0, facToque = false, facEncima = false;
  function pintaRadial() {
    const cx = 260, cy = 240, Rr = 178;
    let rayos = '', nodos = '';
    FACT.forEach((f, i) => {
      const a = (-90 + i * 60) * Math.PI / 180, x = cx + Math.cos(a) * Rr, y = cy + Math.sin(a) * Rr;
      const rot = Math.atan2(cy - y, cx - x) * 180 / Math.PI;
      const ny = y + (Math.sin(a) >= -0.1 ? 56 : -46);
      rayos += `<line class="rayo" x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${cx}" y2="${cy}"/>
        <g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})"><circle class="flujo" style="--d:${(i * 0.43).toFixed(2)}s" cx="38" r="3.2"/><circle class="flujo" style="--d:${(i * 0.43 + 1.3).toFixed(2)}s" cx="38" r="2.4"/></g>`;
      nodos += `<g class="nodo${i === facSel ? ' sel' : ''}" data-f="${i}">
        <circle class="aro" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="34"/>
        <text class="ic ${SG[f.s][1]}" x="${x.toFixed(1)}" y="${y.toFixed(1)}">${SG[f.s][0]}</text>
        <text class="nom" x="${x.toFixed(1)}" y="${ny.toFixed(1)}">${L(f.n[0], f.n[1])}</text></g>`;
    });
    $('#radial').innerHTML = rayos + `<g class="centro"><rect x="${cx - 86}" y="${cy - 34}" width="172" height="68" rx="14"/><text x="${cx}" y="${cy - 2}" text-anchor="middle">${L('Fabricante de chips', 'Chipmaker')}</text><text class="peq" x="${cx}" y="${cy + 18}" text-anchor="middle">${L('EE. UU. · ejemplo', 'US · example')}</text></g>` + nodos;
    $$('#radial .nodo').forEach((n) => n.addEventListener('click', () => { facToque = true; ponFactor(+n.dataset.f); }));
    $('#fac-tabs').innerHTML = FACT.map((f, i) => `<button type="button" data-f="${i}" aria-pressed="${i === facSel}">${L(f.n[0], f.n[1])}</button>`).join('');
    $$('#fac-tabs button').forEach((b) => b.addEventListener('click', () => { facToque = true; ponFactor(+b.dataset.f); }));
    pintaFactor();
  }
  function pintaFactor() {
    const f = FACT[facSel];
    $('#fac-det').innerHTML = `<div class="anim"><div class="fd-cab"><h4>${L(f.n[0], f.n[1])}</h4>${ejemplo()}</div>
      <p class="mira"><b>${L('Qué mira: ', 'What it looks at: ')}</b>${L(f.mira[0], f.mira[1])}</p>
      <p class="lect">${L(f.lee[0], f.lee[1])}</p>
      <dl><div><dt>${L('Signo', 'Sign')}</dt><dd>${sg(f.s)} ${L(...SIGNO_TXT[f.s])}</dd></div>
      <div><dt>${L('Peso', 'Weight')}</dt><dd>${pesos(f.p)} ${L(...PESO_TXT[f.p])}</dd></div>
      <div><dt>${L('Plazo', 'Horizon')}</dt><dd>${L(f.pl[0], f.pl[1])}</dd></div></dl>
      <p class="mira" style="margin:16px 0 0">${L(`Sale de ${f.f} noticias de esta semana, cada una con su fuente.`, `Drawn from ${f.f} articles this week, each with its source.`)}</p></div>`;
  }
  function ponFactor(i) {
    facSel = (i + FACT.length) % FACT.length;
    $$('#radial .nodo').forEach((n, k) => n.classList.toggle('sel', k === facSel));
    $$('#fac-tabs button').forEach((b, k) => b.setAttribute('aria-pressed', k === facSel));
    pintaFactor();
  }
  const enVista = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
  $('.fac-grid').addEventListener('pointerenter', () => { facEncima = true; });
  $('.fac-grid').addEventListener('pointerleave', () => { facEncima = false; });
  $('.fac-grid').addEventListener('focusin', () => { facEncima = true; });
  $('.fac-grid').addEventListener('focusout', () => { facEncima = false; });
  if (!reducir) setInterval(() => { if (!facToque && !facEncima && !document.hidden && enVista($('#radial'))) ponFactor(facSel + 1); }, 4200);

  /* ================= la IA: temas que mueven a muchas ================= */
  const TEMAS = [
    [['Bancos centrales', 'Central banks'], 'macro', '=', ['El BCE mantiene los tipos de interés', 'The ECB holds interest rates'], ['Lo esperado: no cambia el margen de los bancos ni lo que pagan las hipotecas.', 'As expected: bank margins and mortgage costs don’t change.'], [['Zona euro', 'Eurozone'], ['Bancos', 'Banks'], ['Aseguradoras', 'Insurers']]],
    [['Aranceles', 'Tariffs'], 'politico', '-', ['Nuevos aranceles a los coches importados', 'New tariffs on imported cars'], ['Encarece traer a la UE coches fabricados fuera, también los de marcas europeas.', 'Makes it dearer to bring cars built abroad into the EU, European brands included.'], [['Europa', 'Europe'], ['Japón', 'Japan'], ['Coches', 'Cars'], ['Piezas', 'Parts']]],
    [['Elecciones', 'Elections'], 'politico', '±', ['Elecciones generales en un país de la UE', 'General election in an EU country'], ['Hasta que haya gobierno, más dudas para los sectores que dependen de leyes y licencias.', 'Until there’s a government, more doubt for sectors that depend on laws and licences.'], [['Ese país', 'That country'], ['Bancos', 'Banks'], ['Eléctricas', 'Utilities']]]
  ];
  function pintaTemas() {
    $('#temas').innerHTML = TEMAS.map(([n, fk, s, tt, txt, toca]) => {
      const f = FACT.find((x) => x.k === fk);
      return `<div class="tema"><p class="k">${L(n[0], n[1])}</p><h4>${L(tt[0], tt[1])}</h4>
        <p>${L(txt[0], txt[1])}</p><p class="tema-f">${sg(s)} ${L(f.n[0], f.n[1])} · ${L(...SIGNO_TXT[s]).toLowerCase()}</p>
        <div class="toca"><span class="toca-lab">${L('Toca a:', 'Affects:')}</span>${toca.map((t) => `<span>${L(t[0], t[1])}</span>`).join('')}</div></div>`;
    }).join('');
  }

  /* ================= la IA: noticias que van llegando ================= */
  const NOT = [
    [['Fabricante de chips · EE. UU.', 'Chipmaker · US'], ['Sube su previsión de ventas para el año', 'Raises its sales forecast for the year'], 0, '+', 3, ['Previsión al alza: la empresa espera vender más de lo que había dicho.', 'Forecast raised: the company expects to sell more than it had said.']],
    [['Banco · España', 'Bank · Spain'], ['El BCE mantiene los tipos de interés', 'The ECB holds interest rates'], 2, '=', 2, ['Lo esperado. El margen de los bancos sigue igual.', 'As expected. Bank margins stay the same.']],
    [['Aseguradora · Alemania', 'Insurer · Germany'], ['Entra en el Euro Stoxx 50 el mes que viene', 'Joins the Euro Stoxx 50 next month'], 5, '+', 1, ['Más volumen por los fondos que siguen el índice; el negocio no cambia.', 'More volume from funds that track the index; the business doesn’t change.']],
    [['Fabricante de coches · Alemania', 'Carmaker · Germany'], ['Nuevos aranceles a los coches importados', 'New tariffs on imported cars'], 3, '-', 3, ['Le toca de lleno: fabrica fuera de la UE muchos de los coches que vende aquí.', 'Hits it hard: it builds outside the EU many of the cars it sells here.']],
    [['Cadena de moda · España', 'Fashion retailer · Spain'], ['Huelga en sus centros logísticos', 'Strike at its logistics centres'], 4, '-', 1, ['Molesta, pero de momento no cambia las ventas del trimestre.', 'A nuisance, but it doesn’t change quarterly sales so far.']],
    [['Eléctrica · España', 'Utility · Spain'], ['La demanda de electricidad bate su récord de octubre', 'Power demand hits an October record'], 1, '+', 1, ['Afecta a todo el sector; nada inesperado.', 'Affects the whole sector; nothing unexpected.']]
  ];
  const HACE = () => [L('Ahora', 'Now'), L('hace 4 min', '4 min ago'), L('hace 11 min', '11 min ago'), L('hace 19 min', '19 min ago')];
  let feedIni = 0, feedPausa = reducir;
  function pintaFeed(nueva) {
    const h = HACE();
    $('#feed').innerHTML = [0, 1, 2, 3].map((k) => {
      const [emp, tt, fi, s, p, lee] = NOT[(feedIni + k) % NOT.length];
      const f = FACT[fi];
      return `<li class="nt${nueva && k === 0 ? ' nueva' : ''}"><div class="meta"><b>${L(emp[0], emp[1])}</b><span>${h[k]}</span></div>
        <h4>${L(tt[0], tt[1])}</h4><span class="chip-f">${sg(s)} ${L(f.n[0], f.n[1])} ${pesos(p)}</span>
        <p class="lee">${L(lee[0], lee[1])}</p></li>`;
    }).join('');
    const bp = $('#feed-pausa');
    bp.textContent = feedPausa ? L('Seguir', 'Resume') : L('Pausar', 'Pause');
    $('.feed').classList.toggle('quieta', feedPausa);
  }
  $('#feed-pausa').addEventListener('click', () => { feedPausa = !feedPausa; pintaFeed(false); });
  if (reducir) $('#feed-pausa').hidden = true;
  let feedEncima = false;
  $('.feed').addEventListener('pointerenter', () => { feedEncima = true; });
  $('.feed').addEventListener('pointerleave', () => { feedEncima = false; });
  if (!reducir) setInterval(() => {
    if (feedPausa || feedEncima || document.hidden || !enVista($('#feed'))) return;
    feedIni = (feedIni + NOT.length - 1) % NOT.length;
    pintaFeed(true);
  }, 4200);

  /* ================= la IA: el asistente que escribe (la misma cartera de ejemplo) ================= */
  const QA = () => {
    const meta = [vf(48215.3, 200, -0.01, 10), vf(48215.3, 200, 0.04, 10), vf(48215.3, 200, 0.07, 10)].map((v) => eur(Math.round(v / 1000) * 1000));
    return [
      [L('¿Por qué se pasa la tecnología de mi límite?', 'Why is tech over my limit?'),
        L(`La tecnología pesa ya un 34${NB}% de tu cartera y el límite que te marcaste es el 30${NB}%. Casi todo viene del ETF de EE. UU. y del fondo indexado mundial, que llevan mucho de las grandes tecnológicas y este año han subido más que el resto. El límite es tuyo: lo que hagas con él lo decides tú.`,
          `Tech is now 34% of your portfolio and the limit you set yourself is 30%. Almost all of it comes from the US ETF and the global index fund, which hold a lot of big tech and have risen more than the rest this year. The limit is yours: what you do about it is up to you.`)],
      [L('¿Cuánto pagaría a Hacienda este año?', 'How much tax would I pay this year?'),
        L(`Con lo que has vendido este año llevas ${eur(960)} de saldo de ganancias y pérdidas (${eur(1080)} ganados y ${eur(120)} perdidos) y ${eur(312.4, 2)} de dividendos. Son ${eur(1272.4, 2)} de base del ahorro: al 19${NB}%, ${eur(241.76, 2)}. Ya te retuvieron ${eur(59.36, 2)}, así que quedarían unos ${eur(182.4, 2)}. Si vendes algo más antes del 31 de diciembre, lo recalculo.`,
          `With what you’ve sold this year you have ${eur(960)} of net gains and losses (${eur(1080)} gained and ${eur(120)} lost) and ${eur(312.4, 2)} of dividends. That’s ${eur(1272.4, 2)} of savings income: at 19%, ${eur(241.76, 2)}. ${eur(59.36, 2)} has already been withheld, so about ${eur(182.4, 2)} would be left. If you sell anything else before 31 December, I’ll recalculate.`)],
      [L('¿Voy bien para mi meta?', 'Am I on track for my goal?'),
        L(`Tu meta es llegar a ${eur(100000)} en 2036 aportando ${eur(200)} al mes. Con una rentabilidad de ejemplo del −1${NB}% llegarías a unos ${meta[0]} y no la alcanzarías; con un 4${NB}%, a unos ${meta[1]}, y con un 7${NB}%, a unos ${meta[2]}. Son escenarios, no una previsión: no son un indicador fiable de resultados futuros. ¿Sigues pudiendo aportar ${eur(200)} al mes o ha cambiado algo?`,
          `Your goal is ${eur(100000)} by 2036, putting in ${eur(200)} a month. At an example return of −1% you’d reach about ${meta[0]} and fall short; at 4%, about ${meta[1]}, and at 7%, about ${meta[2]}. These are scenarios, not a forecast: they are not a reliable indicator of future results. Can you still put in ${eur(200)} a month, or has something changed?`)]
    ];
  };
  let preguntaActual = 0, escribe = 0, chatVisto = false;
  function ponPregunta(i, animar) {
    preguntaActual = i;
    const qa = QA();
    $$('.preg-chat button').forEach((b, k) => { b.textContent = qa[k][0]; b.setAttribute('aria-pressed', k === i); });
    const [q, a] = qa[i];
    $('#preg').textContent = q;
    const resp = $('#resp');
    clearInterval(escribe);
    resp.removeAttribute('aria-busy');
    resp.innerHTML = '<span class="fantasma" aria-hidden="true"></span><span class="vivo"></span>';
    $('.fantasma', resp).textContent = a;
    const vivo = $('.vivo', resp);
    if (!animar || reducir) { vivo.textContent = a; return; }
    const pal = a.split(' ');
    let n = 0;
    resp.setAttribute('aria-busy', 'true');
    vivo.innerHTML = '<span class="cursor"></span>';
    escribe = setInterval(() => {
      n += 1;
      vivo.innerHTML = pal.slice(0, n).join(' ') + (n < pal.length ? '<span class="cursor"></span>' : '');
      if (n >= pal.length) { clearInterval(escribe); resp.removeAttribute('aria-busy'); }
    }, 34);
  }
  $$('.preg-chat button').forEach((b) => b.addEventListener('click', () => ponPregunta(+b.dataset.q, true)));

  /* ================= hacienda: la hoja paso a paso (la misma cartera de ejemplo: 241,76 € de cuota) ================= */
  let etapa = 0;
  function pintaHoja() {
    const LI = [
      [0, L('Venta de un ETF de bolsa mundial', 'Sale of a global equity ETF'), '+' + eur(1080, 2), 'sube'],
      [1, L('Venta de acciones de una empresa', 'Sale of shares in a company'), eur(-120, 2), 'baja'],
      [1, L('Saldo de ganancias y pérdidas', 'Net gains and losses'), eur(960, 2), ''],
      [2, L('Dividendos cobrados', 'Dividends received'), eur(312.4, 2), ''],
      [3, L('Base del ahorro', 'Savings tax base'), eur(1272.4, 2), ''],
      [3, L('19' + NB + '% de ' + eur(1272.4, 2), '19% of ' + eur(1272.4, 2)), eur(241.76, 2), ''],
      [4, L('Ya retenido en los dividendos', 'Already withheld on dividends'), eur(-59.36, 2), '']
    ];
    $('#hoja').innerHTML = `<div class="hoja-cab"><b>${L('Renta de 2026', '2026 tax return')}</b>${ejemplo()}</div><dl>` +
      LI.map(([e, t, v, c]) => `<div class="lin" data-lin="${e}"><dt>${t}</dt><dd class="num ${c}">${v}</dd></div>`).join('') +
      `<div class="lin tot" data-lin="4"><dt>${L('Quedaría por pagar', 'Left to pay')}</dt><dd class="num">${eur(182.4, 2)}</dd></div></dl>
      <p class="pie-ej">${L('Cifras inventadas, con la escala del ahorro (parte estatal y autonómica juntas). Lo que te toque a ti depende de tu caso.', 'Made-up figures, using the savings scale (state and regional parts together). What you owe depends on your own case.')}</p>`;
    ponEtapa(etapa, false);
  }
  function ponEtapa(i) {
    etapa = Math.max(0, Math.min(4, i));
    $$('.etapa-r').forEach((e) => { e.hidden = +e.dataset.etapa !== etapa; });
    $$('.pasos-n button').forEach((b) => { if (+b.dataset.etapa === etapa) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    $$('#hoja .lin').forEach((l) => { l.classList.toggle('on', +l.dataset.lin === etapa); l.classList.toggle('hecha', +l.dataset.lin < etapa); });
    $('#et-ant').disabled = etapa === 0;
    $('#et-sig').textContent = etapa === 4 ? L('Volver a empezar', 'Start again') : L('Siguiente paso', 'Next step');
  }
  $$('.pasos-n button').forEach((b) => b.addEventListener('click', () => ponEtapa(+b.dataset.etapa)));
  $('#et-ant').addEventListener('click', () => ponEtapa(etapa - 1));
  $('#et-sig').addEventListener('click', () => ponEtapa(etapa === 4 ? 0 : etapa + 1));

  /* ================= hacienda: tramos ================= */
  const TRAMOS = [[6000, 0.19], [50000, 0.21], [200000, 0.23], [300000, 0.27], [Infinity, 0.30]];
  function tramos() {
    const g = +$('#r-gan').value;
    $('#o-gan').value = eur(g);
    $('#r-gan').setAttribute('aria-valuetext', eur(g));
    let resto = g, desde = 0, total = 0, out = '';
    TRAMOS.forEach(([hasta, t]) => {
      const base = Math.max(0, Math.min(resto, hasta - desde)), cuota = base * t;
      total += cuota;
      const lab = hasta === Infinity ? L('Más de ' + fmt(desde) + ' €', 'Over €' + fmt(desde)) : (desde ? L(fmt(desde) + ' a ' + fmt(hasta) + ' €', '€' + fmt(desde) + ' to €' + fmt(hasta)) : L('Hasta ' + fmt(hasta) + ' €', 'Up to €' + fmt(hasta)));
      out += `<div class="tramo"><span>${lab} · ${pc(t * 100)}</span><b class="num">${eur(cuota, 2)}</b><i style="--w:${hasta === Infinity ? Math.min(100, base / 100000 * 100) : (base / (hasta - desde) * 100)}%"></i></div>`;
      resto -= base; desde = hasta;
    });
    $('#tramos').innerHTML = out;
    $('#t-tot').textContent = eur(total, 2);
    $('#t-tipo').textContent = g ? L(`Tipo medio: ${pc(total / g * 100, 1)}.`, `Average rate: ${pc(total / g * 100, 1)}.`) : '';
  }
  $('#r-gan').addEventListener('input', tramos);

  /* ================= mercados: el mapa ================= */
  // país: [índice, hoy, 1 mes, en el año] (ejemplo)
  const BOLSAS = { US: ['S&P 500', -0.3, 1.8, 14.2], ES: ['Ibex 35', 0.6, 3.1, 21.5], DE: ['DAX', 0.4, 2.2, 16.8], FR: ['CAC 40', 0.2, -0.9, 6.1], GB: ['FTSE 100', -0.1, 0.7, 8.7], JP: ['Nikkei 225', 1.1, 4.0, 11.9], CN: ['Shanghai', -0.8, -2.4, 7.4], IN: ['Nifty 50', 0.5, 1.2, 9.8], BR: ['Bovespa', -0.4, -1.1, 12.3], CA: ['TSX', 0.3, 1.5, 10.4], AU: ['ASX 200', 0.2, 0.6, 7.9], KR: ['Kospi', 1.4, 3.6, 18.2], CH: ['SMI', 0.1, -0.4, 5.2], NL: ['AEX', 0.3, 1.9, 9.1], IT: ['FTSE MIB', 0.5, 2.7, 13.6], MX: ['IPC', -0.2, -1.6, 6.6], TW: ['Taiex', 1.2, 3.3, 17.5], ZA: ['JSE', 0.0, 0.8, 8.3] };
  const COL = { hoy: 1, mes: 2, anio: 3 }, TOPE = { hoy: 1.2, mes: 4, anio: 20 };
  const TOTAL = 48215.3;
  // la cartera de ejemplo: lo que tiene país (los dos fondos y el ETF); el oro y la cripto no tienen país
  const FONDOS = [
    [['Fondo indexado mundial', 'Global index fund'], 18420.55, { US: 0.63, JP: 0.05, GB: 0.035, CN: 0.03, CA: 0.03, FR: 0.025, CH: 0.025, DE: 0.02, TW: 0.02, IN: 0.02, AU: 0.015, KR: 0.01, NL: 0.01 }],
    [['ETF de EE. UU.', 'US ETF'], 12310, { US: 1 }],
    [['Fondo de renta fija', 'Bond fund'], 9643.06, { DE: 0.3, FR: 0.25, IT: 0.18, ES: 0.15, NL: 0.06 }]
  ];
  const VIA = {}, TUYO = {};
  FONDOS.forEach(([n, v, ps]) => Object.entries(ps).forEach(([c, w]) => (VIA[c] = VIA[c] || []).push([n, v * w])));
  Object.entries(VIA).forEach(([c, l]) => { VIA[c].sort((a, b) => b[1] - a[1]); TUYO[c] = l.reduce((t, x) => t + x[1], 0) / TOTAL * 100; });
  const TUYO_MAX = Math.max(...Object.values(TUYO));
  const pcT = (t) => pc(t, t < 10 ? 1 : 0);
  const efectoUSD = () => Math.round(TOTAL * TUYO.US / 100 * 0.005 / 10) * 10;
  const REFERENCIA = ['US', 'ES', 'DE', 'JP', 'CN'];
  const ZONAS = { mundo: [0, 0, 1000, 439], am: [10, 70, 830, 364], eu: [387, 31, 290, 127], as: [569, 102, 430, 189] };
  let geo = null, modo = 'hoy', paisSel = 'ES', vb = ZONAS.mundo.slice();
  const BASE = 'color-mix(in srgb, var(--txt) 15%, var(--surf))';
  function colorPais(c, m, base = BASE, pref = '') {
    if (m === 'tuyo') { const t = TUYO[c]; return t ? `color-mix(in srgb, var(--oro) ${Math.round(22 + 78 * Math.sqrt(t / TUYO_MAX))}%, ${base})` : base; }
    const b = BOLSAS[c]; if (!b) return base;
    const x = b[COL[m]], k = Math.round(35 + 65 * Math.min(1, Math.abs(x) / TOPE[m]));
    return `color-mix(in srgb, var(${x >= 0 ? '--' + pref + 'sube' : '--' + pref + 'baja'}) ${k}%, ${base})`;
  }
  const nomPais = (c) => (c === 'US' ? L('EE. UU.', 'United States') : geo && geo.n[c] ? L(geo.n[c][0], geo.n[c][1]) : c);
  async function cargaMapa() {
    try { const r = await fetch('mapa-mundo.json'); geo = await r.json(); } catch (e) { geo = null; }
    if (!geo) { $('.mapa-g').hidden = true; $('.lista-m').hidden = true; return; }
    $('#mapa').innerHTML = Object.entries(geo.mundo).map(([c, d]) => `<path data-c="${c}" class="${BOLSAS[c] || TUYO[c] ? 'con' : ''}" d="${d}"/>`).join('');
    // el mapa pequeño de la app dibujada (pestaña Mercados y el móvil), con los colores de la app
    const baseA = 'color-mix(in srgb, var(--a-txt) 14%, var(--a-surf))';
    $('#defs-mapa').innerHTML = `<g id="mini-mundo" class="mini-mundo">${Object.entries(geo.mundo).map(([c, d]) => `<path d="${d}" style="fill:${colorPais(c, 'hoy', baseA, 'a-')}"/>`).join('')}</g>`;
    pintaMapa();
    ponPantalla(pantallaActual);
    pintaMovil();
    const caja = $('#mapa'), tip = $('#mapa-tip');
    caja.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const p = e.target.closest('path');
      if (!p) { tip.hidden = true; return; }
      const c = p.dataset.c;
      let v;
      if (modo === 'tuyo') v = TUYO[c] ? L(`${pcT(TUYO[c])} de tu cartera`, `${pcT(TUYO[c])} of your portfolio`) : L('Aquí no tienes nada', 'Nothing here');
      else v = BOLSAS[c] ? `${BOLSAS[c][0]}: <span class="tip-${BOLSAS[c][COL[modo]] >= 0 ? 's' : 'b'}">${flecha(BOLSAS[c][COL[modo]], 1)}</span>` : L('No seguimos su bolsa', 'We don’t track its market');
      tip.innerHTML = `<b>${nomPais(c)}</b>${v}`;
      const rc = $('.mapa-caja').getBoundingClientRect();
      tip.style.left = (e.clientX - rc.left) + 'px'; tip.style.top = (e.clientY - rc.top) + 'px';
      tip.hidden = false;
    });
    caja.addEventListener('pointerleave', () => { tip.hidden = true; });
    caja.addEventListener('click', (e) => { const p = e.target.closest('path'); if (p && p.classList.contains('con')) { paisSel = p.dataset.c; tip.hidden = true; pintaMapa(); } });
    requestAnimationFrame(() => { vetasAlto = 0; generaVetas(); });
  }
  function pintaFicha() {
    const c = paisSel, b = BOLSAS[c], t = TUYO[c];
    const celda = (x) => `<td class="${x >= 0 ? 'sube' : 'baja'}">${pct(x, 1)}</td>`;
    const tabla = b ? `<table><thead><tr><th scope="col">${L('Índice', 'Index')}</th><th scope="col">${L('Hoy', 'Today')}</th><th scope="col">${L('1 mes', '1 mo')}</th><th scope="col">${L('Año', 'YTD')}</th></tr></thead><tbody><tr><th scope="row">${b[0].replace(' ', NB)}</th>${celda(b[1])}${celda(b[2])}${celda(b[3])}</tr></tbody></table>` : '';
    const via = VIA[c] || [];
    const tuyo = t ? `<div class="tuyo"><small>${L('Tu dinero aquí', 'Your money here')}</small><b class="num">${eur(TOTAL * t / 100)}</b> <span class="de-cartera">· ${pcT(t)} ${L('de tu cartera', 'of your portfolio')}</span>
      <ul>${via.map(([n, v]) => `<li><span>${L(n[0], n[1])}</span><b class="num">${eur(v)}</b></li>`).join('')}</ul></div>` : `<div class="tuyo"><small>${L('Tu dinero aquí', 'Your money here')}</small><b>${L('Nada', 'None')}</b></div>`;
    $('#ficha-p').innerHTML = `<div class="anim"><div class="ficha-cab"><span class="k">${L('Ficha del país', 'Country profile')}</span>${ejemplo()}</div>
      <h3>${nomPais(c)}</h3><p class="sub2">${b ? L('Bolsa principal: ', 'Main index: ') + b[0] : L('Sin bolsa seguida', 'No tracked market')}</p>${tabla}${tuyo}
      <p class="nota-p">${L('Lo que tienes en fondos se reparte por países como sus índices; el oro y la cripto no tienen país. Elige otro país en el mapa.', 'What you hold in funds is split by country like their indices; gold and crypto have no country. Choose another country on the map.')}</p></div>`;
  }
  function pintaMapa() {
    if (!geo) return;
    $$('#mapa path').forEach((p) => { p.style.fill = colorPais(p.dataset.c, modo); p.classList.toggle('foco', p.dataset.c === paisSel); });
    const esc = $('#escala');
    if (modo === 'tuyo') esc.innerHTML = `<span>${pc(0)}</span><i style="background:linear-gradient(90deg, ${BASE}, var(--oro))"></i><span>${pc(TUYO_MAX)}</span>`;
    else { const t = TOPE[modo], d = modo === 'hoy' ? 1 : 0; esc.innerHTML = `<span>${pct(-t, d)}</span><i style="background:linear-gradient(90deg, var(--baja), ${BASE}, var(--sube))"></i><span>${pct(t, d)}</span>`; }
    $('#paises').innerHTML = Object.keys(BOLSAS).sort((a, b) => nomPais(a).localeCompare(nomPais(b), lang)).map((c) => `<li><button type="button" data-c="${c}" aria-pressed="${c === paisSel}">${nomPais(c)}</button></li>`).join('');
    $$('#paises button').forEach((b) => b.addEventListener('click', () => { paisSel = b.dataset.c; pintaMapa(); }));
    // la lista de cinco: en «Tu dinero», dónde está lo tuyo; si no, cinco bolsas de referencia, siempre las mismas y en el mismo orden
    const lista = modo === 'tuyo'
      ? Object.entries(TUYO).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c, t]) => [c, pcT(t), '', eur(TOTAL * t / 100)])
      : REFERENCIA.map((c) => { const b = BOLSAS[c]; return [c, flecha(b[COL[modo]], 1), b[COL[modo]] >= 0 ? 'sube' : 'baja', b[0]]; });
    $('#lista-cab').textContent = modo === 'tuyo' ? L('Dónde está la mayor parte de tu dinero', 'Where most of your money is')
      : L('Cinco bolsas de referencia · ', 'Five benchmark markets · ') + { hoy: L('hoy', 'today'), mes: L('en el último mes', 'over the last month'), anio: L('en el año', 'this year') }[modo];
    $('#mapa-lista').innerHTML = lista.map(([c, v, cls, sub]) => `<li><button type="button" data-c="${c}" aria-pressed="${c === paisSel}"><span>${nomPais(c)}<small>${sub}</small></span><b class="num ${cls}">${v}</b></button></li>`).join('');
    $$('#mapa-lista button').forEach((b) => b.addEventListener('click', () => { paisSel = b.dataset.c; pintaMapa(); }));
    pintaFicha();
  }
  function ponZona(z) {
    const de = vb.slice(), a = ZONAS[z], t0 = performance.now(), dur = reducir ? 0 : 900;
    const paso = (t) => {
      const p = dur ? Math.min(1, (t - t0) / dur) : 1, e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      vb = de.map((v, i) => v + (a[i] - v) * e);
      $('#mapa').setAttribute('viewBox', vb.map((v) => v.toFixed(1)).join(' '));
      if (p < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }
  $$('#mapa-modos button').forEach((b) => b.addEventListener('click', () => { modo = b.dataset.modo; $$('#mapa-modos button').forEach((x) => x.setAttribute('aria-pressed', x === b)); pintaMapa(); }));
  $$('#mapa-zonas button').forEach((b) => b.addEventListener('click', () => { $$('#mapa-zonas button').forEach((x) => x.setAttribute('aria-pressed', x === b)); ponZona(b.dataset.zona); }));

  /* ================= por qué Toisón: las escenas del nombre ================= */
  const ARIES = { mes: [322, 232], she: [318, 198], ham: [274, 140], a41: [124, 52], bot: [48, 222] };
  const ESC = [
    () => {
      const rnd = azar(7);
      let fondo = '';
      for (let i = 0; i < 26; i++) fondo += `<circle class="titila" style="--d:${(rnd() * 3).toFixed(2)}s" cx="${(rnd() * 400).toFixed(0)}" cy="${(rnd() * 300).toFixed(0)}" r="${(0.6 + rnd() * 1.1).toFixed(1)}"/>`;
      const a = ARIES;
      const lin = `M${a.mes} L${a.she} L${a.ham} L${a.bot} M${a.ham} L${a.a41}`.replace(/,/g, ' ');
      const est = (p, r, d) => `<circle class="estrella" style="--d:${d}s" cx="${p[0]}" cy="${p[1]}" r="${r}"/>`;
      return `<svg viewBox="0 0 400 300">${fondo}<path class="linea dib" style="--d:.5s" pathLength="1" d="${lin}"/>
        ${est(a.mes, 3.2, 0.2)}${est(a.she, 4, 0.35)}${est(a.ham, 5.5, 0.5)}${est(a.a41, 3, 0.8)}${est(a.bot, 3.2, 0.95)}
        <text x="282" y="128">Hamal</text><text x="200" y="290" text-anchor="middle">Aries</text></svg>`;
    },
    () => {
      let ola = 'M-80 0';
      for (let x = -80; x < 560; x += 40) ola += ' q10 -7 20 0 t20 0';
      return `<svg viewBox="0 0 400 300">
        <path class="linea dib" style="--d:.2s;opacity:.6" pathLength="1" d="M40 200 C120 120 280 120 360 190"/>
        <circle class="estrella" style="--d:.1s" cx="40" cy="200" r="4"/><circle class="estrella" style="--d:1.4s" cx="360" cy="190" r="5"/>
        <text x="40" y="176" text-anchor="middle">${L('Yolco', 'Iolcus')}</text><text x="362" y="160" text-anchor="middle">${L('Cólquide', 'Colchis')}</text>
        <g class="barco" style="transform:translate(70px,0)"><g class="mece">
          <path class="linea" d="M-46 236 Q-40 252 0 254 Q40 252 50 232 L40 236 Z" style="fill:color-mix(in srgb, var(--oro) 18%, transparent)"/>
          <path class="linea" d="M50 232 q9 -10 2 -19"/>
          <path class="linea" d="M0 236 V170"/>
          <path class="linea" d="M-24 178 Q0 184 24 178 L22 218 Q0 224 -22 218 Z" style="fill:color-mix(in srgb, var(--oro) 28%, transparent)"/>
          <path class="linea" d="M-30 246 l-8 14 M-16 249 l-6 14 M-2 250 l-3 14 M12 249 l0 14 M26 247 l3 14"/>
        </g></g>
        <g transform="translate(0 262)"><path class="tenue ola" d="${ola}"/></g>
        <g transform="translate(0 276)"><path class="tenue ola ola2" d="${ola}"/></g></svg>`;
    },
    () => {
      let cad = '';
      for (let i = 0; i < 9; i++) { const v = i % 2, x = 56 + i * 36; cad += `<ellipse class="linea dib" style="--d:${(0.3 + i * 0.12).toFixed(2)}s" pathLength="1" cx="${x}" cy="196" rx="${v ? 13 : 24}" ry="${v ? 21 : 14.8}"/>`; }
      return `<svg viewBox="0 0 400 300"><text class="grande" x="200" y="120" text-anchor="middle">1430</text>
        <text x="200" y="150" text-anchor="middle">${L('Brujas · Borgoña', 'Bruges · Burgundy')}</text>${cad}</svg>`;
    },
    () => `<svg viewBox="0 0 400 300"><circle class="tenue guarda" cx="200" cy="150" r="128"/>
        <g transform="translate(200 158) scale(1.25)">
          <path class="linea dib" style="--d:.1s" pathLength="1" d="M-80.9 0A80.9 50 0 1 1 80.9 0A80.9 50 0 1 1 -80.9 0Z"/>
          <path class="fill-o" d="M-80.9 0A80.9 50 0 1 1 80.9 0A80.9 50 0 1 1 -80.9 0ZM-54.1 0A54.1 46.4 0 1 0 54.1 0A54.1 46.4 0 1 0 -54.1 0Z"/>
          <use class="fill-t" href="#t"/>
        </g></svg>`,
    () => `<svg viewBox="0 0 400 300"><g transform="translate(18 18) scale(1.9)">
        <rect class="linea dib" style="--d:.1s" x="19.1" y="20" width="161.8" height="100" pathLength="1"/>
        <path class="linea dib" style="--d:.6s;opacity:.7" d="M119.1 20V120M119.1 81.8H180.9M142.7 81.8V120M119.1 96.4H142.7M133.7 81.8V96.4" pathLength="1"/>
        <path class="linea dib" style="--d:1.1s" d="M19.1 120A100 100 0 0 1 119.1 20A61.8 61.8 0 0 1 180.9 81.8A38.2 38.2 0 0 1 142.7 120A23.6 23.6 0 0 1 119.1 96.4A14.6 14.6 0 0 1 133.7 81.8" pathLength="1"/>
        <g transform="translate(100 70) scale(.62)"><path class="linea dib" style="--d:1.6s" pathLength="1" d="M-80.9 0A80.9 50 0 1 1 80.9 0A80.9 50 0 1 1 -80.9 0Z"/></g>
      </g><text class="phi" x="200" y="296" text-anchor="middle">φ = ${L('1,618…', '1.618…')}</text></svg>`
  ];
  let capActual = 0;
  const miniVistas = new WeakSet();
  function pintaEscenas() {
    $('#marco').innerHTML = ESC.map((f, i) => `<div class="esc${i === capActual ? ' on' : ''}" aria-hidden="${i !== capActual}">${f()}</div>`).join('');
    $$('.cap').forEach((c, i) => {
      const m = $('.mini-esc', c);
      const on = miniVistas.has(m) || reducir;
      m.innerHTML = `<div class="marco"><div class="esc${on ? ' on' : ''}">${ESC[i]()}</div></div>`;
    });
    mueveBarco();
  }
  function ponCap(i) {
    if (i === capActual) return;
    capActual = i;
    $$('#marco .esc').forEach((e, k) => { e.setAttribute('aria-hidden', k !== i); e.classList.toggle('on', k === i); });
  }
  function mueveBarco() {
    const cap = $('.cap[data-cap="1"]');
    if (!cap) return;
    const r = cap.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (innerHeight * 0.75 - r.top) / (r.height + innerHeight * 0.25)));
    const x = 60 + p * 240;
    $$('.barco').forEach((b) => { b.style.transform = `translate(${x.toFixed(1)}px,${(-Math.sin(p * Math.PI) * 50).toFixed(1)}px)`; });
  }
  // qué capítulo toca: el último cuyo título ha pasado del 60 % de la pantalla
  function quePaso(sel, tit) {
    const lim = innerHeight * 0.55;
    let k = 0;
    $$(sel).forEach((el, i) => { const h = $(tit, el); if (h && h.getBoundingClientRect().top < lim) k = i; });
    return k;
  }

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

  /* ================= aparecer al bajar (y lo que arranca al verse) ================= */
  function entra(el) {
    el.classList.add('in');
    $$('[data-count]', el).forEach(cuenta);
    if (el.matches('[data-count]')) cuenta(el);
    if (el.matches('.mini-esc')) { miniVistas.add(el); $$('.esc', el).forEach((s) => s.classList.add('on')); }
    if (el.matches('.chat') && !chatVisto) { chatVisto = true; ponPregunta(preguntaActual, true); }
  }
  function revela() {
    const els = $$('.r, .mini-esc, .cifras');
    if (reducir || !('IntersectionObserver' in window)) { els.forEach((e) => { e.classList.add('in'); if (e.matches('.mini-esc')) miniVistas.add(e); }); pintaEscenas(); return; }
    const io = new IntersectionObserver((ents) => ents.forEach((x) => { if (x.isIntersecting) { entra(x.target); io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.r').forEach((e, i) => e.style.setProperty('--d', ((i % 4) * 0.08).toFixed(2) + 's'));
    els.forEach((e) => io.observe(e));
  }

  /* ================= vetas del mármol: por toda la página, crecen al bajar ================= */
  let vetas = [], vetasAlto = 0, vetasAncho = 0;
  function generaVetas() {
    const svg = $('.vetas');
    if (html.dataset.dir !== 'marmol') { svg.innerHTML = ''; vetas = []; vetasAlto = 0; return; }
    const W = html.clientWidth, H = html.scrollHeight;
    if (Math.abs(H - vetasAlto) < 4 && W === vetasAncho && svg.childElementCount) return;
    vetasAlto = H; vetasAncho = W;
    svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const rnd = azar(1430);
    const n = Math.round(H / 260);
    let out = '';
    const veta = (x, y, ang, largo, tipo, ancho) => {
      let d = `M${x.toFixed(1)} ${y.toFixed(1)}`, minY = y, maxY = y;
      const ramas = [];
      const pasos = Math.max(6, Math.round(largo / 18));
      for (let i = 0; i < pasos; i++) {
        ang += (rnd() - 0.5) * 0.55;
        const l = 12 + rnd() * 14;
        x += Math.cos(ang) * l; y += Math.sin(ang) * l;
        d += `L${x.toFixed(1)} ${y.toFixed(1)}`;
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        if (tipo !== 'v-f' && rnd() < 0.05) ramas.push([x, y, ang + (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.6)]);
      }
      vetas.push({ top: minY, bot: maxY });
      out += `<path class="${tipo}" pathLength="1" stroke-width="${ancho}" d="${d}"/>`;
      ramas.forEach(([rx, ry, ra]) => veta(rx, ry, ra, 120 + rnd() * 260, 'v-f', 0.6));
    };
    vetas = [];
    for (let i = 0; i < n; i++) {
      const tipo = rnd() < 0.18 ? 'v-o' : 'v-b';
      const y = (i / n) * H + rnd() * 200;
      const desdeIzq = rnd() < 0.5;
      const x = desdeIzq ? -20 + rnd() * W * 0.3 : W * 0.7 + rnd() * W * 0.3 + 20;
      const ang = desdeIzq ? 0.5 + rnd() * 0.6 : Math.PI - 0.5 - rnd() * 0.6;
      veta(x, y, ang, 500 + rnd() * 900, tipo, tipo === 'v-o' ? 1.3 : 0.9 + rnd() * 0.5);
    }
    svg.innerHTML = out;
    actualizaVetas();
  }
  function actualizaVetas() {
    if (!vetas.length) return;
    const ps = $('.vetas').children, abajo = scrollY + innerHeight * 0.95;
    for (let i = 0; i < ps.length; i++) {
      const v = vetas[i];
      if (!v) continue;
      const p = reducir ? 1 : Math.max(0, Math.min(1, (abajo - v.top) / (v.bot - v.top + innerHeight * 0.5)));
      if (Math.abs((v.p ?? -1) - p) > 0.004) { v.p = p; ps[i].style.strokeDashoffset = 1 - p; }
    }
  }
  const brillo = $('.brillo');
  if (fino && !reducir) {
    let raf = 0;
    addEventListener('pointermove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { brillo.classList.add('on'); brillo.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; });
    }, { passive: true });
  }

  /* ================= estilo ================= */
  const DIRS = ['marmol', 'marfil']; // Borgoña se quitó el 7 nov, como en la app: quien la tenía, a Marfil
  function ponDir(d, guardar) {
    if (d === 'borgona') { d = 'marfil'; guardar = true; }
    if (!DIRS.includes(d)) d = 'marmol';
    html.dataset.dir = d;
    $('meta[name="theme-color"]').content = { marmol: '#151817', marfil: '#ede1cc' }[d];
    // Marfil es claro. 5 nov: «only light» no le vale a Samsung Internet, que la repintaba igual; «light dark» le dice que
    // la web lleva su propio modo oscuro y así no la toca (los colores de Marfil son suyos, así que sigue clara)
    $('meta[name="color-scheme"]').content = d === 'marfil' ? 'light dark' : 'dark';
    $$('.estilo button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.dir === d));
    vetasAlto = 0;
    requestAnimationFrame(generaVetas);
    if (guardar) { try { localStorage.setItem('toison-estilo', d); } catch (e) {} }
  }
  $$('.estilo button').forEach((b) => b.addEventListener('click', () => {
    const tope = 90, sec = $$('main > section, main > div, .pie').find((x) => x.getBoundingClientRect().bottom > tope);
    const antes = sec ? sec.getBoundingClientRect().top : 0;
    ponDir(b.dataset.dir, true);
    if (sec && scrollY > 0) scrollTo({ top: scrollY + sec.getBoundingClientRect().top - antes, behavior: 'instant' });
  }));

  /* ================= menú del móvil ================= */
  const mb = $('.menu-btn'), mm = $('#menu-movil');
  const ponMenu = (abierto) => { mm.hidden = !abierto; mb.setAttribute('aria-expanded', abierto); mb.classList.toggle('abierto', abierto); };
  mb.addEventListener('click', () => ponMenu(mm.hidden));
  $$('#menu-movil a').forEach((a) => a.addEventListener('click', () => ponMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mm.hidden) { ponMenu(false); mb.focus(); } });
  addEventListener('click', (e) => { if (!mm.hidden && !e.target.closest('.nav')) ponMenu(false); });
  $('#nav').addEventListener('focusout', (e) => { if (!mm.hidden && e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) ponMenu(false); });

  /* ---------- «Pedir acceso» lleva al correo de la portada y lo deja listo para escribir ---------- */
  $$('a[href="#acceso"]').forEach((a) => a.addEventListener('click', (e) => {
    const f = $('#acceso'), inp = $('#correo');
    if (!f || f.classList.contains('hecho')) return;
    e.preventDefault();
    ponMenu(false);
    f.scrollIntoView({ behavior: reducir ? 'auto' : 'smooth', block: 'center' });
    setTimeout(() => inp.focus({ preventScroll: true }), reducir ? 0 : 500);
  }));

  /* ================= al bajar: barra de progreso, vetas, el barco y la escena del nombre ================= */
  const barra = $('.progreso');
  let pend = false;
  function alDesplazar() {
    pend = false;
    const max = html.scrollHeight - innerHeight;
    barra.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0})`;
    actualizaVetas();
    mueveBarco();
    if (innerWidth > 900) ponCap(quePaso('.cap', 'h3'));
  }
  addEventListener('scroll', () => { if (!pend) { pend = true; requestAnimationFrame(alDesplazar); } }, { passive: true });
  let tRes = 0;
  addEventListener('resize', () => { clearTimeout(tRes); tRes = setTimeout(() => { generaVetas(); alDesplazar(); }, 200); });

  /* ================= todo lo que se pinta con textos ================= */
  function pintaTodo() {
    if (fino) { const t = $('.mapa-toca'); if (t) t.textContent = L('Pasa el ratón o toca un país', 'Hover or tap a country'); }
    ponPantalla(pantallaActual);
    pintaMovil();
    pintaCinta();
    pintaProducto();
    futuro();
    pintaNoticias();
    pintaRadial();
    pintaTemas();
    pintaFeed(false);
    ponPregunta(preguntaActual, false);
    pintaHoja();
    tramos();
    pintaMapa();
    pintaEscenas();
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
  html.classList.remove('en-pend');
  if (!reducir) $('#resp .vivo').textContent = '';
  revela();
  cargaMapa();
  alDesplazar();
  // cuando acaba la entrada de la portada, el titular ya no espera al escudo (cambio de idioma o de estilo)
  setTimeout(() => html.classList.add('listo'), reducir ? 0 : 3200);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { vetasAlto = 0; generaVetas(); });
  addEventListener('load', () => { vetasAlto = 0; generaVetas(); });
})();
