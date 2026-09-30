/* Simulação (edição não fechada): três alavancas, público, ticket de bar e
   porta por presente; a projeção lado a lado com a edição anterior e o
   ponto de equilíbrio. Os inputs gravam direto, com debounce. */
import type { ReactNode } from "react";
import { N, R, R2, num, type Calculo } from "../calculo";
import { alterarEdicao } from "../dados";
import { usarModalCampos } from "../ModalCampos";
import { pedidoVariaveis } from "./pedidos";
import type { Edicao, Simulacao as Alavancas } from "../tipos";

type Alavanca = "publico" | "ticketBar" | "ticketPorta";

const ESTILO_ENTRADA = {
  width: 120, font: "inherit", padding: "5px 8px", border: "1px solid var(--input-line)", borderRadius: 6,
  background: "var(--input)", color: "var(--ink)", textAlign: "right",
} as const;

export function Simulacao({ e, k }: { e: Edicao; k: Calculo }) {
  const modal = usarModalCampos();
  const anterior = k.anterior;
  const ka = k.calcAnterior;
  const sim: Alavancas = e.sim || { publico: null, ticketBar: null, ticketPorta: null, obs: "" };
  const pub = Number(sim.publico) || 0;
  const pubAnterior = anterior ? (anterior.kpis?.publico || 0) : 0;
  const ant = {
    publico: pubAnterior,
    ticketBar: pubAnterior && ka ? (ka.rec.bar || 0) / pubAnterior : null,
    ticketPorta: pubAnterior && ka ? (ka.rec.porta || 0) / pubAnterior : null,
  };
  const nomeAnterior = anterior ? anterior.nome : "Anterior";
  const ticketTotal = pub ? ((k.rec.bar || 0) + (k.rec.porta || 0)) / pub : 0;

  const mudar = (chave: Alavanca, texto: string) =>
    alterarEdicao(e.id, (ed) => {
      ed.sim = { publico: null, ticketBar: null, ticketPorta: null, obs: "", ...(ed.sim || {}), [chave]: num(texto) };
    }, false);

  const entrada = (chave: Alavanca, step: string) => (
    <input type="number" step={step} value={sim[chave] ?? ""} style={ESTILO_ENTRADA} onChange={(ev) => mudar(chave, ev.target.value)} />
  );
  const linha = (rotulo: ReactNode, a: number | null, b: ReactNode, f: (v: number) => string) => (
    <tr><td>{rotulo}</td><td className="num">{a == null ? "—" : f(a)}</td><td className="num">{b}</td></tr>
  );

  return (
    <section id="e-simulacao">
      <div className="sechead">
        <div><div className="sdp-eyebrow">{e.nome} · cenário</div><h2>Simulação</h2></div>
        <div className="actions"><button className="sdp-btn small" onClick={() => modal.abrir(pedidoVariaveis(e, k))}>Percentuais e premissas</button></div>
      </div>
      <p className="lead">
        Três alavancas: quantas pessoas vêm, quanto cada uma gasta no bar e quanto contribui na porta. Mexa nos
        números e o resultado projetado muda em toda a página.
      </p>
      <div className="sdp-grid sdp-g2">
        <div className="tw" style={{ margin: 0 }}>
          <table>
            <thead><tr><th>Alavanca</th><th className="num">{nomeAnterior}</th><th className="num">Simulação</th></tr></thead>
            <tbody>
              {linha("Público presente", ant.publico, entrada("publico", "50"), N)}
              {linha("Ticket de bar por presente", ant.ticketBar, entrada("ticketBar", "0.5"), R2)}
              {linha("Contribuição de porta por presente", ant.ticketPorta, entrada("ticketPorta", "0.25"), R2)}
              {linha("Ticket total por presente (bar + porta)", ant.ticketBar != null ? ant.ticketBar + (ant.ticketPorta || 0) : null, <b>{R2(ticketTotal)}</b>, R2)}
            </tbody>
          </table>
        </div>
        <div className="tw" style={{ margin: 0 }}>
          <table>
            <thead><tr><th>Projeção</th><th className="num">{nomeAnterior}</th><th className="num">Simulação</th></tr></thead>
            <tbody>
              {linha("Receita bar", ka ? ka.rec.bar : null, R(k.rec.bar), R)}
              {linha("Receita porta", ka ? ka.rec.porta : null, R(k.rec.porta), R)}
              {linha("Comida (repasse, neutro)", ka ? ka.rec.comida : null, R(k.rec.comida), R)}
              {linha(<b>Receita total</b>, ka ? ka.receita : null, <b>{R(k.receita)}</b>, R)}
              {linha("Custos fixos", ka ? ka.operacao : null, R(k.operacao), R)}
              {linha(`Bebida (${(k.bebidaPct || 0).toFixed(1)}% do bar)`, ka ? ka.bebida : null, R(k.bebida), R)}
              {linha(`Comissão ${e.variaveis?.comissaoPct || 0}% + taxa ${e.variaveis?.taxaPct || 0}%`, ka ? ka.comissao + ka.taxa : null, R(k.comissao + k.taxa), R)}
              <tr className="total"><td>Resultado</td><td className="num">{ka ? R(ka.resultado) : "—"}</td><td className="num">{R(k.resultado)}</td></tr>
              <tr>
                <td>Por sócio</td><td className="num">{ka ? R(ka.porSocio) : "—"}</td>
                <td className="num" style={{ fontWeight: 700, color: k.porSocio < 0 ? "var(--red)" : "var(--green)" }}>{R(k.porSocio)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {k.equilibrioBar != null && pub > 0 && (
        <div className="sdp-grid sdp-g3" style={{ marginTop: 16 }}>
          <div className="sdp-card hl">
            <div className="k">Ponto de equilíbrio</div>
            <div className="v">{R2(k.equilibrioBar / pub)}</div>
            <div className="foot">ticket de bar por presente para resultado zero, com {N(pub)} pessoas e porta a {R2(sim.ticketPorta)}</div>
          </div>
          <div className="sdp-card">
            <div className="k">Receita de bar necessária</div>
            <div className="v">{R(k.equilibrioBar)}</div>
            <div className="foot">{(k.rec.bar || 0) >= k.equilibrioBar ? "a simulação já cobre" : `faltam ${R(k.equilibrioBar - (k.rec.bar || 0))} na simulação`}</div>
          </div>
          <div className="sdp-card">
            <div className="k">Público para equilibrar</div>
            <div className="v">{(sim.ticketBar || 0) > 0 && k.equilibrioBar / pub > 0 ? N(k.equilibrioBar / (sim.ticketBar || 1)) : "—"}</div>
            <div className="foot">mantendo o ticket de bar simulado (aprox.)</div>
          </div>
        </div>
      )}
      {sim.obs && <div className="note">{sim.obs}</div>}
      {modal.elemento}
    </section>
  );
}
