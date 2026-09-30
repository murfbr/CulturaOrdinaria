/* O que a Central enxerga de uma página própria de projeto: só os totais por
   edição, que a própria página grava no documento do projeto
   (`Projeto.resumoEdicoes`) a cada mudança. O detalhe (linhas de custo,
   máquinas, cronograma...) é lógica da página e fica nela. */

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
