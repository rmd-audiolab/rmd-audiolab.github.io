/* RMD AudioLab — metrônomo (15/11/2026, pedido do Rinaldo).
   1) Nos slides de compasso: barra "Metrônomo" na prévia do professor. O som sai do computador do professor e o desenho
      animado do compasso anda junto com cada batida (na prévia e no telão aberto neste computador).
   2) Metrônomo separado nas Ferramentas: andamento, compasso, toque para medir o BPM e o gesto de regência junto.
   O telão recebe o estado pelo BroadcastChannel (janelas do mesmo navegador, no mesmo computador). Sem o canal, o telão só não sincroniza. */
"use strict";
const Metronomo = (function () {
  const h = AL.h;
  let ctx = null, ativoSlide = null;
  const audio = () => { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume(); return ctx; };
  const canal = (() => { try { return new BroadcastChannel("audiolab-metronomo"); } catch (e) { return null; } })();
  const avisar = (msg) => { try { if (canal) canal.postMessage(msg); } catch (e) { /* ok */ } };
  const limitar = (v, a, b) => Math.max(a, Math.min(b, Math.round(Number(v) || a)));
  const NOMES = [[40, "Largo"], [60, "Larghetto"], [66, "Adagio"], [76, "Andante"], [108, "Moderato"], [120, "Allegro"], [156, "Vivace"], [176, "Presto"]];
  const nomeAndamento = (bpm) => { let n = NOMES[0][1]; NOMES.forEach(([v, t]) => { if (bpm >= v) n = t; }); return n; };

  // som da batida: 2 = tempo 1 (mais forte e agudo), 1 = acento secundário (tempo 4 do 6/8), 0 = demais
  function clique(c, t, forte, volume) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o.frequency.value = forte === 2 ? 1760 : forte === 1 ? 1320 : 990;
    const pico = Math.max(0.001, (forte ? 0.9 : 0.6) * volume);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(pico, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.09);
  }

  // motor: {bpm, tempos, volume, aoTempo(i), aoParar()}. inicio = Date.now() da 1ª batida (serve para sincronizar o desenho)
  function criar(op) {
    let timer = 0, raf = 0, fila = [], prox = 0, n = 0, tocando = false;
    const m = { inicio: 0, get tocando() { return tocando; } };
    const acento = (i) => (i === 0 ? 2 : op.tempos === 6 && i === 3 ? 1 : 0);
    function agendar() { const c = ctx; while (prox < c.currentTime + 0.12) { const i = n % op.tempos; clique(c, prox, acento(i), op.volume == null ? 1 : op.volume); fila.push({ i, t: prox }); n++; prox += 60 / op.bpm; } }
    function quadro() { const c = ctx; while (fila.length && fila[0].t <= c.currentTime) { const b = fila.shift(); if (op.aoTempo) op.aoTempo(b.i); } raf = requestAnimationFrame(quadro); }
    m.tocar = () => {
      m.parar(true); const c = audio(); tocando = true; n = 0; fila = [];
      prox = c.currentTime + 0.15; m.inicio = Date.now() + 150;
      agendar(); timer = setInterval(agendar, 25); raf = requestAnimationFrame(quadro);
    };
    m.parar = (silencioso) => { const estava = tocando; tocando = false; clearInterval(timer); cancelAnimationFrame(raf); fila = []; if (estava && !silencioso && op.aoParar) op.aoParar(); };
    m.mudar = (novo) => { Object.assign(op, novo); if (tocando) m.tocar(); };
    return m;
  }

  // faz o desenho SVG seguir o relógio do metrônomo (pausa a animação e posiciona quadro a quadro)
  function sincronizar(caixa, inicio) {
    const svg = caixa && caixa.querySelector("svg");
    if (!svg || !svg.pauseAnimations) return () => {};
    let raf = 0;
    svg.pauseAnimations();
    const passo = () => { try { svg.setCurrentTime(Math.max(0, (Date.now() - inicio) / 1000)); } catch (e) { /* ok */ } raf = requestAnimationFrame(passo); };
    passo();
    return () => { cancelAnimationFrame(raf); try { svg.unpauseAnimations(); } catch (e) { /* ok */ } };
  }
  const desenhar = (fig, bpm, tempos) => (FIG.F[fig] ? FIG.F[fig]({ bpm, dur: tempos * 60 / bpm }) : "");

  const luzes = (tempos) => {
    const el = h("div", { style: { display: "flex", gap: ".5rem", "flex-wrap": "wrap", margin: ".5rem 0" } });
    const bolas = Array.from({ length: tempos }, (_, i) => h("div", { style: { width: "3rem", height: "3rem", "border-radius": "50%", display: "grid", "place-items": "center", "font-weight": "800", "font-size": "1.3rem", border: "3px solid " + (i === 0 ? "#f2c94c" : "#49c7ef") } }, String(i + 1)));
    bolas.forEach((b) => el.append(b));
    el.acender = (i) => bolas.forEach((b, k) => { b.style.background = k === i ? (k === 0 ? "#f2c94c" : "#49c7ef") : "transparent"; b.style.color = k === i ? "#0b1820" : ""; });
    return el;
  };

  // ---------------------------------------------------------------- barra do slide (prévia do professor)
  function barraSlide(tema, sl, idx, moldura) {
    pararSlide();
    const cfg = sl.metronomo; if (!cfg) return null;
    let bpm = cfg.bpm, parar = () => {};
    const fig = () => moldura.querySelector(".fig");
    const bolas = luzes(cfg.tempos);
    const num = h("input", { type: "number", min: 40, max: 200, value: bpm, "aria-label": "Andamento (BPM)", style: { width: "5.5rem" } });
    const botao = h("button", { class: "primario" }, "▶ Tocar o metrônomo");
    const nome = h("span", { class: "mudo" }, nomeAndamento(bpm));
    const m = criar({ bpm, tempos: cfg.tempos, aoTempo: (i) => bolas.acender(i), aoParar: () => voltar() });
    function voltar() { parar(); parar = () => {}; const f = fig(); if (f) f.innerHTML = FIG.desenhar(sl.fig); bolas.acender(-1); botao.textContent = "▶ Tocar o metrônomo"; avisar({ tocando: false }); }
    function ligar() {
      m.mudar({ bpm }); m.tocar(); botao.textContent = "■ Parar";
      const f = fig(); if (f) { parar(); f.innerHTML = desenhar(sl.fig, bpm, cfg.tempos); parar = sincronizar(f, m.inicio); }
      avisar({ tocando: true, tema: tema.id, slide: idx, bpm, tempos: cfg.tempos, inicio: m.inicio });
    }
    const repetir = setInterval(() => { if (m.tocando) avisar({ tocando: true, tema: tema.id, slide: idx, bpm, tempos: cfg.tempos, inicio: m.inicio }); }, 2000);
    const ajustar = (v) => { bpm = limitar(v, 40, 200); num.value = bpm; nome.textContent = nomeAndamento(bpm); if (m.tocando) ligar(); };
    botao.onclick = () => (m.tocando ? m.parar() : ligar());
    num.onchange = () => ajustar(num.value);
    ativoSlide = { parar: () => { clearInterval(repetir); if (m.tocando) m.parar(); } };
    return h("div", { class: "cartao", style: { margin: ".6rem 0" } },
      h("b", {}, "🥁 Metrônomo do compasso"),
      h("p", { class: "mudo", style: { margin: ".2rem 0 .4rem" } }, "O som sai deste computador (ligue na mesa de som). O desenho do compasso anda junto com cada batida, aqui e no telão aberto neste computador. O tempo 1 é o mais agudo."),
      h("div", { class: "linha", style: { "align-items": "center", gap: ".5rem", "flex-wrap": "wrap" } }, botao,
        h("button", { onclick: () => ajustar(bpm - 5) }, "− 5"), num, h("button", { onclick: () => ajustar(bpm + 5) }, "+ 5"), h("span", {}, "BPM"), nome),
      bolas);
  }
  function pararSlide() { if (ativoSlide) { const a = ativoSlide; ativoSlide = null; a.parar(); } }

  // ---------------------------------------------------------------- telão: segue o metrônomo do professor
  function seguirNoTelao(obterSlide) {
    let estado = { tocando: false }, parar = () => {}, alterado = null;
    function aplicar() {
      const atual = obterSlide(); // {tema, slide, sl, caixa}
      const casa = estado.tocando && atual && atual.tema === estado.tema && atual.slide === estado.slide && atual.sl && atual.sl.metronomo;
      const chave = casa ? [estado.tema, estado.slide, estado.bpm, estado.inicio].join("|") : null;
      if (chave === alterado) return;
      parar(); parar = () => {};
      const f = atual && atual.caixa && atual.caixa.querySelector(".fig");
      if (casa && f) { f.innerHTML = desenhar(atual.sl.fig, estado.bpm, estado.tempos); parar = sincronizar(f, estado.inicio); alterado = chave; }
      else { if (alterado && f && atual.sl) f.innerHTML = FIG.desenhar(atual.sl.fig); alterado = null; }
    }
    if (canal) canal.onmessage = (e) => { estado = e.data || { tocando: false }; aplicar(); };
    return { aplicar, novoSlide: () => { alterado = null; parar(); parar = () => {}; aplicar(); } };
  }

  // ---------------------------------------------------------------- metrônomo separado (Ferramentas)
  function painel(el) {
    let bpm = 80, tempos = 4, parar = () => {}, toques = [];
    const COMP = [["2", "2/4 (2 tempos)", 2, "r3_anim2"], ["3", "3/4 (3 tempos)", 3, "r3_anim3"], ["4", "4/4 (4 tempos)", 4, "r3_anim4"], ["6", "6/8 (6 colcheias: em 2 ou em 6)", 6, "r3_pad6"], ["1", "Só o pulso (sem compasso)", 1, null]];
    const sel = h("select", { "aria-label": "Compasso" }, COMP.map(([v, t]) => h("option", { value: v }, t))); sel.value = "4";
    const faixa = h("input", { type: "range", min: 40, max: 208, value: bpm, "aria-label": "Andamento", style: { width: "100%" } });
    const num = h("input", { type: "number", min: 40, max: 208, value: bpm, "aria-label": "Andamento (BPM)", style: { width: "6rem" } });
    const nome = h("b", { style: { "font-size": "1.2rem" } }, "");
    const vol = h("input", { type: "range", min: 0, max: 100, value: 80, "aria-label": "Volume" });
    const botao = h("button", { class: "primario bloco", style: { "font-size": "1.3rem", padding: "1rem" } }, "▶ Tocar");
    const caixaLuzes = h("div"), gesto = h("div", { class: "moldura", style: { "max-width": "560px" } });
    let bolas = luzes(4);
    const m = criar({ bpm, tempos, volume: 0.8, aoTempo: (i) => bolas.acender(i), aoParar: () => { botao.textContent = "▶ Tocar"; bolas.acender(-1); } });
    const comp = () => COMP.find((c) => c[0] === sel.value);
    function redesenharGesto() {
      parar(); parar = () => {};
      const c = comp();
      if (typeof FIG === "undefined" || !c[3]) { AL.limpar(gesto); gesto.style.display = "none"; return; }
      gesto.style.display = ""; gesto.innerHTML = FIG.F[c[3]]({ bpm, dur: tempos * 60 / bpm, nome: tempos === 6 ? "6/8 (regido em 2)" : null });
      if (m.tocando) parar = sincronizar(gesto, m.inicio);
    }
    function atualizar(reiniciar) {
      bpm = limitar(bpm, 40, 208); faixa.value = bpm; num.value = bpm; nome.textContent = bpm + " BPM · " + nomeAndamento(bpm);
      tempos = comp()[2]; bolas = luzes(tempos); AL.limpar(caixaLuzes, bolas);
      m.mudar({ bpm, tempos, volume: vol.value / 100 });
      if (reiniciar && m.tocando) m.tocar();
      redesenharGesto();
    }
    botao.onclick = () => { if (m.tocando) { m.parar(); redesenharGesto(); } else { m.tocar(); botao.textContent = "■ Parar"; redesenharGesto(); } };
    faixa.oninput = () => { bpm = Number(faixa.value); atualizar(true); };
    num.onchange = () => { bpm = Number(num.value); atualizar(true); };
    sel.onchange = () => atualizar(true);
    vol.oninput = () => m.mudar({ volume: vol.value / 100 });
    const toque = h("button", { onclick: () => {
      const agora = performance.now(); toques = toques.filter((t) => agora - t < 3000); toques.push(agora);
      if (toques.length >= 3) { const d = (toques[toques.length - 1] - toques[0]) / (toques.length - 1); bpm = Math.round(60000 / d); atualizar(true); }
    } }, "👆 Toque no ritmo para medir o BPM");
    AL.limpar(el, h("div", { class: "cartao" }, h("h2", {}, "Metrônomo"),
      h("p", { class: "mudo" }, "Escolha o compasso e o andamento. O tempo 1 soa mais agudo; no 6/8 o tempo 4 também é marcado. O desenho mostra o gesto de regência junto com o som."),
      h("label", {}, "Compasso"), sel,
      h("label", {}, "Andamento"), h("div", { class: "linha", style: { "align-items": "center", gap: ".5rem", "flex-wrap": "wrap" } },
        h("button", { onclick: () => { bpm -= 1; atualizar(true); } }, "−"), num, h("button", { onclick: () => { bpm += 1; atualizar(true); } }, "+"), nome),
      faixa, h("label", {}, "Volume"), vol,
      h("div", { style: { margin: ".7rem 0" } }, botao), caixaLuzes, toque, gesto));
    atualizar(false);
    return { parar: () => { m.parar(true); parar(); } };
  }

  return { barraSlide, pararSlide, seguirNoTelao, painel, criar, sincronizar };
})();
