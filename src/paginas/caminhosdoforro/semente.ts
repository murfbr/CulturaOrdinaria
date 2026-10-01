/* Semente: o export da base do artefato (semente.json) vira os documentos da
   página. Roda uma vez, quando o banco confirma que `paginas/caminhosdoforro`
   não existe. Função pura: recebe o JSON e devolve o que gravar.

   A base do artefato já tinha um documento por registro, então a conversão é
   1:1: cada registro ganha `id` e `atualizado`; o carimbo do artefato
   (`atualizadoEm`, `atualizadoPor`, um uid do Claude) fica de fora. O `config`
   do artefato (listas, núcleos, parâmetros, simulador) vira o documento da
   página. A logo, que no artefado era upload, só vale se vier como link. */
import type { PaginaPropria } from "../../types";
import {
  COLECOES, NOMES_LISTA, SLUG, TIPO, TITULO,
  type Colecao, type ItemLista, type Listas, type Nucleo, type PaginaFestival, type Parametros, type Simulador,
} from "./tipos";

type Documento = Record<string, unknown> & { id: string };

/** O semente.json: o `config` do artefato e as oito coleções, cada uma como mapa id → registro. */
export interface ArtefatoJson {
  config: {
    listas: Partial<Record<string, ItemLista[]>>;
    nucleos?: Nucleo[];
    parametros?: Partial<Omit<Parametros, "logo">> & { logo?: { url?: string; nome?: string } | string | null };
    simulador?: Partial<Simulador>;
  };
  cadastro?: Record<string, Record<string, unknown>>;
  espacos?: Record<string, Record<string, unknown>>;
  cotas?: Record<string, Record<string, unknown>>;
  patrocinios?: Record<string, Record<string, unknown>>;
  parceiros?: Record<string, Record<string, unknown>>;
  orcamento_itens?: Record<string, Record<string, unknown>>;
  slots?: Record<string, Record<string, unknown>>;
  tarefas?: Record<string, Record<string, unknown>>;
}

export interface Semeadura {
  pagina: PaginaFestival;
  colecoes: Record<Colecao, Documento[]>;
  /** O que entra em presets/paginas. */
  registro: PaginaPropria;
}

/** Os parâmetros do simulador quando o banco não tem nada (os do artefato). */
export const SIMULADOR_PADRAO: Simulador = {
  cenario: "I", bar: "proprio", publico: 1000, ticket: 30, colab: 5, gastro: 10000, contingencia: 10, cotasModo: "confirmado", cotasManual: 120000,
};

const semCarimbo = (d: Record<string, unknown>): Record<string, unknown> => {
  const { atualizadoEm: _em, atualizadoPor: _por, ...resto } = d;
  void _em; void _por;
  return resto;
};

export function converterArtefato(json: ArtefatoJson, agora: string): Semeadura {
  const config = json.config || { listas: {} };
  const listas = Object.fromEntries(NOMES_LISTA.map((n) => [n, (config.listas || {})[n] || []])) as Listas;
  const nucleos: Nucleo[] = (config.nucleos || []).map((n) => ({
    id: n.id, nome: n.nome, responsavel: n.responsavel ?? null, membros: n.membros || [],
  }));
  const p = config.parametros || {};
  const logo = typeof p.logo === "string" ? p.logo : (p.logo && p.logo.url) || null;
  const pagina: PaginaFestival = {
    id: SLUG, tipo: TIPO, listas, nucleos,
    parametros: { metaCaptacao: p.metaCaptacao ?? null, inicio: p.inicio ?? null, fim: p.fim ?? null, logo },
    simulador: { ...SIMULADOR_PADRAO, ...(semCarimbo(config.simulador || {}) as Partial<Simulador>) },
    meta: { rev: 1, atualizadoEm: agora.slice(0, 10) },
    atualizado: agora,
  };
  const colecoes = {} as Record<Colecao, Documento[]>;
  for (const c of COLECOES) {
    colecoes[c] = Object.entries(json[c] || {}).map(([id, d]) => ({ ...semCarimbo(d), id, atualizado: agora }));
  }
  return { pagina, colecoes, registro: { slug: SLUG, projetoId: "", tipo: TIPO, titulo: TITULO } };
}
