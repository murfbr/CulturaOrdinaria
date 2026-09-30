/* Tipos da página Samba de Ponta. Os nomes de campo são os do artefato
   "Ponta de Lança"; o que a Central já tem (tarefa, pessoa da equipe,
   contato, projeto, presets) vem dos tipos da Central e não se repete aqui.

   No banco: `paginas/sambadeponta` (a festa) e `paginas/sambadeponta/edicoes/*`
   (uma edição por documento). Tarefas moram em `tarefas`, fornecedores em
   `contatos`, fases e categorias em `presets/festa`. */
import type { Contato, PessoaEquipe, PresetFesta, Projeto, Tarefa } from "../../types";

export interface Meta {
  rev: number;
  atualizadoEm: string;
  titulo: string;
  versaoModelo: string;
}

/** Quem divide o resultado da festa. */
export interface Socio { id: string; nome: string }

/** Tarefa do checklist-mestre: toda edição nova nasce com ela, já como tarefa da Central. */
export interface ItemMestre {
  id: string;
  fase: string;
  tarefa: string;
  /** Responsável padrão (id da coleção `equipe`; "" = ninguém). */
  respId: string;
  /** De onde veio ("Rotina", "Ed. 01: porta travou"). */
  obs: string;
}

/** O que uma edição ensinou; `tarefa` diz se virou item do checklist-mestre. */
export interface Aprendizado { ed: number; texto: string; tarefa: string }

/** Documento `paginas/sambadeponta`: o que vale para todas as edições.
    O nome da festa é o nome do projeto (`projetoId`), não fica aqui. */
export interface PaginaFesta {
  id: string;
  projetoId: string;
  tipo: "festa";
  meta: Meta;
  sub: string;
  local: string;
  modelo: string;
  socios: Socio[];
  checklist: ItemMestre[];
  aprendizados: Aprendizado[];
  atualizado?: string;
}

export type StatusEdicao = "planejada" | "execucao" | "fechada";
export type StatusCusto = "previsto" | "contratado" | "pago";

export interface Receitas { bar: number | null; porta: number | null; comida: number | null; sympla: number | null }

/** Alavancas da simulação de uma edição ainda não fechada. */
export interface Simulacao { publico: number | null; ticketBar: number | null; ticketPorta: number | null; obs: string }

export interface Variaveis {
  /** Custo líquido de bebida (edição fechada). */
  bebida: number | null;
  /** % do bar na simulação. Vazio = proporção bebida ÷ bar da última fechada. */
  bebidaPct?: number | null;
  bebidaObs: string;
  comissaoPct: number | null;
  /** Base da comissão dos garçons (vazio = receita de bar). */
  comissaoBase: number | null;
  taxaPct: number | null;
}

export interface Kpis {
  publico: number | null;
  retiradas: number | null;
  visitas: number | null;
  emails: number | null;
  checkin: number | null;
  ads: number | null;
}

/** Retiradas por dia na reta final ("D-3", 224). */
export interface PontoCurva { dia: string; n: number }

export interface Custo {
  id: string;
  /** Id do item correspondente na edição anterior (para a comparação). */
  ref?: string;
  cat: string;
  item: string;
  qtd: number | null;
  unit: number | null;
  qtdReal?: number | null;
  unitReal?: number | null;
  /** Total realizado; vazio = ainda não realizado (vale o previsto). */
  realizado: number | null;
  /** Nome do fornecedor em texto, para quem não está no cadastro. */
  fornecedor: string;
  /** Contato do tipo Fornecedor (coleção `contatos`), quando vinculado. */
  contatoId?: string;
  /** Id do sócio que pagou do próprio bolso ("" = saiu do caixa do evento). */
  adiantadoPor: string;
  status: StatusCusto;
  venc: string;
  obs: string;
}

export interface LinhaCronograma { hora: string; montagem: string; equipe: string; atracao: string }

export interface Maquina { n: number | null; resp: string; nat: string; vendas: number | null; fontes: string; estacao: string }

/** Peça do plano de comunicação; `data` em ISO (yyyy-mm-dd). */
export interface Peca { data: string; peca: string; formato: string; perfis: string; obs: string }

export interface Balanco { certo: string[]; errado: string[] }

export interface Arquivo { nome: string; desc: string; url: string }

/** Documento `paginas/sambadeponta/edicoes/<id>`. As tarefas da edição
    moram em `tarefas` (campo `edicaoId`), não aqui. */
export interface Edicao {
  id: string;
  paginaId: string;
  num: number;
  nome: string;
  data: string;
  diaSemana: string;
  status: StatusEdicao;
  horario: string;
  local: string;
  lineup: string;
  receitas: Receitas;
  sim?: Simulacao;
  variaveis: Variaveis;
  kpis: Kpis;
  curva: PontoCurva[];
  custos: Custo[];
  cronograma: LinhaCronograma[];
  cronogramaObs?: string;
  maquinas: Maquina[];
  maquinasObs?: string;
  comunicacao: Peca[];
  comunicacaoObs?: string;
  balanco: Balanco;
  instagram: string;
  acertoObs: string;
  arquivos: Arquivo[];
  notas: string;
  atualizado?: string;
}

/** O que as telas recebem: montado em memória a partir do banco (ver dados.ts). */
export interface Painel {
  pagina: PaginaFesta;
  /** Nome da festa: o do projeto, ou o título do registro enquanto o projeto não carrega. */
  titulo: string;
  edicoes: Edicao[];
  presets: PresetFesta;
  projeto?: Projeto;
  /** Tarefas das edições desta página (coleção `tarefas`, campo `edicaoId`). */
  tarefas: Tarefa[];
  equipe: PessoaEquipe[];
  contatos: Contato[];
}
