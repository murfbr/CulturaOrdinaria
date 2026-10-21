/* Presets do sistema: o que a Central e as páginas próprias leem da coleção
   `presets` do banco. São listas editáveis sem deploy (fases de uma festa,
   categorias de custo...) e o registro das páginas próprias. Enum que o
   código interpreta (status de tarefa, status do projeto) continua em
   constantes.ts: um id de status muda comportamento, não é preset. */

import type { PresetCaptacao } from "./captacao";

/** Fase por distância do evento (D-60, D-45 … Dia, Pós). */
export interface FaseFesta { id: string; label: string; desc: string }

/** Preset de página tipo festa (documento `presets/festa`). */
export interface PresetFesta {
  id: "festa";
  fases: FaseFesta[];
  categoriasCusto: string[];
  naturezasMaquina: string[];
  formatosPeca: string[];
}

/** Uma página anexo registrada (documento `presets/paginas`): o título que a Central
    mostra e o endereço. Página anexo não pertence a projeto; é o projeto que pode
    apontar para ela (`Projeto.paginaSlug`). */
export interface PaginaPropria {
  /** Caminho da página: /<slug>/. É a chave do vínculo das tarefas ("pagina:<slug>"). */
  slug: string;
  /** Legado (até 21/10/2026): o projeto a que a página pertencia. Não é mais lido nem gravado. */
  projetoId?: string;
  /** Tipo de página; decide qual tela desenha (registro em código: pages/paginasProprias.ts). */
  tipo: string;
  titulo: string;
}

export interface PresetPaginas { id: "paginas"; paginas: PaginaPropria[] }

/** Os documentos da coleção `presets`, pelo id. */
export interface Presets { festa?: PresetFesta; paginas?: PresetPaginas; captacao?: PresetCaptacao }

/** Vale enquanto o banco não tem o documento `presets/festa`; a semente grava este. */
export const PRESET_FESTA_PADRAO: PresetFesta = {
  id: "festa",
  fases: [
    { id: "d60", label: "D-60", desc: "Data, lineup, licença" },
    { id: "d45", label: "D-45", desc: "Orçamento e cotações" },
    { id: "d30", label: "D-30", desc: "Artes e plano de comunicação" },
    { id: "d15", label: "D-15", desc: "ADS, e-mail, contratos fechados" },
    { id: "d7", label: "D-7", desc: "Equipe, máquinas, cardápio" },
    { id: "dia", label: "Dia", desc: "Montagem, operação, fechamento das máquinas" },
    { id: "pos", label: "Pós", desc: "Reconciliação, análise, fechamento da edição" },
  ],
  categoriasCusto: ["Artístico", "Estrutura", "Equipe", "Publicidade", "Extras"],
  naturezasMaquina: ["Bar", "Bar interno", "Porta", "Comida"],
  formatosPeca: ["Feed", "Feed (vídeo)", "Stories", "Stories (vídeo)", "E-mail"],
};
