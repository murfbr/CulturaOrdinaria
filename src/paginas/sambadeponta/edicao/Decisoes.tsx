/* Decisões e urgências da edição, logo depois do Resumo: o que está em aberto
   (com as opções, prós e contras), quem precisa ser avisado e as urgências.
   Decisões e avisos ficam no documento da edição; urgências são tarefas da
   Central fixadas aqui (ver Urgencias.tsx), para não virar uma segunda lista. */
import { uid } from "../../../utils";
import { br } from "../calculo";
import { alterarEdicao } from "../dados";
import { usarModalCampos } from "../ModalCampos";
import { CAMPOS_DECISAO, ROTULO_STATUS_DECISAO, camposParaDecisao, decisaoParaCampos } from "./pedidos";
import { Avisos } from "./Avisos";
import { Urgencias } from "./Urgencias";
import type { Decisao, Edicao, Painel, StatusDecisao } from "../tipos";

/* A aba só aparece quando faz sentido: ver temDecisoes em abas.ts. */

export const CLASSE_STATUS_DECISAO: Record<StatusDecisao, string> = { aberta: "bad", provisoria: "warn", decidida: "ok" };

export function Decisoes({ painel, e }: { painel: Painel; e: Edicao }) {
  const modal = usarModalCampos();
  const decisoes = e.decisoes || [];
  const abertas = decisoes.filter((d) => d.status !== "decidida").length;

  /** i = índice na lista; null = nova decisão. */
  function editar(i: number | null) {
    const atual: Decisao = i == null
      ? { id: uid("dc"), tema: "", status: "aberta", atual: "", opcoes: [], prazo: "", obs: "" }
      : decisoes[i];
    modal.abrir({
      titulo: i == null ? "Nova decisão" : "Editar decisão",
      campos: CAMPOS_DECISAO,
      valores: decisaoParaCampos(atual),
      aoAplicar: (s) => {
        if (!s.tema) return;
        const nova = camposParaDecisao(atual, s);
        alterarEdicao(e.id, (ed) => {
          ed.decisoes = ed.decisoes || [];
          if (i == null) ed.decisoes.push(nova);
          else ed.decisoes[i] = nova;
        });
      },
      aoExcluir: i == null ? undefined : () => {
        if (window.confirm("Excluir esta decisão?")) alterarEdicao(e.id, (ed) => { ed.decisoes?.splice(i, 1); });
      },
    });
  }

  return (
    <section id="e-decisoes">
      <div className="sechead">
        <div><div className="sdp-eyebrow">{e.nome} · prioridade</div><h2>Decisões e urgências</h2></div>
        <div className="actions"><button className="sdp-btn small" onClick={() => editar(null)}>+ Decisão</button></div>
      </div>
      <p className="lead">
        O que ainda precisa ser decidido, quem precisa saber e o que não pode esperar.
        {decisoes.length > 0 && <> {abertas ? <b>{abertas} ainda sem decisão final.</b> : "Tudo decidido."}</>}
      </p>

      {decisoes.length === 0
        ? <div className="note">Nenhuma decisão registrada. Use <b>+ Decisão</b> para pôr na mesa as opções, com prós e contras.</div>
        : (
          <div className="sdp-grid sdp-g2 decisoes">
            {decisoes.map((d, i) => (
              <div className={"sdp-card decisao " + d.status} key={d.id}>
                <div className="topo">
                  <div className="k">{d.tema}</div>
                  <span className={"tag " + CLASSE_STATUS_DECISAO[d.status]}>{ROTULO_STATUS_DECISAO[d.status]}</span>
                </div>
                {d.atual && <div className="atual">{d.atual}</div>}
                {(d.prazo || d.obs) && (
                  <div className="prazo">{d.prazo ? "Decidir até " + br(d.prazo) : ""}{d.prazo && d.obs ? " · " : ""}{d.obs}</div>
                )}
                {d.opcoes.length > 0 && (
                  <div className="opcoes">
                    {d.opcoes.map((o, j) => (
                      <div className="opcao" key={j}>
                        <b>{o.texto}</b>
                        {o.pros && <div className="pc pro">{o.pros}</div>}
                        {o.contras && <div className="pc contra">{o.contras}</div>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="acoes"><button className="sdp-btn small" onClick={() => editar(i)}>editar</button></div>
              </div>
            ))}
          </div>
        )}

      <Avisos e={e} />
      <Urgencias painel={painel} e={e} />
      {modal.elemento}
    </section>
  );
}
