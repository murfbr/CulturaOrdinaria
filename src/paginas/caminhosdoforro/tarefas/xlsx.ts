/* Leitor de planilha .xlsx no navegador, sem biblioteca: o arquivo é um zip
   de XMLs. Abre o zip (diretório central + DecompressionStream), lê as abas
   de xl/workbook.xml e devolve cada uma como matriz de textos. Só o que a
   importação do plano precisa: valores das células, nada de estilos nem de
   fórmulas (de fórmula vem o resultado guardado). Datas guardadas como
   número chegam como número: quem conhece a coluna converte (ver
   `dataDaCelula` em plano.ts). */

export interface Aba { nome: string; linhas: string[][] }

interface Entrada { metodo: number; tamanho: number; inicio: number }

const u16 = (v: DataView, p: number) => v.getUint16(p, true);
const u32 = (v: DataView, p: number) => v.getUint32(p, true);

/** O diretório central do zip: nome do arquivo → onde ele está e como foi comprimido. */
function lerDiretorio(buf: ArrayBuffer): Map<string, Entrada> {
  const v = new DataView(buf);
  // O registro de fim fica nos últimos bytes (22 + comentário de até 64 KB).
  let fim = -1;
  for (let p = buf.byteLength - 22; p >= Math.max(0, buf.byteLength - 22 - 65535); p--) {
    if (u32(v, p) === 0x06054b50) { fim = p; break; }
  }
  if (fim < 0) throw new Error("O arquivo não é uma planilha .xlsx.");
  const total = u16(v, fim + 10);
  let p = u32(v, fim + 16);
  const nomes = new TextDecoder("utf-8");
  const entradas = new Map<string, Entrada>();
  for (let i = 0; i < total; i++) {
    if (u32(v, p) !== 0x02014b50) break;
    const tamNome = u16(v, p + 28);
    const nome = nomes.decode(new Uint8Array(buf, p + 46, tamNome));
    entradas.set(nome, { metodo: u16(v, p + 10), tamanho: u32(v, p + 20), inicio: u32(v, p + 42) });
    p += 46 + tamNome + u16(v, p + 30) + u16(v, p + 32);
  }
  return entradas;
}

/** O texto de um arquivo de dentro do zip ("" se não existe). */
async function lerArquivo(buf: ArrayBuffer, entradas: Map<string, Entrada>, nome: string): Promise<string> {
  const e = entradas.get(nome);
  if (!e) return "";
  const v = new DataView(buf);
  if (u32(v, e.inicio) !== 0x04034b50) throw new Error("A planilha está corrompida (" + nome + ").");
  const dados = e.inicio + 30 + u16(v, e.inicio + 26) + u16(v, e.inicio + 28);
  const bytes = new Uint8Array(buf, dados, e.tamanho);
  let saida: ArrayBuffer;
  if (e.metodo === 0) saida = bytes.slice().buffer;
  else if (e.metodo === 8) {
    const fluxo = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    saida = await new Response(fluxo).arrayBuffer();
  } else throw new Error("A planilha usa uma compressão que este leitor não abre.");
  return new TextDecoder("utf-8").decode(saida).replace(/^﻿/, "");
}

const xml = (texto: string) => new DOMParser().parseFromString(texto, "application/xml");
/** Elementos pelo nome sem o prefixo (o arquivo pode vir com `x:row` ou só `row`). */
const tags = (no: Document | Element, nome: string) => Array.from(no.getElementsByTagNameNS("*", nome));

/** Texto de um <si> ou <is>: junta os <t>, pulando a leitura fonética (<rPh>). */
const textoRico = (no: Element) =>
  tags(no, "t").filter((t) => !t.parentElement || t.parentElement.localName !== "rPh").map((t) => t.textContent || "").join("");

/** "AB12" → 27 (coluna a partir de zero). */
function colunaDe(ref: string): number {
  let n = 0;
  for (const ch of ref) {
    const c = ch.charCodeAt(0);
    if (c < 65 || c > 90) break;
    n = n * 26 + (c - 64);
  }
  return n - 1;
}

/** Uma aba (xl/worksheets/sheetN.xml) como matriz: a linha 1 da planilha é o índice 0. */
function lerAba(texto: string, compartilhados: string[]): string[][] {
  const linhas: string[][] = [];
  tags(xml(texto), "row").forEach((row, i) => {
    const r = Number(row.getAttribute("r")) || i + 1;
    const linha: string[] = [];
    tags(row, "c").forEach((c, j) => {
      const ref = c.getAttribute("r");
      const col = ref ? colunaDe(ref) : j;
      const tipo = c.getAttribute("t");
      const v = tags(c, "v")[0]?.textContent ?? "";
      let valor = v;
      if (tipo === "s") valor = compartilhados[Number(v)] ?? "";
      else if (tipo === "inlineStr") valor = tags(c, "is")[0] ? textoRico(tags(c, "is")[0]) : "";
      else if (tipo === "b") valor = v === "1" ? "Sim" : "Não";
      else if (tipo === "e") valor = "";
      if (col >= 0) linha[col] = valor;
    });
    linhas[r - 1] = Array.from(linha, (x) => x ?? "");
  });
  return Array.from(linhas, (l) => l ?? []);
}

/** Lê o .xlsx e devolve as abas na ordem do arquivo. */
export async function lerXlsx(buf: ArrayBuffer): Promise<Aba[]> {
  const entradas = lerDiretorio(buf);
  const pasta = xml(await lerArquivo(buf, entradas, "xl/workbook.xml"));
  const relacoes = new Map<string, string>();
  let caminhoCompartilhados = "xl/sharedStrings.xml";
  tags(xml(await lerArquivo(buf, entradas, "xl/_rels/workbook.xml.rels")), "Relationship").forEach((r) => {
    const alvo = r.getAttribute("Target") || "";
    const caminho = alvo.startsWith("/") ? alvo.slice(1) : "xl/" + alvo;
    relacoes.set(r.getAttribute("Id") || "", caminho);
    if ((r.getAttribute("Type") || "").endsWith("/sharedStrings")) caminhoCompartilhados = caminho;
  });
  const textoCompartilhados = await lerArquivo(buf, entradas, caminhoCompartilhados);
  const compartilhados = textoCompartilhados ? tags(xml(textoCompartilhados), "si").map(textoRico) : [];

  const abas: Aba[] = [];
  for (const sheet of tags(pasta, "sheet")) {
    // O id da relação é o atributo r:id (o prefixo varia de arquivo para arquivo).
    const rid = Array.from(sheet.attributes).find((a) => a.localName === "id" && a.name !== "id")?.value || "";
    const caminho = relacoes.get(rid);
    if (!caminho || !entradas.has(caminho)) continue;
    abas.push({ nome: sheet.getAttribute("name") || "", linhas: lerAba(await lerArquivo(buf, entradas, caminho), compartilhados) });
  }
  if (!abas.length) throw new Error("Não encontrei nenhuma aba na planilha.");
  return abas;
}
