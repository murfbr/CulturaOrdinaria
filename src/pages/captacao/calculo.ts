/* As contas da Captação, todas puras (recebem as listas, devolvem números):
   comissão, conflitos, reserva, totais do resumo, inventário de cotas,
   próximos passos e o escopo da visão "Ver como". As telas só aplicam.
   Importa só de types/captacao para poder ser conferido fora do site. */
import type { CotaCaptacao, Empresa, Negociacao, ProjetoCaptacao } from "../../types/captacao";
import {
  BASE_SOBRE_FECHADO, BASE_SOBRE_RECEBIDO, ETAPA_CONFIRMADO, ETAPA_PERDIDO, ETAPAS_COM_PROPOSTA, SITUACAO_ABERTO,
} from "../../types/captacao";

/** Número do registro: "" e null são "em branco". */
export const numero = (v: unknown): number | null =>
  v === "" || v == null || typeof v === "boolean" || isNaN(Number(v)) ? null : Number(v);

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
/** R$ sem centavos; em branco vira traço. */
export const brl = (v: unknown): string => { const n = numero(v); return n == null ? "—" : fmt.format(n); };

export const aberta = (n: Negociacao) => n.etapa !== ETAPA_CONFIRMADO && n.etapa !== ETAPA_PERDIDO;
export const confirmada = (n: Negociacao) => n.etapa === ETAPA_CONFIRMADO;

/** Soma dias a uma data ISO. */
export function somaDias(iso: string, dias: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

/* ══════════ escopo da visão "Ver como" ══════════ */

/** Entra nas contas da visão: tudo, ou só o que está com a captadora escolhida. */
export const noEscopo = (n: Negociacao, comoId: string) => !comoId || n.captadoraId === comoId;

/** De outra captadora: na visão de uma captadora, mostra só que a conversa existe. */
export const restrita = (n: Negociacao, comoId: string) =>
  Boolean(comoId && n.captadoraId && n.captadoraId !== comoId);

/** Na visão de uma captadora, a empresa em conversa só com outras fica fechada. */
export function empresaFechada(empresaId: string, negociacoes: Negociacao[], comoId: string): Negociacao | undefined {
  if (!comoId) return undefined;
  const da = negociacoes.filter((n) => n.empresaId === empresaId);
  if (da.some((n) => n.captadoraId === comoId)) return undefined;
  return da.find((n) => n.etapa !== ETAPA_PERDIDO && n.captadoraId && n.captadoraId !== comoId);
}

/* ══════════ comissão ══════════ */

export interface Comissao { valor: number | null; estimada: boolean; pct: number | null }

/** Comissão de uma negociação confirmada com captadora; null quando não há comissão. */
export function comissao(n: Negociacao, projeto: ProjetoCaptacao | undefined): Comissao | null {
  if (!confirmada(n) || !n.captadoraId) return null;
  const pct = numero(n.comissaoPct) ?? numero(projeto?.comissaoPct);
  if (pct == null) return { valor: null, estimada: true, pct: null };
  const recebido = numero(n.valorRecebido);
  if (projeto?.comissaoBase === BASE_SOBRE_RECEBIDO && recebido != null) return { valor: recebido * pct / 100, estimada: false, pct };
  return { valor: (numero(n.valor) || 0) * pct / 100, estimada: projeto?.comissaoBase !== BASE_SOBRE_FECHADO, pct };
}

/* ══════════ conflito e reserva ══════════ */

/** Outras captadoras na mesma empresa e projeto (fora as perdidas). */
export function conflitos(n: Negociacao, todas: Negociacao[]): Negociacao[] {
  if (!n.captadoraId || n.etapa === ETAPA_PERDIDO) return [];
  return todas.filter((o) => o.id !== n.id && o.empresaId === n.empresaId && o.projetoId === n.projetoId
    && o.etapa !== ETAPA_PERDIDO && o.captadoraId && o.captadoraId !== n.captadoraId);
}

export const reservaAtiva = (n: Negociacao, hoje: string) => Boolean(n.reservaAte && n.reservaAte >= hoje);

/** Avisos ao editar uma negociação: quem mais está nessa empresa e projeto, e reservas. */
export function avisosDaNegociacao(
  r: Negociacao, todas: Negociacao[], hoje: string, nomeCaptadora: (id: string) => string, nomeEtapa: (id: string) => string, dataBr: (iso: string) => string,
): string[] {
  if (!r.empresaId || !r.projetoId) return [];
  const msgs: string[] = [];
  todas.filter((o) => o.id !== r.id && o.empresaId === r.empresaId && o.projetoId === r.projetoId && o.etapa !== ETAPA_PERDIDO).forEach((o) => {
    if (o.captadoraId && o.captadoraId !== r.captadoraId) msgs.push(`${nomeCaptadora(o.captadoraId)} já está em conversa com esta empresa neste projeto (${nomeEtapa(o.etapa)}).`);
    else if (o.captadoraId === r.captadoraId) msgs.push(`Já existe uma negociação de ${nomeCaptadora(o.captadoraId)} com esta empresa neste projeto.`);
    if (reservaAtiva(o, hoje) && o.captadoraId !== r.captadoraId) msgs.push(`Reservado para ${nomeCaptadora(o.captadoraId)} até ${dataBr(o.reservaAte)}.`);
  });
  return msgs;
}

/* ══════════ totais ══════════ */

export interface Totais {
  confirmado: number; negociando: number; proposta: number; abertas: number;
  aPagar: number; estimada: boolean; semPct: number; paga: number;
}

/** Os totais de um conjunto de negociações (já filtrado pelo escopo ou pelo projeto). */
export function totais(negociacoes: Negociacao[], projetos: ProjetoCaptacao[]): Totais {
  const porId = new Map(projetos.map((p) => [p.id, p]));
  const t: Totais = { confirmado: 0, negociando: 0, proposta: 0, abertas: 0, aPagar: 0, estimada: false, semPct: 0, paga: 0 };
  for (const n of negociacoes) {
    const valor = numero(n.valor) || 0;
    if (confirmada(n)) t.confirmado += valor;
    else if (n.etapa !== ETAPA_PERDIDO) {
      t.negociando += valor; t.abertas++;
      if (ETAPAS_COM_PROPOSTA.includes(n.etapa)) t.proposta += valor;
    }
    const c = comissao(n, porId.get(n.projetoId));
    if (c) {
      if (c.valor == null) t.semPct++;
      else if (n.comissaoPaga) t.paga += c.valor;
      else { t.aPagar += c.valor; if (c.estimada) t.estimada = true; }
    }
  }
  return t;
}

export const projetosAbertos = (projetos: ProjetoCaptacao[]) => projetos.filter((p) => p.situacao === SITUACAO_ABERTO);

/** Valor × quantidade das cotas com os dois preenchidos. */
export const inventarioDoProjeto = (cotas: CotaCaptacao[], projetoId: string) =>
  cotas.filter((c) => c.projetoId === projetoId)
    .reduce((s, c) => { const v = numero(c.valor), q = numero(c.quantidade); return s + (v && q ? v * q : 0); }, 0);

/** Inventário de cotas dos projetos abertos. */
export const inventario = (cotas: CotaCaptacao[], projetos: ProjetoCaptacao[]) =>
  projetosAbertos(projetos).reduce((s, p) => s + inventarioDoProjeto(cotas, p.id), 0);

export const metaDosAbertos = (projetos: ProjetoCaptacao[]) =>
  projetosAbertos(projetos).reduce((s, p) => s + (numero(p.meta) || 0), 0);

/** Quantas negociações confirmadas há nesta cota. */
export const vendidas = (cotaId: string, negociacoes: Negociacao[]) =>
  negociacoes.filter((n) => n.cotaId === cotaId && confirmada(n)).length;

export const cotasDoProjeto = (cotas: CotaCaptacao[], projetoId: string) =>
  cotas.filter((c) => c.projetoId === projetoId).sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0) || a.nome.localeCompare(b.nome, "pt-BR"));

/* ══════════ próximos passos ══════════ */

/** Negociações abertas com próximo passo datado até `dias` dias, e quantas têm passo sem data. */
export function proximosPassos(negociacoes: Negociacao[], hoje: string, dias = 7): { comData: Negociacao[]; semData: number; ate: string } {
  const ate = somaDias(hoje, dias);
  const abertas = negociacoes.filter(aberta);
  return {
    comData: abertas.filter((n) => n.dataProximo && n.dataProximo <= ate).sort((a, b) => a.dataProximo.localeCompare(b.dataProximo)),
    semData: abertas.filter((n) => n.proximoPasso && !n.dataProximo).length,
    ate,
  };
}

/* ══════════ empresas ══════════ */

/** Texto para comparar: minúsculas, sem acento, só letras e números. */
export const normalizar = (s: unknown) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

/** Empresa que parece a mesma: CNPJ igual ou nome contido no outro (3+ caracteres). */
export function duplicidadeEmpresa(candidata: { id?: string; nome: string; cnpj?: string }, empresas: Empresa[]): Empresa | undefined {
  const cnpj = normalizar(candidata.cnpj), nome = normalizar(candidata.nome);
  return empresas.find((e) => e.id !== candidata.id && (
    (cnpj && normalizar(e.cnpj) === cnpj)
    || (nome.length >= 3 && (normalizar(e.nome).includes(nome) || nome.includes(normalizar(e.nome))))
  ));
}
