/* O que a lista e o quadro de tarefas mostram igual: a pílula de prioridade,
   a cor de cada status e a ordem das tarefas. */
import { cx } from "../../../utils/classes";
import { pesoPrioridade, prioridadeDe, rotuloPrioridade } from "../calculo";
import type { TarefaFestival } from "../tipos";

const CLASSE_PRIORIDADE: Record<string, string> = {
  critica: "cdf:bg-primaria cdf:text-primaria-texto",
  alta: "cdf:bg-conversa-bg cdf:text-conversa",
  media: "cdf:bg-contatar-bg cdf:text-contatar",
  baixa: "cdf:bg-superficie-2 cdf:text-fraco",
};

/** Pílula da prioridade; tarefa sem prioridade não mostra nada (ou o traço, na tabela). */
export function PilulaPrioridade({ t, vazio }: { t: TarefaFestival; vazio?: string }) {
  const id = prioridadeDe(t);
  if (!id) return vazio ? <span className="cdf:text-fraco">{vazio}</span> : null;
  return (
    <span className={cx("cdf:inline-block cdf:whitespace-nowrap cdf:rounded-full cdf:px-2 cdf:py-px cdf:text-xs cdf:font-bold", CLASSE_PRIORIDADE[id] || CLASSE_PRIORIDADE.baixa)}>
      {rotuloPrioridade(id)}
    </span>
  );
}

/** Cores dos status que a página conhece pelo id (os da carga inicial); status criado depois fica neutro. */
const CLASSE_STATUS_TAREFA: Record<string, string> = {
  backlog: "cdf:bg-contatar-bg cdf:text-contatar",
  andamento: "cdf:bg-conversa-bg cdf:text-conversa",
  aguardando: "cdf:bg-rec-bg cdf:text-rec",
  concluido: "cdf:bg-conf-bg cdf:text-conf",
};
export const classeStatusTarefa = (id: string) => CLASSE_STATUS_TAREFA[id] || "cdf:bg-superficie-2 cdf:text-tinta-2";

export type OrdemTarefas = "prazo" | "prioridade" | "plano";
export const ORDENS: [OrdemTarefas, string][] = [["prazo", "Por prazo"], ["prioridade", "Por prioridade"], ["plano", "Na ordem do plano"]];

const porPrazo = (a: TarefaFestival, b: TarefaFestival) => String(a.prazo || "9999").localeCompare(String(b.prazo || "9999"));
const porOrdem = (a: TarefaFestival, b: TarefaFestival) => (a.ordem || 999) - (b.ordem || 999);

/** Comparador das tarefas na ordem pedida; o desempate é sempre prazo e depois a ordem do plano. */
export const comparador = (ordem: OrdemTarefas) => (a: TarefaFestival, b: TarefaFestival) =>
  ordem === "plano" ? porOrdem(a, b)
    : ordem === "prioridade" ? pesoPrioridade(a) - pesoPrioridade(b) || porPrazo(a, b) || porOrdem(a, b)
      : porPrazo(a, b) || pesoPrioridade(a) - pesoPrioridade(b) || porOrdem(a, b);
