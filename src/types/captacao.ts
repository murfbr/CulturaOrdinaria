/* Captação (ambiente da Central, decisão de 21/10/2026): as cinco coleções
   próprias da frente de patrocínio. Empresa é um registro de relacionamento
   (CNPJ, setor, pessoas de contato e histórico de contato dentro do documento),
   separado de `contatos`, que é agenda de uma linha. Negociação é empresa ×
   projeto do portfólio × quem capta; captadora vazia = a equipe do coletivo.
   As quatro listas de escolha moram em `presets/captacao` (editáveis em
   Opções); os ids que o código interpreta estão nas constantes do fim. */

/** Pessoa dentro da empresa (lista no documento da empresa). */
export interface PessoaContato {
  id: string;
  nome: string;
  cargo: string;
  telefone: string;
  email: string;
}

/** Uma entrada do histórico de contato (lista no documento da empresa, mais recente em cima). */
export interface EntradaHistorico {
  id: string;
  /** Data ISO (aaaa-mm-dd). */
  data: string;
  /** E-mail de quem registrou (automático). */
  quem: string;
  texto: string;
}

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  setor: string;
  site: string;
  pessoas: PessoaContato[];
  historico: EntradaHistorico[];
  obs: string;
  _ord?: number;
  atualizado?: string;
}

/** Parceira de fora que capta com comissão. */
export interface Captadora {
  id: string;
  nome: string;
  /** Telefone ou e-mail. */
  contato: string;
  /** Área de atuação (bebidas, bancos, varejo...). */
  area: string;
  obs: string;
  _ord?: number;
  atualizado?: string;
}

/** Projeto que o coletivo oferece às empresas (o material da conversa). */
export interface ProjetoCaptacao {
  id: string;
  nome: string;
  /** Resumo para as empresas. */
  resumo: string;
  /** Link da página do projeto. */
  link: string;
  inicio: string;
  fim: string;
  local: string;
  /** Id de `mecanismos`. */
  mecanismo: string;
  /** Id de `situacaoProjeto`; só "aberto" entra no resumo e no inventário. */
  situacao: string;
  /** Meta de captação em reais; vazio = ainda não definida. */
  meta: number | null;
  /** Comissão das captadoras (%); vazio = ainda não combinada. */
  comissaoPct: number | null;
  /** Id de `baseComissao`. */
  comissaoBase: string;
  obs: string;
  _ord?: number;
  atualizado?: string;
}

export interface CotaCaptacao {
  id: string;
  projetoId: string;
  nome: string;
  /** Em reais; vazio = valor variável ou a negociar. */
  valor: number | null;
  /** Vazio = sem limite definido. */
  quantidade: number | null;
  contrapartidas: string;
  /** Posição no cartão do projeto. */
  ordem: number;
  _ord?: number;
  atualizado?: string;
}

export interface Negociacao {
  id: string;
  empresaId: string;
  projetoId: string;
  /** Vazio = sem cota definida. */
  cotaId: string;
  /** Vazio = a equipe do coletivo (sem comissão). */
  captadoraId: string;
  valor: number | null;
  /** Id de `etapas`. */
  etapa: string;
  ultimoContato: string;
  proximoPasso: string;
  dataProximo: string;
  /** Reservado para quem capta até esta data (exclusividade combinada). */
  reservaAte: string;
  /** Fica no histórico da empresa quando a etapa é "perdido". */
  motivoPerda: string;
  /** Comissão desta negociação (%); vazio = a do projeto. */
  comissaoPct: number | null;
  valorRecebido: number | null;
  comissaoPaga: boolean;
  obs: string;
  _ord?: number;
  atualizado?: string;
}

/** Item de uma lista de escolha: os registros guardam o id, a tela mostra o nome. */
export interface ItemListaCaptacao { id: string; nome: string }

/** Documento `presets/captacao`: as quatro listas de escolha do ambiente. */
export interface PresetCaptacao {
  id: "captacao";
  listas: {
    etapas: ItemListaCaptacao[];
    mecanismos: ItemListaCaptacao[];
    situacaoProjeto: ItemListaCaptacao[];
    baseComissao: ItemListaCaptacao[];
  };
}

export type NomeListaCaptacao = keyof PresetCaptacao["listas"];

/** Vale enquanto o banco não tem o documento `presets/captacao`. */
export const PRESET_CAPTACAO_PADRAO: PresetCaptacao = {
  id: "captacao",
  listas: {
    etapas: [
      { id: "prospeccao", nome: "Prospecção" }, { id: "contato_feito", nome: "Contato feito" },
      { id: "proposta_enviada", nome: "Proposta enviada" }, { id: "negociacao", nome: "Negociação" },
      { id: "confirmado", nome: "Confirmado" }, { id: "perdido", nome: "Perdido" },
    ],
    mecanismos: [
      { id: "a_definir", nome: "A definir" }, { id: "direto", nome: "Patrocínio direto" },
      { id: "rouanet", nome: "Lei Rouanet" }, { id: "icms", nome: "Lei estadual (ICMS)" }, { id: "iss", nome: "Lei municipal (ISS)" },
    ],
    situacaoProjeto: [
      { id: "aberto", nome: "Aberto para captação" }, { id: "captado", nome: "Captado" }, { id: "encerrado", nome: "Encerrado" },
    ],
    baseComissao: [
      { id: "a_definir", nome: "A definir" }, { id: "sobre_fechado", nome: "Sobre o valor fechado" }, { id: "sobre_recebido", nome: "Sobre o valor recebido" },
    ],
  },
};

/* Ids que o código interpreta (não se apagam em Opções; renomear pode). */
export const ETAPA_CONFIRMADO = "confirmado";
export const ETAPA_PERDIDO = "perdido";
/** Etapas que somam em "com proposta enviada". */
export const ETAPAS_COM_PROPOSTA = ["proposta_enviada", "negociacao"];
export const SITUACAO_ABERTO = "aberto";
export const BASE_A_DEFINIR = "a_definir";
export const BASE_SOBRE_FECHADO = "sobre_fechado";
export const BASE_SOBRE_RECEBIDO = "sobre_recebido";

/** Por lista, os ids protegidos (o código os interpreta). Base da comissão é inteira: cada opção muda a conta. */
export const IDS_PROTEGIDOS_CAPTACAO: Record<NomeListaCaptacao, string[]> = {
  etapas: [ETAPA_CONFIRMADO, ETAPA_PERDIDO, ...ETAPAS_COM_PROPOSTA],
  mecanismos: [],
  situacaoProjeto: [SITUACAO_ABERTO],
  baseComissao: [BASE_A_DEFINIR, BASE_SOBRE_FECHADO, BASE_SOBRE_RECEBIDO],
};

export const ROTULO_LISTA_CAPTACAO: Record<NomeListaCaptacao, string> = {
  etapas: "Etapas da negociação", mecanismos: "Mecanismos de captação",
  situacaoProjeto: "Situação do projeto", baseComissao: "Base da comissão",
};

/** As coleções da Captação, na ordem de exibição (também em COLECOES_PAINEL). */
export const COLECOES_CAPTACAO = ["empresas", "captadoras", "portfolio", "cotas", "negociacoes"] as const;
