/* Navegação interna da página: a vista aberta (uma das seções do menu). Fica
   em estado local e no localStorage, como no artefato; não passa pela
   navegação da Central. */
import type { Colecao } from "./tipos";

export const VISTAS = ["painel", "apresentacoes", "cadastro", "patrocinios", "programacao", "orcamento", "tarefas", "contexto", "config"] as const;
export type Vista = (typeof VISTAS)[number];
export type IrPara = (vista: Vista) => void;

/** O menu, na ordem do artefato. `fase` marca as seções que ainda não existem. */
export const NAV: { id: Vista; nome: string; fase?: number }[] = [
  { id: "painel", nome: "Painel geral", fase: 6 },
  { id: "apresentacoes", nome: "Apresentações", fase: 6 },
  { id: "cadastro", nome: "Cadastro geral" },
  { id: "patrocinios", nome: "Patrocínios e apoios" },
  { id: "programacao", nome: "Programação" },
  { id: "orcamento", nome: "Orçamento" },
  { id: "tarefas", nome: "Tarefas" },
  { id: "contexto", nome: "Contexto", fase: 6 },
];

/** Título e texto de abertura de cada vista. */
export const TITULOS: Partial<Record<Vista, [string, string]>> = {
  cadastro: ["Cadastro geral", "Fonte única de pessoas, organizações e espaços do festival. As outras telas puxam daqui, então cada informação é digitada uma vez só."],
  patrocinios: ["Patrocínios e apoios", "Cotas à venda, negociações com empresas e parceiros institucionais do festival."],
  programacao: ["Programação", "A grade dos três dias. Quem sobe ao palco ou ocupa uma sala vem do cadastro geral; horários, espaços e atividades se editam aqui."],
  orcamento: ["Orçamento", "Quanto o festival custa, de onde vem o dinheiro e o que falta. Os valores seguem o cenário escolhido."],
  tarefas: ["Tarefas", "O que cada núcleo tem para fazer até o festival. Arraste os cartões entre as colunas ou mude o status no próprio cartão."],
  config: ["Configuração", "Parâmetros do festival, listas usadas nos campos de seleção e o que está carregado na base."],
};

/** As seções da Fase 6 do artefato: ainda são só um aviso. */
export const FUTURAS: Partial<Record<Vista, { fase: number; titulo: string; texto: string }>> = {
  painel: { fase: 6, titulo: "Painel geral", texto: "Contagem regressiva, captado contra a meta, line-up confirmado e resumo de cada núcleo." },
  apresentacoes: { fase: 6, titulo: "Apresentações", texto: "Roteiro slide a slide das três versões: institucional, comercial de primeiro contato e comercial de segundo contato." },
  contexto: { fase: 6, titulo: "Contexto", texto: "Projeto escrito (V12), pesquisa externa, arquivos base com versão e espaço para comentários." },
};

/** Documento de trabalho do festival, para onde o artefato manda enquanto a Fase 6 não chega. */
export const DOCUMENTO_DE_TRABALHO = "https://claude.ai/artifact/YC7wZNR2pFbjeUZsz1AavF";

/** Em que etapa da construção da página cada vista entra, e que coleções ela mostra (vazio: todas as vistas do MVP existem). */
export const ETAPA_DA_VISTA: Partial<Record<Vista, { etapa: number; colecoes: Colecao[] }>> = {
};

/** Filtro com que a tela de Tarefas abre quando se chega por "Ver tarefas" (de um núcleo ou de uma pessoa). */
export let filtroTarefasPedido: { nucleo?: string; resp?: string } | null = null;
export const pedirFiltroTarefas = (f: { nucleo?: string; resp?: string } | null) => { filtroTarefasPedido = f; };
