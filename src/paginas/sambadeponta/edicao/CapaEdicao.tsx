/* Capa da edição: data, horário, local e lineup; faixa com os números
   (fechada: receita, despesa, resultado, público; em produção: contagem,
   tarefas, custos previstos, resultado projetado); editar os dados. */
import { N, R, ROTULO_STATUS_EDICAO, brCompleta, diasAte, hojeIso, tarefasDaEdicao, totaisPorStatus, type Calculo } from "../calculo";
import { alterarEdicao } from "../dados";
import { usarModalCampos } from "../ModalCampos";
import { CAMPOS_DADOS_EDICAO } from "./pedidos";
import type { Edicao, Painel } from "../tipos";

export function CapaEdicao({ painel, e, k }: { painel: Painel; e: Edicao; k: Calculo }) {
  const modal = usarModalCampos();
  const dias = diasAte(e.data);
  const hoje = hojeIso();
  const tarefas = tarefasDaEdicao(painel, e);
  const feitas = tarefas.filter((t) => t.status === "feito").length;
  const atrasadas = tarefas.filter((t) => t.status !== "feito" && t.prazo && t.prazo < hoje).length;
  const totais = totaisPorStatus(e);

  function editar() {
    modal.abrir({
      titulo: "Dados da edição", campos: CAMPOS_DADOS_EDICAO, valores: e as unknown as Record<string, unknown>,
      aoAplicar: (s) => alterarEdicao(e.id, (ed) => { Object.assign(ed, s); }),
    });
  }

  return (
    <>
      <div className="sdp-hero" id="e-resumo">
        <div className="sdp-eyebrow">{painel.titulo} · {e.nome} · {ROTULO_STATUS_EDICAO[e.status]}</div>
        <h1>{e.nome}</h1>
        <div className="sub">
          <b>{brCompleta(e.data)}{e.diaSemana ? ", " + e.diaSemana : ""}</b> · {e.horario} · {e.local}<br />{e.lineup}
        </div>
        <div className="band">
          {k.fechada ? (
            <>
              <div className="sdp-cell"><div className="k">Receita total</div><div className="v">{R(k.receita)}</div><div className="foot">bar {R(k.rec.bar)} · porta {R(k.rec.porta)}</div></div>
              <div className="sdp-cell"><div className="k">Despesa total</div><div className="v">{R(k.despesa)}</div><div className="foot">operação {R(k.operacao)} + bebida, comissão, taxa</div></div>
              <div className="sdp-cell"><div className="k">Resultado</div><div className={"v " + (k.resultado < 0 ? "neg" : "pos")}>{R(k.resultado)}</div><div className="foot">{R(k.porSocio)} por sócio</div></div>
              <div className="sdp-cell"><div className="k">Público</div><div className="v">{N(e.kpis?.publico)}</div><div className="foot">{N(e.kpis?.retiradas)} retiradas</div></div>
            </>
          ) : (
            <>
              <div className="sdp-cell">
                <div className="k">Contagem</div>
                <div className="v">{dias == null ? "—" : dias >= 0 ? "D-" + dias : "D+" + (-dias)}</div>
                <div className="foot">{dias == null ? "sem data" : dias >= 0 ? `faltam ${dias} dias` : "evento já aconteceu"}</div>
              </div>
              <div className="sdp-cell"><div className="k">Tarefas</div><div className="v">{feitas}/{tarefas.length}</div><div className="foot">{atrasadas} atrasadas</div></div>
              <div className="sdp-cell">
                <div className="k">Custos previstos</div>
                <div className="v">{R(k.operacao)}</div>
                <div className="foot">pago {R(totais.pago)} · contratado {R(totais.contratado)}</div>
              </div>
              <div className="sdp-cell">
                <div className="k">Resultado projetado</div>
                <div className={"v " + (k.resultado < 0 ? "neg" : "pos")}>{R(k.resultado)}</div>
                <div className="foot">simulação: {N(e.sim?.publico)} pessoas · {R(k.receita)} de receita</div>
              </div>
            </>
          )}
        </div>
        <div className="sdp-toolbar"><button className="sdp-btn ghost small" onClick={editar}>Editar dados da edição</button></div>
        {modal.elemento}
      </div>
      {e.notas && (
        <section style={{ paddingTop: 24, paddingBottom: 24 }}>
          <div className="note"><b>Notas:</b> {e.notas}</div>
        </section>
      )}
    </>
  );
}
