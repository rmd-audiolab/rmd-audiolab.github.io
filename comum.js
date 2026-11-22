/* RMD AudioLab — funções comuns (professor, aluno e projeção). Textos de usuários entram sempre como texto. */
"use strict";
const AL = {
  async api(caminho, corpo, extra = {}) {
    const o = { method: corpo !== undefined ? "POST" : "GET", headers: {}, credentials: "same-origin", cache: "no-store" };
    if (corpo !== undefined) { o.headers["Content-Type"] = "application/json"; o.body = JSON.stringify(corpo); }
    Object.assign(o.headers, extra.headers || {});
    let r;
    try { r = await fetch(caminho, o); } catch (e) { const er = new Error("Sem conexão com o computador do professor."); er.rede = true; throw er; }
    let d = {};
    try { d = await r.json(); } catch (e) { /* vazio */ }
    if (!r.ok) { const er = new Error(d.erro || "Erro " + r.status); er.status = r.status; throw er; }
    return d;
  },
  h(tag, attrs, ...filhos) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (k === "style" && typeof v === "object") Object.assign(e.style, v);
      else if (k === "class") e.className = v;
      else if (v === true) e.setAttribute(k, "");
      else e.setAttribute(k, v);
    }
    const por = (f) => { if (f === null || f === undefined || f === false) return; if (Array.isArray(f)) f.forEach(por); else e.append(f instanceof Node ? f : document.createTextNode(String(f))); };
    filhos.forEach(por);
    return e;
  },
  limpar(el, ...filhos) {
    el.replaceChildren();
    const por = (f) => { if (f === null || f === undefined || f === false) return; if (Array.isArray(f)) f.forEach(por); else el.append(f instanceof Node ? f : document.createTextNode(String(f))); };
    filhos.forEach(por); return el;
  },
  toast(msg, erro) {
    const t = AL.h("div", { class: "toast" + (erro ? " erro" : ""), role: "status" }, msg);
    document.body.append(t); setTimeout(() => t.remove(), 3200);
  },
  tema(t) { document.documentElement.dataset.tema = ["claro", "medio", "escuro"].includes(t) ? t : "escuro"; },
  // ---------- microfone e câmera (20/11/2026, pedido do Rinaldo: no celular aparecia "sem permissão" / "acesso negado"
  // e ninguém sabia o que fazer). Antes de pedir, explica que o celular vai perguntar e que é para tocar em PERMITIR.
  // Se estiver bloqueado, abre a ajuda com o passo a passo para liberar (Chrome, ícone instalado, iPhone).
  // Todas as ferramentas pedem o microfone (AL.microfone) e a câmera (AL.camera) por aqui.
  MIDIA: {
    microfone: { perm: "microphone", nome: "microfone", Nome: "Microfone", icone: "🎤", uso: "ouvir você", padrao: { audio: true }, privacidade: "O som é usado só ao vivo, neste aparelho: nada é gravado nem enviado." },
    camera: { perm: "camera", nome: "câmera", Nome: "Câmera", icone: "📷", uso: "ver o seu gesto", padrao: { video: true }, privacidade: "A imagem é usada só ao vivo, neste aparelho: nada é gravado nem enviado." },
  },
  microfone(restricoes) { return AL._pedirMidia("microfone", restricoes); },
  camera(restricoes) { return AL._pedirMidia("camera", restricoes); },
  async _pedirMidia(tipo, restricoes) {
    const M = AL.MIDIA[tipo];
    if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
      throw new Error((tipo === "camera" ? "A câmera" : "O microfone") + " só funciona no endereço seguro. No celular da aula, use o botão “Abrir com microfone (endereço seguro)” das Ferramentas.");
    let estado = "prompt";
    try { estado = (await navigator.permissions.query({ name: M.perm })).state; } catch (e) { /* o navegador não informa: tenta pedir */ }
    if (estado === "denied") { AL.ajudaPermissao(tipo, { estado, erro: "bloqueado antes de pedir" }); throw new Error("A permissão de " + M.nome + " está bloqueada neste aparelho. Veja na caixa como liberar."); }
    AL._explicado = AL._explicado || {};
    if (estado === "prompt" && !AL._explicado[tipo]) { await AL._avisoPermissao(tipo); AL._explicado[tipo] = true; }
    // 21/11/2026 (pedido do Rinaldo): usa o microfone escolhido (ex.: interface de áudio USB). Se ele sumiu, volta ao padrão do Windows.
    const escolhido = tipo === "microfone" ? AL.microfoneEscolhido() : "";
    if (escolhido) {
      const base = restricoes || M.padrao;
      const audio = Object.assign({}, base.audio === true || !base.audio ? {} : base.audio, { deviceId: { exact: escolhido } });
      try { return await navigator.mediaDevices.getUserMedia(Object.assign({}, base, { audio })); }
      catch (e) {
        if (e.name !== "NotFoundError" && e.name !== "OverconstrainedError") throw e;
        AL.toast("O microfone escolhido não está ligado. Usando o microfone padrão do computador.", true);
      }
    }
    try { return await navigator.mediaDevices.getUserMedia(restricoes || M.padrao); }
    catch (e) {
      if (e.name === "NotAllowedError" || e.name === "SecurityError") { AL.ajudaPermissao(tipo, { estado, erro: e.name + (e.message ? " · " + e.message : "") }); throw new Error("Sem permissão de " + M.nome + ". Veja na caixa como liberar e tente de novo."); }
      if (e.name === "NotFoundError" || e.name === "OverconstrainedError") throw new Error("Não achei " + M.nome + " neste aparelho.");
      if (e.name === "NotReadableError" || e.name === "AbortError") throw new Error("A " + M.nome + " está sendo usada por outro aplicativo (ligação, gravador, WhatsApp, outra aba…). Feche e tente de novo.");
      throw new Error("Não consegui ligar " + (tipo === "camera" ? "a câmera" : "o microfone") + ": " + e.message);
    }
  },
  // ---------- escolha do microfone (21/11/2026): no computador pode haver o microfone do notebook e uma interface de áudio USB.
  // A escolha fica guardada neste computador e vale para todas as ferramentas (afinador, voz, bateria, músicos).
  microfoneEscolhido() { try { return localStorage.getItem("al_microfone") || ""; } catch (e) { return ""; } },
  async escolherMicrofone(aoEscolher) {
    let teste = null, ctx = null, laco = 0;
    const parar = () => { cancelAnimationFrame(laco); if (teste) teste.getTracks().forEach((t) => t.stop()); teste = null; if (ctx) ctx.close().catch(() => {}); ctx = null; };
    let base;
    try { base = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { AL.toast("Não consegui ligar o microfone: " + e.message, true); return; }
    base.getTracks().forEach((t) => t.stop());
    const lista = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "audioinput" && d.deviceId !== "communications");
    const barra = AL.h("div", { style: { height: "100%", width: "0%", background: "#3ccf91", transition: "width .08s" } });
    const medidor = AL.h("div", { style: { height: "18px", background: "rgba(127,127,127,.25)", "border-radius": "9px", overflow: "hidden", margin: ".4rem 0 .8rem" } }, barra);
    const atual = AL.microfoneEscolhido();
    let marcado = lista.some((d) => d.deviceId === atual) ? atual : "";
    const nomeDe = (d) => d.deviceId === "default" ? "Padrão do Windows (" + (d.label || "").replace(/^Padrão - |^Default - /, "") + ")" : (d.label || "Microfone sem nome");
    const ouvir = async (id) => {
      parar(); barra.style.width = "0%";
      try {
        teste = await navigator.mediaDevices.getUserMedia({ audio: id ? { deviceId: { exact: id }, echoCancellation: false, noiseSuppression: false, autoGainControl: false } : true });
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        const an = ctx.createAnalyser(); an.fftSize = 1024; ctx.createMediaStreamSource(teste).connect(an);
        const buf = new Float32Array(an.fftSize);
        const passo = () => { an.getFloatTimeDomainData(buf); let p = 0; for (const v of buf) p = Math.max(p, Math.abs(v)); barra.style.width = Math.min(100, Math.round(p * 140)) + "%"; laco = requestAnimationFrame(passo); };
        passo();
      } catch (e) { AL.toast("Esse microfone não abriu: " + e.message, true); }
    };
    const opcoes = lista.map((d) => {
      const id = d.deviceId === "default" ? "" : d.deviceId;
      const r = AL.h("input", { type: "radio", name: "al-mic", checked: id === marcado, onchange: () => { marcado = id; ouvir(id); } });
      return AL.h("label", { style: { display: "flex", gap: ".5rem", "align-items": "center", margin: ".35rem 0", cursor: "pointer" } }, r, nomeDe(d));
    });
    const j = AL._janela("🎤 Qual microfone usar?",
      AL.h("p", {}, "Escolha o microfone e fale ou cante: a barra verde tem que mexer."),
      opcoes.length ? opcoes : AL.h("p", {}, "Nenhum microfone encontrado."),
      medidor,
      AL.h("p", { class: "mudo" }, "Interface de áudio USB costuma aparecer como “USB Audio CODEC” ou com o nome da marca. A escolha fica guardada neste computador."),
      AL.h("button", { class: "primario bloco", onclick: () => { try { if (marcado) localStorage.setItem("al_microfone", marcado); else localStorage.removeItem("al_microfone"); } catch (e) {} parar(); j.remove(); AL.toast("Microfone escolhido. Vale para todas as ferramentas."); if (aoEscolher) aoEscolher(); } }, "Usar este microfone"),
      AL.h("button", { class: "bloco", style: { "margin-top": ".5rem" }, onclick: () => { parar(); j.remove(); } }, "Cancelar"));
    ouvir(marcado);
  },
  async nomeMicrofoneEscolhido() {
    const id = AL.microfoneEscolhido(); if (!id) return "Padrão do Windows";
    try { const d = (await navigator.mediaDevices.enumerateDevices()).find((x) => x.deviceId === id); return d && d.label ? d.label : "Escolhido (desligado agora)"; } catch (e) { return "Escolhido"; }
  },
  _janela(titulo, ...conteudo) {
    const fundo = AL.h("div", { role: "dialog", "aria-modal": "true", style: { position: "fixed", inset: "0", "z-index": "200", background: "rgba(0,0,0,.65)", display: "flex", "align-items": "center", "justify-content": "center", padding: "1rem" } });
    const caixa = AL.h("div", { class: "cartao", style: { "max-width": "440px", width: "100%", "max-height": "90vh", overflow: "auto", margin: "0" } }, AL.h("h2", {}, titulo), conteudo);
    fundo.append(caixa); document.body.append(fundo);
    return fundo;
  },
  _avisoPermissao(tipo) {
    const M = AL.MIDIA[tipo];
    return new Promise((ok) => {
      const j = AL._janela(M.icone + " Vamos ligar " + (tipo === "camera" ? "a câmera" : "o microfone"),
        AL.h("p", {}, "O celular vai perguntar se o AudioLab pode usar " + (tipo === "camera" ? "a câmera" : "o microfone") + "."),
        AL.h("p", {}, AL.h("b", {}, "Toque em “Permitir”"), " (ou “Ao usar o app”)."),
        AL.h("p", { class: "mudo" }, M.privacidade),
        AL.h("button", { class: "primario bloco", onclick: () => { j.remove(); ok(); } }, "Entendi, pedir permissão"));
    });
  },
  ajudaMicrofone() { AL.ajudaPermissao("microfone"); },
  ajudaPermissao(tipo, diag) {
    const M = AL.MIDIA[tipo];
    // 20/11/2026: mostra o motivo técnico e casos especiais (navegador de dentro do WhatsApp/Instagram; endereço seguro da aula)
    const uaw = navigator.userAgent, interno = /; wv\)|WhatsApp|Instagram|FBAN|FBAV|Line\//i.test(uaw), enderecoAula = /^\d+\.\d+\.\d+\.\d+$/.test(location.hostname);
    if (document.querySelector("[data-ajuda-perm]")) return;
    const ua = navigator.userAgent, iphone = /iPhone|iPad|iPod/i.test(ua), instalado = window.matchMedia && matchMedia("(display-mode: standalone)").matches;
    const passos = iphone
      ? ["Abra os Ajustes do iPhone.", "Toque em Safari (ou no app que você usa) › " + M.Nome + ".", "Escolha “Permitir”.", "Volte aqui e toque em “Tentar de novo”."]
      : instalado
        ? ["Abra as Configurações do celular.", "Toque em Apps (ou Aplicativos) › Chrome.", "Toque em Permissões › " + M.Nome + " › “Permitir”.", "Volte aqui e toque em “Tentar de novo”."]
        : ["Toque no cadeado 🔒 (ou no ícone ⓘ / ⚙) ao lado do endereço, lá em cima.", "Toque em Permissões (ou Configurações do site) › " + M.Nome + ".", "Escolha “Permitir”.", "Toque em “Tentar de novo”."];
    const j = AL._janela("🚫 " + M.Nome + " sem permissão",
      AL.h("p", {}, "Para o AudioLab " + M.uso + ", libere " + (tipo === "camera" ? "a câmera" : "o microfone") + " assim:"),
      AL.h("ol", {}, passos.map((p) => AL.h("li", { style: { margin: ".35rem 0" } }, p))),
      AL.h("p", { class: "mudo" }, iphone ? "" : "Se não achar: Configurações do celular › Apps › Chrome › Permissões › " + M.Nome + " › Permitir. Se o Chrome também estiver sem permissão no celular, libere lá primeiro."),
      interno ? AL.h("p", { class: "aviso" }, "⚠️ Esta página abriu dentro de outro aplicativo (WhatsApp, Instagram…), que não deixa usar " + M.nome + ". Toque nos ⋮ e escolha “Abrir no Chrome”.") : null,
      enderecoAula ? AL.h("p", { class: "aviso" }, "Se o celular nem perguntou: o endereço da aula usa um certificado próprio e alguns celulares recusam " + M.nome + " nele. Use o app do Treino em casa (o link que o professor mandou), que funciona em qualquer celular.") : null,
      AL.h("div", { class: "linha", style: { gap: ".5rem", "flex-wrap": "wrap" } },
        AL.h("button", { class: "primario", onclick: () => location.reload() }, "🔄 Tentar de novo"),
        AL.h("button", { onclick: () => j.remove() }, "Fechar")),
      AL.h("details", { style: { "margin-top": ".6rem" } }, AL.h("summary", { class: "mudo" }, "Detalhe para o professor"),
        AL.h("small", { class: "mudo", style: { "word-break": "break-all" } }, "Endereço: " + location.origin + " · permissão: " + ((diag && diag.estado) || "?") + " · motivo: " + ((diag && diag.erro) || "?") + " · navegador: " + uaw.slice(0, 160))));
    j.setAttribute("data-ajuda-perm", "1");
  },  cabecalho(el, info, subtitulo, direita) {
    AL.limpar(el, AL.h("div", { class: "logo", "aria-hidden": "true" }, "AL"),
      AL.h("div", { class: "marca" }, AL.h("b", {}, info.nome_empresa || "RMD AudioLab"), AL.h("small", {}, "RMD AudioLab · " + subtitulo)),
      AL.h("div", { class: "direita" }, direita || null));
  },
  tempo(s) { s = Math.max(0, Math.round(s || 0)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); },
  // descrição dos controles da mesa (nome, rótulo, unidade)
  CANAIS: [
    ["voz", "VOZ (microfone)", [["ganho", "GANHO", "dB"], ["grave", "GRAVE · 100 Hz", "dB"], ["mgrave", "MÉDIO-GRAVE · 300 Hz", "dB"], ["medio", "MÉDIO · 1 kHz", "dB"],
      ["magudo", "MÉDIO-AGUDO · 2,5 kHz", "dB"], ["agudo", "AGUDO · 8 kHz", "dB"], ["atraso", "ATRASO DO CANAL", "ms"], ["pan", "PANORAMA", ""], ["fader", "FADER", "dB"]],
      [["hpf", "FILTRO DE GRAVES"], ["comp", "COMPRESSOR"], ["fx", "EFEITO (eco)"]]],
    ["mus", "MÚSICA (playback)", [["ganho", "GANHO", "dB"], ["grave", "GRAVE · 100 Hz", "dB"], ["mgrave", "MÉDIO-GRAVE · 300 Hz", "dB"], ["medio", "MÉDIO · 1 kHz", "dB"],
      ["magudo", "MÉDIO-AGUDO · 2,5 kHz", "dB"], ["agudo", "AGUDO · 8 kHz", "dB"], ["pan", "PANORAMA", ""], ["fader", "FADER", "dB"]],
      [["hpf", "FILTRO DE GRAVES"]]],
  ],
  /* Desenha a mesa. aoMudar(nome, valor) é chamado quando o aluno mexe (só se editavel). Devolve {atualizar(controles), editavel(bool), vu(niveis)} */
  mesa(el, limites, aoMudar) {
    const campos = {}, rotulos = {}, botoes = {}, vus = {}, mexido = {};
    let pode = false;
    // no celular o fader não recebe "foco" ao arrastar: guarda a hora do último toque para a atualização do servidor não puxar o fader de volta
    const tocar = (nome) => { mexido[nome] = Date.now(); };
    const fmt = (v, u) => (u === "dB" && v > 0 ? "+" : "") + v + (u ? " " + u : "");
    const canais = AL.CANAIS.map(([pre, titulo, faders, chaves]) => {
      const vu = AL.h("i"); vus[pre] = vu;
      return AL.h("div", { class: "canal" }, AL.h("h3", {}, titulo), AL.h("div", { class: "vu", "aria-hidden": "true" }, vu),
        faders.map(([k, rot, u]) => {
          const nome = pre + "_" + k, [a, b] = limites[nome];
          const valor = AL.h("b", {}, "");
          const inp = AL.h("input", { type: "range", min: a, max: b, step: nome.endsWith("atraso") ? 5 : 1, "aria-label": titulo + " " + rot,
            onpointerdown: () => tocar(nome), ontouchstart: () => tocar(nome),
            oninput: () => { tocar(nome); valor.textContent = fmt(Number(inp.value), u); if (pode) aoMudar(nome, Number(inp.value)); } });
          campos[nome] = inp; rotulos[nome] = [valor, u];
          return AL.h("div", { class: "ctl" }, AL.h("div", { class: "rot" }, AL.h("span", {}, rot), valor), inp);
        }),
        AL.h("div", { class: "botoes-canal" }, chaves.map(([k, rot]) => {
          const nome = pre + "_" + k;
          const bt = AL.h("button", { type: "button", "aria-pressed": "false", onclick: () => { if (!pode) return; const v = bt.classList.contains("ligado") ? 0 : 1; marcar(bt, v); aoMudar(nome, v); } }, rot);
          botoes[nome] = bt; return bt;
        })));
    });
    const mv = AL.h("i"); vus.master = mv;
    const mval = AL.h("b", {}, "");
    const [ma, mb] = limites.master;
    const minp = AL.h("input", { type: "range", min: ma, max: mb, step: 1, "aria-label": "Master", onpointerdown: () => tocar("master"), ontouchstart: () => tocar("master"),
      oninput: () => { tocar("master"); mval.textContent = fmt(Number(minp.value), "dB"); if (pode) aoMudar("master", Number(minp.value)); } });
    campos.master = minp; rotulos.master = [mval, "dB"];
    const master = AL.h("div", { class: "canal" }, AL.h("h3", {}, "MASTER L/R"), AL.h("div", { class: "vu" }, mv),
      AL.h("div", { class: "ctl" }, AL.h("div", { class: "rot" }, AL.h("span", {}, "MASTER"), mval), minp),
      AL.h("p", { class: "mudo", style: { "font-size": ".8rem" } }, "Saída geral para as caixas."));
    function marcar(bt, v) { bt.classList.toggle("ligado", !!v); bt.setAttribute("aria-pressed", v ? "true" : "false"); }
    AL.limpar(el, AL.h("div", { class: "mesa" }, canais, master));
    return {
      atualizar(c) {
        for (const [n, inp] of Object.entries(campos)) {
          if (c[n] === undefined || (pode && (document.activeElement === inp || Date.now() - (mexido[n] || 0) < 1500))) continue;
          inp.value = c[n]; const [lab, u] = rotulos[n]; lab.textContent = fmt(Number(c[n]), u);
        }
        for (const [n, bt] of Object.entries(botoes)) if (c[n] !== undefined) marcar(bt, c[n]);
      },
      editavel(sim) { pode = !!sim; Object.values(campos).forEach((i) => (i.disabled = !sim)); Object.values(botoes).forEach((b) => (b.disabled = !sim)); },
      vu(niveis) { for (const [k, i] of Object.entries(vus)) i.style.width = Math.round(Math.min(1, Math.max(0, niveis[k] || 0)) * 100) + "%"; },
    };
  },
};

// 21/11/2026 (Luciana: metrônomo sem som no celular): no iPhone, com a chavinha do silencioso ligada, o som dos treinos
// (Web Audio) fica mudo mesmo com o volume alto. No primeiro toque na tela, pedimos ao celular para tratar o site como
// "tocador de mídia" (audioSession) e, no iPhone/iPad, tocamos um áudio silencioso em repetição, que faz o mesmo nos aparelhos antigos.
(function () {
  let feito = false;
  function silencio() {
    const n = 8000, b = new Uint8Array(44 + n), v = new DataView(b.buffer);
    const txt = (o, s) => { for (let i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i); };
    txt(0, "RIFF"); v.setUint32(4, 36 + n, true); txt(8, "WAVEfmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); txt(36, "data"); v.setUint32(40, n, true);
    b.fill(128, 44);
    return URL.createObjectURL(new Blob([b], { type: "audio/wav" }));
  }
  function liberar() {
    if (feito) return; feito = true;
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) { /* ok */ }
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
    if (!ios) return;
    try { const a = new Audio(silencio()); a.loop = true; a.setAttribute("playsinline", ""); a.play().catch(() => {}); AL._audioSilencio = a; } catch (e) { /* ok */ }
  }
  ["touchend", "click", "keydown"].forEach((ev) => document.addEventListener(ev, liberar, { capture: true, passive: true }));
})();
