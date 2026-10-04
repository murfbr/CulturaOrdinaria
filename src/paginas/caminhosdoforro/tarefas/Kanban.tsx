/* O kanban: uma coluna por status da lista, cartões com o ID e a frente do
   plano, prioridade, núcleo, responsável (herdado do núcleo quando a tarefa
   não tem), prazo, de quem depende e avisos. Arrastar o cartão entre as
   colunas ou trocar o status no próprio cartão grava. */
import { useState } from "react";
import { toast } from "../../../components/Toast";
import { clonar } from "../../../utils";
import { cx } from "../../../utils/classes";
import { dataBr, foraDoNucleo, nomeCadastro, respEfetivo, tarefaAtrasada } from "../calculo";
import { gravar } from "../dados";
import { opcoes, rotulo } from "../listas";
import type { Base, TarefaFestival } from "../tipos";
import { ESTILO_CONTROLE_BASE, Opcoes } from "../ui/Campo";
import { NOTA } from "../ui/classes";
import { PilulaPrioridade, comparador, type OrdemTarefas } from "./etiquetas";

interface Props { base: Base; tarefas: TarefaFestival[]; ordem: OrdemTarefas; abrir: (id: string) => void }

export function Kanban({ base, tarefas, ordem, abrir }: Props) {
  const [alvo, setAlvo] = useState<string | null>(null);
  const p = base.pagina;
  const status = p.listas.statusTarefa;

  function mover(id: string, novo: string) {
    const t = base.tarefas[id];
    if (!t || t.status === novo) return;
    gravar("tarefas", { ...clonar(t), status: novo });
    toast("Movida para " + rotulo(p, "statusTarefa", novo) + ".");
  }

  const semStatus = tarefas.filter((t) => !status.some((s) => s.id === t.status)).length;

  return (
    <>
      <div className="cdf:grid cdf:auto-cols-[minmax(260px,1fr)] cdf:grid-flow-col cdf:items-start cdf:gap-3 cdf:overflow-x-auto cdf:pb-1.5">
        {status.map((st) => {
          const cartoes = tarefas.filter((t) => t.status === st.id).sort(comparador(ordem));
          return (
            <section
              key={st.id} aria-label={st.nome}
              onDragOver={(e) => { e.preventDefault(); if (alvo !== st.id) setAlvo(st.id); }}
              onDragLeave={() => setAlvo((a) => (a === st.id ? null : a))}
              onDrop={(e) => { e.preventDefault(); setAlvo(null); const id = e.dataTransfer.getData("text/plain"); if (id) mover(id, st.id); }}
              className={cx(
                "cdf:flex cdf:min-h-[140px] cdf:flex-col cdf:gap-2 cdf:rounded-xl cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie-2 cdf:p-2.5",
                alvo === st.id && "cdf:outline-2 cdf:outline-dashed cdf:outline-primaria cdf:-outline-offset-2",
              )}
            >
              <h3 className="cdf:mx-1 cdf:my-0.5 cdf:flex cdf:items-baseline cdf:justify-between cdf:font-display cdf:text-xl cdf:font-black cdf:text-primaria">
                {st.nome}<span className="cdf:font-sans cdf:text-sm cdf:font-semibold cdf:text-fraco">{cartoes.length}</span>
              </h3>
              {cartoes.length
                ? cartoes.map((t) => <Cartao key={t.id} base={base} t={t} abrir={abrir} mover={mover} />)
                : <p className="cdf:m-0 cdf:px-1 cdf:py-1.5 cdf:text-sm cdf:text-fraco">Nada aqui.</p>}
            </section>
          );
        })}
      </div>
      {semStatus > 0 && <p className={NOTA + " cdf:mt-3"}>{semStatus} tarefa(s) com status que não existe mais na lista. Edite para corrigir.</p>}
    </>
  );
}

function Cartao({ base, t, abrir, mover }: { base: Base; t: TarefaFestival; abrir: (id: string) => void; mover: (id: string, status: string) => void }) {
  const p = base.pagina;
  const r = respEfetivo(base, t);
  const herdado = !t.responsavel && !!r;
  const atrasada = tarefaAtrasada(t);
  const feita = t.status === "concluido";
  return (
    <article
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", t.id); e.dataTransfer.effectAllowed = "move"; }}
      className={cx("cdf:cursor-grab cdf:rounded-[10px] cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie cdf:px-3 cdf:py-2.5", atrasada && "cdf:shadow-[inset_4px_0_0_var(--cdf-erro)]")}
    >
      {(t.codigo || t.frente) && (
        <p className="cdf:m-0 cdf:mb-1 cdf:text-xs cdf:font-bold cdf:text-fraco">
          {t.codigo && <span className="cdf:tabular-nums cdf:text-tinta-2">{t.codigo}</span>}
          {t.codigo && t.frente && " · "}
          {t.frente && <span className="cdf:uppercase cdf:tracking-[.04em]">{t.frente}</span>}
        </p>
      )}
      <h4 className={cx("cdf:m-0 cdf:mb-1.5 cdf:text-[15px] cdf:font-semibold cdf:leading-[1.3]", feita && "cdf:text-fraco cdf:line-through")}>
        <button type="button" onClick={() => abrir(t.id)} className="cdf:cursor-pointer cdf:border-0 cdf:bg-transparent cdf:p-0 cdf:text-left">{t.titulo}</button>
      </h4>
      <div className="cdf:flex cdf:flex-wrap cdf:items-center cdf:gap-x-2.5 cdf:gap-y-1 cdf:text-[13px] cdf:text-fraco">
        <PilulaPrioridade t={t} />
        <span className="cdf:rounded-md cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie-2 cdf:px-2 cdf:py-0.5">{rotulo(p, "nucleos", t.nucleo)}</span>
        <span className={herdado ? "cdf:italic" : ""}>{r ? nomeCadastro(base, r) + (herdado ? " (responsável do núcleo)" : "") : "Sem responsável"}</span>
        {t.prazo && <span className={atrasada ? "cdf:font-bold cdf:text-erro" : ""}>{(atrasada ? "Venceu " : "Até ") + dataBr(t.prazo)}</span>}
      </div>
      {t.dependencia && <p className="cdf:m-0 cdf:mt-1.5 cdf:text-[13px] cdf:text-fraco">Depende de: {t.dependencia}</p>}
      {foraDoNucleo(base, t) && (
        <span className="cdf:mt-1.5 cdf:inline-block cdf:cursor-help cdf:rounded-full cdf:bg-rec-bg cdf:px-2 cdf:py-0.5 cdf:text-[12.5px] cdf:font-bold cdf:text-rec" title="O responsável não é mais membro deste núcleo.">Fora do núcleo</span>
      )}
      <select aria-label="Mover para" value={t.status} onChange={(e) => mover(t.id, e.target.value)} className={ESTILO_CONTROLE_BASE + " cdf:mt-2 cdf:w-auto cdf:px-1.5 cdf:py-[3px] cdf:text-[13px]"}>
        <Opcoes lista={opcoes(p, "statusTarefa")} />
      </select>
    </article>
  );
}
