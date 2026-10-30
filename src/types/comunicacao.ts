/* Comunicação (ambiente da Central, 23/10/2026): por enquanto, a Biblioteca de
   referências. Três coleções, todas gravadas pelo módulo "comunicacao":

   - `referencias` (id `rf-xxxxxx`): o perfil de referência, compartilhado entre
     os planos (doc 02 da metodologia, seção 7a), com o resumo da última leitura
     e uma linha de histórico por rodada.
   - `leiturasReferencias` (id `lr-xxxxxx`): o retrato de um perfil numa rodada:
     os posts da janela, os destaques, a amostra assistida e as notas da leitura.
     Um documento por perfil por rodada; a tela só abre os da rodada escolhida.
   - `rodadasReferencias` (id `rr-xxxxxx`): a rodada de leitura dos perfis (a
     coleta): quais perfis, em que grade, a grade de campos e o método.
   - `analisesReferencias` (id `an-xxxxxx`, 30/10/2026): o que um ou mais planos
     leem de uma ou mais rodadas: a abertura e as seções (o que rende, Reels,
     amostra, devorar e devolver). A referência é uma só; a análise é por plano
     (doc 01 da metodologia, seção 8b). Até 30/10 isso morava dentro da rodada
     (`secoes`, `abertura`), e as rodadas antigas ainda guardam esses campos.
   - `perfisProprios` (id `pp-<slug>`, 30/10/2026): os perfis de Instagram dos
     planos do coletivo (Samba de Ponta, Caminhos do Forró, Sambotica...): quem
     publica neles, quem tem acesso e quem alimenta os dados de dentro.
   - `leiturasProprias` (id `lp-xxxxxx`): a camada "por dentro" de um perfil
     próprio numa data, tirada do Meta Business Suite: público e cada post com
     visualizações, alcance (pago e orgânico), compartilhamentos, salvamentos e
     seguidores ganhos, mais o diagnóstico. Um documento por perfil por leitura.

   Quem escreve: só a rotina da Biblioteca, que gera o JSON no artefato vivo do
   Antonio e grava pela tela Importar (mesmo id grava por cima). Dia relativo ao
   evento é D (D-14, Dia, D+1), como no resto da metodologia. */

/** Formato do JSON que o artefato gera e a tela Importar lê. */
export const FORMATO_ESPELHO_REFERENCIAS = "biblioteca-referencias/1";

/** Formato do post na grade do Instagram. */
export type FormatoPost = "Reels" | "Carrossel" | "Foto";
export const FORMATOS_POST: FormatoPost[] = ["Reels", "Carrossel", "Foto"];

/** Editorias da grade v5, na ordem dos gráficos. */
export const EDITORIAS_REFERENCIA = [
  "Anúncio", "Esquenta", "Dia do evento", "Cobertura", "Bandeira", "Família", "Memória", "Meme", "Parceiros", "Institucional",
] as const;

/** Um post da janela lida. Campos vazios ficam null (o banco não aceita indefinido). */
export interface PostReferencia {
  /** Código curto do post na rodada (SDV12, CA3...). */
  n: string;
  data: string;
  formato: FormatoPost;
  fixado: boolean;
  /** Aparece na grade do perfil (false = só na aba Reels). */
  naGrade: boolean;
  /** Perfil que publicou (sem @); em collab pode ser o parceiro. */
  autor: string;
  collab: boolean;
  editoria: string;
  serie: string;
  /** Evento a que o post se liga, com a data entre parênteses ("Canta Djavan 2 (24/10)"). */
  evento: string;
  /** Dia relativo ao evento: 0 é o Dia, -5 é D-5, 1 é D+1. */
  dia: number | null;
  /** O post convida pra uma data (dia, lugar, ingresso). */
  chamada: boolean;
  curtidas: number | null;
  comentarios: number | null;
  views: number | null;
  /** Três dias ou mais quando foi lido (entra nas medianas). */
  maduro: boolean;
  link: string;
  resumo: string;
}

/** Destaque (story fixado no perfil). */
export interface DestaqueReferencia {
  ordem: number;
  nome: string;
  guarda: string;
  tipo: string;
  comoSei: string;
}

/** Post aberto na amostra assistida (os de maior desempenho de cada perfil). */
export interface AmostraReferencia {
  n: string;
  gancho: string;
  textoNaTela: string;
  quemAparece: string;
  audio: string;
  captacao: string;
  /** Desempenho do post quando foi escolhido (×). */
  desempenho: number | null;
}

/** Resumo de uma leitura, guardado na referência (doc 02, `ultimaLeitura`) e no histórico. */
export interface ResumoLeitura {
  leituraId: string;
  rodadaId: string;
  data: string;
  inicio: string;
  fim: string;
  seguidores: number;
  postsGrade: number;
  postsSemana: number;
  pctReels: number;
  pctEvento: number;
  pctChamada: number;
  pctCollab: number;
  viewsReel: number | null;
  curtidasPorView: number | null;
}

/** Perfil de referência (coleção `referencias`). */
export interface Referencia {
  id: string;
  /** Usuário no Instagram, sem o @. */
  instagram: string;
  nome: string;
  /** A lógica do perfil numa frase ("produz a própria roda e enche cada uma de conteúdo"). */
  logica: string;
  /** Gênero, território, formato. */
  marcacoes: string[];
  nivelLeitura: "grade v5" | "rápida" | "consulta" | string;
  /** Planos em que entra, pelo nome ("Caminhos do Forró"); o gerador grava do cadastro (meta). */
  planos?: string[];
  /** Grupo, quando o plano divide as referências (festivais · bandas · eventos). */
  grupo?: string;
  /** Papel no plano: de dentro · par · vizinho · degrau acima · par de formato · próprio. */
  papel?: string;
  obs?: string;
  ultimaLeitura?: ResumoLeitura;
  /** Uma linha por rodada, da mais antiga à mais recente. */
  historico?: ResumoLeitura[];
  atualizado?: string;
}

/** Notas da leitura de um perfil numa rodada (texto com **negrito**). */
export interface NotasLeitura {
  /** A página: bio, destaques, fixados. */
  pagina: string[];
  /** Como o perfil trabalha o ciclo de evento. */
  ciclos: string[];
  linguagem: string[];
  /** O que a amostra assistida mostrou neste perfil. */
  amostra: string[];
}

/** Retrato de um perfil numa rodada (coleção `leiturasReferencias`). */
export interface LeituraReferencia {
  id: string;
  refId: string;
  rodadaId: string;
  data: string;
  /** Rótulo curto pro gráfico ("Samba da Volta"). */
  nome: string;
  /** Prefixo dos códigos dos posts (SDV, CA...). */
  sigla: string;
  perfil: { seguidores: number; seguindo: number; postsTotal: number; destaques: number; fixados: number; bio: string };
  notas: NotasLeitura;
  destaques: DestaqueReferencia[];
  posts: PostReferencia[];
  amostra: AmostraReferencia[];
  atualizado?: string;
}

/** Um bloco de texto da síntese: título e itens (texto com **negrito**). */
export interface BlocoSintese { titulo: string; itens: string[] }

/** Uma seção da síntese, com um ou mais blocos (ex.: "O que rende": confirmam, divergem). */
export interface SecaoSintese { id: string; titulo: string; nota?: string; blocos: BlocoSintese[] }

/** Linha da tabela da grade: o que cada campo virou depois das rodadas. */
export interface LinhaGrade { campo: string; situacao: string; nota: string }

/** Rodada de leitura (coleção `rodadasReferencias`): a coleta, sem conclusão. */
export interface RodadaReferencias {
  id: string;
  data: string;
  titulo: string;
  /** Versão da grade de leitura ("v5"). */
  grade: string;
  /** Referências lidas, na ordem das colunas. */
  refIds: string[];
  /** As leituras desta rodada (ids `lr-`), na mesma ordem. */
  leituraIds: string[];
  /** Até 30/10/2026: a abertura e a síntese moravam aqui. Hoje vão na análise; as rodadas antigas ainda têm. */
  abertura?: string;
  secoes?: SecaoSintese[];
  gradeCampos: LinhaGrade[];
  metodo: string[];
  /** De onde veio: o artefato vivo e quando o JSON foi gerado. */
  origem: { artefato: string; geradoEm: string };
  atualizado?: string;
}

/** Análise (coleção `analisesReferencias`): o que um plano lê das referências numa rodada. */
export interface AnaliseReferencias {
  id: string;
  /** Planos a que serve, pelo nome ("Caminhos do Forró"). A de 22/10 serve três ao mesmo tempo. */
  planos: string[];
  /** Data da análise (a da rodada mais recente que ela lê). */
  data: string;
  titulo: string;
  /** Rodadas que a análise lê (ids `rr-`). */
  rodadaIds: string[];
  /** Referências que ela usa (ids `rf-`), na ordem das colunas. */
  refIds: string[];
  /** O parágrafo de abertura, que cruza os perfis. */
  abertura: string;
  /** As seções: "rende", "reels", "amostra", "devorar" (devorar e devolver), ou outras. */
  secoes: SecaoSintese[];
  origem: { artefato: string; geradoEm: string };
  atualizado?: string;
}

/** Nível de acesso aos dados de dentro de um perfil próprio. */
export type AcessoProprio = "total" | "pedir" | "temporário" | "sem perfil";

/** Perfil próprio (coleção `perfisProprios`). */
export interface PerfilProprio {
  id: string;
  slug: string;
  nome: string;
  /** Usuário no Instagram, sem o @; vazio enquanto o perfil não existe ou o @ não foi confirmado. */
  instagram: string;
  situacao: "no ar" | "a criar";
  /** Planos que publicam neste perfil, pelo nome ("Samba de Ponta", "Ponta de Lança"). */
  planos: string[];
  /** Quem tem acesso aos dados de dentro (Business Suite), e de que jeito. */
  acesso: AcessoProprio;
  quemAcessa: string;
  /** Quem alimenta a camada "por dentro" na rotina. */
  alimenta: string;
  obs: string[];
  /** As leituras de dentro (ids `lp-`), da mais antiga à mais nova; o importador mantém. */
  leituras: { id: string; data: string }[];
  atualizado?: string;
}

/** Uma fatia do público (gênero, faixa de idade, cidade) e a parcela dos seguidores (0 a 1). */
export interface FatiaPublico { rotulo: string; parcela: number }

/** Um post visto por dentro (Business Suite > Insights > Conteúdo). Vazio fica null. */
export interface PostProprio {
  /** AAAA-MM-DDTHH:MM, hora do Rio. */
  publicadoEm: string;
  formato: "Reel" | "Carrossel" | "Foto" | string;
  /** "próprio" ou "collab: <usuário>" (o parceiro do post). */
  autor: string;
  editoria: string;
  visualizacoes: number | null;
  visualizacoesPagas: number | null;
  alcance: number | null;
  alcancePago: number | null;
  interacoes: number | null;
  curtidas: number | null;
  comentarios: number | null;
  compartilhamentos: number | null;
  salvamentos: number | null;
  seguidoresGanhos: number | null;
  /** Tempo médio assistido (s), só Reels. */
  tempoMedio: number | null;
  impulsionado: boolean;
  /** Começo da legenda. */
  legenda: string;
}

/** Leitura por dentro de um perfil próprio (coleção `leiturasProprias`). */
export interface LeituraPropria {
  id: string;
  perfilId: string;
  /** Dia em que o público foi lido. */
  data: string;
  /** Janela dos posts. */
  inicio: string;
  fim: string;
  fonte: string;
  publico: {
    seguidores: number | null;
    novos: number | null;
    perdidos: number | null;
    /** Período de novos e perdidos ("24/09 a 21/10/2026"). */
    periodoMovimento: string;
    genero: FatiaPublico[];
    idade: FatiaPublico[];
    cidades: FatiaPublico[];
  };
  posts: PostProprio[];
  /** O que a leitura concluiu (texto com **negrito**). */
  diagnostico: { rende: string[]; naoRende: string[]; comparacao: string };
  origem: { artefato: string; geradoEm: string };
  atualizado?: string;
}

/** As coleções da Biblioteca. */
export const COLECOES_COMUNICACAO = [
  "referencias", "leiturasReferencias", "rodadasReferencias", "analisesReferencias", "perfisProprios", "leiturasProprias",
] as const;
export type ColecaoComunicacao = (typeof COLECOES_COMUNICACAO)[number];
