/* Tarefas da edição: são tarefas da Central (coleção `tarefas`, origem
   proj:<projeto>, campo `edicaoId`), agrupadas pela fase do preset. O
   quadradinho avança o status (a fazer → em andamento → concluído) no mesmo
   documento que Gestão → Tarefas mostra. */
import { Fragment } from "react";
import { nomeEquipe } from "../../../lib/nomes";
import { ROTULO_TAREFA, type Tarefa } from "../../../types";
import { br, diasAte, hojeIso, tarefasDaEdicao } from "../calculo";
import { alternarStatusTarefa, excluirTarefa, salvarTarefa, tarefaNova } from "../dados";
import { usarModalCampos } from "../ModalCampos";
import { camposTarefa } from "./pedidos";
import type { FaseFesta } from "../../../types";
import type { Edicao, Painel } from "../tipos";

export function Tarefas({ painel, e }: { painel: Painel; e: Edicao }) {
  const modal = usarModalCampos();
  const lista = tarefasDaEdicao(painel, e);
  const hoje = hojeIso();
  const fases = painel.presets.fases;

  function editar(t: Tarefa | null) {
    const atual = t || tarefaNova(e.id, fases.find((f) => f.id === "d15")?.id || fases[0]?.id || "");
    modal.abrir({
      titulo: t ? "Editar tarefa" : "Nova tarefa",
      campos: camposTarefa(fases, painel.equipe),
      valores: atual as unknown as Record<string, unknown>,
      aoAplicar: (s) => { if (s.titulo) salvarTarefa({ ...atual, ...s } as Tarefa); },
      aoExcluir: t ? () => { if (window.confirm("Excluir tarefa? (vai para a lixeira da Central)")) excluirTarefa(t.id); } : undefined,
    });
  }

  const cabecalho = (
    <div className="sechead">
      <div><div className="sdp-eyebrow">{e.nome} · produção</div><h2>Tarefas</h2></div>
      <div className="actions"><button className="sdp-btn small" onClick={() => editar(null)}>+ Tarefa</button></div>
    </div>
  );
  if (!lista.length) {
    return <section id="e-tarefas">{cabecalho}<p className="lead">Não houve registro de tarefas nesta edição.</p>{modal.elemento}</section>;
  }

  const feitas = lista.filter((t) => t.status === "feito").length;
  const atrasadas = lista.filter((t) => t.status !== "feito" && t.prazo && t.prazo < hoje);
  const dias = diasAte(e.data);
  const limites = fases.map((f) => parseInt(f.id.replace("d", "")) || 0).filter((x) => x > 0).sort((a, b) => b - a);

  /** Qual fase é a atual (now) e quais já passaram (past), pela distância do evento. */
  const classeFase = (f: FaseFesta): string => {
    if (e.status === "fechada") return "past";
    if (dias == null) return "";
    if (f.id === "pos") return dias < 0 ? "now" : "";
    if (f.id === "dia") return dias === 0 ? "now" : dias < 0 ? "past" : "";
    const limite = parseInt(f.id.replace("d", "")) || 0;
    const menor = limites.filter((x) => x < limite)[0] || 0;
    if (dias <= 0) return "past";
    if (dias <= limite && dias > menor) return "now";
    if (dias <= menor) return "past";
    return "";
  };

  const semFase = lista.filter((t) => !fases.some((f) => f.id === t.fase));

  const tabela = (itens: Tarefa[]) => (
    <div className="tw">
      <table>
        <thead>
          <tr><th style={{ width: 36 }} /><th>Tarefa</th><th style={{ width: 140 }}>Responsável</th><th style={{ width: 90 }}>Prazo</th><th style={{ width: 200 }}>Origem / obs.</th><th style={{ width: 70 }} /></tr>
        </thead>
        <tbody>
          {itens.map((t) => {
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
                <td className="task">{t.titulo}{t.status === "and" && <> <span className="tag warn">em andamento</span></>}</td>
                <td>{t.respId ? nomeEquipe(t.respId) : "—"}</td>
                <td className="sdp-prazo">{t.prazo ? br(t.prazo) : "—"}</td>
                <td><span className="m">{t.obs}</span></td>
                <td className="rowact"><button className="sdp-btn small" onClick={() => editar(t)}>editar</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <section id="e-tarefas">
      {cabecalho}
      <p className="lead">
        {feitas} de {lista.length} feitas
        {atrasadas.length ? <> · <b style={{ color: "var(--red)" }}>{atrasadas.length} atrasada{atrasadas.length > 1 ? "s" : ""}</b></> : null}.
        Clique no quadrado para avançar o status (a fazer → em andamento → concluído). São as mesmas tarefas de
        Gestão → Tarefas na Central.
      </p>
      <div className="progress"><i style={{ width: (feitas / lista.length) * 100 + "%" }} /></div>
      <div className="phases">
        {fases.map((f) => {
          const n = lista.filter((t) => t.fase === f.id).length;
          if (!n) return null;
          return <span className={"phase " + classeFase(f)} key={f.id}>{f.label} · {lista.filter((t) => t.fase === f.id && t.status === "feito").length}/{n}</span>;
        })}
      </div>
      {fases.map((f) => {
        const itens = lista.filter((t) => t.fase === f.id);
        if (!itens.length) return null;
        return (
          <Fragment key={f.id}>
            <div className="ksub">{f.label} · {f.desc}</div>
            {tabela(itens)}
          </Fragment>
        );
      })}
      {semFase.length > 0 && (
        <>
          <div className="ksub">Sem fase</div>
          {tabela(semFase)}
        </>
      )}
      {modal.elemento}
    </section>
  );
}
