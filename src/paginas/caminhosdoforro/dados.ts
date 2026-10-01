/* Dados da página Caminhos do Forró. No banco:
   - `paginas/caminhosdoforro`: listas, núcleos, parâmetros e simulador
     (escuta de um documento só);
   - `paginas/caminhosdoforro/<coleção>`: as oito coleções do festival, um
     documento por registro;
   - `presets`: só para registrar a página em presets/paginas na semente.
   Tudo passa pelo `Banco`: tempo real, offline, autoria e log de graça.
   Nada da Central é lido ou gravado aqui: a integração é a etapa 2.

   Semente: quando o banco confirma que a página não existe (e `presets` já
   respondeu), o export do artefato vira os documentos acima, uma vez só. */
import { useMemo, useSyncExternalStore } from "react";
import { Banco } from "../../services/banco";
import { clonar, uid } from "../../utils";
import type { PaginaPropria } from "../../types";
import { hojeIso } from "./calculo";
import { converterArtefato } from "./semente";
import { COLECOES, SLUG, type Base, type Cadastro, type Colecao, type PaginaFestival, type Simulador } from "./tipos";

type Documento = Record<string, unknown> & { id: string };
type Mapa = Record<string, Documento>;

const COLECAO_PAGINAS = "paginas";
/** Caminho da subcoleção no banco: paginas/caminhosdoforro/<coleção>. */
export const caminho = (c: Colecao) => COLECAO_PAGINAS + "/" + SLUG + "/" + c;

/** Prefixo dos ids novos de cada coleção (uid da Central: "c-x7k2p9"). */
const PREFIXO: Record<Colecao, string> = {
  cadastro: "c", espacos: "e", cotas: "q", patrocinios: "p", parceiros: "r", orcamento_itens: "o", slots: "h", tarefas: "t",
};

interface Estado { pagina: PaginaFestival | null; colecoes: Record<Colecao, Mapa> }

let estado: Estado = {
  pagina: null,
  colecoes: Object.fromEntries(COLECOES.map((c) => [c, {}])) as Record<Colecao, Mapa>,
};
let presets: Mapa = {};
let paginaConfirmada = false;
let presetsConfirmados = false;
let ligado = false;
let semeou = false;
const assinantes = new Set<() => void>();
const publicar = () => assinantes.forEach((f) => f());

/** Liga as escutas (idempotente). */
export function iniciarCaminhosDoForro() {
  if (ligado) return;
  ligado = true;
  Banco.assinarDocumento(COLECAO_PAGINAS, SLUG, (documento, confirmado) => {
    estado = { ...estado, pagina: (documento as unknown as PaginaFestival) || null };
    if (confirmado) paginaConfirmada = true;
    talvezSemear();
    publicar();
  });
  Banco.assinar("presets", (mapa, confirmado) => {
    presets = mapa;
    if (confirmado) presetsConfirmados = true;
    talvezSemear();
  });
  for (const c of COLECOES) {
    Banco.assinar(caminho(c), (mapa) => {
      estado = { ...estado, colecoes: { ...estado.colecoes, [c]: mapa } };
      publicar();
    });
  }
}

/** Primeira abertura: a página não existe no banco e `presets` já respondeu → grava o export do artefato. */
function talvezSemear() {
  if (semeou || !paginaConfirmada || estado.pagina || !presetsConfirmados) return;
  semeou = true;
  void import("./semente.json").then(({ default: json }) => {
    const s = converterArtefato(clonar(json) as never, new Date().toISOString());
    const registro = presets.paginas as unknown as { paginas?: PaginaPropria[] } | undefined;
    const outras = (registro?.paginas || []).filter((p) => p.slug !== SLUG);
    Banco.gravar("presets", "paginas", { id: "paginas", paginas: [...outras, s.registro] }, true);
    for (const c of COLECOES) s.colecoes[c].forEach((d) => Banco.gravar(caminho(c), d.id, d, true));
    Banco.gravar(COLECAO_PAGINAS, SLUG, s.pagina as unknown as Documento, true);
  });
}

/** Hook: a base montada (null enquanto a página não carregou). */
export function usarCaminhosDoForro(): Base | null {
  const e = useSyncExternalStore(
    (cb) => { assinantes.add(cb); return () => assinantes.delete(cb); },
    () => estado,
  );
  return useMemo(() => (e.pagina ? ({ pagina: e.pagina, ...e.colecoes } as unknown as Base) : null), [e]);
}

/* ══════════ gravação ══════════ */

/** Muda o documento da página (listas, núcleos, parâmetros, simulador) e grava. `rapido` para cliques; digitação usa o debounce longo. */
export function alterarPagina(mudar: (p: PaginaFestival) => void, rapido = true) {
  if (!estado.pagina) return;
  const copia = clonar(estado.pagina);
  mudar(copia);
  copia.meta = { rev: (copia.meta?.rev || 0) + 1, atualizadoEm: hojeIso() };
  copia.atualizado = new Date().toISOString();
  Banco.gravar(COLECAO_PAGINAS, SLUG, copia as unknown as Documento, rapido);
}

/** Grava um registro de uma coleção (novo ou editado). */
export function gravar<T extends { id: string }>(colecao: Colecao, registro: T, rapido = true) {
  const copia = clonar(registro) as T & { atualizado?: string };
  copia.atualizado = new Date().toISOString();
  Banco.gravar(caminho(colecao), copia.id, copia as unknown as Documento, rapido);
}

/** Id para um registro novo da coleção. */
export const novoId = (colecao: Colecao) => uid(PREFIXO[colecao]);

/** Apaga um registro de uma coleção (sem lixeira, como o artefato; o Banco grava o log). */
export const apagar = (colecao: Colecao, id: string) => { void Banco.apagar(caminho(colecao), id); };

/** Cadastro rápido de dentro de um modal ("Cadastrar nova empresa…"): nasce em conversa, no núcleo dado, e devolve o id. */
export function criarCadastroRapido(nome: string, tipo: string, nucleoId: string | null): string {
  const d: Cadastro = {
    id: novoId("cadastro"), nome, tipos: [tipo], status: "em_conversa", nucleo: nucleoId,
    contato: { nome: "", telefone: "", email: "" }, documento: "", carta: null, cartaArquivo: null, historico: [], anotacoes: "", revisar: false,
  };
  gravar("cadastro", d);
  return d.id;
}

/** Muda parâmetros do simulador (documento da página). Arrastar a faixa usa o debounce longo. */
export const alterarSimulador = (parte: Partial<Simulador>, rapido = true) =>
  alterarPagina((p) => { p.simulador = { ...p.simulador, ...parte }; }, rapido);
