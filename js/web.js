(() => {
  'use strict';
  const html = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const EN = window.TEXTOS_EN || {};
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fino = matchMedia('(pointer: fine)').matches;
  const NB = ' ';
  let lang = 'es';
  const L = (es, en) => (lang === 'en' ? en : es);

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

  /* ---------- semilla para lo aleatorio: siempre sale igual ---------- */
  function azar(semilla) {
    let a = semilla >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  /* ================= textos (ES / EN) ================= */
  function aplicaTextos() {
    html.lang = lang;
    document.title = L('Toisón · Todas tus inversiones, en un solo sitio', 'Toisón · All your investments, in one place');
    $$('[data-t]').forEach((el) => {
      if (el._es === undefined) el._es = el.innerHTML;
      const en = EN[el.dataset.t];
      el.innerHTML = lang === 'en' && en ? en : el._es;
    });
    $$('[data-t-aria]').forEach((el) => {
      if (el._esA === undefined) el._esA = el.getAttribute('aria-label');
      const en = EN[el.dataset.tAria];
      el.setAttribute('aria-label', lang === 'en' && en ? en : el._esA);
    });
    $$('[data-t-alt]').forEach((el) => {
      if (el._esAlt === undefined) el._esAlt = el.alt;
      const en = EN[el.dataset.tAlt];
      el.alt = lang === 'en' && en ? en : el._esAlt;
    });
    $$('.etapas button').forEach((b, i) => b.setAttribute('aria-label', L('Paso ', 'Step ') + (i + 1)));
    $('meta[name="theme-color"]').content = { marmol: '#151817', marfil: '#faf2e8', borgona: '#4e101d' }[html.dataset.dir] || '#151817';
    $$('.idioma button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === lang));
    partePalabras();
    pintaCinta();
    pintaMoviles();
    pintaEscenas();
    pintaHoja();
    pintaRadial();
    pintaTemas();
    pintaFeed(false);
    pintaIdea();
    pintaLectura(false);
    pintaInforme();
    pintaTramos();
    pintaMapa();
    pintaIndice();
    dibujaGrafica(false);
    ponPregunta(preguntaActual, false);
  }

  /* ---------- titulares palabra a palabra ---------- */
  function partePalabras() {
    $$('[data-split]').forEach((el) => {
      let i = 0;
      const trozos = (txt) => txt.split(/(\s+)/).map((w) => (/^\s+$/.test(w) || !w ? w : `<span class="pal" style="--i:${i++}">${w}</span>`)).join('');
      const recorre = (nodo) => [...nodo.childNodes].map((n) => {
        if (n.nodeType === 3) return trozos(n.textContent);
        if (n.nodeType === 1) return `<${n.tagName.toLowerCase()}>${recorre(n)}</${n.tagName.toLowerCase()}>`;
        return '';
      }).join('');
      el.innerHTML = recorre(el);
    });
  }

  /* ================= aparecer al bajar ================= */
  const vistos = new WeakSet();
  function prepara() {
    const alto = innerHeight * 0.92;
    const fuera = (el) => el.getBoundingClientRect().top > alto;
    $$('[data-r]').forEach((el) => { if (!reducir && fuera(el)) el.classList.add('r-pre'); });
    $$('[data-split]').forEach((el) => { if (!reducir && fuera(el)) el.classList.add('pal-pre'); });
    $$('.cifras li').forEach((el) => { if (!reducir && fuera(el)) el.style.setProperty('--lin', 0); });
    const io = new IntersectionObserver((ents) => ents.forEach((e) => {
      if (!e.isIntersecting || vistos.has(e.target)) return;
      vistos.add(e.target);
      entra(e.target);
      io.unobserve(e.target);
    }), { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    $$('[data-r], [data-split], .cifras li, .cadena, #graf, .chat, .mini-esc, .idea').forEach((el) => io.observe(el));
  }
  function entra(el) {
    if (el.classList.contains('r-pre')) { el.classList.add('r-in'); requestAnimationFrame(() => el.classList.remove('r-pre')); }
    if (el.classList.contains('pal-pre')) { el.classList.add('pal-in'); requestAnimationFrame(() => el.classList.remove('pal-pre')); }
    if (el.matches('.cifras li')) el.style.setProperty('--lin', 1);
    { const b = $('[data-count]', el); if (b) cuenta(b); }
    if (el.matches('.cadena')) el.classList.add('vista');
    if (el.id === 'graf' && !reducir) { el.classList.add('entra'); setTimeout(() => el.classList.remove('entra'), 2400); }
    if (el.matches('.chat') && !reducir) ponPregunta(0, true);
    if (el.matches('.idea')) el.classList.add('vista');
    if (el.matches('.mini-esc')) $$('.esc', el).forEach((s) => s.classList.add('on'));
  }
  function cuenta(b) {
    const fin = +b.dataset.count;
    if (reducir) return;
    const t0 = performance.now(), dur = 1500;
    const paso = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      b.textContent = fmt(Math.round(fin * e));
      if (p < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }

  /* ================= cinta ================= */
  function pintaCinta() {
    const items = L(['Fondos', 'Acciones', 'ETF', 'Oro', 'Cripto', 'Revolut', 'MyInvestor', 'Trade Republic', 'Interactive Brokers', 'Bitvavo', 'Precios en directo', 'La renta, hecha', 'Widget en el móvil'],
      ['Funds', 'Shares', 'ETFs', 'Gold', 'Crypto', 'Revolut', 'MyInvestor', 'Trade Republic', 'Interactive Brokers', 'Bitvavo', 'Live prices', 'Taxes, done', 'Home-screen widget']);
    const una = items.map((t) => `<span>${t}</span>`).join('');
    $('#cinta').innerHTML = una + una;
  }

  /* ================= cadena de oes ================= */
  function pintaCadenas() {
    let s = '';
    for (let i = 0; i < 13; i++) {
      const x = 30 + i * 38, v = i % 2;
      s += `<ellipse style="--i:${i}" pathLength="1" cx="${x}" cy="30" rx="${v ? 13 : 24}" ry="${v ? 21 : 14.8}"/>`;
    }
    $$('.cadena').forEach((c) => { c.innerHTML = `<svg viewBox="0 0 516 60">${s}</svg>`; });
  }

  /* ================= vetas del mármol ================= */
  let vetas = [], vetasAlto = 0;
  function generaVetas() {
    const svg = $('.vetas');
    if (html.dataset.dir !== 'marmol') { svg.innerHTML = ''; vetas = []; return; }
    const W = document.documentElement.clientWidth, H = document.documentElement.scrollHeight;
    if (Math.abs(H - vetasAlto) < 4 && svg.childElementCount) return;
    vetasAlto = H;
    svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const rnd = azar(1430);
    const n = Math.round(H / 260);
    let out = '';
    const veta = (x, y, ang, largo, tipo, ancho) => {
      let d = `M${x.toFixed(1)} ${y.toFixed(1)}`, minY = y, maxY = y, ramas = [];
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

  /* ================= móvil ================= */
  const ICON = {
    ini: '<path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>',
    paso: '<path d="M8 6h11M8 12h11M8 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
    merc: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.5 2.5 2.5 13.5 0 16M12 4c-2.5 2.5-2.5 13.5 0 16"/>',
    not: '<path d="M5 5h11v14H7a2 2 0 0 1-2-2zM16 9h3v8a2 2 0 0 1-2 2"/><path d="M8 9h5M8 12h5M8 15h3"/>',
    exp: '<path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z"/>'
  };
  const navApp = (act) => '<div class="barra-nav">' + [['ini', 'Inicio', 'Home'], ['paso', 'Paso a paso', 'Steps'], ['merc', 'Mercados', 'Markets'], ['not', 'Noticias', 'News'], ['exp', 'Expertos', 'Experts']]
    .map(([k, es, en], i) => `<span class="${i === act ? 'act' : ''}"><svg viewBox="0 0 24 24">${ICON[k]}</svg>${L(es, en)}</span>`).join('') + '</div>';
  const ESTADO = '<div class="estado"><span>9:41</span><span><svg viewBox="0 0 18 11"><rect x="0" y="7" width="3" height="4" rx=".7"/><rect x="5" y="5" width="3" height="6" rx=".7"/><rect x="10" y="2.5" width="3" height="8.5" rx=".7"/><rect x="15" y="0" width="3" height="11" rx=".7"/></svg><svg viewBox="0 0 16 11"><path d="M8 2.2c2.4 0 4.6.9 6.2 2.5l1.3-1.3A10.6 10.6 0 0 0 8 .3 10.6 10.6 0 0 0 .5 3.4l1.3 1.3A8.7 8.7 0 0 1 8 2.2zm0 3.7c1.4 0 2.6.5 3.6 1.4l1.3-1.3A7 7 0 0 0 8 4a7 7 0 0 0-4.9 2l1.3 1.3c1-.9 2.2-1.4 3.6-1.4zM8 9.6l1.9-1.9a2.7 2.7 0 0 0-3.8 0z"/></svg><svg viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="currentColor" opacity=".45"/><rect x="2" y="2" width="16" height="8" rx="1.8"/><rect x="23.5" y="4" width="2" height="4" rx="1" opacity=".45"/></svg></span></div>';
  const ejemplo = () => `<span class="ejemplo">${L('Ejemplo', 'Example')}</span>`;
  const tit = (t) => `<div class="tit">${t}${ejemplo()}</div>`;
  const yo = '<span class="yo"><svg viewBox="-82 -78 164 147" aria-hidden="true"><use class="s-o" href="#o"/><use class="s-t" href="#t"/></svg></span>';
  const serie = (semilla, n, tend) => { const r = azar(semilla); let v = 50; const p = []; for (let i = 0; i < n; i++) { v += (r() - 0.5) * 3.2 + tend; p.push(v); } return p; };
  const trazo = (p, w, h, m = 2) => { const mn = Math.min(...p), mx = Math.max(...p); return p.map((y, i) => [i * w / (p.length - 1), m + (h - 2 * m) * (1 - (y - mn) / (mx - mn || 1))]); };
  const grafCartera = (() => {
    const pts = trazo(serie(48215, 48, 0.55), 252, 70, 6);
    const d = pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('');
    const u = pts[pts.length - 1];
    return `<svg class="spark" viewBox="0 0 252 72" style="width:100%;margin:10px 0 0;overflow:visible" aria-hidden="true">
      <defs><linearGradient id="gc" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--a-graf)" stop-opacity=".28"/><stop offset="1" stop-color="var(--a-graf)" stop-opacity="0"/></linearGradient></defs>
      <path class="ar" d="${d}L252 72L0 72Z" fill="url(#gc)"/><path class="ln" pathLength="1" d="${d}" fill="none" stroke="var(--a-graf)" stroke-width="2" stroke-linejoin="round"/>
      <circle class="punta-halo" cx="${u[0]}" cy="${u[1]}" r="4"/><circle class="punta" cx="${u[0]}" cy="${u[1]}" r="3.5"/></svg>`;
  })();
  const mini = (semilla, tend, cls) => {
    const d = trazo(serie(semilla, 24, tend), 54, 18).map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('');
    return `<svg viewBox="0 0 54 18" aria-hidden="true"><path d="${d}" fill="none" stroke="var(--a-${cls})" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
  };
  const flecha = (n) => (n >= 0 ? '▲ ' : '▼ ') + pct(n);
  const pesos = (n) => `<span class="pesos" aria-label="${L('peso', 'weight')} ${n}/3">${[1, 2, 3].map((k) => `<i class="${k <= n ? 'on' : ''}"></i>`).join('')}</span>`;
  const SG = { '+': ['▲', 'p'], '-': ['▼', 'n'], '=': ['=', 'e'], '±': ['◆', 'm'] };
  const sg = (s) => `<span class="sg ${SG[s][1]}">${SG[s][0]}</span>`;
  const av = (t, c) => `<span class="av" style="background:${c}">${t}</span>`;
  const PANT = [
    () => `<div class="hola"><div><small>${L('Buenos días', 'Good morning')}</small><b>${L('Tu cartera', 'Your portfolio')}</b></div>${yo}</div>
      <div class="tarj"><div class="et" style="display:flex;justify-content:space-between">${L('Patrimonio', 'Net worth')}${ejemplo()}</div><div class="cifra">${eur(48215.3, 2)}</div>
      <div class="sube num" style="font-weight:600;font-size:12px">▲ +${eur(1204.1, 2)} (${pct(2.56)}) <span style="color:var(--a-txt2);font-weight:400">${L('este año', 'this year')}</span></div>${grafCartera}
      <div class="rango"><i>1S</i><i>1M</i><i class="on">${L('1A', '1Y')}</i><i>${L('Máx', 'Max')}</i></div></div>
      <div class="tarj"><div class="et">${L('Reparto', 'Split')}</div><div class="reparto"><span style="--i:0;flex:62;background:var(--a-graf)"></span><span style="--i:1;flex:20;background:#2f5d8c"></span><span style="--i:2;flex:10;background:#7b6bae"></span><span style="--i:3;flex:8;background:#3d8a8c"></span></div>
      <div class="ley"><span><i style="background:var(--a-graf)"></i>${L('Acciones', 'Shares')} 62${L(NB + '%', '%')}</span><span><i style="background:#2f5d8c"></i>${L('Renta fija', 'Bonds')} 20${L(NB + '%', '%')}</span><span><i style="background:#7b6bae"></i>${L('Oro', 'Gold')} 10${L(NB + '%', '%')}</span><span><i style="background:#3d8a8c"></i>${L('Cripto', 'Crypto')} 8${L(NB + '%', '%')}</span></div></div>
      <div class="tarj" style="padding-top:2px;padding-bottom:2px">
        <div class="f2">${av('FM', '#8a6216')}<b>${L('Fondo indexado mundial', 'Global index fund')}</b><b class="d">${eur(18420.55, 2)}</b><small>MyInvestor · ${L('Fondo', 'Fund')}</small><small class="d sube">${flecha(0.92)}</small></div>
        <div class="f2">${av('US', '#2f5d8c')}<b>${L('ETF de EE. UU.', 'US ETF')}</b><b class="d">${eur(12310, 2)}</b><small>Trade Republic · ETF</small><small class="d baja">${flecha(-0.31)}</small></div>
      </div>` + navApp(0),
    () => `<div class="hola"><div><small>${L('Noviembre', 'November')}</small><b>${L('Paso a paso', 'Step by step')}</b></div>${yo}</div>
      <div class="tarj" style="display:flex;align-items:center;gap:12px"><svg class="anillo-p" viewBox="0 0 46 46" aria-hidden="true"><circle class="fondo" cx="23" cy="23" r="18"/><circle class="lleno" cx="23" cy="23" r="18" pathLength="1"/></svg>
        <div><b style="font-size:14px">${L('1 de 4 hecho', '1 of 4 done')}</b><small style="display:block;color:var(--a-txt2)">${L('Tu mes', 'Your month')}</small></div></div>
      <div class="tarj">
        <div class="check ok" style="--i:0"><i></i><div>${L('Tu aportación programada: ' + eur(200) + ' al fondo mundial', 'Your scheduled contribution: ' + eur(200) + ' to the global fund')}<small>${L('En la renta: nada', 'Tax effect: none')}</small></div></div>
        <div class="check" style="--i:1"><i></i><div>${L('Resultados de dos empresas tuyas', 'Earnings from two of your companies')}<small>${L('Jueves 12 y martes 17', 'Thursday 12 and Tuesday 17')}</small></div></div>
        <div class="check" style="--i:2"><i></i><div>${L('Tecnología: 34' + NB + '%, tu límite es 30' + NB + '%', 'Tech: 34%, your limit is 30%')}<span class="chip">${L('Lo decides tú', 'Your call')}</span></div></div>
        <div class="check" style="--i:3"><i></i><div>${L('31 dic: cierra el año fiscal', '31 Dec: tax year ends')}<small>${L('Después, todo cuenta para 2027', 'After that, it counts for 2027')}</small></div></div>
      </div>
      <div class="tarj"><div class="et">${L('Renta de 2026 hasta hoy', '2026 tax so far')}</div><div class="cifra" style="font-size:21px">${eur(205.2, 2)}</div><small style="color:var(--a-txt2)">${L('Ya retenido: ', 'Already withheld: ') + eur(34.2, 2) + L(' · Quedarían ', ' · Left to pay ') + eur(171, 2)}</small></div>` + navApp(1),
    () => tit(L('Mercados', 'Markets')) + `<div class="tarj" style="padding:8px 10px"><div class="et" style="display:flex;justify-content:space-between;padding:0 2px"><span>${L('Bolsas hoy', 'Markets today')}</span><span class="sube">▲ ${L('7 de 10 suben', '7 of 10 up')}</span></div>
        <div class="mapa-mini"><svg viewBox="0 0 1000 439" aria-hidden="true"><use href="#mini-mundo"/></svg></div></div>
      <div class="tarj" style="padding-top:2px;padding-bottom:2px">
        <div class="idx"><b>S&amp;P 500<small style="display:block;font-weight:400;color:var(--a-txt2)">${L('EE. UU.', 'US')}</small></b>${mini(1, -0.12, 'baja')}<span class="num baja">${flecha(-0.3)}</span></div>
        <div class="idx"><b>Ibex 35<small style="display:block;font-weight:400;color:var(--a-txt2)">${L('España', 'Spain')}</small></b>${mini(2, 0.2, 'sube')}<span class="num sube">${flecha(0.6)}</span></div>
        <div class="idx"><b>${L('Euro / dólar', 'Euro / dollar')}<small style="display:block;font-weight:400;color:var(--a-txt2)">${L('Divisas', 'Currencies')}</small></b>${mini(3, 0.15, 'sube')}<span class="num sube">${flecha(0.5)}</span></div>
      </div>
      <div class="nota" style="margin-top:8px"><b>${L('Qué significa para ti', 'What it means for you')}</b>${L('El euro sube frente al dólar: lo que tienes en dólares vale unos ' + eur(61) + ' menos en euros.', 'The euro rises against the dollar: what you hold in dollars is worth about ' + eur(61) + ' less in euros.')}</div>` + navApp(2),
    () => tit(L('Noticias', 'News')) + `<div class="rango" style="margin:-4px 0 8px"><i class="on">${L('Tu cartera', 'Your portfolio')}</i><i>Radar</i><i>${L('Mercado', 'Market')}</i></div>
      <div class="tarj" style="padding-top:2px;padding-bottom:2px">
        <div class="not" style="--i:0"><div class="meta"><span>${L('Fabricante de chips · EE. UU.', 'Chipmaker · US')}</span><span>${L('hace 3 min', '3 min ago')}</span></div><b>${L('El fabricante de chips sube su previsión de ventas', 'Chipmaker raises its sales guidance')}</b><span class="fac">${sg('+')} ${L('Negocio', 'Business')} ${pesos(3)}</span><div class="ia-l">${L('Cambia la tesis: más ventas de las que esperaba el mercado.', 'Changes the thesis: more sales than the market expected.')}</div></div>
        <div class="not" style="--i:1"><div class="meta"><span>${L('Banca · zona euro', 'Banks · eurozone')}</span><span>${L('hace 18 min', '18 min ago')}</span></div><b>${L('El BCE mantiene los tipos de interés', 'The ECB holds interest rates')}</b><span class="fac">${sg('=')} ${L('Economía', 'Economy')} ${pesos(2)}</span><div class="ia-l">${L('Lo esperado: no cambia nada para tus fondos de renta fija.', 'As expected: nothing changes for your bond funds.')}</div></div>
        <div class="not" style="--i:2"><div class="meta"><span>${L('Coches · Europa', 'Cars · Europe')}</span><span>${L('hace 40 min', '40 min ago')}</span></div><b>${L('Nuevos aranceles a los coches importados', 'New tariffs on imported cars')}</b><span class="fac">${sg('-')} ${L('Política', 'Politics')} ${pesos(2)}</span></div>
      </div>` + navApp(3),
    () => tit(L('Ficha', 'Profile')) + `<div class="tarj"><b style="font-size:15px">${L('Fabricante de chips', 'Chipmaker')}</b><small style="display:block;color:var(--a-txt2)">${L('EE. UU. · Semiconductores', 'US · Semiconductors')}</small>
        <div class="et" style="margin-top:10px">${L('Opinión de 24 analistas', '24 analysts’ view')}</div>
        <div class="medidor"><span style="--i:0;flex:18;background:var(--a-sube)"></span><span style="--i:1;flex:5;background:var(--a-txt2);opacity:.5"></span><span style="--i:2;flex:1;background:var(--a-baja)"></span></div>
        <small style="color:var(--a-txt2)">${L('18 positivos · 5 neutrales · 1 negativo', '18 positive · 5 neutral · 1 negative')}</small>
        <div class="fila" style="margin-top:4px"><span>${L('Precio objetivo medio', 'Average target price')}</span><b class="num sube">${pct(12, 0)}</b></div></div>
      <div class="tarj"><div class="et" style="margin-bottom:2px">${L('Lo que dice la prensa, por factores', 'What the press says, by factor')}</div>
        ${FACT.map((f) => `<div class="ff"><span>${L(f.n[0], f.n[1])}</span>${sg(f.s)}${pesos(f.p)}</div>`).join('')}</div>` + navApp(4)
  ];
  let pasoActual = 0;
  function pintaMoviles() {
    const tema = { marfil: 'app-claro', borgona: 'app-borg' }[html.dataset.dir] || 'app-osc';
    $$('.movil').forEach((m) => {
      const n = m.dataset.pantalla;
      const capas = n === 'todas'
        ? PANT.map((f, i) => `<div class="capa" aria-hidden="${i !== pasoActual}">${f()}</div>`).join('')
        : `<div class="capa" aria-hidden="false">${PANT[+n]()}</div>`;
      m.innerHTML = `<div class="pant ${tema}">${ESTADO}${capas}</div>`;
    });
  }
  function ponPaso(i) {
    if (i === pasoActual) return;
    pasoActual = i;
    $$('#movil-fijo .capa').forEach((c, k) => c.setAttribute('aria-hidden', k !== i));
    $$('.puntos i').forEach((p, k) => p.classList.toggle('act', k === i));
  }

  /* ================= escenas del nombre ================= */
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
        ${est(a.mes, 3.2, .2)}${est(a.she, 4, .35)}${est(a.ham, 5.5, .5)}${est(a.a41, 3, .8)}${est(a.bot, 3.2, .95)}
        <text x="282" y="128">Hamal</text><text x="200" y="290" text-anchor="middle">Aries</text></svg>`;
    },
    () => {
      let ola = 'M-80 0';
      for (let x = -80; x < 560; x += 40) ola += ' q10 -7 20 0 t20 0';
      return `<svg viewBox="0 0 400 300">
        <path class="linea dib" style="--d:.2s;stroke-dasharray:1;opacity:.6" pathLength="1" d="M40 200 C120 120 280 120 360 190"/>
        <circle class="estrella" style="--d:.1s" cx="40" cy="200" r="4"/><circle class="estrella" style="--d:1.4s" cx="360" cy="190" r="5"/>
        <text x="40" y="226" text-anchor="middle">${L('Yolco', 'Iolcus')}</text><text x="360" y="216" text-anchor="middle">${L('Cólquide', 'Colchis')}</text>
        <g class="barco" id="barco" style="transform:translate(70px,0)"><g class="mece">
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
        <text x="200" y="150" text-anchor="middle">${L('Brujas · Borgoña', 'Bruges · Burgundy')}</text>${cad}
        <circle class="swatch" cx="200" cy="262" r="16"/><text x="226" y="266">#4E101D</text></svg>`;
    },
    () => `<svg viewBox="0 0 400 300"><circle class="tenue guarda" cx="200" cy="150" r="128" style="stroke-dasharray:3 9;opacity:.8"/>
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
  function pintaEscenas() {
    $('#marco').innerHTML = ESC.map((f, i) => `<div class="esc${i === capActual ? ' on' : ''}" aria-hidden="${i !== capActual}">${f()}</div>`).join('');
    $$('.cap').forEach((c, i) => {
      const m = $('.mini-esc', c);
      const on = vistos.has(m) || reducir;
      m.innerHTML = `<div class="marco"><div class="esc${on ? ' on' : ''}" aria-hidden="false">${ESC[i]()}</div></div>`;
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
    const x = 60 + p * 270;
    $$('.barco').forEach((b) => { b.style.transform = `translate(${x.toFixed(1)}px,${(-Math.sin(p * Math.PI) * 50).toFixed(1)}px)`; });
  }

  /* ================= renta ================= */
  let etapa = 0;
  function pintaHoja() {
    const L2 = [
      [0, L('ETF de bolsa mundial', 'Global equity ETF'), '+' + eur(1200, 2), 'sube'],
      [1, L('Acción de una empresa', 'Shares in a company'), eur(-300, 2), 'baja'],
      [1, L('Saldo de ganancias y pérdidas', 'Net gains and losses'), eur(900, 2), ''],
      [2, L('Dividendos cobrados', 'Dividends received'), eur(180, 2), ''],
      [3, L('Base del ahorro', 'Savings tax base'), eur(1080, 2), ''],
      [3, L('19' + NB + '% de ' + eur(1080, 2), '19% of ' + eur(1080, 2)), eur(205.2, 2), ''],
      [4, L('Ya retenido en los dividendos', 'Already withheld on dividends'), eur(-34.2, 2), '']
    ];
    $('#hoja').innerHTML = `<div class="hoja-cab"><b>${L('Renta de 2026', '2026 tax return')}</b><span class="ejemplo">${L('Ejemplo inventado', 'Made-up example')}</span></div><dl>` +
      L2.map(([e, t, v, c]) => `<div class="lin" data-lin="${e}"><dt>${t}</dt><dd class="${c}">${v}</dd></div>`).join('') +
      `<div class="lin tot" data-lin="4"><dt>${L('A pagar en la declaración', 'To pay on the return')}</dt><dd>${eur(171, 2)}</dd></div></dl>`;
    ponEtapa(etapa, false);
  }
  function ponEtapa(i, mover = true) {
    etapa = Math.max(0, Math.min(4, i));
    $$('.etapa').forEach((e) => { e.hidden = +e.dataset.etapa !== etapa; });
    $$('.etapas button').forEach((b) => { if (+b.dataset.etapa === etapa) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    $$('#hoja .lin').forEach((l) => l.classList.toggle('on', +l.dataset.lin === etapa));
    $('#et-ant').disabled = etapa === 0;
    $('#et-sig').textContent = etapa === 4 ? L('Volver a empezar', 'Start again') : L('Siguiente paso', 'Next step');
  }
  $$('.etapas button').forEach((b) => b.addEventListener('click', () => ponEtapa(+b.dataset.etapa)));
  $('#et-ant').addEventListener('click', () => ponEtapa(etapa - 1));
  $('#et-sig').addEventListener('click', () => ponEtapa(etapa === 4 ? 0 : etapa + 1));

  /* ================= proyección ================= */
  const R = { ini: $('#r-ini'), apo: $('#r-apo'), anos: $('#r-anos') };
  let perf = { r: 0.05, v: 0.12 }, datos = null, marca = null;
  function simula(ini, apo, anos, r, v) {
    const N = 600, rnd = azar(20261101), mu = Math.log(1 + r) / 12 - (v * v) / 24, sg = v / Math.sqrt(12);
    const por = Array.from({ length: anos + 1 }, () => new Float64Array(N));
    for (let k = 0; k < N; k++) {
      let x = ini; por[0][k] = x;
      for (let m = 1; m <= anos * 12; m++) {
        const u1 = rnd() || 1e-9, u2 = rnd();
        x = x * Math.exp(mu + sg * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)) + apo;
        if (m % 12 === 0) por[m / 12][k] = x;
      }
    }
    const q = (a, p) => a[Math.floor(p * (a.length - 1))];
    return por.map((a, y) => { const s = Array.from(a).sort((p1, p2) => p1 - p2); return { y, mal: q(s, 0.1), med: q(s, 0.5), bien: q(s, 0.9), apo: ini + apo * 12 * y }; });
  }
  const G = { w: 640, h: 300, l: 58, r: 14, t: 14, b: 30 };
  function dibujaGrafica(recalcula = true) {
    const ini = +R.ini.value, apo = +R.apo.value, anos = +R.anos.value;
    $('#o-ini').textContent = eur(ini); $('#o-apo').textContent = eur(apo); $('#o-anos').textContent = anos;
    if (recalcula || !datos || datos.length !== anos + 1) datos = simula(ini, apo, anos, perf.r, perf.v);
    const mx = Math.max(...datos.map((d) => d.bien)) * 1.05 || 1;
    const paso = [1e3, 2e3, 5e3, 1e4, 2e4, 5e4, 1e5, 2e5, 5e5, 1e6, 2e6].find((p) => mx / p <= 5) || 5e6;
    const top = Math.ceil(mx / paso) * paso;
    const X = (y) => G.l + (y / anos) * (G.w - G.l - G.r), Y = (v) => G.t + (1 - v / top) * (G.h - G.t - G.b);
    const etq = (v) => (!v ? '0' : v >= 1e6 ? fmt(v / 1e6, v % 1e6 ? 1 : 0) + L(' M', 'M') : fmt(v / 1e3) + L(' mil', 'k'));
    let s = '';
    for (let v = 0; v <= top + 1; v += paso) s += `<line class="rej" x1="${G.l}" x2="${G.w - G.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${G.l - 8}" y="${Y(v) + 4}" text-anchor="end">${etq(v)}</text>`;
    const cadaX = anos > 24 ? 10 : anos > 10 ? 5 : anos > 5 ? 2 : 1;
    for (let y = 0; y <= anos; y += cadaX) s += `<text x="${X(y)}" y="${G.h - 8}" text-anchor="middle">${y ? y + (y === cadaX ? L(' años', ' years') : '') : L('Hoy', 'Today')}</text>`;
    const p = (k) => datos.map((d) => X(d.y).toFixed(1) + ' ' + Y(d[k]).toFixed(1));
    s += `<path class="franja" d="M${p('bien').join('L')}L${p('mal').reverse().join('L')}Z"/>`;
    s += `<path class="apor" d="M${p('apo').join('L')}"/>`;
    s += `<path class="med" pathLength="1" d="M${p('med').join('L')}"/>`;
    s += `<line class="guia" id="g-l" y1="${G.t}" y2="${G.h - G.b}" x1="${X(anos)}" x2="${X(anos)}"/><circle class="pto" id="g-p" r="5" cx="${X(anos)}" cy="${Y(datos[anos].med)}"/>`;
    $('#graf').innerHTML = s;
    marca = { X, Y, anos };
    lee(anos);
  }
  function lee(y) {
    const d = datos[y];
    $('#r-ano').textContent = y === 0 ? L('Hoy, si va mal', 'Today, if it goes badly') : L(`En ${y} ${y === 1 ? 'año' : 'años'}, si va mal`, `In ${y} ${y === 1 ? 'year' : 'years'}, if it goes badly`);
    $('#v-mal').textContent = eur(d.mal); $('#v-med').textContent = eur(d.med); $('#v-bien').textContent = eur(d.bien); $('#v-apo').textContent = eur(d.apo);
    const l = $('#g-l'), c = $('#g-p');
    if (l) { const x = marca.X(y); l.setAttribute('x1', x); l.setAttribute('x2', x); c.setAttribute('cx', x); c.setAttribute('cy', marca.Y(d.med)); }
  }
  const graf = $('#graf');
  graf.addEventListener('pointermove', (e) => {
    if (!marca) return;
    const r = graf.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * G.w;
    lee(Math.max(0, Math.min(marca.anos, Math.round((x - G.l) / (G.w - G.l - G.r) * marca.anos))));
  });
  graf.addEventListener('pointerleave', () => marca && lee(marca.anos));
  Object.values(R).forEach((i) => i.addEventListener('input', () => dibujaGrafica()));
  $$('.perfiles button').forEach((b) => b.addEventListener('click', () => {
    perf = { r: +b.dataset.r, v: +b.dataset.v };
    $$('.perfiles button').forEach((x) => x.setAttribute('aria-pressed', x === b));
    dibujaGrafica();
  }));

  /* ================= asistente ================= */
  const QA = () => [
    [L('¿Por qué baja hoy mi cartera?', 'Why is my portfolio down today?'),
      L(`Hoy baja un 1,2${NB}%, unos ${eur(580)}. Casi todo viene del ETF de tecnología de EE. UU. (−2,4${NB}%), después del dato de inflación. Los fondos de renta fija apenas se mueven. Con esto, la tecnología queda en el 34${NB}% de la cartera, por encima del 30${NB}% que te marcaste.`,
        `It’s down 1.2% today, about ${eur(580)}. Almost all of it comes from the US tech ETF (−2.4%), after the inflation figure. The bond funds barely move. With this, tech is now 34% of the portfolio, above the 30% you set yourself.`)],
    [L('¿Cuánto pagaré a Hacienda este año?', 'How much tax will I pay this year?'),
      L(`Con lo que has cerrado este año llevas ${eur(900)} de saldo de ganancias y ${eur(180)} de dividendos. Te saldrían ${eur(205.2, 2)} y ya te han retenido ${eur(34.2, 2)}, así que quedarían ${eur(171)} para junio. Si cierras algo más antes del 31 de diciembre, lo recalculo.`,
        `With what you’ve closed this year you have ${eur(900)} of net gains and ${eur(180)} of dividends. That comes to ${eur(205.2, 2)} and ${eur(34.2, 2)} has already been withheld, so ${eur(171)} would be left for June. If you close anything else before 31 December, I’ll recalculate.`)],
    [L('¿Voy bien para mi meta?', 'Am I on track for my goal?'),
      L(`Tu meta es llegar a ${eur(60000)} en 2035. Con lo que tienes y ${eur(300)} al mes, en un caso normal llegarías a unos ${eur(63000)}; si las cosas van mal, a unos ${eur(49000)}. ¿Sigues pudiendo aportar ${eur(300)} al mes o ha cambiado algo?`,
        `Your goal is ${eur(60000)} by 2035. With what you have and ${eur(300)} a month, in a normal case you’d reach about ${eur(63000)}; if things go badly, about ${eur(49000)}. Can you still put in ${eur(300)} a month, or has something changed?`)]
  ];
  let preguntaActual = 0, escribe = 0;
  function ponPregunta(i, animar) {
    preguntaActual = i;
    const qa = QA();
    $$('.preguntas button').forEach((b, k) => { b.textContent = qa[k][0]; b.setAttribute('aria-pressed', k === i); });
    const [q, a] = qa[i];
    $('#preg').textContent = q;
    const resp = $('#resp');
    clearInterval(escribe);
    resp.removeAttribute('aria-busy');
    if (!animar || reducir) { resp.textContent = a; return; }
    const pal = a.split(' ');
    let n = 0;
    resp.setAttribute('aria-busy', 'true');
    resp.innerHTML = '<span class="cursor"></span>';
    escribe = setInterval(() => {
      n += 1;
      resp.innerHTML = pal.slice(0, n).join(' ') + (n < pal.length ? '<span class="cursor"></span>' : '');
      if (n >= pal.length) { clearInterval(escribe); resp.removeAttribute('aria-busy'); }
    }, 36);
  }
  $$('.preguntas button').forEach((b) => b.addEventListener('click', () => ponPregunta(+b.dataset.q, true)));

  /* ================= la IA: seis factores ================= */
  const FACT = [
    { k: 'negocio', n: ['Negocio', 'Business'], s: '+', p: 3, pl: ['Meses', 'Months'], f: 3,
      mira: ['Resultados, ventas, márgenes, deuda, previsiones, dividendos, contratos, directivos y compras de empresas.', 'Results, sales, margins, debt, guidance, dividends, contracts, management and acquisitions.'],
      lee: ['Resultados por encima de lo esperado y previsión de ventas al alza para el próximo trimestre.', 'Results above expectations and sales guidance raised for next quarter.'] },
    { k: 'sector', n: ['Sector', 'Sector'], s: '+', p: 2, pl: ['Meses', 'Months'], f: 4,
      mira: ['Lo que les pasa a su sector y a sus competidores, y los precios de lo que vende o de lo que compra.', 'What is happening to its sector and competitors, and the prices of what it sells or buys.'],
      lee: ['La demanda de los centros de datos sigue tirando de todo el sector.', 'Data-centre demand keeps pulling the whole sector up.'] },
    { k: 'macro', n: ['Economía', 'Economy'], s: '±', p: 1, pl: ['Días o semanas', 'Days or weeks'], f: 2,
      mira: ['Tipos de interés, inflación, divisa, materias primas y cómo va la economía de sus países.', 'Interest rates, inflation, currency, commodities and how its countries’ economies are doing.'],
      lee: ['El dólar fuerte resta algo a las ventas de fuera de EE. UU.; los tipos, sin cambios.', 'A strong dollar trims sales outside the US; rates unchanged.'] },
    { k: 'politico', n: ['Política y leyes', 'Politics and rules'], s: '-', p: 2, pl: ['Meses', 'Months'], f: 5,
      mira: ['Aranceles, sanciones, elecciones, leyes, impuestos, multas, reguladores y juicios.', 'Tariffs, sanctions, elections, laws, taxes, fines, regulators and lawsuits.'],
      lee: ['Nuevas restricciones a la exportación de chips a algunos países.', 'New restrictions on exporting chips to some countries.'] },
    { k: 'social', n: ['Sociedad', 'Society'], s: '=', p: 1, pl: ['Años', 'Years'], f: 2,
      mira: ['Huelgas, boicots, quejas de clientes, reputación, hábitos de consumo y medio ambiente.', 'Strikes, boycotts, customer complaints, reputation, consumer habits and the environment.'],
      lee: ['Críticas por el consumo de agua de sus fábricas, sin efecto en las ventas por ahora.', 'Criticism over its factories’ water use, with no effect on sales so far.'] },
    { k: 'mercado', n: ['Mercado', 'Market'], s: '+', p: 2, pl: ['Días o semanas', 'Days or weeks'], f: 3,
      mira: ['Cambios de recomendación o de precio objetivo de los analistas, entradas y salidas de índices, grandes accionistas y la cotización.', 'Analyst rating or target-price changes, index additions and removals, large shareholders and the share price.'],
      lee: ['Tres analistas suben su precio objetivo esta semana.', 'Three analysts raise their target price this week.'] }
  ];
  const SIGNO_TXT = { '+': ['A favor', 'Positive'], '-': ['En contra', 'Negative'], '=': ['Neutra', 'Neutral'], '±': ['Mixta', 'Mixed'] };
  const PESO_TXT = ['', ['Poco', 'Minor'], ['Importante', 'Important'], ['Cambia la tesis', 'Changes the thesis']];
  let facSel = 0, facToque = false;
  function pintaRadial() {
    const cx = 260, cy = 240, R = 178;
    let rayos = '', nodos = '';
    FACT.forEach((f, i) => {
      const a = (-90 + i * 60) * Math.PI / 180, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
      const rot = Math.atan2(cy - y, cx - x) * 180 / Math.PI;
      const ny = y + (Math.sin(a) >= -0.1 ? 56 : -46);
      rayos += `<line class="rayo" x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${cx}" y2="${cy}"/>
        <g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})"><circle class="flujo" style="--d:${(i * 0.43).toFixed(2)}s" cx="38" r="3.2"/><circle class="flujo" style="--d:${(i * 0.43 + 1.3).toFixed(2)}s" cx="38" r="2.4"/></g>`;
      nodos += `<g class="nodo${i === facSel ? ' sel' : ''}" data-f="${i}" tabindex="0" role="button" aria-pressed="${i === facSel}" aria-label="${L(f.n[0], f.n[1])}: ${L(...SIGNO_TXT[f.s])}">
        <circle class="aro" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="34"/>
        <text class="ic ${SG[f.s][1]}" x="${x.toFixed(1)}" y="${y.toFixed(1)}">${SG[f.s][0]}</text>
        <text class="nom" x="${x.toFixed(1)}" y="${ny.toFixed(1)}">${L(f.n[0], f.n[1])}</text></g>`;
    });
    $('#radial').innerHTML = rayos + `<g class="centro"><rect x="${cx - 86}" y="${cy - 34}" width="172" height="68" rx="14"/><text x="${cx}" y="${cy - 2}" text-anchor="middle">${L('Fabricante de chips', 'Chipmaker')}</text><text class="peq" x="${cx}" y="${cy + 18}" text-anchor="middle">${L('EE. UU. · ejemplo', 'US · example')}</text></g>` + nodos;
    $$('#radial .nodo').forEach((n) => {
      const elige = () => { facToque = true; ponFactor(+n.dataset.f); };
      n.addEventListener('click', elige);
      n.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elige(); } });
    });
    $('#fac-tabs').innerHTML = FACT.map((f, i) => `<button type="button" data-f="${i}" aria-pressed="${i === facSel}">${L(f.n[0], f.n[1])}</button>`).join('');
    $$('#fac-tabs button').forEach((b) => b.addEventListener('click', () => { facToque = true; ponFactor(+b.dataset.f); }));
    pintaFactor();
  }
  function pintaFactor() {
    const f = FACT[facSel];
    $('#fac-det').innerHTML = `<div class="anim"><div class="fd-cab"><h4>${L(f.n[0], f.n[1])}</h4><span class="ejemplo">${L('Ejemplo', 'Example')}</span></div>
      <p class="mira"><b>${L('Qué mira: ', 'What it looks at: ')}</b>${L(f.mira[0], f.mira[1])}</p>
      <p class="lect">${L(f.lee[0], f.lee[1])}</p>
      <dl><div><dt>${L('Signo', 'Sign')}</dt><dd>${sg(f.s)} ${L(...SIGNO_TXT[f.s])}</dd></div>
      <div><dt>${L('Peso', 'Weight')}</dt><dd>${pesos(f.p)} ${L(...PESO_TXT[f.p])}</dd></div>
      <div><dt>${L('Pesa a', 'Matters over')}</dt><dd>${L(f.pl[0], f.pl[1])}</dd></div></dl>
      <p class="mira" style="margin:16px 0 0">${L(`Sale de ${f.f} noticias de esta semana, cada una con su fuente.`, `Drawn from ${f.f} articles this week, each with its source.`)}</p></div>`;
  }
  function ponFactor(i) {
    facSel = (i + FACT.length) % FACT.length;
    $$('#radial .nodo').forEach((n, k) => { n.classList.toggle('sel', k === facSel); n.setAttribute('aria-pressed', k === facSel); });
    $$('#fac-tabs button').forEach((b, k) => b.setAttribute('aria-pressed', k === facSel));
    pintaFactor();
  }
  if (!reducir) setInterval(() => {
    if (facToque || document.hidden) return;
    const r = $('#radial').getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) ponFactor(facSel + 1);
  }, 4200);

  /* ================= la IA: noticias que llegan ================= */
  const NOT = [
    [['Fabricante de chips · EE. UU.', 'Chipmaker · US'], ['Sube su previsión de ventas para el trimestre', 'Raises its sales guidance for the quarter'], 0, '+', 3, ['Cambia la tesis: venderá más de lo que esperaba el mercado.', 'Changes the thesis: it will sell more than the market expected.']],
    [['Banco · España', 'Bank · Spain'], ['El BCE mantiene los tipos de interés', 'The ECB holds interest rates'], 2, '=', 2, ['Lo esperado. El margen de los bancos sigue igual.', 'As expected. Bank margins stay the same.']],
    [['Aseguradora · Alemania', 'Insurer · Germany'], ['Tres analistas suben su precio objetivo', 'Three analysts raise their target price'], 5, '+', 2, ['Mejora la opinión del mercado; los números acompañan.', 'Market opinion improves; the numbers back it up.']],
    [['Fabricante de coches · Alemania', 'Carmaker · Germany'], ['Nuevos aranceles a los coches importados en EE. UU.', 'New US tariffs on imported cars'], 3, '-', 3, ['Le toca de lleno: EE. UU. es uno de sus mayores mercados.', 'Hits it hard: the US is one of its biggest markets.']],
    [['Cadena de moda · España', 'Fashion retailer · Spain'], ['Huelga en sus centros logísticos', 'Strike at its logistics centres'], 4, '-', 1, ['Molesta, pero de momento no cambia las ventas del trimestre.', 'A nuisance, but it doesn’t change quarterly sales so far.']],
    [['Eléctrica · España', 'Utility · Spain'], ['La demanda de electricidad bate su récord de octubre', 'Power demand hits an October record'], 1, '+', 1, ['Bueno para todo el sector, sin sorpresas.', 'Good for the whole sector, no surprises.']]
  ];
  const HACE = () => [L('Ahora', 'Now'), L('hace 4 min', '4 min ago'), L('hace 11 min', '11 min ago'), L('hace 19 min', '19 min ago')];
  let feedIni = 0;
  function pintaFeed(nueva) {
    const h = HACE();
    $('#feed').innerHTML = [0, 1, 2, 3].map((k) => {
      const [emp, tt, fi, s, p, lee] = NOT[(feedIni + k) % NOT.length];
      const f = FACT[fi];
      return `<li class="nt${nueva && k === 0 ? ' nueva' : ''}"><div class="meta"><b>${L(emp[0], emp[1])}</b><span>${h[k]}</span></div>
        <h4>${L(tt[0], tt[1])}</h4><span class="chip-f">${sg(s)} ${L(f.n[0], f.n[1])} ${pesos(p)}</span>
        <p class="lee">${L(lee[0], lee[1])}</p></li>`;
    }).join('');
  }
  if (!reducir) setInterval(() => {
    if (document.hidden) return;
    const r = $('#feed').getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    feedIni = (feedIni + NOT.length - 1) % NOT.length;
    pintaFeed(true);
  }, 4000);

  /* ================= analistas e ideas ================= */
  function pintaIdea() {
    const fs = [['+', 'Neg', 'Bus'], ['+', 'Sec', 'Sec'], ['±', 'Eco', 'Eco'], ['=', 'Pol', 'Pol'], ['=', 'Soc', 'Soc'], ['+', 'Mer', 'Mkt']];
    const vista = $('#idea').classList.contains('vista') ? ' vista' : '';
    $('#idea').className = 'idea' + vista;
    $('#idea').innerHTML = `<div class="fd-cab"><span class="k" style="margin:0">${L('Idea del día', 'Idea of the day')}</span><span class="ejemplo">${L('Ejemplo', 'Example')}</span></div>
      <h4>${L('Aseguradora', 'Insurer')}</h4><p class="sub2">${L('Alemania · Seguros', 'Germany · Insurance')}</p>
      <div class="votos" role="img" aria-label="${L('14 analistas positivos, 6 neutrales, ninguno negativo', '14 analysts positive, 6 neutral, none negative')}"><i style="--i:0;flex:14;background:var(--sube)"></i><i style="--i:1;flex:6;background:var(--txt2);opacity:.45"></i></div>
      <div class="votos-ley"><span>${L('14 positivos', '14 positive')}</span><span>${L('6 neutrales', '6 neutral')}</span><span>${L('0 negativos', '0 negative')}</span></div>
      <div class="obj"><div><small>${L('Precio objetivo medio', 'Average target price')}</small><b class="sube">${pct(9, 0)}</b></div><div><small>${L('Factores a favor', 'Factors in favour')}</small><b>${L('3 de 6', '3 of 6')}</b></div></div>
      <div class="facs">${fs.map(([s, es, en]) => `<span>${sg(s)}${L(es, en)}</span>`).join('')}</div>
      <p class="porque"><b>${L('Por qué: ', 'Why: ')}</b>${L('buenos resultados, prensa a favor y analistas que suben el objetivo. A vigilar: los tipos de interés.', 'solid results, supportive press and analysts raising their targets. To watch: interest rates.')}</p>
      <p class="const">${L('Las ideas no cambian de un día para otro: solo si llega una noticia que cambie la tesis o se rompen sus números, y cada cambio queda apuntado con su motivo. Decides tú.', 'Ideas don’t change from one day to the next: only if news changes the thesis or the numbers break, and every change is logged with its reason. You decide.')}</p>`;
  }

  /* ================= el mapa ================= */
  // país: [índice, hoy, 1 mes, en el año] (ejemplo)
  const BOLSAS = { US: ['S&P 500', -0.3, 1.8, 14.2], ES: ['Ibex 35', 0.6, 3.1, 21.5], DE: ['DAX', 0.4, 2.2, 16.8], FR: ['CAC 40', 0.2, -0.9, 6.1], GB: ['FTSE 100', -0.1, 0.7, 8.7], JP: ['Nikkei 225', 1.1, 4.0, 11.9], CN: ['Shanghai', -0.8, -2.4, 7.4], HK: ['Hang Seng', -1.2, -3.1, 17.6], IN: ['Nifty 50', 0.5, 1.2, 4.8], BR: ['Bovespa', 0.9, 2.6, -3.2] };
  const COL = { hoy: 1, mes: 2, anio: 3 };
  const TOPE = { hoy: 1.2, mes: 4, anio: 20 };
  const TUYO = { US: 48, ES: 14, DE: 6, FR: 5, JP: 5, GB: 4, CH: 3, NL: 3, CN: 3, IN: 2, TW: 2, CA: 2, KR: 1.5, AU: 1.5 };
  const TOTAL = 48215.3;
  const VIA = {
    US: [[['ETF de EE. UU.', 'US ETF'], 0.53], [['Fondo indexado mundial', 'Global index fund'], 0.47]],
    ES: [[['Acciones españolas', 'Spanish shares'], 0.62], [['Fondo de renta fija', 'Bond fund'], 0.38]],
    DE: [[['Fondo indexado mundial', 'Global index fund'], 0.6], [['Fondo de renta fija', 'Bond fund'], 0.4]],
    FR: [[['Fondo indexado mundial', 'Global index fund'], 0.6], [['Fondo de renta fija', 'Bond fund'], 0.4]],
    CN: [[['Fondo de emergentes', 'Emerging markets fund'], 0.7], [['Fondo indexado mundial', 'Global index fund'], 0.3]],
    IN: [[['Fondo de emergentes', 'Emerging markets fund'], 0.75], [['Fondo indexado mundial', 'Global index fund'], 0.25]],
    TW: [[['Fondo de emergentes', 'Emerging markets fund'], 0.7], [['Fondo indexado mundial', 'Global index fund'], 0.3]],
    KR: [[['Fondo de emergentes', 'Emerging markets fund'], 0.7], [['Fondo indexado mundial', 'Global index fund'], 0.3]]
  };
  const ZONAS = { mundo: [0, 0, 1000, 439], am: [8, 40, 600, 263], eu: [387, 31, 290, 127], as: [569, 102, 430, 189] };
  let geo = null, modo = 'hoy', vb = ZONAS.mundo.slice(), paisSel = 'ES';
  const BASE = 'color-mix(in srgb, var(--txt) 15%, var(--surf))';
  function colorPais(c, m, v) {
    if (m === 'tuyo') { const t = TUYO[c]; return t ? `color-mix(in srgb, var(--graf) ${Math.round(18 + 82 * Math.sqrt(t / 48))}%, ${v || BASE})` : (v || BASE); }
    const b = BOLSAS[c]; if (!b) return v || BASE;
    const x = b[COL[m]], k = Math.round(35 + 65 * Math.min(1, Math.abs(x) / TOPE[m]));
    return `color-mix(in srgb, var(${x >= 0 ? '--sube' : '--baja'}) ${k}%, ${v || BASE})`;
  }
  const nomPais = (c) => (c === 'US' ? L('EE. UU.', 'United States') : geo && geo.n[c] ? L(geo.n[c][0], geo.n[c][1]) : c);
  async function cargaMapa() {
    try { const r = await fetch('mapa-mundo.json'); geo = await r.json(); } catch (e) { geo = null; }
    if (!geo) { $('.mapa-g').hidden = true; return; }
    $('#mapa').innerHTML = Object.entries(geo.mundo).map(([c, d]) => `<path data-c="${c}" class="${BOLSAS[c] || TUYO[c] ? 'con' : ''}" d="${d}"/>`).join('');
    const base = 'color-mix(in srgb, var(--a-txt) 14%, var(--a-surf))';
    const mini = Object.entries(geo.mundo).map(([c, d]) => `<path d="${d}" style="fill:${colorPais(c, 'hoy', base).replace('--sube', '--a-sube').replace('--baja', '--a-baja')}"/>`).join('');
    $('#defs-mapa').innerHTML = `<g id="mini-mundo" style="stroke:var(--a-surf);stroke-width:.8">${mini}</g>`;
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
    caja.addEventListener('click', (e) => { const p = e.target.closest('path'); if (p) { paisSel = p.dataset.c; tip.hidden = true; pintaMapa(); } });
    pintaMoviles();
  }
  function pintaFicha() {
    const c = paisSel, b = BOLSAS[c], t = TUYO[c];
    const celda = (x) => `<td class="${x >= 0 ? 'sube' : 'baja'}">${pct(x)}</td>`;
    const tabla = b ? `<table><thead><tr><th scope="col">${L('Índice', 'Index')}</th><th scope="col">${L('Hoy', 'Today')}</th><th scope="col">${L('1 mes', '1 mo')}</th><th scope="col">${L('Año', 'YTD')}</th></tr></thead><tbody><tr><th scope="row" style="font-weight:600">${b[0].replace(' ', '\u00a0')}</th>${celda(b[1])}${celda(b[2])}${celda(b[3])}</tr></tbody></table>` : `<p class="nota-p" style="margin:0">${L('No seguimos su bolsa.', 'We don’t track its stock market.')}</p>`;
    const via = (VIA[c] || [[['Fondo indexado mundial', 'Global index fund'], 1]]);
    const tuyo = t ? `<div class="tuyo"><small>${L('Tu dinero aquí', 'Your money here')}</small><b class="num">${eur(TOTAL * t / 100)}</b> <span style="color:var(--txt2);font-size:13px">· ${fmt(t, t % 1 ? 1 : 0)}${L(NB + '% de tu cartera', '% of your portfolio')}</span>
      <ul>${via.map(([n, f]) => `<li><span>${L(n[0], n[1])}</span><b class="num">${eur(TOTAL * t / 100 * f)}</b></li>`).join('')}</ul></div>` : `<div class="tuyo"><small>${L('Tu dinero aquí', 'Your money here')}</small><b>${L('Nada', 'None')}</b></div>`;
    $('#ficha-p').innerHTML = `<div class="anim"><div style="display:flex;justify-content:space-between;align-items:center"><span class="k" style="margin:0">${L('Ficha del país', 'Country profile')}</span><span class="ejemplo">${L('Ejemplo', 'Example')}</span></div>
      <h4 style="margin-top:10px">${nomPais(c)}</h4><p class="sub2">${b ? L('Bolsa principal: ', 'Main index: ') + b[0] : L('Sin bolsa seguida', 'No tracked market')}</p>${tabla}${tuyo}
      <p class="nota-p">${L('Lo que tienes en fondos se reparte por países como sus índices. Toca otro país del mapa.', 'What you hold in funds is split by country like their indices. Tap another country on the map.')}</p></div>`;
  }
  function pintaMapa() {
    if (!geo) return;
    $$('#mapa path').forEach((p) => { p.style.fill = colorPais(p.dataset.c, modo); p.classList.toggle('foco', p.dataset.c === paisSel); });
    const esc = $('#escala');
    if (modo === 'tuyo') esc.innerHTML = `<span>0${L(NB + '%', '%')}</span><i style="background:linear-gradient(90deg, ${BASE}, var(--graf))"></i><span>48${L(NB + '%', '%')}</span>`;
    else { const t = TOPE[modo], d = modo === 'hoy' ? 1 : 0; esc.innerHTML = `<span>${pct(-t, d)}</span><i style="background:linear-gradient(90deg, var(--baja), ${BASE}, var(--sube))"></i><span>${pct(t, d)}</span>`; }
    const lista = modo === 'tuyo'
      ? Object.entries(TUYO).slice(0, 5).map(([c, t]) => [c, `${fmt(t, 0)}${L(NB + '%', '%')}`, '', ''])
      : Object.entries(BOLSAS).sort((a, b) => Math.abs(b[1][COL[modo]]) - Math.abs(a[1][COL[modo]])).slice(0, 5).map(([c, b]) => [c, flecha(b[COL[modo]]), b[COL[modo]] >= 0 ? 'sube' : 'baja', b[0]]);
    $('#mapa-lista').innerHTML = lista.map(([c, v, cls, idx]) => `<li><button type="button" data-c="${c}" style="all:unset;cursor:pointer;display:block;width:100%">${nomPais(c)}${idx ? ' · ' + idx : ''}<b class="num ${cls}">${v}</b></button></li>`).join('');
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

  /* ================= temas ================= */
  const TEMAS = [
    [['Bancos centrales', 'Central banks'], 'macro', '=', ['El BCE mantiene los tipos de interés', 'The ECB holds interest rates'], ['Lo esperado: no cambia el margen de los bancos ni lo que pagan las hipotecas.', 'As expected: bank margins and mortgage costs don’t change.'], [['Zona euro', 'Eurozone'], ['Bancos', 'Banks'], ['Aseguradoras', 'Insurers']]],
    [['Aranceles', 'Tariffs'], 'politico', '-', ['EE. UU. anuncia aranceles a los coches importados', 'The US announces tariffs on imported cars'], ['Encarece vender coches en uno de los mayores mercados del mundo.', 'Makes selling cars in one of the world’s biggest markets more expensive.'], [['Europa', 'Europe'], ['Japón', 'Japan'], ['Coches', 'Cars'], ['Piezas', 'Parts']]],
    [['Elecciones', 'Elections'], 'politico', '±', ['Elecciones generales en un país de la UE', 'General election in an EU country'], ['Hasta que haya gobierno, más dudas para los sectores que dependen de leyes y licencias.', 'Until there’s a government, more doubt for sectors that depend on laws and licences.'], [['Ese país', 'That country'], ['Bancos', 'Banks'], ['Eléctricas', 'Utilities']]]
  ];
  function pintaTemas() {
    $('#temas').innerHTML = TEMAS.map(([n, fk, s, tt, txt, toca], i) => {
      const f = FACT.find((x) => x.k === fk);
      return `<div class="tema" data-r style="--d:${i * 0.1}s"><p class="k">${L(n[0], n[1])}</p><h4>${L(tt[0], tt[1])}</h4>
        <p>${L(txt[0], txt[1])}</p><p style="margin:0 0 10px;font-size:13px">${sg(s)} ${L(f.n[0], f.n[1])} · ${L(...SIGNO_TXT[s]).toLowerCase()}</p>
        <div class="toca"><span style="background:none;padding-left:0;color:var(--txt2);font-weight:500">${L('Toca a:', 'Affects:')}</span>${toca.map((t) => `<span>${L(t[0], t[1])}</span>`).join('')}</div></div>`;
    }).join('');
  }

  /* ================= así lee una noticia ================= */
  const LECT = [
    [['Fabricante de chips · EE. UU.', 'Chipmaker · US'], ['Sube su previsión de ventas para el trimestre', 'Raises its sales guidance for the quarter'],
      ['Espera vender un 8' + NB + '% más de lo que dijo hace tres meses.', 'It expects to sell 8% more than it said three months ago.'], '+', ['Bueno, para la empresa y para sus proveedores.', 'Good, for the company and its suppliers.'], 3, ['Presenta resultados el jueves 19.', 'Reports results on Thursday the 19th.'], 'negocio', ['Meses', 'Months']],
    [['Fabricante de coches · Alemania', 'Carmaker · Germany'], ['EE. UU. anuncia aranceles a los coches importados', 'The US announces tariffs on imported cars'],
      ['Un 25' + NB + '% a los coches que lleguen de fuera desde enero.', 'A 25% tariff on cars arriving from abroad from January.'], '-', ['Malo: EE. UU. es uno de sus mayores mercados.', 'Bad: the US is one of its biggest markets.'], 2, ['Entra en vigor el 1 de enero.', 'Takes effect on 1 January.'], 'politico', ['Meses', 'Months']],
    [['Cadena de moda · España', 'Fashion retailer · Spain'], ['Huelga en sus centros logísticos', 'Strike at its logistics centres'],
      ['Tres días de paros en dos almacenes, en plena campaña de Navidad.', 'Three days of stoppages at two warehouses, in the middle of the Christmas season.'], '-', ['Malo, pero pequeño.', 'Bad, but small.'], 1, ['Nada a la vista.', 'Nothing in sight.'], 'social', ['Días o semanas', 'Days or weeks']]
  ];
  let lectSel = 0;
  function pintaLectura(animar) {
    $('#titulares').innerHTML = LECT.map((x, i) => `<button type="button" data-i="${i}" aria-pressed="${i === lectSel}"><small>${L(x[0][0], x[0][1])}</small><b>${L(x[1][0], x[1][1])}</b></button>`).join('');
    $$('#titulares button').forEach((b) => b.addEventListener('click', () => { lectSel = +b.dataset.i; pintaLectura(true); }));
    const x = LECT[lectSel], f = FACT.find((q) => q.k === x[7]);
    const el = $('#lectura');
    el.classList.remove('lista');
    el.innerHTML = `<div class="fd-cab" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span class="k" style="margin:0">${L('Lectura de la IA', 'The AI’s reading')}</span><span class="ejemplo">${L('Ejemplo', 'Example')}</span></div>
      <h4>${L(x[1][0], x[1][1])}</h4><ol>
      <li style="--i:0"><small>${L('Qué ha pasado', 'What happened')}</small><span>${L(x[2][0], x[2][1])}</span></li>
      <li style="--i:1"><small>${L('¿Bueno o malo?', 'Good or bad?')}</small><span>${sg(x[3])} ${L(x[4][0], x[4][1])}</span></li>
      <li style="--i:2"><small>${L('¿Cuánto importa?', 'How much?')}</small><span>${pesos(x[5])} ${L(...PESO_TXT[x[5]])}</span></li>
      <li style="--i:3"><small>${L('¿Algo con fecha?', 'Anything dated?')}</small><span>${L(x[6][0], x[6][1])}</span></li>
      <li style="--i:4"><small>${L('Dónde va', 'Where it goes')}</small><span>${L(f.n[0], f.n[1])} · ${L('pesa a', 'over')} ${L(x[8][0], x[8][1]).toLowerCase()}</span></li></ol>`;
    if (!animar || reducir) el.classList.add('lista');
    else { void el.offsetWidth; requestAnimationFrame(() => el.classList.add('lista')); }
  }
  function pintaInforme() {
    $('#informe').innerHTML = `<div class="fd-cab"><b>${L('Informe de las 12:00', '12:00 report')}</b><span class="ejemplo">${L('Ejemplo', 'Example')}</span></div>
      <div class="informe-g"><div><small>${L('Qué ha pasado', 'What happened')}</small>${L('Las bolsas europeas suben; la tecnología de EE. UU. corrige tras el dato de inflación.', 'European markets rise; US tech pulls back after the inflation figure.')}</div>
      <div><small>${L('En qué coinciden', 'Where sources agree')}</small>${L('Cuatro medios ven el dato de inflación peor de lo esperado.', 'Four outlets see the inflation figure as worse than expected.')}</div>
      <div><small>${L('Qué vigilar', 'What to watch')}</small>${L('Los resultados del fabricante de chips del jueves y la próxima reunión del BCE.', 'The chipmaker’s results on Thursday and the next ECB meeting.')}</div></div>`;
  }

  /* ================= renta por tramos ================= */
  const TRAMOS = [[6000, 0.19], [50000, 0.21], [200000, 0.23], [300000, 0.27], [Infinity, 0.30]];
  function pintaTramos() {
    const g = +$('#r-gan').value;
    $('#o-gan').textContent = eur(g);
    let desde = 0, tot = 0, filas = '';
    TRAMOS.forEach(([hasta, t]) => {
      const tam = (hasta === Infinity ? 100000 : hasta - desde), dentro = Math.max(0, Math.min(g, hasta) - desde), c = dentro * t;
      tot += c;
      const et = hasta === Infinity ? L(`Más de ${eur(desde)}`, `Over ${eur(desde)}`) : L(`Hasta ${eur(hasta)}`, `Up to ${eur(hasta)}`);
      filas += `<div class="barra-t"><span>${et} · <b>${fmt(t * 100)}${L(NB + '%', '%')}</b></span><span class="pista"><i style="transform:scaleX(${Math.min(1, dentro / tam).toFixed(3)})"></i></span><span class="num">${eur(c, 0)}</span></div>`;
      desde = hasta;
    });
    $('#barras-t').innerHTML = filas;
    $('#t-tot').textContent = eur(tot);
    $('#t-tipo').textContent = g ? L(`Tipo medio: ${fmt(tot / g * 100, 1)}${NB}%. Escala estatal de 2026, igual en todo el territorio común.`, `Average rate: ${fmt(tot / g * 100, 1)}%. 2026 state scale, the same across the common territory.`) : '';
  }
  $('#r-gan').addEventListener('input', pintaTramos);

  /* ================= índice lateral ================= */
  const INDICE = [['inicio', 'Inicio', 'Home'], ['como', 'Cómo es', 'Inside'], ['ia', 'La IA', 'The AI'], ['mundo', 'El mundo', 'The world'], ['nombre', 'El nombre', 'The name'], ['renta', 'Renta', 'Taxes'], ['futuro', 'Futuro', 'Future'], ['asistente', 'Asistente', 'Assistant'], ['privacidad', 'Privacidad', 'Privacy'], ['preguntas', 'Preguntas', 'Questions']];
  let indiceAct = -1;
  function pintaIndice() {
    $('#indice').innerHTML = '<li class="lleno" aria-hidden="true"></li>' + INDICE.map(([id, es, en], i) => `<li><a href="#${id}"><i aria-hidden="true"></i><span><em>${String(i + 1).padStart(2, '0')}</em>${L(es, en)}</span></a></li>`).join('');
    $$('#indice a').forEach((a) => a.addEventListener('click', () => cierraMenu()));
    indiceAct = -1;
    actualizaIndice();
  }
  function actualizaIndice() {
    const secs = INDICE.map(([id]) => document.getElementById(id));
    const linea = innerHeight * 0.4;
    let act = 0;
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= linea) act = i; });
    const s = secs[act], r = s.getBoundingClientRect();
    const dentro = Math.max(0, Math.min(1, (linea - r.top) / (r.height || 1)));
    const lis = $$('#indice li:not(.lleno)');
    $('#indice .lleno').style.transform = `scaleY(${((act + dentro) / (lis.length - 1)).toFixed(4)})`;
    const max = document.documentElement.scrollHeight - innerHeight;
    $('#ind-pct').textContent = max > 0 ? Math.round(scrollY / max * 100) : 0;
    if (act === indiceAct) return;
    indiceAct = act;
    lis.forEach((li, i) => { li.classList.toggle('act', i === act); li.classList.toggle('pasado', i < act); const a = $('a', li); if (i === act) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }

  const menuBtn = $('#menu-btn'), nIndice = $('#indice-nav');
  function cierraMenu() { nIndice.classList.remove('abierto'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', (e) => { e.stopPropagation(); const ab = !nIndice.classList.contains('abierto'); nIndice.classList.toggle('abierto', ab); menuBtn.setAttribute('aria-expanded', ab); if (ab) { const a = $('#indice li.act a') || $('#indice a'); a && a.focus(); } });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && nIndice.classList.contains('abierto')) { cierraMenu(); menuBtn.focus(); } });
  addEventListener('click', (e) => { if (nIndice.classList.contains('abierto') && !nIndice.contains(e.target)) cierraMenu(); });

  /* ================= qué paso o capítulo toca: cuando su título pasa del 60 % de la pantalla ================= */
  function quePaso(sel, tit) {
    const lim = innerHeight * 0.6;
    let k = 0;
    $$(sel).forEach((el, i) => { const h = $(tit, el); if (h && h.getBoundingClientRect().top < lim) k = i; });
    return k;
  }

  /* ================= perfil e idioma ================= */
  $$('.perfil button').forEach((b) => b.addEventListener('click', () => {
    html.dataset.perfil = b.dataset.perfil;
    $$('.perfil button').forEach((x) => x.setAttribute('aria-pressed', x === b));
    requestAnimationFrame(generaVetas);
  }));
  $$('.idioma button').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.lang === lang) return;
    lang = b.dataset.lang;
    try { localStorage.setItem('toison-lang', lang); } catch (e) {}
    aplicaTextos();
    requestAnimationFrame(generaVetas);
  }));

  /* ================= direcciones ================= */
  const DIRS = ['marmol', 'marfil', 'borgona'];
  function ponDir(d, guardar) {
    if (!DIRS.includes(d)) d = 'marmol';
    html.dataset.dir = d;
    $('meta[name="theme-color"]').content = { marmol: '#151817', marfil: '#faf2e8', borgona: '#4e101d' }[d];
    // Marfil es claro: «only light» le dice al navegador que no lo oscurezca aunque el móvil esté en modo oscuro
    $('meta[name="color-scheme"]').content = d === 'marfil' ? 'only light' : 'dark';
    $$('.estilo button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.dir === d));
    pintaMoviles();
    vetasAlto = 0;
    requestAnimationFrame(generaVetas);
    if (guardar) { try { history.replaceState(null, '', '#' + d); localStorage.setItem('toison-estilo', d); } catch (e) {} }
  }
  $$('.estilo button').forEach((b) => b.addEventListener('click', () => ponDir(b.dataset.dir, true)));
  addEventListener('hashchange', () => { const h = location.hash.slice(1); if (DIRS.includes(h)) ponDir(h); });

  /* ================= desplazamiento ================= */
  const barra = $('.progreso');
  let pend = false;
  function alDesplazar() {
    pend = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    barra.style.transform = `scaleX(${max > 0 ? (scrollY / max).toFixed(4) : 0})`;
    actualizaVetas();
    mueveBarco();
    if (innerWidth > 900) { ponPaso(quePaso('.paso', 'h3')); ponCap(quePaso('.cap', 'h3')); }
    actualizaIndice();
  }
  addEventListener('scroll', () => { if (!pend) { pend = true; requestAnimationFrame(alDesplazar); } }, { passive: true });
  let tRes = 0;
  addEventListener('resize', () => { clearTimeout(tRes); tRes = setTimeout(() => { vetasAlto = 0; generaVetas(); alDesplazar(); }, 200); });

  /* brillo que sigue al ratón (mármol) y tarjetas que flotan (crónica) */
  const brillo = $('.brillo');
  if (fino && !reducir) {
    let raf = 0;
    addEventListener('pointermove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { brillo.classList.add('on'); brillo.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; });
    }, { passive: true });
    const esc = $('#escena');
    esc.addEventListener('pointermove', (e) => {
      const r = esc.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      $$('.flota', esc).forEach((f) => { const p = +f.dataset.prof; f.style.transform = `translate(${x * p}px, ${y * p}px)`; });
    });
    esc.addEventListener('pointerleave', () => $$('.flota', esc).forEach((f) => { f.style.transform = ''; }));
  }

  /* ================= arranque ================= */
  try { const g = localStorage.getItem('toison-lang'); if (g === 'en' || g === 'es') lang = g; else if (/^en\b/i.test(navigator.language || '')) lang = 'en'; } catch (e) {}
  let guardado = null;
  try { guardado = localStorage.getItem('toison-estilo'); } catch (e) {}
  html.dataset.dir = DIRS.includes(location.hash.slice(1)) ? location.hash.slice(1) : DIRS.includes(guardado) ? guardado : 'marmol';
  $$('.estilo button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.dir === html.dataset.dir));
  pintaCadenas();
  aplicaTextos();
  cargaMapa();
  prepara();
  alDesplazar();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { vetasAlto = 0; generaVetas(); });
  addEventListener('load', () => { vetasAlto = 0; generaVetas(); });
})();
