/* Cálculo da festa: as funções do script do artefato "Ponta de Lança",
   iguais, agora puras sobre o Painel. Nada aqui grava; as telas chamam e
   mostram. Formatação de dinheiro, número e data também mora aqui. */
import { uid } from "../../utils";
import { ROTULO_STATUS_EDICAO, type Contato, type ResumoEdicao, type Tarefa } from "../../types";
import type { Custo, Edicao, Painel, Simulacao, Socio, StatusCusto } from "./tipos";

export { ROTULO_STATUS_EDICAO };
export const ROTULO_STATUS_CUSTO: Record<StatusCusto, string> = { previsto: "previsto", contratado: "contratado", pago: "pago" };
export const ORDEM_STATUS_CUSTO: StatusCusto[] = ["previsto", "contratado", "pago"];

/* ══════════ formatação ══════════ */

type Numero = number | null | undefined;
const invalido = (n: Numero): n is null | undefined => n == null || isNaN(n);

/** Dinheiro inteiro: "R$ 57.342" ("−R$ 3.156" quando negativo). */
export const R = (n: Numero): string =>
  invalido(n) ? "—" : (n < 0 ? "−" : "") + "R$ " + Math.round(Math.abs(n)).toLocaleString("pt-BR");

/** Dinheiro com centavos: "R$ 30,82". */
export const R2 = (n: Numero): string =>
  invalido(n) ? "—" : (n < 0 ? "−" : "") + "R$ " + Math.abs(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Inteiro com separador de milhar: "1.700". */
export const N = (n: Numero): string => (invalido(n) ? "—" : Math.round(n).toLocaleString("pt-BR"));

/** Texto de input → número, ou null quando vazio ou inválido. */
export const num = (v: unknown): number | null =>
  (v === "" || v == null || isNaN(Number(v))) ? null : Number(v);

/** Diferença com sinal: "+R$ 1.200", "−R$ 300". */
export const comSinal = (d: number): string => (d > 0 ? "+" : "") + R(d);

/** Variação percentual de `a` sobre `b` (null quando `b` é zero). */
export const pct = (a: number, b: number): number | null => (b ? ((a - b) / b) * 100 : null);

/** Hoje em ISO local (yyyy-mm-dd), sem a armadilha de fuso do toISOString. */
export function hojeIso(): string {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

const partesIso = (iso?: string) => /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");

/** "2026-10-03" → "03/10". */
export const br = (iso?: string): string => { const m = partesIso(iso); return m ? m[3] + "/" + m[2] : iso || ""; };

/** "2026-10-03" → "03/10/2026". */
export const brCompleta = (iso?: string): string => { const m = partesIso(iso); return m ? m[3] + "/" + m[2] + "/" + m[1] : iso || ""; };

/** Dias de hoje até a data (negativo = já passou); null sem data. */
export function diasAte(iso?: string): number | null {
  if (!iso) return null;
  const a = new Date(iso + "T12:00:00").getTime();
  const b = new Date(hojeIso() + "T12:00:00").getTime();
  return Math.round((a - b) / 86400000);
}

export const soma = <T,>(lista: T[], f: (x: T) => unknown): number =>
  lista.reduce((acc, x) => acc + (Number(f(x)) || 0), 0);

export const rotuloFase = (painel: Painel, id: string): string =>
  painel.presets.fases.find((f) => f.id === id)?.label || id;

/** Tarefas de uma edição (coleção `tarefas`, campo `edicaoId`). */
export const tarefasDaEdicao = (painel: Painel, e: Edicao): Tarefa[] =>
  painel.tarefas.filter((t) => t.edicaoId === e.id);

/** Contatos do tipo Fornecedor (coleção `contatos`). */
export const fornecedores = (painel: Painel): Contato[] =>
  painel.contatos.filter((c) => c.tipo === "Fornecedor");

/** Nome do fornecedor de uma linha de custo: o do cadastro, quando vinculado; senão o texto. */
export const nomeFornecedor = (painel: Painel, c: Custo): string =>
  (c.contatoId && painel.contatos.find((x) => x.id === c.contatoId)?.nome) || c.fornecedor || "";

/* ══════════ custos ══════════ */

/** Previsto de um item = quantidade × unitário. */
export const previsto = (c: Custo): number => (Number(c.qtd) || 0) * (Number(c.unit) || 0);

/** Realizado quando há; senão o previsto. */
export const valor = (c: Custo): number => (c.realizado != null ? c.realizado : previsto(c));

/** Repasse (comida): entra igual em receita e despesa, não é custo de verdade. */
export const ehRepasse = (c: Custo): boolean => /repasse/i.test(c.item || "") || /repasse/i.test(c.obs || "");

/**
 * Regra do pago: pagar é o dinheiro sair, então o realizado é o orçado
 * (quantidade × unitário), preenchido sozinho, salvo exceção já informada no
 * editar. Ao deixar de ser pago, o realizado preenchido sozinho (igual ao
 * orçado) é apagado; um valor diferente, digitado como exceção, fica.
 * Recebe a linha com o status ANTIGO e devolve a linha com o novo.
 */
export function aplicarStatusCusto(linha: Custo, status: StatusCusto): Custo {
  const c: Custo = { ...linha, status };
  const orcado = previsto(linha);
  if (status === "pago" && linha.realizado == null) {
    c.realizado = orcado;
    c.qtdReal = linha.qtd;
    c.unitReal = linha.unit;
  } else if (status !== "pago" && linha.status === "pago" && linha.realizado != null && linha.realizado === orcado) {
    c.realizado = null;
    delete c.qtdReal;
    delete c.unitReal;
  }
  return c;
}

const chave = (s: string) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

/** Última edição fechada antes desta (base da comparação e da simulação). */
export const edicaoAnterior = (painel: Painel, e: Edicao): Edicao | null =>
  painel.edicoes.filter((x) => x.status === "fechada" && x.num < e.num).sort((a, b) => b.num - a.num)[0] || null;

/** O item da edição anterior que corresponde a este: pela referência ou pelo nome. */
export function casarItem(c: Custo, anterior: Edicao | null): Custo | null {
  if (!anterior) return null;
  return (c.ref && anterior.custos.find((x) => x.id === c.ref))
    || anterior.custos.find((x) => chave(x.item) === chave(c.item))
    || null;
}

/** "Último preço" de um fornecedor: o realizado das linhas dele na última edição fechada. Nunca digitado. */
export function ultimoPreco(painel: Painel, contatoId: string): { valor: number; edicao: Edicao } | null {
  const fechadas = painel.edicoes.filter((e) => e.status === "fechada").sort((a, b) => b.num - a.num);
  for (const e of fechadas) {
    const linhas = e.custos.filter((c) => c.contatoId === contatoId && c.realizado != null);
    if (linhas.length) return { valor: soma(linhas, (c) => c.realizado), edicao: e };
  }
  return null;
}

/* ══════════ pagamentos ══════════ */

export interface TotaisStatus {
  /** Soma de quantidade × unitário. */
  previsto: number;
  /** Linhas contratadas ou pagas. */
  contratado: number;
  pago: number;
  /** contratado − pago. */
  aPagar: number;
  /** Linhas ainda só previstas (sem contrato). */
  emAberto: number;
  /** Soma do realizado informado. */
  realizado: number;
  itens: Record<StatusCusto, number>;
}

/**
 * A matemática do orçamento por status. O valor de cada linha é o realizado
 * quando informado, senão o previsto. Contratado inclui os pagos; a pagar é
 * contratado − pago; em aberto é o que ainda não foi contratado.
 */
export function totaisPorStatus(e: Edicao): TotaisStatus {
  const itens: Record<StatusCusto, number> = { previsto: 0, contratado: 0, pago: 0 };
  let contratado = 0;
  let pago = 0;
  let emAberto = 0;
  for (const c of e.custos) {
    const s: StatusCusto = ORDEM_STATUS_CUSTO.includes(c.status) ? c.status : "previsto";
    itens[s]++;
    const v = valor(c);
    if (s === "pago") { pago += v; contratado += v; }
    else if (s === "contratado") contratado += v;
    else emAberto += v;
  }
  return {
    previsto: soma(e.custos, previsto), contratado, pago, aPagar: contratado - pago, emAberto,
    realizado: soma(e.custos, (c) => c.realizado), itens,
  };
}

/* ══════════ resultado da edição ══════════ */

export interface Receita { bar: number | null; porta: number | null; comida: number | null; sympla: number | null }

export interface Calculo {
  fechada: boolean;
  anterior: Edicao | null;
  calcAnterior: Calculo | null;
  /** Alavancas em uso (só edição não fechada). */
  sim: Simulacao | null;
  rec: Receita;
  receita: number;
  /** Custos fixos: realizado (fechada) ou previsto. */
  operacao: number;
  bebida: number;
  bebidaPct: number | null;
  comissao: number;
  taxa: number;
  despesa: number;
  resultado: number;
  porSocio: number;
  previstoTotal: number;
  /** Receita de bar que zera o resultado (só na simulação). */
  equilibrioBar: number | null;
}

/**
 * Fechada: receita informada, custos realizados, bebida líquida. Não fechada:
 * receita = público × tickets, custos previstos, bebida por % do bar (herdada
 * da última fechada). Comissão sobre a base (ou o bar), taxa sobre a receita.
 */
export function calcular(painel: Painel, e: Edicao): Calculo {
  const fechada = e.status === "fechada";
  const v = e.variaveis || ({} as Edicao["variaveis"]);
  const anterior = fechada ? null : edicaoAnterior(painel, e);
  const calcAnterior = anterior ? calcular(painel, anterior) : null;
  let rec: Receita;
  let bebida: number;
  let bebidaPct: number | null = null;
  let sim: Simulacao | null = null;
  if (fechada) {
    rec = e.receitas || { bar: null, porta: null, comida: null, sympla: null };
    bebida = v.bebida || 0;
  } else {
    sim = e.sim || { publico: null, ticketBar: null, ticketPorta: null, obs: "" };
    const pub = Number(sim.publico) || 0;
    rec = {
      bar: pub * (Number(sim.ticketBar) || 0),
      porta: pub * (Number(sim.ticketPorta) || 0),
      comida: soma(e.custos.filter(ehRepasse), valor),
      sympla: 0,
    };
    bebidaPct = v.bebidaPct != null ? v.bebidaPct
      : (calcAnterior && calcAnterior.rec.bar ? (calcAnterior.bebida / calcAnterior.rec.bar) * 100 : 0);
    bebida = v.bebida != null ? v.bebida : ((rec.bar || 0) * bebidaPct) / 100;
  }
  const receita = soma(["bar", "porta", "comida", "sympla"] as const, (k) => rec[k]);
  const operacao = fechada ? soma(e.custos, (c) => c.realizado) : soma(e.custos, valor);
  const base = fechada && v.comissaoBase != null ? v.comissaoBase : (rec.bar || 0);
  const comissao = (base * (v.comissaoPct || 0)) / 100;
  const taxa = (receita * (v.taxaPct || 0)) / 100;
  const despesa = operacao + bebida + comissao + taxa;
  const resultado = receita - despesa;
  let equilibrioBar: number | null = null;
  if (!fechada) {
    const f = 1 - (bebidaPct || 0) / 100 - (v.comissaoPct || 0) / 100 - (v.taxaPct || 0) / 100;
    const outras = (rec.porta || 0) + (rec.comida || 0);
    if (f > 0) equilibrioBar = (operacao - outras + (outras * (v.taxaPct || 0)) / 100) / f;
  }
  return {
    fechada, anterior, calcAnterior, sim, rec, receita, operacao, bebida, bebidaPct, comissao, taxa,
    despesa, resultado,
    porSocio: resultado / (painel.pagina.socios.length || 1),
    previstoTotal: soma(e.custos, previsto),
    equilibrioBar,
  };
}

export interface LinhaAcerto { socio: Socio; pagou: number; devido: number; saldo: number }

/** Saldo de cada sócio = o que adiantou do próprio bolso + a parte dele no resultado. */
export function acerto(painel: Painel, e: Edicao): LinhaAcerto[] {
  const k = calcular(painel, e);
  return painel.pagina.socios.map((s) => {
    const pagou = soma(
      e.custos.filter((c) => c.adiantadoPor === s.id && (k.fechada || c.status === "pago")),
      (c) => (k.fechada ? c.realizado : valor(c)),
    );
    return { socio: s, pagou, devido: k.porSocio, saldo: pagou + k.porSocio };
  });
}

/** Os totais que a Central recebe (Projeto.resumoEdicoes): arredondados a centavos, sem carimbo de tempo. */
export function resumoDaEdicao(painel: Painel, e: Edicao): ResumoEdicao {
  const k = calcular(painel, e);
  const t = totaisPorStatus(e);
  const centavos = (n: number) => Math.round(n * 100) / 100;
  return {
    id: e.id, nome: e.nome, data: e.data || "", status: e.status,
    previsto: centavos(t.previsto), contratado: centavos(t.contratado), pago: centavos(t.pago),
    realizado: centavos(t.realizado), receita: centavos(k.receita), resultado: centavos(k.resultado),
  };
}

/* ══════════ indicadores (comparativo) ══════════ */

export type Kpi = [nome: string, valor: number | null];

/** Os indicadores de uma edição, na ordem do comparativo. */
export function kpis(painel: Painel, e: Edicao): Kpi[] {
  const k = calcular(painel, e);
  const p = e.kpis || ({} as Edicao["kpis"]);
  const pub = k.fechada ? (p.publico || null) : (Number(e.sim?.publico) || null);
  const ou = (x: Numero): number | null => (x == null ? null : x);
  return [
    ["Receita total", k.receita],
    ["Despesa total", k.despesa],
    ["Resultado", k.resultado],
    ["Resultado por sócio", k.porSocio],
    ["Público", pub],
    ["Retiradas Sympla", ou(p.retiradas)],
    ["Comparecimento", pub && p.retiradas ? (pub / p.retiradas) * 100 : null],
    ["Receita por presente", pub ? k.receita / pub : null],
    ["Ticket de bar por presente", pub ? (k.rec.bar || 0) / pub : null],
    ["Porta por presente", pub ? (k.rec.porta || 0) / pub : null],
    ["Custo de operação por presente", pub ? k.operacao / pub : null],
    ["ADS por retirada", p.ads && p.retiradas ? p.ads / p.retiradas : null],
    ["E-mails na base", ou(p.emails)],
  ];
}

/** Como cada indicador é exibido (o padrão é dinheiro inteiro). */
export const FORMATO_KPI: Record<string, (v: Numero) => string> = {
  Comparecimento: (v) => (v == null ? "—" : v.toFixed(0) + "%"),
  "Público": N, "Retiradas Sympla": N, "E-mails na base": N,
  "Receita por presente": R2, "Ticket de bar por presente": R2, "Porta por presente": R2,
  "Custo de operação por presente": R2, "ADS por retirada": R2,
};

/** 1 = quanto maior melhor; −1 = quanto menor melhor. Sem entrada = não compara. */
export const MELHOR_KPI: Record<string, 1 | -1> = {
  "Receita total": 1, Resultado: 1, "Resultado por sócio": 1, "Público": 1, "Retiradas Sympla": 1,
  Comparecimento: 1, "Receita por presente": 1, "Ticket de bar por presente": 1, "Porta por presente": 1,
  "E-mails na base": 1, "Despesa total": -1, "Custo de operação por presente": -1, "ADS por retirada": -1,
};

/* ══════════ nova edição ══════════ */

/**
 * A próxima edição herda a última: o realizado vira previsto (item a item,
 * com referência para a comparação), cronograma, máquinas (zeradas), plano de
 * comunicação (sem datas), percentuais. As tarefas nascem do checklist-mestre
 * já como tarefas da Central, ligadas ao projeto e à edição.
 */
export function criarProximaEdicao(painel: Painel): { edicao: Edicao; tarefas: Tarefa[] } {
  const src = painel.edicoes[painel.edicoes.length - 1];
  const n = (src ? src.num : 0) + 1;
  const numero = String(n).padStart(2, "0");
  let sim: Simulacao = { publico: null, ticketBar: null, ticketPorta: null, obs: "" };
  if (src) {
    const sk = calcular(painel, src);
    const pub = sk.fechada ? (src.kpis?.publico || 0) : (Number(src.sim?.publico) || 0);
    sim = {
      publico: pub || null,
      ticketBar: pub ? +((sk.rec.bar || 0) / pub).toFixed(2) : null,
      ticketPorta: pub ? +((sk.rec.porta || 0) / pub).toFixed(2) : null,
      obs: "Ponto de partida: números de " + src.nome + ".",
    };
  }
  const edicao: Edicao = {
    id: "e" + numero, paginaId: painel.pagina.id, num: n, nome: "Edição " + numero, data: "", diaSemana: "", status: "planejada",
    horario: src ? src.horario : "", local: src ? src.local : painel.pagina.local, lineup: src ? src.lineup : "",
    receitas: { bar: null, porta: null, comida: null, sympla: null },
    sim,
    variaveis: {
      bebida: null, bebidaPct: null, bebidaObs: "",
      comissaoPct: src ? src.variaveis.comissaoPct : 8, comissaoBase: null,
      taxaPct: src ? src.variaveis.taxaPct : 3.5,
    },
    kpis: { publico: null, retiradas: null, visitas: null, emails: null, checkin: null, ads: src ? (src.kpis?.ads ?? null) : null },
    curva: [],
    custos: src ? src.custos.filter((c) => valor(c) > 0).map((c) => ({
      id: uid("c"), ref: c.id, cat: c.cat, item: c.item,
      qtd: c.qtdReal != null ? c.qtdReal : c.qtd,
      unit: c.unitReal != null ? c.unitReal : (c.realizado != null && c.qtd ? +(c.realizado / c.qtd).toFixed(2) : c.unit),
      realizado: null, fornecedor: c.fornecedor, contatoId: c.contatoId, adiantadoPor: "", status: "previsto" as StatusCusto, venc: "", obs: "",
    })) : [],
    cronograma: src ? src.cronograma.map((r) => ({ ...r })) : [],
    cronogramaObs: src ? "Herdado de " + src.nome + ". Ajustar." : "",
    maquinas: src ? src.maquinas.map((m) => ({ ...m, vendas: null, fontes: "" })) : [],
    maquinasObs: src ? "Herdado de " + src.nome + "." : "",
    comunicacao: src ? src.comunicacao.map((r) => ({ ...r, data: "" })) : [],
    comunicacaoObs: "Peças herdadas; recalcular datas por D-x.",
    balanco: { certo: [], errado: [] }, instagram: "", acertoObs: "", arquivos: [], notas: "",
  };
  const tarefas: Tarefa[] = painel.pagina.checklist.map((m) => ({
    id: uid("t"), titulo: m.tarefa, respId: m.respId || "", origem: "proj:" + painel.pagina.projetoId,
    prazo: "", obs: m.obs ? "Checklist-mestre · " + m.obs : "Checklist-mestre", status: "fazer",
    edicaoId: edicao.id, fase: m.fase,
  }));
  return { edicao, tarefas };
}
