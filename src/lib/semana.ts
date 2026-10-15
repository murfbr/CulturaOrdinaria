/* Semana de trabalho (aba Semana da Agenda): a semana é identificada pela
   segunda-feira em ISO (yyyy-mm-dd), que é o id do documento em `semanas`.
   Os itens do dia são tarefas normais: as com prazo no dia, de qualquer origem,
   mais as nascidas na própria semana (origem "semana:<segunda>") sem prazo,
   que ficam em "Durante a semana". Funções puras. */
import type { Reuniao, Tarefa } from "../types";

/** Chave da coluna: um dia útil ou "semana" (Durante a semana). */
export type DiaSemana = "seg" | "ter" | "qua" | "qui" | "sex" | "semana";

export interface ColunaSemana {
  chave: DiaSemana;
  nome: string;
  /** Data ISO do dia; "" na coluna Durante a semana. */
  iso: string;
}

const NOMES: [DiaSemana, string][] = [
  ["seg", "Segunda"], ["ter", "Terça"], ["qua", "Quarta"], ["qui", "Quinta"], ["sex", "Sexta"],
];

/** Data local em ISO (sem a armadilha de fuso do toISOString). */
const iso = (d: Date) =>
  d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

/** Date local ao meio-dia (evita horário de verão) a partir de ISO. */
const data = (s: string) => new Date(s + "T12:00:00");

/** Soma dias a uma data ISO. */
export function somarDias(s: string, dias: number): string {
  const d = data(s);
  d.setDate(d.getDate() + dias);
  return iso(d);
}

/** Segunda-feira da semana de uma data ISO (domingo pertence à semana que termina). */
export function segundaDe(s: string): string {
  const d = data(s);
  const dow = (d.getDay() + 6) % 7; // segunda = 0 … domingo = 6
  return somarDias(s, -dow);
}

/** As seis colunas da semana que começa na `segunda`. */
export function colunasDaSemana(segunda: string): ColunaSemana[] {
  return [
    ...NOMES.map(([chave, nome], i) => ({ chave, nome, iso: somarDias(segunda, i) })),
    { chave: "semana" as const, nome: "Durante a semana", iso: "" },
  ];
}

const ddmm = (s: string) => s.slice(8, 10) + "/" + s.slice(5, 7);

/** "Semana de 13/10 a 17/10". */
export const rotuloSemana = (segunda: string) => `Semana de ${ddmm(segunda)} a ${ddmm(somarDias(segunda, 4))}`;

/** Vínculo da tarefa nascida na semana. */
export const origemSemana = (segunda: string) => "semana:" + segunda;

/** Rótulo curto do vínculo ("Semana · 13/10"). */
export const rotuloOrigemSemana = (segunda: string) => "Semana · " + ddmm(segunda);

/** Tarefas de cada coluna, na ordem do quadro (`_ord`). Dias: prazo no dia, qualquer
    origem. Durante a semana: origem na semana e sem prazo. */
export function tarefasPorColuna(tarefas: Tarefa[], segunda: string): Record<DiaSemana, Tarefa[]> {
  const colunas = colunasDaSemana(segunda);
  const porColuna = Object.fromEntries(colunas.map((c) => [c.chave, [] as Tarefa[]])) as Record<DiaSemana, Tarefa[]>;
  const origem = origemSemana(segunda);
  const ordenadas = [...tarefas].sort((a, b) => (a._ord || 0) - (b._ord || 0));
  for (const t of ordenadas) {
    if (t.prazo) {
      const col = colunas.find((c) => c.iso === t.prazo);
      if (col) porColuna[col.chave].push(t);
    } else if (t.origem === origem) {
      porColuna.semana.push(t);
    }
  }
  return porColuna;
}

/** Reuniões de cada dia útil da semana (pela data, ou pela próxima ocorrência das
    recorrentes), na ordem da hora. */
export function reunioesPorDia(reunioes: Reuniao[], segunda: string): Record<string, Reuniao[]> {
  const porDia: Record<string, Reuniao[]> = {};
  for (const c of colunasDaSemana(segunda)) {
    if (!c.iso) continue;
    porDia[c.iso] = reunioes
      .filter((r) => r.data === c.iso || r.proxima === c.iso)
      .sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
  }
  return porDia;
}
