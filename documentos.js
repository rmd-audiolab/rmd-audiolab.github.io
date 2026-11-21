/* RMD AudioLab — boletim e certificado dos cursos básicos (Operação de Som, Louvor e Regência).
   Gera a página inteira como texto HTML; usado pelo painel do professor e pela página de modelos.
   Não mostra o nome da igreja: o cabeçalho é a marca do curso (logo + slogan). */
"use strict";
const DocsAL = (() => {
  const NOTA_MIN = 80, NOTA_CERT = 50;
  const SLOGAN = "Técnica e adoração em perfeita harmonia";
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const situacao = (n) => n == null ? ["Pendente", "pen"] : n >= NOTA_MIN ? ["Aprovado", "ok"] : n >= NOTA_CERT ? ["Na média — estudar mais", "med"] : ["Refazer", "ref"];
  const periodoDe = (datas) => { const k = (t) => t.split("/").reverse().join(""); const o = (datas || []).map((x) => String(x || "").slice(0, 10)).filter(Boolean).sort((a, b) => k(a).localeCompare(k(b))); return o.length ? (o[0] === o[o.length - 1] ? o[0] : o[0] + " a " + o[o.length - 1]) : "—"; };

  const ARTE_V = "#0b6b5a", ARTE_O = "#c9a227";
  const notaSVG = (x, y, s, cor, dupla) => {   // colcheia (ou duas ligadas)
    const r = 7 * s, h = 34 * s;
    let g = '<ellipse cx="' + x + '" cy="' + y + '" rx="' + r * 1.25 + '" ry="' + r + '" transform="rotate(-20 ' + x + " " + y + ')" fill="' + cor + '"/>' + '<rect x="' + (x + r * 1.05) + '" y="' + (y - h) + '" width="' + 2.4 * s + '" height="' + h + '" fill="' + cor + '"/>';
    if (dupla) { const x2 = x + 26 * s, y2 = y - 6 * s; g += '<ellipse cx="' + x2 + '" cy="' + y2 + '" rx="' + r * 1.25 + '" ry="' + r + '" transform="rotate(-20 ' + x2 + " " + y2 + ')" fill="' + cor + '"/><rect x="' + (x2 + r * 1.05) + '" y="' + (y2 - h) + '" width="' + 2.4 * s + '" height="' + h + '" fill="' + cor + '"/><path d="M' + (x + r * 1.05) + " " + (y - h) + " L" + (x2 + r * 1.05 + 2.4 * s) + " " + (y2 - h) + " L" + (x2 + r * 1.05 + 2.4 * s) + " " + (y2 - h + 7 * s) + " L" + (x + r * 1.05) + " " + (y - h + 7 * s) + 'Z" fill="' + cor + '"/>'; }
    else g += '<path d="M' + (x + r * 1.05 + 2.4 * s) + " " + (y - h) + " q" + 12 * s + " " + 8 * s + " " + 10 * s + " " + 24 * s + " q-" + 1 * s + " -" + 10 * s + " -" + 10 * s + " -" + 14 * s + 'z" fill="' + cor + '"/>';
    return g;
  };
  // pauta ondulada com notas, atravessando a folha
  function pautaOnda(larg) {
    let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + larg + ' 90" preserveAspectRatio="none" width="100%" height="90">';
    for (let i = 0; i < 5; i++) s += '<path d="M0 ' + (30 + i * 8) + " C" + larg * 0.25 + " " + (5 + i * 8) + ", " + larg * 0.5 + " " + (60 + i * 8) + ", " + larg * 0.75 + " " + (25 + i * 8) + " S" + larg + " " + (40 + i * 8) + ", " + larg + " " + (40 + i * 8) + '" fill="none" stroke="' + ARTE_O + '" stroke-width="1.2" opacity="0.55"/>';
    [[0.08, 44, 1], [0.17, 30, 0], [0.3, 34, 1], [0.66, 40, 0], [0.8, 30, 1], [0.92, 46, 0]].forEach(([f, y, d]) => (s += notaSVG(larg * f, y + 8, 0.75, ARTE_V, d)));
    return s + "</svg>";
  }
  const ARTE = {
    louvor: {
      // microfone de mão com notas saindo
      esq: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 240"><g transform="rotate(-18 80 120)">'
        + '<rect x="52" y="20" width="56" height="78" rx="28" fill="' + ARTE_V + '"/>'
        + Array.from({ length: 6 }, (_, i) => '<line x1="56" y1="' + (34 + i * 10) + '" x2="104" y2="' + (34 + i * 10) + '" stroke="#e8f3ef" stroke-width="2" opacity="0.55"/>').join("")
        + Array.from({ length: 4 }, (_, i) => '<line x1="' + (66 + i * 10) + '" y1="24" x2="' + (66 + i * 10) + '" y2="94" stroke="#e8f3ef" stroke-width="2" opacity="0.35"/>').join("")
        + '<rect x="48" y="96" width="64" height="12" rx="4" fill="' + ARTE_O + '"/><path d="M60 108 L100 108 L92 220 Q80 228 68 220 Z" fill="#1d2b28"/><rect x="74" y="140" width="12" height="18" rx="3" fill="' + ARTE_O + '"/></g>'
        + notaSVG(128, 48, 0.8, ARTE_O, false) + notaSVG(118, 96, 0.6, ARTE_O, true) + "</svg>",
      dir: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 240"><text x="20" y="170" font-size="150" font-family="Segoe UI Symbol, Noto Music, serif" fill="' + ARTE_V + '">𝄞</text>'
        + notaSVG(112, 70, 0.9, ARTE_O, true) + notaSVG(120, 200, 0.7, ARTE_O, false) + "</svg>",
      marca: "🎤", rotulo: "Ministério de Louvor",
    },
    regencia: {
      // batuta com o desenho do 4/4 tracejado
      esq: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 240">'
        + '<path d="M80 200 Q40 140 30 160 Q80 150 130 165 Q150 120 100 140 Q85 40 80 200" fill="none" stroke="' + ARTE_O + '" stroke-width="3" stroke-dasharray="6 6"/>'
        + [[80, 200, "1"], [30, 160, "2"], [130, 165, "3"], [100, 140, "4"]].map(([x, y, n]) => '<circle cx="' + x + '" cy="' + y + '" r="11" fill="#fffdf6" stroke="' + ARTE_V + '" stroke-width="2.5"/><text x="' + x + '" y="' + (y + 5) + '" font-size="14" font-weight="700" text-anchor="middle" font-family="Arial" fill="' + ARTE_V + '">' + n + "</text>").join("")
        + '<line x1="40" y1="30" x2="118" y2="104" stroke="#1d2b28" stroke-width="3.5" stroke-linecap="round"/><path d="M112 96 L132 118 Q138 126 130 130 L124 132 Q116 128 106 104 Z" fill="' + ARTE_V + '"/><circle cx="40" cy="30" r="3" fill="#fffdf6" stroke="#1d2b28"/></svg>',
      // metrônomo
      dir: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 240"><path d="M56 40 L104 40 L132 210 L28 210 Z" fill="' + ARTE_V + '"/><path d="M64 60 L96 60 L112 170 L48 170 Z" fill="#e8f3ef" opacity="0.9"/>'
        + Array.from({ length: 7 }, (_, i) => '<line x1="' + (66 - i * 1.5) + '" y1="' + (72 + i * 14) + '" x2="' + (74 - i * 1.5) + '" y2="' + (72 + i * 14) + '" stroke="' + ARTE_V + '" stroke-width="2"/>').join("")
        + '<line x1="80" y1="168" x2="112" y2="70" stroke="#1d2b28" stroke-width="3"/><rect x="100" y="96" width="14" height="12" rx="2" fill="' + ARTE_O + '" transform="rotate(18 107 102)"/><rect x="22" y="208" width="116" height="12" rx="4" fill="' + ARTE_O + '"/>'
        + notaSVG(130, 50, 0.6, ARTE_O, false) + "</svg>",
      marca: "🎼", rotulo: "Regência",
    },
    som: {
      // mesa de som com faders e botões
      esq: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 240"><path d="M10 120 L160 120 L150 210 L20 210 Z" fill="#1d2b28"/><path d="M10 120 L160 120 L160 128 L10 128 Z" fill="' + ARTE_O + '"/>'
        + Array.from({ length: 6 }, (_, i) => { const x = 30 + i * 22; return [0, 1, 2].map((k) => '<circle cx="' + x + '" cy="' + (140 + k * 13) + '" r="4.5" fill="' + (k === 0 ? ARTE_O : "#6fc2b0") + '"/>').join("") + '<line x1="' + x + '" y1="182" x2="' + x + '" y2="204" stroke="#557a72" stroke-width="3"/><rect x="' + (x - 6) + '" y="' + (184 + (i * 7) % 15) + '" width="12" height="6" rx="1.5" fill="#e8f3ef"/>'; }).join("")
        + '<rect x="40" y="60" width="90" height="50" rx="6" fill="' + ARTE_V + '"/>'
        + [10, 22, 34, 18, 28, 14, 30, 20].map((hh, i) => '<rect x="' + (50 + i * 9.5) + '" y="' + (102 - hh) + '" width="6" height="' + hh + '" fill="' + (hh > 28 ? ARTE_O : "#9fe0cf") + '"/>').join("")
        + "</svg>",
      // caixa de som e fone
      dir: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 240"><rect x="44" y="60" width="78" height="150" rx="8" fill="#1d2b28"/><circle cx="83" cy="92" r="16" fill="#3a4f4a" stroke="' + ARTE_O + '" stroke-width="3"/><circle cx="83" cy="92" r="6" fill="#1d2b28"/>'
        + '<circle cx="83" cy="162" r="32" fill="#3a4f4a" stroke="' + ARTE_O + '" stroke-width="3"/><circle cx="83" cy="162" r="13" fill="#1d2b28"/>'
        + '<path d="M18 46 Q18 10 54 10 Q90 10 90 46" fill="none" stroke="' + ARTE_V + '" stroke-width="6"/><rect x="10" y="40" width="16" height="26" rx="6" fill="' + ARTE_V + '"/><rect x="82" y="40" width="16" height="26" rx="6" fill="' + ARTE_V + '"/>'
        + '<path d="M130 120 q10 12 0 24 M138 112 q18 20 0 40" fill="none" stroke="' + ARTE_O + '" stroke-width="3" stroke-linecap="round"/>'
        + notaSVG(138, 72, 0.6, ARTE_O, false) + "</svg>",
      marca: "🎚️", rotulo: "Operação de Som",
    },
    // 20/11/2026: bateria (caixa com baquetas e prato)
    bateria: {
      esq: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 240">'
        + '<ellipse cx="80" cy="120" rx="58" ry="16" fill="#e8f3ef" stroke="' + ARTE_V + '" stroke-width="3"/>'
        + '<path d="M22 120 L22 180 Q80 205 138 180 L138 120" fill="' + ARTE_V + '"/>'
        + Array.from({ length: 6 }, (_, i) => '<line x1="' + (30 + i * 20) + '" y1="' + (128 + (i % 2) * 4) + '" x2="' + (30 + i * 20) + '" y2="186" stroke="' + ARTE_O + '" stroke-width="3"/>').join("")
        + '<ellipse cx="80" cy="182" rx="58" ry="14" fill="none" stroke="' + ARTE_O + '" stroke-width="3"/>'
        + '<line x1="40" y1="30" x2="86" y2="112" stroke="#1d2b28" stroke-width="5" stroke-linecap="round"/><line x1="128" y1="34" x2="92" y2="112" stroke="#1d2b28" stroke-width="5" stroke-linecap="round"/>'
        + notaSVG(24, 60, 0.6, ARTE_O, false) + "</svg>",
      dir: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 240"><ellipse cx="82" cy="70" rx="60" ry="12" fill="' + ARTE_O + '" transform="rotate(-10 82 70)"/>'
        + '<ellipse cx="82" cy="70" rx="14" ry="4" fill="#1d2b28" transform="rotate(-10 82 70)"/><line x1="82" y1="72" x2="82" y2="215" stroke="#1d2b28" stroke-width="4"/>'
        + '<path d="M82 215 L52 232 M82 215 L112 232 M82 215 L82 234" stroke="#1d2b28" stroke-width="4" stroke-linecap="round"/>'
        + notaSVG(124, 130, 0.8, ARTE_V, true) + notaSVG(40, 160, 0.6, ARTE_V, false) + "</svg>",
      marca: "🥁", rotulo: "Bateria",
    },
  };

  // ---------- logo do curso: selo redondo com nota musical e ondas de som
  function logoSVG(tam, claro) {
    const t = tam || 80, anel = claro ? "#f2d36b" : ARTE_O, fundo = claro ? "rgba(0,0,0,.18)" : ARTE_V, onda = claro ? "#f2d36b" : "#f2d36b";
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + t + '" height="' + t + '">'
      + '<defs><radialGradient id="lg" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#1fa08f"/><stop offset="1" stop-color="#0a5a4c"/></radialGradient></defs>'
      + '<circle cx="50" cy="50" r="47" fill="' + (claro ? fundo : "url(#lg)") + '" stroke="' + anel + '" stroke-width="3.5"/>'
      + '<circle cx="50" cy="50" r="40" fill="none" stroke="' + anel + '" stroke-width="1" opacity=".6"/>'
      + '<ellipse cx="36" cy="64" rx="9" ry="7" transform="rotate(-20 36 64)" fill="#ffffff"/><rect x="43" y="28" width="3.6" height="37" fill="#ffffff"/>'
      + '<path d="M46.6 28 q12 6 9 20 q-2 -9 -9 -11z" fill="#ffffff"/>'
      + '<path d="M60 40 q7 10 0 20" fill="none" stroke="' + onda + '" stroke-width="3.2" stroke-linecap="round"/>'
      + '<path d="M66 34 q12 16 0 32" fill="none" stroke="' + onda + '" stroke-width="3.2" stroke-linecap="round" opacity=".85"/>'
      + '<path d="M72 28 q17 22 0 44" fill="none" stroke="' + onda + '" stroke-width="3.2" stroke-linecap="round" opacity=".65"/></svg>';
  }
  const dataURI = (svg) => "url(\"data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg) + "\")";
  // ---------- fundo do certificado: ondas de som saindo do centro + notinhas espalhadas + logo clarinha
  function fundoCertificado() {
    let ondas = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1050 742" preserveAspectRatio="none">';
    for (let i = 1; i <= 16; i++) ondas += '<circle cx="525" cy="400" r="' + (i * 46) + '" fill="none" stroke="#c9a227" stroke-width="' + (i % 4 === 0 ? 1.6 : 0.8) + '" opacity="' + (0.16 - i * 0.006).toFixed(3) + '"/>';
    for (let k = 0; k < 3; k++) { const y = 120 + k * 250; ondas += '<path d="M0 ' + y + " C 260 " + (y - 60) + ", 520 " + (y + 60) + ", 780 " + (y - 30) + " S 1050 " + (y + 20) + ", 1050 " + (y + 20) + '" fill="none" stroke="#0b6b5a" stroke-width="1" opacity=".07"/>'; }
    ondas += "</svg>";
    let notas = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140"><g opacity="0.07">' + notaSVG(24, 46, 0.55, "#0b6b5a", false) + notaSVG(88, 112, 0.5, "#9c7a12", true) + "</g></svg>";
    return { ondas: dataURI(ondas), notas: dataURI(notas), logo: dataURI('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g opacity="0.09">' + logoSVG(100).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "") + "</g></svg>") };
  }
  const ICONE = { som: "🎚️", louvor: "🎤", regencia: "🎼", bateria: "🥁" };

  // ======================================================================= BOLETIM
  function boletimHTML(doc, info) {
    const geral = (info && info.nome_curso) || "Conhecendo o Som";
    const temNivel = doc.linhas.some((l) => l.nivel);
    const linhas = doc.linhas.map((l) => { const s = situacao(l.nota); return "<tr><td>" + esc(l.nome) + "</td><td>" + (l.nota == null ? "—" : l.nota + "%") + "</td>" + (temNivel ? "<td>" + esc(l.nivel || "—") + "</td>" : "") + "<td>" + esc(l.data || "—") + '</td><td class="' + s[1] + '">' + s[0] + "</td></tr>"; }).join("");
    const f = fundoCertificado();
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Boletim — ' + esc(doc.aluno) + '</title><style>'
      + 'body{font-family:Georgia,"Times New Roman",serif;color:#111;margin:0;padding:32px;background:#e9efed}'
      + '.folha{border:1px solid #9bb8b0;max-width:800px;margin:0 auto;overflow:hidden;background:#fffdf8 ' + f.notas + ' repeat;background-size:150px;-webkit-print-color-adjust:exact;print-color-adjust:exact}'
      + '.topo{display:flex;align-items:center;gap:18px;background:linear-gradient(120deg,#0a5a4c,#12867a 60%,#1b9a8b);color:#fff;padding:20px 30px;-webkit-print-color-adjust:exact;print-color-adjust:exact;position:relative;overflow:hidden}'
      + '.topo:after{content:"";position:absolute;right:-60px;top:-80px;width:300px;height:300px;border-radius:50%;border:2px solid rgba(242,211,107,.25);box-shadow:0 0 0 30px rgba(242,211,107,.06),0 0 0 60px rgba(242,211,107,.04)}'
      + '.marca{font:800 24px Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase}.slogan{font:italic 15px Georgia,serif;color:#f2d36b;margin-top:3px}'
      + '.sis{margin-left:auto;text-align:right;font:12px Arial,sans-serif;opacity:.85;position:relative;z-index:1}'
      + '.faixa{height:6px;background:linear-gradient(90deg,#c9a227,#f2d36b,#c9a227);-webkit-print-color-adjust:exact;print-color-adjust:exact}.corpo{padding:26px 40px 34px}'
      + 'h1{text-align:center;margin:.1em 0 .1em;font-size:28px;letter-spacing:.06em;color:#0b4f44}'
      + 'h2{text-align:center;margin:0 0 .7em;font:600 17px Arial,sans-serif;color:#555}h2:after{content:"";display:block;width:120px;height:3px;background:#c9a227;margin:10px auto 0}'
      + '.dados{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;font:14px Arial,sans-serif;background:#f3f8f6;border:1px solid #d5e5e0;border-radius:8px;padding:12px 16px}'
      + '.dados b{color:#0b4f44}.dados .gr{grid-column:1/3}'
      + 'p{font-size:16px;line-height:1.5}table{width:100%;border-collapse:collapse;margin-top:14px;font:14px Arial,sans-serif;background:#fff}'
      + 'th,td{border:1px solid #bbb;padding:6px 8px;text-align:left}th{background:#e3f0ec;color:#0b4f44}'
      + '.ok{color:#1d7a3a;font-weight:700}.med{color:#a07a00;font-weight:700}.ref{color:#b3541e;font-weight:700}.pen{color:#777}'
      + '.leg{font:13px Arial,sans-serif;text-align:center;color:#333;background:#fafaf5;border:1px dashed #cfcfb8;border-radius:8px;padding:8px 10px;margin:14px 0 0}'
      + '.ass{display:flex;justify-content:space-around;margin-top:56px;font:13px Arial,sans-serif;text-align:center}.ass div{border-top:1px solid #333;padding-top:6px;width:38%}'
      + '.btn{font:15px Arial;padding:8px 16px;margin:0 auto 16px;display:block}@media print{.btn{display:none}body{padding:0;background:#fff}}'
      + '*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>'
      + '<button class="btn" onclick="print()">Imprimir ou salvar em PDF</button><div class="folha">'
      + '<div class="topo">' + logoSVG(66, false) + '<div><div class="marca">' + esc(geral) + '</div><div class="slogan">' + SLOGAN + '</div></div><div class="sis">' + ICONE[doc.tipo] + " Curso básico<br>RMD AudioLab</div></div>"
      + '<div class="faixa"></div><div class="corpo"><h1>Boletim de Progresso</h1><h2>' + ICONE[doc.tipo] + " Curso Básico de " + esc(doc.curso) + "</h2>"
      + '<div class="dados"><div class="gr"><b>Aluno(a): </b>' + esc(doc.aluno) + '</div><div class="gr"><b>Curso: </b>' + esc(geral) + " — Curso Básico de " + esc(doc.curso) + "</div>"
      + (doc.aulas && doc.aulas.length ? '<div class="gr"><b>' + (doc.aulas.length > 1 ? "Aulas" : "Aula") + ": </b>" + doc.aulas.map(esc).join(" · ") + "</div>" : "")
      + "<div><b>Período: </b>" + periodoDe(doc.datas) + "</div><div><b>Aprovado(a) em: </b>" + doc.aprovadas + " de " + doc.total + "</div>"
      + '<div class="gr"><b>Média geral: </b>' + doc.media + "%" + (doc.tentativas ? " em " + doc.tentativas + " tentativa(s)" : "") + "</div></div>"
      + '<div class="leg"><span class="ok">Aprovado</span>: ' + NOTA_MIN + '% ou mais · <span class="med">Na média</span>: ' + NOTA_CERT + "% a " + (NOTA_MIN - 1) + '% (estudar mais) · <span class="ref">Refazer</span>: abaixo de ' + NOTA_CERT + "%</div>"
      + '<p style="text-align:center;font-size:15px">' + (doc.certificado ? "✔ Concluiu o curso: certificado liberado." : "Para o certificado: fazer todas as " + (temNivel ? "atividades" : "matérias") + " e não ficar abaixo de " + NOTA_CERT + "% em nenhuma.") + "</p>"
      + "<table><thead><tr><th>" + (temNivel ? "Exercício" : "Matéria") + "</th><th>Nota</th>" + (temNivel ? "<th>Nível</th>" : "") + "<th>Data</th><th>Situação</th></tr></thead><tbody>" + linhas + "</tbody></table>"
      + '<p style="text-align:right;margin-top:18px">Emitido em ' + new Date().toLocaleDateString("pt-BR") + "</p>"
      + '<div class="ass"><div>Professor(a) responsável</div><div>Coordenação do curso</div></div></div></div></body></html>';
  }

  // ======================================================================= CERTIFICADO
  function certificadoHTML(doc, info, op) {
    const geral = (info && info.nome_curso) || "Conhecendo o Som", A = ARTE[doc.tipo] || ARTE.som, f = fundoCertificado(), modelo = op && op.modelo;
    const hoje = (op && op.data) || new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Certificado — ' + esc(doc.aluno) + '</title><style>'
      + '@page{size:A4 landscape;margin:0}*{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box}'
      + 'body{margin:0;padding:24px;background:#e3eae7;font-family:Georgia,"Times New Roman",serif;color:#1d2b28}'
      + '.btn{font:15px Arial;padding:8px 16px;margin:0 auto 16px;display:block}'
      + '.cert{position:relative;width:1050px;max-width:100%;aspect-ratio:297/210;margin:0 auto;overflow:hidden;padding:18px;box-shadow:0 6px 30px rgba(0,0,0,.18);'
      + 'background:' + f.logo + ' center 54%/360px no-repeat,' + f.ondas + ' center/100% 100% no-repeat,' + f.notas + ' 0 0/150px repeat,radial-gradient(ellipse at 50% 45%,#fffef9 0%,#fbf6e6 60%,#f1e7c8 100%)}'
      + '.m1{position:absolute;inset:14px;border:3px solid #0b6b5a}.m2{position:absolute;inset:24px;border:1.5px solid #c9a227}'
      + '.canto{position:absolute;width:52px;height:52px;border:3px solid #c9a227}.c1{top:32px;left:32px;border-right:0;border-bottom:0}.c2{top:32px;right:32px;border-left:0;border-bottom:0}.c3{bottom:32px;left:32px;border-right:0;border-top:0}.c4{bottom:32px;right:32px;border-left:0;border-top:0}'
      + '.dentro{position:relative;height:100%;display:flex;flex-direction:column;align-items:center;text-align:center;padding:34px 70px 34px}.dentro>*{position:relative}'
      + '.cab{display:flex;align-items:center;gap:14px}.marca{font:800 22px Arial,sans-serif;letter-spacing:.2em;color:#0b4f44;text-transform:uppercase;text-align:left}.slogan{font:italic 14px Georgia,serif;color:#9c7a12;text-align:left;margin-top:2px}'
      + '.titulo{font-size:60px;letter-spacing:.22em;color:#0b4f44;margin:10px 0 0;font-weight:700;text-shadow:0 2px 0 rgba(201,162,39,.25)}'
      + '.sub{font:700 15px Arial,sans-serif;letter-spacing:.42em;color:#c9a227;text-transform:uppercase;margin-top:2px}'
      + '.faixa-curso{font:700 13px Arial,sans-serif;letter-spacing:.3em;color:#fff;background:linear-gradient(90deg,#0a5a4c,#12867a,#0a5a4c);padding:6px 20px;border-radius:20px;margin-top:10px;text-transform:uppercase;box-shadow:0 2px 6px rgba(11,79,68,.25)}'
      + '.texto{font-size:18px;margin:14px 0 2px;color:#33423e}'
      + '.nome{font-family:"Segoe Script","Brush Script MT","Lucida Handwriting",cursive;font-size:48px;color:#0b4f44;padding:0 30px 4px;border-bottom:2px solid #c9a227;margin:2px 0 8px;min-width:55%}'
      + '.desc{font-size:17px;line-height:1.5;max-width:820px;color:#33423e}.desc b{color:#0b4f44}'
      + '.mats{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 10px;margin:10px 0 0;max-width:880px}'
      + '.mats span{font:13px Arial,sans-serif;background:rgba(238,246,243,.92);border:1px solid #cfe3dc;border-radius:20px;padding:4px 11px;color:#0b4f44}'
      + '.arte{position:absolute;width:128px;height:192px;bottom:74px;opacity:.92}.arte svg{width:100%;height:100%}.ae{left:58px}.ad{right:58px}'
      + '.onda{position:absolute;left:40px;right:40px;bottom:128px;height:90px;opacity:.75}.onda svg{display:block}'
      + '.rodape{margin-top:auto;width:100%;display:flex;align-items:flex-end;justify-content:space-between}'
      + '.ass{width:30%;font:13px Arial,sans-serif;color:#33423e;border-top:1.5px solid #33423e;padding-top:6px}'
      + '.medalha{width:96px;height:96px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#f7e08a,#c9a227 60%,#9c7a12);display:grid;place-items:center;font-size:40px;box-shadow:0 0 0 5px #fffdf6,0 0 0 7px #c9a227,0 4px 10px rgba(0,0,0,.2);margin:0 auto}'
      + '.data{font:13px Arial,sans-serif;color:#6b7c78;margin-top:6px}'
      + '.modelo{position:absolute;top:38px;right:-46px;transform:rotate(35deg);background:#b3541e;color:#fff;font:800 13px Arial,sans-serif;letter-spacing:.3em;padding:5px 60px;z-index:5}'
      + '@media print{body{padding:0;background:#fff}.btn{display:none}.cert{box-shadow:none;width:297mm;height:210mm;aspect-ratio:auto;max-width:none}}'
      + '</style></head><body>'
      + (modelo ? "" : '<button class="btn" onclick="print()">Imprimir ou salvar em PDF (folha deitada)</button>')
      + '<div class="cert"><div class="m1"></div><div class="m2"></div><div class="canto c1"></div><div class="canto c2"></div><div class="canto c3"></div><div class="canto c4"></div>'
      + (modelo ? '<div class="modelo">MODELO</div>' : "")
      + '<div class="onda">' + pautaOnda(960) + '</div><div class="arte ae">' + A.esq + '</div><div class="arte ad">' + A.dir + "</div>"
      + '<div class="dentro"><div class="cab">' + logoSVG(64, false) + '<div><div class="marca">' + esc(geral) + '</div><div class="slogan">' + SLOGAN + "</div></div></div>"
      + '<div class="titulo">CERTIFICADO</div><div class="sub">de conclusão</div><div class="faixa-curso">Curso Básico · ' + esc(A.rotulo) + "</div>"
      + '<div class="texto">Certificamos que</div><div class="nome">' + esc(doc.aluno) + "</div>"
      + '<div class="desc">concluiu com aproveitamento o <b>Curso Básico de ' + esc(doc.curso) + "</b>, do programa <b>" + esc(geral) + "</b>, tendo estudado e sido aprovado(a) em:</div>"
      + '<div class="mats">' + doc.linhas.map((l) => "<span>✔ " + esc(l.nome) + "</span>").join("") + "</div>"
      + '<div class="rodape"><div class="ass">Professor(a) responsável</div><div><div class="medalha">' + ICONE[doc.tipo] + '</div><div class="data">' + esc(hoje) + '</div></div><div class="ass">Pastor(a) / Dirigente</div></div>'
      + "</div></div></body></html>";
  }

  // abre numa janela nova pronta para imprimir
  function abrir(html) {
    const w = window.open("", "_blank", "width=1100,height=900");
    if (!w) return false;
    w.document.open(); w.document.write(html); w.document.close();
    return true;
  }

  return { NOTA_MIN, NOTA_CERT, situacao, boletimHTML, certificadoHTML, abrir, logoSVG, SLOGAN };
})();
