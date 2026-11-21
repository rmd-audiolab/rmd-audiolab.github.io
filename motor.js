/* RMD AudioLab — motor de áudio da mesa virtual (Web Audio, roda no celular do aluno e no computador do professor).
   Cada controle da mesa muda o som de verdade: o aluno OUVE o problema e ouve a correção. */
"use strict";
class MotorAL {
  constructor() {
    this.ctx = null; this.c = null; this.ex = null; this._timers = [];
    this.louvorId = null; this.louvorChave = null; this._urls = []; this.carregando = false; this.mudo = false;
    // quem usa o motor diz como baixar o arquivo do louvor (o aluno manda o token dele)
    this.buscar = async (url) => { const r = await fetch(url, { credentials: "same-origin" }); if (!r.ok) throw new Error("Não foi possível baixar o louvor."); return r.blob(); };
    this.aoMudarLouvor = null;
  }

  static db(v) { return v <= -59.5 ? 0 : Math.pow(10, v / 20); }
  static laco(c, banda = "magudo") { return (c.voz_ganho - 16) + c.voz_fader + c["voz_" + banda] + Math.max(c.master, 0); } // igual ao servidor

  ligar() {
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext;
    const ctx = this.ctx = new C();
    const g = (v = 1) => { const n = ctx.createGain(); n.gain.value = v; return n; };
    // -------- saída: master -> limitador de proteção -> analisador -> caixas
    this.master = g(1);
    this.limitador = ctx.createDynamicsCompressor();
    this.limitador.threshold.value = -3; this.limitador.ratio.value = 20; this.limitador.attack.value = 0.003; this.limitador.release.value = 0.15;
    this.analisador = ctx.createAnalyser(); this.analisador.fftSize = 8192; this.analisador.smoothingTimeConstant = 0.75;
    this.volume = g(0.9);
    this.master.connect(this.limitador).connect(this.analisador).connect(this.volume).connect(ctx.destination);
    this.medidores = { master: this.analisador };
    // -------- canais
    this.voz = this._canal("voz", true);
    this.mus = this._canal("mus", false);
    // -------- fontes
    // só entra o que o professor escolheu (música gravada): nenhuma voz ou banda sintetizada
    this.fonteVoz = g(1); this.fonteVoz.connect(this.voz.entrada);
    this.fonteMus = g(1); this.fonteMus.connect(this.mus.entrada);
    // -------- louvor gravado: o louvor (com voz) entra no canal VOZ e o playback (instrumental) no canal MÚSICA
    this.audLouvor = new Audio(); this.audPlayback = new Audio();
    for (const a of [this.audLouvor, this.audPlayback]) { a.loop = true; a.preload = "auto"; a.setAttribute("playsinline", ""); }
    // gravações vêm masterizadas (bem altas): entram mais baixo para o canal não distorcer quando a mesa está normal
    this.picosG = g(1);
    ctx.createMediaElementSource(this.audLouvor).connect(g(0.32)).connect(this.picosG).connect(this.fonteVoz);
    ctx.createMediaElementSource(this.audPlayback).connect(g(0.32)).connect(this.fonteMus);
    // no iPhone o player precisa ser "liberado" por um toque: toca um silêncio curtinho agora (estamos dentro do toque em Ligar o som)
    const silencio = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
    for (const a of [this.audLouvor, this.audPlayback]) { a.src = silencio; a.play().then(() => a.pause()).catch(() => {}); }
    this._picos();
    // zumbido de 60 Hz (entra no canal de voz: o HPF e o GRAVE tiram de verdade)
    this.zumbido = g(0);
    [[60, 0.35], [120, 0.12], [180, 0.05]].forEach(([f, a]) => { const o = ctx.createOscillator(); o.frequency.value = f; const ga = g(a); o.connect(ga).connect(this.zumbido); o.start(); });
    this.zumbido.connect(this.voz.entrada);
    // microfonia: apito em 2,5 kHz que cresce quando o laço passa do ponto
    this.apito = g(0);
    const oa = ctx.createOscillator(); oa.frequency.value = 2500; this.osApito = oa; const vib = ctx.createOscillator(); vib.frequency.value = 5; const vg = g(6);
    vib.connect(vg).connect(oa.frequency); oa.connect(this.apito); oa.start(); vib.start();
    this.apito.connect(this.master);
    if (this.c) this.aplicar(this.c, this.ex);
  }

  _canal(nome, voz) {
    const ctx = this.ctx, g = (v = 1) => { const n = ctx.createGain(); n.gain.value = v; return n; };
    const k = { entrada: g(1), ganho: g(1) };
    k.sat = ctx.createWaveShaper(); const curva = new Float32Array(2048); for (let i = 0; i < 2048; i++) { const x = i / 1023.5 - 1; curva[i] = Math.tanh(1.4 * x) / Math.tanh(1.4); } k.sat.curve = curva;
    k.hpf = ctx.createBiquadFilter(); k.hpf.type = "highpass"; k.hpf.frequency.value = 10; k.hpf.Q.value = 0.707;
    const banda = (tipo, f) => { const b = ctx.createBiquadFilter(); b.type = tipo; b.frequency.value = f; b.Q.value = 1; b.gain.value = 0; return b; };
    k.eq = { grave: banda("lowshelf", 100), mgrave: banda("peaking", 300), medio: banda("peaking", 1000), magudo: banda("peaking", 2500), agudo: banda("highshelf", 8000) };
    k.comp = ctx.createDynamicsCompressor(); k.comp.threshold.value = 0; k.comp.ratio.value = 1;
    k.atraso = ctx.createDelay(1.0); k.atraso.delayTime.value = 0;
    k.fader = g(1); k.pan = ctx.createStereoPanner ? ctx.createStereoPanner() : g(1);
    k.medidor = ctx.createAnalyser(); k.medidor.fftSize = 1024;
    k.entrada.connect(k.ganho).connect(k.sat).connect(k.hpf).connect(k.eq.grave).connect(k.eq.mgrave).connect(k.eq.medio).connect(k.eq.magudo).connect(k.eq.agudo).connect(k.comp);
    if (voz) {
      // efeito de eco (envio) e atraso do canal
      k.fxEnvio = g(0); k.fxAtraso = ctx.createDelay(1.0); k.fxAtraso.delayTime.value = 0.28; k.fxRet = g(0.45);
      k.comp.connect(k.fxEnvio).connect(k.fxAtraso); k.fxAtraso.connect(k.fxRet).connect(k.fxAtraso); k.fxAtraso.connect(k.atraso);
    }
    k.comp.connect(k.atraso).connect(k.fader).connect(k.pan).connect(this.master);
    k.fader.connect(k.medidor);
    this.medidores = this.medidores || {}; this.medidores[nome] = k.medidor;
    return k;
  }

  _ruido(tipo) {
    const ctx = this.ctx, n = ctx.sampleRate * 2, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      if (tipo === "rosa") { b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898; d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926; }
      else d[i] = w * 0.5;
    }
    const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s;
  }

  /* Exercício de dinâmica com louvor gravado: o volume do louvor alterna gritos e sussurros (o compressor segura). */
  _picos() {
    const passo = () => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const picos = this.louvorId && this.ex && this.ex.picos && this.ex.status !== "FINALIZADO";
      const bruto = Math.random() < 0.3 ? 1.6 : Math.random() < 0.5 ? 0.12 : 0.45;
      const v = !picos ? 1 : this.c && this.c.voz_comp ? 0.7 + 0.25 * Math.min(1, bruto) : bruto;
      this.picosG.gain.setTargetAtTime(v, t, 0.05);
      this._timers.push(setTimeout(passo, 500 + Math.random() * 700));
    };
    passo();
  }

  /* Troca a música gravada da biblioteca do professor (voz no canal VOZ, playback no canal MÚSICA). Sem música escolhida: silêncio. */
  async _trocarLouvor(lv, corrido) {
    const id = lv ? lv.id : null, chave = lv ? lv.id + "|" + (lv.modo || "original") : null;
    if (chave === this.louvorChave) return;
    this.louvorChave = chave; this.louvorId = id;
    for (const a of [this.audLouvor, this.audPlayback]) { a.pause(); a.removeAttribute("src"); a.load(); }
    this._urls.forEach((u) => URL.revokeObjectURL(u)); this._urls = [];
    if (!id) { if (this.aoMudarLouvor) this.aoMudarLouvor(null); return; }
    this.carregando = true; if (this.aoMudarLouvor) this.aoMudarLouvor({ ...lv, carregando: true });
    const t0 = performance.now();
    try {
      // original: a gravação inteira (+ playback, se enviado). Separado: voz no canal VOZ e instrumental no canal MÚSICA — juntos ou só um deles.
      let partes;
      if (lv.separado && lv.modo === "voz") partes = [["voz", this.audLouvor]];
      else if (lv.separado && lv.modo === "instrumental") partes = [["inst", this.audPlayback]];
      else if (lv.separado && lv.modo !== "original") partes = [["voz", this.audLouvor], ["inst", this.audPlayback]];
      else partes = [["louvor", this.audLouvor]].concat(lv.playback ? [["playback", this.audPlayback]] : []);
      for (const [parte, el] of partes) {
        const b = await this.buscar(`/api/louvor/${id}/${parte}`);
        if (this.louvorChave !== chave) return; // trocou de novo enquanto baixava
        const u = URL.createObjectURL(b); this._urls.push(u); el.src = u;
      }
      // todo mundo (professor e alunos) começa no mesmo ponto da música: o tempo corrido do exercício
      await Promise.all(partes.map(async ([, el]) => {
        if (el.readyState < 1) await new Promise((r) => { el.addEventListener("loadedmetadata", r, { once: true }); setTimeout(r, 4000); });
        const d = el.duration; if (d > 0 && isFinite(d)) el.currentTime = ((corrido || 0) + (performance.now() - t0) / 1000) % d;
      }));
      this._tocarOuPausar();
      if (this.aoMudarLouvor) this.aoMudarLouvor({ ...lv, carregando: false });
    } catch (e) {
      if (this.aoMudarLouvor) this.aoMudarLouvor({ ...lv, erro: e.message || "Falha ao baixar a música." });
    } finally { this.carregando = false; }
  }

  _tocarOuPausar() {
    if (!this.louvorId) return;
    const toca = !this.mudo && this.ex && this.ex.status !== "PAUSADO";
    for (const a of [this.audLouvor, this.audPlayback]) {
      if (!a.src) continue;
      if (toca) { if (a.paused) a.play().catch(() => {}); } else if (!a.paused) a.pause();
    }
  }

  aplicar(c, ex) {
    this.c = c; this.ex = ex;
    if (!this.ctx) return;
    this._trocarLouvor(ex && ex.louvor ? ex.louvor : null, ex ? ex.corrido : 0); this._tocarOuPausar();
    const t = this.ctx.currentTime, s = (p, v) => p.setTargetAtTime(v, t, 0.03);
    for (const [pre, k] of [["voz", this.voz], ["mus", this.mus]]) {
      s(k.ganho.gain, MotorAL.db(c[pre + "_ganho"] - (pre === "voz" ? 10 : 0)));
      s(k.hpf.frequency, c[pre + "_hpf"] ? 100 : 10);
      for (const b of ["grave", "mgrave", "medio", "magudo", "agudo"]) s(k.eq[b].gain, c[pre + "_" + b]);
      s(k.fader.gain, MotorAL.db(c[pre + "_fader"]));
      if (k.pan.pan) s(k.pan.pan, c[pre + "_pan"] / 100);
    }
    s(this.voz.comp.threshold, c.voz_comp ? -24 : 0); s(this.voz.comp.ratio, c.voz_comp ? 4 : 1);
    s(this.voz.atraso.delayTime, Math.min(0.5, c.voz_atraso / 1000));
    s(this.voz.fxEnvio.gain, c.voz_fx ? 0.55 : 0);
    s(this.master.gain, MotorAL.db(c.master));
    s(this.zumbido.gain, ex && ex.zumbido && ex.status !== "FINALIZADO" ? 1 : 0);
    const banda = (ex && ex.banda) || "magudo", laco = MotorAL.laco(c, banda);
    if (ex && ex.apito_hz) this.osApito.frequency.setTargetAtTime(ex.apito_hz, t, 0.01);
    s(this.apito.gain, ex && ex.tipo === "microfonia" && ex.status !== "FINALIZADO" && laco > 0 ? Math.min(0.2, 0.012 * laco) : 0);
  }

  niveis() {
    const r = {};
    if (!this.ctx) return r;
    const buf = new Float32Array(1024);
    for (const [k, a] of Object.entries(this.medidores)) {
      a.getFloatTimeDomainData(buf); let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
      const db = 10 * Math.log10(s / buf.length + 1e-12); r[k] = (db + 60) / 60;
    }
    return r;
  }

  silenciar(sim) {
    this.mudo = !!sim;
    if (this.volume) this.volume.gain.setTargetAtTime(sim ? 0 : 0.9, this.ctx.currentTime, 0.05);
    this._tocarOuPausar();
  }
  ligado() { return !!this.ctx && !this.mudo; }
}

/* Desenha o espectro (escala logarítmica 20 Hz – 20 kHz) de um AnalyserNode num canvas. */
function desenharEspectro(canvas, analisador, sampleRate, referencia) {
  const x = canvas.getContext("2d"), W = canvas.width = canvas.clientWidth * devicePixelRatio, H = canvas.height = canvas.clientHeight * devicePixelRatio;
  const cs = getComputedStyle(document.documentElement);
  x.clearRect(0, 0, W, H);
  x.strokeStyle = cs.getPropertyValue("--borda"); x.fillStyle = cs.getPropertyValue("--mudo"); x.lineWidth = 1; x.font = (10 * devicePixelRatio) + "px sans-serif";
  const fx = (f) => Math.log10(f / 20) / Math.log10(1000) * W;
  [50, 100, 250, 500, 1000, 2500, 5000, 10000].forEach((f) => { const px = fx(f); x.beginPath(); x.moveTo(px, 0); x.lineTo(px, H); x.stroke(); x.fillText(f >= 1000 ? f / 1000 + "k" : f, px + 2, H - 4); });
  if (!analisador) return null;
  const dados = new Float32Array(analisador.frequencyBinCount); analisador.getFloatFrequencyData(dados);
  const hz = sampleRate / analisador.fftSize;
  x.strokeStyle = cs.getPropertyValue("--destaque"); x.lineWidth = 2 * devicePixelRatio; x.beginPath();
  let pico = { db: -200, f: 0 };
  for (let px = 0; px < W; px++) {
    const f = 20 * Math.pow(1000, px / W), i = Math.max(1, Math.round(f / hz));
    const v = dados[i] || -120; if (v > pico.db && f > 40) pico = { db: v, f };
    const y = H - ((v + 100) / 90) * H; px ? x.lineTo(px, y) : x.moveTo(px, y);
  }
  x.stroke();
  if (referencia) { x.strokeStyle = cs.getPropertyValue("--aviso"); x.setLineDash([6, 6]); x.beginPath(); const y = H - ((referencia + 100) / 90) * H; x.moveTo(0, y); x.lineTo(W, y); x.stroke(); x.setLineDash([]); }
  return { dados, hz, pico };
}
