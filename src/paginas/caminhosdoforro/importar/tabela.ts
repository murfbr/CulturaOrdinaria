/* Importação por tabela (planilha ou texto colado) das telas do festival.
   Cada tela descreve as próprias colunas (ColunaTabela) e este arquivo faz o
   resto, sem gravar nada: acha o cabeçalho, lê cada linha convertendo o texto
   da célula no valor do registro (id de lista pelo nome, lista separada por
   |, sim/não) e compara com o que já existe, reconhecendo o registro pelo id
   ou pelo nome. Célula vazia nunca apaga o que já está gravado. O guia, o
   modelo e a planilha baixada da tela também saem daqui. */
import { gerarCsv } from "../../../lib/csv";
import { normalizar } from "../listas";
import type { Aba } from "../tarefas/xlsx";

export interface ColunaTabela {
  /** Campo do registro; "contato.nome" entra em contato.nome. */
  campo: string;
  /** Nome da coluna no modelo e na planilha baixada. */
  cabecalho: string;
  /** Reconhece a coluna pelo cabeçalho normalizado (sem acento, minúsculas), além do próprio nome. */
  aceita?: (c: string) => boolean;
  /** Como preencher, para o guia. */
  como: string;
  obrigatoria?: boolean;
  /** Lista fechada [id, nome]: a célula traz o nome ou o id. */
  opcoes?: [string, string][];
  /** Vários valores na célula, separados por | ou ,. */
  lista?: boolean;
  /** Sim ou não. */
  booleano?: boolean;
  /** Valor da linha de exemplo do modelo. */
  exemplo: string;
}

/** Uma linha lida: o número na planilha e o valor de cada coluna que veio preenchida. */
export interface LinhaLida { numero: number; valores: Record<string, unknown> }
export interface TabelaLida { aba: string; linhas: LinhaLida[]; avisos: string[] }

/* ══════════ guia, modelo e planilha ══════════ */

export interface LinhaGuia { cabecalho: string; obrigatoria: boolean; como: string }

export const guiaDasColunas = (colunas: ColunaTabela[]): LinhaGuia[] =>
  colunas.map((c) => ({ cabecalho: c.cabecalho, obrigatoria: !!c.obrigatoria, como: c.como }));

/** O modelo: o cabeçalho e uma linha de exemplo. */
export const modeloTabela = (colunas: ColunaTabela[]): string[][] =>
  [colunas.map((c) => c.cabecalho), colunas.map((c) => c.exemplo)];

/** Lê "contato.nome" em obj. */
export const lerCampo = (obj: unknown, caminho: string): unknown =>
  caminho.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);

/** Escreve "contato.nome" em obj, criando o objeto do meio se faltar. */
export function escreverCampo(obj: Record<string, unknown>, caminho: string, valor: unknown) {
  const partes = caminho.split(".");
  let o = obj;
  for (const k of partes.slice(0, -1)) {
    if (!o[k] || typeof o[k] !== "object") o[k] = {};
    o = o[k] as Record<string, unknown>;
  }
  o[partes[partes.length - 1]] = valor;
}

/** A planilha dos registros no mesmo formato do modelo (volta pela importação). */
export function planilhaDe(colunas: ColunaTabela[], registros: unknown[]): string {
  const celula = (col: ColunaTabela, v: unknown): string => {
    if (v == null || v === "") return "";
    const nome = (id: unknown) => col.opcoes?.find(([i]) => i === String(id))?.[1] ?? String(id);
    if (Array.isArray(v)) return v.map(nome).join(" | ");
    if (col.booleano) return v ? "sim" : "não";
    return nome(v);
  };
  return gerarCsv([colunas.map((c) => c.cabecalho), ...registros.map((r) => colunas.map((c) => celula(c, lerCampo(r, c.campo))))]);
}

/* ══════════ ler ══════════ */

const SIM = new Set(["sim", "s", "x", "true", "1", "verdadeiro"]);
const NAO = new Set(["nao", "n", "false", "0", "falso"]);

/** A primeira linha (nas 30 primeiras de cada aba) em que todas as colunas obrigatórias aparecem. */
function acharCabecalho(abas: Aba[], colunas: ColunaTabela[]) {
  const serve = (col: ColunaTabela, c: string) => c === normalizar(col.cabecalho).trim() || (col.aceita ? col.aceita(c) : false);
  for (const aba of abas) {
    for (let i = 0; i < Math.min(aba.linhas.length, 30); i++) {
      const mapa: Record<string, number> = {};
      aba.linhas[i].forEach((celula, j) => {
        const c = normalizar(celula).trim();
        if (!c) return;
        const col = colunas.find((x) => mapa[x.campo] == null && serve(x, c));
        if (col) mapa[col.campo] = j;
      });
      if (colunas.filter((c) => c.obrigatoria).every((c) => mapa[c.campo] != null)) return { aba, linha: i, mapa };
    }
  }
  return null;
}

/** Texto da célula → valor do registro; undefined (com aviso) quando o texto não serve. */
function valorDaCelula(col: ColunaTabela, texto: string, avisos: string[], onde: string): unknown {
  const t = texto.trim();
  const resolver = (um: string): string | undefined => {
    if (!col.opcoes) return um;
    const n = normalizar(um).trim();
    const achou = col.opcoes.find(([id, nome]) => normalizar(id) === n || normalizar(nome).trim() === n);
    if (!achou) avisos.push(`${onde}: ${col.cabecalho} "${um}" não existe (aceitos: ${col.opcoes.map(([, nome]) => nome).join(", ")}); ficou de fora.`);
    return achou?.[0];
  };
  if (col.lista) {
    return t.split(t.includes("|") ? "|" : ",").map((x) => x.trim()).filter(Boolean).map(resolver).filter((x): x is string => x != null);
  }
  if (col.booleano) {
    const n = normalizar(t).trim();
    if (SIM.has(n)) return true;
    if (NAO.has(n)) return false;
    avisos.push(`${onde}: ${col.cabecalho} "${t}" não é sim nem não; ficou de fora.`);
    return undefined;
  }
  return resolver(t);
}

/** As abas (ou o texto colado) → linhas com os valores já convertidos. Lança erro, com texto para a tela, se não achar o cabeçalho. */
export function lerTabela(colunas: ColunaTabela[], abas: Aba[]): TabelaLida {
  const achado = acharCabecalho(abas, colunas);
  if (!achado) {
    const nomes = colunas.filter((c) => c.obrigatoria).map((c) => c.cabecalho).join(" e ");
    throw new Error("Não encontrei a tabela: a planilha precisa de uma linha de cabeçalho com " + (nomes ? "a coluna " + nomes : "as colunas do modelo") + ".");
  }
  const { aba, linha, mapa } = achado;
  const avisos: string[] = [];
  const linhas: LinhaLida[] = [];
  aba.linhas.slice(linha + 1).forEach((celulas, i) => {
    const numero = linha + 2 + i;
    const valores: Record<string, unknown> = {};
    for (const col of colunas) {
      const j = mapa[col.campo];
      if (j == null) continue;
      const texto = String(celulas[j] ?? "");
      if (!texto.trim()) continue;
      const v = valorDaCelula(col, texto, avisos, "linha " + numero);
      if (v !== undefined) valores[col.campo] = v;
    }
    if (Object.keys(valores).length) linhas.push({ numero, valores });
  });
  if (!linhas.length) throw new Error("A tabela da aba “" + aba.nome + "” está vazia.");
  return { aba: aba.nome, linhas, avisos };
}

/* ══════════ preparar ══════════ */

export interface MudancaTabela<T> { registro: T; campos: string[] }
export interface PreparoTabela<T> { novos: T[]; atualizadas: MudancaTabela<T>[]; iguais: number; avisos: string[] }

const igual = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * Compara as linhas com os registros que existem, sem gravar: reconhece pelo
 * id (coluna "id") ou pelo nome; nos que existem, só as colunas que vieram
 * preenchidas mudam; os outros entram como novos a partir de `novo(valores)`.
 * Linha sem nome e nome repetido na planilha ficam de fora, com aviso.
 */
export function prepararTabela<T extends { id: string; nome: string }>(
  existentes: Record<string, T>, lida: TabelaLida, novo: (valores: Record<string, unknown>) => T,
): PreparoTabela<T> {
  const porNome = new Map(Object.values(existentes).map((r) => [normalizar(r.nome).trim(), r]));
  const vistos = new Set<string>();
  const r: PreparoTabela<T> = { novos: [], atualizadas: [], iguais: 0, avisos: [] };
  for (const { numero, valores } of lida.linhas) {
    const id = typeof valores.id === "string" ? valores.id.trim() : "";
    const nome = typeof valores.nome === "string" ? valores.nome.trim() : "";
    const atual = (id && existentes[id]) || (nome && porNome.get(normalizar(nome).trim())) || null;
    if (!atual && !nome) { r.avisos.push("linha " + numero + ": sem nome, ficou de fora."); continue; }
    const chave = atual ? atual.id : normalizar(nome).trim();
    if (vistos.has(chave)) { r.avisos.push("linha " + numero + ': "' + (atual?.nome || nome) + '" repetido na planilha; só a primeira linha entra.'); continue; }
    vistos.add(chave);
    if (!atual) { r.novos.push(novo(valores)); continue; }
    const copia = JSON.parse(JSON.stringify(atual)) as T;
    const campos: string[] = [];
    for (const [campo, v] of Object.entries(valores)) {
      if (campo === "id" || igual(lerCampo(copia, campo), v)) continue;
      escreverCampo(copia as unknown as Record<string, unknown>, campo, v);
      campos.push(campo);
    }
    if (campos.length) r.atualizadas.push({ registro: copia, campos }); else r.iguais++;
  }
  return r;
}
