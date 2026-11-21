/* RMD AudioLab — BATERIA (20/11/2026, pedido do Rinaldo: o baterista vem primeiro no curso de músicos).
   1) Metrônomo do baterista: compasso, subdivisão (colcheia, tercina, semicolcheia), acento no tempo 1,
      "acelerador" (sobe o andamento sozinho) e "clique que some" (cala alguns compassos para o aluno segurar o tempo).
   2) Ritmos de louvor: o sistema toca bumbo, caixa, chimbal e prato (som sintetizado aqui mesmo, sem arquivo de áudio)
      e mostra a GRADE do ritmo (quem toca em cada tempo). Dá para calar uma peça (o aluno toca aquela peça junto)
      e para tocar nas casinhas e montar o próprio ritmo.
   Tudo funciona sem internet e sem microfone. Exercícios com nota (pelo botão ou pelo microfone) vêm na próxima etapa. */
"use strict";
const BateriaAL = (function () {
  const h = AL.h;
  let ctx = null;
  const audio = () => { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume(); return ctx; };
  const limitar = (v, a, b) => Math.max(a, Math.min(b, Math.round(Number(v) || a)));

  // ---------------------------------------------------------------- sons sintetizados
  let ruidoBuf = null;
  function ruido(c) {
    if (ruidoBuf) return ruidoBuf;
    const n = c.sampleRate, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return (ruidoBuf = b);
  }
  function envelope(c, t, pico, dur) { const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.001, pico), t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); return g; }
  function fonteRuido(c, t, dur) { const s = c.createBufferSource(); s.buffer = ruido(c); s.start(t); s.stop(t + dur + 0.05); return s; }
  const SOM = {
    bumbo(c, t, v, saida) { const o = c.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.18); const g = envelope(c, t, 1.0 * v, 0.35); o.connect(g).connect(saida); o.start(t); o.stop(t + 0.4); },
    caixa(c, t, v, saida) {
      const r = fonteRuido(c, t, 0.2), f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 1500; const g = envelope(c, t, 0.7 * v, 0.18); r.connect(f).connect(g).connect(saida);
      const o = c.createOscillator(); o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(160, t + 0.08); const g2 = envelope(c, t, 0.5 * v, 0.1); o.connect(g2).connect(saida); o.start(t); o.stop(t + 0.15);
    },
    chimbal(c, t, v, saida) { const r = fonteRuido(c, t, 0.06), f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 7000; const g = envelope(c, t, 0.35 * v, 0.05); r.connect(f).connect(g).connect(saida); },
    prato(c, t, v, saida) { const r = fonteRuido(c, t, 1.4), f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 4500; const g = envelope(c, t, 0.4 * v, 1.3); r.connect(f).connect(g).connect(saida); },
    // clique do metrônomo: 2 = tempo 1, 1 = outros tempos, 0 = subdivisão
    clique(c, t, forte, v, saida) { const o = c.createOscillator(); o.frequency.value = forte === 2 ? 1760 : forte === 1 ? 1180 : 820; const g = envelope(c, t, (forte === 2 ? 0.9 : forte === 1 ? 0.6 : 0.3) * v, 0.06); o.connect(g).connect(saida); o.start(t); o.stop(t + 0.08); },
  };

  // motor genérico: chama passo(i, tempoDoAudio) para cada "casinha" no tempo certo e aoVer(i) quando ela soa
  function motor(op) {
    let timer = 0, raf = 0, prox = 0, n = 0, fila = [], tocando = false, saida = null;
    const m = { get tocando() { return tocando; } };
    function agendar() { const c = ctx; while (prox < c.currentTime + 0.12) { const info = op.passo(n, prox, saida); fila.push({ n, t: prox, info }); n++; prox += op.duracao(); } }
    function quadro() { const c = ctx; while (fila.length && fila[0].t <= c.currentTime) { const b = fila.shift(); if (op.aoVer) op.aoVer(b.n, b.info); } raf = requestAnimationFrame(quadro); }
    m.tocar = () => { m.parar(); const c = audio(); saida = c.createGain(); saida.gain.value = op.volume ? op.volume() : 0.8; saida.connect(c.destination); tocando = true; n = 0; fila = []; prox = c.currentTime + 0.15; agendar(); timer = setInterval(agendar, 25); raf = requestAnimationFrame(quadro); };
    m.parar = () => { tocando = false; clearInterval(timer); cancelAnimationFrame(raf); fila = []; if (saida) { try { saida.disconnect(); } catch (e) { /* ok */ } saida = null; } };
    m.volume = (v) => { if (saida) saida.gain.value = v; };
    return m;
  }

  // ---------------------------------------------------------------- 1) metrônomo do baterista
  const SUBS = [["1", "Só os tempos (semínima)", 1], ["2", "Colcheias (2 por tempo)", 2], ["3", "Tercinas (3 por tempo)", 3], ["4", "Semicolcheias (4 por tempo)", 4]];
  const COMPS = [["2", "2/4", 2], ["3", "3/4", 3], ["4", "4/4", 4], ["6", "6/8", 6]];
  function telaMetronomo(el) {
    let bpm = 80, tempos = 4, sub = 1, compasso = 0, bpmAtual = 80;
    const num = h("input", { type: "number", min: 40, max: 240, value: bpm, "aria-label": "Andamento (BPM)", style: { width: "6rem" } });
    const selComp = h("select", { "aria-label": "Compasso" }, COMPS.map(([v, t]) => h("option", { value: v }, t))); selComp.value = "4";
    const selSub = h("select", { "aria-label": "Subdivisão" }, SUBS.map(([v, t]) => h("option", { value: v }, t)));
    const vol = h("input", { type: "range", min: 0, max: 100, value: 80, "aria-label": "Volume" });
    // acelerador
    const acel = h("input", { type: "checkbox" }), acelMais = h("input", { type: "number", min: 1, max: 20, value: 4, style: { width: "4.5rem" } }), acelCada = h("input", { type: "number", min: 1, max: 16, value: 4, style: { width: "4.5rem" } }), acelAte = h("input", { type: "number", min: 41, max: 240, value: 120, style: { width: "5.5rem" } });
    // clique que some
    const some = h("input", { type: "checkbox" }), someToca = h("input", { type: "number", min: 1, max: 8, value: 2, style: { width: "4.5rem" } }), someCala = h("input", { type: "number", min: 1, max: 8, value: 2, style: { width: "4.5rem" } });
    const grande = h("div", { style: { "font-size": "2.4rem", "font-weight": "900", "text-align": "center", margin: ".4rem 0" } }, "80 BPM");
    const aviso = h("div", { style: { "text-align": "center", "font-size": "1.2rem", "font-weight": "700", "min-height": "1.8rem", color: "#f2c94c" } });
    const luzes = h("div", { style: { display: "flex", gap: ".45rem", "justify-content": "center", "flex-wrap": "wrap", margin: ".5rem 0" } });
    let bolas = [];
    function montarLuzes() {
      AL.limpar(luzes); bolas = [];
      for (let t = 0; t < tempos; t++) for (let s = 0; s < sub; s++) {
        const principal = s === 0, b = h("div", { style: { width: principal ? "2.6rem" : "1.3rem", height: principal ? "2.6rem" : "1.3rem", "border-radius": "50%", "align-self": "center", display: "grid", "place-items": "center", "font-weight": "800", border: "3px solid " + (t === 0 && principal ? "#f2c94c" : principal ? "#49c7ef" : "#5d7a85") } }, principal ? String(t + 1) : "");
        bolas.push(b); luzes.append(b);
      }
    }
    const porCompasso = () => tempos * sub;
    // no 6/8 o pulso é a colcheia (6 por compasso), com acento no 1 e no 4
    const m = motor({
      duracao: () => 60 / bpmAtual / sub,
      volume: () => vol.value / 100,
      passo(n, t, saida) {
        const i = n % porCompasso(), c = Math.floor(n / porCompasso());
        if (i === 0 && n > 0 && acel.checked && c % limitar(acelCada.value, 1, 16) === 0) bpmAtual = Math.min(limitar(acelAte.value, 41, 240), bpmAtual + limitar(acelMais.value, 1, 20));
        const ciclo = limitar(someToca.value, 1, 8) + limitar(someCala.value, 1, 8);
        const calado = some.checked && (c % ciclo) >= limitar(someToca.value, 1, 8);
        const tempo = Math.floor(i / sub), s = i % sub;
        const forte = s ? 0 : tempo === 0 ? 2 : (tempos === 6 && tempo === 3) ? 2 : 1;
        if (!calado) SOM.clique(ctx, t, forte, 1, saida);
        return { i, c, calado, bpm: bpmAtual };
      },
      aoVer(n, info) {
        bolas.forEach((b, k) => { const on = k === info.i; b.style.background = on ? (info.calado ? "#3a4a52" : k === 0 ? "#f2c94c" : "#49c7ef") : "transparent"; b.style.color = on ? "#0b1820" : ""; });
        grande.textContent = info.bpm + " BPM";
        const limite = limitar(acelAte.value, 41, 240);
        aviso.textContent = info.calado ? "🔇 Segure o tempo!" : !acel.checked ? "Compasso " + (info.c + 1)
          : info.bpm >= limite ? "Compasso " + (info.c + 1) + " · chegou em " + limite + " BPM 🏁" : "Compasso " + (info.c + 1) + " · acelerando até " + limite;
      },
    });
    function atualizar() {
      bpm = limitar(num.value, 40, 240); num.value = bpm; bpmAtual = bpm; grande.textContent = bpm + " BPM";
      tempos = Number(selComp.value); sub = tempos === 6 ? 1 : Number(selSub.value); selSub.disabled = tempos === 6;
      montarLuzes(); if (m.tocando) m.tocar();
    }
    const botao = h("button", { class: "primario bloco", style: { "font-size": "1.3rem", padding: "1rem" }, onclick: () => { if (m.tocando) { m.parar(); botao.textContent = "▶ Tocar"; aviso.textContent = ""; } else { bpmAtual = bpm; m.tocar(); botao.textContent = "■ Parar"; } } }, "▶ Tocar");
    num.onchange = atualizar; selComp.onchange = atualizar; selSub.onchange = atualizar; vol.oninput = () => m.volume(vol.value / 100);
    [acel, some].forEach((x) => (x.onchange = () => { if (m.tocando) { bpmAtual = bpm; m.tocar(); } }));
    AL.limpar(el, h("div", { class: "cartao" },
      h("h2", {}, "🥁 Metrônomo do baterista"),
      h("p", { class: "mudo" }, "O tempo 1 é o mais agudo. A subdivisão ajuda a tocar colcheias, tercinas e semicolcheias bem iguais."),
      h("div", { class: "linha", style: { gap: ".5rem", "flex-wrap": "wrap", "align-items": "center" } },
        h("button", { onclick: () => { num.value = bpm - 5; atualizar(); } }, "− 5"), num, h("button", { onclick: () => { num.value = bpm + 5; atualizar(); } }, "+ 5"), h("span", {}, "BPM")),
      h("label", {}, "Compasso"), selComp, h("label", {}, "Subdivisão (som mais baixo entre os tempos)"), selSub,
      h("label", {}, "Volume"), vol,
      h("div", { class: "cartao", style: { margin: ".6rem 0" } },
        h("label", { class: "linha", style: { gap: ".5rem", "align-items": "center" } }, acel, h("b", {}, "🚀 Acelerador")),
        h("div", { class: "linha", style: { gap: ".4rem", "flex-wrap": "wrap", "align-items": "center" } }, h("span", {}, "Sobe"), acelMais, h("span", {}, "BPM a cada"), acelCada, h("span", {}, "compassos, até"), acelAte, h("span", {}, "BPM."))),
      h("div", { class: "cartao", style: { margin: ".6rem 0" } },
        h("label", { class: "linha", style: { gap: ".5rem", "align-items": "center" } }, some, h("b", {}, "🔇 Clique que some")),
        h("div", { class: "linha", style: { gap: ".4rem", "flex-wrap": "wrap", "align-items": "center" } }, h("span", {}, "Toca"), someToca, h("span", {}, "compassos e cala"), someCala, h("span", {}, "compassos. Continue tocando no tempo quando ele calar!"))),
      botao, grande, luzes, aviso));
    atualizar();
    return { parar: () => m.parar() };
  }

  // ---------------------------------------------------------------- 2) ritmos de louvor
  // grade: cada linha é uma peça; "x" toca forte, "o" toca fraco, "." não toca. Passos por compasso = tamanho da linha.
  // passosPorTempo: 4 = semicolcheias; 3 = tercinas (shuffle/6/8 em 2). tempos = tempos por compasso (para o clique e a contagem).
  const RITMOS = [
    { id: "balada", nome: "Balada (louvor lento)", bpm: 68, tempos: 4, ppt: 4, linhas: {
      prato:   "x...............",
      chimbal: "x.o.x.o.x.o.x.o.",
      caixa:   "....x.......x...",
      bumbo:   "x.......x.x.....",
    } },
    { id: "pop", nome: "Pop / louvor animado", bpm: 100, tempos: 4, ppt: 4, linhas: {
      prato:   "x...............",
      chimbal: "x.x.x.x.x.x.x.x.",
      caixa:   "....x.......x...",
      bumbo:   "x.....x.x.......",
    } },
    { id: "rock", nome: "Rock", bpm: 120, tempos: 4, ppt: 4, linhas: {
      prato:   "x...............",
      chimbal: "x.x.x.x.x.x.x.x.",
      caixa:   "....x.......x...",
      bumbo:   "x.x.....x.x.....",
    } },
    { id: "seis", nome: "6/8 (louvor de adoração)", bpm: 55, tempos: 2, ppt: 3, nota: "Contado em 2 (cada tempo tem 3 colcheias).", linhas: {
      prato:   "x.....",
      chimbal: "xoooxo",
      caixa:   "...x..",
      bumbo:   "x.....",
    } },
    { id: "shuffle", nome: "Shuffle gospel", bpm: 85, tempos: 4, ppt: 3, linhas: {
      prato:   "x...........",
      chimbal: "x.ox.ox.ox.o",
      caixa:   "...x.....x..",
      bumbo:   "x.....x.....",
    } },
    { id: "valsa", nome: "Valsa 3/4", bpm: 90, tempos: 3, ppt: 4, linhas: {
      prato:   "x...........",
      chimbal: "....x...x...",
      caixa:   "....o...o...",
      bumbo:   "x...........",
    } },
    { id: "baiao", nome: "Baião (base simples)", bpm: 95, tempos: 2, ppt: 4, linhas: {
      prato:   "x.......",
      chimbal: "xoxoxoxo",
      caixa:   "....x...",
      bumbo:   "x..x....",
    } },
  ];
  const PECAS = [["prato", "Prato"], ["chimbal", "Chimbal"], ["caixa", "Caixa"], ["bumbo", "Bumbo"]];
  const COR = { prato: "#f2c94c", chimbal: "#49c7ef", caixa: "#ff8a65", bumbo: "#7fd18b" };

  // partitura do ritmo (20/11/2026) com o VexFlow (licença MIT, static/vendor/vexflow): só carrega quando pedem.
  // Bumbo no espaço de baixo, caixa no 3º espaço, chimbal e prato com cabeça em "x" em cima (escrita comum de bateria).
  const NOTA_PECA = { prato: "a/5/x2", chimbal: "g/5/x2", caixa: "c/5", bumbo: "f/4" };
  // forma de leitura guardada no aparelho (0 Básico, 1 Intermediário, 2 Avançado) — a mesma dos Músicos
  const leituraBat = () => (typeof MusicosAL !== "undefined" ? MusicosAL.leitura() : (() => { try { return Number(localStorage.getItem("al_leitura")) || 0; } catch (e) { return 0; } })());
  async function desenharPartitura(caixa, r, grade) {
    const carregar = typeof MusicosAL !== "undefined" ? MusicosAL.carregarScript : (src) => new Promise((ok, erro) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = erro; document.head.append(s); });
    await carregar("vendor/vexflow/vexflow.js");
    const VF = window.VexFlow;
    const passos = r.tempos * r.ppt, oitavas = r.ppt === 3;   // ppt 3 = colcheias em 6/8 ou 12/8
    const compasso = oitavas ? (r.tempos * 3) + "/8" : r.tempos + "/4";
    const DUR = oitavas ? { 1: "8", 2: "q", 3: "qd" } : { 1: "16", 2: "8", 3: "8d", 4: "q" };
    const notas = [];
    for (let t = 0; t < r.tempos; t++) {
      let s = t * r.ppt; const fimTempo = s + r.ppt;
      while (s < fimTempo) {
        const pecas = PECAS.map(([id]) => id).filter((id) => grade[id][s] !== ".");
        let tam = 1; while (s + tam < fimTempo && !PECAS.some(([id]) => grade[id][s + tam] !== ".")) tam++;
        const dur = DUR[tam] || DUR[1];
        const n = new VF.StaveNote({ keys: pecas.length ? pecas.map((id) => NOTA_PECA[id]) : ["b/4"], duration: dur + (pecas.length ? "" : "r"), clef: "percussion", autoStem: false, stemDirection: 1 });
        if (dur.endsWith("d")) VF.Dot.buildAndAttach([n], { all: true });
        notas.push(n); s += tam;
      }
    }
    caixa.innerHTML = "";
    const largura = Math.max(320, Math.min(900, caixa.clientWidth || 600));
    const rend = new VF.Renderer(caixa, VF.Renderer.Backends.SVG); rend.resize(largura, 165);
    const g = rend.getContext(); g.setFillStyle("#111"); g.setStrokeStyle("#111");
    const pauta = new VF.Stave(8, 38, largura - 16); pauta.addClef("percussion").addTimeSignature(compasso).setContext(g).draw();
    const vigas = VF.Beam.generateBeams(notas, Object.assign({ stemDirection: VF.Stem.UP, maintainStemDirections: false }, oitavas ? { groups: [new VF.Fraction(3, 8)] } : {}));
    VF.Formatter.FormatAndDraw(g, pauta, notas);
    vigas.forEach((b) => b.setContext(g).draw());
    const svg = caixa.querySelector("svg"); if (svg) { svg.style.background = "#fff"; svg.style.borderRadius = "10px"; svg.style.maxWidth = "100%"; svg.style.height = "auto"; }
  }

  function telaRitmos(el) {
    let r = null, grade = {}, mudas = {}, bpm = 80, clique = false, verPartitura = false;
    const partitura = h("div", { style: { margin: ".4rem 0", overflow: "auto" } });
    const legenda = h("p", { class: "mudo", style: { display: "none" } }, "Na partitura: bumbo embaixo, caixa no meio, chimbal (x) e prato (x) em cima.");
    const mostrarPartitura = () => {
      partitura.style.display = verPartitura ? "" : "none"; legenda.style.display = verPartitura ? "" : "none";
      if (verPartitura) desenharPartitura(partitura, r, grade).catch((e) => { partitura.textContent = "⚠️ Não consegui desenhar a partitura: " + e.message; });
    };
    const botaoPartitura = h("button", { onclick: () => { verPartitura = !verPartitura; botaoPartitura.textContent = verPartitura ? "📄 Esconder a partitura" : "📄 Ver a partitura"; mostrarPartitura(); } }, "📄 Ver a partitura");
    const sel = h("select", { "aria-label": "Ritmo" }, RITMOS.map((x) => h("option", { value: x.id }, x.nome)));
    const num = h("input", { type: "number", min: 40, max: 220, value: 80, "aria-label": "Andamento (BPM)", style: { width: "6rem" } });
    const vol = h("input", { type: "range", min: 0, max: 100, value: 80, "aria-label": "Volume" });
    const nota = h("p", { class: "mudo" });
    const caixaGrade = h("div", { style: { overflow: "auto", margin: ".6rem 0" } });
    const contagem = h("div", { style: { "text-align": "center", "font-size": "1.6rem", "font-weight": "900", "min-height": "2.2rem" } });
    const botoesMudo = h("div", { class: "linha", style: { gap: ".4rem", "flex-wrap": "wrap" } });
    const botaoClique = h("button", {}, "Clique do metrônomo: desligado");
    let celulas = {};
    const passos = () => r.tempos * r.ppt;
    function desenhar() {
      celulas = {};
      // casinhas estreitas o bastante para os 16 passos caberem na tela do celular
      const tab = h("div", { style: { display: "grid", "grid-template-columns": `3.7rem repeat(${passos()}, minmax(.8rem, 1fr))`, gap: "2px", "min-width": (3.7 + passos() * 0.95) + "rem" } });
      // cabeçalho com a contagem: 1 e 2 e… (semicolcheia: 1 e e a) / tercina: 1 e a
      tab.append(h("div"));
      for (let p = 0; p < passos(); p++) {
        const t = Math.floor(p / r.ppt), s = p % r.ppt;
        // Básico: só os números dos tempos; Intermediário/Avançado: a contagem completa (1 e & a)
        const rot = s === 0 ? String(t + 1) : leituraBat() === 0 ? "" : r.ppt === 4 ? ["", "e", "&", "a"][s] : ["", "e", "a"][s];
        tab.append(h("div", { style: { "text-align": "center", "font-size": ".8rem", color: s === 0 ? "#fff" : "#7d97a1", "font-weight": s === 0 ? "800" : "400" } }, rot));
      }
      PECAS.forEach(([id, nome]) => {
        tab.append(h("div", { style: { "font-weight": "700", "font-size": ".8rem", color: mudas[id] ? "#5d7a85" : COR[id], "align-self": "center" } }, (mudas[id] ? "🔇 " : "") + nome));
        celulas[id] = [];
        for (let p = 0; p < passos(); p++) {
          const v = grade[id][p];
          const c = h("button", { "aria-label": nome + " passo " + (p + 1), style: { height: "2.2rem", padding: "0", "border-radius": "6px", border: "1px solid #2a3a42", "border-left": p % r.ppt === 0 ? "2px solid #5d7a85" : "1px solid #2a3a42", background: v === "x" ? COR[id] : v === "o" ? COR[id] + "77" : "#101a1f" },
            onclick: () => { grade[id][p] = v === "." ? "x" : v === "x" ? "o" : "."; desenhar(); } });
          celulas[id].push(c); tab.append(c);
        }
      });
      AL.limpar(caixaGrade, tab);
      if (verPartitura) mostrarPartitura();
      AL.limpar(botoesMudo, PECAS.map(([id, nome]) => h("button", { class: mudas[id] ? "perigo" : "", onclick: () => { mudas[id] = !mudas[id]; desenhar(); } }, (mudas[id] ? "🔇 " : "🔊 ") + nome)));
    }
    let ultimo = -1;
    const m = motor({
      duracao: () => 60 / bpm / r.ppt,
      volume: () => vol.value / 100,
      passo(n, t, saida) {
        const p = n % passos();
        PECAS.forEach(([id]) => { const v = grade[id][p]; if (v !== "." && !mudas[id] && !(id === "prato" && n >= passos() && Math.floor(n / passos()) % 4 !== 0)) SOM[id](ctx, t, v === "x" ? 1 : 0.5, saida); });
        if (clique && p % r.ppt === 0) SOM.clique(ctx, t, p === 0 ? 2 : 1, 0.6, saida);
        return { p };
      },
      aoVer(n, info) {
        if (ultimo >= 0) PECAS.forEach(([id]) => { const c = celulas[id] && celulas[id][ultimo]; if (c) c.style.outline = ""; });
        PECAS.forEach(([id]) => { const c = celulas[id] && celulas[id][info.p]; if (c) c.style.outline = "3px solid #fff"; });
        ultimo = info.p;
        if (info.p % r.ppt === 0) contagem.textContent = String(Math.floor(info.p / r.ppt) + 1);
      },
    });
    function escolher() {
      r = RITMOS.find((x) => x.id === sel.value); bpm = r.bpm; num.value = bpm; mudas = {}; ultimo = -1;
      grade = {}; PECAS.forEach(([id]) => (grade[id] = (r.linhas[id] || ".".repeat(passos())).split("")));
      nota.textContent = (r.nota ? r.nota + " " : "") + "Toque nas casinhas para mudar o ritmo (forte → fraco → apaga). O prato soa no começo de cada 4 compassos.";
      desenhar(); if (m.tocando) m.tocar();
    }
    const botao = h("button", { class: "primario bloco", style: { "font-size": "1.3rem", padding: "1rem" }, onclick: () => { if (m.tocando) { m.parar(); botao.textContent = "▶ Tocar o ritmo"; contagem.textContent = ""; } else { m.tocar(); botao.textContent = "■ Parar"; } } }, "▶ Tocar o ritmo");
    sel.onchange = escolher;
    num.onchange = () => { bpm = limitar(num.value, 40, 220); num.value = bpm; };
    vol.oninput = () => m.volume(vol.value / 100);
    botaoClique.onclick = () => { clique = !clique; botaoClique.textContent = "Clique do metrônomo: " + (clique ? "ligado" : "desligado"); };
    AL.limpar(el, h("div", { class: "cartao" },
      h("h2", {}, "🎶 Ritmos de louvor"),
      h("p", { class: "mudo" }, "Escolha o ritmo, ouça e veja na grade quem toca em cada tempo. Para treinar, cale uma peça e toque ela junto no seu instrumento."),
      h("label", {}, "Ritmo"), sel,
      h("div", { class: "linha", style: { gap: ".5rem", "flex-wrap": "wrap", "align-items": "center", margin: ".5rem 0" } },
        h("button", { onclick: () => { num.value = bpm - 5; num.onchange(); } }, "− 5"), num, h("button", { onclick: () => { num.value = bpm + 5; num.onchange(); } }, "+ 5"), h("span", {}, "BPM"), botaoClique),
      h("label", {}, "Volume"), vol,
      botao, contagem, caixaGrade,
      // a partitura é do nível Avançado de leitura (nem todo mundo lê partitura)
      leituraBat() === 2 ? botaoPartitura : h("p", { class: "mudo" }, "📄 A partitura deste ritmo aparece no nível Avançado de leitura (escolha em “📖 Leitura”, no alto)."),
      legenda, partitura, h("b", {}, "Calar uma peça (você toca ela):"), botoesMudo, nota));
    escolher();
    return { parar: () => m.parar() };
  }

  // ---------------------------------------------------------------- 3) exercícios com nota (20/11/2026)
  // O aluno toca no botão grande da tela OU no pad/caixa/bateria com o microfone ligado. O sistema compara cada batida
  // com o tempo certo: diz se está adiantando ou atrasando (em milésimos de segundo), se está regular e dá a nota.
  // A nota vai para a pasta do aluno (área "bateria"), com o nível no nome (" · Básico" etc.), como os outros treinos.
  const MAOS = { simples: "DEDE", duplo: "DDEE", paradiddle: "DEDDEDEE" };
  const EXERCICIOS = {
    tempo: { botao: "🎯 Tocar no tempo", nome: "Tocar no tempo", explica: "Toque junto com o clique, em cada batida, bem certinho.",
      niveis: [{ bpm: 70, sub: 1, compassos: 4, tol: 35, txt: "70 BPM · uma batida por tempo" }, { bpm: 90, sub: 2, compassos: 4, tol: 28, txt: "90 BPM · colcheias (2 por tempo)" }, { bpm: 110, sub: 2, compassos: 4, tol: 22, txt: "110 BPM · colcheias" }] },
    rudimento: { botao: "🥢 Rudimentos", nome: "Rudimentos", explica: "Siga as mãos na tela: D = direita, E = esquerda. Toque todas as batidas iguais.", escolhe: true,
      niveis: [{ bpm: 60, sub: 2, compassos: 4, tol: 35, txt: "60 BPM · colcheias" }, { bpm: 80, sub: 2, compassos: 4, tol: 28, txt: "80 BPM · colcheias" }, { bpm: 80, sub: 4, compassos: 2, tol: 22, txt: "80 BPM · semicolcheias" }] },
    segurar: { botao: "🔇 Segure o tempo", nome: "Segure o tempo", explica: "O clique vai sumir em alguns compassos. Continue tocando no tempo até ele voltar!",
      niveis: [{ bpm: 70, sub: 1, compassos: 8, toca: 2, cala: 2, tol: 40, txt: "70 BPM · toca 2 compassos, cala 2" }, { bpm: 85, sub: 1, compassos: 8, toca: 2, cala: 2, tol: 32, txt: "85 BPM · toca 2, cala 2" }, { bpm: 100, sub: 1, compassos: 8, toca: 1, cala: 3, tol: 26, txt: "100 BPM · toca 1, cala 3" }] },
  };
  // microfone: detecta cada batida (ataque) pela subida rápida do volume. O limiar se ajusta ao volume do clique
  // ouvido na contagem de entrada, para o próprio clique do celular não contar como batida.
  async function abrirMicBateria(aoBater) {
    if (!window.isSecureContext || !navigator.mediaDevices) throw new Error("O microfone só funciona no endereço seguro. No celular, use o botão “Abrir com microfone (endereço seguro)” das Ferramentas.");
    const c = audio();
    const stream = await AL.microfone({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const src = c.createMediaStreamSource(stream), proc = c.createScriptProcessor(512, 1, 1), mudo = c.createGain(); mudo.gain.value = 0;
    src.connect(proc); proc.connect(mudo).connect(c.destination);
    const st = { limiar: 0.12, calibrando: false, picoCal: 0, ultimo: 0 };
    proc.onaudioprocess = (e) => {
      const d = e.inputBuffer.getChannelData(0); let pico = 0;
      for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > pico) pico = v; }
      const t = c.currentTime - d.length / c.sampleRate;      // momento aproximado em que o som chegou
      if (st.calibrando) { st.picoCal = Math.max(st.picoCal, pico); return; }
      if (pico > st.limiar && t - st.ultimo > 0.07) { st.ultimo = t; aoBater(t); }
    };
    return { st, fechar: () => { proc.onaudioprocess = null; try { proc.disconnect(); src.disconnect(); } catch (e) { /* ok */ } stream.getTracks().forEach((x) => x.stop()); } };
  }
  function avaliar(esperados, toques, intervalo, tol, mudos) {
    // para cada batida esperada, o toque mais perto (até meia distância entre batidas)
    const usados = new Set(), difs = [], difsMudo = [];
    esperados.forEach((b, k) => {
      let mel = -1, md = Infinity;
      toques.forEach((t, i) => { const d = Math.abs(t - b); if (!usados.has(i) && d < md) { md = d; mel = i; } });
      if (mel >= 0 && md < intervalo / 2) { usados.add(mel); const d = (toques[mel] - b) * 1000; difs.push(d); if (mudos && mudos[k]) difsMudo.push(d); }
    });
    const n = esperados.length, acertos = difs.length;
    if (acertos < Math.max(3, n * 0.3)) return { nota: 0, acertos, n, poucos: true };
    const media = (a) => a.reduce((s, x) => s + x, 0) / a.length;
    const med = media(difs), desv = Math.sqrt(difs.reduce((s, x) => s + (x - med) ** 2, 0) / difs.length);
    const extras = Math.max(0, toques.length - acertos - 2);   // toques a mais (sobrando), com folga de 2
    let nota = 100 - Math.max(0, Math.abs(med) - tol) * 0.6 - Math.max(0, desv - tol) * 0.7 - (n - acertos) * (150 / n) - extras * 2;
    const r = { acertos, n, med, desv, extras };
    if (difsMudo.length) { r.medMudo = media(difsMudo); r.acertosMudo = difsMudo.length; nota -= Math.max(0, Math.abs(r.medMudo) - tol * 1.5) * 0.4; }
    r.nota = Math.max(0, Math.min(100, Math.round(nota)));
    return r;
  }
  const dizerTempo = (ms, tol) => (Math.abs(ms) <= tol ? "no tempo ✅" : ms > 0 ? "atrasando " + Math.round(ms) + " ms" : "adiantando " + Math.round(-ms) + " ms");

  function telaExercicios(el) {
    let parar = () => {};
    const area = h("div");
    const lista = h("div", { class: "linha", style: { gap: ".4rem", "flex-wrap": "wrap", margin: ".4rem 0" } },
      Object.entries(EXERCICIOS).map(([id, x]) => h("button", { onclick: () => { parar(); parar = abrir(id); } }, x.botao)));
    function abrir(id) {
      const ex = EXERCICIOS[id];
      let mic = null, rodando = false, timer = 0, raf = 0, saida = null;
      const nivelBox = typeof TreinosAL !== "undefined" ? TreinosAL.seletorNivel("bateria", () => mostrarNivel()) : h("div");
      const nivelAtual = () => (typeof TreinosAL !== "undefined" ? TreinosAL.nivel("bateria") : 0);
      const selMaos = ex.escolhe ? h("select", { "aria-label": "Rudimento" }, [["simples", "Toque simples (D E D E)"], ["duplo", "Toque duplo (D D E E)"], ["paradiddle", "Paradiddle (D E D D E D E E)"]].map(([v, t]) => h("option", { value: v }, t))) : null;
      const usarMic = h("input", { type: "checkbox" });
      const infoNivel = h("p", { class: "mudo" });
      const contador = h("div", { style: { "text-align": "center", "font-size": "3rem", "font-weight": "900", "min-height": "3.6rem" } });
      const maosEl = h("div", { style: { display: "flex", gap: ".35rem", "justify-content": "center", "flex-wrap": "wrap", "min-height": "2.6rem", margin: ".3rem 0" } });
      const pad = h("button", { class: "bloco", disabled: true, style: { "font-size": "1.6rem", padding: "2.2rem 1rem", "border-radius": "22px", "touch-action": "manipulation", "user-select": "none" } }, "🥁 TOQUE AQUI");
      const resultado = h("div");
      const comecar = h("button", { class: "primario bloco", style: { "font-size": "1.2rem", padding: ".9rem" } }, "▶ Começar");
      function mostrarNivel() { const N = ex.niveis[nivelAtual()]; infoNivel.textContent = "Nível " + TreinosAL.NIVEIS[nivelAtual()] + ": " + N.txt + "."; }
      function pararTudo() { rodando = false; clearInterval(timer); cancelAnimationFrame(raf); if (mic) { mic.fechar(); mic = null; } if (saida) { try { saida.disconnect(); } catch (e) { /* ok */ } saida = null; } pad.disabled = true; comecar.disabled = false; }
      async function iniciar() {
        pararTudo(); AL.limpar(resultado);
        const N = ex.niveis[nivelAtual()], c = audio(), tempos = 4, sub = N.sub, passo = 60 / N.bpm / sub;
        const maos = selMaos ? MAOS[selMaos.value] : null;
        const total = tempos * sub * N.compassos, entrada = tempos;   // 1 compasso de contagem (só os tempos)
        const lat = (c.outputLatency || 0) + (c.baseLatency || 0);   // o som sai um pouquinho depois do agendado
        const toques = [];
        if (usarMic.checked) {
          try { mic = await abrirMicBateria((t) => toques.push(t)); }
          catch (e) { AL.toast(e.message, true); usarMic.checked = false; return; }
        }
        saida = c.createGain(); saida.gain.value = 0.9; saida.connect(c.destination);
        const t0 = c.currentTime + 0.4, inicio = t0 + entrada * (60 / N.bpm);
        const esperados = [], mudos = [];
        // contagem de entrada
        for (let i = 0; i < entrada; i++) SOM.clique(c, t0 + i * 60 / N.bpm, i === 0 ? 2 : 1, 1, saida);
        for (let k = 0; k < total; k++) {
          const t = inicio + k * passo, comp = Math.floor(k / (tempos * sub)), noTempo = k % sub === 0;
          const calado = id === "segurar" && (comp % (N.toca + N.cala)) >= N.toca;
          if (!calado) SOM.clique(c, t, !noTempo ? 0 : (k % (tempos * sub) === 0 ? 2 : 1), noTempo ? 1 : 0.7, saida);
          esperados.push(t + lat); mudos.push(calado);
        }
        if (mic) { mic.st.calibrando = true; mic.st.picoCal = 0; setTimeout(() => { if (mic) { mic.st.calibrando = false; mic.st.limiar = Math.max(0.08, mic.st.picoCal * 2.2); } }, (t0 - c.currentTime + entrada * 60 / N.bpm - 0.05) * 1000); }
        const off = performance.now() / 1000 - c.currentTime;   // relógio da tela → relógio do áudio
        pad.onpointerdown = (e) => { e.preventDefault(); if (rodando) { toques.push(performance.now() / 1000 - off); pad.style.background = "#49c7ef"; setTimeout(() => (pad.style.background = ""), 70); } };
        AL.limpar(maosEl, maos ? maos.split("").map((m) => h("div", { style: { width: "2.3rem", height: "2.3rem", "border-radius": "10px", display: "grid", "place-items": "center", "font-weight": "900", "font-size": "1.2rem", border: "2px solid " + (m === "D" ? "#49c7ef" : "#f2c94c") } }, m)) : []);
        rodando = true; pad.disabled = false; comecar.disabled = true;
        const fim = inicio + total * passo + 0.6;
        const desenhar = () => {
          const agora = c.currentTime;
          if (agora < inicio) contador.textContent = "Prepare… " + Math.min(entrada, Math.floor((agora - t0) / (60 / N.bpm)) + 1);
          else {
            const k = Math.min(total - 1, Math.floor((agora - inicio) / passo)), comp = Math.floor(k / (tempos * sub));
            contador.textContent = mudos[k] ? "🔇 " + (Math.floor((k % (tempos * sub)) / sub) + 1) : String(Math.floor((k % (tempos * sub)) / sub) + 1);
            if (maos) [...maosEl.children].forEach((b, i) => { b.style.background = i === k % maos.length ? (maos[i] === "D" ? "#49c7ef" : "#f2c94c") : "transparent"; b.style.color = i === k % maos.length ? "#0b1820" : ""; });
            void comp;
          }
          if (agora < fim && rodando) raf = requestAnimationFrame(desenhar);
        };
        raf = requestAnimationFrame(desenhar);
        timer = setInterval(() => {
          if (c.currentTime < fim) return;
          clearInterval(timer); pararTudo(); contador.textContent = "";
          const r = avaliar(esperados, toques, passo, N.tol, id === "segurar" ? mudos : null);
          const rotulo = "Bateria · " + ex.nome + (maos ? " (" + selMaos.options[selMaos.selectedIndex].text.split(" (")[0] + ")" : "") + (typeof TreinosAL !== "undefined" ? TreinosAL.rotulo("bateria") : "");
          if (r.poucos) { AL.limpar(resultado, h("div", { class: "cartao aviso" }, "Poucas batidas captadas (" + r.acertos + " de " + r.n + "). " + (usarMic.checked ? "Toque mais forte perto do celular ou use o botão da tela." : "Toque no botão grande junto com o clique."))); return; }
          const detalhe = dizerTempo(r.med, N.tol) + " · regularidade " + (r.desv <= N.tol ? "boa" : "irregular (" + Math.round(r.desv) + " ms)") + " · " + r.acertos + "/" + r.n + " batidas"
            + (r.medMudo != null ? " · sem o clique: " + dizerTempo(r.medMudo, N.tol * 1.5) : "") + (r.extras ? " · " + r.extras + " toque(s) a mais" : "") + " · " + N.bpm + " BPM" + (usarMic.checked ? " · microfone" : "");
          AL.limpar(resultado, h("div", { class: "cartao" },
            h("h2", {}, "Resultado: " + r.nota + "%"),
            h("p", {}, r.nota >= 80 ? "🎉 Muito bem! Pode subir o andamento ou o nível." : r.nota >= 50 ? "👍 Está no caminho. Repita prestando atenção no clique." : "🔁 Vamos de novo, mais devagar e com calma."),
            h("ul", {}, h("li", {}, "Tempo: " + dizerTempo(r.med, N.tol)), h("li", {}, "Regularidade: " + (r.desv <= N.tol ? "boa" : "irregular — as batidas variam " + Math.round(r.desv) + " ms")),
              h("li", {}, "Batidas certas: " + r.acertos + " de " + r.n), r.medMudo != null ? h("li", {}, "Quando o clique sumiu: " + dizerTempo(r.medMudo, N.tol * 1.5)) : null),
            usarMic.checked ? h("p", { class: "mudo" }, "Com o microfone, o atraso do próprio celular pode mudar alguns milésimos. A regularidade vale do mesmo jeito.") : null,
            typeof TreinosAL !== "undefined" ? TreinosAL.caixa("bateria", rotulo, r.nota, detalhe) : null));
        }, 100);
      }
      comecar.onclick = iniciar;
      AL.limpar(area, h("div", { class: "cartao" },
        h("h2", {}, ex.botao), h("p", {}, ex.explica), nivelBox, infoNivel, selMaos ? h("div", {}, h("label", {}, "Rudimento"), selMaos) : null,
        h("label", { class: "linha", style: { gap: ".5rem", "align-items": "center", margin: ".5rem 0" } }, usarMic, h("span", {}, "🎤 Ouvir pelo microfone (toque no pad, na caixa ou na bateria). Desligado: toque no botão grande.")),
        comecar, contador, maosEl, pad, h("p", { class: "mudo" }, "Há 1 compasso de contagem antes de começar. Use fone de ouvido se puder."), resultado));
      mostrarNivel();
      return pararTudo;
    }
    AL.limpar(el, h("div", { class: "cartao" }, h("h2", {}, "📝 Exercícios com nota"), h("p", { class: "mudo" }, "A nota vai para a pasta do aluno e o professor acompanha. Níveis: Básico → Intermediário → Avançado."), lista), area);
    return { parar: () => parar() };
  }

  // ---------------------------------------------------------------- painel com as abas
  function painel(el) {
    let atual = null;
    const area = h("div");
    const abas = [["Metrônomo do baterista", telaMetronomo], ["Ritmos de louvor", telaRitmos], ["Exercícios com nota", telaExercicios]];
    const botoes = abas.map(([nome, fn]) => h("button", { onclick: (e) => { if (atual) atual.parar(); botoes.forEach((b) => b.classList.remove("ligado")); e.currentTarget.classList.add("ligado"); atual = fn(area); } }, nome));
    // mesma escolha de leitura dos Músicos (Dó Ré Mi / cifra / partitura); trocar desenha de novo a aba aberta
    const leituraEl = typeof MusicosAL !== "undefined" ? MusicosAL.seletorLeitura(() => { const b = botoes.find((x) => x.classList.contains("ligado")); if (b) b.click(); }) : null;
    AL.limpar(el, leituraEl, h("div", { class: "linha", style: { gap: ".4rem", "flex-wrap": "wrap", "margin-bottom": ".6rem" } }, botoes), area);
    botoes[0].click();
    return { parar: () => { if (atual) atual.parar(); } };
  }

  return { painel, RITMOS, EXERCICIOS, _avaliar: avaliar };
})();
