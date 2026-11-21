/* RMD AudioLab — MÚSICOS: violão, teclado e contrabaixo (20/11/2026, pedido do Rinaldo).
   1) Nota do cantor: o microfone ouve a voz e mostra a nota grande (Sol = G), onde ela fica no teclado e no braço do
      violão/contrabaixo, e vai descobrindo o TOM da música (perfis de Krumhansl–Kessler) com os acordes do tom.
   2) Tom e acordes: escolha o tom e veja o campo harmônico (com as notas de cada acorde) e TROQUE O TOM de uma cifra.
   3) Percepção (com nota, vai para a pasta do aluno): "Que nota é essa?" e "Maior ou menor?", com níveis.
   O microfone é usado só ao vivo, no próprio aparelho: nada é gravado nem enviado. */
"use strict";
const MusicosAL = (function () {
  const h = AL.h;
  let ctx = null;
  const audio = () => { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume(); return ctx; };
  const PT = ["Dó", "Dó#", "Ré", "Ré#", "Mi", "Fá", "Fá#", "Sol", "Sol#", "Lá", "Lá#", "Si"];
  const PT_B = ["Dó", "Réb", "Ré", "Mib", "Mi", "Fá", "Solb", "Sol", "Láb", "Lá", "Sib", "Si"];
  const CIF = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const CIF_B = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
  const pc = (m) => ((Math.round(m) % 12) + 12) % 12;
  // tons com bemol (Fá maior, Sib, Mib… e os menores relativos) escrevem os acordes com "b"
  const usaBemol = (raiz, menor) => (menor ? [2, 7, 0, 5, 10, 3] : [5, 10, 3, 8, 1, 6]).includes(raiz);
  const nomeCif = (p, bemol) => (bemol ? CIF_B : CIF)[p];
  const nomePT = (p, bemol) => (bemol ? PT_B : PT)[p];
  const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // ---------------------------------------------------------------- forma de LEITURA (20/11/2026, pedido do Rinaldo)
  // Básico: só os nomes das notas (Dó, Ré, Mi…). Intermediário: cifras (C, D, Em…). Avançado: partitura (com a cifra).
  // Nem todo mundo lê partitura: ela só aparece no Avançado. A escolha fica guardada no aparelho (vale para Músicos e Bateria).
  const LEITURAS = ["Básico · Dó, Ré, Mi", "Intermediário · Cifras (C, D, Em)", "Avançado · Partitura"];
  let leitura = (() => { try { return Math.min(2, Math.max(0, Number(localStorage.getItem("al_leitura")) || 0)); } catch (e) { return 0; } })();
  function definirLeitura(n) { leitura = n; try { localStorage.setItem("al_leitura", String(n)); } catch (e) { /* ok */ } }
  const rotNota = (p, bemol) => (leitura === 0 ? nomePT(p, bemol) : nomeCif(p, bemol));
  // "G" → "Sol maior", "F#m" → "Fá# menor", "Bb" → "Sib maior", "B°" → "Si diminuto"
  function cifraParaPT(cif) {
    const m = String(cif).match(/^([A-G])([#b]?)(.*)$/); if (!m) return cif;
    const idx = (CIF.indexOf(m[1]) + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0) + 12) % 12;
    const tipo = m[3].startsWith("°") ? " diminuto" : m[3].startsWith("m") && !m[3].startsWith("maj") ? " menor" : " maior";
    return nomePT(idx, m[2] === "b") + tipo;
  }
  const rotAcorde = (cif) => (leitura === 0 ? cifraParaPT(cif) : cif);
  function seletorLeitura(aoMudar) {
    const sel = h("select", { "aria-label": "Forma de leitura", style: { width: "auto" } }, LEITURAS.map((t, i) => h("option", { value: i }, t)));
    sel.value = String(leitura);
    sel.onchange = () => { definirLeitura(Number(sel.value)); if (aoMudar) aoMudar(); };
    return h("div", { class: "linha", style: { gap: ".5rem", "align-items": "center", "flex-wrap": "wrap", margin: ".2rem 0 .6rem" } }, h("b", {}, "📖 Leitura:"), sel,
      h("small", { class: "mudo" }, "Escolha como você lê música. A partitura só aparece no Avançado."));
  }
  // partitura (só no Avançado) com o VexFlow (MIT, static/vendor/vexflow): uma nota ou um acorde
  const VF_NOMES = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"], VF_NOMES_B = ["c", "db", "d", "eb", "e", "f", "gb", "g", "ab", "a", "bb", "b"];
  async function pauta(caixa, midis, bemol) {
    caixa.textContent = "";
    await carregarScript("vendor/vexflow/vexflow.js");
    const VF = window.VexFlow, grave = midis.every((m) => m < 57), nomes = bemol ? VF_NOMES_B : VF_NOMES;
    const ord = [...midis].sort((a, b) => a - b);
    const nota = new VF.StaveNote({ keys: ord.map((m) => nomes[pc(m)] + "/" + (Math.floor(Math.round(m) / 12) - 1)), duration: "w", clef: grave ? "bass" : "treble" });
    ord.forEach((m, i) => { const n = nomes[pc(m)]; if (n.length > 1) nota.addModifier(new VF.Accidental(n[1] === "b" ? "b" : "#"), i); });
    const rend = new VF.Renderer(caixa, VF.Renderer.Backends.SVG); rend.resize(200, 140);
    const g = rend.getContext(), st = new VF.Stave(6, 20, 188); st.addClef(grave ? "bass" : "treble").setContext(g).draw();
    VF.Formatter.FormatAndDraw(g, st, [nota]);
    const svg = caixa.querySelector("svg"); if (svg) { svg.style.background = "#fff"; svg.style.borderRadius = "10px"; svg.style.display = "block"; svg.style.margin = ".3rem auto"; }
  }

  // ---------------------------------------------------------------- som de piano simples
  function piano(m, t, dur, vol) {
    const c = audio(), g = c.createGain(), f = freq(m);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32 * (vol || 1), t + 0.01); g.gain.exponentialRampToValueAtTime(0.1 * (vol || 1), t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    [[1, "triangle", 1], [2, "sine", 0.35], [3, "sine", 0.12]].forEach(([k, tipo, a]) => { const o = c.createOscillator(), ga = c.createGain(); o.type = tipo; o.frequency.value = f * k; ga.gain.value = a; o.connect(ga).connect(g); o.start(t); o.stop(t + dur + 0.05); });
    g.connect(c.destination);
  }
  const acorde = (notas, t, dur) => notas.forEach((m) => piano(m, t, dur, 0.6));

  // ---------------------------------------------------------------- desenhos: teclado e braço do instrumento
  function teclado(destaques, raiz) {
    // 2 oitavas começando no Dó; destaques = conjunto de classes de nota (0..11)
    const brancas = [0, 2, 4, 5, 7, 9, 11], pretas = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 };
    const L = 14, W = 22, H = 90; let s = '<svg viewBox="0 0 ' + (L * W) + ' ' + (H + 4) + '" width="100%" style="max-width:520px;display:block;margin:.3rem auto">';
    for (let o = 0; o < 2; o++) brancas.forEach((p, i) => { const x = (o * 7 + i) * W, on = destaques.has(p); s += '<rect x="' + x + '" y="0" width="' + (W - 1) + '" height="' + H + '" rx="3" fill="' + (on ? (p === raiz ? "#f2c94c" : "#49c7ef") : "#f4f7f8") + '" stroke="#223"/>' + (on ? '<text x="' + (x + W / 2) + '" y="' + (H - 8) + '" font-size="9" text-anchor="middle" font-weight="700" fill="#0b1820">' + rotNota(p) + "</text>" : ""); });
    for (let o = 0; o < 2; o++) Object.entries(pretas).forEach(([p, i]) => { p = Number(p); const x = (o * 7 + i) * W + W * 0.68, on = destaques.has(p); s += '<rect x="' + x + '" y="0" width="' + (W * 0.64) + '" height="' + (H * 0.6) + '" rx="2" fill="' + (on ? (p === raiz ? "#f2c94c" : "#49c7ef") : "#1b2328") + '"/>'; });
    return s + "</svg>";
  }
  const AFINACOES = { violao: { nome: "Violão / guitarra", cordas: [64, 59, 55, 50, 45, 40] }, baixo: { nome: "Contrabaixo", cordas: [43, 38, 33, 28] } };
  function braco(instr, destaques, raiz) {
    const cordas = AFINACOES[instr].cordas, casas = 12;
    const grade = h("div", { style: { display: "grid", "grid-template-columns": "1.6rem repeat(" + (casas + 1) + ", minmax(1.2rem, 1fr))", gap: "2px", "font-size": ".7rem", margin: ".3rem 0", "min-width": "19rem" } });
    grade.append(h("div"));
    for (let f = 0; f <= casas; f++) grade.append(h("div", { style: { "text-align": "center", color: [3, 5, 7, 9, 12].includes(f) ? "#f2c94c" : "#7d97a1" } }, f === 0 ? "solta" : String(f)));
    cordas.forEach((solta) => {
      grade.append(h("div", { style: { "font-weight": "700", color: "#9fdcef", "align-self": "center" } }, rotNota(pc(solta))));
      for (let f = 0; f <= casas; f++) {
        const p = pc(solta + f), on = destaques.has(p);
        grade.append(h("div", { style: { height: "1.35rem", "border-radius": "50%", display: "grid", "place-items": "center", "font-weight": "800", "font-size": ".62rem",
          background: on ? (p === raiz ? "#f2c94c" : "#49c7ef") : "transparent", color: on ? "#0b1820" : "", "border-bottom": "2px solid #50656e", "border-radius": on ? "50%" : "0" } }, on ? rotNota(p) : ""));
      }
    });
    return h("div", { style: { overflow: "auto" } }, grade);
  }

  // ---------------------------------------------------------------- teoria: campo harmônico e tom
  const KK_MAIOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
  const KK_MENOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
  function correl(a, b) { const ma = a.reduce((s, x) => s + x, 0) / 12, mb = b.reduce((s, x) => s + x, 0) / 12; let n = 0, da = 0, db = 0; for (let i = 0; i < 12; i++) { n += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; } return da && db ? n / Math.sqrt(da * db) : 0; }
  function descobrirTom(hist) {
    const res = [];
    for (let r = 0; r < 12; r++) {
      const rot = (perfil) => perfil.map((_, i) => perfil[(i - r + 12) % 12]);
      res.push({ raiz: r, menor: false, c: correl(hist, rot(KK_MAIOR)) }, { raiz: r, menor: true, c: correl(hist, rot(KK_MENOR)) });
    }
    return res.sort((a, b) => b.c - a.c);
  }
  // graus: [semitons da raiz do acorde, tipo] — tipo: "" maior, "m" menor, "°" diminuto
  const CAMPO_MAIOR = [[0, "", "I"], [2, "m", "ii"], [4, "m", "iii"], [5, "", "IV"], [7, "", "V"], [9, "m", "vi"], [11, "°", "vii°"]];
  const CAMPO_MENOR = [[0, "m", "i"], [2, "°", "ii°"], [3, "", "III"], [5, "m", "iv"], [7, "", "V (muito usado)"], [8, "", "VI"], [10, "", "VII"]];
  const INTERV = { "": [0, 4, 7], m: [0, 3, 7], "°": [0, 3, 6] };
  function campo(raiz, menor) {
    const b = usaBemol(raiz, menor);
    return (menor ? CAMPO_MENOR : CAMPO_MAIOR).map(([st, tipo, grau]) => {
      const r = (raiz + st) % 12, notas = INTERV[tipo].map((i) => (r + i) % 12);
      return { grau, cifra: nomeCif(r, b) + tipo, raiz: r, notas, nomes: notas.map((p) => nomePT(p, b)).join(" – ") };
    });
  }
  // no Básico o tom vai só por extenso ("Sol maior"); do Intermediário em diante, com a cifra ("Sol maior (G)")
  const nomeTom = (raiz, menor) => nomePT(raiz, usaBemol(raiz, menor)) + (menor ? " menor" : " maior") + (leitura === 0 ? "" : " (" + nomeCif(raiz, usaBemol(raiz, menor)) + (menor ? "m" : "") + ")");
  // trocar o tom de uma cifra: muda só os acordes (palavras como G, D/F#, Em7, Bbsus4), a letra fica igual
  const RX_ACORDE = /^([A-G])([#b]?)([^\s/]*)(\/([A-G])([#b]?))?$/;
  const indice = (l, ac) => (CIF.indexOf(l) + (ac === "#" ? 1 : ac === "b" ? -1 : 0) + 12) % 12;
  const ehAcorde = (pal) => { const m = pal.match(RX_ACORDE); return m && /^(m|maj|M|dim|aug|sus|add|°|º|\+|7|9|11|13|6|4|2|5|\(|$)/.test(m[3]) ? m : null; };
  function transporLinha(linha, semitons, bemol) {
    // só mexe nas linhas de acordes (a maioria das palavras é acorde); linha de letra fica como está ("E" da letra não vira acorde)
    const pals = linha.split(/\s+/).filter(Boolean);
    if (!pals.length || pals.filter((p) => ehAcorde(p)).length < pals.length * 0.6) return linha;
    return linha.replace(/\S+/g, (pal) => {
      const m = ehAcorde(pal); if (!m) return pal;
      const r = nomeCif((indice(m[1], m[2]) + semitons + 120) % 12, bemol);
      return r + m[3] + (m[4] ? "/" + nomeCif((indice(m[5], m[6]) + semitons + 120) % 12, bemol) : "");
    });
  }

  // ---------------------------------------------------------------- microfone
  async function abrirMic(aoQuadro) {
    if (!window.isSecureContext || !navigator.mediaDevices) throw new Error("O microfone só funciona no endereço seguro. No celular, use o botão “Abrir com microfone (endereço seguro)” das Ferramentas.");
    if (typeof LabVoz === "undefined" || !LabVoz._detectar) throw new Error("Detector de nota indisponível.");
    const c = audio();
    const stream = await AL.microfone({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const src = c.createMediaStreamSource(stream), proc = c.createScriptProcessor(2048, 1, 1), mudo = c.createGain(); mudo.gain.value = 0;
    src.connect(proc); proc.connect(mudo).connect(c.destination);
    proc.onaudioprocess = (e) => {
      const b = e.inputBuffer.getChannelData(0); let rms = 0; for (let i = 0; i < b.length; i++) rms += b[i] * b[i]; rms = Math.sqrt(rms / b.length);
      aoQuadro(rms < 0.01 ? null : LabVoz._detectar(b, c.sampleRate), e.inputBuffer.duration);
    };
    return { fechar: () => { proc.onaudioprocess = null; try { proc.disconnect(); src.disconnect(); } catch (e) { /* ok */ } stream.getTracks().forEach((t) => t.stop()); } };
  }

  // ---------------------------------------------------------------- 1) nota do cantor + tom
  function telaNota(el) {
    let mic = null, recentes = [], hist = new Array(12).fill(0), ultimaMostrada = null, instr = "violao";
    const grande = h("div", { style: { "text-align": "center", "font-size": "4rem", "font-weight": "900", "line-height": "1.1", "min-height": "5rem" } }, "—");
    const sub = h("div", { style: { "text-align": "center", color: "#9fdcef", "min-height": "1.4rem" } }, "Ligue o microfone e cante (ou toque) uma nota.");
    const desenhos = h("div"), caixaPauta = h("div"), tomEl = h("div", { class: "cartao", style: { margin: ".6rem 0" } }, h("b", {}, "🎼 Tom provável: "), "ainda ouvindo…");
    const selInstr = h("select", { "aria-label": "Instrumento" }, [["violao", "🎸 Violão / guitarra"], ["baixo", "🎸 Contrabaixo"], ["teclado", "🎹 Teclado"]].map(([v, t]) => h("option", { value: v }, t)));
    const botao = h("button", { class: "primario bloco", style: { "font-size": "1.2rem", padding: ".9rem" } }, "🎤 Ligar o microfone");
    function desenhar(p) {
      const d = new Set(p == null ? [] : [p]);
      AL.limpar(desenhos, instr === "teclado" ? h("div", { html: teclado(d, p) }) : braco(instr, d, p));
      if (instr === "teclado") desenhos.firstChild.innerHTML = teclado(d, p);
    }
    function mostrarTom() {
      const tot = hist.reduce((s, x) => s + x, 0);
      if (tot < 4) return;
      const r = descobrirTom(hist), a = r[0], relativo = a.menor ? { raiz: (a.raiz + 3) % 12, menor: false } : { raiz: (a.raiz + 9) % 12, menor: true };
      const ac = campo(a.raiz, a.menor);
      AL.limpar(tomEl, h("b", {}, "🎼 Tom provável: " + nomeTom(a.raiz, a.menor)),
        h("div", { class: "mudo" }, "Pode ser também: " + nomeTom(relativo.raiz, relativo.menor) + " (tom relativo) · segunda opção: " + nomeTom(r[1].raiz, r[1].menor) + " · " + Math.round(tot) + " s ouvidos"),
        h("div", { class: "linha", style: { gap: ".35rem", "flex-wrap": "wrap", margin: ".4rem 0" } }, ac.filter((x) => !x.grau.includes("°")).map((x) => h("span", { class: "pilula", style: { padding: ".3rem .6rem", "border-radius": "20px", background: "#0e5a4f", border: "2px solid #f2c94c", "font-weight": "800" } }, rotAcorde(x.cifra)))),
        h("small", { class: "mudo" }, "Comece com o primeiro acorde (" + rotAcorde(ac[0].cifra) + "). Os outros são os acordes que mais aparecem neste tom."));
    }
    async function ligar() {
      if (mic) { mic.fechar(); mic = null; botao.textContent = "🎤 Ligar o microfone"; return; }
      try {
        mic = await abrirMic((m, dur) => {
          if (m == null) { recentes = []; return; }
          recentes.push(m); if (recentes.length > 5) recentes.shift();
          const ord = [...recentes].sort((a, b) => a - b), med = ord[Math.floor(ord.length / 2)];
          if (recentes.length >= 3 && Math.abs(med - Math.round(med)) < 0.35) { hist[pc(med)] += dur; mostrar(med); }
        });
        botao.textContent = "■ Desligar o microfone";
      } catch (e) { AL.toast(e.message, true); }
    }
    let ultimoTom = 0;
    function mostrar(m) {
      const p = pc(m), oit = Math.floor(Math.round(m) / 12) - 1;
      // Básico: "Sol"; Intermediário: "G" (com "Sol" pequeno); Avançado: "G" e a nota na partitura
      grande.textContent = leitura === 0 ? PT[p] : CIF[p];
      sub.textContent = (leitura === 0 ? "" : PT[p] + " · ") + "Oitava " + oit + " · " + Math.round(freq(m)) + " Hz";
      if (p !== ultimaMostrada) { ultimaMostrada = p; desenhar(p); if (leitura === 2) pauta(caixaPauta, [Math.round(m)], false).catch(() => {}); }
      if (Date.now() - ultimoTom > 1500) { ultimoTom = Date.now(); mostrarTom(); }
    }
    botao.onclick = ligar;
    selInstr.onchange = () => { instr = selInstr.value; desenhar(ultimaMostrada); };
    AL.limpar(el, h("div", { class: "cartao" },
      h("h2", {}, "🎤 Nota do cantor"),
      h("p", { class: "mudo" }, "Deixe o celular perto de quem canta. A nota aparece grande, no seu instrumento, e o sistema vai descobrindo o tom da música."),
      h("label", {}, "Meu instrumento"), selInstr, h("div", { style: { margin: ".6rem 0" } }, botao), grande, sub, caixaPauta, desenhos, tomEl,
      h("button", { onclick: () => { hist = new Array(12).fill(0); AL.limpar(tomEl, h("b", {}, "🎼 Tom provável: "), "ainda ouvindo…"); } }, "↺ Começar outra música"),
      h("p", { class: "mudo" }, "Dica: o tom fica mais certo depois de uns 15 a 20 segundos de música. O microfone é usado só ao vivo, neste aparelho: nada é gravado.")));
    desenhar(null);
    return { parar: () => { if (mic) mic.fechar(); mic = null; } };
  }

  // ---------------------------------------------------------------- 2) tom e acordes + trocar o tom da cifra
  function telaTom(el) {
    let instr = "teclado";
    const selRaiz = h("select", { "aria-label": "Tom" }, PT.map((n, i) => h("option", { value: i }, leitura === 0 ? n : n + " (" + CIF[i] + ")")));
    const selModo = h("select", { "aria-label": "Maior ou menor" }, [["0", "Maior"], ["1", "Menor"]].map(([v, t]) => h("option", { value: v }, t)));
    const selInstr = h("select", { "aria-label": "Instrumento" }, [["teclado", "🎹 Teclado"], ["violao", "🎸 Violão / guitarra"], ["baixo", "🎸 Contrabaixo"]].map(([v, t]) => h("option", { value: v }, t)));
    const lista = h("div"), desenho = h("div"), titulo = h("h3"), caixaPauta = h("div");
    function mostrarAcorde(x) {
      const d = new Set(x.notas);
      const base = 48 + x.raiz, midis = x.notas.map((p) => base + ((p - x.raiz + 12) % 12));
      AL.limpar(desenho, h("p", {}, h("b", {}, rotAcorde(x.cifra)), " = " + x.nomes + (leitura === 0 ? "" : " (" + x.notas.map((p) => nomeCif(p, /b/.test(x.cifra))).join(" ") + ")")), caixaPauta, instr === "teclado" ? h("div", { html: "" }) : braco(instr, d, x.raiz));
      if (instr === "teclado") desenho.lastChild.innerHTML = teclado(d, x.raiz);
      if (leitura === 2) pauta(caixaPauta, midis.map((m) => m + 12), /b/.test(x.cifra)).catch(() => {}); else caixaPauta.textContent = "";
      acorde(midis, audio().currentTime + 0.05, 1.4);
    }
    function atualizar() {
      instr = selInstr.value;
      const raiz = Number(selRaiz.value), menor = selModo.value === "1", ac = campo(raiz, menor);
      titulo.textContent = "Campo harmônico de " + nomeTom(raiz, menor);
      AL.limpar(lista, h("div", { class: "linha", style: { gap: ".4rem", "flex-wrap": "wrap" } }, ac.map((x) => h("button", { onclick: () => mostrarAcorde(x), title: x.nomes }, leitura === 2 ? x.grau + " · " + x.cifra : rotAcorde(x.cifra)))));
      mostrarAcorde(ac[0]);
    }
    [selRaiz, selModo, selInstr].forEach((s) => (s.onchange = atualizar));
    // trocar o tom
    const cifra = h("textarea", { rows: 6, placeholder: "Cole aqui a cifra (acordes em cima da letra). Ex.:\nG          D\nGrande é o Senhor\nEm        C", style: { width: "100%", "font-family": "monospace" } });
    const de = h("select", { "aria-label": "Tom de agora" }, CIF.map((n, i) => h("option", { value: i }, n))), para = h("select", { "aria-label": "Tom novo" }, CIF.map((n, i) => h("option", { value: i }, n)));
    const saida = h("pre", { style: { "white-space": "pre-wrap", background: "#0b1820", padding: ".8rem", "border-radius": "10px", "min-height": "3rem" } });
    const transpor = () => { const st = (Number(para.value) - Number(de.value) + 12) % 12, desloc = st > 6 ? st - 12 : st; saida.textContent = cifra.value.split("\n").map((l) => transporLinha(l, desloc, usaBemol(Number(para.value), false))).join("\n"); };
    AL.limpar(el,
      h("div", { class: "cartao" }, h("h2", {}, "🎼 Tom e acordes"),
        h("p", { class: "mudo" }, "Escolha o tom: aparecem os acordes do tom. Toque num acorde para ouvir e ver as notas."),
        h("div", { class: "linha", style: { gap: ".5rem", "flex-wrap": "wrap" } }, selRaiz, selModo, selInstr), titulo, lista, desenho),
      h("div", { class: "cartao" }, h("h2", {}, "🔁 Trocar o tom da cifra"),
        leitura === 0 ? h("p", { class: "aviso" }, "Esta parte usa cifras (C, D, Em…): é do nível Intermediário. Se ainda não lê cifra, comece pelos nomes das notas acima.") : null,
        h("p", { class: "mudo" }, "O cantor pediu outro tom? Cole a cifra, diga o tom de agora e o tom novo. Só os acordes mudam; a letra fica igual."),
        cifra, h("div", { class: "linha", style: { gap: ".5rem", "align-items": "center", "flex-wrap": "wrap", margin: ".5rem 0" } }, "Tom de agora:", de, "→ Tom novo:", para, h("button", { class: "primario", onclick: transpor }, "Trocar o tom")), saida));
    atualizar();
    return { parar: () => {} };
  }

  // ---------------------------------------------------------------- 3) percepção com nota
  const TESTES = {
    nota: { botao: "🎹 Que nota é essa?", nome: "Que nota é essa?", niveis: ["só as notas naturais (Dó a Si), com o Dó tocado antes", "as 12 notas, com o Dó tocado antes", "as 12 notas, com o Dó só no começo"] },
    acorde: { botao: "🎶 Maior ou menor?", nome: "Maior ou menor?", niveis: ["acordes juntos, devagar", "acordes juntos ou arpejados", "acordes mais rápidos e em vários tons"] },
  };
  function telaPercepcao(el) {
    const area = h("div");
    const botoes = h("div", { class: "linha", style: { gap: ".4rem", "flex-wrap": "wrap" } }, Object.entries(TESTES).map(([id, t]) => h("button", { onclick: () => abrir(id) }, t.botao)));
    function abrir(id) {
      const T = TESTES[id], TOTAL = 10;
      const nivelBox = typeof TreinosAL !== "undefined" ? TreinosAL.seletorNivel("musico", () => info()) : h("div");
      const nivel = () => (typeof TreinosAL !== "undefined" ? TreinosAL.nivel("musico") : 0);
      const infoEl = h("p", { class: "mudo" }), pergunta = h("div", { style: { "font-size": "1.3rem", "font-weight": "800", margin: ".5rem 0", "min-height": "1.8rem" } });
      const respostas = h("div", { class: "linha", style: { gap: ".35rem", "flex-wrap": "wrap" } }), placar = h("div", { class: "mudo" }), resultado = h("div");
      let q = 0, acertos = 0, atual = null, erros = [];
      const info = () => { infoEl.textContent = "Nível " + TreinosAL.NIVEIS[nivel()] + ": " + T.niveis[nivel()] + "."; };
      function tocar() {
        const c = audio(), t = c.currentTime + 0.1, n = nivel();
        if (id === "nota") {
          const refAgora = n < 2 || q === 0;
          if (refAgora) piano(60, t, 0.9);
          piano(atual.midi, t + (refAgora ? 1.1 : 0), 1.2);
        } else {
          const notas = atual.notas, arp = n >= 1 && atual.arpejo, passo = n === 2 ? 0.18 : 0.32;
          if (arp) notas.forEach((m, i) => piano(m, t + i * passo, 1.2)); else acorde(notas, t, n === 2 ? 0.9 : 1.6);
        }
      }
      function nova() {
        AL.limpar(resultado);
        if (q >= TOTAL) return terminar();
        const n = nivel();
        if (id === "nota") {
          const naturais = [0, 2, 4, 5, 7, 9, 11], p = n === 0 ? naturais[Math.floor(Math.random() * 7)] : Math.floor(Math.random() * 12);
          atual = { p, midi: 60 + p };
          AL.limpar(respostas, (n === 0 ? naturais : [...Array(12).keys()]).map((x) => h("button", { style: { "min-width": "4.2rem" }, onclick: () => responder(x === p, rotNota(p)) }, rotNota(x))));
        } else {
          const raiz = n === 2 ? 52 + Math.floor(Math.random() * 12) : 55 + Math.floor(Math.random() * 7), menor = Math.random() < 0.5;
          atual = { menor, notas: [raiz, raiz + (menor ? 3 : 4), raiz + 7], arpejo: Math.random() < 0.5 };
          AL.limpar(respostas, [["Maior 😊", false], ["Menor 😔", true]].map(([t, v]) => h("button", { style: { "min-width": "8rem", "font-size": "1.1rem" }, onclick: () => responder(v === menor, menor ? "menor" : "maior") }, t)));
        }
        pergunta.textContent = "Pergunta " + (q + 1) + " de " + TOTAL + (id === "nota" ? ": que nota tocou depois do Dó?" : ": o acorde é maior ou menor?");
        placar.textContent = acertos + " acerto(s) até agora";
        tocar();
      }
      function responder(certo, qual) {
        if (!atual) return;
        if (certo) acertos++; else erros.push(qual);
        AL.toast(certo ? "✅ Certo!" : "❌ Era " + qual + ".", !certo);
        atual = null; q++; setTimeout(nova, 900);
      }
      function terminar() {
        const pct = Math.round((acertos / TOTAL) * 100);
        AL.limpar(respostas); pergunta.textContent = "Fim!";
        const rotulo = "Músicos · " + T.nome + (typeof TreinosAL !== "undefined" ? TreinosAL.rotulo("musico") : "");
        const detalhe = acertos + " de " + TOTAL + " certas" + (erros.length ? " · errou: " + [...new Set(erros)].slice(0, 6).join(", ") : "");
        AL.limpar(resultado, h("div", { class: "cartao" }, h("h2", {}, "Resultado: " + pct + "%"), h("p", {}, detalhe),
          h("p", {}, pct >= 80 ? "🎉 Ótimo ouvido!" : pct >= 50 ? "👍 Bom começo. Repita para fixar." : "🔁 Ouça com calma e tente de novo."),
          typeof TreinosAL !== "undefined" ? TreinosAL.caixa("musico", rotulo, pct, detalhe) : null,
          h("button", { onclick: () => abrir(id) }, "↺ Fazer de novo")));
      }
      AL.limpar(area, h("div", { class: "cartao" }, h("h2", {}, T.botao), nivelBox, infoEl,
        h("div", { class: "linha", style: { gap: ".4rem", margin: ".4rem 0" } }, h("button", { class: "primario", onclick: () => { q = 0; acertos = 0; erros = []; nova(); } }, "▶ Começar"), h("button", { onclick: () => { if (atual) tocar(); } }, "🔁 Ouvir de novo")),
        pergunta, respostas, placar, resultado));
      info();
    }
    AL.limpar(el, h("div", { class: "cartao" }, h("h2", {}, "👂 Percepção"), h("p", { class: "mudo" }, "10 perguntas. A nota vai para a pasta do aluno e o professor acompanha."), botoes), area);
    return { parar: () => {} };
  }

  // ---------------------------------------------------------------- 4) louvor gravado (20/11/2026)
  // Usa o Basic Pitch (Spotify, licença Apache-2.0, em static/vendor/basic-pitch): transforma o áudio em notas.
  // Com as notas, o AudioLab calcula o tom e uma sugestão de acordes a cada trecho. Tudo roda no próprio aparelho.
  const carregados = {};
  function carregarScript(src) {
    if (!carregados[src]) carregados[src] = new Promise((ok, erro) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => { delete carregados[src]; erro(new Error("Não consegui carregar " + src + ". Precisa de internet na primeira vez.")); }; document.head.append(s); });
    return carregados[src];
  }
  const TRIADES = []; for (let r = 0; r < 12; r++) TRIADES.push({ r, menor: false, tons: [r, (r + 4) % 12, (r + 7) % 12] }, { r, menor: true, tons: [r, (r + 3) % 12, (r + 7) % 12] });
  /** notas = [{inicio, dur, midi, amp}] → { tom, acordes: [{ini, fim, cifra}] } */
  function analisarNotas(notas, duracao) {
    const hist = new Array(12).fill(0);
    notas.forEach((n) => (hist[pc(n.midi)] += n.dur * (0.5 + n.amp)));
    const tom = descobrirTom(hist)[0], bemol = usaBemol(tom.raiz, tom.menor);
    const diat = new Set(campo(tom.raiz, tom.menor).map((x) => x.cifra.replace("°", "")));
    const JAN = 1.0, janelas = [];
    for (let t = 0; t < duracao; t += JAN) {
      const cr = new Array(12).fill(0); let baixo = null, energia = 0;
      notas.forEach((n) => { const sob = Math.min(t + JAN, n.inicio + n.dur) - Math.max(t, n.inicio); if (sob <= 0) return; const peso = sob * (0.5 + n.amp) * (n.midi < 52 ? 2 : 1); cr[pc(n.midi)] += peso; energia += peso; if (baixo == null || n.midi < baixo) baixo = n.midi; });
      if (energia < 0.15) { janelas.push(null); continue; }
      const norma = Math.sqrt(cr.reduce((s, x) => s + x * x, 0));
      let mel = null, melNota = -1;
      TRIADES.forEach((tr) => {
        const cif = nomeCif(tr.r, bemol) + (tr.menor ? "m" : "");
        let sc = tr.tons.reduce((s, p) => s + cr[p], 0) / (norma * Math.sqrt(3));
        if (diat.has(cif)) sc += 0.08;
        if (baixo != null && pc(baixo) === tr.r) sc += 0.05;
        if (sc > melNota) { melNota = sc; mel = cif; }
      });
      janelas.push(mel);
    }
    // junta trechos iguais e tira trocas muito curtas (menos de 2 s viram o acorde de antes)
    const acordes = [];
    janelas.forEach((c, i) => { const ult = acordes[acordes.length - 1]; if (ult && ult.cifra === c) ult.fim = (i + 1) * JAN; else acordes.push({ ini: i * JAN, fim: (i + 1) * JAN, cifra: c }); });
    for (let k = 1; k < acordes.length; k++) if (acordes[k].fim - acordes[k].ini < 2 && acordes[k - 1].cifra) { acordes[k - 1].fim = acordes[k].fim; acordes.splice(k, 1); k--; if (k > 0 && acordes[k + 1] && acordes[k + 1].cifra === acordes[k].cifra) { acordes[k].fim = acordes[k + 1].fim; acordes.splice(k + 1, 1); } }
    const limpos = acordes.filter((a) => a.cifra);
    // sequência que mais se repete (4 acordes seguidos)
    const conta = {}; for (let i = 0; i + 3 < limpos.length; i++) { const k = limpos.slice(i, i + 4).map((a) => a.cifra).join(" – "); conta[k] = (conta[k] || 0) + 1; }
    const principal = Object.entries(conta).sort((a, b) => b[1] - a[1])[0];
    return { tom, acordes: limpos, principal: principal && principal[1] > 1 ? principal[0] : null };
  }
  const mmss = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
  function telaGravado(el) {
    const arquivo = h("input", { type: "file", accept: "audio/*", "aria-label": "Louvor gravado" });
    const estado = h("p", { class: "mudo" }, "Escolha um louvor gravado (MP3, M4A, WAV…). Funciona melhor com voz e violão ou teclado; com banda cheia é uma sugestão.");
    const barra = h("progress", { max: 100, value: 0, style: { width: "100%", display: "none" } });
    const resultado = h("div");
    let ocupado = false;
    async function analisar() {
      const f = arquivo.files && arquivo.files[0]; if (!f || ocupado) return;
      ocupado = true; AL.limpar(resultado); barra.style.display = ""; barra.value = 0;
      try {
        estado.textContent = "⏳ Abrindo o áudio…";
        const c = audio(), bruto = await c.decodeAudioData(await f.arrayBuffer());
        const dur = Math.min(bruto.duration, 240);
        const off = new OfflineAudioContext(1, Math.ceil(dur * 22050), 22050), s = off.createBufferSource(); s.buffer = bruto; s.connect(off.destination); s.start();
        const sinal = await off.startRendering();
        estado.textContent = "⏳ Carregando a inteligência que ouve as notas (só na primeira vez demora)…";
        await carregarScript("vendor/basic-pitch/basic-pitch.js");
        const B = window.BasicPitchAL, bp = new B.BasicPitch("vendor/basic-pitch/model/model.json");
        const frames = [], onsets = [], contornos = [];
        estado.textContent = "🎧 Ouvindo o louvor… (" + mmss(dur) + (bruto.duration > 240 ? ", só os 4 primeiros minutos" : "") + ")";
        await bp.evaluateModel(sinal, (fr, on, co) => { frames.push(...fr); onsets.push(...on); contornos.push(...co); }, (p) => { barra.value = Math.round(p * 100); });
        const ev = B.noteFramesToTime(B.addPitchBendsToNoteEvents(contornos, B.outputToNotesPoly(frames, onsets, 0.25, 0.25, 5)));
        const notas = ev.map((n) => ({ inicio: n.startTimeSeconds, dur: n.durationSeconds, midi: n.pitchMidi, amp: n.amplitude || 0.5 }));
        if (notas.length < 10) throw new Error("Não achei notas suficientes nesse áudio.");
        const r = analisarNotas(notas, dur);
        estado.textContent = "✅ Pronto: " + notas.length + " notas encontradas.";
        const ac = campo(r.tom.raiz, r.tom.menor);
        AL.limpar(resultado,
          h("div", { class: "cartao" }, h("h2", {}, "🎼 Tom provável: " + nomeTom(r.tom.raiz, r.tom.menor)),
            h("p", {}, "Acordes do tom: ", ac.filter((x) => !x.grau.includes("°")).map((x) => rotAcorde(x.cifra)).join(" · ")),
            r.principal ? h("p", {}, h("b", {}, "Sequência que mais se repete: "), r.principal.split(" – ").map(rotAcorde).join(" – ")) : null),
          h("div", { class: "cartao" }, h("h2", {}, "⏱ Acordes ao longo do louvor (sugestão)"),
            h("div", { class: "linha", style: { gap: ".35rem", "flex-wrap": "wrap" } }, r.acordes.map((a) => h("span", { style: { padding: ".35rem .6rem", "border-radius": "10px", background: "#0e5a4f", border: "1px solid #f2c94c", "font-weight": "700" } }, mmss(a.ini) + " " + rotAcorde(a.cifra)))),
            h("p", { class: "mudo" }, "É uma sugestão automática: confira de ouvido. Em “Tom e acordes” dá para ouvir cada acorde e trocar o tom.")));
      } catch (e) { estado.textContent = "⚠️ " + e.message; }
      finally { ocupado = false; barra.style.display = "none"; }
    }
    arquivo.onchange = analisar;
    AL.limpar(el, h("div", { class: "cartao" }, h("h2", {}, "🎧 Louvor gravado"),
      h("p", {}, "O sistema ouve um louvor gravado e mostra o tom e os acordes de cada trecho, para o músico tirar a música."),
      arquivo, estado, barra, resultado,
      h("p", { class: "mudo" }, "O áudio é analisado neste aparelho e não é enviado para lugar nenhum. Usa a tecnologia aberta Basic Pitch (Spotify).")));
    return { parar: () => {} };
  }

  // ---------------------------------------------------------------- painel
  function painel(el) {
    let atual = null;
    const area = h("div");
    const abas = [["Nota do cantor", telaNota], ["Tom e acordes", telaTom], ["Louvor gravado", telaGravado], ["Percepção", telaPercepcao]];
    const botoes = abas.map(([nome, fn]) => h("button", { onclick: (e) => { if (atual) atual.parar(); botoes.forEach((b) => b.classList.remove("ligado")); e.currentTarget.classList.add("ligado"); atual = fn(area); } }, nome));
    // trocar a leitura desenha de novo a aba aberta
    const leituraEl = seletorLeitura(() => { const b = botoes.find((x) => x.classList.contains("ligado")); if (b) b.click(); });
    AL.limpar(el, leituraEl, h("div", { class: "linha", style: { gap: ".4rem", "flex-wrap": "wrap", "margin-bottom": ".6rem" } }, botoes), area);
    botoes[0].click();
    return { parar: () => { if (atual) atual.parar(); } };
  }

  return { painel, _descobrirTom: descobrirTom, _campo: campo, _transporLinha: transporLinha, _analisarNotas: analisarNotas, carregarScript, seletorLeitura, leitura: () => leitura, _cifraParaPT: cifraParaPT };
})();
