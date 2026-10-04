/* A lista: as tarefas agrupadas por núcleo, uma tabela por núcleo com o que
   o plano de ação traz de cada tarefa (ID, frente, tarefa, de quem depende,
   a entrega, observações, responsável, prazo, prioridade e status). O título
   do núcleo traz o responsável, o escopo e a conta do que falta. Trocar o
   status na própria linha grava; clicar na tarefa abre o modal. */
import { toast } from "../../../components/Toast";
import { clonar } from "../../../utils";
import { cx } from "../../../utils/classes";
import { contarTarefas, dataBr, foraDoNucleo, nomeCadastro, pctTexto, respEfetivo, tarefaAtrasada } from "../calculo";
import { gravar } from "../dados";
import { opcoes, rotulo } from "../listas";
import type { Base, Nucleo, TarefaFestival } from "../tipos";
import { Opcoes } from "../ui/Campo";
import { NOTA, SECAO } from "../ui/classes";
import { Tabela, Td, Th } from "../ui/Tabela";
import { SelecaoStatus } from "../ui/Tag";
import { PilulaPrioridade, classeStatusTarefa, comparador, type OrdemTarefas } from "./etiquetas";

interface Props { base: Base; tarefas: TarefaFestival[]; ordem: OrdemTarefas; /** Mostra dependência, entrega e observações sob cada tarefa. */ detalhes: boolean; abrir: (id: string) => void }

const plural = (n: number, um: string, varios: string) => n + " " + (n === 1 ? um : varios);
/** Linha pequena sob o título da tarefa (dependência, entrega, observações). */
const SOB = "cdf:mt-0.5 cdf:block cdf:max-w-[78ch] cdf:text-[13px] cdf:leading-[1.35]";

export function Lista({ base, tarefas, ordem, detalhes, abrir }: Props) {
  const p = base.pagina;
  const grupos: { nucleo: Nucleo; tarefas: TarefaFestival[] }[] = [
    ...p.nucleos.map((n) => ({ nucleo: n, tarefas: tarefas.filter((t) => t.nucleo === n.id) })),
    { nucleo: { id: "_sem", nome: "Sem núcleo", responsavel: null }, tarefas: tarefas.filter((t) => !p.nucleos.some((n) => n.id === t.nucleo)) },
  ].filter((g) => g.tarefas.length);

  function mover(t: TarefaFestival, novo: string) {
    if (t.status === novo) return;
    gravar("tarefas", { ...clonar(t), status: novo });
    toast("Movida para " + rotulo(p, "statusTarefa", novo) + ".");
  }

  return (
    <>
      {grupos.map(({ nucleo: n, tarefas: ts }) => {
        const c = contarTarefas(ts);
        return (
          <section key={n.id} aria-label={n.nome}>
            <h2 className={SECAO}>
              {n.nome}
              <span className="cdf:ml-auto cdf:font-sans cdf:text-sm cdf:font-semibold cdf:text-fraco">
                {plural(c.total, "tarefa", "tarefas")}
                {c.criticas > 0 && <> · {plural(c.criticas, "crítica aberta", "críticas abertas")}</>}
                {c.atrasadas > 0 && <> · <span className="cdf:text-erro">{plural(c.atrasadas, "atrasada", "atrasadas")}</span></>}
                {" · "}{pctTexto(c.feitas, c.total)} concluído
              </span>
            </h2>
            {(n.escopo || n.id !== "_sem") && (
              <p className={NOTA + " cdf:mb-2.5 cdf:max-w-[96ch]"}>
                {n.id !== "_sem" && <>{n.responsavel ? <>Responsável: <strong className="cdf:text-tinta-2">{nomeCadastro(base, n.responsavel)}</strong></> : "Sem responsável"}{n.escopo ? ". " : ""}</>}
                {n.escopo}
              </p>
            )}
            <Tabela>
              <thead>
                <tr><Th>ID</Th><Th className="cdf:w-full">Tarefa</Th><Th>Responsável</Th><Th>Prazo</Th><Th>Prioridade</Th><Th>Status</Th></tr>
              </thead>
              <tbody>
                {[...ts].sort(comparador(ordem)).map((t) => {
                  const r = respEfetivo(base, t);
                  const herdado = !t.responsavel && !!r;
                  const atrasada = tarefaAtrasada(t);
                  const feita = t.status === "concluido";
                  return (
                    <tr key={t.id}>
                      <Td className="cdf:whitespace-nowrap cdf:text-sm cdf:font-bold cdf:tabular-nums cdf:text-tinta-2">{t.codigo || <span className="cdf:font-normal cdf:text-fraco">—</span>}</Td>
                      <Td className="cdf:min-w-[280px]">
                        {t.frente && <span className="cdf:mb-0.5 cdf:block cdf:text-xs cdf:font-bold cdf:uppercase cdf:tracking-[.04em] cdf:text-fraco">{t.frente}</span>}
                        <button
                          type="button" onClick={() => abrir(t.id)}
                          className={cx("cdf:cursor-pointer cdf:border-0 cdf:bg-transparent cdf:p-0 cdf:text-left cdf:font-semibold cdf:leading-[1.3] cdf:hover:underline", feita && "cdf:text-fraco cdf:line-through")}
                        >
                          {t.titulo}
                        </button>
                        {detalhes && (t.dependencia || t.entrega) && (
                          <span className={SOB + " cdf:text-tinta-2"}>
                            {t.dependencia && <><span className="cdf:text-fraco">Depende de</span> {t.dependencia}</>}
                            {t.dependencia && t.entrega && <span className="cdf:text-fraco"> · </span>}
                            {t.entrega && <><span className="cdf:text-fraco">Entrega</span> {t.entrega}</>}
                          </span>
                        )}
                        {detalhes && t.anotacoes && <span className={SOB + " cdf:text-fraco"}>{t.anotacoes}</span>}
                      </Td>
                      <Td className="cdf:whitespace-nowrap cdf:text-sm">
                        {r ? <span className={herdado ? "cdf:italic cdf:text-fraco" : ""}>{nomeCadastro(base, r)}{herdado ? " (do núcleo)" : ""}</span> : <span className="cdf:text-fraco" title="Sem responsável">—</span>}
                        {foraDoNucleo(base, t) && <span className="cdf:mt-0.5 cdf:block cdf:text-xs cdf:font-bold cdf:text-rec" title="O responsável não é mais membro deste núcleo.">Fora do núcleo</span>}
                      </Td>
                      <Td className={cx("cdf:whitespace-nowrap cdf:text-sm cdf:tabular-nums", atrasada && "cdf:font-bold cdf:text-erro")}>
                        {t.prazo ? (atrasada ? "Venceu " : "") + dataBr(t.prazo) : <span className="cdf:text-fraco">—</span>}
                      </Td>
                      <Td><PilulaPrioridade t={t} vazio="—" /></Td>
                      <Td>
                        <SelecaoStatus aria-label={"Status de " + (t.codigo || t.titulo)} classe={classeStatusTarefa(t.status)} value={t.status} onChange={(e) => mover(t, e.target.value)}>
                          <Opcoes lista={opcoes(p, "statusTarefa")} />
                          {!p.listas.statusTarefa.some((s) => s.id === t.status) && <option value={t.status}>{t.status || "sem status"}</option>}
                        </SelecaoStatus>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Tabela>
          </section>
        );
      })}
    </>
  );
}
