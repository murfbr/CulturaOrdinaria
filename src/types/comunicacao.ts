/* Comunicação (ambiente da Central, 23/10/2026): por enquanto, a Biblioteca de
   referências. Três coleções, todas gravadas pelo módulo "comunicacao":

   - `referencias` (id `rf-xxxxxx`): o perfil de referência, compartilhado entre
     os planos (doc 02 da metodologia, seção 7a), com o resumo da última leitura
     e uma linha de histórico por rodada.
   - `leiturasReferencias` (id `lr-xxxxxx`): o retrato de um perfil numa rodada:
     os posts da janela, os destaques, a amostra assistida e as notas da leitura.
     Um documento por perfil por rodada; a tela só abre os da rodada escolhida.
   - `rodadasReferencias` (id `rr-xxxxxx`): a rodada de leitura dos perfis, com a
     síntese que cruza os perfis, a grade de campos e o método.

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
  nivelLeitura: "grade v5" | "consulta" | string;
  /** Planos em que é âncora ou consulta (ids `pc-`), gravado pela frente dos planos. */
  planos?: string[];
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

/** Rodada de leitura (coleção `rodadasReferencias`). */
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
  /** O parágrafo de abertura. */
  abertura: string;
  secoes: SecaoSintese[];
  gradeCampos: LinhaGrade[];
  metodo: string[];
  /** De onde veio: o artefato vivo e quando o JSON foi gerado. */
  origem: { artefato: string; geradoEm: string };
  atualizado?: string;
}

/** As três coleções da Biblioteca. */
export const COLECOES_COMUNICACAO = ["referencias", "leiturasReferencias", "rodadasReferencias"] as const;
export type ColecaoComunicacao = (typeof COLECOES_COMUNICACAO)[number];
