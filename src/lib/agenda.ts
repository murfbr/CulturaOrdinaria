/* Agenda derivada: os prazos vêm dos editais com data, e cada reunião sabe
   gerar seu link de convite do Google Agenda. */
import { porId } from "../store/mutacoes";
import type { DadosPainel, Edital, Projeto, Reuniao, Tarefa } from "../types";

/** Evento de prazo derivado dos editais com data. */
export interface EventoAgenda {
  iso: string;
  titulo: string;
  editalId: string;
  projetos: Projeto[];
  status: Edital["status"];
}

/** Prazos com data, ordenados — a Agenda inteira deriva daqui. */
export function eventosAgenda(editais: Edital[], projetos: Projeto[]): EventoAgenda[] {
  return editais
    .filter((e) => e.prazoIso)
    .map((e) => ({
      iso: e.prazoIso!,
      titulo: e.nome,
      editalId: e.id,
      projetos: projetos.filter((p) => p.editalId === e.id && !p.arquivado),
      status: e.status,
    }))
    .sort((a, b) => (a.iso < b.iso ? -1 : 1));
}

/** Os três tipos de item do Calendário (e os filtros da tela). */
export type TipoItem = "editais" | "tarefas" | "reunioes";

/** O que um dia tem no Calendário: prazos de editais, tarefas e reuniões do dia. */
export interface ItensDoDia {
  editais: EventoAgenda[];
  /** Tarefas com prazo no dia e ainda não feitas (as concluídas somem, como no quadro), na ordem do quadro. */
  tarefas: Tarefa[];
  /** Reuniões do dia, pela data ou pela próxima ocorrência das recorrentes, na ordem da hora. */
  reunioes: Reuniao[];
}

/** Itens por data ISO, para a grade do Calendário. Só entram dias com algo. */
export function itensPorDia(painel: DadosPainel): Record<string, ItensDoDia> {
  const dias: Record<string, ItensDoDia> = {};
  const dia = (iso: string) => (dias[iso] ||= { editais: [], tarefas: [], reunioes: [] });
  for (const e of eventosAgenda(painel.editais, painel.projetos)) dia(e.iso).editais.push(e);
  const tarefas = [...painel.tarefas].sort((a, b) => (a._ord || 0) - (b._ord || 0));
  for (const t of tarefas) if (t.prazo && t.status !== "feito") dia(t.prazo).tarefas.push(t);
  // Mesma regra da aba Semana: a reunião aparece na data e, se for outra, na próxima ocorrência.
  for (const r of painel.reunioes) {
    for (const data of new Set([r.data, r.proxima])) if (data) dia(data).reunioes.push(r);
  }
  for (const d of Object.values(dias)) d.reunioes.sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
  return dias;
}

/** O dia só com os tipos ligados no filtro. */
export const filtrarItens = (itens: ItensDoDia, ligados: Record<TipoItem, boolean>): ItensDoDia => ({
  editais: ligados.editais ? itens.editais : [],
  tarefas: ligados.tarefas ? itens.tarefas : [],
  reunioes: ligados.reunioes ? itens.reunioes : [],
});

/** true quando o dia não tem nada (depois do filtro). */
export const diaVazio = (itens?: ItensDoDia): boolean =>
  !itens || (!itens.editais.length && !itens.tarefas.length && !itens.reunioes.length);

/** Título curto de um evento (corta o que vem depois de "—" ou "("). */
/** Título sem o sufixo entre travessão ou parêntese. Tolera título vazio (tarefa salva sem nome não pode derrubar o Resumo). */
export const tituloCurto = (t?: string) => (t || "").split(/[—(]/)[0].trim();

/** Nomes dos participantes de uma reunião. */
export const nomesParticipantes = (r: Reuniao): string[] =>
  (r.participanteIds || []).map((id) => porId("equipe", id)?.nome).filter(Boolean) as string[];

/** E-mails de convite: participantes com e-mail + convidados externos. */
export const emailsConvite = (r: Reuniao): string[] => [
  ...((r.participanteIds || []).map((id) => porId("equipe", id)?.email).filter(Boolean) as string[]),
  ...(r.emailsExtra || []),
];

/** Link "adicionar ao Google Agenda" de uma reunião, com convidados e recorrência. */
export function linkGoogleAgenda(r: Reuniao, emails: string[]): string {
  const enc = encodeURIComponent;
  let dates = "";
  if (r.data) {
    const d = String(r.data).replace(/-/g, "");
    const hm = (r.hora || "").match(/(\d{1,2}):(\d{2})/);
    if (hm) {
      const h = hm[1].padStart(2, "0");
      const fim = String((Number(hm[1]) + 1) % 24).padStart(2, "0");
      dates = `${d}T${h}${hm[2]}00/${d}T${fim}${hm[2]}00`;
    } else dates = d + "/" + d;
  }
  const recorrencia: Record<string, string> = {
    "Diária": "RRULE:FREQ=DAILY", "Semanal": "RRULE:FREQ=WEEKLY",
    "Quinzenal": "RRULE:FREQ=WEEKLY;INTERVAL=2", "Mensal": "RRULE:FREQ=MONTHLY",
  };
  let u = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + enc(r.titulo || "Reunião");
  if (dates) u += "&dates=" + dates;
  if (r.local) u += "&location=" + enc(r.local);
  if (r.pauta?.length) u += "&details=" + enc("Pauta:\n- " + r.pauta.join("\n- "));
  if (emails.length) u += "&add=" + enc(emails.join(","));
  const rec = recorrencia[r.recorrencia];
  if (rec) u += "&recur=" + enc(rec);
  return u;
}
