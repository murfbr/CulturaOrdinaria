/* As abas de uma edição, na ordem da reunião de 20/10/2026: Resumo, Decisões e
   urgências, Financeiro (orçamento e simulação), Operação (cronograma do dia e
   máquinas), Tarefas, Comunicação e Fechamento. */
import type { Edicao } from "../tipos";
import type { Aba } from "../visao";

/** Decisões aparece em toda edição não fechada; numa fechada, só se ficou algo registrado. */
export const temDecisoes = (e: Edicao): boolean =>
  e.status !== "fechada" || Boolean(e.decisoes?.length || e.avisos?.length || e.urgentes?.length);

export interface DefAba { id: Aba; rotulo: string }

export function abasDaEdicao(e: Edicao): DefAba[] {
  return [
    { id: "resumo", rotulo: "Resumo" },
    ...(temDecisoes(e) ? [{ id: "decisoes", rotulo: "Decisões" } as DefAba] : []),
    { id: "financeiro", rotulo: "Financeiro" },
    { id: "operacao", rotulo: "Operação" },
    { id: "tarefas", rotulo: "Tarefas" },
    { id: "comunicacao", rotulo: "Comunicação" },
    { id: "fechamento", rotulo: "Fechamento" },
  ];
}

/** A aba pedida, se existe nesta edição; senão o Resumo. */
export const abaValida = (e: Edicao, aba?: Aba): Aba =>
  aba && abasDaEdicao(e).some((a) => a.id === aba) ? aba : "resumo";
