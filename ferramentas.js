/* RMD AudioLab — ferramentas de treino (funcionam no computador e no celular):
   sinais de teste, EQ de 32 bandas, analisador pelo microfone (mesa física), teste vocal (afinação) e ritmo (regência).
   16/11/2026: treino de ouvido ("qual frequência mudou?") e regência com a câmera. A câmera e o microfone só são usados
   ao vivo, no próprio aparelho: nada é gravado nem enviado. Só a nota do treino pode ir para a pasta do aluno (treinos.js). */
"use strict";
const FerramentasAL = (() => {
  const h = AL.h;
  let ctx = null, ativo = null, laco = null, opcoesAtuais = {};
  const audio = () => { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume(); return ctx; };
  function parar() {
    if (laco) cancelAnimationFrame(laco); laco = null;
    if (ativo) { try { ativo.parar(); } catch (e) { /* já parado */ } } ativo = null;
  }
  function ruido(tipo) {
    const c = audio(), n = c.sampleRate * 3, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1;
      if (tipo === "rosa") { b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898; d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926; }
      else d[i] = w * 0.4; }
    const s = c.createBufferSource(); s.buffer = buf; s.loop = true; return s;
  }
  /* fonte: rosa | branco | seno1k | varredura | arquivo:<HTMLAudioElement> */
  function fonte(tipo, arquivo) {
    const c = audio();
    if (tipo === "rosa" || tipo === "branco") { const s = ruido(tipo); s.start(); return { no: s, parar: () => s.stop() }; }
    if (tipo === "seno1k") { const o = c.createOscillator(); o.frequency.value = 1000; o.start(); const g = c.createGain(); g.gain.value = 0.25; o.connect(g); return { no: g, parar: () => o.stop() }; }
    if (tipo === "varredura") { const o = c.createOscillator(); const g = c.createGain(); g.gain.value = 0.25; o.connect(g); const t = c.currentTime;
      const ciclo = () => { const t0 = c.currentTime; o.frequency.setValueAtTime(20, t0); o.frequency.exponentialRampToValueAtTime(20000, t0 + 12); };
      ciclo(); const id = setInterval(ciclo, 12000); o.start(t); return { no: g, parar: () => { clearInterval(id); o.stop(); } }; }
    if (tipo === "arquivo" && arquivo) { if (!arquivo._fonteAL) arquivo._fonteAL = c.createMediaElementSource(arquivo); arquivo.play().catch(() => {}); return { no: arquivo._fonteAL, parar: () => { arquivo.pause(); try { arquivo._fonteAL.disconnect(); } catch (e) {} } }; }
    return null;
  }
  const espectroLaco = (canvas, an, depois) => { const r = () => { const res = desenharEspectro(canvas, an, ctx.sampleRate); if (depois) depois(res); laco = requestAnimationFrame(r); }; r(); };

  // ------------------------------------------------------------------ sinais de teste
  function telaSinais(el) {
    const estado = h("p", { class: "mudo" }, "Nenhum sinal tocando.");
    const vol = h("input", { type: "range", min: -40, max: 0, value: -12, "aria-label": "Volume do sinal" });
    const canvas = h("canvas", { class: "espectro" });
    const tocar = (tipo, nome) => {
      parar(); const c = audio(); const f = fonte(tipo); const g = c.createGain(); g.gain.value = MotorAL.db(Number(vol.value));
      const an = c.createAnalyser(); an.fftSize = 8192; f.no.connect(g).connect(an).connect(c.destination);
      vol.oninput = () => (g.gain.value = MotorAL.db(Number(vol.value)));
      ativo = { parar: () => { f.parar(); g.disconnect(); } }; estado.textContent = "Tocando: " + nome; espectroLaco(canvas, an);
    };
    AL.limpar(el, h("div", { class: "cartao" }, h("h2", {}, "Sinais de teste"),
      h("p", { class: "mudo" }, "Use para conferir caixas, equalização e o analisador. Comece com volume baixo."),
      h("div", { class: "linha" }, [["rosa", "Ruído rosa"], ["branco", "Ruído branco"], ["seno1k", "Senoide 1 kHz"], ["varredura", "Varredura 20 Hz–20 kHz"]].map(([t, n]) => h("button", { onclick: () => tocar(t, n) }, n)),
        h("button", { class: "perigo", onclick: () => { parar(); estado.textContent = "Parado."; } }, "■ Parar")),
      h("label", {}, "Volume do sinal"), vol, estado, canvas));
  }

  // ------------------------------------------------------------------ EQ 32 bandas (real)
  function telaEQ(el, arquivoAudio) {
    const freqs = Array.from({ length: 32 }, (_, i) => 20 * Math.pow(1000, i / 31));
    const filtros = []; let fonteAtual = null;
    const canvas = h("canvas", { class: "espectro" });
    const estado = h("p", { class: "mudo" }, "Escolha a fonte para ouvir o EQ agindo.");
    const sliders = freqs.map((f, i) => {
      const val = h("b", {}, "0");
      const s = h("input", { type: "range", min: -12, max: 12, step: 1, value: 0, "aria-label": "Banda " + Math.round(f) + " Hz",
        oninput: () => { val.textContent = (s.value > 0 ? "+" : "") + s.value; if (filtros[i]) filtros[i].gain.value = Number(s.value); } });
      return { s, el: h("div", { class: "ctl" }, h("div", { class: "rot" }, h("span", {}, f >= 1000 ? (f / 1000).toFixed(1) + " kHz" : Math.round(f) + " Hz"), val), s) };
    });
    const ligar = (tipo, nome) => {
      parar(); const c = audio(); fonteAtual = fonte(tipo, arquivoAudio && arquivoAudio());
      if (!fonteAtual) { estado.textContent = "Escolha um arquivo de música em Música primeiro."; return; }
      let ant = fonteAtual.no; filtros.length = 0;
      freqs.forEach((f, i) => { const b = c.createBiquadFilter(); b.type = "peaking"; b.frequency.value = f; b.Q.value = 4.3; b.gain.value = Number(sliders[i].s.value); ant.connect(b); ant = b; filtros.push(b); });
      const g = c.createGain(); g.gain.value = 0.5; const an = c.createAnalyser(); an.fftSize = 8192; ant.connect(g).connect(an).connect(c.destination);
      ativo = { parar: () => { fonteAtual.parar(); g.disconnect(); } }; estado.textContent = "Tocando com o EQ: " + nome; espectroLaco(canvas, an);
    };
    AL.limpar(el, h("div", { class: "cartao" }, h("h2", {}, "Equalizador de 32 bandas"),
      h("p", { class: "mudo" }, "Cada controle muda o som de verdade. Olhe o gráfico e ouça a diferença."),
      h("div", { class: "linha" }, h("button", { onclick: () => ligar("rosa", "ruído rosa") }, "Ruído rosa"), h("button", { onclick: () => ligar("branco", "ruído branco") }, "Ruído branco"),
        arquivoAudio ? h("button", { onclick: () => ligar("arquivo", "música do arquivo") }, "Música (arquivo)") : null,
        h("button", { onclick: () => sliders.forEach((x, i) => { x.s.value = 0; x.s.dispatchEvent(new Event("input")); }) }, "↺ Zerar (flat)"),
        h("button", { class: "perigo", onclick: () => { parar(); estado.textContent = "Parado."; } }, "■ Parar")),
      estado, canvas, h("div", { class: "grade", style: { "grid-template-columns": "repeat(auto-fill, minmax(150px, 1fr))", gap: ".3rem 1rem", "margin-top": ".8rem" } }, sliders.map((x) => x.el))));
  }

  // ------------------------------------------------------------------ microfone (mesa física)
  async function abrirMicrofone() {
    if (!window.isSecureContext || !navigator.mediaDevices) {
      const e = new Error("O celular só libera o microfone em endereço seguro. Toque em “Abrir com microfone (endereço seguro)” no alto desta tela.");
      e.semSeguro = true; throw e;
    }
    const c = audio();
    const stream = await AL.microfone({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const src = c.createMediaStreamSource(stream); const an = c.createAnalyser(); an.fftSize = 8192; an.smoothingTimeConstant = 0.8; src.connect(an);
    return { an, parar: () => stream.getTracks().forEach((t) => t.stop()) };
  }
  function telaAnalisador(el) {
    const canvas = h("canvas", { class: "espectro" });
    const leitura = h("div", {}, h("p", { class: "mudo" }, "Toque em Ativar microfone e deixe a música/voz tocando nas caixas."));
    const faixas = [["GRAVE", 60, 250], ["MÉDIO", 250, 4000], ["AGUDO", 4000, 16000]];
    let hist = [];
    const ativar = async () => {
      parar();
      let m; try { m = await abrirMicrofone(); } catch (e) { AL.toast(e.semSeguro ? e.message : "Microfone não autorizado.", true); return; }
      ativo = m; hist = [];
      let ultimo = 0;
      espectroLaco(canvas, m.an, (res) => {
        if (!res || performance.now() - ultimo < 400) return; ultimo = performance.now();
        const nivel = (a, b) => { let s = 0, n = 0; for (let i = Math.floor(a / res.hz); i <= Math.ceil(b / res.hz) && i < res.dados.length; i++) { s += Math.pow(10, res.dados[i] / 10); n++; } return 10 * Math.log10(s / Math.max(1, n) + 1e-15); };
        const v = faixas.map(([n, a, b]) => nivel(a, b)); const media = v.reduce((x, y) => x + y) / 3;
        // microfonia: pico estreito muito acima da vizinhança
        const pf = res.pico.f, pi = Math.round(pf / res.hz); let viz = 0, nv = 0;
        for (let i = pi - 30; i <= pi + 30; i++) if (Math.abs(i - pi) > 4 && res.dados[i] !== undefined) { viz += res.dados[i]; nv++; }
        const salto = res.pico.db - viz / Math.max(1, nv);
        hist.push(salto > 25 && res.pico.db > -45 ? pf : 0); hist = hist.slice(-6);
        const persistente = hist.filter((x) => x && Math.abs(x - pf) < pf * 0.06).length >= 4;
        const dica = (n, d) => d > 4 ? `${n} está ALTO (+${d.toFixed(0)} dB): reduza o ${n} na mesa.` : d < -4 ? `${n} está BAIXO (${d.toFixed(0)} dB): aumente um pouco o ${n}.` : `${n} equilibrado.`;
        const desvios = v.map((x) => x - media);
        const nota = Math.max(0, Math.round(100 - desvios.reduce((s, d) => s + Math.max(0, Math.abs(d) - 3) * 6, 0) - (persistente ? 30 : 0)));
        AL.limpar(leitura,
          persistente ? h("p", { class: "erro" }, h("b", {}, `⚠ Possível microfonia em ${pf >= 1000 ? (pf / 1000).toFixed(2) + " kHz" : Math.round(pf) + " Hz"}`), " — corte essa frequência no EQ e reduza o ganho.") : null,
          h("ul", { class: "lista-itens" }, faixas.map(([n], i) => h("li", {}, dica(n, desvios[i])))),
          h("p", {}, "Equilíbrio geral: ", h("b", {}, nota + "/100"), h("span", { class: "mudo" }, " (didático: o microfone do celular não é um medidor calibrado).")));
      });
    };
    AL.limpar(el, h("div", { class: "cartao" }, h("h2", {}, "Analisador — mesa física"),
      h("p", { class: "mudo" }, "O celular escuta as caixas pelo microfone. Mexa um controle por vez na mesa real e veja o resultado."),
      h("div", { class: "linha" }, h("button", { class: "primario", onclick: ativar }, "🎙 Ativar microfone"), h("button", { class: "perigo", onclick: () => parar() }, "■ Parar")),
      canvas, leitura));
  }

  // ------------------------------------------------------------------ teste vocal (afinação)
  const NOTAS = ["Dó", "Dó#", "Ré", "Ré#", "Mi", "Fá", "Fá#", "Sol", "Sol#", "Lá", "Lá#", "Si"];
  function freqNota(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
  function nomeNota(midi) { return NOTAS[midi % 12] + Math.floor(midi / 12 - 1); }
  function detectarTom(buf, sr) {
    let rms = 0; for (const v of buf) rms += v * v; rms = Math.sqrt(rms / buf.length); if (rms < 0.01) return null;
    const n = buf.length, min = Math.floor(sr / 1000), max = Math.floor(sr / 70); let melhor = -1, mc = 0;
    for (let lag = min; lag < max; lag++) { let c = 0; for (let i = 0; i < n - lag; i++) c += buf[i] * buf[i + lag]; if (c > mc) { mc = c; melhor = lag; } }
    if (melhor < 0) return null;
    const a = (lag) => { let c = 0; for (let i = 0; i < n - lag; i++) c += buf[i] * buf[i + lag]; return c; };
    const y1 = a(melhor - 1), y2 = mc, y3 = a(melhor + 1), d = (y1 - y3) / (2 * (y1 - 2 * y2 + y3) || 1);
    return sr / (melhor + (isFinite(d) ? d : 0));
  }
  function telaVocal(el) {
    const sel = h("select", { "aria-label": "Nota de referência" }, Array.from({ length: 25 }, (_, i) => 48 + i).map((m) => h("option", { value: m, selected: m === 57 }, nomeNota(m) + " (" + freqNota(m).toFixed(0) + " Hz)")));
    const mostrador = h("div", { class: "nota" }, "—"), info = h("p", { class: "mudo" }, "Ouça a nota, depois cante a mesma nota por alguns segundos.");
    const ref = () => { parar(); const c = audio(), o = c.createOscillator(), g = c.createGain(); o.frequency.value = freqNota(Number(sel.value)); g.gain.setValueAtTime(0.2, c.currentTime); g.gain.setTargetAtTime(0, c.currentTime + 1.6, 0.2); o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 2.5); };
    const cantar = async () => {
      parar();
      let m; try { m = await abrirMicrofone(); } catch (e) { AL.toast(e.semSeguro ? e.message : "Microfone não autorizado.", true); return; }
      ativo = m; const alvo = freqNota(Number(sel.value)), buf = new Float32Array(2048), notas = []; const inicio = performance.now();
      const ciclo = () => {
        m.an.getFloatTimeDomainData(buf); const f = detectarTom(buf, ctx.sampleRate);
        if (f) { const cents = 1200 * Math.log2(f / alvo); notas.push(cents); mostrador.textContent = (cents > 0 ? "+" : "") + Math.round(cents) + " cents";
          mostrador.className = "nota " + (Math.abs(cents) <= 15 ? "ok" : Math.abs(cents) <= 40 ? "aviso" : "erro"); }
        const s = (performance.now() - inicio) / 1000;
        if (s < 8) { info.textContent = `Cantando… ${Math.ceil(8 - s)} s`; laco = requestAnimationFrame(ciclo); return; }
        parar();
        if (notas.length < 10) { info.textContent = "Não captei a voz. Cante mais perto do microfone."; return; }
        const med = notas.reduce((a, b) => a + b) / notas.length, desv = Math.sqrt(notas.reduce((a, b) => a + (b - med) * (b - med), 0) / notas.length);
        const nota = Math.max(0, Math.round(100 - Math.max(0, Math.abs(med) - 10) * 1.2 - Math.max(0, desv - 15) * 0.8));
        info.textContent = `Resultado: ${nota}/100 · ${Math.abs(med) <= 15 ? "afinado" : med > 0 ? "cantou acima (sustenido)" : "cantou abaixo (bemol)"} · estabilidade ${desv <= 20 ? "boa" : "precisa melhorar"}.`;
      };
      ciclo();
    };
    AL.limpar(el, h("div", { class: "cartao" }, h("h2", {}, "Teste vocal — afinação"), h("label", {}, "Nota de referência"), sel,
      h("div", { class: "linha", style: { "margin-top": ".6rem" } }, h("button", { onclick: ref }, "▶ Ouvir a nota"), h("button", { class: "primario", onclick: cantar }, "🎙 Cantar agora (8 s)")),
      mostrador, info));
  }

  // ------------------------------------------------------------------ ritmo (regência)
  function telaRitmo(el) {
    const bpm = h("input", { type: "number", min: 50, max: 160, value: 80, "aria-label": "Andamento (BPM)" });
    const info = h("p", { class: "mudo" }, "O metrônomo dá 4 batidas de entrada. Depois toque no botão grande junto com cada batida (16 vezes).");
    let batidas = [], toques = [];
    const botao = h("button", { class: "primario bloco", style: { "font-size": "1.4rem", padding: "1.4rem" }, disabled: true, onpointerdown: () => toques.push(performance.now()) }, "TOQUE NO TEMPO");
    const comecar = () => {
      parar(); const c = audio(), passo = 60 / Math.max(50, Math.min(160, Number(bpm.value) || 80)); batidas = []; toques = [];
      const t0 = c.currentTime + 0.3, off = performance.now() - c.currentTime * 1000;
      for (let i = 0; i < 20; i++) { const t = t0 + i * passo, o = c.createOscillator(), g = c.createGain(); o.frequency.value = i % 4 ? 1000 : 1600; g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.06); o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.08); if (i >= 4) batidas.push(t * 1000 + off); }
      botao.disabled = false; info.textContent = "Escute 4 batidas e comece a tocar…";
      const fim = setTimeout(() => {
        botao.disabled = true;
        const difs = batidas.map((b) => { const m = toques.reduce((best, t) => Math.abs(t - b) < Math.abs(best - b) ? t : best, Infinity); return Math.abs(m - b) < passo * 500 ? m - b : null; }).filter((x) => x !== null);
        if (difs.length < 8) { info.textContent = "Poucos toques captados. Tente de novo acompanhando as batidas."; return; }
        const med = difs.reduce((a, b) => a + b) / difs.length, desv = Math.sqrt(difs.reduce((a, b) => a + (b - med) ** 2, 0) / difs.length);
        const nota = Math.max(0, Math.round(100 - Math.max(0, Math.abs(med) - 25) * 0.5 - Math.max(0, desv - 30) * 0.6 - (16 - difs.length) * 4));
        info.textContent = `Resultado: ${nota}/100 · ${Math.abs(med) <= 25 ? "no tempo" : med > 0 ? `atrasando ${Math.round(med)} ms` : `adiantando ${Math.round(-med)} ms`} · regularidade ${desv <= 40 ? "boa" : "irregular"} (${difs.length}/16 batidas).`;
      }, (t0 - c.currentTime + 20 * passo + 0.5) * 1000);
      ativo = { parar: () => { clearTimeout(fim); botao.disabled = true; } };
    };
    AL.limpar(el, h("div", { class: "cartao" }, h("h2", {}, "Ritmo e regência"), h("label", {}, "Andamento (BPM)"), bpm,
      h("div", { class: "linha", style: { margin: ".6rem 0" } }, h("button", { onclick: comecar }, "▶ Começar")), botao, info));
  }

  // ------------------------------------------------------------------ metrônomo (15/11/2026): o painel fica em metronomo.js
  function telaMetronomo(el) {
    if (typeof Metronomo === "undefined") { AL.limpar(el, h("div", { class: "cartao" }, "Metrônomo indisponível.")); return; }
    ativo = Metronomo.painel(el);
  }
  // 20/11/2026: bateria (metrônomo do baterista + ritmos de louvor) — static/bateria.js
  function telaBateria(el) {
    if (typeof BateriaAL === "undefined") { AL.limpar(el, h("div", { class: "cartao" }, "Bateria indisponível.")); return; }
    ativo = BateriaAL.painel(el);
  }
  // 20/11/2026: músicos — violão, teclado e contrabaixo (static/musicos.js)
  function telaMusicos(el) {
    if (typeof MusicosAL === "undefined") { AL.limpar(el, h("div", { class: "cartao" }, "Músicos indisponível.")); return; }
    ativo = MusicosAL.painel(el);
  }

  function telaLabVoz(el) {
    if (typeof LabVoz === "undefined") { AL.limpar(el, h("div", { class: "cartao" }, "Laboratório indisponível.")); return; }
    LabVoz.montar(el, "afinacao", { semTelao: !!opcoesAtuais.semTelao }); ativo = { parar: () => LabVoz.desligar() };
  }

  // ------------------------------------------------------------------ treino de ouvido: qual frequência mudou? (16/11/2026)
  // Como os treinos de ouvido de técnico de som: o som toca com UMA faixa reforçada e a pessoa descobre qual foi.
  // O nível Médio usa as mesmas 5 faixas do EQ da mesa do AudioLab (100 Hz, 300 Hz, 1 kHz, 2,5 kHz e 8 kHz).
  const NIVEIS_OUVIDO = {
    facil: { nome: "Básico", ganho: 12, faixas: [[100, "GRAVE", "100 Hz"], [1000, "MÉDIO", "1 kHz"], [8000, "AGUDO", "8 kHz"]] },
    medio: { nome: "Intermediário", ganho: 9, faixas: [[100, "GRAVE", "100 Hz"], [300, "MÉDIO-GRAVE", "300 Hz"], [1000, "MÉDIO", "1 kHz"], [2500, "MÉDIO-AGUDO", "2,5 kHz"], [8000, "AGUDO", "8 kHz"]] },
    dificil: { nome: "Avançado", ganho: 6, faixas: [63, 125, 250, 500, 1000, 2000, 4000, 8000].map((f) => [f, f >= 1000 ? f / 1000 + " kHz" : f + " Hz", ""]) },
  };
  const PERGUNTAS_OUVIDO = 10;
  function telaOuvido(el) {
    const arquivoAudio = opcoesAtuais.arquivoAudio;
    // o nível vem do seletor comum (Básico, Intermediário, Avançado); sem treinos.js, usa um seletor simples
    const CHAVES = ["facil", "medio", "dificil"];
    const nivelSimples = h("select", { "aria-label": "Nível" }, CHAVES.map((k) => h("option", { value: k }, NIVEIS_OUVIDO[k].nome)));
    const nivel = { get value() { return typeof TreinosAL !== "undefined" ? CHAVES[TreinosAL.nivel("ouvido")] : nivelSimples.value; } };
    const seletor = typeof TreinosAL !== "undefined" ? TreinosAL.seletorNivel("ouvido") : h("div", {}, "Nível: ", nivelSimples);
    const fonteSel = h("select", { "aria-label": "Som do treino" }, h("option", { value: "rosa" }, "Ruído rosa (o som de teste dos técnicos)"), arquivoAudio ? h("option", { value: "arquivo" }, "Louvor que está no player (Louvores da aula)") : null);
    const alternar = h("input", { type: "checkbox", checked: true, style: { width: "auto" } });
    const area = h("div"), resultado = h("div");
    let jogo = null;
    const parar = () => { if (jogo) { jogo.parar(); jogo = null; } };
    function comecar() {
      FerramentasAL.parar(); parar();
      const N = NIVEIS_OUVIDO[nivel.value], c = audio();
      const f = fonte(fonteSel.value, fonteSel.value === "arquivo" && arquivoAudio ? arquivoAudio() : null);
      if (!f) { AL.toast("Toque um louvor no player de Louvores da aula primeiro.", true); return; }
      const eq = c.createBiquadFilter(); eq.type = "peaking"; eq.Q.value = 1.4; eq.gain.value = 0;
      const vol = c.createGain(); vol.gain.value = fonteSel.value === "rosa" ? 0.5 : 0.8;
      f.no.connect(eq).connect(vol).connect(c.destination);
      const ordem = Array.from({ length: PERGUNTAS_OUVIDO }, () => Math.floor(Math.random() * N.faixas.length));
      let k = 0, comMudanca = true, acertos = 0, timer = 0, travado = false; const erros = [];
      const nomeFaixa = (i) => N.faixas[i][1] + (N.faixas[i][2] ? " (" + N.faixas[i][2] + ")" : "");
      const estado = h("p", { style: { "font-weight": "800" } }), retorno = h("p", {});
      const btA = h("button", { onclick: () => modo(false) }, "A · Normal"), btB = h("button", { onclick: () => modo(true) }, "B · Com a mudança");
      function modo(b) {
        comMudanca = b; btA.classList.toggle("ligado", !b); btB.classList.toggle("ligado", b);
        eq.gain.setTargetAtTime(b ? N.ganho : 0, c.currentTime, 0.03);
      }
      function pergunta() {
        travado = false; eq.frequency.setValueAtTime(N.faixas[ordem[k]][0], c.currentTime);
        estado.textContent = "Pergunta " + (k + 1) + " de " + PERGUNTAS_OUVIDO + ": qual faixa foi reforçada no som B?"; retorno.textContent = ""; modo(true);
        botoes.forEach((b) => { b.disabled = false; b.className = ""; });
      }
      function responder(i) {
        if (travado) return; travado = true;
        const certo = ordem[k];
        botoes.forEach((b, j) => { b.disabled = true; if (j === certo) b.className = "ligado"; });
        if (i === certo) { acertos++; retorno.textContent = "✅ Isso! Era " + nomeFaixa(certo) + "."; retorno.className = "ok"; }
        else { erros.push([certo, i]); retorno.textContent = "❌ Era " + nomeFaixa(certo) + " (você marcou " + nomeFaixa(i) + "). Ouça de novo o B."; retorno.className = "erro"; }
        modo(true);
        setTimeout(() => { if (!jogo) return; k++; if (k < PERGUNTAS_OUVIDO) pergunta(); else terminar(); }, i === certo ? 1300 : 2600);
      }
      function terminar() {
        const pct = Math.round(acertos / PERGUNTAS_OUVIDO * 100), conf = {};
        erros.forEach(([a, b]) => { const ch = nomeFaixa(a) + " com " + nomeFaixa(b); conf[ch] = (conf[ch] || 0) + 1; });
        parar();
        AL.limpar(area);
        AL.limpar(resultado, h("div", { class: "cartao" },
          h("h3", {}, "Treino de ouvido (" + N.nome + "): " + acertos + " de " + PERGUNTAS_OUVIDO + " (" + pct + "%)"),
          h("p", {}, pct >= 80 ? (nivel.value === "dificil" ? "🎉 Ouvido de técnico!" : "🎉 Muito bem! Tente o próximo nível.") : pct >= 50 ? "👍 Bom caminho. Repita e preste atenção no A × B." : "💪 Comece no Fácil e alterne A e B várias vezes antes de responder."),
          Object.keys(conf).length ? [h("p", {}, "Onde você confundiu:"), h("ul", {}, Object.entries(conf).map(([t, n]) => h("li", {}, t + (n > 1 ? " (" + n + " vezes)" : ""))))] : null,
          h("p", { class: "mudo" }, "Dica: grave = peso e ronco; médio-grave = voz \"embolada\"; médio = som de telefone/corneta; médio-agudo = presença e ardido; agudo = brilho e chiado."),
          typeof TreinosAL !== "undefined" ? TreinosAL.caixa("ouvido", "Qual frequência mudou? · " + (fonteSel.value === "rosa" ? "ruído rosa" : "louvor") + " · " + N.nome, pct, acertos + " de " + PERGUNTAS_OUVIDO + " acertos") : null));
      }
      const botoes = N.faixas.map((x, i) => h("button", { style: { "min-width": "7rem" }, onclick: () => responder(i) }, x[1], x[2] ? h("small", { style: { display: "block", opacity: ".8" } }, x[2]) : null));
      timer = setInterval(() => { if (alternar.checked && !travado) modo(!comMudanca); }, 2000);
      jogo = { parar: () => { clearInterval(timer); try { f.parar(); } catch (e) { /* já parado */ } try { vol.disconnect(); } catch (e) { /* ok */ } } };
      ativo = jogo;
      AL.limpar(resultado);
      AL.limpar(area, h("div", { class: "cartao" }, estado,
        h("div", { class: "linha", style: { gap: ".4rem", "flex-wrap": "wrap", "align-items": "center" } }, h("span", {}, "Comparar:"), btA, btB),
        h("p", { class: "mudo" }, "Com \"alternar sozinho\" ligado, o som troca entre A e B a cada 2 segundos. Responda tocando na faixa:"),
        h("div", { class: "linha", style: { gap: ".4rem", "flex-wrap": "wrap" } }, botoes), retorno,
        h("button", { class: "perigo", style: { "margin-top": ".5rem" }, onclick: () => { parar(); AL.limpar(area); } }, "■ Parar o treino")));
      pergunta();
    }
    AL.limpar(el, h("div", { class: "cartao" }, h("h2", {}, "Treino de ouvido: qual frequência mudou?"),
      h("p", {}, "O som toca normal (A) e com UMA faixa reforçada (B). Descubra qual faixa mudou. São " + PERGUNTAS_OUVIDO + " perguntas. É o treino que os técnicos de som fazem para achar rápido o problema na mesa."),
      seletor, h("p", { class: "mudo" }, "Básico: 3 faixas (grave, médio, agudo), +12 dB. Intermediário: as 5 faixas do EQ da mesa, +9 dB. Avançado: 8 faixas, só +6 dB."),
      h("div", { class: "linha", style: { gap: ".6rem", "flex-wrap": "wrap", "align-items": "center" } }, h("span", {}, "Som:"), fonteSel),
      h("label", { style: { display: "flex", gap: ".4rem", "align-items": "center", margin: ".4rem 0" } }, alternar, "Alternar A e B sozinho a cada 2 segundos"),
      h("button", { class: "primario", onclick: comecar }, "▶ Começar o treino"),
      h("p", { class: "mudo" }, "Use fone de ouvido ou caixas boas: no alto-falante do celular os graves quase não aparecem.")), area, resultado);
  }

  // ------------------------------------------------------------------ regência com a câmera (16/11/2026)
  // A câmera acha onde a imagem se mexe (a mão que rege). O ponto mais baixo de cada descida é o ictus (o tempo).
  // O sistema compara cada ictus com o metrônomo. Funciona sem internet e sem instalar nada; nada é gravado.
  function telaCamera(el) {
    const W = 640, H = 480, PW = 160, PH = 120;
    const video = h("video", { playsinline: true, muted: true, autoplay: true, style: { display: "none" } });
    const cv = h("canvas", { width: W, height: H, style: { width: "100%", "max-width": "640px", background: "#0b1820", "border-radius": "12px", display: "block" } });
    const g = cv.getContext("2d");
    const pc = document.createElement("canvas"); pc.width = PW; pc.height = PH; const pg = pc.getContext("2d", { willReadFrequently: true });
    const compasso = h("select", { "aria-label": "Compasso" }, [2, 3, 4].map((n) => h("option", { value: n, selected: n === 4 }, n + "/4")));
    const bpm = h("input", { type: "number", min: 50, max: 140, value: 72, style: { width: "6rem" }, "aria-label": "Andamento (BPM)" });
    const compassos = h("select", { "aria-label": "Duração" }, [4, 6, 8].map((n) => h("option", { value: n, selected: n === 6 }, n + " compassos")));
    const status = h("p", { class: "mudo" }, "Toque em Ligar a câmera. Fique de frente, com a mão que rege aparecendo, e o fundo parado.");
    const resultado = h("div");
    let stream = null, raf = 0, prev = null, ys = [], trilha = [], ictus = [], sessao = null, ySuave = null, xSuave = null;
    let desc = null; // descida em andamento: {topo, max, tMax, xMax}
    function pararTudo() {
      cancelAnimationFrame(raf); raf = 0; sessao = null;
      if (stream) stream.getTracks().forEach((t) => t.stop()); stream = null; video.srcObject = null;
    }
    async function ligar() {
      FerramentasAL.parar();
      // 20/11/2026: a câmera pede permissão explicando e, se estiver bloqueada, mostra como liberar (AL.camera, comum.js)
      try { stream = await AL.camera({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }, audio: false }); }
      catch (e) { AL.toast(e.message, true); status.textContent = "📷 " + e.message; return; }
      video.srcObject = stream; try { await video.play(); } catch (e) { /* ok */ }
      ativo = { parar: pararTudo };
      status.textContent = "📷 Câmera ligada. Faça um gesto de regência para testar: o ponto amarelo segue a mão e cada ictus vira um círculo.";
      prev = null; trilha = []; ictus = []; desc = null; ySuave = xSuave = null;
      quadro();
    }
    // tempo do áudio (metrônomo) e da câmera no mesmo relógio
    const agoraAudio = () => audio().currentTime;
    function quadro() {
      if (!stream) return;
      raf = requestAnimationFrame(quadro);
      if (video.readyState < 2) return;
      const t = agoraAudio() - 0.08; // a imagem chega um pouco atrasada
      pg.drawImage(video, 0, 0, PW, PH);
      const d = pg.getImageData(0, 0, PW, PH).data, cinza = new Uint8Array(PW * PH);
      for (let i = 0, j = 0; i < cinza.length; i++, j += 4) cinza[i] = (d[j] * 3 + d[j + 1] * 6 + d[j + 2]) / 10;
      let n = 0, sx = 0, sy = 0;
      if (prev) for (let y = 0; y < PH; y += 1) for (let x = 0; x < PW; x += 1) { const i = y * PW + x, dif = Math.abs(cinza[i] - prev[i]); if (dif > 30) { n += dif; sx += x * dif; sy += y * dif; } }
      prev = cinza;
      // desenho: imagem espelhada (como um espelho) e escurecida
      g.save(); g.translate(W, 0); g.scale(-1, 1); g.drawImage(video, 0, 0, W, H); g.restore();
      g.fillStyle = "rgba(8,18,24,.45)"; g.fillRect(0, 0, W, H);
      if (n > 3000) {
        const x = W - (sx / n) * (W / PW), y = (sy / n) * (H / PH); // x espelhado
        xSuave = xSuave == null ? x : xSuave * 0.5 + x * 0.5; ySuave = ySuave == null ? y : ySuave * 0.5 + y * 0.5;
        trilha.push([t, xSuave, ySuave]);
        // ictus: fim de uma descida (a mão desce e volta a subir)
        if (!desc) { desc = { topo: ySuave, max: ySuave, tMax: t, xMax: xSuave }; }
        else if (ySuave > desc.max) { desc.max = ySuave; desc.tMax = t; desc.xMax = xSuave; }
        else if (desc.max - ySuave > 18) {
          const amp = desc.max - desc.topo, ultimo = ictus[ictus.length - 1];
          if (amp > 30 && (!ultimo || desc.tMax - ultimo.t > 0.22)) ictus.push({ t: desc.tMax, x: desc.xMax, y: desc.max });
          desc = { topo: ySuave, max: ySuave, tMax: t, xMax: xSuave };
        }
        if (desc && ySuave < desc.topo) desc.topo = ySuave;
      }
      trilha = trilha.filter((p) => t - p[0] < 1.6);
      // caminho da mão
      g.lineWidth = 5; g.strokeStyle = "rgba(242,201,76,.85)"; g.beginPath(); trilha.forEach(([, x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
      const ult = trilha[trilha.length - 1]; if (ult) { g.fillStyle = "#f2c94c"; g.beginPath(); g.arc(ult[1], ult[2], 9, 0, 7); g.fill(); }
      ictus.filter((ic) => t - ic.t < 2.5).forEach((ic) => { g.strokeStyle = ic.cor || "#49c7ef"; g.lineWidth = 4; g.beginPath(); g.arc(ic.x, ic.y, 16, 0, 7); g.stroke(); if (ic.num) { g.fillStyle = "#fff"; g.font = "bold 18px Segoe UI, Arial"; g.textAlign = "center"; g.fillText(ic.num, ic.x, ic.y + 6); } });
      // metrônomo: bolinhas dos tempos
      if (sessao) {
        const S = sessao, tempos = S.tempos, tt = t + 0.08, idx = S.esperados.findIndex((x) => x > tt);
        // k = tempo atual (-1 na contagem; total+1 = acabou)
        const k = tt < S.t0 ? -1 : idx < 0 ? (tt > S.esperados[S.total - 1] + 60 / S.bpm2 ? S.total + 1 : S.total - 1) : idx - 1;
        for (let i = 0; i < tempos; i++) { g.fillStyle = k >= 0 && ((k % tempos) + tempos) % tempos === i ? (i === 0 ? "#ef6b6b" : "#7fd18b") : "rgba(255,255,255,.18)"; g.beginPath(); g.arc(30 + i * 34, 30, 12, 0, 7); g.fill(); }
        g.fillStyle = "#f2c94c"; g.font = "bold 22px Segoe UI, Arial"; g.textAlign = "left";
        g.fillText(k < 0 ? "Prepare... (1 compasso de contagem)" : k < S.total ? "Rege! compasso " + (Math.floor(k / tempos) + 1) + " de " + S.nComp : "Pronto!", 30 + tempos * 34, 38);
        if (k >= S.total + 1) terminar();
      }
    }
    // exigência de cada nível: margem do ictus e, no Avançado, o andamento muda no meio (o regente acompanha)
    const NIV_REG = [{ margem: 0.12, frac: 0.15, muda: 0 }, { margem: 0.10, frac: 0.12, muda: 0 }, { margem: 0.08, frac: 0.10, muda: 0.15 }];
    const nivelReg = () => (typeof TreinosAL !== "undefined" ? TreinosAL.nivel("regencia") : 0);
    function comecar() {
      if (!stream) { AL.toast("Ligue a câmera primeiro.", true); return; }
      const nv = nivelReg(), NR = NIV_REG[nv];
      const tempos = Number(compasso.value), b = Math.max(50, Math.min(140, Number(bpm.value) || 72)), nComp = Number(compassos.value), beat = 60 / b, c = audio();
      const t0 = c.currentTime + 0.4 + tempos * beat; // depois de 1 compasso de contagem
      // tempos esperados (no Avançado, da metade em diante o andamento sobe ou desce 15%)
      const b2 = NR.muda ? Math.round(b * (1 + (Math.random() < 0.5 ? -NR.muda : NR.muda))) : b, meio = Math.floor(nComp / 2) * tempos;
      const esperados = []; let te = t0;
      for (let k = 0; k < tempos * nComp; k++) { esperados.push(te); te += 60 / (k + 1 >= meio && NR.muda ? b2 : b); }
      const cliques = Array.from({ length: tempos }, (_, i) => t0 - (tempos - i) * beat).concat(esperados);
      cliques.forEach((t, j) => { const k = j - tempos;
        const o = c.createOscillator(), ga = c.createGain(), forte = ((k % tempos) + tempos) % tempos === 0;
        o.frequency.value = forte ? 1500 : 1000; ga.gain.setValueAtTime(0.0001, t); ga.gain.exponentialRampToValueAtTime(forte ? 0.5 : 0.3, t + 0.003); ga.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
        o.connect(ga).connect(c.destination); o.start(t); o.stop(t + 0.08);
      });
      ictus = []; AL.limpar(resultado);
      sessao = { t0, beat, tempos, nComp, total: tempos * nComp, bpm: b, bpm2: b2, esperados, nv, NR, fim: false };
      status.textContent = "Ouça 1 compasso de contagem e comece a reger junto com o metrônomo." + (b2 !== b ? " Atenção: no meio, o andamento muda!" : "");
    }
    function terminar() {
      const S = sessao; if (!S || S.fim) return; S.fim = true; sessao = null;
      const esperados = S.esperados, fimT = esperados[S.total - 1] + 30 / S.bpm2;
      const dentro = ictus.filter((ic) => ic.t > S.t0 - S.beat / 2 && ic.t < fimT);
      const usados = new Set(); let bons = 0, quase = 0; const desvios = [];
      esperados.forEach((te, k) => {
        let mel = -1, md = 1e9; dentro.forEach((ic, i) => { const dd = Math.abs(ic.t - te); if (!usados.has(i) && dd < md) { md = dd; mel = i; } });
        if (mel < 0 || md > S.beat * 0.45) return;
        usados.add(mel); const off = dentro[mel].t - te; desvios.push(off);
        dentro[mel].num = (k % S.tempos) + 1;
        if (Math.abs(off) <= Math.max(S.NR.margem, S.beat * S.NR.frac)) { bons++; dentro[mel].cor = "#7fd18b"; } else { quase++; dentro[mel].cor = "#f2c94c"; }
      });
      const pct = Math.round((bons + quase * 0.5) / S.total * 100), aMais = dentro.length - usados.size;
      const inter = dentro.map((ic) => ic.t).sort((a, b) => a - b).map((t, i, a) => (i ? t - a[i - 1] : null)).filter((x) => x && x > 0.2 && x < 2).sort((a, b) => a - b);
      const bpmMedio = inter.length ? Math.round(60 / inter[Math.floor(inter.length / 2)]) : null;
      const media = desvios.length ? desvios.reduce((a, b) => a + b, 0) / desvios.length : 0;
      const nome = S.tempos + "/4 a " + S.bpm + (S.bpm2 !== S.bpm ? "→" + S.bpm2 : "") + " BPM" + (typeof TreinosAL !== "undefined" ? TreinosAL.rotulo("regencia") : "");
      AL.limpar(resultado, h("div", { class: "cartao" },
        h("h3", {}, "Regência " + nome + ": " + bons + " de " + S.total + " tempos no lugar (" + pct + "%)"),
        h("ul", {},
          h("li", {}, "No lugar (verde): " + bons + " · quase (amarelo): " + quase + " · faltaram: " + (S.total - bons - quase)),
          bpmMedio && S.bpm2 === S.bpm ? h("li", {}, "Seu andamento: cerca de " + bpmMedio + " BPM (o metrônomo estava em " + S.bpm + ")" + (Math.abs(bpmMedio - S.bpm) <= 4 ? " ✅" : bpmMedio > S.bpm ? " — correu um pouco" : " — atrasou um pouco")) : null,
          S.bpm2 !== S.bpm ? h("li", {}, "O andamento mudou de " + S.bpm + " para " + S.bpm2 + " BPM no meio: os tempos no lugar mostram se você acompanhou.") : null,
          desvios.length ? h("li", {}, Math.abs(media) < 0.07 ? "O ictus caiu junto com o clique ✅" : media < 0 ? "O ictus veio um pouco ANTES do clique (adiantado)" : "O ictus veio um pouco DEPOIS do clique (atrasado)") : null,
          aMais > 0 ? h("li", {}, aMais + " gesto(s) a mais: deixe o ictus claro (desça e quique) e o resto do gesto mais leve.") : null),
        h("p", { class: "mudo" }, "Como o sistema mede: ele segue o que se mexe na imagem (a mão) e marca o ponto mais baixo de cada descida. Mexer o corpo todo, ou gente passando atrás, atrapalha. É um guia de treino: o professor confere o desenho do compasso."),
        typeof TreinosAL !== "undefined" ? TreinosAL.caixa("regencia", "Regência com câmera · " + nome, pct, bons + " de " + S.total + " tempos no lugar" + (bpmMedio ? " · " + bpmMedio + " BPM" : "")) : null));
      status.textContent = "Pronto. Pode reger de novo ou mudar o compasso e o andamento.";
    }
    AL.limpar(el, h("div", { class: "cartao" }, h("h2", {}, "Regência com a câmera"),
      h("p", {}, "O metrônomo toca e a pessoa rege na frente da câmera. O sistema marca cada ictus (o ponto do tempo) e diz se caiu junto com o clique e se o andamento ficou firme."),
      typeof TreinosAL !== "undefined" ? TreinosAL.seletorNivel("regencia") : null,
      h("p", { class: "mudo" }, "Básico: margem de 0,12 s. Intermediário: 0,10 s. Avançado: 0,08 s e o andamento muda no meio do treino."),
      h("div", { class: "linha", style: { gap: ".6rem", "flex-wrap": "wrap", "align-items": "center" } },
        h("span", {}, "Compasso:"), compasso, h("span", {}, "Andamento (BPM):"), bpm, compassos),
      h("div", { class: "linha", style: { gap: ".4rem", "flex-wrap": "wrap", margin: ".5rem 0" } },
        h("button", { onclick: ligar }, "📷 Ligar a câmera"), h("button", { class: "primario", onclick: comecar }, "▶ Começar a reger"),
        h("button", { class: "perigo", onclick: () => { pararTudo(); status.textContent = "Câmera desligada."; } }, "■ Desligar a câmera")),
      status, cv, video,
      h("p", { class: "mudo" }, "A imagem aparece como num espelho. A câmera é usada só ao vivo, neste aparelho: nada é gravado nem enviado.")), resultado);
  }


  return {
    parar,
    montar(el, opcoes = {}) {
      opcoesAtuais = opcoes;
      const area = h("div");
      const itens = [["sinais", "Sinais de teste", telaSinais], ["eq", "EQ 32 bandas", (e) => telaEQ(e, opcoes.arquivoAudio)], ["analisador", "Analisador (mesa física)", telaAnalisador],
        ["vocal", "Teste vocal", telaVocal], ["ritmo", "Ritmo / regência", telaRitmo], ["metronomo", "Metrônomo", telaMetronomo], ["labvoz", "Laboratório da voz", telaLabVoz],
        ["ouvido", "Treino de ouvido", telaOuvido], ["camera", "Regência com câmera", telaCamera], ["bateria", "🥁 Bateria", telaBateria], ["musicos", "🎸 Músicos", telaMusicos]]
        // o treino em casa mostra só alguns treinos, na ordem pedida
        .filter((x) => !opcoes.itens || opcoes.itens.includes(x[0])).sort((a, b) => (opcoes.itens ? opcoes.itens.indexOf(a[0]) - opcoes.itens.indexOf(b[0]) : 0));
      const botoes = itens.map(([id, nome, fn]) => h("button", { onclick: (e) => { parar(); botoes.forEach((b) => b.classList.remove("ligado")); e.currentTarget.classList.add("ligado"); fn(area); } }, nome));
      const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
      const seguro = !window.isSecureContext && !local && location.port
        ? h("div", { class: "cartao instrucao" }, h("p", {}, h("b", {}, "Microfone e câmera do celular: "), "para o Laboratório da voz, o Analisador e a Regência com câmera funcionarem, abra o endereço seguro."),
          h("a", { class: "btn primario", href: opcoes.linkSeguro ? opcoes.linkSeguro() : `https://${location.hostname}:${Number(location.port) + 1}/ferramentas` }, "🎤 Abrir com microfone (endereço seguro)"),
          h("p", { class: "mudo" }, "Na primeira vez o celular mostra um aviso de segurança, porque o certificado é da sua rede local. Toque em Avançado › Continuar (ou Prosseguir). É seguro: o endereço é o computador do professor."))
        : null;
      AL.limpar(el, seguro, h("div", { class: "linha", style: { "margin-bottom": "1rem" } }, botoes), area);
      botoes[0].click();
    },
  };
})();
