/* Tarefas: filtros (busca, núcleo, responsável, só atrasadas), a tabela de
   contagem por núcleo (clicar filtra) e o kanban. Os filtros valem enquanto
   a página está aberta; "Ver tarefas" de um núcleo ou de uma pessoa chega
   aqui com o filtro pedido. */
import { useState } from "react";
import { cadastrosDoTipo, contasNucleo, nomeCadastro, pctTexto, respEfetivo, tarefaAtrasada } from "../calculo";
import { normalizar, opcoes } from "../listas";
import type { Base } from "../tipos";
import { Botao } from "../ui/Botao";
import { Check, ESTILO_CONTROLE_BASE, Opcoes } from "../ui/Campo";
import { BARRA, LINK } from "../ui/classes";
import { CabecalhoVista } from "../ui/CabecalhoVista";
import { NUM, Tabela, Td, Th } from "../ui/Tabela";
import { TITULOS, filtroTarefasPedido, pedirFiltroTarefas } from "../vista";
import { Kanban } from "./Kanban";
import { ModalTarefa } from "./ModalTarefa";

interface Filtros { nucleo: string; resp: string; atrasadas: boolean; busca: string }
let filtrosLembrados: Filtros = { nucleo: "", resp: "", atrasadas: false, busca: "" };

export function TelaTarefas({ base }: { base: Base }) {
  const [f, setF] = useState<Filtros>(() => {
    if (filtroTarefasPedido) {
      filtrosLembrados = { nucleo: filtroTarefasPedido.nucleo || "", resp: filtroTarefasPedido.resp || "", atrasadas: false, busca: "" };
      pedirFiltroTarefas(null);
    }
    return filtrosLembrados;
  });
  const [modal, setModal] = useState<{ id: string | null } | null>(null);
  const p = base.pagina;
  const equipe = cadastrosDoTipo(base, "equipe");
  const mudarF = (parte: Partial<Filtros>) => { filtrosLembrados = { ...filtrosLembrados, ...parte }; setF(filtrosLembrados); };
  const [titulo, lead] = TITULOS.tarefas!;

  const q = normalizar(f.busca.trim());
  const todas = Object.values(base.tarefas);
  const visiveis = todas.filter((t) =>
    (!f.nucleo || t.nucleo === f.nucleo)
    && (!f.resp || (f.resp === "_sem" ? !respEfetivo(base, t) : respEfetivo(base, t) === f.resp))
    && (!f.atrasadas || tarefaAtrasada(t))
    && (!q || normalizar([t.titulo, t.anotacoes].join(" ")).includes(q)));
  const nucleos = [...p.nucleos, ...(todas.some((t) => !t.nucleo) ? [{ id: "_sem", nome: "Sem núcleo", responsavel: null }] : [])];
  const select = ESTILO_CONTROLE_BASE + " cdf:w-auto cdf:flex-[0_1_190px]";

  return (
    <>
      <CabecalhoVista titulo={titulo} lead={lead} />
      <div className={BARRA + " cdf:mt-[22px]"}>
        <input type="search" aria-label="Buscar" placeholder="Buscar tarefa ou anotação" value={f.busca} onChange={(e) => mudarF({ busca: e.target.value })} className={ESTILO_CONTROLE_BASE + " cdf:flex-[1_1_240px]"} />
        <select aria-label="Núcleo" value={f.nucleo} onChange={(e) => mudarF({ nucleo: e.target.value })} className={select}><Opcoes lista={opcoes(p, "nucleos", "Todos os núcleos")} /></select>
        <select aria-label="Responsável" value={f.resp} onChange={(e) => mudarF({ resp: e.target.value })} className={select}>
          <option value="">Todas as pessoas</option>
          {equipe.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
          <option value="_sem">Sem responsável</option>
        </select>
        <Check rotulo="Só atrasadas" checked={f.atrasadas} onChange={(e) => mudarF({ atrasadas: e.target.checked })} />
        <Botao variante="primario" className="cdf:md:ml-auto" onClick={() => setModal({ id: null })}>Nova tarefa</Botao>
      </div>

      <Tabela className="cdf:mb-[18px]">
        <thead>
          <tr><Th>Núcleo</Th><Th>Responsável</Th><Th className={NUM}>Abertas</Th><Th className={NUM}>Concluídas</Th><Th className={NUM}>Atrasadas</Th><Th className={NUM}>% atrasadas</Th></tr>
        </thead>
        <tbody>
          {nucleos.map((n) => {
            const c = contasNucleo(base, n.id);
            return (
              <tr key={n.id}>
                <Td><button type="button" className={LINK} onClick={() => mudarF({ nucleo: n.id === "_sem" ? "" : n.id })}>{n.nome}</button></Td>
                <Td>{n.responsavel ? nomeCadastro(base, n.responsavel) : <span className="cdf:text-fraco">—</span>}</Td>
                <Td className={NUM}>{c.abertas}</Td>
                <Td className={NUM}>{c.feitas}</Td>
                <Td className={NUM}>{c.atrasadas ? <span className="cdf:font-bold cdf:text-erro">{c.atrasadas}</span> : "0"}</Td>
                <Td className={NUM}>{c.abertas ? pctTexto(c.atrasadas, c.abertas) : "—"}</Td>
              </tr>
            );
          })}
        </tbody>
      </Tabela>

      <Kanban base={base} tarefas={visiveis} abrir={(id) => setModal({ id })} />

      {modal && <ModalTarefa base={base} id={modal.id} preset={modal.id ? undefined : { nucleo: f.nucleo }} aoFechar={() => setModal(null)} />}
    </>
  );
}
