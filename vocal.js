/* RMD AudioLab — Laboratório da voz (15/11/2026, pedido do Rinaldo).
   Treinos com som e microfone para a Etapa 2:
   - Afinação: o computador toca a nota, a pessoa canta e o microfone mostra se chegou na nota (gráfico ao vivo + nota final).
   - Aquecimento: exemplos de som (brrr, trrr, canudo, hum, sirene, escala de 5 notas) e "fazer com o microfone" seguindo a linha.
   - Vogais e projeção: vogais A É Ê I Ó Ô U, nota longa com medidor de volume e de estabilidade.
   - Respiração: cronômetro do "sssss" (quanto tempo e quão constante).
   Os sons de exemplo são GERADOS pelo computador: mostram a altura e o ritmo do exercício; a voz humana real soa diferente.
   - Segunda voz (16/11/2026): o computador toca a melodia e a pessoa canta a terça (acima ou abaixo) junto.
   Tudo roda no navegador; o som do microfone nunca é gravado nem enviado. Só a NOTA do treino pode ser guardada na pasta do aluno (treinos.js). */
"use strict";
const LabVoz = (function () {
  const h = AL.h;
  let ctx = null, mic = null, ativo = null, transmissor = null;
  const canalTelao = (() => { try { return new BroadcastChannel("audiolab-labvoz"); } catch (e) { return null; } })();
  const enviarTelao = (msg) => { try { if (canalTelao) canalTelao.postMessage(msg); } catch (e) { /* ok */ } };
  const audio = () => { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume(); return ctx; };
  const NOTAS = ["Dó", "Dó#", "Ré", "Ré#", "Mi", "Fá", "Fá#", "Sol", "Sol#", "Lá", "Lá#", "Si"];
  const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const midiDe = (f) => 69 + 12 * Math.log2(f / 440);
  const nome = (m) => NOTAS[((Math.round(m) % 12) + 12) % 12];
  // diferença em cents até a nota-alvo, aceitando a mesma nota em outra oitava (homem cantando nota de mulher, por exemplo)
  const desvio = (m, alvo) => { const c = (m - alvo) * 100; return ((c % 1200) + 1800) % 1200 - 600; };
  const VOZES = { F: { nome: "Feminina / criança", base: 60, faixa: [57, 69], sirene: [55, 74] }, M: { nome: "Masculina", base: 48, faixa: [45, 57], sirene: [43, 62] } };

  // ---------------------------------------------------------------- sons
  function piano(m, t, dur, vol) {
    const c = audio(), g = c.createGain(), f = freq(m);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35 * (vol || 1), t + 0.01); g.gain.exponentialRampToValueAtTime(0.12 * (vol || 1), t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    [[1, "triangle", 1], [2, "sine", 0.35], [3, "sine", 0.12]].forEach(([k, tipo, a]) => { const o = c.createOscillator(), ga = c.createGain(); o.type = tipo; o.frequency.value = f * k; ga.gain.value = a; o.connect(ga).connect(g); o.start(t); o.stop(t + dur + 0.05); });
    g.connect(c.destination);
  }
  const FORMANTES = { A: [800, 1200, 2500], "É": [600, 1800, 2500], "Ê": [450, 2000, 2600], I: [300, 2300, 3000], "Ó": [550, 900, 2500], "Ô": [450, 800, 2500], U: [325, 700, 2500], M: [280, 900, 2200] };
  // "voz" de exemplo: fonte serrilhada + filtros de formantes (vogal), com vibrato leve; opcional: trinado (brrr/trrr) e abafado (canudo/hum)
  function vozSintetica(op) {
    const c = audio(), t0 = op.t || c.currentTime + 0.05, fim = t0 + op.dur;
    const o = c.createOscillator(); o.type = op.fonte || "sawtooth";
    const curva = op.curva || [[0, op.midi]];
    curva.forEach(([dt, m], i) => { if (i === 0) o.frequency.setValueAtTime(freq(m), t0 + dt); else o.frequency.exponentialRampToValueAtTime(freq(m), t0 + dt); });
    const vib = c.createOscillator(), vg = c.createGain(); vib.frequency.value = 5.3; vg.gain.setValueAtTime(0, t0); vg.gain.linearRampToValueAtTime(op.trinado ? 0 : freq(curva[0][1]) * 0.012, t0 + 0.5); vib.connect(vg).connect(o.frequency);
    const soma = c.createGain(); soma.gain.value = 1;
    (FORMANTES[op.vogal || "A"]).forEach((F, i) => { const b = c.createBiquadFilter(); b.type = "bandpass"; b.frequency.value = F; b.Q.value = 8 + i * 4; const g = c.createGain(); g.gain.value = [1, 0.5, 0.25][i] * 3; o.connect(b).connect(g).connect(soma); });
    let saida = soma;
    if (op.abafado) { const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 700; saida.connect(lp); saida = lp; }
    // timbre extra (ressonância): lista de [tipo, frequência, ganho dB, Q]
    (op.eq || []).forEach(([tipo, f, gdb, q]) => { const b = c.createBiquadFilter(); b.type = tipo; b.frequency.value = f; if (gdb != null) b.gain.value = gdb; if (q != null) b.Q.value = q; saida.connect(b); saida = b; });
    const amp = c.createGain();
    amp.gain.setValueAtTime(0.0001, t0); amp.gain.exponentialRampToValueAtTime(0.5 * (op.vol || 1), t0 + 0.08); amp.gain.setValueAtTime(0.5 * (op.vol || 1), fim - 0.15); amp.gain.exponentialRampToValueAtTime(0.0001, fim);
    saida.connect(amp);
    let final = amp;
    if (op.trinado) { // lábios/língua batendo: o volume abre e fecha rápido
      const tr = c.createGain(); tr.gain.value = 0.5; const lfo = c.createOscillator(), lg = c.createGain(); lfo.type = "square"; lfo.frequency.value = op.trinado; lg.gain.value = 0.5; lfo.connect(lg).connect(tr.gain);
      amp.connect(tr); final = tr; lfo.start(t0); lfo.stop(fim + 0.05);
    }
    final.connect(c.destination);
    o.start(t0); vib.start(t0); o.stop(fim + 0.05); vib.stop(fim + 0.05);
    return fim;
  }

  // ---------------------------------------------------------------- microfone e detecção da nota (YIN simplificado)
  async function abrirMic() {
    if (mic) return mic;
    if (!window.isSecureContext || !navigator.mediaDevices) throw new Error("O microfone só funciona no endereço seguro. No celular, use o botão “Abrir com microfone (endereço seguro)” das Ferramentas.");
    const c = audio();
    const stream = await AL.microfone({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const src = c.createMediaStreamSource(stream), an = c.createAnalyser(); an.fftSize = 2048; src.connect(an);
    const proc = c.createScriptProcessor(2048, 1, 1), mudo = c.createGain(); mudo.gain.value = 0;
    src.connect(proc); proc.connect(mudo).connect(c.destination);
    mic = { an, buf: new Float32Array(2048), aoQuadro: null, fechar: () => { proc.onaudioprocess = null; try { proc.disconnect(); } catch (e) { /* ok */ } stream.getTracks().forEach((t) => t.stop()); mic = null; } };
    // o áudio chama isto a cada ~43 ms mesmo com a janela do painel escondida (o navegador não desacelera o som)
    proc.onaudioprocess = (e) => { if (!mic) return; mic.buf.set(e.inputBuffer.getChannelData(0)); if (mic.aoQuadro) mic.aoQuadro(); };
    return mic;
  }
  function medir() {
    if (!mic) return { midi: null, db: -100 };
    const b = mic.buf;
    let rms = 0; for (let i = 0; i < b.length; i++) rms += b[i] * b[i]; rms = Math.sqrt(rms / b.length);
    const db = 20 * Math.log10(rms + 1e-9);
    if (rms < 0.008) return { midi: null, db };
    return { midi: detectar(b, ctx.sampleRate), db };
  }
  function detectar(b, sr) {
    const W = 1024, tmin = Math.floor(sr / 1100), tmax = Math.min(W, Math.floor(sr / 65));
    const d = new Float32Array(tmax + 2); let soma = 0, tau = -1; d[0] = 1;
    for (let t = 1; t <= tmax + 1; t++) {
      let s = 0; for (let i = 0; i < W; i++) { const x = b[i] - b[i + t]; s += x * x; }
      soma += s; d[t] = soma ? s * t / soma : 1;
    }
    for (let t = tmin; t <= tmax; t++) if (d[t] < 0.15) { tau = t; break; }
    if (tau < 0) { let mel = 1; for (let t = tmin; t <= tmax; t++) if (d[t] < mel) { mel = d[t]; tau = t; } if (mel > 0.35) tau = -1; }
    if (tau < 0) return null;
    if (tau > 0) while (tau + 1 <= tmax && d[tau + 1] < d[tau]) tau++;
    const a = d[tau - 1] || d[tau], c2 = d[tau + 1] || d[tau], den = a - 2 * d[tau] + c2, ajuste = den ? (a - c2) / (2 * den) : 0;
    const f = sr / (tau + (Math.abs(ajuste) < 1 ? ajuste : 0));
    return f > 60 && f < 1100 ? midiDe(f) : null;
  }

  // ---------------------------------------------------------------- gráfico ao vivo: linha da voz × alvo
  function grafico() {
    const cv = h("canvas", { width: 800, height: 280, style: { width: "100%", "max-width": "800px", background: "#0b1820", "border-radius": "12px", display: "block" } });
    const g = cv.getContext("2d"), JANELA = 8;
    // escala vertical PARADA (16/11/2026, o Rinaldo viu o gráfico "tremendo" no celular): ela segue as notas-alvo
    // do exercício (não a voz, que oscila) e, quando precisa mudar, muda devagar.
    let esc = null, ultAgora = -1;
    function desenhar(st) {
      const W = 800, H = 280, agora = st.agora, t0 = Math.max(0, agora - JANELA);
      g.clearRect(0, 0, W, H);
      const ys = [];
      st.alvos.forEach((a) => { if (a.t1 >= t0 - 4 && a.t0 <= agora + 6) ys.push(a.midi); });
      if (st.curva) for (let t = t0; t <= agora + 4; t += 0.25) { const m = st.curva(t); if (m != null) ys.push(m); }
      if (st.curvaPts) st.curvaPts.forEach(([t, m]) => { if (m != null && t >= t0) ys.push(m); });
      if (!ys.length) { // sem alvo (afinador livre): usa a voz, mas só o miolo (ignora notas soltas)
        const vs = st.traco.filter((p) => p.t >= t0 && p.m != null).map((p) => p.m).sort((a, b) => a - b);
        if (vs.length) ys.push(vs[Math.floor(vs.length * 0.2)], vs[Math.floor(vs.length * 0.8)]);
      }
      let alvoC = ys.length ? (Math.max(...ys) + Math.min(...ys)) / 2 : (esc ? esc.centro : 60);
      if (st.centro != null) alvoC = st.centro;
      const alvoM = Math.max(7, ys.length ? (Math.max(...ys) - Math.min(...ys)) / 2 + 3 : 7);
      if (!esc || agora < ultAgora) esc = { centro: Math.round(alvoC), meia: alvoM }; // começo de um treino novo
      else {
        // só anda quando a diferença vale a pena (mais de 1 semitom), e anda devagar
        if (Math.abs(alvoC - esc.centro) > 1) esc.centro += (alvoC - esc.centro) * 0.06;
        if (Math.abs(alvoM - esc.meia) > 1) esc.meia += (alvoM - esc.meia) * 0.06;
      }
      ultAgora = agora;
      const centro = esc.centro, meia = esc.meia;
      const yDe = (m) => H / 2 - (m - centro) / meia * (H / 2 - 18), xDe = (t) => (t - t0) / (JANELA + 2) * (W - 60) + 50;
      // linhas das notas
      g.font = "12px Segoe UI, Arial"; g.textAlign = "right";
      for (let m = Math.ceil(centro - meia); m <= centro + meia; m++) {
        const y = yDe(m), natural = [0, 2, 4, 5, 7, 9, 11].includes(((m % 12) + 12) % 12);
        g.strokeStyle = natural ? "#1d3a48" : "#142a35"; g.lineWidth = 1; g.beginPath(); g.moveTo(50, y); g.lineTo(W, y); g.stroke();
        const apertado = (H / 2 - 18) / meia < 11, pc = ((m % 12) + 12) % 12;
        if (natural && (!apertado || pc === 0 || pc === 7)) { g.fillStyle = "#92b7c6"; g.fillText(nome(m), 44, y + 4); }
      }
      // alvos (faixas) e curva
      st.alvos.forEach((a) => { if (a.t1 < t0 || a.t0 > agora + 2) return; const x0 = xDe(Math.max(a.t0, t0)), x1 = xDe(a.t1), y = yDe(a.midi); g.fillStyle = a.ouvir ? "rgba(73,199,239,.25)" : "rgba(127,209,139,.35)"; g.fillRect(x0, y - 8, Math.max(2, x1 - x0), 16); g.strokeStyle = a.ouvir ? "#49c7ef" : "#7fd18b"; g.strokeRect(x0, y - 8, Math.max(2, x1 - x0), 16);
        // nome da nota escrito em cima da faixa (a pessoa não precisa olhar o canto esquerdo)
        g.font = "bold 15px Segoe UI, Arial"; g.textAlign = "center"; g.lineWidth = 3; g.strokeStyle = "#0b1820"; g.fillStyle = a.ouvir ? "#9fe3f7" : "#bff0c8";
        const xr = Math.min(x1, W - 30), xm = Math.max(70, (x0 + xr) / 2); if (xr - x0 > 12) { g.strokeText(nome(a.midi), xm, y - 12); g.fillText(nome(a.midi), xm, y - 12); } g.lineWidth = 1; });
      if (st.curva) { g.strokeStyle = "rgba(127,209,139,.8)"; g.lineWidth = 12; g.globalAlpha = 0.35; g.beginPath(); let ini = true; for (let t = t0; t <= agora + 2; t += 0.05) { const m = st.curva(t); if (m == null) { ini = true; continue; } const x = xDe(t), y = yDe(m); if (ini) { g.moveTo(x, y); ini = false; } else g.lineTo(x, y); } g.stroke(); g.globalAlpha = 1; }
      if (st.curvaPts) { g.strokeStyle = "rgba(127,209,139,.8)"; g.lineWidth = 12; g.globalAlpha = 0.35; g.beginPath(); let ini = true; st.curvaPts.forEach(([t, m]) => { if (m == null || t < t0) { ini = true; return; } const x = xDe(t), y = yDe(m); if (ini) { g.moveTo(x, y); ini = false; } else g.lineTo(x, y); }); g.stroke(); g.globalAlpha = 1; }
      // voz
      g.lineWidth = 4; let ant = null;
      st.traco.forEach((p) => {
        if (p.t < t0 || p.m == null) { ant = null; return; }
        const x = xDe(p.t), y = yDe(p.m), dv = p.d == null ? null : Math.abs(p.d);
        g.strokeStyle = dv == null ? "#f2c94c" : dv <= 30 ? "#7fd18b" : dv <= 60 ? "#f2c94c" : "#ef6b6b";
        if (ant && p.t - ant.t < 0.2) { g.beginPath(); g.moveTo(ant.x, ant.y); g.lineTo(x, y); g.stroke(); }
        ant = { x, y, t: p.t };
      });
      g.strokeStyle = "#eaf5f9"; g.lineWidth = 1; g.beginPath(); g.moveTo(xDe(agora), 0); g.lineTo(xDe(agora), H); g.stroke();
      // nome da nota que a pessoa está cantando agora, ao lado da ponta da linha
      const ult = st.traco.length ? st.traco[st.traco.length - 1] : null;
      if (ult && ult.m != null && agora - ult.t < 0.3) { const y = yDe(ult.m), dv = ult.d == null ? null : Math.abs(ult.d); g.font = "bold 18px Segoe UI, Arial"; g.textAlign = "left"; g.lineWidth = 4; g.strokeStyle = "#0b1820"; g.fillStyle = dv == null ? "#f2c94c" : dv <= 30 ? "#7fd18b" : dv <= 60 ? "#f2c94c" : "#ef6b6b"; g.strokeText(nome(ult.m), xDe(agora) + 8, y + 6); g.fillText(nome(ult.m), xDe(agora) + 8, y + 6); g.lineWidth = 1; }
      // medidor de volume (direita)
      if (st.db != null) { const v = Math.max(0, Math.min(1, (st.db + 60) / 55)); g.fillStyle = "#12303d"; g.fillRect(W - 18, 10, 10, H - 20); g.fillStyle = v > 0.85 ? "#ef6b6b" : v > 0.45 ? "#7fd18b" : "#49c7ef"; g.fillRect(W - 18, 10 + (H - 20) * (1 - v), 10, (H - 20) * v); }
      if (st.texto) { g.textAlign = "left"; g.font = "bold 18px Segoe UI, Arial"; g.fillStyle = "#f2c94c"; g.fillText(st.texto, 60, 26); }
    }
    return { cv, desenhar };
  }

  // ---------------------------------------------------------------- sessão: toca a parte do professor/guia e escuta a pessoa
  function sessao(painel, plano, aoFim) {
    // plano: { alvos: [{t0,t1,midi,ouvir}], curva(t)?, sons(tInicioAudio), dur, avaliar: [{t0,t1,midi} | {curva}] }
    parar();
    const st = { agora: 0, traco: [], alvos: plano.alvos || [], curva: plano.curva || null, texto: "", db: null };
    let raf = 0, vivo = true, ultimo = 0;
    const c = audio(), inicioAudio = c.currentTime + 0.3;
    if (plano.sons) plano.sons(inicioAudio);
    const amostrar = () => {
      if (!vivo) return;
      const t = c.currentTime - inicioAudio; st.agora = Math.max(0, t);
      {
        const r = medir(); st.db = r.db;
        if (t >= 0) {
          const alvo = st.alvos.find((a) => !a.ouvir && t >= a.t0 && t <= a.t1), am = alvo ? alvo.midi : st.curva && plano.cantarDe != null && t >= plano.cantarDe ? st.curva(t) : null;
          st.traco.push({ t, m: r.midi, d: r.midi != null && am != null ? desvio(r.midi, am) : null, db: r.db });
        }
        const fase = plano.fases ? plano.fases.find((f) => t >= f[0] && t < f[1]) : null; st.texto = fase ? fase[2] : "";
        painel.leitura(r, st);
      }
      if (transmissor) transmissor(st);
      if (t > plano.dur) { vivo = false; if (mic) mic.aoQuadro = null; painel.graf.desenhar(st); aoFim(st); }
    };
    const desenhar = () => { if (!vivo) return; painel.graf.desenhar(st); raf = requestAnimationFrame(desenhar); };
    let reserva = 0;
    if (mic) mic.aoQuadro = amostrar; else reserva = setInterval(amostrar, 43);
    raf = requestAnimationFrame(desenhar);
    ativo = { parar: () => { vivo = false; cancelAnimationFrame(raf); clearInterval(reserva); if (mic) mic.aoQuadro = null; } };
  }
  function parar() { if (ativo) { const a = ativo; ativo = null; a.parar(); } }

  function notaDaFaixa(st, a, tol, minimo) { // avalia um alvo: % do tempo afinado (dentro de "tol" cents) e média do desvio
    tol = tol || 50; minimo = minimo || 0.6;
    const ps = st.traco.filter((p) => p.t >= a.t0 + 0.35 && p.t <= a.t1 && p.m != null).map((p) => desvio(p.m, a.midi));
    if (ps.length < 4) return { ok: false, semVoz: true, pct: 0, media: 0 };
    const pct = ps.filter((d) => Math.abs(d) <= tol).length / ps.length, media = ps.reduce((x, y) => x + y, 0) / ps.length;
    return { ok: pct >= minimo, pct, media };
  }
  // exigência de cada nível (Básico, Intermediário, Avançado)
  const NIV = [
    { tol: 50, minimo: 0.6, cantar: 1.3, eco1: 5, eco3: 4, salto3: 4, saltos: [3, 4, 5, 7] },
    { tol: 35, minimo: 0.65, cantar: 1.15, eco1: 6, eco3: 5, salto3: 5, saltos: [3, 4, 5, 7, 8, 9] },
    { tol: 25, minimo: 0.7, cantar: 1.0, eco1: 8, eco3: 6, salto3: 7, saltos: [5, 7, 8, 9, -5, -7, 12] },
  ];
  const nivelDe = (f) => (typeof TreinosAL !== "undefined" ? TreinosAL.nivel(f) : 0);
  const rotuloDe = (f) => (typeof TreinosAL !== "undefined" ? TreinosAL.rotulo(f) : "");
  const seletorDe = (f, fn) => (typeof TreinosAL !== "undefined" ? TreinosAL.seletorNivel(f, fn) : null);
  const frase = (r) => r.semVoz ? "não ouvi a voz" : r.ok ? "afinado" : r.media > 0 ? "acima da nota" : "abaixo da nota";

  // ---------------------------------------------------------------- tela
  function montar(el, modoInicial, op) {
    parar();
    op = op || {};
    let voz = "F";
    // guarda a nota do treino na pasta do aluno (no celular do aluno: sozinho; no computador: o professor escolhe o aluno)
    const guardar = (treino, nota, detalhe) => (typeof TreinosAL !== "undefined" ? TreinosAL.caixa("voz", treino + " · voz " + V().nome.toLowerCase(), nota, detalhe) : null);
    const graf = grafico();
    const notaGrande = h("div", { class: "nota", style: { "min-width": "7.5rem", "white-space": "nowrap", flex: "none" } }, "—"), dica = h("div", { class: "mudo", style: { "min-height": "2.8em", "line-height": "1.4em", flex: "1", overflow: "hidden" } }, "");
    const resultado = h("div", {});
    const corpo = h("div", {});
    const status = h("p", { class: "mudo", style: { margin: ".3rem 0" } }, "Microfone desligado. Ele liga sozinho quando você começa um treino com microfone.");
    const painel = {
      graf,
      leitura: (r, st) => {
        if (r.midi == null) { notaGrande.textContent = "—"; notaGrande.className = "nota"; dica.textContent = r.db > -45 ? "som sem nota definida (ar, ruído ou trinado)" : "silêncio"; return; }
        const ult = st.traco[st.traco.length - 1], d = ult && ult.d;
        notaGrande.textContent = nome(r.midi) + (d == null ? "" : (d > 0 ? "  +" : "  ") + Math.round(d));
        notaGrande.className = "nota " + (d == null ? "" : Math.abs(d) <= 30 ? "ok" : Math.abs(d) <= 60 ? "aviso" : "erro");
        dica.textContent = d == null ? "nota que você está cantando" : Math.abs(d) <= 30 ? "afinado!" : d > 0 ? "um pouco acima: desça a voz" : "um pouco abaixo: suba a voz";
      },
    };
    async function comMic(fn) {
      try { await abrirMic(); status.textContent = "🎙 Microfone ligado. Cante perto do microfone do computador (ou use fone de ouvido para o som do exemplo não atrapalhar)."; fn(); }
      catch (e) { status.textContent = "⚠️ " + (e.message && e.message.includes("seguro") ? e.message : "O navegador não liberou o microfone. Permita o microfone e tente de novo."); }
    }
    const V = () => VOZES[voz];
    const sorteio = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const MAIOR = [0, 2, 4, 5, 7, 9, 11, 12];

    // ---------- AFINAÇÃO
    const TIPOS_AFINACAO = [["eco1", "🎯 Nota e eco (5 notas soltas)"], ["escala", "🎼 Escala Dó-Ré-Mi-Fá-Sol"], ["eco3", "🔁 Eco de 3 notas"], ["saltos", "↕️ Saltos (intervalos)"]];
    const semIcone = (t) => String(t).replace(/^\S+\s/, "");
    function treinoAfinacao(tipo) {
      const v = V(), nv = nivelDe("afinacao"), N = NIV[nv]; let itens = [];
      if (tipo === "eco1") itens = Array.from({ length: N.eco1 }, () => [sorteio(v.faixa[0], v.faixa[1])]);
      if (tipo === "escala") itens = nv === 0 ? [[0, 2, 4, 5, 7].map((x) => v.base + x)] : nv === 1 ? [[0, 2, 4, 5, 7, 5, 4, 2, 0].map((x) => v.base + x)] : [[0, 2, 4, 5, 7, 9, 11, 12].map((x) => v.base - 2 + x), [12, 11, 9, 7, 5, 4, 2, 0].map((x) => v.base - 2 + x)];
      if (tipo === "eco3") itens = Array.from({ length: N.eco3 }, () => { let n = v.base + MAIOR[sorteio(0, 4)]; const s = [n]; for (let i = 0; i < 2; i++) { const pos = MAIOR.filter((x) => Math.abs(v.base + x - n) <= N.salto3 && v.base + x !== n); n = v.base + pos[sorteio(0, pos.length - 1)]; s.push(n); } return s; });
      if (tipo === "saltos") itens = N.saltos.map((iv) => (iv < 0 ? [v.base + 7, v.base + 7 + iv] : [v.base, v.base + iv]));
      const alvos = [], fases = [], avaliar = []; let t = 0;
      const notas = [];
      itens.forEach((seq, k) => {
        const ouvir = seq.length * 0.9; fases.push([t, t + ouvir, "Ouça (" + (k + 1) + "/" + itens.length + ")"]);
        seq.forEach((m, i) => { alvos.push({ t0: t + i * 0.9, t1: t + i * 0.9 + 0.8, midi: m, ouvir: true }); notas.push([m, t + i * 0.9]); });
        t += ouvir + 0.3; const cantar = seq.length * N.cantar; fases.push([t, t + cantar, "Agora cante! (" + (k + 1) + "/" + itens.length + ")"]);
        seq.forEach((m, i) => { const a = { t0: t + i * N.cantar, t1: t + i * N.cantar + N.cantar - 0.1, midi: m }; alvos.push(a); avaliar.push(a); });
        t += cantar + 0.6;
      });
      AL.limpar(resultado, h("p", { class: "mudo" }, "Ouça a nota (faixa azul) e depois cante na faixa verde. A linha da sua voz fica verde quando está afinada."));
      sessao(painel, { alvos, fases, dur: t, sons: (t0) => notas.forEach(([m, dt]) => piano(m, t0 + dt, 0.85)) }, (st) => {
        const rs = avaliar.map((a) => ({ a, r: notaDaFaixa(st, a, N.tol, N.minimo) })), acertos = rs.filter((x) => x.r.ok).length;
        const pct = Math.round(acertos / rs.length * 100);
        AL.limpar(resultado, h("div", { class: "cartao" },
          h("h3", {}, "Resultado: " + acertos + " de " + rs.length + " notas afinadas (" + pct + "%)"),
          h("p", {}, pct >= 80 ? "🎉 Muito bem! Ouvido e voz trabalhando juntos." : pct >= 50 ? "👍 Bom caminho. Repita devagar, imaginando a nota antes de cantar." : "💪 Continue treinando: ouça a nota, cantarole por dentro e só então cante."),
          h("ul", {}, rs.map((x) => h("li", {}, (x.r.ok ? "✅ " : x.r.semVoz ? "🔇 " : "⚠️ ") + nome(x.a.midi) + ": " + frase(x.r) + (x.r.semVoz ? "" : " (" + Math.round(x.r.pct * 100) + "% do tempo na nota)")))),
          guardar("Afinação · " + semIcone((TIPOS_AFINACAO.find((x) => x[0] === tipo) || ["", tipo])[1]) + rotuloDe("afinacao"), pct, acertos + " de " + rs.length + " notas afinadas (margem ±" + N.tol + " cents)")));
      });
    }
    function afinadorLivre() {
      AL.limpar(resultado, h("p", { class: "mudo" }, "Cante qualquer nota: o gráfico mostra a nota que você está cantando. Bom para ver se a voz fica parada na nota."));
      sessao(painel, { alvos: [], dur: 60, fases: [[0, 60, "Cante livremente (60 s)"]] }, () => {});
    }
    function telaAfinacao() {
      const tipos = TIPOS_AFINACAO;
      AL.limpar(corpo,
        h("p", {}, "O computador toca, a pessoa repete cantando. O microfone mostra na hora se ela chegou na nota. Vale cantar a nota em outra oitava (homem pode cantar a nota de mulher mais grave)."),
        seletorDe("afinacao"),
        h("p", { class: "mudo" }, "Básico: margem de ±50 cents, notas mais longas. Intermediário: ±35 cents, mais notas e saltos maiores. Avançado: ±25 cents, notas rápidas, escala de uma oitava e saltos descendo."),
        h("div", { class: "linha", style: { "flex-wrap": "wrap", gap: ".4rem" } },
          tipos.map(([t, n]) => h("button", { class: t === "eco1" ? "primario" : "", onclick: () => comMic(() => treinoAfinacao(t)) }, n)),
          h("button", { onclick: () => comMic(afinadorLivre) }, "🎙 Só mostrar a nota que estou cantando")));
    }

    // ---------- AQUECIMENTO
    function sirene(v) { const [a, b] = v.sirene; return [[0, a], [2.5, b], [5, a]]; }
    const curvaDe = (pts, t0) => (t) => { const x = t - t0; if (x < 0 || x > pts[pts.length - 1][0]) return null; for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [xa, ya] = pts[i - 1], [xb, yb] = pts[i]; return ya + (yb - ya) * (x - xa) / (xb - xa); } return null; };
    const EXERC = [
      ["brrr", "💋 Brrr (lábios vibrando) — sirene", "Lábios soltos vibrando como motor, do grave ao agudo e de volta.", { trinado: 22, vogal: "U" }],
      ["trrr", "👅 Trrr (língua vibrando) — sirene", "R vibrado de língua, subindo e descendo devagar.", { trinado: 28, vogal: "Ê" }],
      ["canudo", "🥤 Canudo — sirene", "Som dentro do canudo, sem força, subindo e descendo.", { abafado: true, vogal: "U" }],
      ["uuu", "🌀 Sirene em \"uuu\" (passagem da voz)", "Liga o grave ao agudo sem quebrar a voz.", { vogal: "U" }],
    ];
    function exemploSirene(op, comMicrofone, titulo) {
      const v = V(), pts = sirene(v);
      if (!comMicrofone) { parar(); vozSintetica(Object.assign({ curva: pts, dur: 5.2, midi: pts[0][1] }, op)); AL.limpar(resultado, h("p", { class: "mudo" }, "Som de exemplo gerado pelo computador: mostra a altura e o ritmo do exercício.")); return; }
      const alvoCurva = curvaDe(pts, 6.2), curvaTotal = (t) => (t < 5.5 ? curvaDe(pts, 0)(t) : alvoCurva(t));
      AL.limpar(resultado, h("p", { class: "mudo" }, "Primeiro ouça o exemplo; depois faça você, seguindo a faixa verde."));
      sessao(painel, { curva: curvaTotal, cantarDe: 6.2, dur: 11.8, fases: [[0, 5.5, "Ouça o exemplo"], [5.5, 6.2, "Prepare..."], [6.2, 11.8, "Agora você! Siga a faixa verde"]], sons: (t0) => vozSintetica(Object.assign({ t: t0, curva: pts, dur: 5.2, midi: pts[0][1] }, op)) }, (st) => {
        const ps = st.traco.filter((p) => p.t >= 6.4 && p.t <= 11.4);
        const comNota = ps.filter((p) => p.m != null), perto = comNota.filter((p) => { const a = alvoCurva(p.t); return a != null && Math.abs(desvio(p.m, a)) <= 150; });
        const pct = comNota.length ? Math.round(perto.length / comNota.length * 100) : 0, cobertura = ps.length ? Math.round(comNota.length / ps.length * 100) : 0;
        AL.limpar(resultado, h("div", { class: "cartao" }, h("h3", {}, comNota.length < 10 ? "Não captei a voz direito. Chegue mais perto do microfone." : "Você acompanhou a sirene em " + pct + "% do tempo"),
          h("p", { class: "mudo" }, "No brrr e no trrr o microfone às vezes perde a nota por causa da vibração; isso é normal (som com nota: " + cobertura + "% do tempo). O importante é subir e descer sem forçar."),
          comNota.length < 10 ? null : guardar("Aquecimento · " + semIcone(titulo || "• sirene"), pct, "acompanhou a sirene em " + pct + "% do tempo")));
      });
    }
    function escala5(comMicrofone) {
      const v = V(), pad = [0, 2, 4, 5, 7, 5, 4, 2, 0], notas = [], alvos = [], fases = []; let t = 0;
      for (let k = 0; k < 4; k++) {
        const base = v.base - 2 + k; fases.push([t, t + 3.6, "Ouça (tom " + (k + 1) + "/4)"]);
        pad.forEach((x, i) => { notas.push([base + x, t + i * 0.4]); alvos.push({ t0: t + i * 0.4, t1: t + i * 0.4 + 0.38, midi: base + x, ouvir: true }); });
        t += 3.9;
        if (comMicrofone) { fases.push([t, t + 3.6, "Agora você (brrr, \"ma\" ou \"nhã\")"]); pad.forEach((x, i) => alvos.push({ t0: t + i * 0.4, t1: t + i * 0.4 + 0.38, midi: base + x })); t += 4.1; }
      }
      if (!comMicrofone) { parar(); const c = audio(), t0 = c.currentTime + 0.1; notas.forEach(([m, dt]) => piano(m, t0 + dt, 0.42)); AL.limpar(resultado, h("p", { class: "mudo" }, "Escala de 5 notas (1-2-3-4-5-4-3-2-1), subindo meio tom a cada vez. Cante junto em brrr, \"ma\" ou \"nhã\".")); return; }
      sessao(painel, { alvos, fases, dur: t, sons: (t0) => notas.forEach(([m, dt]) => piano(m, t0 + dt, 0.42)) }, (st) => {
        const av = alvos.filter((a) => !a.ouvir).map((a) => notaDaFaixa(st, a)), ok = av.filter((r) => r.ok).length;
        AL.limpar(resultado, h("div", { class: "cartao" }, h("h3", {}, "Escala: " + ok + " de " + av.length + " notas afinadas"), h("p", { class: "mudo" }, "Notas rápidas são mais difíceis para o microfone; use o resultado como guia, não como nota de prova."),
          guardar("Aquecimento · escala de 5 notas", av.length ? ok / av.length * 100 : 0, ok + " de " + av.length + " notas afinadas")));
      });
    }
    function hum(comMicrofone) {
      const v = V(), seq = [v.base, v.base + 2, v.base + 4], alvos = [], fases = []; let t = 0;
      if (!comMicrofone) { parar(); const c = audio(); let tt = c.currentTime + 0.1; seq.forEach((m) => { vozSintetica({ t: tt, midi: m, dur: 1.6, vogal: "M", abafado: true }); tt += 1.8; }); AL.limpar(resultado, h("p", { class: "mudo" }, "\"Hummm\" de boca fechada, sentindo cócegas nos lábios e no nariz, em 3 notas subindo.")); return; }
      seq.forEach((m, i) => { alvos.push({ t0: t, t1: t + 1.6, midi: m, ouvir: true }); fases.push([t, t + 1.6, "Ouça"]); t += 1.9; alvos.push({ t0: t, t1: t + 2.5, midi: m }); fases.push([t, t + 2.5, "Agora você: hummm"]); t += 2.9; });
      sessao(painel, { alvos, fases, dur: t, sons: (t0) => { let k = 0; alvos.filter((a) => a.ouvir).forEach((a) => vozSintetica({ t: t0 + a.t0, midi: a.midi, dur: 1.6, vogal: "M", abafado: true, vol: 0.9 + k++ * 0 })); } }, (st) => {
        const av = alvos.filter((a) => !a.ouvir).map((a) => notaDaFaixa(st, a)), ok = av.filter((r) => r.ok).length;
        AL.limpar(resultado, h("div", { class: "cartao" }, h("h3", {}, "Hum: " + ok + " de " + av.length + " notas afinadas"), h("p", { class: "mudo" }, "No hum a voz deve ficar parada e confortável, sem apertar a garganta."),
          guardar("Aquecimento · hum na máscara", av.length ? ok / av.length * 100 : 0, ok + " de " + av.length + " notas afinadas")));
      });
    }
    function telaAquecimento() {
      AL.limpar(corpo,
        h("p", {}, "Cada exercício tem um exemplo para ouvir e um modo com microfone, em que a pessoa faz em seguida e vê a linha da voz seguindo o desenho."),
        EXERC.map(([id, n, d, op]) => h("div", { class: "cartao", style: { margin: ".4rem 0", padding: ".6rem .8rem" } }, h("b", {}, n), h("div", { class: "mudo" }, d),
          h("div", { class: "linha", style: { "margin-top": ".4rem", gap: ".4rem", "flex-wrap": "wrap" } }, h("button", { onclick: () => exemploSirene(op, false, n) }, "▶ Ouvir exemplo"), h("button", { class: "primario", onclick: () => comMic(() => exemploSirene(op, true, n)) }, "🎙 Fazer com o microfone")))),
        h("div", { class: "cartao", style: { margin: ".4rem 0", padding: ".6rem .8rem" } }, h("b", {}, "🎹 Escala de 5 notas subindo"), h("div", { class: "mudo" }, "1-2-3-4-5-4-3-2-1, quatro tons subindo. Ouça e repita."),
          h("div", { class: "linha", style: { "margin-top": ".4rem", gap: ".4rem", "flex-wrap": "wrap" } }, h("button", { onclick: () => escala5(false) }, "▶ Ouvir a escala"), h("button", { class: "primario", onclick: () => comMic(() => escala5(true)) }, "🎙 Ouvir e repetir com o microfone"))),
        h("div", { class: "cartao", style: { margin: ".4rem 0", padding: ".6rem .8rem" } }, h("b", {}, "😌 Hum na máscara"), h("div", { class: "mudo" }, "Boca fechada, som na frente do rosto, 3 notas."),
          h("div", { class: "linha", style: { "margin-top": ".4rem", gap: ".4rem", "flex-wrap": "wrap" } }, h("button", { onclick: () => hum(false) }, "▶ Ouvir exemplo"), h("button", { class: "primario", onclick: () => comMic(() => hum(true)) }, "🎙 Fazer com o microfone"))));
    }

    // ---------- VOGAIS E PROJEÇÃO
    function notaLonga(vogal) {
      const v = V(), m = v.base + 7, alvos = [{ t0: 0, t1: 1.8, midi: m, ouvir: true }, { t0: 2.3, t1: 8.3, midi: m }];
      AL.limpar(resultado, h("p", { class: "mudo" }, "Ouça a vogal e sustente a mesma nota por 6 segundos, com volume firme e constante (barra à direita do gráfico)."));
      sessao(painel, { alvos, dur: 8.6, fases: [[0, 1.8, "Ouça: " + vogal], [2.3, 8.3, "Sustente o \"" + vogal + "\" — firme, sem gritar"]], sons: (t0) => vozSintetica({ t: t0, midi: m, dur: 1.8, vogal }) }, (st) => {
        const r = notaDaFaixa(st, alvos[1]), dbs = st.traco.filter((p) => p.t >= 2.8 && p.t <= 8.1 && p.m != null).map((p) => p.db);
        const med = dbs.length ? dbs.reduce((a, b) => a + b, 0) / dbs.length : -100, dp = dbs.length ? Math.sqrt(dbs.reduce((a, b) => a + (b - med) * (b - med), 0) / dbs.length) : 99;
        AL.limpar(resultado, h("div", { class: "cartao" }, h("h3", {}, "Nota longa em \"" + vogal + "\""),
          h("p", {}, "Afinação: " + (r.semVoz ? "não ouvi a voz" : Math.round(r.pct * 100) + "% do tempo na nota (" + frase(r) + ")")),
          h("p", {}, "Volume: " + (dbs.length < 5 ? "—" : dp <= 3 ? "✅ constante (bom apoio)" : dp <= 6 ? "👍 quase constante" : "⚠️ oscilando: o ar está acabando ou faltando apoio")),
          h("p", { class: "mudo" }, "O computador mede afinação e se o volume fica constante. Se a pessoa está forçando a garganta, quem percebe é o professor: pescoço tenso e voz dura são sinal de grito."),
          r.semVoz ? null : guardar("Vogais · nota longa em " + vogal, r.pct * 100, "volume " + (dbs.length < 5 ? "não medido" : dp <= 3 ? "constante" : dp <= 6 ? "quase constante" : "oscilando"))));
      });
    }
    function telaVogais() {
      const vog = ["A", "É", "Ê", "I", "Ó", "Ô", "U"];
      AL.limpar(corpo,
        h("p", {}, "Ouça cada vogal (som de exemplo gerado pelo computador) e depois sustente uma nota longa nela. Treina vogal pura, ressonância e projeção com volume firme."),
        h("b", {}, "Ouvir a vogal:"), h("div", { class: "linha", style: { gap: ".4rem", "flex-wrap": "wrap", margin: ".3rem 0 .8rem" } }, vog.map((x) => h("button", { style: { "font-size": "1.3rem", "min-width": "3rem" }, onclick: () => { parar(); vozSintetica({ midi: V().base + 7, dur: 1.6, vogal: x }); } }, x))),
        h("b", {}, "Nota longa com microfone (afinação + volume constante):"), h("div", { class: "linha", style: { gap: ".4rem", "flex-wrap": "wrap", margin: ".3rem 0" } }, vog.map((x) => h("button", { class: "primario", onclick: () => comMic(() => notaLonga(x)) }, "🎙 " + x))));
    }

    // ---------- RESPIRAÇÃO (sssss)
    function sssss() {
      parar(); const c = audio(); let raf = 0, vivo = true, base = null, ini = null, ultimoSom = null, amostras = [], calib = [];
      const t0 = performance.now();
      const mostrador = h("div", { class: "nota" }, "0,0 s");
      AL.limpar(resultado, h("div", { class: "cartao" }, h("p", {}, "1) Fique em silêncio 1 segundo (medindo o ambiente). 2) Inspire. 3) Solte o ar em \"sssss\" firme e igual, o máximo que conseguir."), mostrador, h("p", { class: "mudo", id: "ssss-txt" }, "Medindo o silêncio...")));
      const txt = resultado.querySelector("#ssss-txt");
      const passo = () => {
        if (!vivo) return;
        const r = medir(), agora = (performance.now() - t0) / 1000;
        if (agora < 1) calib.push(r.db);
        else {
          if (base == null) { base = calib.length ? Math.max(...calib) + 8 : -50; txt.textContent = "Pode começar o sssss!"; }
          const som = r.db > base;
          if (som) { if (ini == null) ini = agora; ultimoSom = agora; amostras.push(r.db); }
          if (ini != null) mostrador.textContent = ((ultimoSom - ini)).toFixed(1).replace(".", ",") + " s";
          if (ini != null && agora - ultimoSom > 0.8) {
            vivo = false; const dur = ultimoSom - ini, med = amostras.reduce((a, b) => a + b, 0) / amostras.length, dp = Math.sqrt(amostras.reduce((a, b) => a + (b - med) ** 2, 0) / amostras.length);
            txt.textContent = "Resultado: " + dur.toFixed(1).replace(".", ",") + " segundos · " + (dp <= 3 ? "saída de ar bem constante ✅" : dp <= 6 ? "quase constante 👍" : "ar irregular: tente soltar mais devagar e igual ⚠️") + (dur >= 20 ? " · meta de 20 s alcançada 🎉" : " · meta: 20 a 30 s");
            // nota: 20 segundos = 100%
            const cx = guardar("Respiração · sssss", dur / 20 * 100, dur.toFixed(1).replace(".", ",") + " s · " + (dp <= 3 ? "ar constante" : dp <= 6 ? "quase constante" : "ar irregular"));
            if (cx) txt.parentNode.append(cx);
            return;
          }
          if (agora > 70) { vivo = false; return; }
        }
        const est = { agora, traco: [], alvos: [], db: r.db, texto: ini == null ? "Aguardando o sssss" : "Sssss..." };
        painel.graf.desenhar(est); if (transmissor) transmissor(est, mostrador.textContent, txt.textContent);
      };
      if (mic) mic.aoQuadro = passo;   // ritmo do áudio: segue medindo mesmo com a janela do painel escondida
      ativo = { parar: () => { vivo = false; cancelAnimationFrame(raf); if (mic) mic.aoQuadro = null; } };
    }
    function telaRespiracao() {
      AL.limpar(corpo, h("p", {}, "Cronômetro do apoio: o microfone mede quanto tempo a pessoa sustenta o \"sssss\" e se o ar sai constante. Meta da Etapa 2: 20 a 30 segundos."),
        h("button", { class: "primario", onclick: () => comMic(sssss) }, "🎙 Começar o Sssss"));
    }

    // ---------- SEGUNDA VOZ (terça acima ou abaixo da melodia)
    // melodias simples feitas para o treino (graus da escala maior: 0 = Dó, 1 = Ré, 2 = Mi...)
    const MELODIAS = [["Escala subindo e descendo", [0, 1, 2, 3, 4, 3, 2, 1, 0]], ["Passos e saltos", [0, 2, 1, 3, 2, 4, 3, 1, 0]],
      ["Descendo do Sol", [4, 3, 2, 1, 2, 3, 1, 0]], ["Arpejo e volta", [0, 2, 4, 2, 3, 1, 0]]];
    const grau = (base, g) => base + 12 * Math.floor(g / 7) + MAIOR[((g % 7) + 7) % 7];
    function segundaVoz(melIdx, acima, guia, lento, comMicrofone, fone) {
      const nv = nivelDe("segunda");
      if (nv >= 1) guia = false;            // Intermediário e Avançado: sem a 2ª voz de guia
      if (nv >= 2) lento = false;           // Avançado: andamento normal (e mais rápido)
      const tol = [50, 40, 30][nv];
      const v = V(), graus = MELODIAS[melIdx][1], d = lento ? 1.25 : nv >= 2 ? 0.75 : 0.9, n = graus.length, bloco = n * d;
      const mel = graus.map((g) => grau(v.base, g)), seg = graus.map((g) => grau(v.base, g + (acima ? 2 : -2)));
      if (!comMicrofone) {
        parar(); const c = audio(), t0 = c.currentTime + 0.1;
        mel.forEach((m, i) => piano(m, t0 + i * d, d * 0.95));
        seg.forEach((m, i) => vozSintetica({ t: t0 + i * d, midi: m, dur: d * 0.95, vogal: "U", vol: 0.55 }));
        AL.limpar(resultado, h("p", { class: "mudo" }, "Melodia (piano) e 2ª voz (voz de exemplo) tocando juntas. Repare como as duas andam no mesmo sentido, a uma terça de distância."));
        return;
      }
      const alvos = [], fases = [], cantar = [];
      fases.push([0, bloco, "Ouça a melodia (1ª voz)"]); mel.forEach((m, i) => alvos.push({ t0: i * d, t1: i * d + d * 0.9, midi: m, ouvir: true }));
      const t2 = bloco + 0.5;
      fases.push([t2, t2 + bloco, "Ouça a 2ª voz (a sua parte)"]); seg.forEach((m, i) => alvos.push({ t0: t2 + i * d, t1: t2 + i * d + d * 0.9, midi: m, ouvir: true }));
      const t3 = t2 + bloco + 1.2;
      fases.push([t3 - 1.2, t3, "Prepare: agora você canta a 2ª voz..."]); fases.push([t3, t3 + bloco, "Cante a 2ª voz junto com a melodia!"]);
      mel.forEach((m, i) => alvos.push({ t0: t3 + i * d, t1: t3 + i * d + d * 0.9, midi: m, ouvir: true }));
      seg.forEach((m, i) => { const a = { t0: t3 + i * d, t1: t3 + i * d + d * 0.92, midi: m }; alvos.push(a); cantar.push(a); });
      const fim = t3 + bloco + 0.4;
      AL.limpar(resultado, h("p", { class: "mudo" }, "Faixa azul: o que o computador toca. Faixa verde: a 2ª voz que você canta. Use fone de ouvido: assim o microfone ouve só a sua voz, e não o piano."));
      sessao(painel, { alvos, fases, dur: fim, sons: (t0) => {
        mel.forEach((m, i) => piano(m, t0 + i * d, d * 0.95));
        seg.forEach((m, i) => vozSintetica({ t: t0 + t2 + i * d, midi: m, dur: d * 0.95, vogal: "U", vol: 0.7 }));
        mel.forEach((m, i) => piano(m, t0 + t3 + i * d, d * 0.95, 0.9));
        // a guia (2ª voz baixinho) enquanto a pessoa canta só toca com fone: sem fone o microfone ouviria a própria guia e daria nota sem a pessoa cantar
        if (guia && fone) seg.forEach((m, i) => vozSintetica({ t: t0 + t3 + i * d, midi: m, dur: d * 0.95, vogal: "U", vol: 0.22 }));
      } }, (st) => {
        // conferência de "vazamento" (16/11/2026, erro achado pelo Rinaldo): nas partes de OUVIR a pessoa fica calada.
        // Se o microfone "cantou" junto as notas que o celular tocou, ele está ouvindo o alto-falante: a nota não vale.
        const ouvidas = alvos.filter((a) => a.ouvir && a.t1 < t3 - 0.5).map((a) => notaDaFaixa(st, a, 50, 0.5));
        const vazou = ouvidas.filter((r) => !r.semVoz && r.ok).length >= Math.max(2, ouvidas.length * 0.3);
        if (vazou) {
          AL.limpar(resultado, h("div", { class: "cartao", style: { "border-left": "4px solid #ef6b6b" } },
            h("h3", {}, "⚠️ O microfone ouviu o som do próprio celular"),
            h("p", {}, "Enquanto era só para ouvir, o microfone captou as notas que o aparelho tocou. Assim o sistema confunde o som do alto-falante com a sua voz, e a nota não seria verdadeira."),
            h("p", {}, h("b", {}, "🎧 Coloque fone de ouvido e faça de novo."), " Se já está de fone, fique em silêncio nas partes “Ouça”."),
            h("p", { class: "mudo" }, "Este treino não foi guardado.")));
          return;
        }
        // o alvo é a 2ª voz: se a pessoa cantou a melodia em vez da 2ª voz, conta como erro (e o aviso explica)
        const rs = cantar.map((a, i) => ({ a, r: notaDaFaixa(st, a, tol), mel: mel[i] }));
        const ok = rs.filter((x) => x.r.ok).length, pct = Math.round(ok / rs.length * 100);
        const foiMelodia = rs.filter((x) => !x.r.ok && !x.r.semVoz && Math.abs(desvio(x.mel, x.a.midi) - x.r.media) < 80).length >= rs.length / 2;
        AL.limpar(resultado, h("div", { class: "cartao" },
          h("h3", {}, "Segunda voz: " + ok + " de " + rs.length + " notas certas (" + pct + "%)"),
          h("p", {}, pct >= 80 ? "🎉 Ótimo! Você segurou a sua voz junto com a melodia." : pct >= 50 ? "👍 Bom começo. Treine de novo com a 2ª voz de guia e mais devagar." : "💪 Comece pelo modo Fácil (com a 2ª voz de guia) e mais devagar."),
          foiMelodia ? h("p", { class: "aviso" }, "Parece que a voz foi para a melodia (o piano) em vez da 2ª voz. Isso é o mais comum no começo: ouça a 2ª voz sozinha algumas vezes antes. (Sem fone de ouvido, o microfone também pode ter ouvido o piano.)") : null,
          h("ul", {}, rs.map((x) => h("li", {}, (x.r.ok ? "✅ " : x.r.semVoz ? "🔇 " : "⚠️ ") + nome(x.a.midi) + " (melodia em " + nome(x.mel) + "): " + frase(x.r)))),
          guardar("Segunda voz · " + MELODIAS[melIdx][0] + " · terça " + (acima ? "acima" : "abaixo") + rotuloDe("segunda"), pct, ok + " de " + rs.length + " notas certas" + (guia ? " · com guia" : " · sem guia") + (lento ? " · devagar" : ""))));
      });
    }
    function telaSegundaVoz() {
      const mel = h("select", { "aria-label": "Melodia" }, MELODIAS.map(([n], i) => h("option", { value: i }, n)));
      const lado = h("select", { "aria-label": "Onde fica a 2ª voz" }, h("option", { value: "1" }, "Terça ACIMA da melodia"), h("option", { value: "0" }, "Terça ABAIXO da melodia"));
      const guia = h("input", { type: "checkbox", checked: true, style: { width: "auto" } }), lento = h("input", { type: "checkbox", checked: true, style: { width: "auto" } });
      const fone = h("input", { type: "checkbox", style: { width: "1.3rem", height: "1.3rem" } });
      const ler = () => [Number(mel.value), lado.value === "1", guia.checked, lento.checked, fone.checked];
      AL.limpar(corpo,
        h("p", {}, "Treino de harmonia: o computador toca a melodia e a pessoa canta a 2ª voz, uma terça acima ou abaixo. Primeiro ouve a melodia, depois ouve a 2ª voz sozinha e então canta a 2ª voz junto com a melodia."),
        seletorDe("segunda"),
        h("p", { class: "mudo" }, "Básico: pode usar a 2ª voz de guia e mais devagar. Intermediário: sem guia. Avançado: sem guia, mais rápido e com margem menor."),
        h("div", { class: "linha", style: { gap: ".6rem", "flex-wrap": "wrap", "align-items": "center" } }, h("span", {}, "Melodia:"), mel, lado),
        h("div", { class: "cartao", style: { "border-left": "4px solid #f2c94c", padding: ".6rem .8rem" } },
          h("b", {}, "🎧 Use fone de ouvido neste treino."), " O celular toca a melodia enquanto você canta; sem fone, o microfone ouve o alto-falante e confunde com a sua voz.",
          h("label", { style: { display: "flex", gap: ".4rem", "align-items": "center", "margin-top": ".4rem" } }, fone, h("b", {}, "Estou de fone de ouvido"))),
        h("div", { class: "linha", style: { gap: "1rem", "flex-wrap": "wrap", margin: ".4rem 0" } },
          h("label", { style: { display: "flex", gap: ".4rem", "align-items": "center" } }, guia, "Fácil: a 2ª voz toca baixinho de guia (só com fone)"),
          h("label", { style: { display: "flex", gap: ".4rem", "align-items": "center" } }, lento, "Mais devagar")),
        h("div", { class: "linha", style: { gap: ".4rem", "flex-wrap": "wrap" } },
          h("button", { onclick: () => { const [a, b, , d] = ler(); segundaVoz(a, b, false, d, false); } }, "▶ Ouvir as duas vozes juntas"),
          h("button", { class: "primario", onclick: () => { const [a, b, c, d, f] = ler();
            if (!f && !confirm("Você não marcou “Estou de fone de ouvido”.\n\nSem fone, o microfone pode ouvir o som do celular e a nota não vale. Continuar mesmo assim?")) return;
            comMic(() => segundaVoz(a, b, c, d, true, f)); } }, "🎙 Cantar a 2ª voz com o microfone")),
        h("p", { class: "mudo" }, "Sem fone, a guia não toca enquanto você canta, e o sistema confere se o microfone está ouvindo o alto-falante."));
    }

    const ABAS = [["afinacao", "🎯 Afinação", telaAfinacao], ["segunda", "🎶 Segunda voz", telaSegundaVoz], ["aquecimento", "🔥 Aquecimento", telaAquecimento], ["vogais", "🗣 Vogais e projeção", telaVogais], ["respiracao", "💨 Respiração (sssss)", telaRespiracao]];
    const selVoz = h("select", { "aria-label": "Tipo de voz", onchange: () => { voz = selVoz.value; } }, Object.entries(VOZES).map(([k, x]) => h("option", { value: k }, "Voz " + x.nome.toLowerCase())));
    const botoes = ABAS.map(([id, n, fn]) => h("button", { "data-aba": id, onclick: () => abrir(id) }, n));
    // 📺 telão: afinação e respiração aparecem no telão por padrão; aquecimento e vogais só se marcar
    let abaAtual = modoInicial || "afinacao", ultimoEnvio = 0;
    const naTela = h("input", { type: "checkbox", style: { width: "auto" }, onchange: () => { if (!naTela.checked) enviarTelao({ tipo: "fim" }); else enviarResultado(); } });
    const titulos = { afinacao: "Afinação", segunda: "Segunda voz", aquecimento: "Aquecimento", vogais: "Vogais e projeção", respiracao: "Respiração (sssss)" };
    function enviarResultado() { if (!naTela.checked) return; enviarTelao({ tipo: "resultado", aba: titulos[abaAtual], linhas: [...resultado.querySelectorAll("h3, p, li, .nota")].map((x) => x.textContent).filter(Boolean).slice(0, 12) }); }
    new MutationObserver(() => enviarResultado()).observe(resultado, { childList: true, subtree: true, characterData: true });
    transmissor = (st, grande, dicaTxt) => {
      if (!naTela.checked || performance.now() - ultimoEnvio < 66) return; ultimoEnvio = performance.now();
      const a = st.agora, curvaPts = st.curva ? Array.from({ length: 121 }, (_, i) => { const t = a - 10 + i * 0.1; return [t, st.curva(t)]; }) : null;
      enviarTelao({ tipo: "vivo", aba: titulos[abaAtual], st: { agora: a, traco: st.traco.filter((p) => p.t >= a - 10), alvos: st.alvos.filter((x) => x.t1 >= a - 10 && x.t0 <= a + 2), curvaPts, texto: st.texto, db: st.db },
        grande: grande != null ? grande : notaGrande.textContent, classe: grande != null ? "" : notaGrande.className, dica: dicaTxt != null ? dicaTxt : dica.textContent });
    };
    // área da medição (nota grande, gráfico, aviso do microfone e resultado): fica logo embaixo do exercício tocado
    // (pedido do Rinaldo, 16/11/2026: no Aquecimento o gráfico ficava lá no fim, depois de todos os exercícios)
    const areaMedida = h("div", { class: "area-medida" },
      h("div", { style: { display: "flex", gap: "1rem", "align-items": "center", margin: ".6rem 0 .2rem", "min-height": "4.6rem" } }, notaGrande, dica),
      graf.cv, status, resultado);
    corpo.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b || !corpo.contains(b)) return;
      const lugar = b.closest(".cartao") || b.parentNode;
      if (lugar && lugar.nextSibling !== areaMedida) lugar.after(areaMedida);
      setTimeout(() => graf.cv.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
    });
    function abrir(id) { el.append(areaMedida); parar(); abaAtual = id; naTela.checked = !op.semTelao && (id === "afinacao" || id === "segunda" || id === "respiracao"); enviarTelao({ tipo: "fim" }); botoes.forEach((b) => b.classList.toggle("ligado", b.dataset.aba === id)); AL.limpar(resultado); (ABAS.find((a) => a[0] === id) || ABAS[0])[2](); }
    AL.limpar(el,
      h("div", { class: "linha", style: { gap: ".4rem", "flex-wrap": "wrap", "margin-bottom": ".5rem" } }, botoes),
      h("div", { class: "linha", style: { gap: ".6rem", "align-items": "center", "flex-wrap": "wrap" } }, h("span", {}, "Quem vai cantar:"), selVoz, h("button", { class: "perigo", onclick: () => { parar(); if (mic) mic.fechar(); status.textContent = "Microfone desligado."; } }, "■ Parar e desligar o microfone"),
        op.semTelao ? null : h("label", { style: { display: "flex", gap: ".4rem", "align-items": "center" } }, naTela, "📺 Mostrar no telão (gráfico e resultado)")),
      corpo, areaMedida);
    abrir(modoInicial || "afinacao");
  }
  function desligar() { parar(); if (mic) mic.fechar(); transmissor = null; enviarTelao({ tipo: "fim" }); }

  // ---------------------------------------------------------------- exemplos de ressonância (slide "Ressonância: onde a voz soa")
  // voz sintética: é uma imitação para comparar o "jeito" de cada som, não uma gravação de cantor
  const RESSON = [
    { id: "cabeca", nome: "Cabeça", cor: "#b896f2", dica: "agudo, leve e brilhante (\"uuu\" subindo)",
      tocar: (t) => vozSintetica({ t, dur: 2.2, vogal: "U", fonte: "triangle", curva: [[0, 69], [0.7, 76], [2.2, 76]], vol: 0.9, eq: [["highpass", 350, null, 0.7], ["peaking", 3200, 4, 1.2]] }) },
    { id: "mascara", nome: "Máscara", cor: "#f2c94c", dica: "clara e projetada (\"hum\" que abre em \"nhá\")",
      tocar: (t) => { const f = vozSintetica({ t, dur: 0.9, vogal: "M", midi: 64, vol: 0.8, eq: [["peaking", 1100, 6, 1.5]] }); return vozSintetica({ t: f - 0.05, dur: 1.6, vogal: "É", midi: 64, vol: 0.9, eq: [["peaking", 2900, 9, 1.4], ["peaking", 1100, 5, 1.5], ["lowshelf", 250, -6]] }); } },
    { id: "boca", nome: "Boca", cor: "#7fd18b", dica: "as vogais e a dicção (a, é, i, ó, u)",
      tocar: (t) => { let f = t; ["A", "É", "I", "Ó", "U"].forEach((v) => { f = vozSintetica({ t: f, dur: 0.5, vogal: v, midi: 62, vol: 0.9 }); }); return f; } },
    { id: "peito", nome: "Peito", cor: "#f29a4a", dica: "grave e cheio (\"ó\" lá embaixo)",
      tocar: (t) => vozSintetica({ t, dur: 2.2, vogal: "Ó", midi: 48, vol: 1, eq: [["lowshelf", 300, 9], ["lowpass", 2600, null, 0.7]] }) },
  ];
  function cartaoRessonancia() {
    const info = h("p", { class: "mudo", style: { margin: ".4rem 0 0" } }, "Clique para a turma ouvir. É uma voz imitada pelo computador, para comparar o jeito de cada som.");
    let tocando = 0;
    const tocar = (lista) => {
      const c = audio(); let t = c.currentTime + 0.08; const fimT = ++tocando;
      lista.forEach((r) => { const ini = t; setTimeout(() => { if (fimT === tocando) { info.textContent = "🔊 " + r.nome + ": " + r.dica; info.style.color = r.cor; } }, (ini - c.currentTime) * 1000); t = r.tocar(t) + 0.45; });
      setTimeout(() => { if (fimT === tocando) { info.textContent = "Clique para a turma ouvir. É uma voz imitada pelo computador, para comparar o jeito de cada som."; info.style.color = ""; } }, (t - c.currentTime) * 1000);
    };
    const botoes = RESSON.map((r) => h("button", { style: { "border-color": r.cor, color: r.cor, "font-weight": "800" }, onclick: () => tocar([r]), title: r.dica }, "🔊 " + r.nome));
    return h("div", { class: "cartao", style: { margin: ".6rem 0" } }, h("b", {}, "🔊 Ouvir cada ressonância"),
      h("div", { style: { display: "flex", "flex-wrap": "wrap", gap: ".5rem", "margin-top": ".5rem" } }, ...botoes, h("button", { onclick: () => tocar(RESSON.slice().reverse()) }, "▶ Comparar do peito à cabeça")), info);
  }
  const EXTRAS = { "v2-ressoadores": cartaoRessonancia };

  // caixa recolhida que aparece abaixo dos slides de voz (prévia do professor)
  function barraSlide(sl) {
    desligar();
    if (!sl || !sl.vocal) return null;
    if (EXTRAS[sl.id]) return h("div", {}, EXTRAS[sl.id](), barraLab(sl));
    return barraLab(sl);
  }
  function barraLab(sl) {
    const area = h("div");
    const botao = h("button", { class: "primario" }, "🎤 Abrir o Laboratório da voz");
    botao.onclick = () => { if (area.childNodes.length) { desligar(); AL.limpar(area); botao.textContent = "🎤 Abrir o Laboratório da voz"; } else { montar(area, sl.vocal); botao.textContent = "✕ Fechar o laboratório"; } };
    const DESC = { afinacao: "treino de afinação: o computador toca a nota e o microfone mostra se a pessoa chegou nela", aquecimento: "exemplos de som do brrr, trrr, canudo, sirene e escalas, e fazer junto com o microfone", vogais: "ouvir as vogais e sustentar nota longa com medidor de afinação e volume", respiracao: "cronômetro do sssss: quanto tempo e quão constante" };
    return h("div", { class: "cartao", style: { margin: ".6rem 0" } }, h("b", {}, "🎤 Praticar agora"), h("p", { class: "mudo", style: { margin: ".2rem 0 .5rem" } }, "Para este assunto: " + (DESC[sl.vocal] || "") + ". O som sai deste computador; o microfone é o do computador (ou um ligado nele)."), botao, area);
  }

  // ---------------------------------------------------------------- telão: mostra o gráfico e o resultado por cima do slide
  function seguirNoTelao() {
    if (!canalTelao) return;
    const graf = grafico();
    graf.cv.style.maxWidth = "none"; graf.cv.style.width = "auto"; graf.cv.style.height = "52vh"; graf.cv.style.maxWidth = "100%"; graf.cv.style.alignSelf = "center";
    const titulo = h("div", { style: { "font-size": "2.2vw", "font-weight": "800", color: "#f08fc0" } }, "");
    const grande = h("div", { class: "nota", style: { "font-size": "6vw", "line-height": "1" } }, "—"), dicaT = h("div", { style: { "font-size": "2.4vw", color: "#cfe0e7" } }, "");
    const res = h("div", { style: { "font-size": "1.6vw", color: "#eaf5f9", "margin-top": ".5vw", columns: "2", "column-gap": "3vw" } });
    const capa = h("div", { style: { position: "fixed", inset: "0", background: "#081218", "z-index": "50", padding: "2vw 3vw", display: "none", "flex-direction": "column", gap: ".8vw", overflow: "hidden" } },
      titulo, h("div", { style: { display: "flex", gap: "2vw", "align-items": "center" } }, grande, dicaT), graf.cv, res);
    document.body.append(capa);
    let fimTimer = 0;
    canalTelao.onmessage = (e) => {
      const m = e.data || {};
      if (m.tipo === "fim") { capa.style.display = "none"; AL.limpar(res); return; }
      capa.style.display = "flex"; clearTimeout(fimTimer); fimTimer = setTimeout(() => { capa.style.display = "none"; }, 10 * 60 * 1000);
      titulo.textContent = "🎤 Laboratório da voz — " + (m.aba || "");
      if (m.tipo === "vivo") { graf.desenhar(m.st); grande.textContent = m.grande || "—"; grande.className = "nota " + String(m.classe || "").replace("nota", "").trim(); dicaT.textContent = m.dica || ""; }
      if (m.tipo === "resultado") AL.limpar(res, (m.linhas || []).map((l, i) => h("div", { style: { "font-weight": i === 0 ? "800" : "400", color: i === 0 ? "#f2c94c" : "" } }, l)));
    };
  }

  return { montar, barraSlide, desligar, seguirNoTelao, _detectar: detectar };
})();
