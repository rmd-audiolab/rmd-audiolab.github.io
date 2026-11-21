/* RMD AudioLab — treino em casa (16/11/2026, pedido do Rinaldo).
   O aluno entra com o código que o professor deu, treina no celular (voz, segunda voz, ouvido, regência, metrônomo)
   e a NOTA de cada treino vai para o professor pela nuvem. Sem internet, a nota fica guardada no celular e vai depois.
   O som do microfone e a imagem da câmera nunca saem do celular. */
"use strict";
(function () {
  const NUVEM = "https://cxzzutbijljjteapowuv.supabase.co/functions/v1/audiolab";
  const h = AL.h, app = document.getElementById("app"), cabeca = document.getElementById("cabeca");
  const ler = (k, p) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : p; } catch (e) { return p; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } };
  let conta = ler("al_casa_conta", null); // { codigo, nome }
  let pedidoInstalar = null;
  const filaEl = h("p", { class: "aviso", style: { margin: ".3rem 0" } });
  const instalarBtn = h("button", { class: "primario oculto", onclick: instalar }, "📲 Instalar o ícone no celular");

  AL.tema("escuro");
  const cab = (sub, direita) => AL.cabecalho(cabeca, { nome_empresa: "RMD AudioLab" }, sub, direita);

  async function nuvem(corpo) {
    let r;
    try { r = await fetch(NUVEM, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo), cache: "no-store" }); }
    catch (e) { const er = new Error("Sem internet agora."); er.rede = true; throw er; }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { const er = new Error(d.erro || "Erro " + r.status); er.status = r.status; throw er; }
    return d;
  }

  // ---------------------------------------------------------------- recuperação e níveis (16/11/2026)
  // O professor marca as matérias com nota baixa; aqui o aluno vê o que precisa treinar para recuperar.
  // Os níveis (Básico → Intermediário → Avançado) abrem com 3 treinos de 80% ou mais no nível de agora.
  const FAM = [["Afinação", "afinacao"], ["Segunda voz", "segunda"], ["Aquecimento", "aquecimento"], ["Vogais", "vogais"], ["Respiração", "respiracao"]];
  const familia = (t) => (["ouvido", "regencia", "bateria", "musico"].includes(t.area) ? t.area : (FAM.find(([pre]) => String(t.treino).startsWith(pre)) || [null, ""])[1]);
  const nivelDoTreino = (t) => (/· Avançado/.test(t.treino) ? 2 : /· Intermediário/.test(t.treino) ? 1 : 0);
  const diaLocal = (iso) => { const d = new Date(iso); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const ONDE = { afinacao: ["Laboratório da voz", "🎯 Afinação"], segunda: ["Laboratório da voz", "🎶 Segunda voz"], aquecimento: ["Laboratório da voz", "🔥 Aquecimento"],
    vogais: ["Laboratório da voz", "🗣 Vogais e projeção"], respiracao: ["Laboratório da voz", "💨 Respiração (sssss)"], ouvido: ["Treino de ouvido"], regencia: ["Regência com câmera"], bateria: ["🥁 Bateria", "Exercícios com nota"], musico: ["🎸 Músicos", "Percepção"] };
  const recupEl = h("div"), avisoCert = h("div"), corpoBoletim = h("div"), seguidosEl = h("div");
  // dias seguidos treinando (conta até hoje; se ainda não treinou hoje, a sequência de ontem continua valendo)
  function desenharSeguidos() {
    const dias = new Set(resumo.dias || []);
    const hoje = new Date(), dia = (d) => diaLocal(d.toISOString());
    const treinouHoje = dias.has(dia(hoje));
    const d = new Date(hoje); if (!treinouHoje) d.setDate(d.getDate() - 1);
    let n = 0; while (dias.has(dia(d)) && n < 400) { n++; d.setDate(d.getDate() - 1); }
    const txt = n === 0 ? "Treine hoje para começar a sua sequência de dias! 💪"
      : treinouHoje ? (n === 1 ? "🔥 Você treinou hoje. Volte amanhã para fazer 2 dias seguidos!" : "🔥 " + n + " dias seguidos treinando! Continue amanhã.")
        : "🔥 " + n + (n === 1 ? " dia" : " dias seguidos") + " — treine hoje para não perder a sequência!";
    AL.limpar(seguidosEl, h("p", { style: { margin: ".4rem 0 0", "font-weight": "600" } }, txt));
  }
  let resumo = ler("al_casa_resumo", { pendencias: [], itens: [], documentos: [], info: {} });
  function aplicarResumo() {
    const cont = {};
    (resumo.itens || []).forEach((t) => { const f = familia(t); if (!TreinosAL.COM_NIVEL[f]) return; (cont[f] = cont[f] || [0, 0, 0])[nivelDoTreino(t)]++; });
    const lib = {}, P = TreinosAL.PRECISA_NIVEL;
    Object.keys(TreinosAL.COM_NIVEL).forEach((f) => { const c = cont[f] || [0, 0, 0]; let max = 0; if (c[0] >= P) max = 1; if (max === 1 && c[1] >= P) max = 2; lib[f] = { max, faltam: max < 2 ? Math.max(0, P - c[max]) : 0 }; });
    TreinosAL.definirLiberados(lib);
    desenharSeguidos();
    desenharBoletim();
    const pend = resumo.pendencias || [];
    if (!pend.length) { AL.limpar(recupEl); return; }
    AL.limpar(recupEl, h("div", { class: "cartao", style: { "border-left": "4px solid #f2c94c" } },
      h("h2", {}, "📌 Sua recuperação"),
      h("p", { class: "mudo" }, "Estas matérias ficaram abaixo de 50% na aula. Treine o assunto em dias diferentes, tirando 80% ou mais. Quando completar, o professor aprova e o certificado pode sair."),
      pend.map((p) => {
        const dias = new Set((resumo.itens || []).filter((t) => (p.familias || []).includes(familia(t)) && diaLocal(t.criado) >= (p.desde || "")).map((t) => diaLocal(t.criado)));
        const feitos = Math.min(p.precisa || 3, dias.size), pronta = p.pronta || feitos >= (p.precisa || 3);
        const ir = ONDE[(p.familias || [])[0]];
        return h("div", { style: { padding: ".5rem 0", "border-top": "1px solid var(--borda)" } },
          h("b", {}, p.curso + " › " + p.materia),
          h("div", {}, "Treino: " + p.treino + " · " + "✅".repeat(feitos) + "⬜".repeat(Math.max(0, (p.precisa || 3) - feitos)) + " " + feitos + " de " + (p.precisa || 3) + " dias"),
          pronta ? h("p", { class: "ok", style: { margin: ".2rem 0" } }, "🎉 Pronto! Agora é só o professor aprovar.")
            : ir ? h("button", { style: { "margin-top": ".3rem" }, onclick: () => abrirTreino(ir) }, "▶ Treinar isto agora") : null);
      })));
  }
  let abrirTreino = () => {}, refazerTreino = () => {};
  // tipo de acesso (20/11/2026): o professor marca cantor, regente, operador, baterista e/ou músico; o app mostra só esses treinos.
  // Sem nenhum tipo marcado (acessos antigos): mostra tudo.
  const ORDEM_FERR = ["labvoz", "ouvido", "camera", "metronomo", "bateria", "musicos"];
  const POR_TIPO = { voz: ["labvoz", "ouvido"], regencia: ["camera", "metronomo", "ouvido"], som: ["ouvido"], bateria: ["bateria", "metronomo"], musico: ["musicos", "ouvido", "metronomo"] };
  function ferramentasDoAluno() {
    const ts = (resumo.turmas && resumo.turmas.length ? resumo.turmas : (conta && conta.turmas)) || [];
    if (!ts.length) return ORDEM_FERR;
    const s = new Set(); ts.forEach((t) => (POR_TIPO[t] || []).forEach((x) => s.add(x)));
    return s.size ? ORDEM_FERR.filter((x) => s.has(x)) : ORDEM_FERR;
  }
  async function atualizarResumo() {
    if (!conta) return;
    try { const d = await nuvem({ acao: "aluno_resumo", codigo: conta.codigo }); const tiposAntes = (resumo.turmas || []).join(); resumo = { pendencias: d.pendencias || [], itens: d.itens || [], documentos: d.documentos || [], info: d.info || {}, dias: d.dias || [], turmas: d.turmas || [] }; if (tiposAntes !== resumo.turmas.join()) refazerTreino(); gravar("al_casa_resumo", resumo); } catch (e) { if (e.status === 403) { sair("O seu código mudou ou foi desativado. Peça o código novo ao professor."); return; } /* sem internet: usa o guardado */ }
    aplicarResumo();
  }

  // ---------------------------------------------------------------- exercício mandado pelo professor (aula com turmas)
  // O app pergunta a cada 5 segundos (com o app aberto) se o professor mandou exercício para a turma do aluno.
  const tarefaEl = h("div");
  let tarefas = [], tarefaAtiva = null;
  const feitas = () => ler("al_casa_tarefas_feitas", []);
  function desenharTarefas() {
    const pend = tarefas.filter((t) => !feitas().includes(t.id) && TreinosAL.TAREFAS[t.tipo]);
    AL.limpar(tarefaEl, pend.map((t) => h("div", { class: "cartao", style: { "border-left": "4px solid var(--destaque)" } },
      h("h2", {}, "📢 Exercício do professor"),
      h("p", {}, h("b", {}, t.titulo || TreinosAL.TAREFAS[t.tipo].nome), h("small", { class: "mudo", style: { display: "block" } }, "Turma: " + (TreinosAL.TURMAS[t.turma] || t.turma))),
      h("button", { class: "primario", onclick: () => comecarTarefa(t) }, tarefaAtiva && tarefaAtiva.id === t.id ? "↻ Abrir de novo" : "▶ Começar agora"),
      tarefaAtiva && tarefaAtiva.id === t.id ? h("p", { class: "mudo", style: { margin: ".3rem 0 0" } }, "Faça o treino abaixo: a nota vai direto para o professor.") : null)));
  }
  async function buscarTarefas() {
    if (!conta || document.hidden) return;
    try {
      const d = await nuvem({ acao: "aluno_tarefa", codigo: conta.codigo });
      const antes = tarefas.map((t) => t.id).join();
      tarefas = d.tarefas || [];
      if (tarefaAtiva && !tarefas.some((t) => t.id === tarefaAtiva.id)) tarefaAtiva = null; // o professor encerrou
      if (tarefas.map((t) => t.id).join() !== antes) { desenharTarefas(); if (tarefas.some((t) => !feitas().includes(t.id))) { try { navigator.vibrate && navigator.vibrate(200); } catch (e) { /* ok */ } } }
    } catch (e) { if (e.status === 403 && conta) sair("O seu código mudou ou foi desativado. Peça o código novo ao professor."); /* sem internet: tenta de novo */ }
  }
  function comecarTarefa(t) {
    const c = TreinosAL.TAREFAS[t.tipo]; if (!c) return;
    tarefaAtiva = { id: t.id, familia: c.familia };
    if (!c.semNivel) TreinosAL.forcarNivel(c.familia, Number(t.nivel) || 0);
    desenharTarefas();
    irPara("treino");
    const corpo = document.querySelector("#app");
    const clicar = (txt) => { const b = [...corpo.querySelectorAll("button")].find((x) => x.textContent === txt); if (b) b.click(); return b; };
    clicar(c.ferramenta);
    setTimeout(() => {
      if (c.aba) clicar(c.aba);
      setTimeout(() => {
        if (c.regencia && t.opcoes) {
          const comp = corpo.querySelector('select[aria-label="Compasso"]'), bpm = corpo.querySelector('input[aria-label="Andamento (BPM)"]');
          if (comp && t.opcoes.compasso) comp.value = String(t.opcoes.compasso);
          if (bpm && t.opcoes.bpm) bpm.value = String(t.opcoes.bpm);
        }
        const alvo = c.botao && [...corpo.querySelectorAll("button")].find((x) => x.textContent === c.botao);
        if (alvo) { alvo.classList.add("primario"); alvo.style.outline = "3px solid #f2c94c"; alvo.style.outlineOffset = "3px"; alvo.scrollIntoView({ behavior: "smooth", block: "center" }); }
        AL.toast(alvo ? "Toque no botão destacado para começar." : "Faça o exercício abaixo.");
      }, 80);
    }, 80);
  }

  // ---------------------------------------------------------------- boletim e certificado (16/11/2026)
  // O professor lança as notas na aula; o boletim aparece aqui sozinho. Quando o certificado é liberado, ele chega aqui também.
  let irPara = () => {};
  function mostrarDoc(html, largura) {
    // o documento é desenhado no tamanho da folha (A4); aqui ele é diminuído para caber na tela do celular
    largura = largura || 1123;
    const quadro = h("iframe", { title: "Documento", style: { width: largura + "px", height: "900px", border: "0", background: "#fff", "transform-origin": "0 0" } });
    const caixa = h("div", { style: { flex: "1", overflow: "auto", background: "#e9eef1" } }, h("div", { style: { overflow: "hidden" } }, quadro));
    const ajustar = () => {
      try {
        const alto = Math.max(600, quadro.contentDocument.documentElement.scrollHeight), esc = Math.min(1, (caixa.clientWidth || window.innerWidth) / largura);
        quadro.style.height = alto + "px"; quadro.style.transform = "scale(" + esc + ")";
        quadro.parentNode.style.width = Math.round(largura * esc) + "px"; quadro.parentNode.style.height = Math.round(alto * esc) + "px";
      } catch (e) { /* ok */ }
    };
    quadro.onload = () => { ajustar(); setTimeout(ajustar, 400); };
    quadro.srcdoc = html;
    const capa = h("div", { style: { position: "fixed", inset: "0", "z-index": "100", background: "#070b0e", display: "flex", "flex-direction": "column" } },
      h("div", { class: "linha", style: { gap: ".5rem", padding: ".5rem", "flex-wrap": "wrap" } },
        h("button", { onclick: () => capa.remove() }, "✕ Fechar"),
        h("button", { class: "primario", onclick: () => { try { quadro.contentWindow.focus(); quadro.contentWindow.print(); } catch (e) { DocsAL.abrir(html); } } }, "📥 Salvar em PDF / imprimir")),
      h("p", { class: "mudo", style: { margin: "0 .6rem .4rem", "font-size": ".85rem" } }, "Para guardar no celular: toque em “Salvar em PDF / imprimir” e escolha “Salvar como PDF”."),
      caixa);
    document.body.append(capa);
    window.addEventListener("resize", ajustar);
  }
  function desenharBoletim() {
    const docs = resumo.documentos || [], info = { nome_curso: (resumo.info || {}).nome_curso, nome_empresa: (resumo.info || {}).nome_empresa };
    const vistos = ler("al_casa_cert_vistos", []), novos = docs.filter((d) => d.certificado && !vistos.includes(d.tipo));
    AL.limpar(avisoCert, novos.length ? h("div", { class: "cartao", style: { "border-left": "4px solid var(--ok, #7fd18b)" } },
      h("h2", {}, "🎉 Seu certificado chegou!"), h("p", {}, novos.map((d) => d.curso).join(" e ") + ": parabéns!"),
      h("button", { class: "primario", onclick: () => { gravar("al_casa_cert_vistos", vistos.concat(novos.map((d) => d.tipo))); irPara("boletim"); } }, "🎓 Ver o certificado")) : null);
    AL.limpar(corpoBoletim, !docs.length ? h("div", { class: "cartao" }, h("h2", {}, "🎓 Boletim e certificado"),
      h("p", { class: "mudo" }, "O seu boletim aparece aqui assim que o professor lançar as notas da aula. Quando o certificado for liberado, ele chega aqui também, pronto para baixar."))
      : docs.map((d) => h("div", { class: "cartao" },
        h("h2", {}, d.icone + " " + d.curso),
        h("p", {}, "Média " + d.media + "% · aprovado em " + d.aprovadas + " de " + d.total + (d.tipo === "som" ? " exercícios" : " matérias")),
        h("div", { class: "rolar" }, h("table", {}, h("tbody", {}, d.linhas.map((l) => { const [txt, cls] = DocsAL.situacao(l.nota);
          return h("tr", {}, h("td", {}, l.nome, l.recuperada ? h("small", { class: "mudo", style: { display: "block" } }, "♻️ recuperada com treinos") : null),
            h("td", {}, h("b", {}, l.nota == null ? "—" : l.nota + "%")), h("td", {}, h("span", { class: cls === "ok" ? "ok" : cls === "med" ? "aviso" : cls === "ref" ? "erro" : "mudo" }, txt))); })))),
        d.linhas.some((l) => l.nota != null && l.nota < DocsAL.NOTA_CERT) ? h("p", { class: "aviso" }, "↺ O que está como “Refazer” você recupera treinando: veja “📌 Sua recuperação” no alto.") : null,
        h("div", { class: "linha", style: { gap: ".5rem", "flex-wrap": "wrap", "margin-top": ".6rem" } },
          h("button", { onclick: () => mostrarDoc(DocsAL.boletimHTML(d, info), 820) }, "📄 Ver o boletim"),
          d.certificado ? h("button", { class: "primario", onclick: () => { gravar("al_casa_cert_vistos", [...new Set(ler("al_casa_cert_vistos", []).concat(d.tipo))]); AL.limpar(avisoCert); mostrarDoc(DocsAL.certificadoHTML(d, info), 1123); } }, "🎓 Baixar o certificado")
            : h("span", { class: "mudo" }, "🎓 O certificado sai quando todas as " + (d.tipo === "som" ? "atividades" : "matérias") + " tiverem nota e nenhuma ficar abaixo de " + DocsAL.NOTA_CERT + "%.")))));
  }

  // ---------------------------------------------------------------- notas: envia já ou guarda para depois
  const agoraTxt = () => new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  function mostrarFila() {
    const n = ler("al_casa_fila", []).length;
    filaEl.textContent = n ? "📥 " + n + " nota(s) guardada(s) no celular: vão para o professor quando tiver internet." : "";
    filaEl.classList.toggle("oculto", !n);
  }
  async function enviarFila() {
    const fila = ler("al_casa_fila", []);
    if (!fila.length || !conta) return mostrarFila();
    const resto = [];
    for (const t of fila) {
      try { await nuvem({ acao: "aluno_treino", codigo: conta.codigo, area: t.area, treino: t.treino, nota: t.nota, detalhe: t.detalhe, tarefa: t.tarefa || "" }); }
      catch (e) { if (e.rede || e.status >= 500 || e.status === 429) resto.push(t); }
    }
    gravar("al_casa_fila", resto); mostrarFila();
  }
  async function enviarTreino(t) {
    // se é o exercício que o professor mandou, a nota vai marcada para aparecer no quadro dele
    const daTarefa = tarefaAtiva && familia(t) === tarefaAtiva.familia ? tarefaAtiva.id : "";
    if (daTarefa) t = { ...t, tarefa: daTarefa };
    try {
      await nuvem({ acao: "aluno_treino", codigo: conta.codigo, ...t }); setTimeout(atualizarResumo, 300);
      if (daTarefa) { gravar("al_casa_tarefas_feitas", feitas().concat(daTarefa).slice(-100)); tarefaAtiva = null; desenharTarefas(); AL.toast("✔ Exercício entregue ao professor!"); }
      return { ok: true };
    }
    catch (e) {
      if (e.rede || e.status >= 500) {
        const f = ler("al_casa_fila", []);
        f.push({ ...t, detalhe: (t.detalhe ? t.detalhe + " · " : "") + "feito em " + agoraTxt() });
        gravar("al_casa_fila", f.slice(-200)); mostrarFila();
        return { fila: true };
      }
      if (e.status === 403) setTimeout(() => sair("O seu código mudou ou foi desativado. Peça o código novo ao professor."), 1500);
      throw e;
    }
  }
  window.addEventListener("online", enviarFila);

  // ---------------------------------------------------------------- instalar o ícone
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); pedidoInstalar = e; instalarBtn.classList.remove("oculto"); });
  window.addEventListener("appinstalled", () => { instalarBtn.classList.add("oculto"); AL.toast("Ícone instalado! Abra pelo ícone RMD AudioLab."); });
  const instalado = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  async function instalar() {
    if (pedidoInstalar) { pedidoInstalar.prompt(); await pedidoInstalar.userChoice.catch(() => null); pedidoInstalar = null; instalarBtn.classList.add("oculto"); return; }
    alert(/iphone|ipad/i.test(navigator.userAgent)
      ? "No iPhone: toque no botão Compartilhar (quadrado com seta) e depois em “Adicionar à Tela de Início”."
      : "Abra o menu ⋮ do navegador e toque em “Instalar app” ou “Adicionar à tela inicial”.");
  }

  // ---------------------------------------------------------------- entrar
  function telaEntrar(msg, codigoInicial) {
    cab("Treino em casa");
    const cod = h("input", { class: "codigo", maxlength: 12, value: codigoInicial || "", placeholder: "XXXX-XXXX", autocomplete: "off", "aria-label": "Código do aluno" });
    const botao = h("button", { class: "primario bloco", style: { "margin-top": "1rem" } }, "Entrar");
    AL.limpar(app, h("div", { class: "cartao entrar" },
      h("h2", {}, "🎧 Treino em casa"),
      h("p", {}, "Digite o código que o professor te passou. Ele vem na mensagem junto com o link."),
      msg ? h("p", { class: "erro" }, msg) : null,
      h("form", { onsubmit: async (e) => {
        e.preventDefault(); botao.disabled = true;
        try { const r = await nuvem({ acao: "aluno_entrar", codigo: cod.value }); conta = { codigo: cod.value.toUpperCase().trim(), nome: r.nome, turmas: r.turmas || [] }; gravar("al_casa_conta", conta); montar(); }
        catch (er) { AL.toast(er.rede ? "Sem internet agora. Para entrar a primeira vez precisa de internet." : er.message, true); botao.disabled = false; }
      } }, h("label", {}, "Código do aluno"), cod, botao)));
    if (!codigoInicial) cod.focus();
  }
  function sair(msg) {
    if (!msg && !confirm("Sair deste celular? As notas que ainda não foram enviadas serão perdidas.")) return;
    try { localStorage.removeItem("al_casa_conta"); localStorage.removeItem("al_casa_fila"); localStorage.removeItem("al_casa_resumo"); } catch (e) { /* ok */ }
    resumo = { pendencias: [], itens: [], documentos: [], info: {} };
    try { localStorage.removeItem("al_casa_cert_vistos"); } catch (e) { /* ok */ }
    conta = null; FerramentasAL.parar(); telaEntrar(msg);
  }

  // ---------------------------------------------------------------- tela principal
  function montar() {
    TreinosAL.comoCasa(enviarTreino);
    aplicarResumo();
    cab("Treino em casa", h("button", { onclick: () => sair() }, "Sair"));
    const corpoTreino = h("div"), corpoNotas = h("div");
    const abas = [["treino", "🎤 Treinar", corpoTreino], ["boletim", "🎓 Boletim", corpoBoletim], ["notas", "📋 Meus treinos", corpoNotas]];
    const barra = h("div", { class: "abas" }, abas.map(([id, t]) => h("button", { "data-aba": id, onclick: () => trocar(id) }, t)));
    function trocar(id) {
      barra.querySelectorAll("button").forEach((b) => b.classList.toggle("ligado", b.dataset.aba === id));
      abas.forEach(([x, , el]) => el.classList.toggle("oculto", x !== id));
      if (id === "notas") carregarNotas(); else if (id === "treino" && !corpoTreino.childElementCount) FerramentasAL.montar(corpoTreino, { semTelao: true, itens: ferramentasDoAluno() });
      if (id !== "treino") FerramentasAL.parar();
    }
    irPara = (id) => { trocar(id); barra.scrollIntoView({ behavior: "smooth" }); };
    // o professor mudou o tipo de acesso: monta de novo a lista de treinos
    refazerTreino = () => { if (!corpoTreino.childElementCount) return; FerramentasAL.parar(); AL.limpar(corpoTreino); if (!corpoTreino.classList.contains("oculto")) trocar("treino"); };
    abrirTreino = ([fer, aba]) => {
      trocar("treino");
      const b = [...corpoTreino.querySelectorAll("button")].find((x) => x.textContent === fer); if (b) b.click();
      if (aba) setTimeout(() => { const a = [...corpoTreino.querySelectorAll("button")].find((x) => x.textContent === aba); if (a) a.click(); }, 50);
      corpoTreino.scrollIntoView({ behavior: "smooth" });
    };
    async function carregarNotas() {
      AL.limpar(corpoNotas, h("p", { class: "mudo" }, "Carregando…"));
      try {
        const d = await nuvem({ acao: "aluno_meus", codigo: conta.codigo });
        AL.limpar(corpoNotas, h("div", { class: "cartao" }, h("h2", {}, "Minhas notas (as últimas 40)"),
          d.itens.length ? h("div", { class: "rolar" }, h("table", {}, h("thead", {}, h("tr", {}, ["Quando", "Treino", "Nota"].map((t) => h("th", {}, t)))),
            h("tbody", {}, d.itens.map((x) => h("tr", {}, h("td", {}, new Date(x.criado).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })),
              h("td", {}, x.treino, x.detalhe ? h("small", { class: "mudo", style: { display: "block" } }, x.detalhe) : null),
              h("td", {}, h("b", { class: x.nota >= 80 ? "ok" : x.nota >= 50 ? "aviso" : "erro" }, x.nota + "%")))))))
            : h("p", { class: "mudo" }, "Você ainda não tem notas. Faça um treino e toque em terminar: a nota aparece aqui e vai para o professor.")));
      } catch (e) { AL.limpar(corpoNotas, h("p", { class: e.rede ? "aviso" : "erro" }, e.rede ? "Sem internet agora: as notas aparecem quando voltar a internet." : e.message)); }
    }
    AL.limpar(app,
      h("div", { class: "cartao" }, h("h2", {}, "Olá, " + conta.nome.split(" ")[0] + "! 👋"),
        h("p", { class: "mudo" }, "Escolha um treino. No fim de cada um, a nota vai sozinha para o professor. Use fone de ouvido nos treinos de voz e de ouvido."),
        seguidosEl, instado(), filaEl),
      tarefaEl, avisoCert, recupEl, barra, corpoTreino, corpoBoletim, corpoNotas);
    trocar("treino"); mostrarFila(); enviarFila(); atualizarResumo();
    // durante a aula o boletim muda: confere a cada minuto enquanto o app está aberto
    setInterval(() => { if (!document.hidden && conta) atualizarResumo(); }, 60000);
    buscarTarefas(); setInterval(buscarTarefas, 5000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) buscarTarefas(); });
  }
  function instado() { return instalado() ? null : h("div", {}, instalarBtn, h("p", { class: "mudo", style: { margin: ".3rem 0 0" } }, "Com o ícone instalado, o treino abre direto, como um aplicativo.")); }

  // ---------------------------------------------------------------- começo
  if ("serviceWorker" in navigator && /\/$|index\.html$/.test(location.pathname)) navigator.serviceWorker.register("sw.js").catch(() => {});
  const q = new URLSearchParams(location.search), codigoLink = (q.get("c") || "").toUpperCase();
  if (codigoLink) history.replaceState(null, "", location.pathname); // o código não fica aparecendo na barra
  if (conta && (!codigoLink || codigoLink === conta.codigo)) { montar(); return; }
  if (codigoLink) {
    // veio pelo link do professor: entra sozinho
    cab("Treino em casa");
    AL.limpar(app, h("p", { class: "mudo" }, "Entrando…"));
    nuvem({ acao: "aluno_entrar", codigo: codigoLink })
      .then((r) => { conta = { codigo: codigoLink, nome: r.nome, turmas: r.turmas || [] }; gravar("al_casa_conta", conta); montar(); })
      .catch((e) => telaEntrar(e.rede ? "Sem internet agora. Conecte e tente de novo." : e.message, codigoLink));
    return;
  }
  telaEntrar();
})();
