/* RMD AudioLab — ilustrações do conteúdo (SVG original desenhado pelo sistema: nítido em qualquer tamanho, sem direitos de terceiros).
   Cada figura é uma função que devolve o texto SVG (palco 800×450). FIG.<id>() */
"use strict";
const FIG = (function () {
  const C = { bg: "#0b1820", bg2: "#12303d", grade: "#1d3a48", linha: "#3b6277", txt: "#eaf5f9", mudo: "#92b7c6", az: "#49c7ef", ver: "#7fd18b",
    am: "#f2c94c", lar: "#f29a4a", verm: "#ef6b6b", rox: "#b896f2", rosa: "#f08fc0", pele: "#e8c4a0" };
  const FONTE = 'font-family="Segoe UI, Arial, sans-serif"';
  const r1 = (n) => Math.round(n * 10) / 10;
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  function svg(titulo, corpo) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" role="img" aria-label="' + esc(titulo).replace(/"/g, "&quot;") + '" ' + FONTE + ">" +
      '<defs><linearGradient id="alfundo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0e2230"/><stop offset="1" stop-color="#091218"/></linearGradient></defs>' +
      '<rect width="800" height="450" rx="18" fill="url(#alfundo)"/>' + corpo + "</svg>";
  }
  // texto: o = {t: tamanho, c: cor, a: start|middle|end, w: peso, i: itálico, r: rotação}
  function tx(x, y, s, o) {
    o = o || {};
    const linhas = Array.isArray(s) ? s : [s], t = o.t || 20;
    const rot = o.r ? ' transform="rotate(' + o.r + " " + x + " " + y + ')"' : "";
    return '<text x="' + x + '" y="' + y + '" font-size="' + t + '" fill="' + (o.c || C.txt) + '" text-anchor="' + (o.a || "start") + '" font-weight="' + (o.w || 400) + '"' +
      (o.i ? ' font-style="italic"' : "") + rot + ">" + linhas.map((l, i) => '<tspan x="' + x + '" dy="' + (i ? t * 1.22 : 0) + '">' + esc(l) + "</tspan>").join("") + "</text>";
  }
  const rect = (x, y, w, h, o) => { o = o || {}; return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (o.rx === undefined ? 8 : o.rx) + '" fill="' + (o.f || "none") + '"' + (o.s ? ' stroke="' + o.s + '" stroke-width="' + (o.sw || 2) + '"' : "") + (o.op ? ' fill-opacity="' + o.op + '"' : "") + (o.d ? ' stroke-dasharray="' + o.d + '"' : "") + "/>"; };
  const circ = (x, y, r, o) => { o = o || {}; return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + (o.f || "none") + '"' + (o.s ? ' stroke="' + o.s + '" stroke-width="' + (o.sw || 2) + '"' : "") + (o.op ? ' fill-opacity="' + o.op + '"' : "") + "/>"; };
  const lin = (x1, y1, x2, y2, c, w, d) => '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (c || C.linha) + '" stroke-width="' + (w || 2) + '" stroke-linecap="round"' + (d ? ' stroke-dasharray="' + d + '"' : "") + "/>";
  const cam = (d, c, w, o) => { o = o || {}; return '<path d="' + d + '" fill="' + (o.f || "none") + '" stroke="' + (c || C.az) + '" stroke-width="' + (w || 3) + '" stroke-linecap="round" stroke-linejoin="round"' + (o.op ? ' fill-opacity="' + o.op + '"' : "") + (o.d ? ' stroke-dasharray="' + o.d + '"' : "") + "/>"; };
  function seta(x1, y1, x2, y2, c, w) {
    c = c || C.mudo; w = w || 3;
    const a = Math.atan2(y2 - y1, x2 - x1), L = 8 + w * 1.6, b = 0.5;
    const p1 = [x2 - L * Math.cos(a - b), y2 - L * Math.sin(a - b)], p2 = [x2 - L * Math.cos(a + b), y2 - L * Math.sin(a + b)];
    return lin(x1, y1, x2 - L * 0.6 * Math.cos(a), y2 - L * 0.6 * Math.sin(a), c, w) + '<polygon points="' + x2 + "," + y2 + " " + r1(p1[0]) + "," + r1(p1[1]) + " " + r1(p2[0]) + "," + r1(p2[1]) + '" fill="' + c + '"/>';
  }
  // ponta de seta no fim de uma curva (direção dada por dois pontos)
  const ponta = (x, y, ang, c, L) => { L = L || 14; const b = 0.5; return '<polygon points="' + x + "," + y + " " + r1(x - L * Math.cos(ang - b)) + "," + r1(y - L * Math.sin(ang - b)) + " " + r1(x - L * Math.cos(ang + b)) + "," + r1(y - L * Math.sin(ang + b)) + '" fill="' + c + '"/>'; };
  const chip = (x, y, w, h, s, c, t) => rect(x, y, w, h, { rx: h / 2, f: c, op: 0.2, s: c, sw: 2 }) + tx(x + w / 2, y + h / 2 + (t || 18) * 0.35, s, { t: t || 18, a: "middle", w: 600, c: C.txt });
  // onda senoidal como caminho
  function onda(x0, y0, w, amp, ciclos, fase, n) {
    n = n || 160; fase = fase || 0; let d = "";
    for (let i = 0; i <= n; i++) { const x = x0 + w * i / n, y = y0 - amp * Math.sin(2 * Math.PI * ciclos * i / n + fase); d += (i ? "L" : "M") + r1(x) + " " + r1(y); }
    return d;
  }
  // soma de harmônicos [[k, amplitude relativa], ...]
  function ondaH(x0, y0, w, amp, ciclos, harm, n) {
    n = n || 240; let d = "", mx = harm.reduce((s, h) => s + Math.abs(h[1]), 0);
    for (let i = 0; i <= n; i++) { let v = 0; for (const [k, a] of harm) v += a * Math.sin(2 * Math.PI * ciclos * k * i / n); d += (i ? "L" : "M") + r1(x0 + w * i / n) + " " + r1(y0 - amp * v / mx * 1.25); }
    return d;
  }
  const grade = (x, y, w, h, nx, ny) => { let s = ""; for (let i = 0; i <= nx; i++) s += lin(x + w * i / nx, y, x + w * i / nx, y + h, C.grade, 1); for (let j = 0; j <= ny; j++) s += lin(x, y + h * j / ny, x + w, y + h * j / ny, C.grade, 1); return s; };
  // escala logarítmica de frequência 20 Hz–20 kHz → x
  const xf = (f, x0, w) => x0 + w * (Math.log10(f) - Math.log10(20)) / 3;

  // ---------------------------------------------------------------- teclado (usado em vários temas)
  // devolve {s, x(midi) → centro da tecla}; midi 60 = Dó central (C4); c0 = primeira nota (deve ser Dó), oit = nº de oitavas (+1 Dó final se fim=true)
  function teclado(x0, y0, w, h, c0, oit, dest, fim) {
    dest = dest || {};
    const nb = oit * 7 + (fim ? 1 : 0), lw = w / nb, brancas = [0, 2, 4, 5, 7, 9, 11], pretas = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 };
    let s = "", pos = {};
    for (let i = 0; i < nb; i++) {
      const o = Math.floor(i / 7), g = i % 7, m = c0 + o * 12 + brancas[g];
      pos[m] = x0 + lw * (i + 0.5);
      s += rect(x0 + lw * i, y0, lw, h, { rx: 3, f: dest[m] || "#f4f8fa", s: "#27424f", sw: 1.5 });
    }
    for (let o = 0; o < oit + (fim ? 1 : 0); o++) for (const [semi, idx] of Object.entries(pretas)) {
      const i = o * 7 + idx; if (i + 1 >= nb) continue; const m = c0 + o * 12 + Number(semi);
      pos[m] = x0 + lw * (i + 1);
      s += rect(x0 + lw * (i + 1) - lw * 0.3, y0, lw * 0.6, h * 0.62, { rx: 2, f: dest[m] || "#10202a", s: "#0a1217", sw: 1 });
    }
    return { s, x: (m) => pos[m], lw };
  }

  // ---------------------------------------------------------------- pauta (régua de 5 linhas)
  // posição vertical da nota: n = passos diatônicos acima da 1ª linha (Mi4 na clave de sol); espaçamento 10
  function pauta(x, y, w, esp) {
    esp = esp || 10; let s = ""; for (let i = 0; i < 5; i++) s += lin(x, y - i * esp, x + w, y - i * esp, "#9fc1cf", 1.4);
    return s;
  }
  function nota(x, y0, n, o) {   // y0 = linha de baixo; n = passos
    o = o || {}; const esp = o.esp || 10, y = y0 - n * esp / 2, c = o.c || C.txt, vazia = o.vazia, haste = o.haste !== false;
    let s = "";
    for (let k = 0; k >= n; k -= 2) if (n <= -2 && k <= -2) s += lin(x - 11, y0 - k * esp / 2, x + 11, y0 - k * esp / 2, "#9fc1cf", 1.4);   // linhas suplementares abaixo
    for (let k = 10; k <= n; k += 2) s += lin(x - 11, y0 - k * esp / 2, x + 11, y0 - k * esp / 2, "#9fc1cf", 1.4);  // acima
    s += '<ellipse cx="' + x + '" cy="' + y + '" rx="8" ry="5.6" transform="rotate(-20 ' + x + " " + y + ')" fill="' + (vazia ? "none" : c) + '" stroke="' + c + '" stroke-width="' + (vazia ? 2 : 1) + '"/>';
    if (haste && !o.semibreve) s += n >= 6 ? lin(x - 7.5, y + 1, x - 7.5, y + 32, c, 1.8) : lin(x + 7.5, y - 1, x + 7.5, y - 32, c, 1.8);
    return s;
  }
  const clave = (x, y, s) => '<text x="' + x + '" y="' + y + '" font-size="' + (s || 62) + '" fill="#cfe6ee" font-family="Segoe UI Symbol, Noto Music, Symbola, serif">\u{1D11E}</text>';
  const claveF = (x, y, s) => '<text x="' + x + '" y="' + y + '" font-size="' + (s || 62) + '" fill="#cfe6ee" font-family="Segoe UI Symbol, Noto Music, Symbola, serif">\u{1D122}</text>';

  const F = {};

  // ================================================================ APRESENTAÇÃO DO PROFESSOR (abertura da aula)
  F.prof_boasvindas = () => {
    let s = "";
    [[C.az, 30, 3, 0, 0.9], [C.ver, 22, 4, 1.2, 0.7], [C.am, 16, 5, 2.1, 0.55], [C.rosa, 26, 2, 3.2, 0.45]].forEach(([c, a, ci, f, op]) => {
      s += '<path d="' + onda(40, 225, 720, a, ci, f) + '" fill="none" stroke="' + c + '" stroke-width="3.5" stroke-linecap="round" opacity="' + op + '"/>';
    });
    s += circ(400, 175, 92, { f: "#0b1820", s: C.az, sw: 5 }) + circ(400, 175, 76, { s: C.az, sw: 1.5 });
    s += tx(400, 193, "RMD", { t: 56, a: "middle", w: 800, c: C.az });
    s += tx(400, 322, "Rinaldo Miranda Dias", { t: 40, a: "middle", w: 800, c: C.txt });
    s += tx(400, 358, "PROFESSOR", { t: 20, a: "middle", w: 700, c: C.am });
    s += tx(400, 398, "Especialista em áudio cibernético", { t: 22, a: "middle", c: C.mudo });
    return svg("Apresentação do professor Rinaldo Miranda Dias", s);
  };
  F.prof_experiencia = () => {
    let s = "";
    s += tx(250, 205, "+30", { t: 150, a: "middle", w: 900, c: C.am });
    s += tx(250, 252, "ANOS DE EXPERIÊNCIA", { t: 24, a: "middle", w: 700, c: C.txt });
    s += tx(250, 282, "no ramo do áudio", { t: 20, a: "middle", c: C.mudo });
    // igreja
    const x = 600, y = 310;
    s += rect(x - 70, y - 80, 140, 100, { rx: 6, f: "#1a3340", s: C.az, sw: 3 });
    s += '<polygon points="' + (x - 82) + "," + (y - 80) + " " + x + "," + (y - 150) + " " + (x + 82) + "," + (y - 80) + '" fill="#1a3340" stroke="' + C.az + '" stroke-width="3" stroke-linejoin="round"/>';
    s += lin(x, y - 205, x, y - 150, C.am, 5) + lin(x - 16, y - 188, x + 16, y - 188, C.am, 5);
    s += rect(x - 18, y - 36, 36, 56, { rx: 18, f: "#0b1820", s: C.am, sw: 3 }) + circ(x, y - 108, 14, { s: C.ver, sw: 3 });
    s += tx(600, 372, "principalmente em igrejas", { t: 21, a: "middle", w: 600, c: C.ver });
    s += lin(430, 60, 430, 390, C.linha, 2, "6 8");
    return svg("Mais de trinta anos de experiência em áudio, principalmente em igrejas", s);
  };
  F.prof_formacao = () => {
    let s = "";
    const cartao = (x, cor, topo, grande, baixo, extra) => {
      let r = rect(x, 48, 232, 352, { rx: 18, f: "#0b1820", s: cor, sw: 3 }) + rect(x, 48, 232, 70, { rx: 18, f: cor, op: 0.18 });
      r += tx(x + 116, 92, topo, { t: 22, a: "middle", w: 800, c: cor });
      r += tx(x + 116, 215, grande, { t: grande.length > 3 ? 54 : 100, a: "middle", w: 900, c: C.txt });
      r += tx(x + 116, 270, baixo, { t: 21, a: "middle", w: 600, c: C.txt });
      if (extra) r += tx(x + 116, 340, extra, { t: 18, a: "middle", c: C.mudo });
      return r;
    };
    s += cartao(30, C.az, "EUROPA", "4", ["cursos de", "especialização"], "Portugal · Espanha");
    s += cartao(284, C.ver, "BRASIL", "BR", ["cursos de", "especialização"], "formação no país");
    s += cartao(538, C.am, "GESA BRASIL", "★", ["Especialista em", "áudio cibernético"], "multinacional");
    return svg("Formação: quatro cursos na Europa, cursos no Brasil e especialização pela Gesa Brasil", s);
  };

  // ================================================================ TEMA 1 — FUNDAMENTOS DO SOM
  F.vibracao = () => {
    let s = "";
    const cx = 230, cy = 170;
    // ondas circulares em volta dos dentes
    for (let i = 1; i <= 6; i++) {
      const r = 50 + i * 38, op = (1 - i * 0.13).toFixed(2);
      s += '<path d="M' + r1(cx + r * Math.cos(-0.9)) + " " + r1(cy + r * Math.sin(-0.9)) + " A " + r + " " + r + ' 0 0 1 ' + r1(cx + r * Math.cos(0.9)) + " " + r1(cy + r * Math.sin(0.9)) + '" fill="none" stroke="' + C.az + '" stroke-width="' + (6.5 - i * 0.7) + '" stroke-linecap="round" opacity="' + op + '"/>';
      s += '<path d="M' + r1(cx - r * Math.cos(-0.9)) + " " + r1(cy + r * Math.sin(-0.9)) + " A " + r + " " + r + ' 0 0 0 ' + r1(cx - r * Math.cos(0.9)) + " " + r1(cy + r * Math.sin(0.9)) + '" fill="none" stroke="' + C.az + '" stroke-width="' + (6.5 - i * 0.7) + '" stroke-linecap="round" opacity="' + op + '"/>';
    }
    // diapasão: dois dentes, curva em U e cabo
    s += rect(cx - 36, cy - 120, 20, 150, { rx: 10, f: "#d7e6ec" }) + rect(cx + 16, cy - 120, 20, 150, { rx: 10, f: "#d7e6ec" });
    s += cam("M" + (cx - 26) + " " + (cy + 20) + " Q" + (cx - 26) + " " + (cy + 52) + " " + cx + " " + (cy + 52) + " Q" + (cx + 26) + " " + (cy + 52) + " " + (cx + 26) + " " + (cy + 20), "#d7e6ec", 20);
    s += rect(cx - 9, cy + 52, 18, 120, { rx: 8, f: "#9fb4bd" });
    s += seta(cx - 50, cy - 80, cx - 78, cy - 80, C.am, 3) + seta(cx + 50, cy - 80, cx + 78, cy - 80, C.am, 3);
    s += tx(cx, 400, "Corpo que vibra", { t: 24, a: "middle", w: 700 });
    s += tx(580, 120, ["Vibração empurra e puxa", "as partículas do ar"], { t: 22, a: "middle", c: C.txt, w: 600 });
    s += lin(450, 290, 760, 290, C.grade, 1.5) + cam(onda(450, 290, 310, 30, 3, 0), C.az, 4);
    s += tx(605, 345, "pressão do ar ao longo do tempo", { t: 17, a: "middle", c: C.mudo });
    return svg("Diapasão vibrando e produzindo ondas sonoras", s);
  };

  F.propagacao = () => {
    let s = "";
    const x0 = 130, W = 620, lam = 200, a = 15;
    s += cam("M36 150 L66 150 L96 120 L96 280 L66 250 L36 250 Z", "#cfe0e7", 3, { f: "#27424f" });
    for (let r = 0; r < 6; r++) {
      const y = 108 + r * 30;
      for (let i = 0; i < 62; i++) {
        const x = x0 + i * (W / 62), px = x + a * Math.sin(2 * Math.PI * (x - x0) / lam);
        s += circ(r1(px), y, 4.3, { f: C.az, op: 0.92 });
      }
    }
    for (const k of [0, 1, 2]) {
      const xc = x0 + lam / 2 + k * lam;
      if (xc < x0 + W - 30) s += tx(xc, 300, "compressão", { t: 18, a: "middle", c: C.am, w: 700 }) + lin(xc, 306, xc, 372, C.am, 1.5, "4 4");
      const xe = x0 + lam * (k + 1);
      if (xe < x0 + W - 30) s += tx(xe, 300, "rarefação", { t: 18, a: "middle", c: C.verm, w: 700 });
    }
    s += lin(x0, 345, x0 + W, 345, C.linha, 1.5);
    let d = ""; for (let i = 0; i <= 200; i++) { const x = x0 + W * i / 200; d += (i ? "L" : "M") + r1(x) + " " + r1(345 + 24 * Math.cos(2 * Math.PI * (x - x0) / lam)); }
    s += cam(d, C.am, 4);
    s += tx(x0, 420, "As partículas só vibram no lugar; quem viaja é a perturbação (a energia).", { t: 20, c: C.mudo });
    s += seta(x0, 74, x0 + W, 74, C.mudo, 3) + tx(x0 + W / 2, 58, "direção de propagação (onda longitudinal)", { t: 18, a: "middle", c: C.mudo });
    return svg("Compressões e rarefações do ar: onda longitudinal", s);
  };

  F.meios = () => {
    const dados = [["Ar (20 °C)", 343, C.az], ["Água", 1480, C.ver], ["Madeira", 3800, C.lar], ["Aço", 5000, C.rox]];
    let s = tx(50, 62, "Velocidade do som em cada meio", { t: 28, w: 700 });
    dados.forEach(([n, v, c], i) => {
      const y = 100 + i * 70, w = 400 * v / 5000;
      s += tx(50, y + 32, n, { t: 24, w: 600 }) + rect(210, y, Math.max(w, 14), 46, { f: c, rx: 10 }) + tx(220 + Math.max(w, 14), y + 33, v.toLocaleString("pt-BR") + " m/s", { t: 24, w: 700, c: c });
    });
    s += rect(50, 392, 700, 40, { rx: 10, f: C.verm, op: 0.15, s: C.verm }) + tx(400, 419, "Vácuo: 0 m/s — sem matéria não há som", { t: 21, a: "middle", w: 600 });
    s += tx(760, 62, "valores aproximados", { t: 16, a: "end", c: C.mudo });
    return svg("Velocidade do som no ar, água, madeira e aço", s);
  };

  F.temperatura = () => {
    let s = "";
    // termômetro
    s += rect(66, 70, 34, 270, { rx: 17, f: "#0a141a", s: "#cfe0e7", sw: 3 }) + circ(83, 350, 34, { f: C.verm, s: "#cfe0e7", sw: 3 }) + rect(75, 150, 16, 200, { f: C.verm, rx: 8 });
    // gráfico
    const gx = 190, gy = 70, gw = 540, gh = 280;
    s += grade(gx, gy, gw, gh, 5, 4);
    const T = [-10, 0, 10, 20, 30, 40], px = (t) => gx + gw * (t + 10) / 50, py = (v) => gy + gh - gh * (v - 320) / 40;
    let d = ""; T.forEach((t, i) => { d += (i ? "L" : "M") + px(t) + " " + py(331.3 + 0.606 * t); });
    s += cam(d, C.am, 5);
    T.forEach((t) => { const v = 331.3 + 0.606 * t; s += circ(px(t), py(v), 7, { f: C.am }) + tx(px(t), 372, t + " °C", { t: 18, a: "middle", c: C.mudo }) + tx(px(t), py(v) - 14, Math.round(v) + "", { t: 19, a: "middle", w: 700 }); });
    s += tx(gx, 56, "m/s", { t: 18, c: C.mudo }) + tx(gx + gw / 2, 410, "v ≈ 331 + 0,6 · T   (T em °C)", { t: 26, a: "middle", w: 700, c: C.am });
    s += tx(gx + gw / 2, 438, "ar quente → moléculas mais agitadas → som mais rápido", { t: 18, a: "middle", c: C.mudo });
    return svg("Velocidade do som aumenta com a temperatura", s);
  };

  F.frequencia = () => {
    let s = "";
    s += tx(40, 46, "GRAVE — poucas vibrações por segundo", { t: 22, w: 700, c: C.lar });
    s += lin(40, 118, 760, 118, C.grade, 1.5) + cam(onda(40, 118, 720, 44, 2, 0), C.lar, 5);
    s += seta(40, 182, 400, 182, C.mudo, 2) + seta(400, 182, 40, 182, C.mudo, 2) + tx(220, 207, "1 período (T)", { t: 18, a: "middle", c: C.mudo });
    s += tx(40, 258, "AGUDO — muitas vibrações por segundo", { t: 22, w: 700, c: C.az });
    s += lin(40, 322, 760, 322, C.grade, 1.5) + cam(onda(40, 322, 720, 44, 8, 0), C.az, 4);
    s += seta(40, 376, 130, 376, C.mudo, 2) + seta(130, 376, 40, 376, C.mudo, 2) + tx(86, 402, "T pequeno", { t: 18, a: "middle", c: C.mudo });
    s += rect(300, 384, 460, 50, { rx: 12, f: C.am, op: 0.12, s: C.am }) + tx(530, 417, "f = 1 ÷ T      (Hz = ciclos por segundo)", { t: 21, a: "middle", w: 700, c: C.am });
    return svg("Ondas de baixa e alta frequência", s);
  };

  F.oitava = () => {
    const tk = teclado(40, 110, 720, 190, 48, 3, { 57: "#49c7ef", 69: "#49c7ef", 81: "#49c7ef" }, true);
    let s = tk.s;
    [[57, "Lá 220 Hz"], [69, "Lá 440 Hz"], [81, "Lá 880 Hz"]].forEach(([m, n]) => { s += tx(tk.x(m), 285, "Lá", { t: 17, a: "middle", w: 700, c: "#04151d" }) + tx(tk.x(m), 335, n.split(" ").slice(1).join(" "), { t: 24, a: "middle", w: 700, c: C.az }); });
    s += cam("M" + tk.x(57) + " 348 Q" + (tk.x(57) + tk.x(69)) / 2 + " 395 " + tk.x(69) + " 348", C.am, 3) + tx((tk.x(57) + tk.x(69)) / 2, 420, "oitava: ×2", { t: 22, a: "middle", w: 700, c: C.am });
    s += cam("M" + tk.x(69) + " 348 Q" + (tk.x(69) + tk.x(81)) / 2 + " 395 " + tk.x(81) + " 348", C.am, 3) + tx((tk.x(69) + tk.x(81)) / 2, 420, "oitava: ×2", { t: 22, a: "middle", w: 700, c: C.am });
    s += tx(400, 70, "A mesma nota, uma oitava acima, tem o dobro da frequência", { t: 24, a: "middle", w: 700 });
    return svg("Teclado mostrando que cada oitava dobra a frequência", s);
  };

  F.faixa = () => {
    const x0 = 60, w = 700;
    let s = "";
    const zonas = [[20, 250, C.lar, "GRAVES"], [250, 2000, C.ver, "MÉDIOS"], [2000, 20000, C.az, "AGUDOS"]];
    zonas.forEach(([a, b, c, n]) => { s += rect(xf(a, x0, w), 72, xf(b, x0, w) - xf(a, x0, w), 44, { rx: 0, f: c, op: 0.28 }) + tx((xf(a, x0, w) + xf(b, x0, w)) / 2, 102, n, { t: 22, a: "middle", w: 700, c: c }); });
    [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000].forEach((f) => { s += lin(xf(f, x0, w), 120, xf(f, x0, w), 392, C.grade, 1) + tx(xf(f, x0, w), 414, f >= 1000 ? f / 1000 + "k" : f, { t: 17, a: "middle", c: C.mudo }); });
    const lin2 = [["Voz (fundamentais)", 85, 1100, C.rosa], ["Baixo", 41, 400, C.lar], ["Violão e guitarra", 82, 1300, C.ver], ["Pratos e brilho", 3000, 16000, C.az]];
    lin2.forEach(([n, a, b, c], i) => { const y = 150 + i * 62; s += rect(xf(a, x0, w), y, xf(b, x0, w) - xf(a, x0, w), 34, { rx: 17, f: c, op: 0.85 }) + tx(xf(Math.max(a, 20), x0, w) + 12, y + 24, n, { t: 18, w: 700, c: "#04151d" }); });
    s += tx(x0, 56, "Faixa audível: 20 Hz a 20 kHz", { t: 26, w: 700 }) + tx(760, 56, "Hz", { t: 18, a: "end", c: C.mudo });
    s += tx(x0, 440, "abaixo de 20 Hz: infrassom · acima de 20 kHz: ultrassom", { t: 17, c: C.mudo });
    return svg("Faixa de frequências audíveis e onde cada fonte atua", s);
  };

  F.decibeis = () => {
    const niv = [[130, "Limiar da dor", C.verm], [110, "Show / sirene próxima", C.lar], [100, "Furadeira, trio elétrico", C.lar], [85, "Limite para 8 h por dia", C.am], [60, "Conversa normal", C.ver], [30, "Sussurro, biblioteca", C.az], [0, "Limiar de audição", C.mudo]];
    let s = tx(40, 50, "Escala de nível sonoro (dB)", { t: 26, w: 700 });
    niv.forEach(([v, n, c], i) => {
      const y = 70 + i * 54, w = 110 + 2.3 * v;
      s += rect(40, y, w, 40, { rx: 10, f: c, op: 0.85 }) + tx(52, y + 28, v + " dB", { t: 22, w: 800, c: "#04151d" }) + tx(40 + w + 14, y + 28, n, { t: 21, c: C.txt, w: v === 85 ? 700 : 400 });
    });
    s += rect(560, 318, 214, 118, { rx: 14, f: C.bg2, s: C.linha }) + tx(667, 350, "+3 dB = dobro da potência", { t: 16, a: "middle", w: 600, c: C.am }) + tx(667, 380, "+10 dB soa ~2× mais forte", { t: 16, a: "middle", w: 600, c: C.am }) + tx(667, 410, "(escala logarítmica)", { t: 16, a: "middle", c: C.mudo });
    return svg("Escala de decibéis com exemplos do dia a dia", s);
  };

  F.timbre = () => {
    const fm = [["Som puro (senoide)", [[1, 1]], C.az], ["Violão / voz", [[1, 1], [2, 0.55], [3, 0.35], [4, 0.2]], C.ver], ["Som brilhante (muitos harmônicos)", [[1, 1], [2, 0.5], [3, 0.33], [4, 0.25], [5, 0.2], [6, 0.16], [7, 0.14]], C.lar]];
    let s = tx(40, 40, "Mesma nota (mesma frequência), formas de onda diferentes", { t: 22, w: 700 });
    fm.forEach(([n, h, c], i) => {
      const y = 140 + i * 105;
      s += tx(40, y - 46, n, { t: 18, c: c, w: 700 }) + lin(40, y, 500, y, C.grade, 1) + cam(ondaH(40, y, 460, 36, 3, h), c, 4);
      h.concat([[8, 0]]).slice(0, 8).forEach(([k, a], j) => { if (a > 0) s += rect(560 + j * 24, y + 38 - a * 78, 16, a * 78, { rx: 3, f: c, op: 0.9 }); });
      s += lin(552, y + 38, 760, y + 38, C.linha, 1.5);
    });
    s += tx(656, 440, "harmônicos (as \"cores\" do som)", { t: 16, a: "middle", c: C.mudo });
    return svg("Timbre: formas de onda e harmônicos diferentes para a mesma nota", s);
  };

  F.comprimento = () => {
    const l = [["100 Hz", "3,4 m", 1.5, C.lar], ["1 kHz", "34 cm", 6, C.ver], ["10 kHz", "3,4 cm", 24, C.az]];
    let s = tx(40, 48, "λ = v ÷ f      (comprimento de onda = velocidade ÷ frequência)", { t: 23, w: 700, c: C.am });
    l.forEach(([f, c, ci, cor], i) => {
      const y = 140 + i * 100;
      s += tx(40, y + 6, f, { t: 26, w: 700, c: cor }) + cam(onda(170, y, 420, 34, ci, 0, 400), cor, 3.5) + tx(760, y + 6, c, { t: 26, a: "end", w: 700 });
    });
    s += tx(400, 420, "Grave: onda enorme, contorna obstáculos e invade a sala. Agudo: onda curta, bem direcional.", { t: 18, a: "middle", c: C.mudo });
    return svg("Comprimento de onda de graves, médios e agudos", s);
  };

  F.eco = () => {
    let s = "";
    s += cam("M50 190 L70 190 L90 170 L90 250 L70 230 L50 230 Z", "#cfe0e7", 3, { f: "#27424f" });
    s += rect(690, 120, 22, 190, { rx: 4, f: "#40616f", s: "#6a8b99" });
    s += seta(110, 195, 680, 195, C.az, 4) + seta(680, 235, 110, 235, C.lar, 4);
    s += tx(395, 178, "som vai (0 s)", { t: 20, a: "middle", c: C.az, w: 600 }) + tx(395, 270, "eco volta (≥ 0,1 s depois)", { t: 20, a: "middle", c: C.lar, w: 600 });
    s += seta(110, 335, 690, 335, C.mudo, 2) + seta(690, 335, 110, 335, C.mudo, 2) + tx(400, 372, "≥ 17 m até a parede → o ouvido separa som e eco", { t: 22, a: "middle", w: 700, c: C.am });
    s += tx(400, 416, "Parede mais perto que 17 m: o retorno chega colado e vira reverberação", { t: 18, a: "middle", c: C.mudo });
    s += tx(400, 70, "d = v · t ÷ 2  →  343 × 0,1 ÷ 2 ≈ 17 m", { t: 24, a: "middle", w: 700 });
    return svg("Eco: som refletido que volta pelo menos 0,1 segundo depois", s);
  };

  F.reverb = () => {
    let s = rect(40, 60, 420, 300, { rx: 8, f: "#0a161d", s: C.linha, sw: 3 });
    s += circ(110, 210, 14, { f: C.az }) + tx(110, 250, "fonte", { t: 16, a: "middle", c: C.az }) + circ(390, 270, 14, { f: C.ver }) + tx(390, 310, "ouvinte", { t: 16, a: "middle", c: C.ver });
    s += seta(120, 214, 378, 266, C.am, 4);
    s += cam("M110 210 L250 60 L390 270", C.az, 2, { d: "6 6" }) + cam("M110 210 L200 360 L390 270", C.az, 2, { d: "6 6" }) + cam("M110 210 L460 150 L390 270", C.az, 2, { d: "6 6" }) + cam("M110 210 L40 300 L250 360 L390 270", C.az, 2, { d: "6 6" });
    s += tx(250, 390, "som direto (amarelo) + reflexões (azul)", { t: 18, a: "middle", c: C.mudo });
    // decaimento
    s += lin(510, 80, 510, 340, C.linha, 2) + lin(510, 340, 770, 340, C.linha, 2) + tx(510, 66, "nível", { t: 16, c: C.mudo }) + tx(770, 366, "tempo", { t: 16, a: "end", c: C.mudo });
    s += cam("M515 90 Q600 130 700 320", C.az, 5) + lin(510, 320, 700, 320, C.verm, 2, "5 5") + tx(766, 316, "−60 dB", { t: 18, a: "end", c: C.verm, w: 700 });
    s += lin(700, 320, 700, 345, C.verm, 2) + tx(640, 392, "TR60: tempo para cair 60 dB", { t: 17, a: "middle", c: C.am, w: 700 });
    s += tx(640, 130, ["Muita reverberação", "= fala embolada"], { t: 18, a: "middle", c: C.mudo }).replace('x="640" y="130"','x="660" y="110"');
    return svg("Reverberação em uma sala e curva de decaimento", s);
  };

  F.ouvido = () => {
    let s = "";
    // pavilhão (orelha) e canal
    s += cam("M110 90 Q50 130 70 220 Q85 290 135 300 Q165 300 160 262 Q150 230 168 205", C.pele, 6);
    s += cam("M108 130 Q82 170 98 225 Q110 262 135 268", C.pele, 3.5);
    s += rect(170, 188, 130, 34, { rx: 17, f: "#4a3226", op: 0.9, s: C.pele, sw: 3 });
    s += seta(70, 190, 160, 202, C.az, 4);
    s += lin(300, 168, 300, 242, C.am, 7);
    s += rect(318, 180, 22, 34, { rx: 11, f: C.rosa }) + rect(346, 172, 24, 24, { rx: 9, f: C.rosa }) + rect(376, 186, 20, 26, { rx: 9, f: C.rosa });
    let d = ""; for (let i = 0; i <= 160; i++) { const t = i / 160 * 3.6 * Math.PI, r = 60 - 13.5 * t / Math.PI; d += (i ? "L" : "M") + r1(500 + r * Math.cos(t)) + " " + r1(235 + r * Math.sin(t)); }
    s += cam(d, C.az, 8);
    s += cam("M560 205 Q640 180 700 120", C.ver, 6) + circ(730, 98, 30, { f: C.ver, op: 0.25, s: C.ver, sw: 3 });
    s += tx(730, 105, "cérebro", { t: 15, a: "middle", c: C.txt, w: 700 });
    s += tx(90, 335, "pavilhão e canal", { t: 19, a: "middle", c: C.pele, w: 700 });
    s += tx(300, 285, "tímpano", { t: 19, a: "middle", c: C.am, w: 700 });
    s += tx(358, 150, "ossículos", { t: 19, a: "middle", c: C.rosa, w: 700 });
    s += tx(500, 335, "cóclea", { t: 19, a: "middle", c: C.az, w: 700 });
    s += tx(640, 230, "nervo", { t: 19, a: "middle", c: C.ver, w: 700 });
    s += tx(400, 410, "som → tímpano vibra → ossículos amplificam → cóclea → sinal elétrico → cérebro", { t: 18, a: "middle", c: C.mudo });
    return svg("Como o ouvido humano capta o som", s);
  };

  F.exposicao = () => {
    const d = [[85, "8 h", 480], [90, "4 h", 240], [95, "2 h", 120], [100, "1 h", 60], [105, "30 min", 30], [110, "15 min", 15]];
    let s = tx(40, 52, "Tempo máximo de exposição por dia (NR-15, dB(A))", { t: 24, w: 700 });
    d.forEach(([db, t, m], i) => { const y = 84 + i * 58, w = 50 + 440 * m / 480; s += tx(40, y + 30, db + " dB", { t: 24, w: 800, c: i > 2 ? C.verm : i > 0 ? C.am : C.ver }) + rect(150, y, w, 40, { rx: 10, f: i > 2 ? C.verm : i > 0 ? C.am : C.ver, op: 0.85 }) + tx(160 + w, y + 29, t, { t: 24, w: 700 }); });
    s += tx(40, 440, "Cada +5 dB corta o tempo seguro pela metade. Protetor auricular é parte do equipamento.", { t: 17, c: C.mudo });
    return svg("Tempo seguro de exposição ao ruído conforme o nível", s);
  };

  // ======= (as demais figuras estão nos arquivos seguintes) =======
  return { C, F, svg, tx, rect, circ, lin, cam, seta, ponta, chip, onda, ondaH, grade, xf, teclado, pauta, nota, clave, claveF, esc, r1 };
})();

/* ---- TEMA 2 — TÉCNICA DE SOM ---- */
(function (H) {
  "use strict";
  const { C, F, svg, tx, rect, circ, lin, cam, seta, ponta, chip, onda, ondaH, grade, xf, r1 } = H;

  // pequenos ícones reutilizáveis, desenhados em torno de (x,y)
  const ic = {
    mic: (x, y, c, k) => { k = k || 1; return rect(x - 11 * k, y - 26 * k, 22 * k, 38 * k, { rx: 11 * k, f: c || "#cfe0e7" }) + cam("M" + (x - 18 * k) + " " + (y - 4 * k) + " Q" + (x - 18 * k) + " " + (y + 22 * k) + " " + x + " " + (y + 22 * k) + " Q" + (x + 18 * k) + " " + (y + 22 * k) + " " + (x + 18 * k) + " " + (y - 4 * k), c || "#cfe0e7", 3 * k) + lin(x, y + 22 * k, x, y + 36 * k, c || "#cfe0e7", 3 * k) + lin(x - 10 * k, y + 36 * k, x + 10 * k, y + 36 * k, c || "#cfe0e7", 3 * k); },
    mesa: (x, y, c, k) => { k = k || 1; let s = rect(x - 40 * k, y - 22 * k, 80 * k, 44 * k, { rx: 6 * k, f: "#1a3340", s: c || "#cfe0e7", sw: 3 }); for (let i = 0; i < 5; i++) s += lin(x - 30 * k + i * 15 * k, y - 12 * k, x - 30 * k + i * 15 * k, y + 12 * k, "#6a8b99", 2) + rect(x - 34 * k + i * 15 * k, y - 4 * k + (i % 3) * 5 * k, 8 * k, 5 * k, { rx: 1, f: c || "#cfe0e7" }); return s; },
    amp: (x, y, c, k) => { k = k || 1; return rect(x - 30 * k, y - 26 * k, 60 * k, 52 * k, { rx: 6 * k, f: "#1a3340", s: c || "#cfe0e7", sw: 3 }) + lin(x - 22 * k, y - 12 * k, x + 22 * k, y - 12 * k, c || "#cfe0e7", 3) + circ(x - 14 * k, y + 8 * k, 5 * k, { f: c || "#cfe0e7" }) + circ(x + 2 * k, y + 8 * k, 5 * k, { f: c || "#cfe0e7" }) + circ(x + 18 * k, y + 8 * k, 5 * k, { f: c || "#cfe0e7" }); },
    caixa: (x, y, c, k) => { k = k || 1; return rect(x - 26 * k, y - 38 * k, 52 * k, 76 * k, { rx: 6 * k, f: "#1a3340", s: c || "#cfe0e7", sw: 3 }) + circ(x, y - 14 * k, 8 * k, { s: c || "#cfe0e7", sw: 3 }) + circ(x, y + 14 * k, 15 * k, { s: c || "#cfe0e7", sw: 3 }) + circ(x, y + 14 * k, 5 * k, { f: c || "#cfe0e7" }); },
    voz: (x, y, c, k) => { k = k || 1; return circ(x, y - 18 * k, 14 * k, { f: C.pele }) + cam("M" + (x - 22 * k) + " " + (y + 24 * k) + " Q" + (x - 22 * k) + " " + (y + 2 * k) + " " + x + " " + (y + 2 * k) + " Q" + (x + 22 * k) + " " + (y + 2 * k) + " " + (x + 22 * k) + " " + (y + 24 * k), C.pele, 3 * k); },
    ouvido: (x, y, c, k) => { k = k || 1; return cam("M" + (x - 8 * k) + " " + (y - 28 * k) + " Q" + (x + 24 * k) + " " + (y - 26 * k) + " " + (x + 20 * k) + " " + (y + 2 * k) + " Q" + (x + 14 * k) + " " + (y + 26 * k) + " " + (x - 6 * k) + " " + (y + 22 * k), c || C.pele, 4 * k) + cam("M" + (x - 2 * k) + " " + (y - 10 * k) + " Q" + (x + 8 * k) + " " + (y - 8 * k) + " " + (x + 6 * k) + " " + (y + 6 * k), c || C.pele, 3 * k); },
    relogio: (x, y, c, k) => { k = k || 1; return circ(x, y, 24 * k, { s: c, sw: 4 }) + lin(x, y, x, y - 14 * k, c, 4) + lin(x, y, x + 10 * k, y + 4 * k, c, 4); },
    check: (x, y, c, k) => { k = k || 1; return circ(x, y, 24 * k, { s: c, sw: 4 }) + cam("M" + (x - 11 * k) + " " + y + " L" + (x - 3 * k) + " " + (y + 9 * k) + " L" + (x + 13 * k) + " " + (y - 10 * k), c, 5 * k); },
    sliders: (x, y, c, k) => { k = k || 1; let s = ""; [[-14, 6], [0, -8], [14, 10]].forEach(([dx, dy]) => { s += lin(x + dx * k, y - 22 * k, x + dx * k, y + 22 * k, "#6a8b99", 3) + rect(x + dx * k - 8 * k, y + dy * k - 5 * k, 16 * k, 10 * k, { rx: 3, f: c }); }); return s; },
    cruz: (x, y, c, k) => { k = k || 1; return circ(x, y, 24 * k, { s: c, sw: 4 }) + lin(x - 11 * k, y - 11 * k, x + 11 * k, y + 11 * k, c, 5) + lin(x + 11 * k, y - 11 * k, x - 11 * k, y + 11 * k, c, 5); },
  };
  H.ic = ic;

  F.cadeia = () => {
    const bl = [["Fonte", "origem do som", ic.voz, C.pele], ["Microfone", "capta o som", ic.mic, C.az], ["Mesa", "mistura e ajusta", ic.mesa, C.ver], ["Amplificador", "dá potência", ic.amp, C.am], ["Caixas", "espalham o som", ic.caixa, C.lar], ["Ouvinte", "a plateia", ic.ouvido, C.rosa]];
    let s = tx(400, 46, "A cadeia do som ao vivo", { t: 28, a: "middle", w: 700 });
    bl.forEach(([n, d, f, c], i) => {
      const x = 70 + i * 132;
      s += rect(x - 54, 100, 108, 190, { rx: 16, f: c, op: 0.1, s: c, sw: 2 }) + f(x, 175, c, 1.25) + tx(x, 255, n, { t: 15.5, a: "middle", w: 700, c: c }) + tx(x, 278, d.split(" / ").length > 1 ? d.split(" / ") : d, { t: 12.5, a: "middle", c: C.mudo });
      if (i < 5) s += seta(x + 56, 195, x + 76, 195, C.mudo, 3);
    });
    s += tx(400, 340, "Qualquer elo fraco compromete tudo que vem depois.", { t: 22, a: "middle", w: 600, c: C.am });
    s += tx(400, 380, "Boa fonte e bom microfone valem mais que qualquer ajuste na mesa.", { t: 19, a: "middle", c: C.mudo });
    return svg("Cadeia do som ao vivo: fonte, microfone, mesa, amplificador, caixas e ouvinte", s);
  };

  F.postura = () => {
    const cards = [["Chegar cedo", "montar e testar sem pressa", ic.relogio, C.az], ["Escutar a sala", "o ouvido manda, não só os medidores", ic.ouvido, C.rosa], ["Mexer com intenção", "um ajuste por vez", ic.sliders, C.ver], ["Testar antes", "microfone, cabo, retorno", ic.check, C.am]];
    let s = "";
    cards.forEach(([n, d, f, c], i) => {
      const x = 40 + (i % 2) * 370, y = 40 + Math.floor(i / 2) * 200;
      s += rect(x, y, 350, 180, { rx: 18, f: c, op: 0.1, s: c, sw: 2 }) + f(x + 70, y + 90, c, 1.5) + tx(x + 135, y + 78, n, { t: 21, w: 700, c: c }) + tx(x + 135, y + 112, d.split(" ").length > 4 ? [d.split(" ").slice(0, 3).join(" "), d.split(" ").slice(3).join(" ")] : d, { t: 18, c: C.txt });
    });
    return svg("Postura do técnico de som: chegar cedo, escutar, ajustar com intenção, testar", s);
  };

  F.mic_tipos = () => {
    let s = "";
    s += tx(200, 50, "DINÂMICO", { t: 26, a: "middle", w: 700, c: C.lar }) + tx(600, 50, "CONDENSADOR", { t: 26, a: "middle", w: 700, c: C.az });
    // dinâmico
    s += rect(150, 120, 190, 150, { rx: 14, f: "#16313d", s: "#6a8b99", sw: 3 });
    s += lin(150, 160, 150, 230, C.lar, 8) + tx(98, 150, "diafragma", { t: 16, c: C.lar, a: "middle" }).replace('x="98"', 'x="90"');
    s += rect(165, 170, 22, 50, { rx: 4, f: C.am, op: 0.9 }) + tx(176, 255, "bobina", { t: 16, a: "middle", c: C.am });
    s += rect(210, 150, 90, 90, { rx: 6, f: "#8a97a0" }) + rect(230, 165, 50, 60, { rx: 4, f: "#d8484a" }) + tx(255, 200, "ímã", { t: 18, a: "middle", w: 700, c: "#fff" });
    s += cam("M60 180 h50", C.az, 3) + cam("M60 200 h50", C.az, 3) + cam("M60 160 h50", C.az, 3);
    s += tx(200, 320, ["Robusto, aguenta pancada", "e volume alto. Não precisa de energia."], { t: 18, a: "middle" }) + tx(200, 372, "Voz ao vivo, bumbo, caixa, amplificadores", { t: 16, a: "middle", c: C.mudo });
    // condensador
    s += rect(540, 120, 190, 150, { rx: 14, f: "#16313d", s: "#6a8b99", sw: 3 });
    s += lin(550, 150, 550, 240, C.az, 3) + lin(620, 150, 620, 240, C.verm, 3) + lin(550, 150, 550, 240, C.az, 3);
    s += tx(550, 262, "membrana", { t: 15, a: "middle", c: C.az }) + tx(626, 262, "placa", { t: 15, a: "middle", c: C.verm });
    s += cam("M552 195 Q583 190 618 195", C.am, 3, { d: "5 4" }) + tx(588, 180, "+ carga", { t: 14, a: "middle", c: C.am });
    s += rect(660, 160, 56, 70, { rx: 8, f: C.ver, op: 0.2, s: C.ver }) + tx(688, 205, "48 V", { t: 20, a: "middle", w: 800, c: C.ver });
    s += cam("M470 180 h60", C.az, 3) + cam("M470 200 h60", C.az, 3) + cam("M470 160 h60", C.az, 3);
    s += tx(600, 320, ["Sensível, detalhado, brilhante.", "Precisa de alimentação fantasma (48 V)."], { t: 18, a: "middle" }) + tx(600, 372, "Estúdio, vozes delicadas, violão, pratos", { t: 16, a: "middle", c: C.mudo });
    s += tx(400, 430, "Ligue o 48 V só com o microfone conectado e o canal baixo (mute).", { t: 17, a: "middle", c: C.am });
    return svg("Microfone dinâmico e microfone condensador por dentro", s);
  };

  F.polares = () => {
    const pad = [["Omni", (t) => 1, C.mudo, "capta todos os lados"], ["Cardioide", (t) => 0.5 * (1 + Math.cos(t)), C.az, "rejeita atrás"], ["Supercardioide", (t) => Math.abs(0.37 + 0.63 * Math.cos(t)), C.ver, "mais estreito"], ["Figura em 8", (t) => Math.abs(Math.cos(t)), C.am, "frente e trás"]];
    let s = "";
    pad.forEach(([n, f, c, d], i) => {
      const cx = 105 + i * 197, cy = 195, R = 78;
      s += circ(cx, cy, R, { s: C.grade, sw: 1.5 }) + circ(cx, cy, R / 2, { s: C.grade, sw: 1 }) + lin(cx - R, cy, cx + R, cy, C.grade, 1) + lin(cx, cy - R, cx, cy + R, C.grade, 1);
      let p = ""; for (let k = 0; k <= 120; k++) { const t = 2 * Math.PI * k / 120, r = f(t) * R; p += (k ? "L" : "M") + r1(cx + r * Math.sin(t)) + " " + r1(cy - r * Math.cos(t)); }
      s += cam(p + "Z", c, 4, { f: c, op: 0.2 }) + ic.mic(cx, cy + 4, "#cfe0e7", 0.45);
      s += tx(cx, 318, n, { t: 21, a: "middle", w: 700, c: c }) + tx(cx, 344, d, { t: 15, a: "middle", c: C.mudo });
    });
    s += tx(400, 50, "Padrões polares: de onde o microfone \"escuta\"", { t: 26, a: "middle", w: 700 });
    s += seta(400, 402, 400, 372, C.mudo, 3) + tx(412, 398, "frente (o som que queremos)", { t: 17, c: C.mudo }).replace('x="412"', 'x="418"');
    return svg("Padrões polares de captação dos microfones", s);
  };

  F.regra31 = () => {
    let s = "";
    s += circ(190, 120, 22, { f: C.pele }) + ic.mic(190, 200, C.az, 0.7) + circ(610, 120, 22, { f: C.pele }) + ic.mic(610, 200, C.az, 0.7);
    s += seta(190, 156, 190, 190, C.mudo, 3) + tx(204, 180, "d", { t: 24, c: C.am, w: 700 });
    s += seta(610, 156, 610, 190, C.mudo, 3) + tx(624, 180, "d", { t: 24, c: C.am, w: 700 });
    s += seta(205, 250, 595, 250, C.verm, 4) + seta(595, 250, 205, 250, C.verm, 4) + tx(400, 292, "≥ 3 × d", { t: 28, a: "middle", w: 800, c: C.verm });
    s += cam("M205 150 Q400 215 595 150", C.lar, 3, { d: "6 6" }) + tx(400, 340, "um microfone também capta o vizinho (vazamento)", { t: 18, a: "middle", c: C.lar });
    s += tx(400, 50, "Regra do 3 para 1", { t: 28, a: "middle", w: 700 }) + tx(400, 400, "Distância entre microfones ≥ 3 × distância do microfone à fonte", { t: 20, a: "middle", w: 600, c: C.am });
    s += tx(400, 430, "evita som \"molhado\" e cancelamentos de fase", { t: 17, a: "middle", c: C.mudo });
    return svg("Regra do 3 para 1 na distância entre microfones", s);
  };

  F.conectores = () => {
    const it = [["XLR", "microfone e linhas balanceadas", C.az], ["P10 TRS", "balanceado, fone, insert", C.ver], ["P10 TS", "instrumento desbalanceado", C.lar], ["RCA", "players, entrada de linha", C.rosa], ["Speakon", "saída para as caixas", C.am]];
    let s = "";
    it.forEach(([n, d, c], i) => {
      const x = 80 + i * 160, y = 170;
      s += rect(x - 66, 60, 132, 300, { rx: 16, f: c, op: 0.08, s: c, sw: 2 });
      if (n === "XLR") s += circ(x, y, 42, { f: "#1a3340", s: c, sw: 5 }) + circ(x - 16, y + 12, 6, { f: c }) + circ(x + 16, y + 12, 6, { f: c }) + circ(x, y - 16, 6, { f: c }) + rect(x - 8, y - 42, 16, 8, { rx: 2, f: c });
      if (n === "P10 TRS" || n === "P10 TS") { s += rect(x - 14, y - 70, 28, 58, { rx: 4, f: "#8a97a0" }) + rect(x - 8, y - 12, 16, 22, { rx: 2, f: "#cfe0e7" }) + rect(x - 8, y + 12, 16, 22, { rx: 2, f: "#cfe0e7" }) + (n === "P10 TRS" ? lin(x - 8, y + 4, x + 8, y + 4, "#10202a", 5) : "") + lin(x - 8, y + 11, x + 8, y + 11, "#10202a", 5) + cam("M" + (x - 8) + " " + (y + 34) + " Q" + x + " " + (y + 48) + " " + (x + 8) + " " + (y + 34), "#cfe0e7", 3, { f: "#cfe0e7" }); s += tx(x, y + 78, n === "P10 TRS" ? "ponta · anel · corpo" : "ponta · corpo", { t: 13, a: "middle", c: C.mudo }); }
      if (n === "RCA") s += circ(x, y, 38, { f: "#1a3340", s: c, sw: 5 }) + circ(x, y, 14, { f: c }) + circ(x, y, 24, { s: "#6a8b99", sw: 3 });
      if (n === "Speakon") { s += circ(x, y, 42, { f: "#1a3340", s: c, sw: 5 }) + circ(x, y, 20, { s: "#6a8b99", sw: 3 }); [-1, 1].forEach((k) => (s += rect(x + k * 26 - 5, y - 6, 10, 12, { rx: 2, f: c }))); s += rect(x - 6, y - 52, 12, 10, { rx: 2, f: c }); }
      s += tx(x, 280, n, { t: 22, a: "middle", w: 800, c: c }) + tx(x, 306, d.split(" ").length > 2 ? [d.split(" ").slice(0, Math.ceil(d.split(" ").length / 2)).join(" "), d.split(" ").slice(Math.ceil(d.split(" ").length / 2)).join(" ")] : d, { t: 14, a: "middle", c: C.txt });
    });
    s += tx(400, 40, "Conectores de áudio mais comuns", { t: 24, a: "middle", w: 700 });
    s += tx(400, 404, "Cabo de microfone: XLR. Cabo de instrumento: P10. Cabo de caixa: nunca troque por cabo de microfone.", { t: 16, a: "middle", c: C.mudo });
    return svg("Conectores XLR, P10, RCA e Speakon", s);
  };

  F.balanceado = () => {
    const x0 = 60, w = 270;
    const linha = (y, n, c, f, mult) => lin(x0, y, x0 + w, y, C.grade, 1) + cam(f, c, 4) + tx(x0 + w + 20, y + 7, n, { t: 18, c: c, w: 700 });
    let s = tx(400, 40, "Por que o cabo balanceado cancela o ruído", { t: 26, a: "middle", w: 700 });
    const sinal = (y, sgn) => onda(x0, y, w, 24 * sgn, 2, 0), ruido = (y) => { let d = ""; for (let i = 0; i <= 200; i++) d += (i ? "L" : "M") + r1(x0 + w * i / 200) + " " + r1(y - 8 * Math.sin(2 * Math.PI * 14 * i / 200)); return d; };
    const duplo = (y, sgn) => { let d = ""; for (let i = 0; i <= 200; i++) { const t = i / 200; d += (i ? "L" : "M") + r1(x0 + w * t) + " " + r1(y - sgn * 24 * Math.sin(2 * Math.PI * 2 * t) - 8 * Math.sin(2 * Math.PI * 14 * t)); } return d; };
    s += lin(x0, 110, x0 + w, 110, C.grade, 1) + cam(duplo(110, 1), C.az, 3) + tx(x0 + w + 20, 117, "pino 2 (+) + ruído", { t: 17, c: C.az, w: 700 });
    s += lin(x0, 190, x0 + w, 190, C.grade, 1) + cam(duplo(190, -1), C.lar, 3) + tx(x0 + w + 20, 197, "pino 3 (−) invertido + ruído", { t: 17, c: C.lar, w: 700 });
    s += seta(200, 214, 200, 262, C.mudo, 3) + tx(215, 245, "a mesa inverte um lado e soma", { t: 17, c: C.mudo });
    let d = ""; for (let i = 0; i <= 200; i++) { const t = i / 200; d += (i ? "L" : "M") + r1(x0 + w * t) + " " + r1(300 - 2 * 24 * Math.sin(2 * Math.PI * 2 * t)); }
    s += lin(x0, 300, x0 + w, 300, C.grade, 1) + cam(d, C.ver, 5) + tx(x0 + w + 20, 307, "sinal dobrado, ruído zerado", { t: 17, c: C.ver, w: 700 });
    s += rect(60, 356, 680, 60, { rx: 12, f: C.bg2, s: C.linha }) + tx(400, 392, "O ruído entra igual nos dois fios; como um está invertido, a subtração elimina o chiado.", { t: 17, a: "middle" });
    return svg("Cabo balanceado: ruído igual nos dois fios é cancelado", s);
  };

  F.di_box = () => {
    let s = tx(400, 44, "Caixa direta (DI): instrumento → sinal balanceado", { t: 24, a: "middle", w: 700 });
    s += rect(40, 120, 150, 90, { rx: 12, f: C.ver, op: 0.12, s: C.ver }) + tx(115, 160, "Teclado", { t: 22, a: "middle", w: 700, c: C.ver }) + tx(115, 188, "baixo, violão ligado", { t: 15, a: "middle", c: C.mudo });
    s += seta(190, 165, 290, 165, C.lar, 4) + tx(240, 150, "P10", { t: 15, a: "middle", c: C.lar });
    s += rect(290, 110, 130, 110, { rx: 14, f: C.am, op: 0.15, s: C.am, sw: 3 }) + tx(355, 150, "DI box", { t: 24, a: "middle", w: 800, c: C.am }) + tx(355, 180, "converte p/ XLR", { t: 15, a: "middle", c: C.txt }) + tx(355, 202, "(isola ruído)", { t: 15, a: "middle", c: C.txt });
    s += seta(420, 165, 520, 165, C.az, 4) + tx(470, 150, "XLR", { t: 15, a: "middle", c: C.az });
    s += ic.mesa(610, 165, C.az, 1.4) + tx(610, 235, "Mesa", { t: 20, a: "middle", w: 700, c: C.az });
    s += lin(190, 290, 420, 290, C.lar, 5) + tx(305, 322, "cabo curto (até ~5 m)", { t: 17, a: "middle", c: C.lar });
    s += lin(420, 290, 760, 290, C.az, 5) + tx(590, 350, "cabo balanceado: pode ser longo (dezenas de metros)", { t: 17, a: "middle", c: C.az });
    s += tx(400, 400, "Cabo de instrumento longo capta ruído e perde brilho — por isso a DI fica perto do instrumento.", { t: 17, a: "middle", c: C.mudo });
    return svg("Caixa direta DI entre instrumento e mesa", s);
  };

  const knob = (x, y, ang, c, r) => { r = r || 18; const a = (ang - 90) * Math.PI / 180; return circ(x, y, r, { f: "#1a3340", s: c, sw: 3 }) + lin(x, y, x + (r - 3) * Math.cos(a), y + (r - 3) * Math.sin(a), c, 3); };

  F.canal = () => {
    let s = "";
    const X = 210;
    s += rect(X - 90, 20, 180, 410, { rx: 16, f: "#10202a", s: "#3b6277", sw: 3 });
    const lab = (y, n, d, c) => tx(X + 112, y + 6, n, { t: 18, w: 700, c: c }) + tx(X + 112, y + 26, d, { t: 14, c: C.mudo });
    s += knob(X, 56, 20, C.am) + lab(56, "GANHO (gain)", "nível de entrada", C.am);
    s += rect(X - 28, 90, 56, 22, { rx: 6, f: C.az, op: 0.3, s: C.az }) + tx(X, 106, "HPF", { t: 14, a: "middle", w: 700, c: C.az }) + lab(94, "FILTRO DE GRAVES", "corta o que está abaixo", C.az);
    [["AGUDO", 40], ["MÉDIO", -30], ["GRAVE", 10]].forEach(([n, a], i) => { const y = 146 + i * 42; s += knob(X, y, a, C.ver, 15) + (i === 1 ? "" : ""); });
    s += tx(X + 112, 150, "EQUALIZAÇÃO", { t: 18, w: 700, c: C.ver }) + tx(X + 112, 170, "agudo · médio · grave", { t: 14, c: C.mudo });
    s += knob(X - 40, 290, -30, C.lar, 14) + knob(X + 40, 290, 50, C.lar, 14) + tx(X + 112, 292, "AUX (retornos)", { t: 18, w: 700, c: C.lar }) + tx(X + 112, 312, "envio p/ monitores", { t: 14, c: C.mudo });
    s += knob(X, 340, -40, C.rosa, 13) + tx(X + 112, 342, "PAN", { t: 18, w: 700, c: C.rosa }) + tx(X + 112, 362, "esquerda ↔ direita", { t: 14, c: C.mudo });
    s += lin(X, 372, X, 426, "#6a8b99", 4) + rect(X - 14, 392, 28, 14, { rx: 3, f: "#cfe0e7" }) + tx(X + 112, 395, "FADER", { t: 18, w: 700 }) + tx(X + 112, 415, "volume do canal", { t: 14, c: C.mudo });
        s += rect(X - 80, 8, 4, 4, {});
    return svg("Tira de canal de uma mesa de som: ganho, filtro, equalização, aux, pan e fader", s);
  };

  F.clipping = () => {
    let s = tx(400, 44, "Ganho: nem baixo, nem alto", { t: 26, a: "middle", w: 700 });
    const col = [["Muito baixo", "chiado", C.mudo, 0.18, 1, false], ["Ideal", "limpo", C.ver, 0.5, 1, false], ["Alto demais", "clipping", C.verm, 0.9, 1, true]];
    col.forEach(([n, d, c, a, _, clip], i) => {
      const x = 40 + i * 250;
      s += rect(x, 70, 230, 200, { rx: 14, f: "#0b1a22", s: C.linha });
      s += lin(x + 8, 170, x + 222, 170, C.grade, 1) + lin(x + 8, 92, x + 222, 92, C.verm, 1, "5 5");
      let p = ""; for (let k = 0; k <= 160; k++) { let v = a * Math.sin(2 * Math.PI * 2 * k / 160) * 1.7; if (clip) v = Math.max(-0.82, Math.min(0.82, v * 1.2)); else v = v * 0.95; v = Math.max(-0.95, Math.min(0.95, v)); p += (k ? "L" : "M") + r1(x + 12 + 206 * k / 160) + " " + r1(170 - 78 * v); }
      s += cam(p, c, 4);
      s += tx(x + 115, 300, n, { t: 22, a: "middle", w: 700, c: c }) + tx(x + 115, 326, d, { t: 17, a: "middle", c: C.mudo });
      // medidor
      const segs = 10, lig = i === 0 ? 3 : i === 1 ? 7 : 10; for (let k = 0; k < segs; k++) s += rect(x + 15 + k * 20, 345, 16, 26, { rx: 3, f: k < 6 ? C.ver : k < 8 ? C.am : C.verm, op: k < lig ? 1 : 0.15 });
    });
    s += tx(400, 410, "Regra: picos no amarelo, quase nunca no vermelho. O que distorce na entrada não se conserta depois.", { t: 17, a: "middle", c: C.am });
    return svg("Ganho baixo, ideal e com clipping", s);
  };

  F.eq_faixas = () => {
    const x0 = 40, w = 720;
    const z = [[20, 60, C.mudo, "SUB", "estrondo"], [60, 250, C.lar, "GRAVE", "corpo, peso"], [250, 500, C.am, "MÉDIO-GRAVE", "\"lama\" / embolado"], [500, 2000, C.ver, "MÉDIO", "presença da voz"], [2000, 5000, C.az, "MÉDIO-AGUDO", "clareza (e cansaço)"], [5000, 20000, C.rox, "AGUDO", "brilho, \"ar\""]];
    let s = tx(400, 40, "Cada região do espectro tem um papel", { t: 26, a: "middle", w: 700 });
    z.forEach(([a, b, c, n, d], i) => {
      const xa = xf(a, x0, w), xb = xf(b, x0, w);
      s += rect(xa, 70, xb - xa, 280, { rx: 0, f: c, op: 0.16 }) + lin(xa, 70, xa, 350, c, 2);
      s += tx((xa + xb) / 2, 112 + (i % 3) * 62, n, { t: 15, a: "middle", w: 800, c: c }) + tx((xa + xb) / 2, 132 + (i % 3) * 62, d, { t: 13, a: "middle", c: C.txt });
    });
    [20, 50, 100, 200, 500, "1k", "2k", "5k", "10k", "20k"].forEach((f) => { const v = typeof f === "string" ? parseFloat(f) * 1000 : f; s += tx(xf(v, x0, w), 374, f, { t: 15, a: "middle", c: C.mudo }); });
    s += tx(400, 418, "Falta clareza? Olhe 2–5 kHz. Som embolado? Olhe 250–500 Hz. Sem corpo? Olhe 60–250 Hz.", { t: 16, a: "middle", c: C.am });
    return svg("Regiões de frequência da equalização e o efeito de cada uma", s);
  };

  F.compressor = () => {
    let s = "";
    const gx = 50, gy = 60, g = 280;
    s += grade(gx, gy, g, g, 4, 4) + lin(gx, gy + g, gx + g, gy, C.mudo, 2, "6 6");
    const th = 0.55;
    s += cam("M" + gx + " " + (gy + g) + " L" + (gx + g * th) + " " + (gy + g - g * th) + " L" + (gx + g) + " " + (gy + g - g * th - g * (1 - th) / 4), C.az, 5);
    s += lin(gx + g * th, gy + g, gx + g * th, gy, C.am, 2, "5 5") + tx(gx + g * th + 6, gy + 18, "threshold", { t: 16, c: C.am, w: 700 });
    s += tx(gx + g / 2, gy + g + 28, "entrada (dB) →", { t: 16, a: "middle", c: C.mudo }) + tx(gx - 14, gy + g / 2, "saída (dB) →", { t: 16, a: "middle", c: C.mudo, r: -90 });
    s += tx(gx + g - 8, gy + g - 80, "ratio 4:1", { t: 20, a: "end", c: C.az, w: 700 }) + tx(gx + g - 8, gy + g - 56, "a cada 4 dB acima do limite,", { t: 13, a: "end", c: C.mudo }) + tx(gx + g - 8, gy + g - 40, "só 1 dB sai", { t: 13, a: "end", c: C.mudo });
    const ox = 420, ow = 340;
    s += tx(ox, 70, "Antes", { t: 18, c: C.lar, w: 700 }) + lin(ox, 130, ox + ow, 130, C.grade, 1);
    let d1 = "", d2 = ""; for (let i = 0; i <= 240; i++) { const t = i / 240, env = 0.35 + 0.65 * Math.exp(-Math.pow((t - 0.35) / 0.1, 2)) + 0.5 * Math.exp(-Math.pow((t - 0.8) / 0.06, 2)); const v = env * Math.sin(2 * Math.PI * 22 * t), v2 = (v > 0.5 ? 0.5 + (v - 0.5) / 4 : v < -0.5 ? -0.5 + (v + 0.5) / 4 : v); d1 += (i ? "L" : "M") + r1(ox + ow * t) + " " + r1(130 - 46 * Math.max(-1.2, Math.min(1.2, v))); d2 += (i ? "L" : "M") + r1(ox + ow * t) + " " + r1(290 - 46 * Math.max(-1.2, Math.min(1.2, v2))); }
    s += cam(d1, C.lar, 2.5) + tx(ox, 232, "Depois", { t: 18, c: C.ver, w: 700 }) + lin(ox, 290, ox + ow, 290, C.grade, 1) + cam(d2, C.ver, 2.5);
    s += tx(ox + ow / 2, 360, "Picos domados → volume mais constante", { t: 18, a: "middle", c: C.txt, w: 600 });
    s += tx(400, 420, "Attack: quão rápido começa a comprimir · Release: quão rápido solta", { t: 17, a: "middle", c: C.mudo });
    return svg("Compressor: curva de entrada e saída, antes e depois", s);
  };

  F.microfonia = () => {
    let s = "";
    const cx = 270, cy = 215, R = 130;
    const nos = [["Microfone", -90, C.az, ic.mic], ["Mesa", -18, C.ver, ic.mesa], ["Amplificador", 54, C.am, ic.amp], ["Caixa", 126, C.lar, ic.caixa], ["Ar", 198, C.rosa, null]];
    nos.forEach(([n, a, c, f], i) => { const t = a * Math.PI / 180, x = cx + R * Math.cos(t), y = cy + R * Math.sin(t); s += circ(x, y, 46, { f: c, op: 0.12, s: c, sw: 2 }); if (f) s += f(x, y, c, 0.6); else s += cam("M" + (x - 22) + " " + y + " q8 -14 16 0 t16 0 t16 0", c, 3); s += tx(x, y + (a > 0 && a < 180 ? 68 : -56), n, { t: 17, a: "middle", w: 700, c: c }); });
    for (let i = 0; i < 5; i++) { const a1 = (nos[i][1] + 22) * Math.PI / 180, a2 = (nos[(i + 1) % 5][1] - 22) * Math.PI / 180; s += seta(cx + (R + 0) * Math.cos(a1) * 1, cy + R * Math.sin(a1), cx + R * Math.cos(a2), cy + R * Math.sin(a2), C.verm, 3); }
    s += tx(cx, cy + 6, "laço", { t: 28, a: "middle", w: 800, c: C.verm }) + tx(cx, cy + 30, "ganho > 1", { t: 16, a: "middle", c: C.mudo });
    s += rect(500, 70, 270, 290, { rx: 16, f: C.ver, op: 0.1, s: C.ver, sw: 2 }) + tx(635, 105, "Como evitar", { t: 24, a: "middle", w: 800, c: C.ver });
    ["Caixas à frente dos microfones", "Reduzir ganho e volume", "Cortar no EQ a frequência do apito", "Microfone perto da fonte", "Microfone cardioide de costas pra caixa"].forEach((t, i) => (s += tx(520, 150 + i * 44, ["• " + t], { t: 14.5 })));
    s += tx(400, 420, "O som da caixa volta ao microfone, é amplificado de novo e cresce até apitar.", { t: 17, a: "middle", c: C.mudo });
    return svg("Microfonia: o laço de realimentação entre microfone e caixa", s);
  };

  F.fase = () => {
    const x0 = 190, w = 500;
    let s = tx(400, 40, "Fase: ondas que se somam ou se anulam", { t: 26, a: "middle", w: 700 });
    s += tx(40, 100, "Em fase", { t: 18, w: 700, c: C.ver });
    s += lin(x0, 100, x0 + w, 100, C.grade, 1) + cam(onda(x0, 100, w, 22, 4, 0), C.az, 3) + cam(onda(x0, 100, w, 22, 4, 0), C.lar, 2, { d: "6 5" });
    s += tx(40, 150, "soma", { t: 17, c: C.mudo }) + lin(x0, 170, x0 + w, 170, C.grade, 1) + cam(onda(x0, 170, w, 40, 4, 0), C.ver, 5) + tx(760, 175, "2×", { t: 22, a: "end", w: 800, c: C.ver });
    s += tx(40, 260, "Fora de fase", { t: 18, w: 700, c: C.verm });
    s += lin(x0, 270, x0 + w, 270, C.grade, 1) + cam(onda(x0, 270, w, 22, 4, 0), C.az, 3) + cam(onda(x0, 270, w, 22, 4, Math.PI), C.lar, 3, { d: "6 5" });
    s += tx(40, 320, "soma", { t: 17, c: C.mudo }) + lin(x0, 340, x0 + w, 340, C.verm, 5) + tx(760, 345, "0", { t: 26, a: "end", w: 800, c: C.verm });
    s += tx(400, 410, "Dois microfones no mesmo som, com atraso, cancelam graves. Use o botão de polaridade (Ø).", { t: 16, a: "middle", c: C.am });
    return svg("Ondas em fase se somam e em oposição de fase se anulam", s);
  };

  F.palco_retorno = () => {
    let s = rect(60, 40, 680, 300, { rx: 14, f: "#0b1a22", s: C.linha, sw: 3, d: "10 6" }) + tx(400, 66, "PALCO", { t: 17, a: "middle", c: C.mudo }) + tx(400, 436, "PLATEIA", { t: 20, a: "middle", w: 700, c: C.mudo });
    const sx = 400, sy = 170;
    s += circ(sx, sy, 24, { f: C.pele }) + cam("M" + (sx - 34) + " " + (sy + 38) + " Q" + (sx - 34) + " " + (sy + 14) + " " + sx + " " + (sy + 14) + " Q" + (sx + 34) + " " + (sy + 14) + " " + (sx + 34) + " " + (sy + 38), C.pele, 6);
    // microfone à frente do cantor, apontado para ele
    s += circ(sx, sy + 66, 9, { f: "#cfe0e7" }) + lin(sx, sy + 40, sx, sy + 58, "#cfe0e7", 3);
    let p = ""; for (let k = 0; k <= 100; k++) { const t = 2 * Math.PI * k / 100, r = 0.5 * (1 - Math.cos(t)) * 78; p += (k ? "L" : "M") + r1(sx + r * Math.sin(t)) + " " + r1(sy + 66 - r * Math.cos(t)); }
    s += cam(p + "Z", C.az, 3, { f: C.az, op: 0.18 }) + tx(sx + 100, sy + 40, "microfone cardioide", { t: 15, c: C.az, w: 700 });
    s += tx(sx + 82, sy + 128, "ponto cego (rejeição)", { t: 14, c: C.mudo });
    // retorno (monitor) no ponto cego, apontando para o cantor
    s += '<polygon points="' + (sx - 44) + "," + (sy + 134) + " " + (sx + 44) + "," + (sy + 134) + " " + (sx + 30) + "," + (sy + 106) + " " + (sx - 30) + "," + (sy + 106) + '" fill="#27424f" stroke="' + C.lar + '" stroke-width="3"/>' + seta(sx, sy + 102, sx, sy + 78, C.lar, 3);
    s += tx(sx - 70, sy + 134, "retorno", { t: 16, a: "end", c: C.lar, w: 700 });
    // caixas principais ao lado, à frente da linha dos microfones
    s += rect(110, 220, 40, 66, { rx: 6, f: "#27424f", s: C.ver, sw: 3 }) + rect(650, 220, 40, 66, { rx: 6, f: "#27424f", s: C.ver, sw: 3 }) + tx(130, 310, "caixa", { t: 15, a: "middle", c: C.ver }) + tx(670, 310, "caixa", { t: 15, a: "middle", c: C.ver });
    s += seta(152, 255, 250, 372, C.ver, 2) + seta(648, 255, 550, 372, C.ver, 2);
    s += tx(400, 395, "Retorno no ponto cego do microfone, caixas principais à frente dele: menos microfonia.", { t: 16, a: "middle", c: C.am });
    return svg("Posição do retorno e das caixas em relação ao microfone cardioide", s);
  };
})(FIG);

/* ---- TEMA 3 — CANTO  e  TEMA 4 — MÚSICA (comum a cantores e músicos) ---- */
(function (H) {
  "use strict";
  const { C, F, svg, tx, rect, circ, lin, cam, seta, ponta, chip, onda, ondaH, grade, xf, teclado, pauta, nota, clave, claveF, r1, ic } = H;

  // cabeça de perfil olhando para a direita, centrada em (x,y)
  const perfil = (x, y, k) => { k = k || 1; return cam("M" + (x - 30 * k) + " " + (y - 36 * k) + " Q" + (x + 4 * k) + " " + (y - 60 * k) + " " + (x + 28 * k) + " " + (y - 30 * k) + " L" + (x + 36 * k) + " " + (y - 8 * k) + " L" + (x + 26 * k) + " " + (y - 4 * k) + " L" + (x + 28 * k) + " " + (y + 6 * k) + " Q" + (x + 24 * k) + " " + (y + 18 * k) + " " + (x + 10 * k) + " " + (y + 20 * k) + " L" + (x - 4 * k) + " " + (y + 40 * k) + " L" + (x - 34 * k) + " " + (y + 40 * k) + " Z", C.pele, 4, { f: C.pele, op: 0.18 }); };
  const micH = (x, y, c, k) => { k = k || 1; return rect(x - 11 * k, y - 18 * k, 22 * k, 36 * k, { rx: 11 * k, f: c || "#cfe0e7" }) + rect(x - 6 * k, y + 16 * k, 12 * k, 40 * k, { rx: 5 * k, f: "#8a97a0" }); };

  // ================================================================ TEMA 3 — CANTO
  F.mic_distancia = () => {
    const cs = [["Colado (< 2 cm)", "grave inflado, estouros de P e B", C.verm, 28, 0.25], ["Ideal (≈ 5 a 10 cm)", "voz cheia e clara", C.ver, 74, 0.9], ["Longe (> 20 cm)", "voz fraca, sala e microfonia", C.lar, 150, 0.5]];
    let s = "";
    cs.forEach(([n, d, c, dist, nivel], i) => {
      const x = 130 + i * 270, y = 150;
      s += rect(x - 120, 40, 240, 340, { rx: 16, f: c, op: 0.07, s: c, sw: 2 });
      s += perfil(x - 40, y, 1.05);
      const mx = x - 40 + 38 + [10, 38, 92][i];
      s += micH(mx + 10, y - 2, "#cfe0e7", 0.8);
      s += seta(x - 40 + 38, y - 6, mx - 6, y - 6, c, 3);
      s += tx(x, 262, n, { t: 18, a: "middle", w: 700, c: c }) + tx(x, 290, d.length > 26 ? [d.split(",")[0] + ",", d.split(",")[1] ? d.split(",")[1].trim() : ""] : d, { t: 14.5, a: "middle", c: C.txt });
      s += rect(x - 80, 340, 160, 12, { rx: 6, f: "#0b1a22", s: C.linha, sw: 1.5 }) + rect(x - 80, 340, 160 * nivel, 12, { rx: 6, f: c });
      s += tx(x, 372, "voz direta", { t: 13, a: "middle", c: C.mudo });
    });
    s += tx(400, 26, "Distância da boca ao microfone", { t: 22, a: "middle", w: 700 });
    return svg("Três distâncias da boca ao microfone: colado, ideal e longe", s);
  };

  F.proximidade = () => {
    const x0 = 80, w = 640, y0 = 70, h = 280;
    let s = grade(x0, y0, w, h, 6, 4);
    const curva = (b, c, nome, y) => { let d = ""; for (let i = 0; i <= 120; i++) { const f = 20 * Math.pow(1000, i / 120), g = b * Math.exp(-Math.pow(Math.log10(f / 60) / 0.62, 2)) * (f < 60 ? 1.3 : 1) + (f < 60 ? 0 : 0); const yy = y0 + h * 0.62 - g * 14 + 0; d += (i ? "L" : "M") + r1(xf(f, x0, w)) + " " + r1(yy); } return cam(d, c, 5); };
    s += lin(x0, y0 + h * 0.62, x0 + w, y0 + h * 0.62, C.linha, 1.5, "6 6");
    s += curva(0.9, C.ver, "") + curva(0.45, C.am, "") + curva(0.1, C.lar, "");
    // curvas de proximidade: sobe nos graves quanto mais perto
    s = grade(x0, y0, w, h, 6, 4) + lin(x0, y0 + h * 0.62, x0 + w, y0 + h * 0.62, C.linha, 1.5, "6 6");
    [[12, C.verm, "2 cm", 0.25], [5, C.ver, "10 cm", 0.55], [0, C.am, "30 cm", 1]].forEach(([db, c, n]) => {
      let d = ""; for (let i = 0; i <= 120; i++) { const f = 20 * Math.pow(1000, i / 120), b = db / (1 + Math.pow(f / 180, 1.6)); d += (i ? "L" : "M") + r1(xf(f, x0, w)) + " " + r1(y0 + h * 0.62 - b * 9); }
      s += cam(d, c, 5) + chip(x0 + w - 90, y0 + 12 + (c === C.verm ? 0 : c === C.ver ? 40 : 80), 84, 30, n, c, 17);
    });
    [20, 50, 100, 200, 500, "1k", "2k", "5k", "10k", "20k"].forEach((f) => { const v = typeof f === "string" ? parseFloat(f) * 1000 : f; s += tx(xf(v, x0, w), 376, f, { t: 15, a: "middle", c: C.mudo }); });
    s += tx(40, 70, "dB", { t: 15, c: C.mudo }) + tx(x0 + w / 2, 402, "frequência (Hz)", { t: 15, a: "middle", c: C.mudo });
    s += tx(400, 438, "Quanto mais perto, mais graves: é o efeito de proximidade dos microfones direcionais.", { t: 17, a: "middle", c: C.am });
    s += tx(400, 40, "Efeito de proximidade", { t: 26, a: "middle", w: 700 });
    return svg("Efeito de proximidade: graves aumentam quanto mais perto do microfone", s);
  };

  F.mic_manuseio = () => {
    const mic = (x, y, rot) => '<g transform="rotate(' + rot + " " + x + " " + y + ')">' + circ(x, y - 40, 24, { f: "#cfe0e7", op: 0.5, s: "#cfe0e7", sw: 3 }) + '<path d="M' + (x - 14) + " " + (y - 24) + " L" + (x + 14) + " " + (y - 24) + " L" + (x + 9) + " " + (y + 70) + " L" + (x - 9) + " " + (y + 70) + ' Z" fill="#6a7e88" stroke="#cfe0e7" stroke-width="3"/></g>';
    let s = "";
    // 1: mão cobrindo a grade (errado)
    s += rect(30, 50, 240, 320, { rx: 16, f: C.verm, op: 0.08, s: C.verm, sw: 2 });
    s += mic(150, 170, 0) + circ(150, 134, 34, { f: C.pele, op: 0.55, s: C.pele, sw: 3 }) + rect(128, 120, 44, 26, { rx: 12, f: C.pele, op: 0.6 }) + H.ic.cruz(150, 52, C.verm, 0.7).replace(/\b50\b/, "50") ;
    s += tx(150, 300, "Mão na grade", { t: 20, a: "middle", w: 700, c: C.verm }) + tx(150, 324, ["abafa o som e provoca", "microfonia"], { t: 14.5, a: "middle", c: C.txt });
    // 2: segurando pelo corpo (certo)
    s += rect(290, 50, 240, 320, { rx: 16, f: C.ver, op: 0.08, s: C.ver, sw: 2 });
    s += mic(410, 150, 0) + rect(392, 190, 36, 40, { rx: 14, f: C.pele, op: 0.7 }) + H.ic.check(410, 52, C.ver, 0.7);
    s += tx(410, 300, "Segure pelo corpo", { t: 20, a: "middle", w: 700, c: C.ver }) + tx(410, 324, ["grade livre, microfone", "apontado para a boca"], { t: 14.5, a: "middle", c: C.txt });
    // 3: ângulo contra os "P"
    s += rect(550, 50, 220, 320, { rx: 16, f: C.az, op: 0.08, s: C.az, sw: 2 });
    s += circ(600, 150, 28, { f: C.pele, op: 0.55, s: C.pele, sw: 3 }) + mic(690, 200, -60);
    s += seta(628, 150, 668, 152, C.lar, 3) + cam("M630 168 Q700 120 740 100", C.lar, 2, { d: "5 4" }) + tx(716, 90, "ar do P/B", { t: 13, a: "middle", c: C.lar });
    s += tx(660, 300, "Levemente de lado", { t: 20, a: "middle", w: 700, c: C.az }) + tx(660, 324, ["o sopro dos P e B passa", "ao lado da cápsula"], { t: 14.5, a: "middle", c: C.txt });
    s += tx(400, 410, "Cantou, passou a mão, apontou para a caixa: apitou. Cuide do microfone como parte do instrumento.", { t: 16, a: "middle", c: C.mudo });
    return svg("Como segurar o microfone: onde pôr a mão e o ângulo ideal", s);
  };

  F.regras_mic = () => {
    const r = [["Segure pelo corpo", ic.mic, C.az], ["Não cubra a grade", ic.cruz, C.verm], ["Distância constante", ic.sliders, C.ver], ["Nunca aponte p/ caixa", ic.caixa, C.lar], ["Não sopre nem bata", ic.cruz, C.rosa], ["Mute antes de plugar", ic.check, C.am], ["Ouça o retorno", ic.ouvido, C.rox], ["Respeite o ganho", ic.amp, C.az]];
    let s = tx(400, 38, "Regras de ouro do microfone", { t: 26, a: "middle", w: 700 });
    r.forEach(([n, f, c], i) => {
      const x = 30 + (i % 4) * 190, y = 70 + Math.floor(i / 4) * 175;
      s += rect(x, y, 175, 155, { rx: 16, f: c, op: 0.1, s: c, sw: 2 }) + circ(x + 24, y + 24, 16, { f: c }) + tx(x + 24, y + 31, i + 1, { t: 20, a: "middle", w: 800, c: "#04151d" }) + f(x + 98, y + 70, c, 1.1) + tx(x + 87, y + 138, n, { t: 15, a: "middle", w: 700, c: C.txt });
    });
    return svg("Regras de ouro do microfone", s);
  };

  F.respiracao = () => {
    let s = "";
    const corpo = (cx, vol, titulo, c, seta2) => {
      let g = rect(cx - 110, 50, 220, 340, { rx: 16, f: c, op: 0.06, s: c, sw: 2 });
      g += circ(cx, 100, 26, { f: C.pele, op: 0.8 }) + lin(cx, 126, cx, 150, C.pele, 8) + cam("M" + (cx - 62) + " 162 Q" + cx + " 140 " + (cx + 62) + " 162 L" + (cx + 52 + vol * 10) + " 300 Q" + cx + " 316 " + (cx - 52 - vol * 10) + " 300 Z", C.pele, 4, { f: C.pele, op: 0.08 });
      g += '<ellipse cx="' + (cx - 24) + '" cy="206" rx="' + (18 + vol * 7) + '" ry="' + (44 + vol * 12) + '" fill="' + C.az + '" fill-opacity="0.45" stroke="' + C.az + '" stroke-width="3"/><ellipse cx="' + (cx + 24) + '" cy="206" rx="' + (18 + vol * 7) + '" ry="' + (44 + vol * 12) + '" fill="' + C.az + '" fill-opacity="0.45" stroke="' + C.az + '" stroke-width="3"/>';
      g += cam("M" + (cx - 56) + " " + (258 + (vol ? 22 : 0)) + " Q" + cx + " " + (236 + (vol ? 40 : 0)) + " " + (cx + 56) + " " + (258 + (vol ? 22 : 0)), C.am, 6);
      g += tx(cx, vol ? 296 : 288, "diafragma", { t: 12.5, a: "middle", c: C.am, w: 700 });
      g += seta2;
      g += tx(cx, 360, titulo, { t: 20, a: "middle", w: 700, c: c });
      return g;
    };
    s += corpo(150, 0, "Expirar / cantar", C.lar, seta(150, 330, 150, 308, C.lar, 3).replace(/^$/, ""));
    s += corpo(400, 1, "Inspirar", C.ver, seta(300, 262, 300, 296, C.ver, 3) + seta(500, 262, 500, 296, C.ver, 3));
    // postura
    s += rect(560, 50, 210, 340, { rx: 16, f: C.az, op: 0.06, s: C.az, sw: 2 });
    s += lin(665, 80, 665, 360, C.az, 3, "6 5") + circ(665, 110, 24, { f: C.pele, op: 0.8 }) + lin(665, 134, 665, 280, C.pele, 10) + lin(665, 280, 645, 336, C.pele, 8) + lin(665, 280, 685, 336, C.pele, 8) + lin(665, 160, 625, 230, C.pele, 7) + lin(665, 160, 705, 230, C.pele, 7);
    s += tx(665, 360, "Postura alinhada", { t: 18, a: "middle", w: 700, c: C.az }) + tx(665, 382, "ouvido · ombro · quadril", { t: 13, a: "middle", c: C.mudo });
    s += tx(400, 30, "Respiração e postura do cantor", { t: 22, a: "middle", w: 700 });
    return svg("Respiração com o diafragma e postura alinhada para cantar", s);
  };

  F.tessitura = () => {
    const faixas = [["Soprano", 60, 84, C.rosa], ["Mezzo", 57, 81, C.rox], ["Contralto", 53, 77, C.az], ["Tenor", 48, 72, C.ver], ["Barítono", 45, 69, C.am], ["Baixo", 40, 64, C.lar]];
    const tk = teclado(60, 66, 680, 120, 36, 4, {}, true);
    let s = tk.s;
    // posição horizontal: nota natural → centro da tecla
    const px = (m) => tk.x(m);
    [36, 48, 60, 72, 84].forEach((m, i) => (s += tx(px(m), 204, "Dó" + (i + 2), { t: 14, a: "middle", c: C.mudo })));
    faixas.forEach(([n, a, b, c], i) => { const y = 230 + i * 30; s += rect(px(a) - 8, y, px(b) - px(a) + 16, 22, { rx: 11, f: c, op: 0.9 }) + tx(px(a) - 14, y + 17, n, { t: 15, a: "end", w: 700, c: c }).replace(/x="[\d.]+"/, 'x="' + Math.max(50, px(a) - 14) + '"'); });
    s += tx(400, 40, "Extensão aproximada de cada tipo de voz", { t: 24, a: "middle", w: 700 });
    s += tx(400, 438, "Dó4 = Dó central. Valores aproximados: variam de pessoa para pessoa e conforme a escola.", { t: 14.5, a: "middle", c: C.mudo });
    return svg("Extensão das vozes sobre um teclado: soprano, mezzo, contralto, tenor, barítono e baixo", s);
  };

  // ================================================================ TEMA 4 — MÚSICA (COMUM)
  F.mel_harm_rit = () => {
    let s = "";
    const col = [["MELODIA", "a linha que se canta", C.az], ["HARMONIA", "notas juntas: acordes", C.ver], ["RITMO", "a organização no tempo", C.lar]];
    col.forEach(([n, d, c], i) => { const x = 20 + i * 260; s += rect(x, 40, 240, 370, { rx: 16, f: c, op: 0.07, s: c, sw: 2 }) + tx(x + 120, 80, n, { t: 22, a: "middle", w: 800, c: c }) + tx(x + 120, 104, d, { t: 14, a: "middle", c: C.mudo }); });
    // melodia
    const my = 230; s += '<g transform="translate(140 ' + my + ') scale(1.18) translate(-140 -' + my + ')">' + pauta(36, my, 208) + clave(38, my + 12, 54);
    [[88, 0], [112, 2], [136, 4], [160, 3], [184, 5], [208, 4]].forEach(([x, n], i, a) => { s += nota(x, my, n, { haste: true }); if (i) s += cam("M" + (a[i - 1][0] + 8) + " " + (my - a[i - 1][1] * 5) + " Q" + ((a[i - 1][0] + x) / 2) + " " + (my - Math.max(a[i - 1][1], n) * 5 - 20) + " " + (x - 4) + " " + (my - n * 5), C.az, 2, { d: "4 4" }); });
    s += "</g>";
    s += tx(140, 330, "uma nota de cada vez,", { t: 15, a: "middle", c: C.txt }) + tx(140, 350, "formando uma \"frase\"", { t: 15, a: "middle", c: C.txt });
    // harmonia
    const hy = 230; s += '<g transform="translate(400 ' + hy + ') scale(1.18) translate(-400 -' + hy + ')">' + pauta(296, hy, 208) + clave(298, hy + 12, 54);
    [[352, [-2, 0, 2]], [400, [1, 3, 5]], [448, [2, 4, 6]]].forEach(([x, ns]) => (ns.forEach((n) => (s += nota(x, hy, n, { haste: false, vazia: false })))));
    s += "</g>";
    s += tx(400, 330, "várias notas ao mesmo tempo:", { t: 15, a: "middle", c: C.txt }) + tx(400, 350, "dão a \"base\" à melodia", { t: 15, a: "middle", c: C.txt });
    // ritmo
    const ry = 240;
    [[1, 0, "♩"], [1, 1, "♩"], [0.5, 2, "♪"], [0.5, 2.5, "♪"], [1, 3, "♩"]].forEach(([d, t, g]) => { const x = 556 + t * 40, w = d * 40 - 4; s += rect(x, ry - (d === 1 ? 70 : 45), w, d === 1 ? 70 : 45, { rx: 5, f: C.lar, op: 0.85 }); });
    for (let i = 0; i < 4; i++) s += lin(556 + i * 40 + 20, ry + 14, 556 + i * 40 + 20, ry + 30, C.mudo, 2) + circ(556 + i * 40 + 20, ry + 40, 5, { f: i === 0 ? C.am : C.mudo });
    s += tx(660, 300, "pulso (batida) constante", { t: 14, a: "middle", c: C.mudo });
    s += tx(660, 330, "durações longas e curtas", { t: 15, a: "middle", c: C.txt }) + tx(660, 350, "sobre o pulso", { t: 15, a: "middle", c: C.txt });
    s += tx(400, 436, "Cantor e instrumentista precisam dominar os três.", { t: 18, a: "middle", c: C.am, w: 600 });
    return svg("Melodia, harmonia e ritmo", s);
  };

  F.compasso = () => {
    let s = tx(400, 40, "Pulso e compasso", { t: 26, a: "middle", w: 700 });
    const fila = (y, n, nome, c) => {
      s += tx(44, y + 8, nome, { t: 30, w: 800, c: c });
      for (let m = 0; m < 2; m++) {
        for (let i = 0; i < n; i++) { const x = 150 + (m * n + i) * (i === 0 && false ? 0 : 0) + (m * (n * 66 + 24)) + i * 66, forte = i === 0; s += circ(x + 20, y, forte ? 22 : 15, { f: forte ? c : "none", s: c, sw: 3, op: 0.9 }) + tx(x + 20, y + 6, i + 1, { t: forte ? 20 : 16, a: "middle", w: 800, c: forte ? "#04151d" : c }); }
        s += lin(150 + m * (n * 66 + 24) - 12, y - 32, 150 + m * (n * 66 + 24) - 12, y + 32, C.mudo, 3);
      }
      s += lin(150 + 2 * (n * 66 + 24) - 12, y - 32, 150 + 2 * (n * 66 + 24) - 12, y + 32, C.mudo, 3);
    };
    fila(110, 4, "4/4", C.az); fila(200, 3, "3/4", C.ver); fila(290, 2, "2/4", C.lar);
    s += tx(400, 156, "forte · fraco · meio-forte · fraco", { t: 14, a: "middle", c: C.mudo }) + tx(400, 246, "forte · fraco · fraco", { t: 14, a: "middle", c: C.mudo }) + tx(400, 336, "forte · fraco", { t: 14, a: "middle", c: C.mudo });
    s += rect(40, 356, 720, 66, { rx: 12, f: C.bg2, s: C.linha }) + tx(400, 384, "Barra = fim do compasso. O 1º tempo é o mais forte.", { t: 18, a: "middle" }) + tx(400, 408, "Andamento em BPM: 60 BPM = 1 batida por segundo · 120 BPM = 2 por segundo.", { t: 16, a: "middle", c: C.am });
    return svg("Compassos 4/4, 3/4 e 2/4 com tempos fortes e fracos", s);
  };

  F.figuras = () => {
    const f = [["Semibreve", 4, "𝅝"], ["Mínima", 2, "𝅗𝅥"], ["Semínima", 1, "𝅘𝅥"], ["Colcheia", 0.5, "𝅘𝅥𝅮"], ["Semicolcheia", 0.25, "𝅘𝅥𝅯"]];
    let s = tx(400, 40, "Figuras de duração (quanto cada uma dura)", { t: 24, a: "middle", w: 700 });
    f.forEach(([n, d, g], i) => {
      const y = 76 + i * 64, w = 460 * d / 4;
      s += tx(30, y + 30, n, { t: 19, w: 700 }) + rect(210, y, Math.max(w, 14), 42, { rx: 8, f: [C.az, C.ver, C.am, C.lar, C.rosa][i], op: 0.9 }) + tx(224 + Math.max(w, 14), y + 30, d === 4 ? "4 tempos" : d === 2 ? "2 tempos" : d === 1 ? "1 tempo" : d === 0.5 ? "½ tempo" : "¼ de tempo", { t: 20, w: 700, c: C.txt });
      // cabeça de nota desenhada (sem depender de fonte)
      const x = 192, cy = y + 24, vazia = d >= 2;
      s += '<ellipse cx="' + x + '" cy="' + (cy + 8) + '" rx="11" ry="8" transform="rotate(-20 ' + x + " " + (cy + 8) + ')" fill="' + (vazia ? "none" : C.txt) + '" stroke="' + C.txt + '" stroke-width="2.4"/>' + (d < 4 ? lin(x + 10, cy + 4, x + 10, cy - 26, C.txt, 2.4) : "") + (d <= 0.5 ? cam("M" + (x + 10) + " " + (cy - 26) + " q14 6 10 22", C.txt, 2.4) : "") + (d <= 0.25 ? cam("M" + (x + 10) + " " + (cy - 14) + " q14 6 10 22", C.txt, 2.4) : "");
    });
    s += tx(400, 420, "Cada figura vale a metade da anterior.", { t: 18, a: "middle", c: C.am, w: 600 });
    return svg("Figuras rítmicas e suas durações relativas", s);
  };

  F.escala = () => {
    let s = "";
    const maior = [60, 62, 64, 65, 67, 69, 71, 72], pass1 = ["T", "T", "S", "T", "T", "T", "S"];
    const d1 = {}; maior.forEach((m) => (d1[m] = "#86d4f0"));
    const k1 = teclado(60, 70, 680, 120, 60, 1, d1, true);
    s += k1.s + tx(400, 40, "Escala maior (Dó maior)", { t: 22, a: "middle", w: 700, c: C.az });
    maior.forEach((m, i) => (s += tx(k1.x(m), 176, i + 1, { t: 16, a: "middle", w: 800, c: "#04151d" })));
    pass1.forEach((p, i) => { const xa = k1.x(maior[i]), xb = k1.x(maior[i + 1]); s += cam("M" + xa + " 202 Q" + (xa + xb) / 2 + " 222 " + xb + " 202", p === "S" ? C.verm : C.am, 3) + tx((xa + xb) / 2, 242, p, { t: 18, a: "middle", w: 800, c: p === "S" ? C.verm : C.am }); });
    s += tx(400, 292, "Escala menor natural (Lá menor): outro padrão de tons e semitons", { t: 19, a: "middle", w: 700, c: C.ver });
    ["Lá", "Si", "Dó", "Ré", "Mi", "Fá", "Sol", "Lá"].forEach((n, i) => { s += rect(52 + i * 84, 316, 72, 44, { rx: 12, f: C.ver, op: 0.22, s: C.ver, sw: 2 }) + tx(88 + i * 84, 346, n, { t: 22, a: "middle", w: 800 }); if (i < 7) s += tx(52 + i * 84 + 78, 380, ["T", "S", "T", "T", "S", "T", "T"][i], { t: 18, a: "middle", w: 800, c: ["T", "S", "T", "T", "S", "T", "T"][i] === "S" ? C.verm : C.am }); });
    s += tx(400, 436, "T = tom (2 semitons)   ·   S = semitom (teclas vizinhas, sem tecla no meio)", { t: 16, a: "middle", c: C.mudo });
    return svg("Escala maior de Dó com tons e semitons", s);
  };

  F.acorde = () => {
    let s = tx(400, 40, "Tríade: três notas, intervalos de terça", { t: 24, a: "middle", w: 700 });
    const bloco = (x0, dest, titulo, passos, c) => {
      const k = teclado(x0, 100, 350, 130, 60, 1, dest, true);
      return k.s + tx(x0 + 175, 80, titulo, { t: 22, a: "middle", w: 800, c: c }) + (passos || []).map(([m1, m2, rot]) => cam("M" + k.x(m1) + " 246 Q" + (k.x(m1) + k.x(m2)) / 2 + " 270 " + k.x(m2) + " 246", c, 3) + tx((k.x(m1) + k.x(m2)) / 2, 294, rot, { t: 16, a: "middle", w: 700, c: c })).join("");
    };
    s += bloco(30, { 60: "#86d4f0", 64: "#86d4f0", 67: "#86d4f0" }, "Dó maior (alegre)", [[60, 64, "4 semitons"], [64, 67, "3 semitons"]], C.az);
    s += bloco(420, { 60: "#a8e3b0", 63: "#a8e3b0", 67: "#a8e3b0" }, "Dó menor (triste)", [[60, 63, "3 semitons"], [63, 67, "4 semitons"]], C.ver);
    s += rect(60, 330, 680, 80, { rx: 14, f: C.bg2, s: C.linha }) + tx(400, 362, "Maior = terça maior (4) + menor (3).  Menor = terça menor (3) + maior (4).", { t: 18, a: "middle", w: 600 }) + tx(400, 390, "Fundamental · terça · quinta  →  Dó · Mi · Sol", { t: 17, a: "middle", c: C.am });
    return svg("Acordes de Dó maior e Dó menor no teclado", s);
  };

  F.dinamica = () => {
    const d = [["pp", "pianíssimo", "muito fraco", 0.15], ["p", "piano", "fraco", 0.3], ["mp", "mezzo piano", "meio fraco", 0.45], ["mf", "mezzo forte", "meio forte", 0.6], ["f", "forte", "forte", 0.8], ["ff", "fortíssimo", "muito forte", 1]];
    let s = tx(400, 40, "Dinâmica: a intensidade da música", { t: 26, a: "middle", w: 700 });
    d.forEach(([a, n, s2, v], i) => {
      const x = 40 + i * 120, h = 40 + v * 180;
      s += rect(x, 270 - h, 100, h, { rx: 10, f: C.az, op: 0.15 + v * 0.7 }) + '<text x="' + (x + 50) + '" y="' + (270 - h + 52) + '" font-size="42" font-weight="800" font-style="italic" font-family="Georgia, serif" fill="#fff" text-anchor="middle">' + a + "</text>" + tx(x + 50, 296, n, { t: 15, a: "middle", w: 700 }) + tx(x + 50, 316, s2, { t: 13, a: "middle", c: C.mudo });
    });
    s += cam("M60 372 L330 352 M60 372 L330 392", C.am, 4) + tx(195, 420, "crescendo (aumentando)", { t: 17, a: "middle", c: C.am, w: 700 });
    s += cam("M470 352 L740 372 M470 392 L740 372", C.lar, 4) + tx(605, 420, "decrescendo (diminuindo)", { t: 17, a: "middle", c: C.lar, w: 700 });
    return svg("Níveis de dinâmica de pianíssimo a fortíssimo, crescendo e decrescendo", s);
  };

  F.afinacao = () => {
    let s = "";
    const cx = 210, cy = 280, R = 150;
    s += cam("M" + (cx - R) + " " + cy + " A " + R + " " + R + " 0 0 1 " + (cx + R) + " " + cy, C.linha, 6);
    for (let i = -5; i <= 5; i++) { const a = (-90 + i * 14) * Math.PI / 180, r1_ = R - 8, r2_ = R + 10; s += lin(cx + r1_ * Math.cos(a), cy + r1_ * Math.sin(a), cx + r2_ * Math.cos(a), cy + r2_ * Math.sin(a), i === 0 ? C.ver : C.mudo, i === 0 ? 5 : 2); }
    s += cam("M" + (cx - R) + " " + cy + " A " + R + " " + R + " 0 0 1 " + (cx - R * 0.5) + " " + (cy - R * 0.87), C.verm, 6) + cam("M" + (cx + R * 0.5) + " " + (cy - R * 0.87) + " A " + R + " " + R + " 0 0 1 " + (cx + R) + " " + cy, C.verm, 6);
    s += cam("M" + (cx - R * 0.2) + " " + (cy - R * 0.98) + " A " + R + " " + R + " 0 0 1 " + (cx + R * 0.2) + " " + (cy - R * 0.98), C.ver, 8);
    const a = (-90 + 24) * Math.PI / 180;
    s += lin(cx, cy, cx + (R - 14) * Math.cos(a), cy + (R - 14) * Math.sin(a), C.am, 5) + circ(cx, cy, 11, { f: C.am });
    s += tx(cx - R + 10, cy + 34, "♭ baixo", { t: 18, c: C.verm, w: 700 }) + tx(cx + R - 10, cy + 34, "alto ♯", { t: 18, a: "end", c: C.verm, w: 700 }) + tx(cx, cy - R - 20, "afinado", { t: 18, a: "middle", c: C.ver, w: 700 });
    s += tx(cx, 360, "Lá = 440 Hz", { t: 26, a: "middle", w: 800 }) + tx(cx, 388, "o afinador mostra a diferença em cents", { t: 15, a: "middle", c: C.mudo });
    // batimento
    const x0 = 440, w = 330;
    s += tx(x0 + w / 2, 62, "Dois sons quase iguais \"batem\"", { t: 19, a: "middle", w: 700 });
    let d1 = "", d2 = "", d3 = "", env = "", env2 = ""; for (let i = 0; i <= 400; i++) { const t = i / 400, y1 = Math.sin(2 * Math.PI * 24 * t), y2 = Math.sin(2 * Math.PI * 26 * t); d1 += (i ? "L" : "M") + r1(x0 + w * t) + " " + r1(120 - 22 * y1); d2 += (i ? "L" : "M") + r1(x0 + w * t) + " " + r1(196 - 22 * y2); const e = Math.cos(2 * Math.PI * 1 * t) * 1; d3 += (i ? "L" : "M") + r1(x0 + w * t) + " " + r1(290 - 36 * (y1 + y2) / 2 * 1.0); env += (i ? "L" : "M") + r1(x0 + w * t) + " " + r1(290 - 36 * Math.abs(Math.cos(2 * Math.PI * t))); env2 += (i ? "L" : "M") + r1(x0 + w * t) + " " + r1(290 + 36 * Math.abs(Math.cos(2 * Math.PI * t))); }
    s += cam(d1, C.az, 2) + tx(x0, 94, "440 Hz", { t: 14, c: C.az }) + cam(d2, C.lar, 2) + tx(x0, 170, "442 Hz", { t: 14, c: C.lar }) + cam(d3, C.ver, 2.5) + cam(env, C.am, 3, { d: "6 4" }) + cam(env2, C.am, 3, { d: "6 4" });
    s += tx(x0 + w / 2, 350, "o volume \"pulsa\" 2 vezes por segundo", { t: 15, a: "middle", c: C.am }) + tx(x0 + w / 2, 372, "(diferença de 2 Hz)", { t: 14, a: "middle", c: C.mudo }) + tx(x0 + w / 2, 410, "Quando as batidas somem, está afinado.", { t: 17, a: "middle", c: C.ver, w: 700 });
    return svg("Afinador com ponteiro e batimento entre dois sons quase iguais", s);
  };

  F.click = () => {
    let s = tx(400, 40, "Tocar e cantar com click ou playback", { t: 24, a: "middle", w: 700 });
    const x0 = 190, w = 560, rows = [["Click (no fone)", C.am, 100], ["Playback", C.az, 190], ["Você", C.ver, 280]];
    rows.forEach(([n, c, y]) => { s += tx(40, y + 6, n, { t: 18, w: 700, c: c }) + lin(x0, y, x0 + w, y, C.grade, 1.5); });
    for (let i = 0; i < 9; i++) { const x = x0 + i * 70; s += lin(x, 82, x, 300, C.grade, 1, "3 6") + rect(x - 3, 90, 6, i % 4 === 0 ? 20 : 12, { rx: 2, f: C.am }) + tx(x, 318, (i % 4) + 1, { t: 14, a: "middle", c: C.mudo }); }
    s += cam(ondaH(x0, 190, w, 26, 40, [[1, 1], [2, 0.4]], 600), C.az, 2);
    [[0, 1], [1, 1], [2, 1], [3, 1], [4, 2], [6, 1], [7, 1]].forEach(([t, d]) => (s += rect(x0 + t * 70 + 4, 266, d * 70 - 8, 28, { rx: 8, f: C.ver, op: 0.85 })));
    s += rect(40, 346, 720, 70, { rx: 12, f: C.bg2, s: C.linha }) + tx(400, 376, "O click é a régua do tempo: quem entra adiantado ou atrasado aparece na hora.", { t: 17, a: "middle" }) + tx(400, 402, "No grupo, todos escutam o mesmo pulso — por isso o fone ou retorno com click.", { t: 15, a: "middle", c: C.mudo });
    return svg("Linha do tempo com click, playback e execução alinhados", s);
  };
})(FIG);

/* ---- TEMA 5 — MÚSICOS  e  TEMA 6 — REGÊNCIA ---- */
(function (H) {
  "use strict";
  const { C, F, svg, tx, rect, circ, lin, cam, seta, ponta, chip, onda, grade, xf, pauta, nota, clave, claveF, r1, ic } = H;

  // ================================================================ TEMA 5 — MÚSICOS
  F.espaco_mix = () => {
    const x0 = 120, w = 640;
    const it = [["Bumbo", [[45, 110, 1], [2500, 5000, 0.45]], C.lar], ["Baixo", [[40, 400, 1]], C.verm], ["Violão", [[80, 5000, 1]], C.ver], ["Guitarra", [[100, 5000, 1]], C.am], ["Teclado", [[60, 4000, 1]], C.rox], ["Voz", [[100, 4000, 1]], C.rosa], ["Pratos", [[3000, 16000, 1]], C.az]];
    let s = tx(400, 36, "Cada instrumento ocupa uma faixa do espectro", { t: 22, a: "middle", w: 700 });
    s += rect(xf(200, x0, w), 56, xf(500, x0, w) - xf(200, x0, w), 322, { rx: 6, f: C.verm, op: 0.12, s: C.verm, sw: 1.5, d: "6 5" }) + tx((xf(200, x0, w) + xf(500, x0, w)) / 2, 400, "zona congestionada", { t: 14, a: "middle", c: C.verm, w: 700 });
    [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000].forEach((f) => (s += lin(xf(f, x0, w), 56, xf(f, x0, w), 378, C.grade, 1) + tx(xf(f, x0, w), 424, f >= 1000 ? f / 1000 + "k" : f, { t: 14, a: "middle", c: C.mudo })));
    it.forEach(([n, segs, c], i) => { const y = 64 + i * 44; s += tx(14, y + 24, n, { t: 17, w: 700, c: c }); segs.forEach(([a, b, o]) => (s += rect(xf(a, x0, w), y, xf(b, x0, w) - xf(a, x0, w), 32, { rx: 16, f: c, op: 0.55 + 0.35 * o }))); });
    return svg("Faixas de frequência ocupadas por bumbo, baixo, violão, guitarra, teclado, voz e pratos", s);
  };

  F.mix_banda = () => {
    let s = tx(400, 36, "O palco sonoro visto de cima", { t: 24, a: "middle", w: 700 });
    s += '<path d="M60 380 Q400 40 740 380 Z" fill="#12303d" fill-opacity="0.55" stroke="' + C.linha + '" stroke-width="2"/>';
    s += tx(60, 408, "ESQUERDA", { t: 14, c: C.mudo }) + tx(740, 408, "DIREITA", { t: 14, c: C.mudo, a: "end" }) + tx(400, 408, "PLATEIA", { t: 14, c: C.mudo, a: "middle" });
    const p = [["Voz", 400, 300, 46, C.rosa], ["Bumbo", 400, 200, 28, C.lar], ["Baixo", 455, 215, 26, C.verm], ["Violão", 300, 270, 28, C.ver], ["Guitarra", 250, 220, 30, C.am], ["Teclado", 560, 240, 30, C.rox], ["Backing", 520, 310, 24, C.rosa], ["Pratos", 330, 170, 22, C.az]];
    p.forEach(([n, x, y, r, c]) => (s += circ(x, y, r, { f: c, op: 0.3, s: c, sw: 3 }) + tx(x, y + 5, n, { t: n === "Voz" ? 20 : 13.5, a: "middle", w: 700 })));
    s += seta(130, 330, 130, 130, C.am, 2) + tx(146, 150, "fundo: menos", { t: 13, c: C.am }) + tx(146, 166, "volume, mais reverb", { t: 13, c: C.am });
    s += tx(400, 430, "Voz à frente · base (bumbo e baixo) ao centro · harmonia aberta nos lados", { t: 16, a: "middle", c: C.am });
    return svg("Posição dos instrumentos no palco sonoro: voz à frente, base ao centro, harmonia nos lados", s);
  };

  F.mic_instrumentos = () => {
    let s = tx(400, 30, "Onde colocar o microfone", { t: 22, a: "middle", w: 700 });
    const card = (i, c, titulo, dica) => { const x = 20 + i * 195; return rect(x, 50, 185, 360, { rx: 16, f: c, op: 0.08, s: c, sw: 2 }) + tx(x + 92, 350, titulo, { t: 17, a: "middle", w: 800, c: c }) + tx(x + 92, 374, dica, { t: 13, a: "middle", c: C.txt }); };
    // violão
    s += card(0, C.ver, "Violão", ["12ª casa, 15 a 20 cm"]);
    s += circ(110, 220, 54, { f: C.lar, op: 0.35, s: C.lar, sw: 3 }) + circ(110, 150, 36, { f: C.lar, op: 0.35, s: C.lar, sw: 3 }) + circ(110, 214, 16, { f: "#0b1a22", s: "#5a3a1a", sw: 4 }) + rect(103, 70, 14, 80, { rx: 3, f: "#6a4a2a" });
    s += H.ic.mic(150, 150, "#cfe0e7", 0.7) + seta(148, 124, 124, 108, C.ver, 2) + tx(70, 100, "12ª casa", { t: 12.5, c: C.ver, w: 700 });
    // amp
    s += card(1, C.am, "Amplificador", ["borda do cone, 2 a 5 cm"]);
    s += rect(240, 130, 130, 170, { rx: 10, f: "#1a3340", s: C.am, sw: 3 }) + circ(305, 215, 52, { s: C.am, sw: 4 }) + circ(305, 215, 18, { f: C.am, op: 0.5 });
    s += H.ic.mic(350, 190, "#cfe0e7", 0.6) + seta(335, 200, 322, 205, C.am, 2);
    // caixa
    s += card(2, C.lar, "Caixa da bateria", ["cima, ~5 cm da borda"]);
    s += '<ellipse cx="500" cy="190" rx="62" ry="22" fill="#27424f" stroke="' + C.lar + '" stroke-width="3"/><path d="M438 190 V250 Q500 282 562 250 V190" fill="#1a3340" stroke="' + C.lar + '" stroke-width="3"/>';
    s += '<g transform="rotate(35 540 150)">' + H.ic.mic(540, 130, "#cfe0e7", 0.6) + "</g>" + seta(526, 165, 516, 183, C.lar, 2);
    s += tx(500, 306, ["+ microfones no bumbo", "e nos pratos (overhead)"], { t: 11.5, a: "middle", c: C.mudo });
    // teclado
    s += card(3, C.rox, "Teclado / baixo", ["direto na caixa DI"]);
    s += rect(610, 150, 150, 70, { rx: 8, f: "#1a3340", s: C.rox, sw: 3 }); for (let k = 0; k < 8; k++) s += rect(618 + k * 17, 190, 15, 28, { rx: 2, f: "#e9f0f3" });
    s += seta(685, 226, 685, 262, C.rox, 3) + rect(650, 264, 70, 34, { rx: 8, f: C.am, op: 0.2, s: C.am }) + tx(685, 287, "DI", { t: 18, a: "middle", w: 800, c: C.am });
    return svg("Posição do microfone para violão, amplificador, caixa da bateria e teclado", s);
  };

  F.passagem = () => {
    const passos = [["Bumbo", C.lar], ["Caixa", C.lar], ["Tons e pratos", C.lar], ["Baixo", C.verm], ["Guitarra", C.am], ["Teclado", C.rox], ["Violão", C.ver], ["Vozes", C.rosa], ["Todos juntos", C.az]];
    let s = tx(400, 40, "Passagem de som: uma fonte de cada vez", { t: 24, a: "middle", w: 700 });
    passos.forEach(([n, c], i) => {
      const lin1 = i < 5, x = lin1 ? 40 + i * 148 : 114 + (i - 5) * 148, y = lin1 ? 100 : 230;
      s += rect(x, y, 128, 90, { rx: 16, f: c, op: 0.14, s: c, sw: 2 }) + circ(x + 24, y + 24, 16, { f: c }) + tx(x + 24, y + 31, i + 1, { t: 19, a: "middle", w: 800, c: "#04151d" }) + tx(x + 64, y + 68, n, { t: n.length > 10 ? 15 : 18, a: "middle", w: 700 });
      if (i < 4) s += seta(x + 130, y + 45, x + 146, y + 45, C.mudo, 3);
      if (i >= 5 && i < 8) s += seta(x + 130, y + 45, x + 146, y + 45, C.mudo, 3);
    });
    s += cam("M690 192 Q690 214 560 214 L150 214 Q114 214 114 228", C.mudo, 2.5, { d: "5 5" });
    s += tx(400, 372, "Em cada um: ganho → equalização → retorno do músico. No fim, toque a música inteira.", { t: 17, a: "middle", c: C.am });
    s += tx(400, 402, "Mexa pouco depois de ajustado e peça o \"volume de show\" para acertar de verdade.", { t: 15, a: "middle", c: C.mudo });
    return svg("Ordem sugerida da passagem de som", s);
  };

  // ================================================================ TEMA 6 — REGÊNCIA
  const regenteCostas = (x, y, k) => { k = k || 1; return circ(x, y - 40 * k, 18 * k, { f: C.pele }) + cam("M" + (x - 40 * k) + " " + (y + 40 * k) + " Q" + (x - 40 * k) + " " + (y - 14 * k) + " " + x + " " + (y - 14 * k) + " Q" + (x + 40 * k) + " " + (y - 14 * k) + " " + (x + 40 * k) + " " + (y + 40 * k) + " Z", "#3b6277", 3, { f: "#1a3340" }); };

  F.regente = () => {
    let s = "";
    const grupos = [["Soprano", C.rosa], ["Contralto", C.rox], ["Tenor", C.ver], ["Baixo", C.lar]];
    // grupos em arco
    const xs = [150, 290, 510, 650];
    grupos.forEach(([n, c], i) => {
      const cx = xs[i], cy = 100;
      for (let k = 0; k < 9; k++) s += circ(cx - 44 + (k % 3) * 44, cy - 20 + Math.floor(k / 3) * 26, 9, { f: c, op: 0.9 });
      s += tx(cx, 168, n, { t: 17, a: "middle", w: 700, c: c });
    });
    ["pulso", "entradas", "dinâmica", "caráter"].forEach((n, i) => { const x = 100 + i * 150; s += chip(x, 196, 130, 34, n, [C.am, C.az, C.ver, C.rosa][i], 17) + lin(400, 300, x + 65, 232, [C.am, C.az, C.ver, C.rosa][i], 2, "5 4"); });
    s += regenteCostas(400, 345, 1.1);
    s += lin(364, 345, 336, 304, C.pele, 7) + lin(436, 345, 464, 304, C.pele, 7) + lin(464, 304, 492, 262, "#e9f0f3", 3);
    s += tx(400, 420, "O regente une o grupo: pulso, entradas, dinâmica, caráter e afinação.", { t: 17, a: "middle", c: C.mudo });
    s += tx(400, 34, "A função do regente", { t: 24, a: "middle", w: 700 });
    return svg("O regente à frente do coro, guiando tempo, entradas e dinâmica", s);
  };

  F.maos = () => {
    let s = tx(400, 34, "Mãos, batuta e plano de regência", { t: 24, a: "middle", w: 700 });
    const cx = 400;
    s += rect(240, 200, 320, 130, { rx: 14, f: C.az, op: 0.1, s: C.az, sw: 2, d: "8 6" }) + tx(cx, 352, "plano de regência: da cintura à altura dos ombros", { t: 15, a: "middle", c: C.az });
    s += circ(cx, 100, 30, { f: C.pele }) + cam("M" + (cx - 70) + " 330 Q" + (cx - 70) + " 150 " + cx + " 150 Q" + (cx + 70) + " 150 " + (cx + 70) + " 330 Z", "#3b6277", 3, { f: "#1a3340" });
    s += cam("M" + (cx - 66) + " 170 L" + (cx - 120) + " 236 L" + (cx - 70) + " 250", C.pele, 9) + circ(cx - 70, 252, 11, { f: C.pele });
    s += lin(cx - 70, 252, cx - 20, 180, "#f4f8fa", 4) + circ(cx - 70, 252, 6, { f: "#cfe0e7" });
    s += cam("M" + (cx + 66) + " 170 L" + (cx + 120) + " 236 L" + (cx + 74) + " 262", C.pele, 9) + circ(cx + 74, 264, 12, { f: C.pele });
    s += rect(30, 140, 190, 90, { rx: 14, f: C.am, op: 0.12, s: C.am }) + tx(125, 170, "MÃO DIREITA", { t: 17, a: "middle", w: 800, c: C.am }) + tx(125, 196, "+ batuta: marca", { t: 15, a: "middle" }) + tx(125, 216, "o tempo (padrão)", { t: 15, a: "middle" });
    s += rect(580, 140, 190, 90, { rx: 14, f: C.verm, op: 0.12, s: C.verm }) + tx(675, 170, "MÃO ESQUERDA", { t: 17, a: "middle", w: 800, c: C.verm }) + tx(675, 196, "entradas, dinâmica", { t: 15, a: "middle" }) + tx(675, 216, "e expressão", { t: 15, a: "middle" });
    s += seta(220, 200, 290, 238, C.am, 2) + seta(580, 200, 520, 250, C.verm, 2);
    s += tx(400, 410, "Cotovelos soltos, pulso flexível, ombros relaxados: o gesto precisa ser claro, não tenso.", { t: 16, a: "middle", c: C.mudo });
    return svg("Mão direita com batuta marcando o tempo e mão esquerda cuidando da expressão", s);
  };

  // padrões de compasso: pontos em 0..1; devolve svg do conjunto desenhado numa caixa (ox,oy,w,h)
  function padrao(n, ox, oy, w, h, c) {
    const P = (x, y) => [r1(ox + x * w), r1(oy + y * h)];
    const def = {
      2: { pts: [[0.5, 0.82], [0.5, 0.12]], ctl: [[0.5, 0.82, 0.62, 0.9], [0.5, 0.82, 0.78, 0.45]], prep: [0.5, 0.12] },
      3: { pts: [[0.5, 0.86], [0.8, 0.52], [0.52, 0.1]], ctl: [], prep: [0.52, 0.1] },
      4: { pts: [[0.5, 0.88], [0.22, 0.6], [0.78, 0.56], [0.52, 0.1]], ctl: [], prep: [0.52, 0.1] },
    }[n];
    const pts = def.pts.map((p) => P(p[0], p[1]));
    const ctl = n === 2 ? [P(0.7, 0.55)] : n === 3 ? [P(0.74, 0.9), P(0.86, 0.26), P(0.4, 0.3)] : [P(0.28, 0.9), P(0.5, 0.5), P(0.84, 0.22), P(0.2, 0.2)];
    let g = rect(ox, oy, w, h, { rx: 14, f: "#0b1a22", s: C.linha, sw: 2 });
    const prep = P(def.prep[0], def.prep[1]);
    const seg = (a, b, k, cor) => {
      const d = "M" + a[0] + " " + a[1] + " Q" + k[0] + " " + k[1] + " " + b[0] + " " + b[1];
      const t = 0.62, mx = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * k[0] + t * t * b[0], my = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * k[1] + t * t * b[1];
      const dx = 2 * (1 - t) * (k[0] - a[0]) + 2 * t * (b[0] - k[0]), dy = 2 * (1 - t) * (k[1] - a[1]) + 2 * t * (b[1] - k[1]);
      return cam(d, cor, 6) + ponta(mx + Math.cos(Math.atan2(dy, dx)) * 8, my + Math.sin(Math.atan2(dy, dx)) * 8, Math.atan2(dy, dx), cor, 17);
    };
    // preparação: do ponto de partida até o tempo 1
    g += seta(prep[0], prep[1], pts[0][0], pts[0][1] - 10, "#cfe0e7", 5);
    if (n === 2) { g += seg(pts[0], prep, ctl[0], c); }
    if (n === 3) { g += seg(pts[0], pts[1], ctl[0], c) + seg(pts[1], pts[2], ctl[1], c); }
    if (n === 4) { g += seg(pts[0], pts[1], ctl[0], c) + seg(pts[1], pts[2], ctl[1], c) + seg(pts[2], pts[3], ctl[2], c); }
    pts.forEach((p, i) => (g += circ(p[0], p[1], 17, { f: "#0b1a22", s: c, sw: 3 }) + tx(p[0], p[1] + 7, i + 1, { t: 20, a: "middle", w: 800 })));
    return g;
  }
  const padraoFig = (n, nome, cor, dicas) => () => {
    let s = tx(400, 40, "Padrão de " + n + " tempos (" + nome + ")", { t: 24, a: "middle", w: 700 });
    s += padrao(n, 70, 70, 360, 330, cor);
    s += rect(470, 100, 290, 240, { rx: 16, f: cor, op: 0.1, s: cor, sw: 2 });
    dicas.forEach((d, i) => (s += tx(490, 138 + i * 44, d, { t: 17 })));
    s += tx(615, 372, "visto de frente, mão direita", { t: 14, a: "middle", c: C.mudo }) + tx(250, 424, "seta clara = gesto preparatório", { t: 14, a: "middle", c: C.mudo });
    return svg("Padrão de regência de " + n + " tempos", s);
  };
  F.pad2 = padraoFig(2, "2/4, 2/2", C.lar, ["1: desce com firmeza", "2: sobe, com curva leve", "Marchas e polcas", "4 tempos muito rápidos", "viram 2 tempos"]);
  F.pad3 = padraoFig(3, "3/4, 3/8", C.ver, ["1: desce, ponto mais forte", "2: abre para a direita", "3: sobe e volta ao topo", "Valsa e compassos ternários"]);
  F.pad4 = padraoFig(4, "4/4", C.az, ["1: desce, ponto mais forte", "2: abre para dentro (esq.)", "3: cruza para fora (dir.)", "4: sobe e volta ao topo", "O mais usado em hinos"]);

  F.ataque = () => {
    let s = tx(400, 40, "Gesto preparatório e ataque", { t: 24, a: "middle", w: 700 });
    const x0 = 80, y = 200, w = 640;
    s += lin(x0, y, x0 + w, y, C.linha, 2);
    const marcas = [[0, "−1", "preparar"], [0.5, "1", "ataque"], [1, "2", ""]];
    // linha do tempo: respiração + som
    s += rect(x0, y - 46, w * 0.42, 34, { rx: 17, f: C.ver, op: 0.25, s: C.ver, sw: 2 }) + tx(x0 + w * 0.21, y - 23, "inspirar juntos", { t: 17, a: "middle", w: 700, c: C.ver });
    s += rect(x0 + w * 0.5, y - 46, w * 0.5, 34, { rx: 17, f: C.az, op: 0.3, s: C.az, sw: 2 }) + tx(x0 + w * 0.75, y - 23, "o som começa", { t: 17, a: "middle", w: 700, c: C.az });
    [[x0 + w * 0.0, "preparação"], [x0 + w * 0.5, "tempo 1 = ATAQUE"]].forEach(([x, n], i) => { s += circ(x + (i ? 0 : 30), y, 12, { f: i ? C.az : C.ver }) + lin(x + (i ? 0 : 30), y, x + (i ? 0 : 30), y + 40, C.mudo, 2) + tx(x + (i ? 0 : 30), y + 66, n, { t: 18, a: "middle", w: 700, c: i ? C.az : C.ver }); });
    // trajetória da mão
    s += cam("M110 330 Q150 270 200 262 Q250 258 290 330", C.am, 5) + ponta(290, 330, Math.PI * 0.4, C.am, 18) + tx(200, 362, "sobe e prepara", { t: 15, a: "middle", c: C.am }) + tx(290, 384, "desce = ataque", { t: 15, a: "middle", c: C.am });
    s += rect(400, 300, 380, 112, { rx: 14, f: C.bg2, s: C.linha }) + tx(416, 330, "1. olhar o grupo · 2. respirar junto", { t: 16 }) + tx(416, 358, "3. preparar um tempo antes", { t: 16 }) + tx(416, 388, "4. atacar: o preparo dá andamento e volume", { t: 14.5, c: C.am });
    return svg("Linha do tempo do gesto preparatório, respiração e ataque", s);
  };

  F.corte = () => {
    let s = tx(400, 40, "Corte: terminar o som juntos", { t: 24, a: "middle", w: 700 });
    const x0 = 70, y = 170;
    s += rect(x0, y - 36, 400, 54, { rx: 18, f: C.az, op: 0.3, s: C.az, sw: 2 }) + tx(x0 + 200, y - 2, "nota longa sustentada", { t: 19, a: "middle", w: 700, c: C.az });
    s += lin(x0 + 400, y - 70, x0 + 400, y + 52, C.verm, 4, "8 5") + tx(x0 + 400, y - 82, "corte", { t: 20, a: "middle", w: 800, c: C.verm });
    s += tx(x0 + 540, y - 6, "silêncio", { t: 19, c: C.mudo, a: "middle" });
    // gesto: círculo que fecha
    s += cam("M300 330 Q220 300 240 350 Q262 392 310 360 Q350 330 316 306", C.am, 5) + ponta(316, 306, -2.2, C.am, 17) + circ(300, 330, 5, { f: C.am });
    s += tx(300, 410, "o gesto \"fecha\" no tempo exato", { t: 16, a: "middle", c: C.am });
    s += rect(440, 280, 330, 130, { rx: 14, f: C.bg2, s: C.linha });
    ["Combine antes: onde cada nota acaba", "Consoantes finais (s, t, m) juntas", "Olhar e mão esquerda ajudam a fechar"].forEach((t, i) => (s += tx(454, 312 + i * 32, ["• " + t], { t: 14.5 })));
    return svg("Gesto de corte para encerrar a nota de todos ao mesmo tempo", s);
  };

  F.expressao = () => {
    const col = [["Legato", "ligado, fluido", C.az], ["Staccato", "curto, destacado", C.lar], ["Crescendo", "gesto que abre", C.ver], ["Decrescendo", "gesto que fecha", C.rox], ["Fermata", "segura e solta", C.am]];
    let s = tx(400, 34, "Expressão no gesto", { t: 24, a: "middle", w: 700 });
    col.forEach(([n, d, c], i) => {
      const x = 12 + i * 156, cx = x + 72;
      s += rect(x, 56, 144, 330, { rx: 16, f: c, op: 0.08, s: c, sw: 2 }) + tx(cx, 88, n, { t: 19, a: "middle", w: 800, c: c }) + tx(cx, 110, d, { t: 13, a: "middle", c: C.mudo });
      if (i === 0) s += cam("M" + (x + 18) + " 250 C" + (x + 40) + " 170 " + (x + 60) + " 330 " + (x + 84) + " 230 S" + (x + 122) + " 190 " + (x + 128) + " 260", c, 5);
      if (i === 1) { let d2 = "M" + (x + 18) + " 300"; [[44, 200], [58, 300], [84, 200], [98, 300], [124, 204]].forEach(([dx, y]) => (d2 += " L" + (x + dx) + " " + y)); s += cam(d2, c, 4) + [44, 84, 124].map((dx) => circ(x + dx, 200, 5, { f: c })).join(""); }
      if (i === 2) [14, 24, 36, 50].forEach((r, k) => (s += circ(cx - 24 + k * 14, 250, r * 0.9, { s: c, sw: 3 + k * 0.4, op: 0 })));
      if (i === 3) [50, 36, 24, 14].forEach((r, k) => (s += circ(cx - 24 + k * 14, 250, r * 0.9, { s: c, sw: 3 })));
      if (i === 4) s += cam("M" + (cx - 44) + " 260 Q" + cx + " 170 " + (cx + 44) + " 260", c, 6) + circ(cx, 230, 8, { f: c }) + cam("M" + (cx + 50) + " 330 Q" + (cx + 56) + " 312 " + (cx + 40) + " 300", c, 3);
      if (i === 2) s += seta(x + 20, 330, x + 124, 330, c, 3);
      if (i === 3) s += seta(x + 124, 330, x + 20, 330, c, 3);
      s += tx(cx, 366, ["gesto pequeno", "gesto médio", "pequeno → grande", "grande → pequeno", "mão para no topo"][i], { t: 12.5, a: "middle", c: C.txt });
    });
    return svg("Gestos de legato, staccato, crescendo, decrescendo e fermata", s);
  };

  F.coral = () => {
    const cor = { S: C.rosa, A: C.rox, T: C.ver, B: C.lar };
    let s = tx(400, 34, "Disposição do coro (vista do regente, de cima)", { t: 20, a: "middle", w: 700 });
    // layout A: lado a lado
    s += rect(20, 56, 370, 270, { rx: 16, f: "#0b1a22", s: C.linha }) + tx(205, 82, "Naipes lado a lado", { t: 17, a: "middle", w: 700 });
    ["S", "A", "T", "B"].forEach((n, i) => { const cx = 62 + i * 88; for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) s += circ(cx - 22 + k * 22, 130 + r * 28 + (i === 0 || i === 3 ? 6 : 0), 8, { f: cor[n], op: 0.9 }); s += tx(cx, 240, n, { t: 22, a: "middle", w: 800, c: cor[n] }); });
    s += tx(205, 280, "cada grupo escuta a si mesmo", { t: 14, a: "middle", c: C.mudo }) + tx(205, 302, "(bom para aprender a parte)", { t: 13, a: "middle", c: C.mudo });
    // layout B: duas fileiras
    s += rect(410, 56, 370, 270, { rx: 16, f: "#0b1a22", s: C.linha }) + tx(595, 82, "Duas fileiras", { t: 17, a: "middle", w: 700 });
    [["T", 130, 0], ["B", 130, 1], ["S", 190, 0], ["A", 190, 1]].forEach(([n, y, side]) => { const cx = 490 + side * 210; for (let k = 0; k < 4; k++) s += circ(cx - 33 + k * 22, y, 8, { f: cor[n], op: 0.9 }) + circ(cx - 33 + k * 22, y + 28, 8, { f: cor[n], op: 0.9 }); s += tx(cx - 60, y + 22, n, { t: 20, a: "end", w: 800, c: cor[n] }); });
    s += tx(595, 280, "vozes graves atrás, agudas na frente", { t: 14, a: "middle", c: C.mudo }) + tx(595, 302, "(mistura mais homogênea)", { t: 13, a: "middle", c: C.mudo });
    s += regenteCostas(205, 382, 0.42) + regenteCostas(595, 382, 0.42);
    s += tx(400, 436, "Não há uma regra única: teste e escolha o que soa melhor no seu local.", { t: 15, a: "middle", c: C.am });
    return svg("Dois arranjos de coro: naipes lado a lado e em duas fileiras", s);
  };

  F.partitura = () => {
    let s = tx(400, 34, "A grade da partitura coral (SATB)", { t: 22, a: "middle", w: 700 });
    s += tx(130, 62, "♩ = 72", { t: 16, c: C.mudo });
    const linhas = [["Soprano", 118, C.rosa, "t", 7, 7], ["Contralto", 198, C.rox, "t", 5, 4], ["Tenor", 278, C.ver, "t", 2, 2], ["Baixo", 358, C.lar, "b", 3, 5]];
    s += lin(110, 78, 110, 358, "#cfe0e7", 3);
    linhas.forEach(([n, y, c, t, n1, n2], i) => {
      s += tx(18, y - 14, n, { t: 15, w: 700, c: c }) + pauta(110, y, 640);
      s += t === "t" ? clave(116, y + 9, 46) : claveF(116, y - 2, 36);
      [[300, n1], [420, n2], [540, n1 + (i === 3 ? 1 : -1)], [660, n1]].forEach(([x, nn]) => (s += nota(x, y, nn, { vazia: true, semibreve: true, haste: false, c: c })));
      if (i === 2) s += tx(134, y + 26, "8", { t: 11, c: C.mudo });
    });
    [360, 600].forEach((x) => (s += lin(x, 78, x, 358, "#cfe0e7", 2)));
    s += tx(400, 412, "O regente lê todas as linhas ao mesmo tempo: o que sobe, o que desce e quem entra.", { t: 16, a: "middle", c: C.mudo });
    s += tx(400, 432, "Linha vertical = fim de compasso · chaves de sol (agudo) e de fá (grave)", { t: 14, a: "middle", c: C.mudo });
    return svg("Grade de partitura coral com soprano, contralto, tenor e baixo", s);
  };
})(FIG);

(function (H) {
  "use strict";
  const { C, F, svg, tx, rect, circ, lin, cam, seta, onda, r1 } = H;

  // ================================================================ NOVAS FIGURAS — reforço de "Fundamentos do som"
  // animação leve (SVG/SMIL): o desenho se move sozinho no telão e na prévia; sem animação o desenho continua legível.
  const anim = (attr, valores, dur, atraso) => '<animate attributeName="' + attr + '" values="' + valores + '" dur="' + dur + 's" begin="' + (atraso || 0) + 's" repeatCount="indefinite"/>';

  const __ouvido = (x, y) => cam("M" + (x - 22) + " " + (y - 50) + " Q" + (x + 40) + " " + (y - 48) + " " + (x + 34) + " " + (y + 4) + " Q" + (x + 24) + " " + (y + 50) + " " + (x - 14) + " " + (y + 42), C.ver, 5) +
    cam("M" + (x - 8) + " " + (y - 22) + " Q" + (x + 14) + " " + (y - 18) + " " + (x + 10) + " " + (y + 10), C.ver, 3.5);

  F.som_cadeia = () => {
    let s = tx(400, 40, "O caminho do som: quatro passos", { t: 26, a: "middle", w: 700 });
    const px = [80, 270, 490, 690], cor = [C.lar, C.az, C.ver, C.rosa];
    const nomes = ["1. Algo vibra", "2. O ar leva a vibração", "3. O ouvido recebe", "4. O cérebro entende"];
    const sub = [["violão, voz, caixa"], ["compressões e rarefações"], ["tímpano, ossinhos, cóclea"], ["“é uma música!”"]];
    // 1: corda vibrando
    s += lin(50, 190, 130, 190, C.mudo, 2, "4 4");
    s += '<path d="M50 190 Q90 150 130 190" fill="none" stroke="' + C.lar + '" stroke-width="5" stroke-linecap="round">' + anim("d", "M50 190 Q90 150 130 190;M50 190 Q90 230 130 190;M50 190 Q90 150 130 190", 0.5) + "</path>";
    // 2: partículas do ar
    for (let r = 0; r < 4; r++) for (let i = 0; i < 7; i++) { const x = 232 + i * 11, y = 160 + r * 20, ph = -(i * 0.12); s += '<circle cx="' + x + '" cy="' + y + '" r="3.6" fill="' + C.az + '">' + anim("cx", (x - 6) + ";" + (x + 6) + ";" + (x - 6), 0.9, ph) + "</circle>"; }
    // 3: ouvido
    s += __ouvido(px[2], 190);
    // 4: cérebro (simples)
    s += cam("M680 200 Q664 170 690 156 Q700 134 726 146 Q752 142 748 172 Q764 196 738 212 Q724 232 700 222 Q680 224 680 200 Z", C.rosa, 4, { f: C.rosa, op: 0.18 });
    s += cam("M698 170 Q712 182 700 198 M722 160 Q716 184 734 192", C.rosa, 2.5);
    for (let i = 0; i < 4; i++) {
      if (i < 3) s += seta(px[i] + 62, 190, px[i + 1] - 62, 190, C.mudo, 3);
      s += tx(px[i], 290, nomes[i], { t: 16.5, a: "middle", w: 700, c: cor[i] }) + tx(px[i], 314, sub[i], { t: 14, a: "middle", c: C.mudo });
    }
    s += tx(400, 394, "Sem vibração não há som. Sem meio (ar, água, sólido), a vibração não chega ao ouvido.", { t: 18, a: "middle", c: C.txt });
    s += tx(400, 422, "Em áudio: instrumento → microfone → mesa → caixa → ar → ouvido.", { t: 16, a: "middle", c: C.mudo });
    return svg("Caminho do som: vibração, ar, ouvido e cérebro", s);
  };


  F.fontes_som = () => {
    let s = tx(400, 40, "Tudo que faz som está vibrando", { t: 26, a: "middle", w: 700 });
    const col = [100, 280, 460, 640];
    // corda
    s += lin(60, 150, 140, 150, C.mudo, 2, "4 4") + '<path d="M60 150 Q100 110 140 150" fill="none" stroke="' + C.am + '" stroke-width="5" stroke-linecap="round">' + anim("d", "M60 150 Q100 110 140 150;M60 150 Q100 190 140 150;M60 150 Q100 110 140 150", 0.45) + "</path>";
    // pele de tambor
    s += '<ellipse cx="280" cy="150" rx="62" ry="16" fill="#27424f" stroke="' + C.lar + '" stroke-width="4"/>' + rect(218, 150, 124, 52, { rx: 4, f: "#1a3340", s: C.lar, sw: 4 });
    s += '<ellipse cx="280" cy="150" rx="46" ry="10" fill="none" stroke="' + C.lar + '" stroke-width="3">' + anim("ry", "10;3;10", 0.35) + "</ellipse>";
    // coluna de ar (flauta)
    s += rect(400, 138, 130, 26, { rx: 13, f: "#27424f", s: C.ver, sw: 4 }) + [418, 440, 462, 484].map((x) => circ(x, 151, 4, { f: C.ver })).join("");
    for (let i = 0; i < 3; i++) s += '<circle cx="535" cy="151" r="' + (8 + i * 8) + '" fill="none" stroke="' + C.ver + '" stroke-width="3" opacity="0.5">' + anim("opacity", "0.7;0.1;0.7", 1.2, -i * 0.4) + "</circle>";
    // garganta
    s += circ(640, 118, 22, { f: C.pele }) + cam("M600 188 Q600 152 640 152 Q680 152 680 188", C.pele, 4);
    s += cam("M628 170 q12 8 24 0", C.rosa, 4);
    for (let i = 0; i < 3; i++) s += '<path d="M' + (672 + i * 14) + " " + (112 - i * 6) + " q10 6 0 " + (12 + i * 12) + '" fill="none" stroke="' + C.rosa + '" stroke-width="3" opacity="' + (0.8 - i * 0.2) + '"/>';
    const nomes = ["Corda", "Pele / membrana", "Coluna de ar", "Cordas vocais"], ex = [["violão, cavaquinho,", "violino, baixo"], ["bateria, tambor,", "pandeiro"], ["flauta, sax,", "trompete, órgão"], ["voz que fala", "e que canta"]];
    nomes.forEach((n, i) => { s += tx(col[i] - (i === 0 ? 0 : 0) + (i === 0 ? 0 : 0), 250, n, { t: 20, a: "middle", w: 700, c: [C.am, C.lar, C.ver, C.rosa][i] }) + tx(col[i], 278, ex[i], { t: 16, a: "middle", c: C.mudo }); });
    s += rect(120, 318, 560, 74, { rx: 14, f: C.az, op: 0.1, s: C.az, sw: 2 }) + tx(400, 348, "Alto-falante e fone: um cone de papel que balança", { t: 20, a: "middle", w: 700, c: C.az }) + tx(400, 374, "empurra e puxa o ar do mesmo jeito que uma corda.", { t: 17, a: "middle", c: C.txt });
    s += tx(400, 428, "Quem vibra mais forte faz o som mais forte · quem vibra mais rápido faz o som mais agudo.", { t: 16, a: "middle", c: C.mudo });
    return svg("Fontes de som: cordas, peles, colunas de ar e cordas vocais", s);
  };

  F.onda_animada = () => {
    let s = "";
    const x0 = 120, W = 600, lam = 150, dur = 3, a = 13;
    s += cam("M30 140 L56 140 L84 112 L84 258 L56 230 L30 230 Z", "#cfe0e7", 3, { f: "#27424f" });
    for (let r = 0; r < 6; r++) {
      const y = 96 + r * 32;
      for (let i = 0; i < 49; i++) {
        const x = x0 + i * (W / 48), ph = ((x - x0) / lam) * dur;
        s += '<circle cx="' + r1(x) + '" cy="' + y + '" r="4.4" fill="' + (r === 2 ? C.am : C.az) + '" opacity="' + (r === 2 ? 1 : 0.85) + '">' + anim("cx", r1(x - a) + ";" + r1(x + a) + ";" + r1(x - a), dur, -ph) + "</circle>";
      }
    }
    s += tx(x0, 310, "Repare no ponto amarelo: ele só vai e volta, no mesmo lugar.", { t: 20, w: 700, c: C.am });
    s += tx(x0, 340, "A “bolha” de ar mais apertada (compressão) é que anda para a direita.", { t: 19, c: C.txt });
    s += seta(x0, 74, x0 + 140, 74, C.mudo, 3) + tx(x0 + 156, 80, "sentido do som", { t: 16, c: C.mudo });
    s += rect(x0, 372, 270, 40, { rx: 20, f: C.am, op: 0.15, s: C.am, sw: 2 }) + tx(x0 + 135, 399, "partícula: vibra no lugar", { t: 17, a: "middle", c: C.am, w: 600 });
    s += rect(x0 + 290, 372, 300, 40, { rx: 20, f: C.az, op: 0.15, s: C.az, sw: 2 }) + tx(x0 + 440, 399, "onda: viaja (leva energia)", { t: 17, a: "middle", c: C.az, w: 600 });
    return svg("Animação: as partículas do ar vibram no lugar e a onda de compressão avança", s);
  };

  F.cone_ar = () => {
    let s = tx(400, 38, "Como uma caixa de som cria o som", { t: 24, a: "middle", w: 700 });
    // caixa + cone animado
    s += rect(40, 110, 130, 190, { rx: 10, f: "#1a3340", s: "#cfe0e7", sw: 4 });
    s += '<path d="M170 140 L120 180 L120 230 L170 270" fill="#27424f" stroke="' + C.az + '" stroke-width="4" stroke-linejoin="round">' + anim("d", "M170 140 L120 180 L120 230 L170 270;M170 140 L134 180 L134 230 L170 270;M170 140 L120 180 L120 230 L170 270", 1.2) + "</path>";
    for (let r = 0; r < 7; r++) for (let i = 0; i < 24; i++) {
      const x = 215 + i * 22, y = 120 + r * 28, ph = (i * 22 / 176) * 1.2;
      s += '<circle cx="' + x + '" cy="' + y + '" r="3.8" fill="' + C.az + '" opacity="0.88">' + anim("cx", (x - 7) + ";" + (x + 7) + ";" + (x - 7), 1.2, -ph) + "</circle>";
    }
    s += tx(60, 334, "cone para frente → ar APERTADO (compressão)", { t: 18, c: C.am, w: 700 }) + tx(60, 360, "cone para trás → ar ESPALHADO (rarefação)", { t: 18, c: C.verm, w: 700 });
    s += tx(60, 396, "O sinal elétrico da mesa move o cone; o cone move o ar; o ar leva o som ao ouvido.", { t: 16, c: C.txt });
    s += tx(60, 424, "O microfone faz o caminho inverso: o ar empurra uma membrana e ela gera sinal elétrico.", { t: 16, c: C.mudo });
    return svg("Alto-falante: o cone empurra e puxa o ar criando compressões e rarefações", s);
  };

  F.anatomia_onda = () => {
    let s = tx(400, 36, "Anatomia de uma onda", { t: 26, a: "middle", w: 700 });
    const x0 = 80, y0 = 230, W = 640, amp = 90, lam = 320;
    s += lin(x0, y0, x0 + W, y0, C.linha, 2) + lin(x0, y0 - amp - 20, x0, y0 + amp + 20, C.linha, 2);
    s += cam(onda(x0, y0, W, amp, 2, 0), C.az, 5);
    // amplitude
    s += lin(x0 + 80, y0, x0 + 80, y0 - amp, C.am, 3) + seta(x0 + 80, y0 - 20, x0 + 80, y0 - amp, C.am, 3) + tx(x0 + 80, y0 - amp - 34, "amplitude (volume)", { t: 20, a: "middle", c: C.am, w: 700 });
    // comprimento de onda
    s += lin(x0, y0 + amp + 30, x0 + lam, y0 + amp + 30, C.ver, 3) + lin(x0, y0 + amp + 22, x0, y0 + amp + 38, C.ver, 3) + lin(x0 + lam, y0 + amp + 22, x0 + lam, y0 + amp + 38, C.ver, 3);
    s += tx(x0, y0 + amp + 62, "comprimento de onda (λ) = um ciclo completo no espaço", { t: 18, c: C.ver, w: 700 });
    s += tx(x0 + lam + 50, y0 - amp - 6, "crista", { t: 16, c: C.mudo }) + tx(x0 + lam / 2 + 14, y0 + amp + 4, "vale", { t: 16, c: C.mudo });
    s += tx(x0 + W - 4, y0 - 12, "tempo →", { t: 15, a: "end", c: C.mudo });
    s += rect(60, 392, 680, 42, { rx: 12, f: C.rox, op: 0.12, s: C.rox, sw: 2 }) + tx(400, 420, "Período (T) = tempo de um ciclo  ·  Frequência (f) = ciclos por segundo  ·  f = 1 ÷ T", { t: 15, a: "middle", c: C.rox, w: 600 });
    return svg("Partes de uma onda: amplitude, comprimento de onda, crista, vale, período e frequência", s);
  };

  F.lei_quadrado = () => {
    let s = tx(400, 36, "O som enfraquece com a distância", { t: 26, a: "middle", w: 700 });
    const cx = 110, cy = 220;
    s += rect(cx - 40, cy - 22, 36, 44, { rx: 6, f: "#27424f", s: "#cfe0e7", sw: 3 });
    [[1, 90], [2, 180], [4, 360]].forEach(([d, r], i) => { const an = Math.asin(66 / r); s += '<path d="M' + r1(cx + r * Math.cos(-an)) + " " + r1(cy + r * Math.sin(-an)) + " A " + r + " " + r + ' 0 0 1 ' + r1(cx + r * Math.cos(an)) + " " + r1(cy + r * Math.sin(an)) + '" fill="none" stroke="' + [C.verm, C.am, C.ver][i] + '" stroke-width="5" stroke-linecap="round"/>'; });
    [["1 m", 200, C.verm, "0 dB", "(referência)"], ["2 m", 290, C.am, "−6 dB", "metade da pressão"], ["4 m", 470, C.ver, "−12 dB", "metade de novo"]].forEach(([d, x, c, db, nota]) => {
      s += lin(x, 150, x, 290, c, 2, "5 5") + tx(x + 8, 170, d, { t: 22, c: c, w: 700 }) + tx(x + 8, 198, db, { t: 20, c: c, w: 700 });
    });
    s += rect(60, 332, 680, 78, { rx: 14, f: C.az, op: 0.1, s: C.az, sw: 2 });
    s += tx(400, 362, "Cada vez que a distância DOBRA, o nível cai cerca de 6 dB (ao ar livre).", { t: 18, a: "middle", w: 700, c: C.az });
    s += tx(400, 392, "A mesma energia se espalha por uma área cada vez maior (lei do inverso do quadrado).", { t: 15, a: "middle", c: C.txt });
    s += tx(400, 432, "Na prática: chegue perto do microfone e o som fica forte; afaste e ele some.", { t: 16, a: "middle", c: C.mudo });
    return svg("Queda do nível sonoro com a distância: 6 dB a cada vez que a distância dobra", s);
  };

  F.ressonancia = () => {
    let s = tx(400, 36, "Ressonância e harmônicos: a corda vibra em partes", { t: 24, a: "middle", w: 700 });
    const x0 = 120, x1 = 680, nomes = ["1º harmônico (fundamental)", "2º harmônico (uma oitava acima)", "3º harmônico (oitava + quinta)"], cor = [C.az, C.ver, C.lar];
    [1, 2, 3].forEach((n, i) => {
      const y = 100 + i * 100, W = x1 - x0;
      s += circ(x0, y, 7, { f: "#cfe0e7" }) + circ(x1, y, 7, { f: "#cfe0e7" }) + lin(x0, y, x1, y, C.grade, 1.5);
      const d1 = "M" + x0 + " " + y + " " + Array.from({ length: 81 }, (_, k) => "L" + r1(x0 + W * k / 80) + " " + r1(y - 34 * Math.sin(Math.PI * n * k / 80))).join(" ");
      const d2 = "M" + x0 + " " + y + " " + Array.from({ length: 81 }, (_, k) => "L" + r1(x0 + W * k / 80) + " " + r1(y + 34 * Math.sin(Math.PI * n * k / 80))).join(" ");
      s += '<path d="' + d1 + '" fill="none" stroke="' + cor[i] + '" stroke-width="4">' + anim("d", d1 + ";" + d2 + ";" + d1, 0.9 / n) + "</path>";
      s += tx(x0 - 14, y + 5, n + "×", { t: 22, a: "end", c: cor[i], w: 700 }) + tx(400, y + 56, nomes[i], { t: 16, a: "middle", c: cor[i], w: 600 });
    });
    s += tx(400, 418, "Uma corda toca todos esses modos ao mesmo tempo: essa mistura é o timbre.", { t: 18, a: "middle", c: C.txt }) + tx(400, 442, "Ressonância: quando algo vibra forte porque recebeu a frequência certa (violão, sala, microfonia).", { t: 15, a: "middle", c: C.mudo });
    return svg("Harmônicos de uma corda: modos de vibração e ressonância", s);
  };

  F.interacao_som = () => {
    let s = tx(400, 36, "O que acontece quando o som encontra algo", { t: 26, a: "middle", w: 700 });
    const caixas = [[40, "Reflete", C.az, "parede dura, vidro,", "azulejo, piso", "→ eco e reverberação"], [290, "Absorve", C.ver, "cortina, carpete,", "pessoas, espuma", "→ som mais “seco”"], [540, "Contorna", C.lar, "porta, coluna, canto", "(os graves passam,", "os agudos são barrados)"]];
    caixas.forEach(([x, t, c, a, b, d], i) => {
      s += rect(x, 70, 220, 230, { rx: 14, f: c, op: 0.08, s: c, sw: 2 }) + tx(x + 110, 100, t, { t: 24, a: "middle", w: 700, c: c });
      const cx = x + 110;
      if (i === 0) { s += lin(cx + 40, 130, cx + 40, 270, "#cfe0e7", 8) + seta(cx - 80, 160, cx + 32, 200, C.az, 4) + seta(cx + 32, 200, cx - 60, 250, C.az, 4); }
      if (i === 1) { s += rect(cx + 20, 130, 36, 140, { rx: 6, f: "#4b5d36", s: C.ver, sw: 2 }) + seta(cx - 80, 200, cx + 16, 200, C.ver, 4) + '<path d="M' + (cx + 62) + ' 200 q10 -10 20 0 q10 10 20 0" fill="none" stroke="' + C.ver + '" stroke-width="2.5" opacity="0.5"/>'; }
      if (i === 2) { s += rect(cx - 6, 130, 22, 70, { rx: 4, f: "#cfe0e7" }) + rect(cx - 6, 232, 22, 40, { rx: 4, f: "#cfe0e7" }) + seta(cx - 90, 216, cx - 14, 216, C.lar, 5) + cam("M" + (cx + 18) + " 216 q30 -6 52 -30", C.lar, 4) + cam("M" + (cx + 18) + " 216 q30 6 52 30", C.lar, 4); }
      s += tx(cx, 330, a, { t: 17, a: "middle", c: C.txt }) + tx(cx, 352, b, { t: 17, a: "middle", c: C.txt }) + tx(cx, 380, d, { t: 15, a: "middle", c: c, w: 600 });
    });
    s += tx(400, 430, "Sala sem tratamento = muitas reflexões. É por isso que o mesmo som muda de sala para sala.", { t: 16, a: "middle", c: C.mudo });
    return svg("Reflexão, absorção e difração do som", s);
  };

  F.interferencia = () => {
    let s = tx(400, 36, "Duas ondas juntas: soma ou cancelamento", { t: 25, a: "middle", w: 700 });
    const bloco = (y, titulo, c, fase, rot) => {
      const x0 = 50, W = 300;
      let r = tx(x0, y - 62, titulo, { t: 17, c: c, w: 700 });
      r += cam(onda(x0, y, W, 28, 2, 0), C.az, 3) + cam(onda(x0, y + 62, W, 28, 2, fase), C.am, 3);
      r += lin(x0 + W + 18, y + 12, x0 + W + 18, y + 40, C.mudo, 2);
      r += cam(onda(470, y + 14, 270, fase === 0 ? 50 : 0, 2, 0), c, 4.5);
      r += tx(605, y + 92, rot, { t: 17, a: "middle", c: c, w: 700 });
      return r;
    };
    s += bloco(134, "Em fase (iguais)", C.ver, 0, "soma: som MAIS forte");
    s += bloco(306, "Fases opostas (invertidas)", C.verm, Math.PI, "cancela: som some");
    s += tx(400, 436, "É o que acontece quando dois microfones captam a mesma fonte, ou duas caixas se encontram no ar.", { t: 15, a: "middle", c: C.mudo });
    return svg("Interferência: ondas em fase se somam e ondas em oposição de fase se cancelam", s);
  };

  F.transducao = () => {
    let s = tx(400, 36, "Transdutores: a ponte entre o ar e a eletricidade", { t: 24, a: "middle", w: 700 });
    s += tx(180, 100, "Microfone", { t: 22, a: "middle", w: 700, c: C.ver }) + tx(620, 100, "Alto-falante / fone", { t: 22, a: "middle", w: 700, c: C.az });
    s += rect(158, 150, 44, 74, { rx: 22, f: "#cfe0e7" }) + cam("M146 196 Q146 246 180 246 Q214 246 214 196", "#cfe0e7", 5) + lin(180, 246, 180, 268, "#cfe0e7", 5) + lin(160, 268, 200, 268, "#cfe0e7", 5);
    for (let i = 0; i < 3; i++) s += '<path d="M' + (90 - i * 22) + " " + (150 - i * 14) + " q-10 34 0 68" + '" fill="none" stroke="' + C.ver + '" stroke-width="3" opacity="' + (0.9 - i * 0.25) + '"/>';
    s += cam(onda(110, 346, 140, 22, 2, 0), C.am, 3.5) + tx(180, 392, "sinal elétrico", { t: 16, a: "middle", c: C.am });
    s += tx(180, 296, "pressão do ar → eletricidade", { t: 16, a: "middle", c: C.txt });
    s += rect(560, 150, 90, 110, { rx: 8, f: "#1a3340", s: "#cfe0e7", sw: 3 }) + circ(605, 205, 28, { s: C.az, sw: 3 }) + circ(605, 205, 9, { f: C.az });
    for (let i = 0; i < 3; i++) s += '<path d="M' + (668 + i * 20) + " " + (180 - i * 8) + " q10 25 0 " + (50 + i * 16) + '" fill="none" stroke="' + C.az + '" stroke-width="3.5" opacity="' + (0.9 - i * 0.25) + '"/>';
    s += cam(onda(530, 346, 140, 22, 2, 0), C.am, 3.5) + tx(600, 392, "sinal elétrico", { t: 16, a: "middle", c: C.am });
    s += tx(600, 296, "eletricidade → movimento do ar", { t: 16, a: "middle", c: C.txt });
    s += seta(270, 346, 520, 346, C.mudo, 3) + tx(395, 334, "mesa de som", { t: 16, a: "middle", c: C.mudo });
    s += tx(400, 432, "Toda a mesa de som trabalha com esse sinal elétrico: ganho, EQ e compressor mexem nele.", { t: 17, a: "middle", c: C.txt });
    return svg("Microfone e alto-falante convertem som em eletricidade e de volta em som", s);
  };
})(FIG);

// ====================================================================== NOVAS FIGURAS — temas Técnica, Canto, Música, Músicos e Regência
(function (H) {
  "use strict";
  const { C, F, svg, tx, rect, circ, lin, cam, seta, onda, grade, xf, r1 } = H;
  const quebra = (s, n) => { const p = String(s).split(" "), L = []; let a = ""; p.forEach((w) => { if ((a + " " + w).trim().length > n) { L.push(a); a = w; } else a = (a + " " + w).trim(); }); if (a) L.push(a); return L; };

  // lista de cartões numerados: itens [[titulo, descricao]]
  function cartoes(id, aria, titulo, itens, cor, rodape) {
    F[id] = () => {
      let s = tx(400, 40, titulo, { t: 25, a: "middle", w: 700 });
      const n = itens.length, cols = n > 5 ? 2 : 1, rows = Math.ceil(n / cols), w = cols === 1 ? 680 : 340, h = Math.min(74, Math.floor((330 - (rows - 1) * 10) / rows)), x0 = cols === 1 ? 60 : 40, y0 = 68;
      itens.forEach(([t, d], i) => {
        const c = i % cols, r = Math.floor(i / cols), x = x0 + c * (w + 20), y = y0 + r * (h + 10);
        s += rect(x, y, w, h, { rx: 12, f: cor, op: 0.1, s: cor, sw: 2 }) + circ(x + 28, y + h / 2, 17, { f: cor }) + tx(x + 28, y + h / 2 + 7, String(i + 1), { t: 20, a: "middle", w: 800, c: "#0b1820" });
        const ls = quebra(d, cols === 1 ? 74 : 38);
        s += tx(x + 56, y + (ls.length > 1 ? 24 : 30), t, { t: 19, w: 700, c: cor }) + tx(x + 56, y + (ls.length > 1 ? 45 : 54), ls.slice(0, 2), { t: 14.5, c: C.txt });
      });
      if (rodape) s += tx(400, 432, rodape, { t: 16, a: "middle", c: C.mudo });
      return svg(aria, s);
    };
  }
  // tabela simples: colunas [{t, w}], linhas [[...]]
  function tabela(id, aria, titulo, cols, linhas, cor, rodape) {
    F[id] = () => {
      let s = tx(400, 40, titulo, { t: 25, a: "middle", w: 700 });
      const tot = cols.reduce((a, c) => a + c.w, 0), X = 40, W = 720, rh = Math.min(58, Math.floor(320 / linhas.length)); let x = X;
      const xs = cols.map((c) => { const r = x; x += W * c.w / tot; return r; });
      s += rect(X, 64, W, 34, { rx: 8, f: cor, op: 0.25 });
      cols.forEach((c, i) => (s += tx(xs[i] + 12, 87, c.t, { t: 16, w: 700, c: cor })));
      linhas.forEach((l, r) => {
        const y = 104 + r * rh;
        if (r % 2 === 0) s += rect(X, y, W, rh - 4, { rx: 6, f: "#ffffff", op: 0.04 });
        l.forEach((cel, i) => { const ls = quebra(cel, Math.max(10, Math.floor(W * cols[i].w / tot / 8.2))); s += tx(xs[i] + 12, y + (ls.length > 1 ? 21 : 30), ls.slice(0, 2), { t: i === 0 ? 16 : 14.5, w: i === 0 ? 700 : 400, c: i === 0 ? C.txt : C.txt }); });
      });
      if (rodape) s += tx(400, 438, rodape, { t: 16, a: "middle", c: C.mudo });
      return svg(aria, s);
    };
  }

  // ---------------------------------------------------------------- TÉCNICA
  F.estrutura_ganho = () => {
    let s = tx(400, 40, "Nível certo em cada etapa (estrutura de ganho)", { t: 24, a: "middle", w: 700 });
    const etapas = [["Ganho (entrada)", 0.62, "ajuste com a pessoa\\ncantando forte"], ["Fader do canal", 0.55, "perto da posição\\nde trabalho (0 dB)"], ["Master (saída)", 0.6, "deixe folga:\\nnunca no vermelho"]];
    etapas.forEach(([n, nivel, d], i) => {
      const x = 90 + i * 230, base = 330, H2 = 220;
      const seg = [[0, 0.7, C.ver], [0.7, 0.88, C.am], [0.88, 1, C.verm]];
      seg.forEach(([a, b, c]) => (s += rect(x, base - b * H2, 54, (b - a) * H2 - 2, { rx: 3, f: c, op: 0.22 })));
      seg.forEach(([a, b, c]) => { const t = Math.min(b, nivel); if (t > a) s += rect(x, base - t * H2, 54, (t - a) * H2 - 2, { rx: 3, f: c }); });
      s += lin(x - 8, base - nivel * H2, x + 62, base - nivel * H2, C.txt, 3);
      s += tx(x + 27, base + 28, n, { t: 18, a: "middle", w: 700 }) + tx(x + 27, base + 50, d.split("\\n"), { t: 14, a: "middle", c: C.mudo });
      if (i < 2) s += seta(x + 74, 220, x + 150, 220, C.mudo, 3);
    });
    s += tx(560, 110, "VERDE: nível de trabalho", { t: 16, c: C.ver, w: 700 }) + tx(560, 136, "AMARELO: só nos picos", { t: 16, c: C.am, w: 700 }) + tx(560, 162, "VERMELHO: distorção (clipping)", { t: 16, c: C.verm, w: 700 });
    s += tx(560, 200, "Mesa digital: média perto de −18 dBFS", { t: 14, c: C.mudo }) + tx(560, 220, "e picos abaixo de −6 dB.", { t: 14, c: C.mudo });
    s += tx(400, 432, "Sinal fraco pede mais ganho e traz chiado; sinal forte demais distorce e acaba com a folga (headroom).", { t: 15, a: "middle", c: C.mudo });
    return svg("Estrutura de ganho: níveis ideais na entrada, no fader e na saída", s);
  };

  F.hpf = () => {
    let s = tx(400, 38, "Filtro de graves (HPF): corte o que não é voz", { t: 24, a: "middle", w: 700 });
    const x0 = 70, W = 660, y0 = 90, h = 220;
    s += grade(x0, y0, W, h, 10, 5);
    const fx = (f) => xf(f, x0, W);
    s += rect(x0, y0, fx(100) - x0, h, { rx: 0, f: C.verm, op: 0.18 }) + tx((x0 + fx(100)) / 2, y0 + 30, ["ronco, vento,", "pancadas no", "microfone"], { t: 14, a: "middle", c: C.verm, w: 600 });
    s += rect(fx(100), y0, fx(4000) - fx(100), h, { rx: 0, f: C.ver, op: 0.08 }) + tx((fx(100) + fx(4000)) / 2, y0 + 30, "a voz mora aqui (100 Hz – 4 kHz)", { t: 15, a: "middle", c: C.ver, w: 700 });
    let d = ""; for (let i = 0; i <= 120; i++) { const f = 20 * Math.pow(1000, i / 120), g = 1 / Math.sqrt(1 + Math.pow(100 / f, 4)); d += (i ? "L" : "M") + r1(fx(f)) + " " + r1(y0 + h - 30 - g * (h - 90)); }
    s += cam(d, C.az, 5);
    s += lin(fx(100), y0, fx(100), y0 + h, C.am, 2, "5 5") + tx(fx(100) + 6, y0 + h - 8, "~100 Hz", { t: 15, c: C.am, w: 700 });
    [[20, "20"], [100, "100"], [1000, "1k"], [10000, "10k"]].forEach(([f, t]) => (s += tx(fx(f), y0 + h + 20, t + " Hz", { t: 13, a: "middle", c: C.mudo })));
    s += tx(400, 366, "Comece em ~100 Hz para voz; vozes graves aceitam um corte mais baixo.", { t: 17, a: "middle", w: 600 });
    s += tx(400, 394, "Suba o corte até a voz ficar fina e volte um pouco. Instrumentos graves (bumbo, baixo) ficam sem HPF.", { t: 15, a: "middle", c: C.mudo });
    return svg("Filtro passa-alta cortando graves abaixo de 100 hertz", s);
  };

  cartoes("roteiro_tecnico", "Roteiro do técnico em seis passos", "Do zero à música: roteiro em 6 passos", [
    ["Tudo zerado", "Faders embaixo, EQ plano, efeitos e AUX zerados."], ["Ganho", "Com a fonte cantando ou tocando forte: picos no amarelo."], ["Filtro de graves", "Ligue o HPF nas vozes e instrumentos que não têm grave."],
    ["Equalização", "Corte o que atrapalha; aumente pouco."], ["Equilíbrio", "Suba os faders: voz à frente, base atrás."], ["Retornos e final", "Retorno de cada músico, depois a música inteira."]], C.az, "Um ajuste por vez, sempre escutando. Depois de pronto, mexa pouco.");

  F.efeitos = () => {
    let s = tx(400, 38, "Reverb e delay: espaço e repetição", { t: 25, a: "middle", w: 700 });
    s += rect(40, 70, 340, 260, { rx: 14, f: C.rox, op: 0.08, s: C.rox, sw: 2 }) + tx(210, 104, "Reverb", { t: 24, a: "middle", w: 700, c: C.rox });
    s += rect(70, 130, 8, 110, { rx: 2, f: C.txt }); for (let i = 0; i < 12; i++) s += rect(92 + i * 22, 240 - (100 * Math.exp(-i * 0.28)), 12, 100 * Math.exp(-i * 0.28), { rx: 2, f: C.rox, op: 0.85 });
    s += tx(210, 266, "som direto + muitas reflexões que somem", { t: 15, a: "middle", c: C.txt }) + tx(210, 292, "dá sensação de sala; demais embola a letra", { t: 15, a: "middle", c: C.mudo }) + tx(210, 316, "Voz: pouco (curto). Instrumentos: ao gosto.", { t: 15, a: "middle", c: C.rox, w: 600 });
    s += rect(420, 70, 340, 260, { rx: 14, f: C.lar, op: 0.08, s: C.lar, sw: 2 }) + tx(590, 104, "Delay (eco)", { t: 24, a: "middle", w: 700, c: C.lar });
    for (let i = 0; i < 5; i++) s += rect(450 + i * 60, 240 - 110 * Math.pow(0.6, i), 14, 110 * Math.pow(0.6, i), { rx: 2, f: i ? C.lar : C.txt, op: i ? 0.9 : 1 });
    s += tx(590, 266, "repete o som em intervalos regulares", { t: 15, a: "middle", c: C.txt }) + tx(590, 292, "Tempo (ms) = 60.000 ÷ BPM", { t: 17, a: "middle", c: C.lar, w: 700 }) + tx(590, 316, "ex.: 120 BPM → 500 ms (um pulso)", { t: 15, a: "middle", c: C.mudo });
    s += tx(400, 372, "Efeito entra por AUX ou insert, nunca no lugar do som limpo.", { t: 17, a: "middle", w: 600 }) + tx(400, 400, "Se a plateia percebe o efeito, provavelmente está demais.", { t: 16, a: "middle", c: C.mudo });
    return svg("Reverb e delay: diferenças e como ajustar", s);
  };

  tabela("diagnostico", "Tabela de problemas comuns de som e soluções", "Sintoma → causa → o que fazer", [{ t: "Sintoma", w: 1.1 }, { t: "Causa provável", w: 1.6 }, { t: "O que fazer", w: 2 }], [
    ["Chiado", "Ganho baixo, cabo ruim", "Suba o ganho; troque o cabo; feche canais sem uso"], ["Zumbido (grave constante)", "Cabo desbalanceado, ligação elétrica", "Use cabo balanceado; afaste de dimmer e fonte"],
    ["Apito", "Microfonia", "Menos ganho/retorno; corte a frequência do apito"], ["Voz abafada", "Muito grave, microfone longe", "HPF, cortar 200–400 Hz, aproximar o microfone"],
    ["Voz estridente", "Excesso em 2–5 kHz", "Corte leve nessa faixa; cuidado com o ganho"], ["Distorção", "Clipping no ganho", "Baixe o ganho; confira o canal e o master"]], C.am, "Primeiro descubra QUAL canal tem o problema (solo/PFL), depois resolva.");

  // ---------------------------------------------------------------- CANTO
  cartoes("aquecimento", "Aquecimento vocal em cinco passos", "Aquecimento vocal: 5 a 10 minutos", [
    ["Respirar", "Inspire em 4 tempos, solte em 8, sem levantar os ombros."], ["Lábios vibrando", "“Brrr” suave, subindo e descendo a voz."], ["Sirene", "“Uuu” deslizando do grave ao agudo e voltando."],
    ["Vogais", "A–E–I–O–U com a boca bem aberta e relaxada."], ["Escalas curtas", "Cinco notas subindo e descendo, de leve."]], C.rosa, "Nunca cante forte com a voz fria. Pare se doer.");
  cartoes("diccao", "Dicção, consoantes e vogais no microfone", "Dicção: palavra clara, microfone limpo", [
    ["Vogais abertas", "Abra a boca: a vogal carrega o som e a afinação."], ["Consoantes claras", "Capriche no começo e no fim das palavras."], ["P e B estouram", "Fale levemente de lado do microfone para amortecer."],
    ["S chiado", "Se o S machuca, afaste um pouco ou corte 6–8 kHz."], ["Todos juntos", "Em grupo, terminem as consoantes no mesmo instante."]], C.rosa, "Letra entendida é mensagem entendida.");
  cartoes("cuidados_voz", "Cuidados com a voz", "Cuidar da voz", [
    ["Água", "Beba água ao longo do dia, não só antes de cantar."], ["Descanso", "Durma bem e faça pausas entre ensaios longos."], ["Sem forçar", "Não grite nem force o agudo; afaste o microfone."],
    ["Sem pigarro", "Tossir e pigarrear machuca; engula ou beba água."], ["Pelo ouvido", "Use retorno para não cantar mais alto do que precisa."], ["Sinal de alerta", "Rouquidão por mais de 2 semanas: procure um médico."]], C.rosa, "A voz é um instrumento do corpo: não tem peça de reposição.");
  cartoes("grupo_canto", "Cantar em grupo: escutar e se fundir", "Cantar em grupo: escutar e se fundir", [
    ["Escute o vizinho", "Se não escuta quem está ao lado, está cantando alto demais."], ["Mesma vogal", "Todos abrem a mesma vogal, na mesma hora."], ["Mesmo volume", "Ninguém deve se destacar, salvo em solos combinados."],
    ["Respire junto", "Respirar juntos faz entrar juntos."], ["Olhe o regente", "Olhos no regente nas entradas e nos finais."]], C.rosa, "Um grupo afinado soa como uma voz só.");

  // ---------------------------------------------------------------- MÚSICA
  F.notas_teclado = () => {
    let s = tx(400, 38, "As notas no teclado", { t: 26, a: "middle", w: 700 });
    const x0 = 60, W = 680, y0 = 90, h = 190, n = 8, lw = W / n, nomes = ["Dó", "Ré", "Mi", "Fá", "Sol", "Lá", "Si", "Dó"], cif = ["C", "D", "E", "F", "G", "A", "B", "C"];
    for (let i = 0; i < n; i++) s += rect(x0 + i * lw, y0, lw - 3, h, { rx: 6, f: "#e9f1f4" }) + tx(x0 + i * lw + lw / 2 - 1, y0 + h - 40, nomes[i], { t: 20, a: "middle", w: 700, c: "#0b1820" }) + tx(x0 + i * lw + lw / 2 - 1, y0 + h - 16, cif[i], { t: 16, a: "middle", c: "#4a6573" });
    [0, 1, 3, 4, 5].forEach((i) => (s += rect(x0 + (i + 1) * lw - 17, y0, 32, 112, { rx: 4, f: "#10222b", s: "#000", sw: 1 })));
    [[0, "Dó#/Ré♭"], [1, "Ré#/Mi♭"], [3, "Fá#/Sol♭"], [4, "Sol#/Lá♭"], [5, "Lá#/Si♭"]].forEach(([i, t]) => (s += tx(x0 + (i + 1) * lw - 1, y0 + 130, t.split("/"), { t: 11, a: "middle", c: C.mudo })));
    s += cam("M" + (x0 + lw * 2) + " " + (y0 - 8) + " L" + (x0 + lw * 2 + lw * 0.5) + " " + (y0 - 8), C.am, 3) + tx(x0 + lw * 2.25, y0 - 14, "S", { t: 14, a: "middle", c: C.am, w: 700 });
    ["T", "T", "S", "T", "T", "T", "S"].forEach((t, i) => (s += tx(x0 + i * lw + lw, y0 - 14, t, { t: 15, a: "middle", w: 800, c: t === "S" ? C.am : C.ver })));
    s += tx(400, 320, "T = tom (duas teclas)  ·  S = semitom (uma tecla)", { t: 16, a: "middle", c: C.mudo });
    s += tx(400, 354, "Sustenido (#) sobe meio tom · Bemol (♭) desce meio tom", { t: 18, a: "middle", w: 600 });
    s += tx(400, 384, "Do Dó ao outro Dó = uma oitava. Entre Mi–Fá e Si–Dó não há tecla preta.", { t: 17, a: "middle", c: C.txt });
    s += tx(400, 420, "Cifras: C D E F G A B  =  Dó Ré Mi Fá Sol Lá Si", { t: 16, a: "middle", c: C.mudo });
    return svg("Teclado com as notas Dó a Si, tons e semitons, sustenido e bemol", s);
  };

  F.campo_harmonico = () => {
    let s = tx(400, 38, "Campo harmônico de Dó maior", { t: 25, a: "middle", w: 700 });
    const graus = [["I", "C", "Dó maior", 1], ["ii", "Dm", "Ré menor", 0], ["iii", "Em", "Mi menor", 0], ["IV", "F", "Fá maior", 1], ["V", "G", "Sol maior", 1], ["vi", "Am", "Lá menor", 0], ["vii°", "B°", "Si diminuto", 0]];
    graus.forEach(([g, c, n, p], i) => {
      const x = 36 + i * 100, cor = p ? C.am : C.az;
      s += rect(x, 90, 92, 170, { rx: 12, f: cor, op: p ? 0.18 : 0.08, s: cor, sw: p ? 3 : 2 }) + tx(x + 46, 124, g, { t: 22, a: "middle", w: 700, c: cor }) + tx(x + 46, 190, c, { t: 38, a: "middle", w: 800 }) + tx(x + 46, 232, quebra(n, 9), { t: 13, a: "middle", c: C.mudo });
    });
    s += tx(400, 300, "As 3 principais (amarelo): I – IV – V", { t: 20, a: "middle", c: C.am, w: 700 });
    s += tx(400, 334, "Em Dó: C, F e G. Com elas se toca muita música.", { t: 17, a: "middle" });
    s += tx(400, 366, "Maiúsculo = acorde maior · minúsculo = menor · ° = diminuto", { t: 16, a: "middle", c: C.mudo });
    s += tx(400, 404, "Mudar o tom é deslocar tudo junto (transposição): a ordem dos graus continua a mesma.", { t: 16, a: "middle", c: C.mudo });
    return svg("Sete acordes do campo harmônico de Dó maior e os graus I IV V", s);
  };

  F.cifra = () => {
    let s = tx(400, 38, "Lendo uma cifra", { t: 26, a: "middle", w: 700 });
    const lin1 = [["C", "Aqui vai a"], ["G", "letra da"], ["Am", "música e os"], ["F", "acordes"]];
    s += rect(40, 70, 720, 120, { rx: 14, f: "#ffffff", op: 0.05, s: C.linha, sw: 1.5 });
    lin1.forEach(([c, t], i) => { const x = 70 + i * 175; s += tx(x, 118, c, { t: 34, w: 800, c: C.am }) + tx(x, 160, t, { t: 24 }) + lin(x, 126, x, 138, C.am, 2); });
    const L = [["C", "maior"], ["Am", "menor (m)"], ["G7", "com sétima (7)"], ["C/E", "baixo na nota E"], ["F#", "sustenido"], ["Bb", "bemol"]];
    L.forEach(([c, d], i) => { const x = 50 + (i % 3) * 240, y = 232 + Math.floor(i / 3) * 62; s += tx(x, y, c, { t: 26, w: 800, c: C.am }) + tx(x + 78, y - 2, d, { t: 17, c: C.txt }); });
    s += tx(400, 380, "O acorde vale a partir da sílaba em que está escrito, até o próximo acorde.", { t: 17, a: "middle" });
    s += tx(400, 410, "Combinem antes: o tom, o andamento e a ordem das estrofes.", { t: 16, a: "middle", c: C.mudo });
    return svg("Exemplo de cifra com acordes sobre a letra e legenda de símbolos", s);
  };

  // ---------------------------------------------------------------- MÚSICOS
  F.afinador = () => {
    let s = tx(400, 38, "Afinar antes de ligar na mesa", { t: 26, a: "middle", w: 700 });
    const cx = 270, cy = 280, R = 160;
    s += '<path d="M' + (cx - R) + " " + cy + " A " + R + " " + R + " 0 0 1 " + (cx + R) + " " + cy + '" fill="none" stroke="' + C.linha + '" stroke-width="3"/>';
    [-50, -25, 0, 25, 50].forEach((c) => { const a = Math.PI + (c + 50) / 100 * Math.PI, x1 = cx + (R - 4) * Math.cos(a), y1 = cy + (R - 4) * Math.sin(a), x2 = cx + (R + 14) * Math.cos(a), y2 = cy + (R + 14) * Math.sin(a); s += lin(r1(x1), r1(y1), r1(x2), r1(y2), c === 0 ? C.ver : C.mudo, c === 0 ? 5 : 3) + tx(r1(cx + (R + 34) * Math.cos(a)), r1(cy + (R + 34) * Math.sin(a) + 5), c === 0 ? "0" : (c > 0 ? "+" : "") + c, { t: 14, a: "middle", c: C.mudo }); });
    s += '<g transform="translate(' + cx + " " + cy + ')"><line x1="0" y1="0" x2="0" y2="-140" stroke="' + C.am + '" stroke-width="5" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" values="-40;6;-4;1;0;0" dur="3.5s" repeatCount="indefinite"/></line></g>' + circ(cx, cy, 10, { f: C.am });
    s += tx(cx, cy + 56, "bemol ← afinado → sustenido", { t: 15, a: "middle", c: C.mudo }) + tx(cx, cy + 90, "cent = 1/100 de semitom", { t: 14, a: "middle", c: C.mudo });
    [["Corda solta, sem tocar forte", C.az], ["Aproxime a nota por baixo (suba até afinar)", C.ver], ["Afine todos com o mesmo afinador", C.am], ["Confira de novo depois de 5 minutos", C.rox], ["Lá = 440 Hz para todo o grupo", C.lar]].forEach(([t, c], i) => (s += rect(480, 88 + i * 58, 290, 46, { rx: 10, f: c, op: 0.1, s: c, sw: 1.5 }) + tx(494, 117 + i * 58, quebra(t, 34), { t: 14.5, c: C.txt })));
    s += tx(400, 432, "Instrumento desafinado não se conserta com EQ.", { t: 16, a: "middle", c: C.mudo });
    return svg("Afinador com ponteiro indicando se a nota está afinada, e dicas de afinação", s);
  };
  tabela("in_ear", "Comparação entre retorno de caixa e retorno in-ear", "Retorno de caixa × fone in-ear", [{ t: "", w: 1 }, { t: "Caixa de retorno", w: 1.6 }, { t: "Fone in-ear", w: 1.6 }], [
    ["Vantagem", "Sente o som do palco, sem fio no ouvido", "Retorno limpo, sem microfonia; volume mais baixo no palco"], ["Cuidado", "Mais volume no palco e mais risco de microfonia", "Isola o ouvido: use mistura que inclua a plateia"],
    ["Audição", "Volume alto no palco cansa o ouvido", "Protege, se o volume do fone for baixo"], ["Mix", "Mesma mistura para quem está na caixa", "Cada músico pode ter a própria mistura"], ["Custo", "Menor", "Maior (fone, transmissor, canais)"]], C.rox, "Em qualquer caso: volume baixo no fone e pausa para o ouvido descansar.");
  cartoes("sinais_palco", "Sinais combinados no palco", "Combinem sinais antes de começar", [
    ["Entrada", "Quem conta o tempo, olha o grupo e respira junto."], ["Repetir / seguir", "Um gesto simples para repetir o trecho ou ir adiante."], ["Final", "Mão fechada ou olhar combinado: terminam juntos."],
    ["Mais / menos", "Palma da mão para cima ou para baixo pede volume."], ["Solo", "Aceno de cabeça passa o solo para o próximo."]], C.lar, "Se não precisa falar no microfone, não fale: use o olhar e o gesto.");

  // ---------------------------------------------------------------- REGÊNCIA
  cartoes("postura_regente", "Postura do regente", "Postura do regente", [
    ["Pés firmes", "Afastados na largura dos ombros, peso equilibrado."], ["Ombros soltos", "Braços leves: tensão no corpo passa para o coro."], ["Plano do gesto", "Cintura à altura dos ombros, à frente do corpo."],
    ["Olhar", "Olhe o coro: o rosto também rege."], ["Respiração", "Respire com o grupo antes de cada entrada."]], C.lar, "Postura calma, gesto claro: o coro responde ao que vê.");
  cartoes("ensaio_coro", "Roteiro de um ensaio de coro", "Roteiro de um bom ensaio", [
    ["Aquecimento", "Respiração e voz, cinco a dez minutos."], ["Afinação", "Acorde sustentado, devagar, até soar limpo."], ["Trechos difíceis", "Devagar, separados por naipe, depois juntos."],
    ["Ligar as partes", "Una os trechos e aumente o andamento aos poucos."], ["Música inteira", "Cante do começo ao fim, sem parar."], ["Fechamento", "Anote o que melhorou e o que repetir."]], C.lar, "Pouco tempo bem usado rende mais que muito tempo sem plano.");
  tabela("andamentos", "Andamentos e faixas de BPM", "Andamentos e batidas por minuto (BPM)", [{ t: "Andamento", w: 1.2 }, { t: "BPM", w: 1 }, { t: "Sensação", w: 1.8 }], [
    ["Largo", "40–60", "muito lento, solene"], ["Adagio", "66–76", "lento, calmo"], ["Andante", "76–108", "andando, tranquilo"], ["Moderato", "108–120", "moderado"],
    ["Allegro", "120–156", "rápido, alegre"], ["Vivace", "156–168", "vivo"], ["Presto", "168–200", "muito rápido"]], C.lar, "Ajuste o metrônomo no BPM combinado antes de dar o gesto de preparação.");
})(FIG);

FIG.desenhar = (id) => (FIG.F[id] ? FIG.F[id]() : "");
