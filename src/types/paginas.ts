/* Os totais por edição de uma página anexo tipo festa, que a própria página
   grava no documento dela (`paginas/<slug>.resumo`) a cada mudança. O detalhe
   (linhas de custo, máquinas, cronograma...) é lógica da página e fica nela.
   Até 21/10/2026 iam para o projeto (`Projeto.resumoEdicoes`, hoje legado). */

export type StatusEdicao = "planejada" | "execucao" | "fechada";

export const ROTULO_STATUS_EDICAO: Record<StatusEdicao, string> = {
  planejada: "Planejada", execucao: "Em execução", fechada: "Fechada",
};

/** Totais de uma edição, em reais. Contratado inclui os pagos. */
export interface ResumoEdicao {
  id: string;
  nome: string;
  /** Data ISO (yyyy-mm-dd). */
  data: string;
  status: StatusEdicao;
  /** Soma de quantidade × unitário das linhas de custo. */
  previsto: number;
  /** Linhas contratadas ou pagas (realizado quando informado, senão previsto). */
  contratado: number;
  pago: number;
  /** Soma do realizado informado. */
  realizado: number;
  /** Receita informada (fechada) ou simulada. */
  receita: number;
  /** Receita − (custos + bebida + comissão + taxa). */
  resultado: number;
}
