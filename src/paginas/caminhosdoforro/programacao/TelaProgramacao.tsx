/* Programação: a grade dos três dias. Filtros (agrupar por dia, espaço ou
   atividade; dia; espaço; atividade; só pendências), os quatro números, a
   legenda das bolinhas, "marcar os visíveis como revisados" e a grade em si.
   Os filtros valem enquanto a página está aberta. */
import { useState } from "react";
import { toast } from "../../../components/Toast";
import { clonar } from "../../../utils";
import { porNome } from "../calculo";
import { gravar } from "../dados";
import { opcoes } from "../listas";
import type { Base, Horario } from "../tipos";
import { Botao } from "../ui/Botao";
import { Check, ESTILO_CONTROLE_BASE, Opcoes } from "../ui/Campo";
import { BARRA } from "../ui/classes";
import { CabecalhoVista } from "../ui/CabecalhoVista";
import { Resumo } from "../ui/Resumo";
import { Segmentado } from "../ui/Segmentado";
import { TITULOS } from "../vista";
import { Grade } from "./Grade";
import { ModalHorario } from "./ModalHorario";
import { analisarGrade, classePonto } from "./calculoGrade";

export type Agrupar = "dia" | "espaco" | "atividade";
export interface FiltrosGrade { agrupar: Agrupar; dia: string; espaco: string; atividade: string; pendencias: boolean }
let filtrosLembrados: FiltrosGrade = { agrupar: "dia", dia: "", espaco: "", atividade: "", pendencias: false };

/** O modal de horário: editar um (id) ou criar com valores iniciais. */
export type PedidoHorario = { id: string } | { id: null; preset: Partial<Horario> };

export function TelaProgramacao({ base }: { base: Base }) {
  const [f, setF] = useState<FiltrosGrade>(filtrosLembrados);
  const [modal, setModal] = useState<PedidoHorario | null>(null);
  const p = base.pagina;
  const mudarF = (parte: Partial<FiltrosGrade>) => { filtrosLembrados = { ...filtrosLembrados, ...parte }; setF(filtrosLembrados); };
  const [titulo, lead] = TITULOS.programacao!;

  const analise = analisarGrade(base);
  const todos = Object.values(base.slots);
  const visiveis = todos.filter((s) =>
    (!f.dia || s.dia === f.dia) && (!f.espaco || s.espaco === f.espaco) && (!f.atividade || s.atividade === f.atividade)
    && (!f.pendencias || analise.pendencias[s.id].length > 0));
  const conta = (t: string) => visiveis.filter((s) => analise.pendencias[s.id].includes(t as never)).length;
  const shows = visiveis.filter((s) => s.atividade === "show");
  const showsComAtracao = shows.filter((s) => (s.participantes || []).length).length;
  const conflitos = visiveis.filter((s) => analise.conflitos[s.id]).length;
  const aRevisar = visiveis.filter((s) => s.revisar);

  function revisarVisiveis() {
    aRevisar.forEach((s) => gravar("slots", { ...clonar(s), revisar: false }));
    toast(aRevisar.length + " horários marcados como revisados.");
  }

  const select = ESTILO_CONTROLE_BASE + " cdf:w-auto cdf:flex-[0_1_190px]";
  const espacos = Object.values(base.espacos).sort(porNome);
  const presetNovo = (): Partial<Horario> => ({ dia: f.dia || p.listas.dias[0]?.id || "", espaco: f.espaco || "", atividade: f.atividade || "show" });

  return (
    <>
      <CabecalhoVista titulo={titulo} lead={lead} />
      <div className={BARRA + " cdf:mt-[22px]"}>
        <span className="cdf:text-sm cdf:text-fraco">Agrupar por</span>
        <Segmentado rotulo="Agrupar por" opcoes={[["dia", "Dia"], ["espaco", "Espaço"], ["atividade", "Atividade"]]} valor={f.agrupar} aoMudar={(agrupar) => mudarF({ agrupar })} />
        <select aria-label="Dia" value={f.dia} onChange={(e) => mudarF({ dia: e.target.value })} className={select}><Opcoes lista={opcoes(p, "dias", "Todos os dias")} /></select>
        <select aria-label="Espaço" value={f.espaco} onChange={(e) => mudarF({ espaco: e.target.value })} className={select}>
          <option value="">Todos os espaços</option>
          {espacos.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <select aria-label="Atividade" value={f.atividade} onChange={(e) => mudarF({ atividade: e.target.value })} className={select}><Opcoes lista={opcoes(p, "atividades", "Todas as atividades")} /></select>
        <Check rotulo="Só pendências" checked={f.pendencias} onChange={(e) => mudarF({ pendencias: e.target.checked })} />
        <Botao variante="primario" className="cdf:md:ml-auto" onClick={() => setModal({ id: null, preset: presetNovo() })}>Novo horário</Botao>
      </div>

      <Resumo
        itens={[
          { titulo: "Horários", valor: visiveis.length, sub: visiveis.length === todos.length ? "na grade inteira" : "de " + todos.length + " com os filtros" },
          { titulo: "Shows com atração", valor: showsComAtracao + " de " + shows.length, sub: conta("aguardando") + " horários com alguém ainda não confirmado" },
          { titulo: "A definir", valor: conta("vazio"), sub: "horários sem ninguém escalado" },
          { titulo: "Conflitos", valor: conflitos, sub: conflitos ? "passe o mouse no aviso da linha" : "nenhum" },
        ]}
      />

      <div className={BARRA}>
        <p className="cdf:m-0 cdf:flex cdf:flex-wrap cdf:gap-3.5 cdf:text-[13px] cdf:text-fraco">
          {([["confirmado", "Confirmado"], ["em_conversa", "Em conversa"], ["a_contatar", "A contatar"], ["recusou", "Recusou"]] as [string, string][]).map(([st, nome]) => (
            <span key={st} className="cdf:inline-flex cdf:items-center cdf:gap-1.5"><i className={"cdf:inline-block cdf:h-2 cdf:w-2 cdf:rounded-full " + classePonto(st)} />{nome}</span>
          ))}
        </p>
        {aRevisar.length > 0 && <Botao className="cdf:md:ml-auto" onClick={revisarVisiveis}>Marcar os {aRevisar.length} horários visíveis como revisados</Botao>}
      </div>

      <Grade base={base} filtros={f} visiveis={visiveis} analise={analise} abrir={setModal} />

      {modal && <ModalHorario base={base} id={modal.id} preset={modal.id === null ? modal.preset : undefined} aoFechar={() => setModal(null)} />}
    </>
  );
}
