/* Plano de comunicação: calendário de peças e posts da edição, com datas em ISO. */
import { br } from "../calculo";
import { alterarEdicao } from "../dados";
import { usarModalCampos } from "../ModalCampos";
import { camposComunicacao } from "./pedidos";
import type { Edicao, Painel, Peca } from "../tipos";

export function Comunicacao({ painel, e }: { painel: Painel; e: Edicao }) {
  const modal = usarModalCampos();
  const formatos = painel.presets.formatosPeca;

  /** i = índice na lista; null = nova peça. */
  function editar(i: number | null) {
    const atual: Peca = i == null ? { data: "", peca: "", formato: formatos[0] || "Feed", perfis: "", obs: "" } : e.comunicacao[i];
    modal.abrir({
      titulo: i == null ? "Nova peça / post" : "Editar comunicação",
      campos: camposComunicacao(formatos),
      valores: atual as unknown as Record<string, unknown>,
      aoAplicar: (s) => alterarEdicao(e.id, (ed) => {
        if (i == null) ed.comunicacao.push({ ...atual, ...s } as Peca);
        else Object.assign(ed.comunicacao[i], s);
      }),
      aoExcluir: i == null ? undefined : () => {
        if (window.confirm("Excluir esta peça?")) alterarEdicao(e.id, (ed) => { ed.comunicacao.splice(i, 1); });
      },
    });
  }

  return (
    <section id="e-comunicacao">
      <div className="sechead">
        <div><div className="sdp-eyebrow">{e.nome} · divulgação</div><h2>Plano de comunicação</h2></div>
        <div className="actions"><button className="sdp-btn small" onClick={() => editar(null)}>+ Peça</button></div>
      </div>
      <p className="lead">Calendário de peças e posts. ADS e base de e-mails entram no orçamento e no fechamento.</p>
      {e.comunicacaoObs && <div className="editnote">✎ {e.comunicacaoObs}</div>}
      <div className="tw">
        <table>
          <thead><tr><th style={{ width: 70 }}>Data</th><th>Peça</th><th>Formato</th><th>Perfis</th><th>Obs.</th><th /></tr></thead>
          <tbody>
            {e.comunicacao.map((r, i) => (
              <tr key={i}>
                <td>{r.data ? br(r.data) : "—"}</td>
                <td>{r.peca}</td>
                <td>{r.formato}</td>
                <td>{r.perfis}</td>
                <td><span className="m">{r.obs}</span></td>
                <td className="rowact"><button className="sdp-btn small" onClick={() => editar(i)}>editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal.elemento}
    </section>
  );
}
