/* Mutações e consultas do estado central: criar/atualizar/excluir registros do
   Painel, projetos (com o rascunho do formulário) e docs do Contexto — sempre via camada Banco,
   que espelha na hora e grava com debounce. Excluir nunca apaga de vez: o
   registro vai para a coleção `lixeira` (30 dias) e o toast oferece Desfazer. */
import { Banco } from "../services/banco";
import { emailSessao } from "../services/sessao";
import { toast } from "../components/Toast";
import { clonar, uid } from "../utils";
import { obterEstado } from "./central";
import { normalizarProjeto, rascunhoVazio } from "../lib/migracao/v3";
import {
  STATUS_PROJETO, STATUS_TAREFA,
  type ColecaoPainel, type DadosPainel, type Ficha, type Formulario, type ItemChecklist, type ItemLixeira,
  type Julgamento, type Projeto, type Proponente, type Rascunho, type Regra, type StatusProjeto, type StatusTarefa, type Tarefa,
} from "../types";
import type { PlanoProponentes } from "../lib/proponentes";

type RegistroPainel = DadosPainel[ColecaoPainel][number];
type Documento = Record<string, unknown> & { id: string };

/* ══════════ Lixeira ══════════ */

/** Chave do documento na lixeira: coleção + id (ids de coleções diferentes não colidem).
    Caminho de subcoleção tem barra, que id de documento não aceita: vira ponto. */
const chaveLixeira = (colecao: string, id: string) => colecao.replace(/\//g, ".") + "__" + id;

/** A lixeira como está agora: o que a escuta trouxe mais o que esta sessão acabou de mandar
    (numa página própria a escuta da lixeira não está ligada, e o Desfazer precisa funcionar). */
const lixeiraAtual = (): Record<string, ItemLixeira> =>
  ({ ...(Banco.ler("lixeira") as unknown as Record<string, ItemLixeira>), ...obterEstado().lixeira });

/** Lote de exclusão: uma ação do usuário = um toast com Desfazer, mesmo em cascata. */
let loteAberto: { id: string; qtd: number } | null = null;

/** Agrupa várias exclusões (cascatas do "levar junto") num Desfazer só. */
export function emLoteDeExclusao<T>(fazer: () => T): T {
  if (loteAberto) return fazer();
  loteAberto = { id: uid("lote"), qtd: 0 };
  try { return fazer(); } finally { fecharLote(); }
}

function fecharLote() {
  const lote = loteAberto;
  loteAberto = null;
  if (!lote || !lote.qtd) return;
  toast(lote.qtd === 1 ? "Foi para a lixeira" : lote.qtd + " registros foram para a lixeira", {
    acao: {
      rotulo: "Desfazer",
      fazer: () => {
        const n = restaurarLote(lote.id);
        toast(n === 1 ? "Restaurado" : n + " restaurados");
      },
    },
  });
}

/** Move um documento para a lixeira (o "excluir" de verdade do site). */
function moverParaLixeira(colecao: string, id: string) {
  const documento = Banco.ler(colecao)[id];
  if (!documento) return;
  const loteProprio = !loteAberto;
  if (loteProprio) loteAberto = { id: uid("lote"), qtd: 0 };
  loteAberto!.qtd++;
  Banco.gravar("lixeira", chaveLixeira(colecao, id), {
    ...clonar(documento),
    _de: colecao,
    _apagadoEm: new Date().toISOString(),
    _apagadoPor: emailSessao(),
    _lote: loteAberto!.id,
  }, true);
  void Banco.apagar(colecao, id);
  if (loteProprio) fecharLote();
}

/** Devolve um item da lixeira para a coleção de origem. false = o id renasceu lá. */
export function restaurarDaLixeira(chave: string): boolean {
  const item = lixeiraAtual()[chave];
  if (!item) return false;
  const destino = item._de;
  if (Banco.ler(destino)[item.id]) return false; // não sobrescreve um registro recriado
  const copia = clonar(item) as Record<string, unknown> & { id: string };
  delete copia._de; delete copia._apagadoEm; delete copia._apagadoPor; delete copia._lote;
  copia.atualizado = new Date().toISOString();
  Banco.gravar(destino, copia.id, copia, true);
  void Banco.apagar("lixeira", chave);
  return true;
}

/** Restaura tudo o que caiu junto numa exclusão (o Desfazer do toast). */
export function restaurarLote(lote: string): number {
  let n = 0;
  for (const [chave, item] of Object.entries(lixeiraAtual())) {
    if (item._lote === lote && restaurarDaLixeira(chave)) n++;
  }
  return n;
}

/** Remove um item da lixeira em definitivo (aí sim, sem volta). */
export function excluirDeVez(chave: string) {
  void Banco.apagar("lixeira", chave);
}

export function esvaziarLixeira() {
  Object.keys(obterEstado().lixeira).forEach((chave) => void Banco.apagar("lixeira", chave));
}

/** Itens da lixeira com mais de `dias` — limpos ao abrir a tela da Lixeira. */
export function limparLixeiraAntiga(dias = 30) {
  const corte = Date.now() - dias * 86400000;
  for (const [chave, item] of Object.entries(obterEstado().lixeira)) {
    if (new Date(item._apagadoEm).getTime() < corte) void Banco.apagar("lixeira", chave);
  }
}

/* ══════════ Painel ══════════ */

/** Cria ou atualiza um registro do Painel. Novo registro entra no fim da lista. */
export function salvarRegistro(colecao: ColecaoPainel, registro: RegistroPainel, rapido = true) {
  const r = clonar(registro) as RegistroPainel;
  const existente = obterEstado().painel[colecao].find((x) => x.id === r.id);
  r._ord = existente ? existente._ord : maiorOrd(colecao) + 1;
  r.atualizado = new Date().toISOString();
  Banco.gravar(colecao, r.id, r as unknown as Documento, rapido);
}

const maiorOrd = (colecao: ColecaoPainel) =>
  obterEstado().painel[colecao].reduce((m, x) => Math.max(m, x._ord || 0), -1);

/** Exclui um registro (para a lixeira). Excluir projeto leva junto as tarefas
    ligadas e o rascunho do formulário dele. */
export function excluirRegistro(colecao: ColecaoPainel, id: string) {
  emLoteDeExclusao(() => {
    const projeto = colecao === "projetos" ? porId("projetos", id) : undefined;
    moverParaLixeira(colecao, id);
    if (colecao === "projetos") {
      obterEstado().painel.tarefas
        .filter((t) => t.origem === "proj:" + id)
        .forEach((t) => moverParaLixeira("tarefas", t.id));
      if (projeto?.rascunhoId && Banco.ler("rascunhos")[projeto.rascunhoId]) moverParaLixeira("rascunhos", projeto.rascunhoId);
    }
  });
  // A página própria do projeto (registro em presets/paginas) vai junto, num lote próprio.
  if (colecao === "projetos") void excluirPaginasDoProjeto(id);
}

/** Documento da página e edições de cada página própria do projeto vão para a lixeira; o registro sai. */
async function excluirPaginasDoProjeto(projetoId: string) {
  const registro = obterEstado().presets.paginas;
  const minhas = (registro?.paginas || []).filter((p) => p.projetoId === projetoId);
  if (!registro || !minhas.length) return;
  for (const p of minhas) {
    const caminhoEdicoes = "paginas/" + p.slug + "/edicoes";
    await Banco.carregarDocumento("paginas", p.slug);
    const edicoes = await Banco.carregarColecao(caminhoEdicoes);
    emLoteDeExclusao(() => {
      Object.keys(edicoes).forEach((id) => moverParaLixeira(caminhoEdicoes, id));
      moverParaLixeira("paginas", p.slug);
    });
  }
  Banco.gravar("presets", "paginas", {
    ...(clonar(registro) as unknown as Documento),
    paginas: registro.paginas.filter((p) => p.projetoId !== projetoId),
  }, true);
}

/** Busca por id em qualquer coleção do Painel. */
export function porId<C extends ColecaoPainel>(colecao: C, id: string): DadosPainel[C][number] | undefined {
  return (obterEstado().painel[colecao] as DadosPainel[C]).find((x) => x.id === id);
}

/* ══════════ Projetos ══════════ */

const hojeIsoCurto = () => new Date().toISOString().slice(0, 10);

/** Troca o status do projeto e registra no histórico. */
export function definirStatusProjeto(p: Projeto, status: StatusProjeto) {
  if (p.status === status) return;
  const copia = clonar(p);
  copia.historico = [...(copia.historico || []), { data: hojeIsoCurto(), de: p.status, para: status }];
  copia.status = status;
  salvarRegistro("projetos", copia);
}

/** ◀▶ no status (só entre os status do caminho principal, até Concluído). */
export function moverProjeto(p: Projeto, direcao: -1 | 1) {
  const caminho = STATUS_PROJETO.filter((s) => !s.fim || s.id === "concluido").map((s) => s.id);
  const i = caminho.indexOf(p.status);
  const alvo = caminho[Math.max(0, Math.min(caminho.length - 1, (i < 0 ? 0 : i) + direcao))];
  definirStatusProjeto(p, alvo);
}

/** Enquadramento/formalização do artista → perfil jurídico do proponente. */
function perfilDoArtista(texto: string): string {
  const t = (texto || "").toLowerCase();
  if (t.includes("mei") && !t.includes("sem cnpj nem mei")) return "MEI";
  if (t.includes("sem fins")) return "PJ sem fins lucrativos";
  if (t.includes("cnpj") && !t.includes("sem cnpj")) return "PJ com fins lucrativos";
  if (t.includes("sem cnpj") || t.includes("coletivo")) return "Coletivo informal representado por PF";
  if (t.trim() === "pf") return "PF";
  return "";
}

export interface DadosNovoProjeto {
  nome: string;
  artistaIds: string[];
  editalId: string;
  /** Formulário escolhido, ou "livre". */
  formId: string;
  respId?: string;
  status?: StatusProjeto;
  grupo?: string;
}

/** Cria um projeto (e o rascunho do formulário, quando não é Livre). Devolve o id. */
export function criarProjeto(d: DadosNovoProjeto): string {
  const id = uid("p");
  const edital = d.editalId ? porId("editais", d.editalId) : undefined;
  const artista = d.artistaIds[0] ? porId("artistas", d.artistaIds[0]) : undefined;
  const docs: ItemChecklist[] = (edital?.docsExig || []).map((nome) => ({ nome, ok: false }));
  const status = d.status || "prospeccao";
  const p = normalizarProjeto({
    id, nome: d.nome.trim() || "Projeto sem nome", artistaIds: d.artistaIds, editalId: d.editalId,
    formId: d.formId || "livre", status, respId: d.respId || "", grupo: d.grupo || "", docs,
    proponente: { nome: "", perfil: artista ? perfilDoArtista(artista.formalizacao || artista.enq) : "", obs: "" },
    historico: [{ data: hojeIsoCurto(), de: "", para: status }],
  });
  if (p.formId !== "livre") {
    const r = rascunhoVazio("r-" + id, p.formId, p.nome, id, new Date().toISOString());
    p.rascunhoId = r.id;
    salvarRascunho(r, true);
  }
  salvarRegistro("projetos", p);
  return id;
}

/** Duplica o projeto (e as respostas do formulário). Devolve o id da cópia. */
export function duplicarProjeto(p: Projeto): string {
  const id = uid("p");
  const copia = clonar(p);
  copia.id = id;
  copia.nome = p.nome + " · cópia";
  copia.arquivado = false;
  copia.status = "prospeccao";
  copia.inscricao = "";
  copia.resultado = "";
  copia.valorAprovado = "";
  copia.valorCaptado = "";
  copia.historico = [{ data: hojeIsoCurto(), de: "", para: "prospeccao" }];
  copia.origem = { projeto: p.id };
  delete copia._ord;
  const r = p.rascunhoId ? obterEstado().rascunhos[p.rascunhoId] : undefined;
  if (r) {
    const rc = clonar(r);
    rc.id = "r-" + id;
    rc.ref = id;
    rc.nome = copia.nome;
    rc.status = {};
    rc.criado = new Date().toISOString();
    copia.rascunhoId = rc.id;
    salvarRascunho(rc, true);
  } else if (copia.formId !== "livre") {
    const rv = rascunhoVazio("r-" + id, copia.formId, copia.nome, id, new Date().toISOString());
    copia.rascunhoId = rv.id;
    salvarRascunho(rv, true);
  } else delete copia.rascunhoId;
  salvarRegistro("projetos", copia);
  return id;
}

export function arquivarProjeto(p: Projeto, arquivado: boolean) {
  salvarRegistro("projetos", { ...clonar(p), arquivado });
}

/** Troca o formulário de um projeto (a tela só oferece com o rascunho vazio). */
export function trocarFormulario(p: Projeto, formId: string) {
  const copia = clonar(p);
  const antigo = p.rascunhoId ? obterEstado().rascunhos[p.rascunhoId] : undefined;
  copia.formId = formId || "livre";
  if (copia.formId === "livre") {
    delete copia.rascunhoId;
  } else if (antigo) {
    salvarRascunho({ ...clonar(antigo), form: copia.formId, valores: {}, status: {}, anexos: {}, notas: {} }, true);
  } else {
    const r = rascunhoVazio("r-" + p.id, copia.formId, p.nome, p.id, new Date().toISOString());
    copia.rascunhoId = r.id;
    salvarRascunho(r, true);
  }
  salvarRegistro("projetos", copia);
}

/** Ids (edital, projeto, artistas) ligados a um projeto — para regras e fichas. */
export function idsDoProjeto(p?: Projeto): string[] {
  if (!p) return [];
  return [p.editalId, p.id, ...(p.artistaIds || [])].filter(Boolean);
}

/** Rascunho (respostas do formulário) de um projeto. */
export const rascunhoDoProjeto = (p?: Projeto): Rascunho | undefined =>
  p?.rascunhoId ? obterEstado().rascunhos[p.rascunhoId] : undefined;

/**
 * Solta um cartão arrastado num quadro: aplica `mudar` (nova etapa, status ou
 * responsável) e reposiciona o registro na coleção — antes de `antesDeId` ou no
 * fim. Só regrava os registros cujo `_ord` de fato mudou.
 */
export function soltarCartao<C extends ColecaoPainel>(
  colecao: C, id: string, mudar: (r: DadosPainel[C][number]) => void, antesDeId?: string,
) {
  const lista = obterEstado().painel[colecao] as DadosPainel[C];
  const original = lista.find((x) => x.id === id);
  if (!original || id === antesDeId) return;
  const movido = clonar(original);
  mudar(movido);

  const resto = lista.filter((x) => x.id !== id);
  let pos = resto.length;
  if (antesDeId) {
    const i = resto.findIndex((x) => x.id === antesDeId);
    if (i >= 0) pos = i;
  }
  const nova = [...resto.slice(0, pos), movido, ...resto.slice(pos)];
  const agora = new Date().toISOString();
  nova.forEach((r, i) => {
    if (r.id !== id && r._ord === i) return;
    const copia = r.id === id ? movido : clonar(r);
    copia._ord = i;
    copia.atualizado = agora;
    Banco.gravar(colecao, copia.id, copia as unknown as Documento, true);
  });
}

/** Solta um projeto numa coluna do pipeline (arrastar e soltar). */
export function soltarProjeto(id: string, status: string, antesDeId?: string) {
  soltarCartao("projetos", id, (p) => {
    if (p.status !== status) {
      p.historico = [...(p.historico || []), { data: hojeIsoCurto(), de: p.status, para: status }];
      p.status = status as StatusProjeto;
    }
  }, antesDeId);
}

/** Solta uma tarefa numa coluna de status do quadro. */
export function soltarTarefaEmStatus(id: string, status: StatusTarefa, antesDeId?: string) {
  soltarCartao("tarefas", id, (t) => { t.status = status; }, antesDeId);
}

/** Solta uma tarefa na coluna de uma pessoa ("" = sem responsável). */
export function soltarTarefaEmPessoa(id: string, respId: string, antesDeId?: string) {
  soltarCartao("tarefas", id, (t) => { t.respId = respId; }, antesDeId);
}

/** Concluir/reabrir uma tarefa pelo checkzinho. */
export function alternarTarefaConcluida(t: Tarefa) {
  const copia = clonar(t);
  copia.status = copia.status === "feito" ? "fazer" : "feito";
  salvarRegistro("tarefas", copia);
}

/** Adia o prazo da tarefa em `dias`, contando de hoje se ela já estava vencida. */
export function adiarTarefa(t: Tarefa, dias = 7) {
  const copia = clonar(t);
  const d = new Date();
  const hoje = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const base = copia.prazo && copia.prazo > hoje ? copia.prazo : hoje;
  const nova = new Date(base + "T12:00:00");
  nova.setDate(nova.getDate() + dias);
  copia.prazo = nova.getFullYear() + "-" + String(nova.getMonth() + 1).padStart(2, "0") + "-" + String(nova.getDate()).padStart(2, "0");
  salvarRegistro("tarefas", copia);
}

/** Avança ou volta o status da tarefa (a fazer ⇄ em andamento ⇄ concluído). */
export function girarStatusTarefa(t: Tarefa, direcao: -1 | 1) {
  const copia = clonar(t);
  const i = Math.max(0, Math.min(2, STATUS_TAREFA.indexOf(copia.status) + direcao));
  copia.status = STATUS_TAREFA[i];
  salvarRegistro("tarefas", copia);
}

/* ══════════ Proponentes ══════════ */

/** Liga o projeto a um proponente do cadastro e espelha nome e perfil no texto do projeto. */
export function escolherProponente(p: Projeto, pr: Proponente | undefined) {
  const copia = clonar(p);
  copia.proponenteId = pr ? pr.id : "";
  if (pr) {
    copia.proponente = { ...copia.proponente, nome: pr.nome, perfil: pr.perfil || copia.proponente.perfil };
  }
  salvarRegistro("projetos", copia);
}

/** Grava o plano de "criar a partir dos projetos": cadastros novos e vínculos. */
export function aplicarPlanoProponentes(plano: PlanoProponentes): number {
  const agora = new Date().toISOString();
  plano.novos.forEach((pr) => salvarRegistro("proponentes", { ...pr, atualizado: agora }));
  const { painel } = obterEstado();
  for (const v of plano.vinculos) {
    const p = painel.projetos.find((x) => x.id === v.projetoId);
    if (!p) continue;
    const copia = clonar(p);
    copia.proponenteId = v.proponenteId;
    // A ressalva "(a confirmar)" era deste projeto: vai para a observação do proponente no projeto.
    if (v.aConfirmar && !/a confirmar/i.test(copia.proponente.obs || "")) {
      copia.proponente = { ...copia.proponente, obs: ["proponente a confirmar", copia.proponente.obs].filter(Boolean).join(" · ") };
    }
    const pr = plano.novos.find((x) => x.id === v.proponenteId);
    if (pr) copia.proponente = { ...copia.proponente, nome: pr.nome, perfil: pr.perfil || copia.proponente.perfil };
    salvarRegistro("projetos", copia);
  }
  return plano.novos.length;
}

/* ══════════ Formulários e rascunhos ══════════ */

export function salvarRascunho(r: Rascunho, rapido = false) {
  const copia = clonar(r);
  copia.atualizado = new Date().toISOString();
  Banco.gravar("rascunhos", copia.id, copia as unknown as Documento, rapido);
}

/** Grava uma definição de formulário (importada na aba Formulários). */
export function salvarFormulario(f: Formulario) {
  Banco.gravar("formularios", f.id, { ...clonar(f), atualizado: new Date().toISOString() }, true);
}

/** Exclui uma definição de formulário (a tela só oferece quando nenhum projeto usa). */
export function excluirFormulario(id: string) {
  emLoteDeExclusao(() => moverParaLixeira("formularios", id));
}

/* ══════════ Contexto ══════════ */

export function salvarFicha(f: Ficha) {
  Banco.gravar("fichas", f.id, { ...clonar(f), atualizado: new Date().toISOString() });
}
export function salvarRegra(r: Regra) {
  Banco.gravar("regras", r.id, { ...clonar(r), atualizado: new Date().toISOString() });
}
export function excluirRegra(id: string) { emLoteDeExclusao(() => moverParaLixeira("regras", id)); }
export function salvarJulgamento(j: Julgamento) {
  Banco.gravar("julgamentos", j.id, { ...clonar(j), atualizado: new Date().toISOString() });
}
export function excluirJulgamento(id: string) { emLoteDeExclusao(() => moverParaLixeira("julgamentos", id)); }
