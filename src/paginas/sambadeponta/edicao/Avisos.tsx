/* Quem avisar: pessoas que precisam saber das mudanças da edição (atrações,
   som, produção, sócio). O quadrado marca avisado; quando a decisão muda de
   novo, "Desmarcar todos" recomeça a rodada. A lista passa para a próxima
   edição, com todo mundo ainda por avisar. */
import { uid } from "../../../utils";
import { alterarEdicao } from "../dados";
import { usarModalCampos } from "../ModalCampos";
import { CAMPOS_AVISO } from "./pedidos";
import type { Aviso, Edicao } from "../tipos";

export function Avisos({ e }: { e: Edicao }) {
  const modal = usarModalCampos();
  const lista = e.avisos || [];
  const avisados = lista.filter((a) => a.avisado).length;

  function editar(i: number | null) {
    const atual: Aviso = i == null ? { id: uid("av"), nome: "", papel: "", avisado: false, obs: "" } : lista[i];
    modal.abrir({
      titulo: i == null ? "Pessoa para avisar" : "Editar pessoa",
      campos: CAMPOS_AVISO,
      valores: atual as unknown as Record<string, unknown>,
      aoAplicar: (s) => {
        if (!s.nome) return;
        alterarEdicao(e.id, (ed) => {
          ed.avisos = ed.avisos || [];
          if (i == null) ed.avisos.push({ ...atual, ...s } as Aviso);
          else Object.assign(ed.avisos[i], s);
        });
      },
      aoExcluir: i == null ? undefined : () => {
        if (window.confirm("Tirar da lista?")) alterarEdicao(e.id, (ed) => { ed.avisos?.splice(i, 1); });
      },
    });
  }

  const alternar = (i: number) => alterarEdicao(e.id, (ed) => { if (ed.avisos?.[i]) ed.avisos[i].avisado = !ed.avisos[i].avisado; });

  function desmarcarTodos() {
    if (window.confirm("Mudou de novo? Desmarca todo mundo para avisar outra vez.")) {
      alterarEdicao(e.id, (ed) => { (ed.avisos || []).forEach((a) => { a.avisado = false; }); });
    }
  }

  return (
    <>
      <div className="sechead bloco">
        <div className="ksub">Quem avisar{lista.length ? ` · ${avisados} de ${lista.length} avisados` : ""}</div>
        <div className="actions">
          {avisados > 0 && <button className="sdp-btn small" onClick={desmarcarTodos}>Desmarcar todos</button>}
          <button className="sdp-btn small" onClick={() => editar(null)}>+ Pessoa</button>
        </div>
      </div>
      {lista.length === 0
        ? <div className="note">Ninguém na lista. Quem precisa saber quando muda data, local ou formato?</div>
        : (
          <div className="tw">
            <table className="avisos curta">
              <thead><tr><th style={{ width: 36 }} /><th>Nome</th><th className="larga">Papel</th><th className="larga">Obs.</th><th /></tr></thead>
              <tbody>
                {lista.map((a, i) => (
                  <tr key={a.id} className={a.avisado ? "done" : ""}>
                    <td>
                      <span className={"chk " + (a.avisado ? "on" : "")} role="checkbox" aria-checked={a.avisado} tabIndex={0}
                        title={a.avisado ? "avisado" : "marcar como avisado"} onClick={() => alternar(i)}
                        onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); alternar(i); } }}>
                        {a.avisado ? "✓" : ""}
                      </span>
                    </td>
                    <td className="task">
                      {a.nome}
                      <span className="m so-celular">{[a.papel, a.obs].filter(Boolean).join(" · ")}</span>
                    </td>
                    <td className="larga">{a.papel}</td>
                    <td className="larga"><span className="m">{a.obs}</span></td>
                    <td className="rowact"><button className="sdp-btn small" onClick={() => editar(i)}>editar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      {modal.elemento}
    </>
  );
}
