/* Tipos da página Caminhos do Forró. Os nomes de campo são os do artefato
   "Caminhos do Forró — Central do festival", e são os nomes das propriedades
   dos documentos no banco. Nada daqui se repete nos tipos da Central: ligar
   equipe, contatos, tarefas e projeto é a etapa 2.

   No banco: `paginas/caminhosdoforro` (listas, núcleos, parâmetros e
   simulador: o `config` do artefato) e oito subcoleções com um documento por
   registro. */

export const SLUG = "caminhosdoforro";
export const TIPO = "festival";
export const TITULO = "Festival Caminhos do Forró";

/** As oito coleções do festival (subcoleções de paginas/caminhosdoforro), na ordem da Configuração. */
export const COLECOES = ["cadastro", "espacos", "cotas", "patrocinios", "parceiros", "orcamento_itens", "slots", "tarefas", "arquivos", "comentarios"] as const;
export type Colecao = (typeof COLECOES)[number];

export const ROTULO_COLECAO: Record<Colecao, string> = {
  cadastro: "Cadastro geral", espacos: "Espaços", cotas: "Cotas", patrocinios: "Patrocínios",
  parceiros: "Parceiros institucionais", orcamento_itens: "Itens de orçamento", slots: "Horários da grade", tarefas: "Tarefas",
  arquivos: "Arquivos (apresentações e contexto)", comentarios: "Comentários",
};

/* ══════════ configuração (documento da página) ══════════ */

export const NOMES_LISTA = [
  "tiposCadastro", "statusContato", "cartaAnuencia", "tiposEspaco", "etapasFunil", "categoriasParceiro",
  "categoriasOrcamento", "momentos", "statusOrcamento", "dias", "atividades", "statusTarefa",
] as const;
export type NomeLista = (typeof NOMES_LISTA)[number];

/** Item de lista de seleção: os registros guardam o `id`, a tela mostra o `nome`. */
export interface ItemLista { id: string; nome: string }
export type Listas = Record<NomeLista, ItemLista[]>;

/** Núcleo de trabalho: membros e responsável são ids do cadastro (tipo equipe). */
export interface Nucleo { id: string; nome: string; responsavel: string | null; membros?: string[] }

export interface Parametros {
  metaCaptacao: number | null;
  /** Primeiro e último dia (ISO yyyy-mm-dd). */
  inicio: string | null;
  fim: string | null;
  /** URL da logo oficial; vazio = marca tipográfica provisória. */
  logo: string | null;
}

export type Cenario = "E" | "I" | "X";
export type OperacaoBar = "proprio" | "concessao" | "sem";

/** Parâmetros do simulador de receitas, compartilhados por toda a equipe. */
export interface Simulador {
  cenario: Cenario;
  bar: OperacaoBar;
  /** Público por dia. */
  publico: number;
  /** Gasto médio no bar por pessoa. */
  ticket: number;
  /** Colaboração voluntária por pessoa. */
  colab: number;
  /** Receita da gastronomia nos três dias. */
  gastro: number;
  /** Contingência sobre as despesas, em %. */
  contingencia: number;
  cotasModo: "confirmado" | "manual";
  cotasManual: number;
}

/** Documento `paginas/caminhosdoforro`. */
export interface PaginaFestival {
  id: string;
  tipo: string;
  listas: Listas;
  nucleos: Nucleo[];
  parametros: Parametros;
  simulador: Simulador;
  meta: { rev: number; atualizadoEm: string; /** Os cartões de arquivo da Fase 6 já foram semeados. */ fase6?: boolean };
  atualizado?: string;
}

/* ══════════ registros (subcoleções) ══════════ */

/** Arquivo anexado por link (o artefato também aceitava upload; aqui só link). */
export interface Arquivo { tipo: "link" | "asset"; url?: string; id?: string; nome: string }

export interface ContatoCadastro { nome: string; telefone: string; email: string }

/** Um contato registrado com a pessoa ou organização; `por` é id do cadastro (equipe). */
export interface Historico { id: string; data: string; por: string | null; texto: string; em: number }

/** Pessoa ou organização do festival: artista, DJ, patrocinador, parceiro, equipe… (um registro pode ter vários tipos). */
export interface Cadastro {
  id: string;
  nome: string;
  tipos: string[];
  /** Id de `statusContato`. */
  status: string;
  /** Núcleo que cuida da relação. */
  nucleo: string | null;
  contato: ContatoCadastro;
  /** CPF ou CNPJ. */
  documento: string;
  /** Id de `cartaAnuencia`. */
  carta: string | null;
  cartaArquivo: Arquivo | null;
  historico: Historico[];
  anotacoes: string;
  /** Veio da carga inicial e ainda não foi conferido. */
  revisar: boolean;
  atualizado?: string;
}

export interface Espaco {
  id: string;
  nome: string;
  /** Id de `tiposEspaco`. */
  tipo: string;
  capacidade: number | null;
  /** Tipos de cadastro que o espaço recebe (vazio = qualquer um). */
  aceita: string[];
  anotacoes: string;
  revisar: boolean;
  atualizado?: string;
}

export interface Cota {
  id: string;
  nome: string;
  /** 0 ou vazio = valor variável. */
  valor: number | null;
  /** Vazio = sem limite. */
  quantidade: number | null;
  contrapartidas: string;
  anotacoes: string;
  revisar: boolean;
  ordem: number;
  atualizado?: string;
}

export interface Patrocinio {
  id: string;
  /** Id do cadastro (tipo patrocinador). */
  empresa: string;
  cota: string | null;
  valor: number | null;
  /** Id de `etapasFunil`. */
  etapa: string;
  ultimoContato: string | null;
  proximoPasso: string;
  proposta: Arquivo | null;
  anotacoes: string;
  revisar: boolean;
  atualizado?: string;
}

export interface Parceiro {
  id: string;
  /** Id do cadastro (tipo parceiro institucional). */
  parceiro: string;
  /** Id de `categoriasParceiro`. */
  categoria: string;
  oferece: string;
  recebe: string;
  revisar: boolean;
  atualizado?: string;
}

export type Momento = "pre" | "mont" | "d1" | "d2" | "d3" | "pos";

export interface ItemOrcamento {
  id: string;
  nome: string;
  /** Id de `categoriasOrcamento`. */
  categoria: string;
  nucleo: string | null;
  quantidade: number;
  unidade: string;
  unidadeVezes: string;
  /** Valor unitário por cenário. */
  unitario: Record<Cenario, number>;
  /** Quantas vezes em cada momento. */
  distribuicao: Record<Momento, number>;
  /** Id de `statusOrcamento`. */
  status: string;
  /** Id do cadastro (tipo fornecedor). */
  fornecedor: string | null;
  anotacoes: string;
  revisar: boolean;
  ordem: number;
  atualizado?: string;
}

/** Um horário da grade (o `slot` do artefato). */
export interface Horario {
  id: string;
  /** Id de `dias`. */
  dia: string;
  espaco: string;
  /** "HH:MM"; antes das 06:00 conta como madrugada do mesmo dia. */
  inicio: string;
  fim: string;
  /** Id de `atividades`. */
  atividade: string;
  /** Ids do cadastro. */
  participantes: string[];
  anotacoes: string;
  revisar: boolean;
  atualizado?: string;
}

export interface TarefaFestival {
  id: string;
  titulo: string;
  nucleo: string;
  /** Id do cadastro (equipe); vazio = responsável do núcleo. */
  responsavel: string | null;
  prazo: string | null;
  /** Id de `statusTarefa`. */
  status: string;
  urgente: boolean;
  anotacoes: string;
  ordem: number;
  atualizado?: string;
}

/** Tudo o que as telas recebem: a página e as oito coleções, por id. */
export interface Base {
  pagina: PaginaFestival;
  cadastro: Record<string, Cadastro>;
  espacos: Record<string, Espaco>;
  cotas: Record<string, Cota>;
  patrocinios: Record<string, Patrocinio>;
  parceiros: Record<string, Parceiro>;
  orcamento_itens: Record<string, ItemOrcamento>;
  slots: Record<string, Horario>;
  tarefas: Record<string, TarefaFestival>;
  arquivos: Record<string, ArquivoBase>;
  comentarios: Record<string, Comentario>;
}

/* ══════════ arquivos (Apresentações e Contexto) e comentários ══════════ */

/** Um arquivo guardado: upload no Firebase Storage ou só o link. */
export interface ArquivoGuardado {
  tipo: "storage" | "link";
  url: string;
  /** Caminho no Storage (para apagar), só no tipo storage. */
  caminho?: string;
  nomeOriginal?: string;
  tamanho?: number;
}

export interface VersaoArquivo {
  versao: string;
  /** Data ISO. */
  data: string;
  /** E-mail de quem subiu (vazio em modo local). */
  por: string;
  arquivo: ArquivoGuardado;
}

/** Cartão de arquivo: a última versão é a atual; sem versões = faltante. */
export interface ArquivoBase {
  id: string;
  secao: "apresentacao" | "contexto";
  /** Apresentação: a versão do deck; contexto: projeto, pesquisa ou base. */
  grupo: string;
  nome: string;
  descricao: string;
  ordem: number;
  versoes: VersaoArquivo[];
  atualizado?: string;
}

/** Comentário sobre um cartão de arquivo; `por` é id do cadastro (equipe). */
export interface Comentario {
  id: string;
  /** "arquivo:<id>". */
  sobre: string;
  data: string;
  por: string | null;
  texto: string;
  em: number;
  atualizado?: string;
}

/** Os grupos da aba Contexto, na ordem. */
export const GRUPOS_CONTEXTO: [string, string][] = [["projeto", "Projeto escrito"], ["pesquisa", "Pesquisa externa"], ["base", "Arquivos base"]];

/** As três versões do deck, na ordem (os cartões da aba Apresentações). */
export const VERSOES_APRESENTACAO: [string, string][] = [
  ["institucional", "Institucional"], ["comercial1", "Comercial · primeiro contato"], ["comercial2", "Comercial · segundo contato"],
];
