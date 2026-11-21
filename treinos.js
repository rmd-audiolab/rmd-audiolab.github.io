/* RMD AudioLab — guardar o resultado dos treinos na pasta do aluno (16/11/2026, pedido do Rinaldo).
   Vale para o Laboratório da voz, a segunda voz, o treino de ouvido e a regência com câmera.
   - No celular do aluno: guarda sozinho no nome dele (o servidor pega o nome pelo crachá do aluno).
   - No computador do professor: aparece o campo "Aluno" e o botão "Guardar na pasta do aluno".
   O professor vê tudo em Resultados › Treinos de voz, ouvido e regência. */
"use strict";
const TreinosAL = (() => {
  const h = AL.h;
  let modo = null, token = null, ultimoNome = "", conhecidos = null, serie = 0, enviarCasa = null;
  const AREAS = { voz: "Laboratório da voz", ouvido: "Treino de ouvido", regencia: "Regência com câmera", bateria: "Bateria", musico: "Músicos (percepção)" };

  // ---------------- níveis (16/11/2026): Básico → Intermediário → Avançado
  // Na aula (professor e celular na sala) todos os níveis ficam abertos. Em casa, o próximo nível abre depois de
  // 3 treinos com 80% ou mais no nível de agora (o app de casa informa isso com definirLiberados).
  const NIVEIS = ["Básico", "Intermediário", "Avançado"];
  const COM_NIVEL = { afinacao: "Afinação", segunda: "Segunda voz", ouvido: "Treino de ouvido", regencia: "Regência com câmera", bateria: "Bateria", musico: "Músicos (percepção)" };
  const PRECISA_NIVEL = 3;
  let liberados = null; // null = tudo aberto; senão { familia: { max: 0..2, faltam: n } }
  const escolhido = {}, forcados = {};
  function definirLiberados(obj) { liberados = obj; Object.keys(escolhido).forEach((f) => { escolhido[f] = Math.min(escolhido[f], maxNivel(f)); }); }
  const maxNivel = (f) => Math.max(liberados ? ((liberados[f] || {}).max || 0) : 2, forcados[f] != null ? forcados[f] : -1);
  /** Exercício mandado pelo professor: abre o nível que ele escolheu, mesmo que ainda não tenha sido liberado. */
  function forcarNivel(f, n) { forcados[f] = n; escolhido[f] = n; }

  // ---------------- exercícios que o professor manda para as turmas (aula com turmas, 16/11/2026)
  // ferramenta/aba/botao: onde o app do aluno abre e qual botão ele toca para começar
  const TAREFAS = {
    "afinacao:eco1": { turmas: ["voz"], familia: "afinacao", nome: "Afinação · Nota e eco", ferramenta: "Laboratório da voz", aba: "🎯 Afinação", botao: "🎯 Nota e eco (5 notas soltas)" },
    "afinacao:escala": { turmas: ["voz"], familia: "afinacao", nome: "Afinação · Escala", ferramenta: "Laboratório da voz", aba: "🎯 Afinação", botao: "🎼 Escala Dó-Ré-Mi-Fá-Sol" },
    "afinacao:eco3": { turmas: ["voz"], familia: "afinacao", nome: "Afinação · Eco de 3 notas", ferramenta: "Laboratório da voz", aba: "🎯 Afinação", botao: "🔁 Eco de 3 notas" },
    "afinacao:saltos": { turmas: ["voz"], familia: "afinacao", nome: "Afinação · Saltos", ferramenta: "Laboratório da voz", aba: "🎯 Afinação", botao: "↕️ Saltos (intervalos)" },
    "segunda": { turmas: ["voz"], familia: "segunda", nome: "Segunda voz", ferramenta: "Laboratório da voz", aba: "🎶 Segunda voz", botao: "🎙 Cantar a 2ª voz com o microfone" },
    "vogais": { turmas: ["voz"], familia: "vogais", nome: "Vogais · nota longa", ferramenta: "Laboratório da voz", aba: "🗣 Vogais e projeção", botao: null, semNivel: true },
    "respiracao": { turmas: ["voz"], familia: "respiracao", nome: "Respiração · sssss", ferramenta: "Laboratório da voz", aba: "💨 Respiração (sssss)", botao: "🎙 Começar o Sssss", semNivel: true },
    "regencia": { turmas: ["regencia"], familia: "regencia", nome: "Regência com câmera", ferramenta: "Regência com câmera", botao: "📷 Ligar a câmera", regencia: true },
    "ouvido": { turmas: ["som", "voz", "regencia", "bateria", "musico"], familia: "ouvido", nome: "Treino de ouvido", ferramenta: "Treino de ouvido", botao: "▶ Começar o treino" },
    // 20/11/2026: bateristas (static/bateria.js)
    "bateria:tempo": { turmas: ["bateria"], familia: "bateria", nome: "Bateria · Tocar no tempo", ferramenta: "🥁 Bateria", aba: "Exercícios com nota", botao: "🎯 Tocar no tempo" },
    "bateria:rudimento": { turmas: ["bateria"], familia: "bateria", nome: "Bateria · Rudimentos", ferramenta: "🥁 Bateria", aba: "Exercícios com nota", botao: "🥢 Rudimentos" },
    // 20/11/2026: músicos (violão, teclado, contrabaixo) — static/musicos.js
    "musico:nota": { turmas: ["musico"], familia: "musico", nome: "Músicos · Que nota é essa?", ferramenta: "🎸 Músicos", aba: "Percepção", botao: "🎹 Que nota é essa?" },
    "musico:acorde": { turmas: ["musico"], familia: "musico", nome: "Músicos · Maior ou menor?", ferramenta: "🎸 Músicos", aba: "Percepção", botao: "🎶 Maior ou menor?" },
    "bateria:segurar": { turmas: ["bateria"], familia: "bateria", nome: "Bateria · Segure o tempo", ferramenta: "🥁 Bateria", aba: "Exercícios com nota", botao: "🔇 Segure o tempo" },
  };
  const TURMAS = { som: "🎚️ Operadores de som", voz: "🎤 Vozes (cantores)", regencia: "🎼 Regência", bateria: "🥁 Bateristas", musico: "🎸 Músicos" };
  // começa no Básico na aula; em casa começa no nível mais alto já liberado
  function nivel(f) { return Math.min(escolhido[f] != null ? escolhido[f] : liberados ? maxNivel(f) : 0, maxNivel(f)); }
  const rotulo = (f) => " · " + NIVEIS[nivel(f)];
  /** Caixa "Nível" para pôr em cima de um treino. aoMudar(novoIndice) é opcional. */
  function seletorNivel(f, aoMudar) {
    const max = maxNivel(f), info = h("small", { class: "mudo" });
    const sel = h("select", { "aria-label": "Nível do treino", style: { width: "auto" }, onchange: () => { escolhido[f] = Number(sel.value); mostrar(); if (aoMudar) aoMudar(Number(sel.value)); } },
      NIVEIS.map((n, i) => h("option", { value: i, disabled: i > max, selected: i === nivel(f) }, (i > max ? "🔒 " : "") + n)));
    function mostrar() {
      const l = liberados && liberados[f];
      info.textContent = !liberados ? "" : max >= 2 ? "Todos os níveis liberados 🎉"
        : "Para liberar o " + NIVEIS[max + 1] + ": mais " + (l ? l.faltam : PRECISA_NIVEL) + " treino(s) com 80% ou mais no " + NIVEIS[max] + ".";
    }
    mostrar();
    return h("div", { class: "linha", style: { gap: ".5rem", "align-items": "center", "flex-wrap": "wrap", margin: ".3rem 0" } }, h("b", {}, "Nível:"), sel, info);
  }

  function comoAluno(tok) { modo = "aluno"; token = tok; }
  function comoProfessor() { modo = "professor"; }
  /** Treino em casa (site no celular): quem envia é o app de casa (com fila quando está sem internet). */
  function comoCasa(fn) { modo = "casa"; enviarCasa = fn; }
  async function nomes() {
    if (conhecidos) return conhecidos;
    try { conhecidos = (await AL.api("/api/prof/treinos")).alunos_conhecidos || []; } catch (e) { conhecidos = []; }
    return conhecidos;
  }

  /** Caixa para pôr no fim do cartão de resultado de um treino. nota: 0 a 100. */
  function caixa(area, treino, nota, detalhe) {
    const n = Math.max(0, Math.min(100, Math.round(Number(nota) || 0)));
    const el = h("div", { class: "linha", style: { gap: ".4rem", "flex-wrap": "wrap", "align-items": "center", "margin-top": ".6rem" } });
    if (modo === "casa") {
      el.textContent = "⏳ Enviando a nota para o professor…";
      enviarCasa({ area, treino, nota: n, detalhe: detalhe || "" })
        .then((r) => { el.textContent = r && r.fila ? "📥 Nota guardada no celular (" + n + "%). Vai para o professor quando tiver internet." : "✔ Nota enviada para o professor (" + n + "%)."; el.className = r && r.fila ? "aviso" : "ok"; })
        .catch((e) => { el.textContent = "⚠️ Não enviou: " + e.message; el.className = "aviso"; });
      return el;
    }
    if (modo === "aluno") {
      el.textContent = "⏳ Guardando na sua pasta…";
      AL.api("/api/aluno/treino", { area, treino, nota: n, detalhe }, { headers: { "X-Aluno": token || "" } })
        .then(() => { el.textContent = "✔ Guardado na sua pasta (" + n + "%). O professor vê."; el.className = "ok"; })
        .catch((e) => { el.textContent = "⚠️ Não guardou: " + e.message; el.className = "aviso"; });
      return el;
    }
    const id = "al-nomes-" + (++serie);
    const lista = h("datalist", { id });
    const nome = h("input", { list: id, maxlength: 60, value: ultimoNome, placeholder: "Nome do aluno", "aria-label": "Nome do aluno", style: { width: "auto", "min-width": "14rem", flex: "1 1 14rem" } });
    const botao = h("button", { class: "primario", onclick: async () => {
      const quem = nome.value.split(/\s+/).filter(Boolean).join(" ");
      if (!quem) { AL.toast("Escreva o nome do aluno.", true); nome.focus(); return; }
      botao.disabled = true;
      try {
        await AL.api("/api/prof/treino", { aluno: quem, area, treino, nota: n, detalhe });
        ultimoNome = quem; if (conhecidos && !conhecidos.includes(quem)) conhecidos.push(quem);
        AL.limpar(el, h("span", { class: "ok" }, "✔ Guardado na pasta de " + quem + " (" + n + "%)."));
      } catch (e) {
        botao.disabled = false;
        AL.toast(e.status === 401 ? "Entre como professor (painel do professor) para guardar." : e.message, true);
      }
    } }, "💾 Guardar na pasta do aluno");
    AL.limpar(el, h("span", {}, "Quem fez:"), nome, lista, botao);
    nomes().then((ns) => AL.limpar(lista, ns.map((x) => h("option", { value: x }))));
    return el;
  }

  return { comoAluno, comoProfessor, comoCasa, caixa, NIVEIS, COM_NIVEL, PRECISA_NIVEL, definirLiberados, nivel, rotulo, seletorNivel, forcarNivel, TAREFAS, TURMAS, AREAS, modo: () => modo };
})();
