/* Linha do tempo: um cartão por edição (resultado ou projeção) e o cartão
   "+ Nova edição", que herda a última. */
import { toast } from "../../../components/Toast";
import { N, R, ROTULO_STATUS_EDICAO, brCompleta, calcular, tarefasDaEdicao } from "../calculo";
import { novaEdicao } from "../dados";
import type { Painel } from "../tipos";
import type { IrPara } from "../visao";

export function LinhaDoTempo({ painel, irPara }: { painel: Painel; irPara: IrPara }) {
  function criar() {
    const nova = novaEdicao(painel);
    if (nova) { toast("Edição criada"); irPara({ sec: "edicao", id: nova.id }); }
  }

  return (
    <section>
      <div className="sechead"><div><div className="sdp-eyebrow">Edições</div><h2>Linha do tempo</h2></div></div>
      <p className="lead">
        Cada edição nasce herdando o realizado da anterior (orçamento, cronograma, máquinas, comunicação) e o
        checklist-mestre. Quando fecha, devolve KPIs ao comparativo e aprendizados à festa.
      </p>
      <div className="edlist">
        {painel.edicoes.map((e) => {
          const k = calcular(painel, e);
          const tarefas = tarefasDaEdicao(painel, e);
          const feitas = tarefas.filter((t) => t.status === "feito").length;
          return (
            <div className="edtile" key={e.id} onClick={() => irPara({ sec: "edicao", id: e.id })}>
              <div className="t">{e.nome}</div>
              <div className="d">{brCompleta(e.data)}{e.diaSemana ? " · " + e.diaSemana : ""} · {ROTULO_STATUS_EDICAO[e.status]}</div>
              <div className="r" style={{ color: k.resultado < 0 ? "var(--red)" : "var(--green)" }}>
                {k.fechada ? "Resultado " : "Projeção "}{R(k.resultado)}
              </div>
              <div className="d">
                {k.fechada ? `${N(e.kpis?.publico)} presentes · ${e.custos.length} itens de custo` : `${feitas}/${tarefas.length} tarefas feitas`}
              </div>
            </div>
          );
        })}
        <div className="edtile new" onClick={criar}>+ Nova edição</div>
      </div>
    </section>
  );
}
