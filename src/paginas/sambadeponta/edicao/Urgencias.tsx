/* Urgências: tarefas da Central (coleção `tarefas`) fixadas nesta edição.
   Não é uma lista à parte: "+ Urgência" cria a tarefa na Central já fixada,
   "Fixar tarefa da Central" escolhe uma que já existe (inclusive as que não
   são da edição, como as da agenda da semana) e a estrela na seção Tarefas
   fixa uma da edição. Assim ela segue aparecendo no quadro, no Resumo e na
   agenda da Central. */
import { nomeEquipe } from "../../../lib/nomes";
import { ROTULO_TAREFA, type Tarefa } from "../../../types";
import { br, hojeIso, tarefasParaFixar, urgentesDaEdicao } from "../calculo";
import { alternarStatusTarefa, alternarUrgente, salvarTarefa, tarefaNova } from "../dados";
import { usarModalCampos } from "../ModalCampos";
import { camposTarefa } from "./pedidos";
import type { Edicao, Painel } from "../tipos";

/** Rótulo de uma tarefa no seletor: título curto e prazo. */
const rotuloTarefa = (t: Tarefa): string => {
  const titulo = (t.titulo || "(sem título)").replace(/\s+/g, " ");
  return (titulo.length > 70 ? titulo.slice(0, 69) + "…" : titulo) + (t.prazo ? " · até " + br(t.prazo) : "");
};

export function Urgencias({ painel, e }: { painel: Painel; e: Edicao }) {
  const modal = usarModalCampos();
  const lista = urgentesDaEdicao(painel, e);
  const hoje = hojeIso();
  const fases = painel.presets.fases;
  const abertas = lista.filter((t) => t.status !== "feito").length;
  const disponiveis = tarefasParaFixar(painel, e);

  function editar(t: Tarefa | null) {
    const atual = t || tarefaNova(e.id, fases.find((f) => f.id === "d15")?.id || fases[0]?.id || "");
    // Tarefa que não é desta edição não ganha fase: o campo só faz sentido dentro da edição.
    const daEdicao = atual.edicaoId === e.id;
    modal.abrir({
      titulo: t ? "Editar urgência" : "Nova urgência (vira tarefa da Central)",
      campos: camposTarefa(fases, painel.equipe).filter((c) => daEdicao || c.k !== "fase"),
      valores: atual as unknown as Record<string, unknown>,
      aoAplicar: (s) => {
        if (!s.titulo) return;
        salvarTarefa({ ...atual, ...s } as Tarefa);
        if (!t) alternarUrgente(e.id, atual.id);
      },
    });
  }

  function fixarExistente() {
    modal.abrir({
      titulo: "Fixar tarefa da Central",
      campos: [{
        k: "tarefaId", label: "Tarefa (abertas; as da festa primeiro)", type: "select", full: true,
        opts: disponiveis.map((t) => [t.id, rotuloTarefa(t)] as [string, string]),
      }],
      valores: { tarefaId: disponiveis[0]?.id || "" },
      aoAplicar: (s) => { const id = String(s.tarefaId || ""); if (id) alternarUrgente(e.id, id); },
    });
  }

  return (
    <>
      <div className="sechead bloco">
        <div className="ksub">Urgências{lista.length ? ` · ${abertas} em aberto` : ""}</div>
        <div className="actions">
          {disponiveis.length > 0 && <button className="sdp-btn small" onClick={fixarExistente}>Fixar tarefa da Central</button>}
          <button className="sdp-btn small" onClick={() => editar(null)}>+ Urgência</button>
        </div>
      </div>
      {lista.length === 0
        ? <div className="note">Nenhuma urgência fixada. Crie com <b>+ Urgência</b>, escolha uma que já existe em <b>Fixar tarefa da Central</b> ou use a estrela ☆ na seção Tarefas.</div>
        : (
          <div className="tw">
            <table className="curta">
              <thead><tr><th style={{ width: 36 }} /><th>Tarefa</th><th className="larga" style={{ width: 140 }}>Responsável</th><th className="larga" style={{ width: 90 }}>Prazo</th><th /></tr></thead>
              <tbody>
                {lista.map((t) => {
                  const atrasada = t.status !== "feito" && Boolean(t.prazo) && t.prazo < hoje;
                  return (
                    <tr key={t.id} className={(t.status === "feito" ? "done" : "") + (atrasada ? " late" : "")}>
                      <td>
                        <span className={"chk " + (t.status === "feito" ? "on" : t.status === "and" ? "half" : "")}
                          role="button" tabIndex={0} title={ROTULO_TAREFA[t.status]}
                          onClick={() => alternarStatusTarefa(t)}
                          onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); alternarStatusTarefa(t); } }}>
                          {t.status === "feito" ? "✓" : t.status === "and" ? "…" : ""}
                        </span>
                      </td>
                      <td className="task">
                        {t.titulo}{t.status === "and" && <> <span className="tag warn">em andamento</span></>}
                        {t.edicaoId !== e.id && <> <span className="tag neutral" title="tarefa da Central que não é desta edição">da Central</span></>}
                        {t.obs && <span className="m">{t.obs}</span>}
                        <span className={"m so-celular" + (atrasada ? " atrasada" : "")}>
                          {[t.respId ? nomeEquipe(t.respId) : "sem responsável", t.prazo ? "até " + br(t.prazo) : "sem prazo"].join(" · ")}
                        </span>
                      </td>
                      <td className="larga">{t.respId ? nomeEquipe(t.respId) : "—"}</td>
                      <td className="larga sdp-prazo">{t.prazo ? br(t.prazo) : "—"}</td>
                      <td className="rowact">
                        <button className="sdp-btn small" title="tira das urgências (a tarefa continua na Central)" onClick={() => alternarUrgente(e.id, t.id)}>soltar</button>
                        <button className="sdp-btn small" onClick={() => editar(t)}>editar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      {modal.elemento}
    </>
  );
}
