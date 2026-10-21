/* Caderno "Melhorias da Central": a lista do Núcleo com o que a Central
   precisa melhorar. Nasceu como artefato do claude.ai e mora na coleção
   `nucleo`, junto com as anotações, distinguido pelo campo `tipo`: a coleção
   já é de leitura restrita ao módulo Núcleo nas regras do banco, então não
   precisa de regra nova. A estrutura é a do site: três seções (Central do
   Coletivo, Páginas anexo, Núcleo do Coletivo) cujas abas são o que existe
   hoje (os ambientes da Central, as páginas anexo do registro em código, as
   abas do Núcleo), mais Início e Levar ao Gustavo, telas calculadas. As abas
   se montam na tela (`pages/nucleo/Melhorias.tsx`), a partir de
   `store/navegacao.ts` e `pages/paginasProprias.ts`, então acompanham o site.
   Os itens (anotações e tarefas) ficam no banco. As tarefas de melhoria
   ficam aqui, não nas Tarefas da Central (decisão de 21/10/2026: é backlog de
   melhoria, não trabalho da equipe). */
export type TipoCaderno = "nota" | "tarefa";

export interface ItemLista { id: string; nome: string }

/** Uma seção do caderno, com as abas que filtram os itens. */
export interface SecaoCaderno { id: string; nome: string; abas: string[] }

export interface NotaCaderno {
  id: string;
  tipo: "nota";
  secao: string;
  aba: string;
  texto: string;
  /** Quem anotou, como texto (nome, ou "Claude" nas notas do artefato). */
  quem: string;
  origem: string;
  criadoEm: string;
  atualizado: string;
}

export interface TarefaCaderno {
  id: string;
  tipo: "tarefa";
  secao: string;
  aba: string;
  texto: string;
  quem: string;
  prazo: string;
  /** Precisa de mudança no código: é o que "Levar ao Gustavo" lista. */
  codigo: boolean;
  feito: boolean;
  feitoEm?: string;
  origem: string;
  criadoPor: string;
  criadoEm: string;
  atualizado: string;
}

/** Seções com tela calculada em vez de lista: o Início (números) e "Levar ao Gustavo" (tarefas abertas de código). */
export const SECAO_INICIO = "inicio";
export const SECAO_GUSTAVO = "gustavo";
/** As três seções com itens. */
export const SECAO_CENTRAL = "central";
export const SECAO_PAGINAS = "paginas";
export const SECAO_NUCLEO = "nucleo-coletivo";
/** Aba da Central para o que atravessa as telas (login, sincronização, backup, visual). */
export const ABA_TRANSVERSAL = "Transversal";

export const NOMES_SECAO: Record<string, string> = {
  [SECAO_INICIO]: "Início",
  [SECAO_GUSTAVO]: "Levar ao Gustavo",
  [SECAO_CENTRAL]: "Central do Coletivo",
  [SECAO_PAGINAS]: "Páginas anexo",
  [SECAO_NUCLEO]: "Núcleo do Coletivo",
};

/** As 20 seções do artefato (20/10/2026) → seção e aba de hoje, para importar o JSON dele.
    Aba "" = sem aba (a seção antiga não existe mais como tela); o nome antigo vai para a origem do item. */
export const SECOES_ANTIGAS: Record<string, { nome: string; secao: string; aba: string }> = {
  "anexo-geral": { nome: "Páginas anexo: geral", secao: SECAO_PAGINAS, aba: "" },
  "modelo-anexo": { nome: "Páginas anexo: modelo", secao: SECAO_PAGINAS, aba: "" },
  "anexo-backup": { nome: "Páginas anexo: backup", secao: SECAO_PAGINAS, aba: "" },
  forro: { nome: "Caminhos do Forró", secao: SECAO_PAGINAS, aba: "Caminhos do Forró" },
  ponta: { nome: "Ponta de Lança", secao: SECAO_PAGINAS, aba: "Ponta de Lança" },
  "anexo-melhorias": { nome: "Melhorias da Central", secao: SECAO_NUCLEO, aba: "Melhorias" },
  "anexo-captadores": { nome: "Captadores / patrocínios", secao: SECAO_PAGINAS, aba: "" },
  "anexo-carnaval": { nome: "Central Carnaval 2027", secao: SECAO_PAGINAS, aba: "" },
  nucleo: { nome: "Núcleo do Coletivo: geral", secao: SECAO_NUCLEO, aba: "" },
  "nucleo-ideias": { nome: "Anotações e ideias", secao: SECAO_NUCLEO, aba: "Anotações e ideias" },
  "nucleo-sigiloso": { nome: "Informações sigilosas", secao: SECAO_NUCLEO, aba: "" },
  geral: { nome: "Central do Coletivo: resumo", secao: SECAO_CENTRAL, aba: "" },
  painel: { nome: "Painel", secao: SECAO_CENTRAL, aba: "Painel" },
  cadastros: { nome: "Cadastros", secao: SECAO_CENTRAL, aba: "Cadastros" },
  agenda: { nome: "Agenda", secao: SECAO_CENTRAL, aba: "Agenda" },
  pessoas: { nome: "Pessoas", secao: SECAO_CENTRAL, aba: "Cadastros" },
  gestao: { nome: "Gestão", secao: SECAO_CENTRAL, aba: "Gestão" },
  projetos: { nome: "Projetos", secao: SECAO_CENTRAL, aba: "Projetos" },
  contexto: { nome: "Contexto", secao: SECAO_CENTRAL, aba: "Contexto" },
  transversal: { nome: "Transversal", secao: SECAO_CENTRAL, aba: ABA_TRANSVERSAL },
};
