/* Uma edição da festa, em abas: Resumo (capa com os números e o "Agora"),
   Decisões e urgências, Financeiro (orçamento e, enquanto não fecha,
   simulação), Operação (cronograma do dia e máquinas), Tarefas, Comunicação
   e Fechamento. O cálculo é feito uma vez aqui e passado às seções. */
import { calcular } from "../calculo";
import { CapaEdicao } from "./CapaEdicao";
import { Agora } from "./Agora";
import { Decisoes } from "./Decisoes";
import { Orcamento } from "./Orcamento";
import { Simulacao } from "./Simulacao";
import { Tarefas } from "./Tarefas";
import { CronogramaDia } from "./CronogramaDia";
import { Maquinas } from "./Maquinas";
import { Comunicacao } from "./Comunicacao";
import { Fechamento } from "./Fechamento";
import { abaValida, abasDaEdicao } from "./abas";
import type { Edicao, Painel } from "../tipos";
import type { Aba, IrPara } from "../visao";

export function TelaEdicao({ painel, e, aba, irPara }: { painel: Painel; e: Edicao; aba?: Aba; irPara: IrPara }) {
  const k = calcular(painel, e);
  const atual = abaValida(e, aba);

  return (
    <>
      <CapaEdicao painel={painel} e={e} k={k} compacta={atual !== "resumo"} />
      <nav className="sdp-abas" aria-label={"Abas da " + e.nome}>
        {abasDaEdicao(e).map((a) => (
          <button key={a.id} className={a.id === atual ? "atual" : ""} aria-current={a.id === atual ? "page" : undefined}
            onClick={() => irPara({ sec: "edicao", id: e.id, aba: a.id })}>
            {a.rotulo}
          </button>
        ))}
      </nav>
      {atual === "resumo" && (
        <>
          <Agora painel={painel} e={e} irPara={irPara} />
          {e.notas && <section className="curta"><div className="note"><b>Notas:</b> {e.notas}</div></section>}
        </>
      )}
      {atual === "decisoes" && <Decisoes painel={painel} e={e} />}
      {atual === "financeiro" && (
        <>
          <Orcamento painel={painel} e={e} k={k} />
          {!k.fechada && <Simulacao e={e} k={k} />}
        </>
      )}
      {atual === "operacao" && (
        <>
          <CronogramaDia e={e} />
          <Maquinas painel={painel} e={e} />
        </>
      )}
      {atual === "tarefas" && <Tarefas painel={painel} e={e} />}
      {atual === "comunicacao" && <Comunicacao painel={painel} e={e} />}
      {atual === "fechamento" && <Fechamento painel={painel} e={e} k={k} />}
    </>
  );
}
