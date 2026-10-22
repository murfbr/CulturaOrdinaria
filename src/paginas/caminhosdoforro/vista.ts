/* Navegação interna da página: a vista aberta (uma das seções do menu). Fica
   em estado local e no localStorage, como no artefato; não passa pela
   navegação da Central. O menu tem quatro grupos (títulos não clicáveis):
   Painel e cadastro, Produtos e ferramentas, Núcleos (uma vista por núcleo,
   "nucleo:<id>") e Apoio. */
import type { Base, Colecao, Nucleo } from "./tipos";

export const VISTAS = ["painel", "apresentacoes", "cadastro", "patrocinios", "programacao", "orcamento", "tarefas", "contexto", "config"] as const;
export type VistaFixa = (typeof VISTAS)[number];
/** A página de um núcleo: "nucleo:" e o id do núcleo. */
export type VistaNucleo = `nucleo:${string}`;
export type Vista = VistaFixa | VistaNucleo;
export type IrPara = (vista: Vista) => void;

export const vistaDeNucleo = (id: string): VistaNucleo => `nucleo:${id}`;
/** O id do núcleo de uma vista "nucleo:<id>", ou null para as vistas fixas. */
export const nucleoDaVista = (v: string): string | null => (v.startsWith("nucleo:") ? v.slice(7) : null);
export const ehVista = (v: string): v is Vista => (VISTAS as readonly string[]).includes(v) || !!nucleoDaVista(v);

export interface ItemMenu { id: Vista; nome: string }
export interface GrupoMenu { titulo: string; itens: ItemMenu[] }

/** Os grupos do menu, na ordem. Configuração e "← Central" entram no grupo Apoio, no próprio menu. */
export function gruposDoMenu(nucleos: Nucleo[]): GrupoMenu[] {
  return [
    { titulo: "Painel e cadastro", itens: [{ id: "painel", nome: "Painel" }, { id: "cadastro", nome: "Cadastro" }] },
    { titulo: "Produtos e ferramentas", itens: [{ id: "programacao", nome: "Programação" }, { id: "orcamento", nome: "Orçamento" }, { id: "tarefas", nome: "Tarefas" }] },
    { titulo: "Núcleos", itens: nucleos.map((n) => ({ id: vistaDeNucleo(n.id), nome: n.nome })) },
    { titulo: "Apoio", itens: [{ id: "apresentacoes", nome: "Apresentações" }, { id: "contexto", nome: "Contexto" }, { id: "config", nome: "Configuração" }] },
  ];
}

/** Título e texto de abertura de cada vista fixa. */
export const TITULOS: Partial<Record<VistaFixa, [string, string]>> = {
  painel: ["Painel", "O festival num olhar: quanto falta, quanto já entrou, quem está confirmado e como cada núcleo está."],
  cadastro: ["Cadastro", "Fonte única de pessoas, organizações e espaços do festival. As outras telas puxam daqui, então cada informação é digitada uma vez só."],
  patrocinios: ["Patrocínios e apoios", "Cotas à venda, negociações com empresas, parceiros institucionais e quem capta para o festival."],
  programacao: ["Programação", "A grade dos três dias. Quem sobe ao palco ou ocupa uma sala vem do cadastro; horários, espaços e atividades se editam aqui."],
  orcamento: ["Orçamento", "Quanto o festival custa, de onde vem o dinheiro e o que falta. Os valores seguem o cenário escolhido."],
  tarefas: ["Tarefas", "O plano de ação do festival, por núcleo: o que cada grupo de trabalho tem para fazer, até quando e com que prioridade. Mude o status na própria linha ou, no quadro, arraste o cartão."],
  apresentacoes: ["Apresentações", "As três versões do deck: institucional, comercial de primeiro contato e comercial de segundo contato. Cada cartão guarda o arquivo (upload ou link), com as versões e os comentários."],
  contexto: ["Contexto", "O projeto escrito, a pesquisa externa e os arquivos base do festival, com versões e comentários. Cada cartão guarda o arquivo (upload ou link)."],
  config: ["Configuração", "Parâmetros do festival, listas usadas nos campos de seleção e o que está carregado na base."],
};

/** As seções da Fase 6 do artefato: ainda são só um aviso. */
export const FUTURAS: Partial<Record<Vista, { fase: number; titulo: string; texto: string }>> = {
};

/** Documento de trabalho do festival, para onde o artefato manda enquanto a Fase 6 não chega. */
export const DOCUMENTO_DE_TRABALHO = "https://claude.ai/artifact/YC7wZNR2pFbjeUZsz1AavF";

/** Em que etapa da construção da página cada vista entra, e que coleções ela mostra (vazio: todas as vistas do MVP existem). */
export const ETAPA_DA_VISTA: Partial<Record<Vista, { etapa: number; colecoes: Colecao[] }>> = {
};

/** Filtro com que a tela de Tarefas abre quando se chega por "Ver tarefas" (de um núcleo ou de uma pessoa). */
export let filtroTarefasPedido: { nucleo?: string; resp?: string } | null = null;
export const pedirFiltroTarefas = (f: { nucleo?: string; resp?: string } | null) => { filtroTarefasPedido = f; };

/** As abas de uma página de núcleo: as três comuns e as próprias (patrocínios na captação, comunicação na comunicação). */
export type AbaNucleo = "painel" | "orcamento" | "tarefas" | "patrocinios" | "redes" | "design" | "audiovisual" | "contrapartidas";

/** Aba com que a página de um núcleo abre quando se chega por um atalho ("Patrocínios e apoios" do painel, por exemplo). */
export let abaNucleoPedida: AbaNucleo | null = null;
export const pedirAbaNucleo = (a: AbaNucleo | null) => { abaNucleoPedida = a; };

/** Para onde "Patrocínios e apoios" leva: a página do núcleo de captação, quando ele existe; senão, a vista solta. */
export function vistaDosPatrocinios(base: Base): Vista {
  const n = base.pagina.nucleos.find((x) => x.id === "captacao") || base.pagina.nucleos.find((x) => /capta/i.test(x.nome));
  return n ? vistaDeNucleo(n.id) : "patrocinios";
}
