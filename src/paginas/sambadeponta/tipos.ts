/* Tipos da página Samba de Ponta. Os nomes de campo são os do artefato
   "Ponta de Lança"; o que a Central já tem (tarefa, pessoa da equipe,
   contato, projeto, presets) vem dos tipos da Central e não se repete aqui.

   No banco: `paginas/sambadeponta` (a festa) e `paginas/sambadeponta/edicoes/*`
   (uma edição por documento). Tarefas moram em `tarefas`, fornecedores em
   `contatos`, fases e categorias em `presets/festa`. */
import type { Contato, PessoaEquipe, PresetFesta, Projeto, ResumoEdicao, StatusEdicao, Tarefa } from "../../types";

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
    O nome da festa é o título do registro em presets/paginas, não fica aqui. */
export interface PaginaFesta {
  id: string;
  tipo: "festa";
  meta: Meta;
  /** Totais por edição, que a página grava aqui a cada mudança (a Central não lê; o detalhe está nas edições). */
  resumo?: ResumoEdicao[];
  sub: string;
  local: string;
  modelo: string;
  socios: Socio[];
  checklist: ItemMestre[];
  aprendizados: Aprendizado[];
  atualizado?: string;
}

export type { StatusEdicao };
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

/** Uma das opções na mesa, com o que pesa a favor e contra. */
export interface OpcaoDecisao { texto: string; pros: string; contras: string }

/** aberta = ninguém bateu o martelo; provisoria = vale por enquanto, falta confirmar; decidida = fechada. */
export type StatusDecisao = "aberta" | "provisoria" | "decidida";

/** Decisão da edição (data, local, formato...). Fica no documento da edição. */
export interface Decisao {
  id: string;
  tema: string;
  status: StatusDecisao;
  /** O que vale agora: a escolha provisória ou a decidida. */
  atual: string;
  opcoes: OpcaoDecisao[];
  /** Até quando decidir (ISO). */
  prazo: string;
  obs: string;
}

/** Quem precisa saber das mudanças da edição. `avisado` volta a falso quando muda de novo. */
export interface Aviso { id: string; nome: string; papel: string; avisado: boolean; obs: string }

/** Documento `paginas/sambadeponta/edicoes/<id>`. As tarefas da edição
    moram em `tarefas` (campo `edicaoId`), não aqui. */
export interface Edicao {
  id: string;
  paginaId: string;
  num: number;
  nome: string;
  data: string;
  /** Obsoleto: o dia da semana sai da data (diaDaSemana em calculo.ts). Documentos antigos ainda trazem. */
  diaSemana?: string;
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
  /** Decisões e urgências: o que está em aberto, quem avisar e as tarefas fixadas como urgentes. */
  decisoes?: Decisao[];
  avisos?: Aviso[];
  /** Ids de tarefas da Central (coleção `tarefas`) fixadas como urgentes nesta edição. */
  urgentes?: string[];
  atualizado?: string;
}

/** O que as telas recebem: montado em memória a partir do banco (ver dados.ts). */
export interface Painel {
  pagina: PaginaFesta;
  /** Nome da festa: o título do registro em presets/paginas (ou o de reserva enquanto não carrega). */
  titulo: string;
  edicoes: Edicao[];
  presets: PresetFesta;
  /** Projetos da Central (com início, meio e fim) que apontam para esta página (Projeto.paginaSlug). */
  projetos: Projeto[];
  /** Tarefas das edições desta página (coleção `tarefas`, campo `edicaoId`). */
  tarefas: Tarefa[];
  /** Todas as tarefas da Central: as urgências podem fixar uma que não é da edição (ex.: da agenda da semana). */
  tarefasCentral: Tarefa[];
  equipe: PessoaEquipe[];
  contatos: Contato[];
}
