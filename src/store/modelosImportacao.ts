/* Guia e conferência da importação do Painel. Por coleção: a lista de campos
   (lida de ENTIDADES, a mesma tabela que desenha o modal de edição) e um
   modelo pronto para copiar, em JSON (com o envelope do pacote da Central) e
   em CSV (as colunas de COLUNAS_CSV). Para o que a pessoa colou: completa o
   envelope quando veio só a lista, dá id a quem não tem, aplica os padrões da
   entidade nos registros novos e confere campo a campo antes da prévia.
   Nada aqui grava. */
import { ENTIDADES } from "../forms/especificacoes";
import type { CampoSpec, EntidadeSpec } from "../forms/tipos";
import { gerarCsv } from "../lib/csv";
import { clonar, uid } from "../utils";
import { obterEstado } from "./central";
import { celulaExportada, COLUNAS_CSV } from "./planilha";
import {
  COLECOES_PAINEL, ROTULO_COLECAO, type ColecaoPainel, type Formulario, type TipoCampo,
} from "../types";

type Registro = Record<string, unknown>;

/** O que a pessoa escolheu importar: uma coleção do Painel ou o pacote completo. */
export type Escolha = ColecaoPainel | "pacote";

const specDe = (colecao: ColecaoPainel): EntidadeSpec =>
  Object.values(ENTIDADES).find((s) => s.colecao === colecao)!;

/** Campo que reconhece o registro na planilha quando não há id. */
const chaveNome = (colecao: ColecaoPainel) => (colecao === "tarefas" || colecao === "reunioes" ? "titulo" : "nome");

/** Opções de um campo de lista fechada (`opts`): [valor gravado, rótulo]. Vazio nos demais. */
function opcoesFechadas(c: CampoSpec): [string, string][] {
  if (c.tipo !== "opts") return [];
  const lista = typeof c.fonte === "function" ? c.fonte() : (c.fonte as [string, string][]);
  return lista.filter(([v]) => v !== "");
}

/** Sugestões de um `select`: o valor gravado é o próprio texto, e a base tem textos fora da lista. */
const sugestoes = (c: CampoSpec): string[] => (c.tipo === "select" ? (c.fonte as string[]).filter(Boolean) : []);

/* ══════════ guia: os campos ══════════ */

/** Uma linha do guia: o campo e como preenchê-lo. */
export interface CampoGuia {
  chave: string;
  rotulo: string;
  /** Tipo e valores aceitos, em uma frase. */
  como: string;
}

const aspas = (lista: string[]) => lista.map((v) => `"${v}"`).join(", ");

function comoPreencher(c: CampoSpec): string {
  const colecao = ROTULO_COLECAO[c.fonte as ColecaoPainel];
  switch (c.tipo) {
    case "textarea": return "texto, pode ter várias linhas";
    case "date": return "data no formato AAAA-MM-DD";
    case "numero": return 'número; "" = sem valor';
    case "opts": return "um destes: " + opcoesFechadas(c).map(([v, r]) => (v === r ? `"${v}"` : `"${v}" (${r})`)).join(", ");
    case "select": return "texto; o formulário sugere " + aspas(sugestoes(c));
    case "ref": return `id de um registro em ${colecao}` + (c.vazio ? '; "" = nenhum' : "") + " (no CSV vai o nome)";
    case "multi": return `lista de ids de registros em ${colecao} (no CSV, os nomes separados por |)`;
    case "origem": return 'vínculo: "proj:<id do projeto>", "edital:<id>", "reuniao:<id>" ou ""';
    case "csv": case "lines": return "lista de textos (no CSV, separados por |)";
    default: return "texto";
  }
}

/** Os campos da coleção, na ordem do formulário de edição, com o id na frente. */
export function camposDe(colecao: ColecaoPainel): CampoGuia[] {
  const spec = specDe(colecao);
  const nome = chaveNome(colecao);
  return [
    {
      chave: "id", rotulo: "Id",
      como: `texto curto e único (o site gera "${spec.prefixoId}-xxxxxx"); sem id, ganha um novo; com o id de um registro que já existe, Mesclar atualiza esse registro`,
    },
    ...spec.campos.map((c) => ({
      chave: c.chave, rotulo: c.rotulo,
      como: comoPreencher(c) + (c.chave === nome ? "; é por ele que a planilha reconhece o registro quando não há id" : ""),
    })),
  ];
}

/* ══════════ guia: os modelos ══════════ */

const hoje = () => new Date().toISOString().slice(0, 10);
const primeiroId = (colecao: ColecaoPainel) => obterEstado().painel[colecao][0]?.id || "";

function valorDeExemplo(c: CampoSpec, spec: EntidadeSpec): unknown {
  switch (c.tipo) {
    case "date": return hoje();
    case "numero": return "";
    case "ref": return primeiroId(c.fonte as ColecaoPainel);
    case "multi": { const id = primeiroId(c.fonte as ColecaoPainel); return id ? [id] : []; }
    case "origem": return "";
    case "csv": case "lines": return ["exemplo 1", "exemplo 2"];
    case "opts": return opcoesFechadas(c)[0]?.[0] ?? "";
    case "select": return sugestoes(c)[0] ?? "";
    default: return c.chave === "nome" || c.chave === "titulo" ? spec.titulo + " de exemplo" : "";
  }
}

/** Um registro de exemplo da coleção: id, os campos do formulário e os padrões da entidade. */
export function registroExemplo(colecao: ColecaoPainel): Registro & { id: string } {
  const spec = specDe(colecao);
  const r: Registro = { id: uid(spec.prefixoId) };
  spec.campos.forEach((c) => { r[c.chave] = valorDeExemplo(c, spec); });
  Object.entries(spec.padrao || {}).forEach(([k, v]) => { if (!(k in r)) r[k] = clonar(v); });
  return r as Registro & { id: string };
}

const envelope = (painel: Partial<Record<ColecaoPainel, unknown[]>>) => ({ central: "coletivo", versao: 3, painel });

/** Modelo JSON de uma coleção (um registro) ou do pacote completo (um por coleção), já no envelope. */
export function modeloJson(escolha: Escolha): string {
  const painel = escolha === "pacote"
    ? Object.fromEntries(COLECOES_PAINEL.map((c) => [c, [registroExemplo(c)]]))
    : { [escolha]: [registroExemplo(escolha)] };
  return JSON.stringify(envelope(painel), null, 2);
}

/** Modelo CSV: cabeçalho de COLUNAS_CSV e uma linha de exemplo (relações pelo nome, como na exportação). */
export function modeloCsv(colecao: ColecaoPainel): string {
  const colunas = COLUNAS_CSV[colecao];
  const r = registroExemplo(colecao);
  return gerarCsv([["id", ...colunas.map((c) => c.rotulo)], ["", ...colunas.map((c) => celulaExportada(r, c))]]);
}

/** Os 12 tipos de campo do motor de formulários, com uma linha de explicação cada. */
export const TIPOS_CAMPO_FORMULARIO: Record<TipoCampo, string> = {
  txt: "texto curto, uma linha",
  ta: "texto longo",
  sel: "lista: escolhe um valor de opts",
  rad: "opções: marca uma (inline: 1 põe em linha)",
  chk: "opções: marca várias",
  date: "data",
  rep: "lista repetível: campos dentro de campos",
  docs: "checklist de documentos (opts são os nomes)",
  anexo: "anexo (o site só marca que foi enviado)",
  orc: "orçamento (planilha de linhas)",
  orcresumo: "resumo do orçamento, só leitura",
  info: "texto fixo em html, sem n nem valor",
};

/** Uma definição mínima válida, com um campo de cada tipo e uma condição `quando`. */
export function modeloFormulario(): string {
  const f: Formulario = {
    id: "exemplo-2026", nome: "Formulário de exemplo", plataforma: "desenvolve-cultura", origem: "documento",
    etapas: [
      {
        id: "e1", nome: "Identificação",
        blocos: [{
          t: "Dados do projeto",
          campos: [
            { n: "titulo", l: "Título do projeto", t: "txt", max: 120, req: 1 },
            { n: "resumo", l: "Resumo", t: "ta", max: 1500, conceito: "resumo" },
            { n: "area", l: "Área", t: "sel", opts: ["Música", "Teatro", "Dança"] },
            { n: "pf_pj", l: "Quem se inscreve", t: "rad", opts: ["Pessoa física", "Pessoa jurídica"], inline: 1 },
            { n: "cnpj", l: "CNPJ", t: "txt", quando: { n: "pf_pj", v: ["Pessoa jurídica"] } },
            { n: "linguagens", l: "Linguagens", t: "chk", opts: ["Samba", "Forró", "Maracatu"] },
            { n: "inicio", l: "Início previsto", t: "date" },
          ],
        }],
      },
      {
        id: "e2", nome: "Equipe e orçamento",
        blocos: [
          {
            t: "Equipe",
            campos: [
              { t: "info", html: "<p>Liste quem trabalha no projeto.</p>" },
              { n: "equipe", l: "Equipe", t: "rep", campos: [{ n: "nome", l: "Nome", t: "txt" }, { n: "funcao", l: "Função", t: "txt" }] },
            ],
          },
          {
            t: "Documentos e orçamento",
            campos: [
              { n: "docs", l: "Documentos", t: "docs", opts: ["Cartão CNPJ", "Portfólio"] },
              { n: "portfolio", l: "Portfólio (PDF)", t: "anexo" },
              { n: "orcamento", l: "Orçamento", t: "orc" },
              { n: "orc_resumo", l: "Resumo do orçamento", t: "orcresumo" },
            ],
          },
        ],
      },
    ],
  };
  return JSON.stringify(f, null, 2);
}

/* ══════════ o que foi colado: completar e conferir ══════════ */

export interface Preparo { pacote: Record<string, unknown>; avisos: string[] }

const ehColecao = (k: string): k is ColecaoPainel => (COLECOES_PAINEL as string[]).includes(k);

/**
 * O que foi colado vira um pacote da Central: uma lista solta entra na coleção
 * escolhida; `{artistas: [...]}` ganha o envelope; um registro só vira lista de
 * um. Nos pacotes v3 (ou montados aqui), registro sem id ganha um e registro
 * novo recebe os padrões da entidade. Pacotes antigos passam como vieram: quem
 * converte é analisarPacote.
 */
export function prepararColado(bruto: unknown, escolha: Escolha): Preparo {
  const avisos: string[] = [];
  const dado = clonar(bruto);
  let pacote: Record<string, unknown>;
  if (Array.isArray(dado)) {
    if (escolha === "pacote") throw new Error("Isso é uma lista de registros: escolha acima em qual coleção ela entra.");
    pacote = envelope({ [escolha]: dado });
  } else if (dado && typeof dado === "object") {
    const o = dado as Record<string, unknown>;
    const chaves = Object.keys(o);
    const pareceRegistro = ("nome" in o || "titulo" in o || "id" in o) && !("valores" in o) && !("simulador" in o);
    if (o.central === "coletivo") pacote = o;
    else if (chaves.length && chaves.every(ehColecao)) pacote = envelope(o as Partial<Record<ColecaoPainel, unknown[]>>);
    else if (escolha !== "pacote" && pareceRegistro) pacote = envelope({ [escolha]: [o] });
    else pacote = o;
  } else {
    throw new Error("O JSON precisa ser um objeto ou uma lista.");
  }

  const painel = pacote.painel as Record<string, unknown> | undefined;
  if (pacote.versao !== 3 || !painel) return { pacote, avisos };
  for (const c of COLECOES_PAINEL) {
    const lista = painel[c];
    if (!Array.isArray(lista)) continue;
    const spec = specDe(c);
    const existentes = new Set(obterEstado().painel[c].map((x) => x.id));
    let semId = 0;
    painel[c] = (lista as unknown[]).map((item) => {
      const r = (item && typeof item === "object" ? item : {}) as Registro;
      if (typeof r.id !== "string" || !r.id.trim()) { r.id = uid(spec.prefixoId); semId++; }
      return existentes.has(r.id as string) || !spec.padrao ? r : { ...clonar(spec.padrao), ...r };
    });
    if (semId) avisos.push(`${ROTULO_COLECAO[c]}: ${semId} registro(s) sem id ganharam um id novo.`);
  }
  return { pacote, avisos };
}

/** Campos que as fichas gravam e o formulário de edição não mostra; o conferidor não os estranha. */
const CAMPOS_DAS_FICHAS: Partial<Record<ColecaoPainel, string[]>> = {
  artistas: ["enq", "det"],
  projetos: ["formId", "rascunhoId", "arquivado", "proponente", "proponenteId", "docs", "producao", "interno", "historico", "origem", "resumoEdicoes"],
  editais: [
    "formIds", "verif", "links", "linhas", "aceitaPf", "aceitaMei", "aceitaColetivo", "criterios", "criteriosTotal",
    "notaMinima", "desempate", "bonus", "criteriosFonte", "exigencias", "fontes", "confianca", "lacunasTexto",
    "lacunas", "alertas", "arquivos", "formOrigem", "formCampos", "plataforma",
  ],
  tarefas: ["edicaoId", "fase"],
  contatos: ["obs"],
};
const INTERNOS = ["id", "_ord", "_novo", "atualizado"];

function camposConhecidos(colecao: ColecaoPainel): Set<string> {
  return new Set([
    ...INTERNOS,
    ...specDe(colecao).campos.map((c) => c.chave),
    ...COLUNAS_CSV[colecao].map((c) => c.campo),
    ...(CAMPOS_DAS_FICHAS[colecao] || []),
  ]);
}

const LIMITE_AVISOS = 30;

/**
 * Confere um pacote v3 campo a campo, sem gravar: registro sem nome, campo que
 * não é da coleção, valor fora da lista fechada e relação que não existe (nem
 * no banco nem no próprio pacote). São avisos: nada impede a importação.
 */
export function conferirPacote(pacote: Record<string, unknown>): string[] {
  const painel = pacote.painel as Record<string, unknown> | undefined;
  if (pacote.central !== "coletivo" || pacote.versao !== 3 || !painel) return [];
  const avisos: string[] = [];
  const ids = new Map<ColecaoPainel, Set<string>>();
  const idsDe = (c: ColecaoPainel) => {
    if (!ids.has(c)) {
      const noPacote = Array.isArray(painel[c]) ? (painel[c] as Registro[]).map((r) => String(r.id)) : [];
      ids.set(c, new Set([...obterEstado().painel[c].map((x) => x.id), ...noPacote]));
    }
    return ids.get(c)!;
  };
  const naoExiste = (quem: string, campo: CampoSpec, valor: unknown) =>
    `${quem}: ${campo.rotulo} "${valor}" não existe em ${ROTULO_COLECAO[campo.fonte as ColecaoPainel]}.`;

  for (const c of COLECOES_PAINEL) {
    const lista = painel[c];
    if (!Array.isArray(lista)) continue;
    const spec = specDe(c);
    const conhecidos = camposConhecidos(c);
    const nome = chaveNome(c);
    (lista as Registro[]).forEach((r, i) => {
      const quem = `${ROTULO_COLECAO[c]} ${i + 1}` + (r[nome] ? ` ("${r[nome]}")` : "");
      if (!r[nome]) avisos.push(`${quem}: sem ${nome}.`);
      Object.keys(r).filter((k) => !conhecidos.has(k))
        .forEach((k) => avisos.push(`${quem}: o campo "${k}" não é desta coleção; fica gravado, mas nenhuma tela usa.`));
      for (const campo of spec.campos) {
        const v = r[campo.chave];
        if (v == null || v === "") continue;
        const opcoes = opcoesFechadas(campo);
        if (opcoes.length && !opcoes.some(([valor]) => valor === String(v))) {
          avisos.push(`${quem}: ${campo.rotulo} "${v}" não está na lista (aceitos: ${opcoes.map(([x]) => x).join(", ")}).`);
        }
        if (campo.tipo === "ref" && !idsDe(campo.fonte as ColecaoPainel).has(String(v))) avisos.push(naoExiste(quem, campo, v));
        if (campo.tipo === "multi" && Array.isArray(v)) {
          const existentes = idsDe(campo.fonte as ColecaoPainel);
          (v as unknown[]).filter((id) => !existentes.has(String(id))).forEach((id) => avisos.push(naoExiste(quem, campo, id)));
        }
      }
    });
  }
  if (avisos.length > LIMITE_AVISOS) {
    const resto = avisos.length - LIMITE_AVISOS;
    return [...avisos.slice(0, LIMITE_AVISOS), `… e mais ${resto} aviso(s).`];
  }
  return avisos;
}
