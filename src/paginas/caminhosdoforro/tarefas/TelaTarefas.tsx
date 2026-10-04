/* Tarefas: o plano de ação do festival por núcleo (os GTs). Em cima, as
   ações (ver em lista ou em quadro, importar o plano da planilha, baixar a
   planilha, nova tarefa) e os filtros (busca, núcleo, responsável,
   prioridade, status, só atrasadas); depois o resumo por núcleo, com a
   conta de cada status (clicar no nome filtra), e a lista ou o quadro. Os filtros valem enquanto a página
   está aberta; "Ver tarefas" de um núcleo ou de uma pessoa chega aqui com o
   filtro pedido. */
import { useState } from "react";
import { gerarCsv } from "../../../lib/csv";
import { baixarArquivo } from "../../../utils";
import { cadastrosDoTipo, contarTarefas, hojeIso, nomeCadastro, pctTexto, prioridadeDe, respEfetivo, tarefaAtrasada } from "../calculo";
import { normalizar, opcoes } from "../listas";
import { PRIORIDADES, type Base } from "../tipos";
import { Vazio } from "../ui/Bloco";
import { Botao } from "../ui/Botao";
import { Check, ESTILO_CONTROLE_BASE, Opcoes } from "../ui/Campo";
import { BARRA, LINK, SUB } from "../ui/classes";
import { CabecalhoVista } from "../ui/CabecalhoVista";
import { Segmentado } from "../ui/Segmentado";
import { NUM, Tabela, Td, Th } from "../ui/Tabela";
import { TITULOS, filtroTarefasPedido, pedirFiltroTarefas } from "../vista";
import { ORDENS, comparador, type OrdemTarefas } from "./etiquetas";
import { Kanban } from "./Kanban";
import { Lista } from "./Lista";
import { ModalImportarPlano } from "./ModalImportarPlano";
import { ModalTarefa } from "./ModalTarefa";
import { CABECALHO_PLANO, linhasDoPlano } from "./plano";

type Forma = "lista" | "quadro";
interface Filtros { nucleo: string; resp: string; prioridade: string; status: string; atrasadas: boolean; busca: string }
const SEM_FILTRO: Filtros = { nucleo: "", resp: "", prioridade: "", status: "", atrasadas: false, busca: "" };
let filtrosLembrados: Filtros = SEM_FILTRO;
let ordemLembrada: OrdemTarefas = "prazo";

const CHAVE_FORMA = "cf-tarefas-forma";
const CHAVE_DETALHES = "cf-tarefas-detalhes";
const lembrar = (chave: string, valor: string) => { try { localStorage.setItem(chave, valor); } catch { /* só não lembra */ } };
const lembrado = (chave: string) => { try { return localStorage.getItem(chave); } catch { return null; } };

export function TelaTarefas({ base }: { base: Base }) {
  const [f, setF] = useState<Filtros>(() => {
    if (filtroTarefasPedido) {
      filtrosLembrados = { ...SEM_FILTRO, nucleo: filtroTarefasPedido.nucleo || "", resp: filtroTarefasPedido.resp || "" };
      pedirFiltroTarefas(null);
    }
    return filtrosLembrados;
  });
  // Reabre como parou: lista ou quadro (sem lembrança, a lista) e com ou sem os detalhes sob cada tarefa.
  const [forma, setForma] = useState<Forma>(() => (lembrado(CHAVE_FORMA) === "quadro" ? "quadro" : "lista"));
  const [detalhes, setDetalhes] = useState(() => lembrado(CHAVE_DETALHES) !== "nao");
  const [ordem, setOrdem] = useState<OrdemTarefas>(ordemLembrada);
  const [modal, setModal] = useState<{ id: string | null } | null>(null);
  const [importando, setImportando] = useState(false);
  const p = base.pagina;
  const equipe = cadastrosDoTipo(base, "equipe");
  const mudarF = (parte: Partial<Filtros>) => { filtrosLembrados = { ...filtrosLembrados, ...parte }; setF(filtrosLembrados); };
  const mudarForma = (nova: Forma) => { setForma(nova); lembrar(CHAVE_FORMA, nova); };
  const mudarDetalhes = (sim: boolean) => { setDetalhes(sim); lembrar(CHAVE_DETALHES, sim ? "sim" : "nao"); };
  const mudarOrdem = (nova: OrdemTarefas) => { ordemLembrada = nova; setOrdem(nova); };
  const [titulo, lead] = TITULOS.tarefas!;

  const q = normalizar(f.busca.trim());
  const todas = Object.values(base.tarefas);
  const visiveis = todas.filter((t) =>
    (!f.nucleo || t.nucleo === f.nucleo)
    && (!f.resp || (f.resp === "_sem" ? !respEfetivo(base, t) : respEfetivo(base, t) === f.resp))
    && (!f.prioridade || (f.prioridade === "_sem" ? !prioridadeDe(t) : prioridadeDe(t) === f.prioridade))
    && (!f.status || t.status === f.status)
    && (!f.atrasadas || tarefaAtrasada(t))
    && (!q || normalizar([t.codigo, t.titulo, t.frente, t.dependencia, t.entrega, t.anotacoes].join(" ")).includes(q)));
  const filtrando = visiveis.length !== todas.length;
  const nucleos = [...p.nucleos, ...(todas.some((t) => !t.nucleo) ? [{ id: "_sem", nome: "Sem núcleo", responsavel: null }] : [])];
  const status = p.listas.statusTarefa;
  const geral = contarTarefas(todas);
  const select = ESTILO_CONTROLE_BASE + " cdf:w-auto cdf:flex-[0_1_170px]";

  /** A planilha do que está na tela, no formato do plano (volta pela importação). */
  function baixar() {
    const ordemNucleo = (id: string) => { const i = p.nucleos.findIndex((n) => n.id === id); return i < 0 ? 999 : i; };
    const linhas = [...visiveis].sort((a, b) => ordemNucleo(a.nucleo) - ordemNucleo(b.nucleo) || comparador("plano")(a, b));
    baixarArquivo("plano-de-acao-caminhos-do-forro-" + hojeIso() + ".csv", gerarCsv([CABECALHO_PLANO, ...linhasDoPlano(base, linhas)]), "text/csv");
  }

  return (
    <>
      <CabecalhoVista titulo={titulo} lead={lead} />

      <div className={BARRA + " cdf:mt-[22px]"}>
        <Segmentado rotulo="Ver as tarefas em" opcoes={[["lista", "Lista"], ["quadro", "Quadro"]]} valor={forma} aoMudar={mudarForma} />
        <select aria-label="Ordem" value={ordem} onChange={(e) => mudarOrdem(e.target.value as OrdemTarefas)} className={select}><Opcoes lista={ORDENS} /></select>
        {forma === "lista" && <Check rotulo="Com detalhes" title="Mostra de quem a tarefa depende, a entrega e as observações" checked={detalhes} onChange={(e) => mudarDetalhes(e.target.checked)} />}
        <span className="cdf:flex-1" />
        <Botao onClick={() => setImportando(true)}>Importar plano</Botao>
        <Botao onClick={baixar} disabled={!visiveis.length} title="Baixa as tarefas da tela numa planilha com as colunas do plano">Baixar planilha</Botao>
        <Botao variante="primario" onClick={() => setModal({ id: null })}>Nova tarefa</Botao>
      </div>

      <div className={BARRA}>
        <input type="search" aria-label="Buscar" placeholder="Buscar por ID, tarefa, frente ou anotação" value={f.busca} onChange={(e) => mudarF({ busca: e.target.value })} className={ESTILO_CONTROLE_BASE + " cdf:flex-[1_1_240px]"} />
        <select aria-label="Núcleo" value={f.nucleo} onChange={(e) => mudarF({ nucleo: e.target.value })} className={select}><Opcoes lista={opcoes(p, "nucleos", "Todos os núcleos")} /></select>
        <select aria-label="Responsável" value={f.resp} onChange={(e) => mudarF({ resp: e.target.value })} className={select}>
          <option value="">Todas as pessoas</option>
          {equipe.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
          <option value="_sem">Sem responsável</option>
        </select>
        <select aria-label="Prioridade" value={f.prioridade} onChange={(e) => mudarF({ prioridade: e.target.value })} className={select}>
          <Opcoes lista={[["", "Todas as prioridades"], ...PRIORIDADES, ["_sem", "Sem prioridade"]]} />
        </select>
        <select aria-label="Status" value={f.status} onChange={(e) => mudarF({ status: e.target.value })} className={select}><Opcoes lista={opcoes(p, "statusTarefa", "Todos os status")} /></select>
        <Check rotulo="Só atrasadas" checked={f.atrasadas} onChange={(e) => mudarF({ atrasadas: e.target.checked })} />
      </div>

      <Tabela className="cdf:mb-[18px]">
        <thead>
          <tr>
            <Th>Núcleo</Th><Th className={NUM}>Tarefas</Th><Th className={NUM} title="Críticas ainda não concluídas">Críticas abertas</Th>
            {status.map((s) => <Th key={s.id} className={NUM}>{s.nome}</Th>)}
            <Th className={NUM}>% concluído</Th><Th className={NUM}>Atrasadas</Th>
          </tr>
        </thead>
        <tbody>
          {nucleos.map((n) => {
            const c = contarTarefas(todas.filter((t) => (t.nucleo || "_sem") === n.id));
            return (
              <tr key={n.id}>
                <Td>
                  <button type="button" className={LINK + " cdf:text-left"} onClick={() => mudarF({ nucleo: n.id === "_sem" || f.nucleo === n.id ? "" : n.id })}>{n.nome}</button>
                  {n.id !== "_sem" && <span className={SUB}>{n.responsavel ? nomeCadastro(base, n.responsavel) : "Sem responsável"}</span>}
                </Td>
                <Td className={NUM}>{c.total}</Td>
                <Td className={NUM}>{c.criticas}</Td>
                {status.map((s) => <Td key={s.id} className={NUM}>{c.porStatus[s.id] || 0}</Td>)}
                <Td className={NUM}>{c.total ? pctTexto(c.feitas, c.total) : "—"}</Td>
                <Td className={NUM}>{c.atrasadas ? <span className="cdf:font-bold cdf:text-erro">{c.atrasadas}</span> : "0"}</Td>
              </tr>
            );
          })}
          <tr className="cdf:font-bold">
            <Td>Todos os núcleos</Td>
            <Td className={NUM}>{geral.total}</Td>
            <Td className={NUM}>{geral.criticas}</Td>
            {status.map((s) => <Td key={s.id} className={NUM}>{geral.porStatus[s.id] || 0}</Td>)}
            <Td className={NUM}>{geral.total ? pctTexto(geral.feitas, geral.total) : "—"}</Td>
            <Td className={NUM}>{geral.atrasadas ? <span className="cdf:text-erro">{geral.atrasadas}</span> : "0"}</Td>
          </tr>
        </tbody>
      </Tabela>

      {filtrando && (
        <p className="cdf:m-0 cdf:mb-2.5 cdf:text-sm cdf:text-tinta-2">
          Mostrando {visiveis.length} de {todas.length} tarefas.{" "}
          <button type="button" className={LINK} onClick={() => mudarF(SEM_FILTRO)}>Limpar filtros</button>
        </p>
      )}

      {!todas.length ? <Vazio>Nenhuma tarefa ainda. Importe a planilha do plano de ação ou crie a primeira tarefa.</Vazio>
        : !visiveis.length ? <Vazio>Nenhuma tarefa com esses filtros.</Vazio>
          : forma === "quadro" ? <Kanban base={base} tarefas={visiveis} ordem={ordem} abrir={(id) => setModal({ id })} />
            : <Lista base={base} tarefas={visiveis} ordem={ordem} detalhes={detalhes} abrir={(id) => setModal({ id })} />}

      {modal && <ModalTarefa base={base} id={modal.id} preset={modal.id ? undefined : { nucleo: f.nucleo }} aoFechar={() => setModal(null)} />}
      {importando && <ModalImportarPlano base={base} aoFechar={() => setImportando(false)} />}
    </>
  );
}
