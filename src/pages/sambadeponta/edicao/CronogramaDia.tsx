/* Cronograma do dia do evento: da montagem à desmontagem, com técnica,
   equipe e palco em paralelo. */
import { alterarEdicao } from "../dados";
import { usarModalCampos } from "../ModalCampos";
import { CAMPOS_CRONOGRAMA } from "./pedidos";
import type { Edicao, LinhaCronograma } from "../tipos";

/** Destaque da coluna de palco: o Samba de Ponta em lima, a atração convidada em verde. */
const classeAtracao = (a: string) => (!a ? "" : /samba de ponta|sdp/i.test(a) ? "atr sdp" : /pife/i.test(a) ? "atr hl" : "atr");

export function CronogramaDia({ e }: { e: Edicao }) {
  const modal = usarModalCampos();

  /** i = índice na lista; null = nova linha. */
  function editar(i: number | null) {
    const atual: LinhaCronograma = i == null ? { hora: "", montagem: "", equipe: "", atracao: "" } : e.cronograma[i];
    modal.abrir({
      titulo: i == null ? "Nova linha do cronograma" : "Editar cronograma",
      campos: CAMPOS_CRONOGRAMA,
      valores: atual as unknown as Record<string, unknown>,
      aoAplicar: (s) => alterarEdicao(e.id, (ed) => {
        if (i == null) ed.cronograma.push({ ...atual, ...s } as LinhaCronograma);
        else Object.assign(ed.cronograma[i], s);
      }),
      aoExcluir: i == null ? undefined : () => {
        if (window.confirm("Excluir esta linha?")) alterarEdicao(e.id, (ed) => { ed.cronograma.splice(i, 1); });
      },
    });
  }

  return (
    <section id="e-cronograma">
      <div className="sechead">
        <div><div className="sdp-eyebrow">{e.nome} · dia do evento</div><h2>Cronograma</h2></div>
        <div className="actions"><button className="sdp-btn small" onClick={() => editar(null)}>+ Linha</button></div>
      </div>
      <p className="lead">Linha do tempo única, da montagem à desmontagem: técnica, equipe e palco em paralelo.</p>
      {e.cronogramaObs && <div className="editnote">✎ {e.cronogramaObs}</div>}
      <div className="tw">
        <table className="crono">
          <thead><tr><th style={{ width: 70 }}>Hora</th><th>Montagem / técnica</th><th>Equipe</th><th>Atração no palco</th><th style={{ width: 70 }} /></tr></thead>
          <tbody>
            {e.cronograma.map((r, i) => (
              <tr key={i}>
                <td>{r.hora}</td>
                <td>{r.montagem}</td>
                <td>{r.equipe}</td>
                <td className={classeAtracao(r.atracao || "")}>{r.atracao}</td>
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
