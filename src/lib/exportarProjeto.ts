/* Exportar as respostas do formulário de um projeto como documento: monta um
   HTML só (título, edital, e por etapa os blocos e campos preenchidos, com o
   mesmo filtro do "Copiar tudo em texto") e entrega de dois jeitos, sem
   biblioteca: .doc (o HTML baixado com extensão .doc, que o Word, o
   LibreOffice e o Google Docs abrem como documento) ou PDF (o HTML aberto
   numa janela de impressão, onde a pessoa escolhe "Salvar como PDF"). */
import { formularioDe } from "../data";
import { editalDoProjeto, nomeCurto } from "./nomes";
import { temValor, textoDe, visivel, type CampoAchatado } from "./simulador/motor";
import { baixarArquivo, slug } from "../utils";
import type { CampoFormulario, Projeto, Rascunho } from "../types";

export type FormatoExportacao = "pdf" | "doc";

const escapar = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Texto de campo em HTML, preservando as quebras de linha. */
const paragrafo = (s: string) => escapar(s).replace(/\n/g, "<br>");

const ESTILO = `
  body { font-family: Georgia, "Times New Roman", serif; color: #111; max-width: 72ch; margin: 2cm auto; padding: 0 1cm; line-height: 1.55; font-size: 12pt; }
  h1 { font-size: 22pt; margin: 0 0 4pt; }
  .sub { color: #555; margin: 0 0 24pt; font-size: 11pt; }
  h2 { font-size: 15pt; margin: 28pt 0 8pt; border-bottom: 1px solid #999; padding-bottom: 3pt; page-break-after: avoid; }
  h3 { font-size: 11pt; text-transform: uppercase; letter-spacing: .04em; color: #555; margin: 18pt 0 6pt; page-break-after: avoid; }
  .campo { margin: 0 0 12pt; page-break-inside: avoid; }
  .rotulo { font-weight: bold; margin: 0 0 2pt; }
  .cod { font-family: monospace; font-size: 9pt; color: #777; font-weight: normal; margin-left: 6pt; }
  .valor { margin: 0; white-space: pre-wrap; }
  @media print { body { margin: 0; max-width: none; } }
`;

/** Monta o HTML do documento com as etapas escolhidas (índices). */
export function htmlDoProjeto(p: Projeto, r: Rascunho, etapasEscolhidas: number[]): string {
  const f = formularioDe(r.form);
  const edital = editalDoProjeto(p);
  const partes: string[] = [];
  partes.push(`<h1>${escapar(p.nome)}</h1>`);
  partes.push(`<p class="sub">${[f?.nome || "", edital ? nomeCurto(edital) : "", p.ano].filter(Boolean).map(escapar).join(" · ")}</p>`);

  f?.etapas.forEach((e, ei) => {
    if (!etapasEscolhidas.includes(ei)) return;
    const blocos: string[] = [];
    e.blocos.forEach((b) => {
      const cs = b.campos
        .filter((c): c is CampoFormulario & { n: string } => Boolean(c.n))
        .map((c) => ({ ...c, etapa: e, ei, bloco: b } as CampoAchatado))
        .filter((c) => c.t !== "orcresumo" && visivel(c, r.valores) && temValor(r.valores[c.n]));
      if (!cs.length) return;
      blocos.push(`<h3>${escapar(b.t)}${b.tag ? ` <span class="cod">${escapar(b.tag)}</span>` : ""}</h3>`);
      cs.forEach((c) => {
        blocos.push(
          `<div class="campo"><p class="rotulo">${escapar(c.l || c.n)}<span class="cod">${escapar(c.cod || c.n)}</span></p>` +
          `<p class="valor">${paragrafo(textoDe(c, r.valores[c.n], r))}</p></div>`,
        );
      });
    });
    partes.push(`<h2>${escapar(e.nome)}</h2>`);
    partes.push(blocos.length ? blocos.join("\n") : `<p class="valor"><i>Nenhum campo preenchido nesta etapa.</i></p>`);
  });

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapar(p.nome)}</title><style>${ESTILO}</style></head><body>${partes.join("\n")}</body></html>`;
}

/** Baixa o documento como .doc (HTML que o Word abre). */
export function baixarDoc(p: Projeto, html: string) {
  baixarArquivo(`${slug(p.nome)}.doc`, html, "application/msword");
}

/** Abre o documento numa janela e chama a impressão: "Salvar como PDF" no navegador.
    Devolve false se o navegador bloqueou a janela. */
export function imprimirPdf(html: string): boolean {
  const janela = window.open("", "_blank");
  if (!janela) return false;
  janela.document.open();
  janela.document.write(html);
  janela.document.close();
  janela.focus();
  // A impressão só depois que o documento renderizou; senão sai em branco.
  janela.setTimeout(() => janela.print(), 300);
  return true;
}
