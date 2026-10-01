/* Aprendizados: o que cada edição ensinou e se virou tarefa do checklist-mestre. */
import { alterarPagina } from "../dados";
import { usarModalCampos } from "../ModalCampos";
import { CAMPOS_APRENDIZADO } from "./pedidos";
import type { Aprendizado, Painel } from "../tipos";

export function Aprendizados({ painel }: { painel: Painel }) {
  const modal = usarModalCampos();
  const lista = painel.pagina.aprendizados || [];

  /** i = índice na lista; null = novo. */
  function editar(i: number | null) {
    const atual: Aprendizado = i == null ? { ed: painel.edicoes.length, texto: "", tarefa: "" } : lista[i];
    modal.abrir({
      titulo: i == null ? "Novo aprendizado" : "Editar aprendizado",
      campos: CAMPOS_APRENDIZADO,
      valores: atual as unknown as Record<string, unknown>,
      aoAplicar: (s) => {
        if (!s.texto) return;
        alterarPagina((p) => {
          p.aprendizados = p.aprendizados || [];
          if (i == null) p.aprendizados.push({ ...atual, ...s } as Aprendizado);
          else Object.assign(p.aprendizados[i], s);
        });
      },
      aoExcluir: i == null ? undefined : () => {
        if (window.confirm("Excluir aprendizado?")) alterarPagina((p) => { p.aprendizados.splice(i, 1); });
      },
    });
  }

  return (
    <section id="l-aprendizados">
      <div className="sechead">
        <div><div className="sdp-eyebrow">Festa · memória</div><h2>Aprendizados</h2></div>
        <div className="actions"><button className="sdp-btn small" onClick={() => editar(null)}>+ Aprendizado</button></div>
      </div>
      <p className="lead">O que cada edição ensinou. Um aprendizado que não vira tarefa no checklist-mestre se perde na próxima edição.</p>
      <div className="tw">
        <table>
          <thead><tr><th style={{ width: 60 }}>Ed.</th><th>Aprendizado</th><th>Virou tarefa</th><th /></tr></thead>
          <tbody>
            {lista.map((a, i) => (
              <tr key={i}>
                <td>{String(a.ed).padStart(2, "0")}</td>
                <td>{a.texto}</td>
                <td>{a.tarefa ? <span className="tag ok">{a.tarefa}</span> : <span className="tag warn">ainda não</span>}</td>
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
