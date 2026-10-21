/* Dados da página Samba de Ponta. No banco:
   - `paginas/sambadeponta`: a festa (escuta de um documento só);
   - `paginas/sambadeponta/edicoes/*`: uma edição por documento;
   - `tarefas`, `equipe`, `contatos`, `projetos` e `presets`: pelo store da
     Central, ligando só essas coleções (nada de semente nem de Contexto).
   O Painel que as telas recebem é montado em memória a partir disso tudo.
   Tudo passa pelo `Banco`: tempo real, offline, autoria e log de graça.

   Integração com a Central: as tarefas são da Central, com o vínculo
   "pagina:pontadelanca" (aparecem no quadro, no Resumo e na agenda como
   "Página · Ponta de Lança"); os fornecedores são contatos; os projetos que
   apontam para esta página (Projeto.paginaSlug) entram no Painel. Os TOTAIS
   de cada edição (previsto, contratado, pago, realizado, receita, resultado)
   ficam no próprio documento da página (`resumo`); o detalhe fica só aqui.
   A página não pertence a projeto nenhum.

   Semente: quando o banco confirma que a página não existe (e a Equipe, os
   contatos, os projetos e os presets já responderam), o JSON do artefato vira
   os documentos de cima, uma vez só. */
import { useMemo, useSyncExternalStore } from "react";
import { Banco } from "../../services/banco";
import { clonar, uid } from "../../utils";
import {
  assinarEstado, colecaoConfirmada, iniciarDados, obterEstado, presetFesta, usarCentral, type EstadoCentral,
} from "../../store/central";
import { excluirRegistro, salvarRegistro } from "../../store/mutacoes";
import { STATUS_TAREFA, type Contato, type Tarefa } from "../../types";
import { criarProximaEdicao, hojeIso, resumoDaEdicao } from "./calculo";
import { ENDERECO, ORIGEM_TAREFA, SLUG, converterArtefato } from "./semente";
import type { Edicao, PaginaFesta, Painel } from "./tipos";

const COLECAO_PAGINAS = "paginas";
const COLECAO_EDICOES = "paginas/" + SLUG + "/edicoes";
type Documento = Record<string, unknown> & { id: string };

let pagina: PaginaFesta | null = null;
let edicoes: Record<string, Edicao> = {};
let paginaConfirmada = false;
let edicoesConfirmadas = false;
let ligado = false;
let semeou = false;
const assinantes = new Set<() => void>();
const publicar = () => assinantes.forEach((f) => f());

/** Liga as escutas (idempotente). */
export function iniciarSambaDePonta() {
  if (ligado) return;
  ligado = true;
  iniciarDados(["tarefas", "equipe", "contatos", "projetos"]);
  assinarEstado(() => { talvezSemear(); corrigirRegistro(); migrarOrigens(); sincronizarResumo(); });
  Banco.assinarDocumento(COLECAO_PAGINAS, SLUG, (documento, confirmado) => {
    pagina = (documento as unknown as PaginaFesta) || null;
    if (confirmado) paginaConfirmada = true;
    talvezSemear();
    publicar();
    // A semente grava o documento da página por último: é aqui que o primeiro resumo nasce.
    sincronizarResumo();
  });
  Banco.assinar(COLECAO_EDICOES, (mapa, confirmado) => {
    // Cópia rasa: no modo local o Banco devolve sempre o mesmo objeto (alterado no
    // lugar) e, sem referência nova, a tela não redesenhava depois de gravar.
    edicoes = { ...(mapa as unknown as Record<string, Edicao>) };
    if (confirmado) edicoesConfirmadas = true;
    publicar();
    migrarOrigens();
    sincronizarResumo();
  });
}

/** Primeira abertura: a página não existe no banco e o resto já respondeu → grava o JSON do artefato. */
function talvezSemear() {
  if (semeou || !paginaConfirmada || pagina) return;
  if (!["equipe", "contatos", "projetos", "presets"].every(colecaoConfirmada)) return;
  semeou = true;
  void import("./semente.json").then(({ default: json }) => {
    const { painel, presets } = obterEstado();
    const agora = new Date().toISOString();
    const s = converterArtefato(clonar(json) as never, { equipe: painel.equipe, contatos: painel.contatos }, agora);
    if (!presets.festa) Banco.gravar("presets", "festa", s.presetFesta as unknown as Documento, true);
    const registro = (presets.paginas?.paginas || []).filter((p) => p.slug !== SLUG && p.slug !== ENDERECO);
    Banco.gravar("presets", "paginas", { id: "paginas", paginas: [...registro, ...s.presetPaginas.paginas] }, true);
    s.contatos.forEach((c) => salvarRegistro("contatos", c, true));
    s.tarefas.forEach((t) => salvarRegistro("tarefas", t, true));
    s.edicoes.forEach((e) => Banco.gravar(COLECAO_EDICOES, e.id, e as unknown as Documento, true));
    Banco.gravar(COLECAO_PAGINAS, SLUG, s.pagina as unknown as Documento, true);
  });
}

/** O registro em presets/paginas passou a usar o endereço (pontadelanca) como chave e
    não tem mais projeto; um registro gravado antes, com a chave dos dados (sambadeponta)
    e `projetoId`, é regravado uma vez. Roda quando `presets` já respondeu. */
let corrigiuRegistro = false;
function corrigirRegistro() {
  if (corrigiuRegistro || !colecaoConfirmada("presets")) return;
  const lista = obterEstado().presets.paginas?.paginas || [];
  const antigo = lista.find((p) => p.slug === SLUG);
  corrigiuRegistro = true;
  if (!antigo || lista.some((p) => p.slug === ENDERECO)) return;
  const { projetoId: _projeto, ...resto } = antigo;
  void _projeto;
  Banco.gravar("presets", "paginas", {
    id: "paginas", paginas: lista.map((p) => (p.slug === SLUG ? { ...resto, slug: ENDERECO } : p)),
  }, true);
}

/** As tarefas desta página levam o vínculo "pagina:pontadelanca". As gravadas antes de
    21/10/2026 vinham com "proj:p7" (o projeto da Central, que podia ser excluído e deixava
    "Projeto · ?" no quadro): com as edições e as tarefas carregadas, as tarefas das edições
    desta página que ainda têm outro vínculo são regravadas, uma vez por sessão. */
let migrouOrigens = false;
function migrarOrigens() {
  if (migrouOrigens || !edicoesConfirmadas || !colecaoConfirmada("tarefas")) return;
  const ids = new Set(Object.keys(edicoes));
  if (!ids.size) return;
  migrouOrigens = true;
  obterEstado().painel.tarefas
    .filter((t) => t.edicaoId && ids.has(t.edicaoId) && t.origem !== ORIGEM_TAREFA)
    .forEach((t) => salvarRegistro("tarefas", { ...clonar(t), origem: ORIGEM_TAREFA }, true));
}

/** Monta o Painel que as telas usam, a partir da página, das edições e do store da Central. */
function montarPainel(p: PaginaFesta | null, mapa: Record<string, Edicao>, central: EstadoCentral): Painel | null {
  if (!p) return null;
  const lista = Object.values(mapa).sort((a, b) => a.num - b.num);
  const ids = new Set(lista.map((e) => e.id));
  const registro = (central.presets.paginas?.paginas || []).find((x) => x.slug === ENDERECO || x.slug === SLUG);
  return {
    pagina: p,
    titulo: registro?.titulo || "Ponta de Lança",
    edicoes: lista,
    presets: presetFesta(),
    projetos: central.painel.projetos.filter((x) => x.paginaSlug === ENDERECO && !x.arquivado),
    tarefas: central.painel.tarefas.filter((t) => t.edicaoId && ids.has(t.edicaoId)),
    tarefasCentral: central.painel.tarefas,
    equipe: central.painel.equipe,
    contatos: central.painel.contatos,
  };
}

/**
 * Os totais por edição ficam no documento da página (`resumo`), para quem precisar
 * deles sem carregar as edições. Chamado a cada mudança das edições e do store;
 * só grava quando o resumo mudou de fato, então chamar à toa não custa nada e não
 * entra em laço (o espelho atualiza na hora, e a comparação seguinte bate).
 */
function sincronizarResumo() {
  const painel = montarPainel(pagina, edicoes, obterEstado());
  if (!painel || !edicoesConfirmadas) return;
  const novo = painel.edicoes.map((e) => resumoDaEdicao(painel, e));
  if (JSON.stringify(painel.pagina.resumo || []) === JSON.stringify(novo)) return;
  alterarPagina((p) => { p.resumo = novo; }, false);
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
  return useMemo(() => montarPainel(p, mapa, central), [p, mapa, central]);
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

/** Muda uma edição (pelo id) e grava só o documento dela. Os totais seguem para o documento da página pela escuta. */
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

/** Tarefa nova de uma edição, já ligada à página e à edição. */
export const tarefaNova = (edicaoId: string, fase: string): Tarefa => ({
  id: uid("t"), titulo: "", respId: "", origem: ORIGEM_TAREFA, prazo: "", obs: "", status: "fazer", edicaoId, fase,
});

export const salvarTarefa = (t: Tarefa) => salvarRegistro("tarefas", t);

/** a fazer → em andamento → concluído → a fazer. */
export function alternarStatusTarefa(t: Tarefa) {
  const i = STATUS_TAREFA.indexOf(t.status);
  salvarRegistro("tarefas", { ...clonar(t), status: STATUS_TAREFA[(i + 1) % STATUS_TAREFA.length] });
}

/** Para a lixeira, com Desfazer. */
export const excluirTarefa = (id: string) => excluirRegistro("tarefas", id);

/** Fixa a tarefa como urgência da edição, ou solta se já estava. A tarefa continua a mesma da Central. */
export function alternarUrgente(edicaoId: string, tarefaId: string) {
  alterarEdicao(edicaoId, (ed) => {
    const lista = ed.urgentes || [];
    ed.urgentes = lista.includes(tarefaId) ? lista.filter((x) => x !== tarefaId) : [...lista, tarefaId];
  });
}

export const contatoNovo = (): Contato => ({ id: uid("k"), nome: "", tipo: "Fornecedor", ref: "", contato: "", obs: "" });
export const salvarContato = (c: Contato) => salvarRegistro("contatos", c);
export const excluirContato = (id: string) => excluirRegistro("contatos", id);
