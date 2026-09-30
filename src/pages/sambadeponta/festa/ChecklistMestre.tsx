/* Checklist-mestre: as tarefas que toda edição nova recebe, por fase do
   preset de festa, com o responsável padrão vindo da Equipe. */
import { nomeEquipe } from "../../../lib/nomes";
import { uid } from "../../../utils";
import { alterarPagina } from "../dados";
import { usarModalCampos } from "../ModalCampos";
import { camposMestre } from "./pedidos";
import type { ItemMestre, Painel } from "../tipos";

export function ChecklistMestre({ painel }: { painel: Painel }) {
  const modal = usarModalCampos();
  const fases = painel.presets.fases;
  const checklist = painel.pagina.checklist || [];

  function editar(item: ItemMestre | null) {
    const atual: ItemMestre = item || { id: uid("m"), fase: fases[1]?.id || fases[0]?.id || "", tarefa: "", respId: "", obs: "" };
    modal.abrir({
      titulo: item ? "Editar checklist-mestre" : "Nova tarefa do checklist-mestre",
      campos: camposMestre(fases, painel.equipe),
      valores: atual as unknown as Record<string, unknown>,
      aoAplicar: (s) => {
        if (!s.tarefa) return;
        alterarPagina((p) => {
          p.checklist = p.checklist || [];
          const alvo = p.checklist.find((m) => m.id === atual.id);
          if (alvo) Object.assign(alvo, s);
          else p.checklist.push({ ...atual, ...s } as ItemMestre);
        });
      },
      aoExcluir: item ? () => {
        if (window.confirm("Excluir do checklist-mestre?")) alterarPagina((p) => { p.checklist = p.checklist.filter((m) => m.id !== item.id); });
      } : undefined,
    });
  }

  return (
    <section id="l-checklist">
      <div className="sechead">
        <div><div className="sdp-eyebrow">Festa · processo</div><h2>Checklist-mestre</h2></div>
        <div className="actions"><button className="sdp-btn small" onClick={() => editar(null)}>+ Tarefa</button></div>
      </div>
      <p className="lead">
        Fases por distância do evento (preset de festa). Toda edição nova recebe estas tarefas, já na coleção de
        tarefas da Central, com o responsável padrão; a edição ajusta prazos e adiciona o que for específico.
      </p>
      <div className="phases">
        {fases.map((f) => <span className="phase" key={f.id} title={f.desc}>{f.label} · {f.desc}</span>)}
      </div>
      {fases.map((f) => {
        const itens = checklist.filter((m) => m.fase === f.id);
        if (!itens.length) return null;
        return (
          <div key={f.id}>
            <div className="ksub">{f.label} · {f.desc}</div>
            <div className="tw">
              <table>
                <thead><tr><th>Tarefa</th><th style={{ width: 160 }}>Responsável padrão</th><th style={{ width: 220 }}>Origem / observação</th><th style={{ width: 80 }} /></tr></thead>
                <tbody>
                  {itens.map((m) => (
                    <tr key={m.id}>
                      <td>{m.tarefa}</td>
                      <td>{m.respId ? nomeEquipe(m.respId) : "—"}</td>
                      <td><span className="m">{m.obs}</span></td>
                      <td className="rowact"><button className="sdp-btn small" onClick={() => editar(m)}>editar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      {modal.elemento}
    </section>
  );
}
