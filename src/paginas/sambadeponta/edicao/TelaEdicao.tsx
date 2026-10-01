/* Uma edição da festa: capa, orçamento, simulação (enquanto não fecha),
   tarefas, cronograma do dia, máquinas, comunicação e fechamento. O cálculo
   é feito uma vez aqui e passado às seções. */
import { calcular } from "../calculo";
import { CapaEdicao } from "./CapaEdicao";
import { Orcamento } from "./Orcamento";
import { Simulacao } from "./Simulacao";
import { Tarefas } from "./Tarefas";
import { CronogramaDia } from "./CronogramaDia";
import { Maquinas } from "./Maquinas";
import { Comunicacao } from "./Comunicacao";
import { Fechamento } from "./Fechamento";
import type { Edicao, Painel } from "../tipos";

export function TelaEdicao({ painel, e }: { painel: Painel; e: Edicao }) {
  const k = calcular(painel, e);
  return (
    <>
      <CapaEdicao painel={painel} e={e} k={k} />
      <Orcamento painel={painel} e={e} k={k} />
      {!k.fechada && <Simulacao e={e} k={k} />}
      <Tarefas painel={painel} e={e} />
      <CronogramaDia e={e} />
      <Maquinas painel={painel} e={e} />
      <Comunicacao painel={painel} e={e} />
      <Fechamento painel={painel} e={e} k={k} />
    </>
  );
}
