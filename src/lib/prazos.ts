/* Urgência de prazos: junta editais com data, tarefas com prazo e reuniões
   agendadas numa lista única classificada (vencido, hoje, ≤3 dias, ≤7 dias).
   Funções puras sobre DadosPainel — a mesma classificação vai servir ao
   resumo por e-mail quando o backend existir. */
import type { AlertaEdital, DadosPainel, Edital, StatusEdital } from "../types";

export type Urgencia = "vencido" | "hoje" | "d3" | "d7" | "futuro";

export interface ItemPrazo {
  iso: string;
  tipo: "edital" | "tarefa" | "reuniao";
  id: string;
  titulo: string;
  /** Complemento: projetos ligados, responsável, hora... */
  detalhe: string;
  urgencia: Urgencia;
}

/** Data local de hoje em ISO (yyyy-mm-dd) — sem a armadilha de fuso do toISOString. */
export function hojeIso(): string {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

/** Dias corridos entre hoje e a data (negativo = já passou). Meio-dia evita horário de verão. */
const diasAte = (iso: string, hoje: string) =>
  Math.round((new Date(iso + "T12:00:00").getTime() - new Date(hoje + "T12:00:00").getTime()) / 86400000);

export function urgenciaDe(iso: string, hoje = hojeIso()): Urgencia {
  const d = diasAte(iso, hoje);
  if (d < 0) return "vencido";
  if (d === 0) return "hoje";
  if (d <= 3) return "d3";
  if (d <= 7) return "d7";
  return "futuro";
}

/* ══════════ Prazos e alertas que envelhecem ══════════
   O status do edital é um dado que alguém precisa lembrar de mudar. Enquanto
   ninguém muda, a tela deduz: edital "Aberto" com prazo passado aparece como
   encerrado, e alerta com data passada sai das listas (continua na ficha). */

/** Edital marcado "Aberto" cujo prazo já passou. */
export const prazoEncerrado = (e: Edital, hoje = hojeIso()): boolean =>
  e.status === "open" && Boolean(e.prazoIso) && (e.prazoIso as string) < hoje;

/** Status para exibir e agrupar: "Aberto" com prazo passado conta como encerrado. */
export const statusEfetivo = (e: Edital, hoje = hojeIso()): StatusEdital =>
  prazoEncerrado(e, hoje) ? "closed" : e.status;

/** Última data de um alerta: `ate`, ou a maior data dd/mm(/aaaa) escrita em `quando`. */
export function dataDoAlerta(a: AlertaEdital, e?: Edital): string {
  if (a.ate) return a.ate;
  const anoBase = (e?.prazoIso || hojeIso()).slice(0, 4);
  let maior = "";
  for (const m of (a.quando || "").matchAll(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g)) {
    const dia = Number(m[1]); const mes = Number(m[2]);
    if (!dia || dia > 31 || !mes || mes > 12) continue;
    const ano = m[3] ? (m[3].length === 2 ? "20" + m[3] : m[3]) : anoBase;
    const iso = ano + "-" + String(mes).padStart(2, "0") + "-" + String(dia).padStart(2, "0");
    if (iso > maior) maior = iso;
  }
  return maior;
}

/** Alerta cuja data já passou (sem data nenhuma, nunca vence sozinho). */
export function alertaVencido(a: AlertaEdital, e?: Edital, hoje = hojeIso()): boolean {
  const d = dataDoAlerta(a, e);
  return Boolean(d) && d < hoje;
}

/** Alertas ainda valendo de um edital. */
export const alertasVigentes = (e: Edital, hoje = hojeIso()): AlertaEdital[] =>
  (e.alertas || []).filter((a) => !alertaVencido(a, e, hoje));

export const ROTULO_URGENCIA: Record<Urgencia, string> = {
  vencido: "venceu", hoje: "é hoje", d3: "≤ 3 dias", d7: "≤ 7 dias", futuro: "",
};

export const CLASSE_URGENCIA: Record<Urgencia, string> = {
  vencido: "ur-vencido", hoje: "ur-hoje", d3: "ur-d3", d7: "ur-d7", futuro: "ur-futuro",
};

/**
 * Todos os prazos vivos do Painel, do mais próximo (ou mais vencido) ao mais
 * distante: editais não-encerrados com data, tarefas não-feitas com prazo e
 * reuniões agendadas de hoje em diante (reunião passada não é pendência).
 */
export function itensDePrazo(painel: DadosPainel, hoje = hojeIso()): ItemPrazo[] {
  const itens: ItemPrazo[] = [];

  for (const e of painel.editais) {
    if (!e.prazoIso || e.status === "closed" || e.status === "norma") continue;
    const projetos = painel.projetos.filter((p) => p.editalId === e.id && !p.arquivado);
    const urgencia = urgenciaDe(e.prazoIso, hoje);
    // Prazo passado só é pendência se sobrou projeto que não chegou a ser inscrito
    // (é preciso decidir: inscreveu e falta atualizar, ou desistiu).
    const semInscricao = projetos.filter((p) => p.status === "prospeccao" || p.status === "preparacao");
    if (urgencia === "vencido" && !semInscricao.length) continue;
    itens.push({
      iso: e.prazoIso, tipo: "edital", id: e.id, titulo: e.nome,
      detalhe: urgencia === "vencido"
        ? semInscricao.length + " projeto(s) sem inscrição registrada"
        : projetos.length ? projetos.length + " projeto(s)" : "sem projeto ainda",
      urgencia,
    });
  }
  for (const t of painel.tarefas) {
    if (!t.prazo || t.status === "feito") continue;
    const resp = painel.equipe.find((p) => p.id === t.respId)?.nome || "";
    itens.push({ iso: t.prazo, tipo: "tarefa", id: t.id, titulo: t.titulo, detalhe: resp, urgencia: urgenciaDe(t.prazo, hoje) });
  }
  for (const r of painel.reunioes) {
    const data = r.status === "agendada" ? (r.proxima || r.data) : "";
    if (!data || urgenciaDe(data, hoje) === "vencido") continue;
    itens.push({ iso: data, tipo: "reuniao", id: r.id, titulo: r.titulo || "Reunião", detalhe: r.hora || "", urgencia: urgenciaDe(data, hoje) });
  }

  return itens.sort((a, b) => (a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0));
}

/** Quantos prazos pedem atenção (vencidos ou nos próximos 7 dias). */
export const contarUrgentes = (painel: DadosPainel): number =>
  itensDePrazo(painel).filter((p) => p.urgencia !== "futuro").length;
