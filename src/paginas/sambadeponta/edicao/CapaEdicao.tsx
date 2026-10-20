/* Capa da edição, no padrão das artes da festa: tarja com a edição e o
   status, a data como título (6/11 ✷ 20H), dia da semana e local em caixa
   alta, lineup. No Resumo vem com a faixa de números (fechada: receita,
   despesa, resultado, público; em produção: contagem, tarefas, custos
   previstos, resultado projetado) e o botão de editar; nas outras abas fica
   compacta, só para situar. */
import { N, R, ROTULO_STATUS_EDICAO, dataCurta, diaDaSemana, diasAte, hojeIso, horaInicio, tarefasDaEdicao, totaisPorStatus, urgentesDaEdicao, type Calculo } from "../calculo";
import { alterarEdicao } from "../dados";
import { usarModalCampos } from "../ModalCampos";
import { CAMPOS_DADOS_EDICAO } from "./pedidos";
import type { Edicao, Painel } from "../tipos";

/** Asterisco pincelado do design system, o separador de data e hora das artes. */
export const ASTERISCO = "/pontadelanca/asterisco-marfim.svg";

export function CapaEdicao({ painel, e, k, compacta }: { painel: Painel; e: Edicao; k: Calculo; compacta?: boolean }) {
  const modal = usarModalCampos();
  const dias = diasAte(e.data);
  const hoje = hojeIso();
  const tarefas = tarefasDaEdicao(painel, e);
  const feitas = tarefas.filter((t) => t.status === "feito").length;
  const atrasadas = tarefas.filter((t) => t.status !== "feito" && t.prazo && t.prazo < hoje).length;
  const urgentes = urgentesDaEdicao(painel, e).filter((t) => t.status !== "feito").length;
  const totais = totaisPorStatus(e);
  const data = dataCurta(e.data);
  const hora = horaInicio(e.horario);
  const linha = [diaDaSemana(e.data), e.horario, e.local].filter(Boolean).join(" · ");

  function editar() {
    modal.abrir({
      titulo: "Dados da edição", campos: CAMPOS_DADOS_EDICAO, valores: e as unknown as Record<string, unknown>,
      aoAplicar: (s) => alterarEdicao(e.id, (ed) => { Object.assign(ed, s); }),
    });
  }

  return (
    <>
      <div className={"sdp-hero" + (compacta ? " compacta" : "")} id="e-resumo">
        <span className="sdp-tarja">{e.nome} · {ROTULO_STATUS_EDICAO[e.status]}</span>
        <h1>
          {data
            ? <>{data}{hora && <><img className="asterisco" src={ASTERISCO} alt=" às " />{hora}</>}</>
            : e.nome}
        </h1>
        <div className="sub">
          {linha && <span className="linha">{linha}</span>}
          {!compacta && e.lineup && <span className="lineup">{e.lineup}</span>}
        </div>
        {!compacta && (
          <>
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
                  <div className="sdp-cell">
                    <div className="k">Tarefas</div>
                    <div className="v">{feitas}/{tarefas.length}</div>
                    <div className="foot">{atrasadas} atrasadas{urgentes ? ` · ${urgentes} urgente${urgentes > 1 ? "s" : ""}` : ""}</div>
                  </div>
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
          </>
        )}
        {modal.elemento}
      </div>
      <div className="sdp-listras" aria-hidden="true" />
    </>
  );
}
