/* Dados da página Samba de Ponta. No banco:
   - `paginas/sambadeponta`: a festa (escuta de um documento só);
   - `paginas/sambadeponta/edicoes/*`: uma edição por documento;
   - `tarefas`, `equipe`, `contatos`, `projetos` e `presets`: pelo store da
     Central, ligando só essas coleções (nada de semente nem de Contexto).
   O Painel que as telas recebem é montado em memória a partir disso tudo.
   Tudo passa pelo `Banco`: tempo real, offline, autoria e log de graça.

   Semente: quando o banco confirma que a página não existe (e a Equipe, os
   contatos e os presets já responderam), o JSON do artefato vira os
   documentos de cima, uma vez só. */
import { useMemo, useSyncExternalStore } from "react";
import { Banco } from "../../services/banco";
import { clonar, uid } from "../../utils";
import {
  assinarEstado, colecaoConfirmada, iniciarDados, obterEstado, presetFesta, usarCentral,
} from "../../store/central";
import { excluirRegistro, salvarRegistro } from "../../store/mutacoes";
import { STATUS_TAREFA, type Contato, type Tarefa } from "../../types";
import { criarProximaEdicao, hojeIso } from "./calculo";
import { PROJETO_ID, SLUG, converterArtefato } from "./semente";
import type { Edicao, PaginaFesta, Painel } from "./tipos";

const COLECAO_PAGINAS = "paginas";
const COLECAO_EDICOES = "paginas/" + SLUG + "/edicoes";
type Documento = Record<string, unknown> & { id: string };

let pagina: PaginaFesta | null = null;
let edicoes: Record<string, Edicao> = {};
let paginaConfirmada = false;
let ligado = false;
let semeou = false;
const assinantes = new Set<() => void>();
const publicar = () => assinantes.forEach((f) => f());

/** Liga as escutas (idempotente). */
export function iniciarSambaDePonta() {
  if (ligado) return;
  ligado = true;
  iniciarDados(["tarefas", "equipe", "contatos", "projetos"]);
  assinarEstado(talvezSemear);
  Banco.assinarDocumento(COLECAO_PAGINAS, SLUG, (documento, confirmado) => {
    pagina = (documento as unknown as PaginaFesta) || null;
    if (confirmado) paginaConfirmada = true;
    talvezSemear();
    publicar();
  });
  Banco.assinar(COLECAO_EDICOES, (mapa) => {
    edicoes = mapa as unknown as Record<string, Edicao>;
    publicar();
  });
}

/** Primeira abertura: a página não existe no banco e o resto já respondeu → grava o JSON do artefato. */
function talvezSemear() {
  if (semeou || !paginaConfirmada || pagina) return;
  if (!["equipe", "contatos", "presets"].every(colecaoConfirmada)) return;
  semeou = true;
  void import("./semente.json").then(({ default: json }) => {
    const { painel, presets } = obterEstado();
    const agora = new Date().toISOString();
    const s = converterArtefato(clonar(json) as never, { equipe: painel.equipe, contatos: painel.contatos }, agora);
    if (!presets.festa) Banco.gravar("presets", "festa", s.presetFesta as unknown as Documento, true);
    const registro = (presets.paginas?.paginas || []).filter((p) => p.slug !== SLUG);
    Banco.gravar("presets", "paginas", { id: "paginas", paginas: [...registro, ...s.presetPaginas.paginas] }, true);
    s.contatos.forEach((c) => salvarRegistro("contatos", c, true));
    s.tarefas.forEach((t) => salvarRegistro("tarefas", t, true));
    s.edicoes.forEach((e) => Banco.gravar(COLECAO_EDICOES, e.id, e as unknown as Documento, true));
    Banco.gravar(COLECAO_PAGINAS, SLUG, s.pagina as unknown as Documento, true);
  });
}

function usarEstadoDaPagina() {
  return useSyncExternalStore(
    (cb) => { assinantes.add(cb); return () => assinantes.delete(cb); },
    () => pagina,
  );
}
function usarEdicoes() {
  return useSyncExternalStore(
    (cb) => { assinantes.add(cb); return () => assinantes.delete(cb); },
    () => edicoes,
  );
}

/** Hook: o Painel montado (null enquanto a página não carregou). */
export function usarSambaDePonta(): Painel | null {
  const p = usarEstadoDaPagina();
  const mapa = usarEdicoes();
  const central = usarCentral();
  return useMemo(() => {
    if (!p) return null;
    const lista = Object.values(mapa).sort((a, b) => a.num - b.num);
    const ids = new Set(lista.map((e) => e.id));
    const projeto = central.painel.projetos.find((x) => x.id === p.projetoId);
    const registro = (central.presets.paginas?.paginas || []).find((x) => x.slug === SLUG);
    return {
      pagina: p,
      titulo: projeto?.nome || registro?.titulo || "Ponta de Lança",
      edicoes: lista,
      presets: presetFesta(),
      projeto,
      tarefas: central.painel.tarefas.filter((t) => t.edicaoId && ids.has(t.edicaoId)),
      equipe: central.painel.equipe,
      contatos: central.painel.contatos,
    };
  }, [p, mapa, central]);
}

/* ══════════ gravação ══════════ */

/** Muda a festa (documento da página) e grava. `rapido` para cliques; digitação usa o debounce longo. */
export function alterarPagina(mudar: (p: PaginaFesta) => void, rapido = true) {
  if (!pagina) return;
  const copia = clonar(pagina);
  mudar(copia);
  copia.meta = { ...copia.meta, atualizadoEm: hojeIso() };
  copia.atualizado = new Date().toISOString();
  Banco.gravar(COLECAO_PAGINAS, SLUG, copia as unknown as Documento, rapido);
}

/** Muda uma edição (pelo id) e grava só o documento dela. */
export function alterarEdicao(id: string, mudar: (e: Edicao) => void, rapido = true) {
  const atual = edicoes[id];
  if (!atual) return;
  const copia = clonar(atual);
  mudar(copia);
  copia.atualizado = new Date().toISOString();
  Banco.gravar(COLECAO_EDICOES, id, copia as unknown as Documento, rapido);
}

/** Cria a próxima edição herdando a última, com as tarefas do checklist-mestre em `tarefas`. Devolve a edição (null se cancelado). */
export function novaEdicao(painel: Painel): Edicao | null {
  if (!window.confirm("Criar a próxima edição herdando a última?")) return null;
  const { edicao, tarefas } = criarProximaEdicao(painel);
  edicao.atualizado = new Date().toISOString();
  Banco.gravar(COLECAO_EDICOES, edicao.id, edicao as unknown as Documento, true);
  tarefas.forEach((t) => salvarRegistro("tarefas", t, true));
  return edicao;
}

/* ══════════ tarefas e contatos: coleções da Central ══════════ */

/** Tarefa nova de uma edição, já ligada ao projeto e à edição. */
export const tarefaNova = (edicaoId: string, fase: string): Tarefa => ({
  id: uid("t"), titulo: "", respId: "", origem: "proj:" + PROJETO_ID, prazo: "", obs: "", status: "fazer", edicaoId, fase,
});

export const salvarTarefa = (t: Tarefa) => salvarRegistro("tarefas", t);

/** a fazer → em andamento → concluído → a fazer. */
export function alternarStatusTarefa(t: Tarefa) {
  const i = STATUS_TAREFA.indexOf(t.status);
  salvarRegistro("tarefas", { ...clonar(t), status: STATUS_TAREFA[(i + 1) % STATUS_TAREFA.length] });
}

/** Para a lixeira, com Desfazer. */
export const excluirTarefa = (id: string) => excluirRegistro("tarefas", id);

export const contatoNovo = (): Contato => ({ id: uid("k"), nome: "", tipo: "Fornecedor", ref: "", contato: "", obs: "" });
export const salvarContato = (c: Contato) => salvarRegistro("contatos", c);
export const excluirContato = (id: string) => excluirRegistro("contatos", id);
