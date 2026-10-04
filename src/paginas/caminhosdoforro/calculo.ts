/* Funções puras da página: datas, dinheiro, contagem regressiva, e o que o
   cadastro, os núcleos e as tarefas precisam. As contas do funil, do orçamento
   e da grade entram com as telas delas. */
import { formatarData } from "../../utils";
import { PRIORIDADES, type Base, type Cadastro, type Cenario, type Cota, type ItemOrcamento, type Momento, type Nucleo, type Simulador, type TarefaFestival } from "./tipos";

/** Hoje em ISO (yyyy-mm-dd), no fuso local. */
export const hojeIso = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

/** "2026-12-11" → "11/12/2026"; vazio → "—". */
export const dataBr = (iso?: string | null) => (iso ? formatarData(String(iso).slice(0, 10)) : "—");

/** Dinheiro inteiro como no artefato: "R$ 45.000"; vazio ou inválido → "—". */
export const brl = (n: unknown) =>
  n == null || n === "" || isNaN(Number(n)) ? "—" : "R$ " + Math.round(Number(n)).toLocaleString("pt-BR");

/** Dias entre hoje e o primeiro dia do festival (negativo = já começou); null sem data. */
export function diasParaOFestival(inicio?: string | null): number | null {
  if (!inicio) return null;
  const [a, m, d] = String(inicio).split("-").map(Number);
  if (!a || !m || !d) return null;
  const alvo = new Date(a, m - 1, d);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
}

/** O texto da contagem regressiva da barra lateral: número em destaque e o resto. */
export function textoContagem(inicio?: string | null): { numero: string; texto: string } | null {
  const dias = diasParaOFestival(inicio);
  if (dias == null) return null;
  if (dias > 1) return { numero: String(dias), texto: "dias para o festival" };
  if (dias === 1) return { numero: "1", texto: "dia para o festival" };
  if (dias === 0) return { numero: "Hoje", texto: "começa o festival" };
  return { numero: "", texto: "Festival em andamento ou realizado" };
}

/* ══════════ cadastro ══════════ */

/** Ordem alfabética pt-BR pelo nome. */
export const porNome = (a: { nome?: string }, b: { nome?: string }) =>
  String(a.nome || "").localeCompare(String(b.nome || ""), "pt");

export const temTipo = (d: Cadastro, tipo: string) => Array.isArray(d.tipos) && d.tipos.includes(tipo);

/** Cadastros de um tipo, em ordem de nome. */
export const cadastrosDoTipo = (base: Base, tipo: string): Cadastro[] =>
  Object.values(base.cadastro).filter((d) => temTipo(d, tipo)).sort(porNome);

/** Nome pelo id; id sem cadastro avisa; vazio mostra "—". */
export const nomeCadastro = (base: Base, id: string | null | undefined) =>
  id ? (base.cadastro[id]?.nome || "(removido do cadastro)") : "—";

/** Data do último contato registrado (ISO) ou "". */
export const ultimoContato = (d: Cadastro) =>
  (d.historico || []).reduce((m, h) => (h.data && h.data > m ? h.data : m), "");

/** "Última alteração em 30/09/2026 às 21:40 por fulano@…", ou o aviso da carga inicial. */
export function auditoria(d: { atualizado?: string; atualizadoPor?: string; revisar?: boolean } | null | undefined): string {
  if (!d) return "";
  if (d.atualizadoPor && d.atualizado) {
    const dt = new Date(d.atualizado);
    return "Última alteração em " + dt.toLocaleDateString("pt-BR") + " às "
      + dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) + " por " + d.atualizadoPor;
  }
  return d.revisar ? "Veio da carga inicial e ainda não foi revisado." : "";
}

/** Onde um cadastro é usado (o que impede excluí-lo). */
export function referenciasDoCadastro(base: Base, id: string): string[] {
  const r = new Set<string>();
  Object.values(base.patrocinios).forEach((p) => { if (p.empresa === id) r.add("patrocínios"); });
  Object.values(base.parceiros).forEach((p) => { if (p.parceiro === id) r.add("parceiros institucionais"); });
  Object.values(base.slots).forEach((s) => { if ((s.participantes || []).includes(id)) r.add("grade"); });
  Object.values(base.orcamento_itens).forEach((o) => { if (o.fornecedor === id) r.add("orçamento"); });
  base.pagina.nucleos.forEach((n) => { if (n.responsavel === id || (n.membros || []).includes(id)) r.add("núcleos"); });
  Object.values(base.tarefas).forEach((t) => { if (t.responsavel === id) r.add("tarefas"); });
  Object.values(base.cadastro).forEach((c) => (c.historico || []).forEach((h) => { if (h.por === id) r.add("histórico de contatos"); }));
  return [...r];
}

/* ══════════ núcleos e tarefas ══════════ */

export const nucleo = (base: Base, id: string | null | undefined): Nucleo | null =>
  base.pagina.nucleos.find((n) => n.id === id) || null;

/** Núcleos de que a pessoa é membro. */
export const nucleosDe = (base: Base, pessoaId: string): Nucleo[] =>
  base.pagina.nucleos.filter((n) => (n.membros || []).includes(pessoaId));

/** Responsável efetivo da tarefa: o dela, senão o do núcleo. */
export const respEfetivo = (base: Base, t: TarefaFestival): string | null =>
  t.responsavel || nucleo(base, t.nucleo)?.responsavel || null;

export const tarefaAberta = (t: TarefaFestival) => t.status !== "concluido";
export const tarefaAtrasada = (t: TarefaFestival) => !!t.prazo && t.status !== "concluido" && t.prazo < hojeIso();

/** O responsável da tarefa não é mais membro do núcleo dela. */
export const foraDoNucleo = (base: Base, t: TarefaFestival) =>
  !!t.responsavel && !(nucleo(base, t.nucleo)?.membros || []).includes(t.responsavel);

/** Prioridade da tarefa (id de `PRIORIDADES`); tarefa antiga marcada como urgente conta como crítica. */
export const prioridadeDe = (t: TarefaFestival): string => t.prioridade || (t.urgente ? "critica" : "");

/** Nome da prioridade pelo id; vazio mostra "—". */
export const rotuloPrioridade = (id: string) => PRIORIDADES.find(([v]) => v === id)?.[1] || (id ? id : "—");

/** Posição da prioridade para ordenar: crítica primeiro, sem prioridade por último. */
export const pesoPrioridade = (t: TarefaFestival) => {
  const i = PRIORIDADES.findIndex(([v]) => v === prioridadeDe(t));
  return i < 0 ? PRIORIDADES.length : i;
};

/** Contagem de um conjunto de tarefas: total, abertas, concluídas, atrasadas, críticas em aberto e quantas em cada status. */
export function contarTarefas(ts: TarefaFestival[]) {
  const porStatus: Record<string, number> = {};
  ts.forEach((t) => { porStatus[t.status] = (porStatus[t.status] || 0) + 1; });
  return {
    total: ts.length,
    feitas: ts.filter((t) => !tarefaAberta(t)).length,
    abertas: ts.filter(tarefaAberta).length,
    atrasadas: ts.filter(tarefaAtrasada).length,
    criticas: ts.filter((t) => tarefaAberta(t) && prioridadeDe(t) === "critica").length,
    porStatus,
  };
}

/** Contagem de tarefas do núcleo ("_sem" = sem núcleo). */
export const contasNucleo = (base: Base, nucleoId: string) =>
  contarTarefas(Object.values(base.tarefas).filter((t) => (t.nucleo || "_sem") === nucleoId));

/* ══════════ patrocínios e cotas ══════════ */

/** Posição da etapa no funil (-1 = não está na lista). */
export const indiceEtapa = (base: Base, id: string) => base.pagina.listas.etapasFunil.findIndex((e) => e.id === id);

/** Para ordenar: etapa fora da lista vai para o fim. */
export const ordemEtapa = (base: Base, id: string) => { const i = indiceEtapa(base, id); return i < 0 ? 99 : i; };

/** Totais do funil e das cotas: confirmado; em negociação (tudo menos perdido e confirmado); dessa parte, o que já tem proposta enviada; inventário (valor × quantidade das cotas). */
export function totaisPatrocinio(base: Base) {
  const iProposta = indiceEtapa(base, "proposta_enviada");
  let emNegociacao = 0, confirmado = 0, comProposta = 0;
  for (const p of Object.values(base.patrocinios)) {
    const v = Number(p.valor) || 0;
    if (p.etapa === "perdido") continue;
    if (p.etapa === "confirmado") { confirmado += v; continue; }
    emNegociacao += v;
    if (iProposta >= 0 && indiceEtapa(base, p.etapa) >= iProposta) comProposta += v;
  }
  const inventario = Object.values(base.cotas).reduce((t, c) => t + (Number(c.valor) || 0) * (Number(c.quantidade) || 0), 0);
  return { emNegociacao, confirmado, comProposta, inventario };
}

/** Cotas na ordem definida (depois por nome). */
export const cotasOrdenadas = (base: Base): Cota[] =>
  Object.values(base.cotas).sort((a, b) => (a.ordem || 99) - (b.ordem || 99) || porNome(a, b));

/** Quantos patrocínios confirmados usam cada cota. */
export function vendidasPorCota(base: Base): Record<string, number> {
  const r: Record<string, number> = {};
  for (const p of Object.values(base.patrocinios)) if (p.etapa === "confirmado" && p.cota) r[p.cota] = (r[p.cota] || 0) + 1;
  return r;
}

export const nomeCota = (base: Base, id: string | null | undefined) => (id && base.cotas[id] ? base.cotas[id].nome : "—");

/* ══════════ orçamento e simulador ══════════ */

/** Premissas do simulador, herdadas do documento de trabalho: bar próprio tem custo fixo de R$ 14.800 e
    custo variável de 39% da receita; concessão rende 22% da receita bruta; 70% do público adere à colaboração. */
export const BAR_FIXO = 14800;
export const BAR_VARIAVEL = 0.39;
export const BAR_CONCESSAO = 0.22;
export const ADESAO = 0.7;
export const MOMENTOS: Momento[] = ["pre", "mont", "d1", "d2", "d3", "pos"];
export const CENARIOS: [Cenario, string][] = [["E", "Essencial"], ["I", "Ideal"], ["X", "Expandido"]];
export const rotuloCenario = (c: string) => CENARIOS.find((x) => x[0] === c)?.[1] || c;

/** Cores das fatias dos gráficos (as da marca e derivadas), a da contingência e a do "sem categoria". */
export const CORES = ["#8B3226", "#E55B28", "#E0D24A", "#2A96A7", "#5E2219", "#F29A6B", "#A89B2E", "#1C6D7A", "#C9775E", "#C9C06A", "#7CC3CE", "#B8A99A", "#6B4A3F"];
export const COR_CONTINGENCIA = "#CFC3B2";
export const COR_SEM = "#9C8F84";

/** Quantas vezes o item entra: num momento só, ou somando todos. */
export const vezesItem = (it: ItemOrcamento, so?: Momento | "") =>
  so ? (Number(it.distribuicao?.[so]) || 0) : MOMENTOS.reduce((t, k) => t + (Number(it.distribuicao?.[k]) || 0), 0);

/** Quantidade × vezes × unitário do cenário. */
export const valorItem = (it: ItemOrcamento, cenario: Cenario, so?: Momento | "") =>
  (Number(it.quantidade) || 0) * vezesItem(it, so) * (Number(it.unitario?.[cenario]) || 0);

/** "12,5%" de v sobre t. */
export const pctTexto = (v: number, t: number) => (t ? (Math.round((v / t) * 1000) / 10).toLocaleString("pt-BR") + "%" : "0%");

export interface ContaOrcamento {
  p: Simulador; cenario: Cenario;
  subtotal: number; contingencia: number; despesas: number; confirmado: number;
  porCategoria: Record<string, number>; porNucleo: Record<string, number>;
  pessoas: number; receitaBar: number; bar: number; barProprio: number; barConcessao: number;
  colaboracao: number; gastronomia: number; cotas: number; cotasConfirmadas: number;
  receitas: number; saldo: number;
}

/** A conta do orçamento no cenário atual: despesas por categoria e núcleo, contingência, receitas do simulador e o saldo. */
export function calcularOrcamento(base: Base): ContaOrcamento {
  const p = base.pagina.simulador;
  const cenario = p.cenario;
  let subtotal = 0, confirmado = 0;
  const porCategoria: Record<string, number> = {}, porNucleo: Record<string, number> = {};
  for (const it of Object.values(base.orcamento_itens)) {
    const v = valorItem(it, cenario);
    subtotal += v;
    if (it.status === "confirmado") confirmado += v;
    const c = it.categoria || "_sem", n = it.nucleo || "_sem";
    porCategoria[c] = (porCategoria[c] || 0) + v;
    porNucleo[n] = (porNucleo[n] || 0) + v;
  }
  const contingencia = (subtotal * (Number(p.contingencia) || 0)) / 100;
  const despesas = subtotal + contingencia;
  const pessoas = (Number(p.publico) || 0) * 3;
  const receitaBar = pessoas * (Number(p.ticket) || 0);
  const barProprio = Math.max(0, receitaBar - (receitaBar * BAR_VARIAVEL + BAR_FIXO));
  const barConcessao = receitaBar * BAR_CONCESSAO;
  const bar = p.bar === "proprio" ? barProprio : p.bar === "concessao" ? barConcessao : 0;
  const colaboracao = pessoas * (Number(p.colab) || 0) * ADESAO;
  const gastronomia = Number(p.gastro) || 0;
  const cotasConfirmadas = totaisPatrocinio(base).confirmado;
  const cotas = p.cotasModo === "manual" ? (Number(p.cotasManual) || 0) : cotasConfirmadas;
  const receitas = cotas + bar + colaboracao + gastronomia;
  return {
    p, cenario, subtotal, contingencia, despesas, confirmado, porCategoria, porNucleo,
    pessoas, receitaBar, bar, barProprio, barConcessao, colaboracao, gastronomia, cotas, cotasConfirmadas,
    receitas, saldo: receitas - despesas,
  };
}
