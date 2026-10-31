/* Divulgadores e Mailing da Comunicação (doc 02 da metodologia, seções 7a2 e
   7b), desde 31/10/2026.

   Divulgador: perfil de agenda ou página que replica nossos eventos quando a
   gente pede. É canal de distribuição, não referência: guarda como pedir, o
   que aceita e o histórico de envios, evento a evento, com o link de UTM de
   cada um. Lê para quem tem módulo da Central; grava o módulo Comunicação.

   Mailing: a lista de participantes exportada do Sympla, um evento por vez.
   Só nome, e-mail e participação (pedido, ingresso, tipo, retirada, check-in,
   UTM); nada de CPF nem telefone. Lê e grava só quem tem o módulo "mailing"
   (ou master), com registro de acesso. Fica fora do espelho local, do log de
   alterações e do vault.

   Um documento por evento (e não um por e-mail, como o doc 02 desenhava): são
   ~20 leituras para abrir o Mailing, em vez de milhares. As contas por pessoa
   (quem volta, eventos por e-mail) saem daqui, no navegador. Evento grande se
   divide em partes de até PARTICIPANTES_POR_PARTE linhas (o Firestore aceita
   até 1 MB por documento). */

/* ══════════ Divulgadores ══════════ */

export const TIPOS_DIVULGADOR = ["agenda da cena", "guia da cidade", "página de bairro", "coletivo ou movimento", "mídia", "outro"] as const;
export const ACEITA_DIVULGADOR = ["repost no feed", "story", "agenda da semana", "collab"] as const;
export const CUSTO_DIVULGADOR = ["grátis", "permuta", "pago"] as const;
export const PUBLICOU_ENVIO = ["aguardando", "sim", "não", "sem resposta"] as const;
export type PublicouEnvio = (typeof PUBLICOU_ENVIO)[number];

/** Um pedido de divulgação, num evento. */
export interface EnvioDivulgador {
  id: string;
  /** Nome do plano ("Ponta de Lança"); os planos ainda não moram na Central. */
  plano: string;
  /** Edição ou evento ("Edição 02 · 06/11"). */
  ciclo: string;
  /** Evento no Sympla, quando tem: liga as retiradas pela UTM. */
  symplaId: string;
  enviadoEm: string;
  publicou: PublicouEnvio;
  /** Link do que publicaram. */
  link: string;
  /** Repost, story, agenda da semana, collab. */
  formato: string;
  /** O `utm_content` usado no link deste envio. */
  utm: string;
  /** Retiradas que vieram pelo link (gravadas pelo Mailing; agregado, sem nome). */
  retiradas: number | null;
  obs: string;
}

export interface Divulgador {
  id: string;
  /** Usuário sem @, em minúsculas. */
  instagram: string;
  nome: string;
  tipo: string;
  nichos: string[];
  territorio: string[];
  /** DM, WhatsApp, e-mail, formulário; com quanta antecedência; o que mandar. */
  comoPedir: string;
  aceita: string[];
  custo: string;
  /** Valor ou condição, quando é pago ou permuta. */
  custoObs: string;
  /** Quem fala com eles: "contato:<id>" ou "equipe:<id>", ou um nome solto. */
  quemFala: string;
  seguidores: number | null;
  seguidoresEm: string;
  /** Em uso, a testar (ainda não pedimos) ou não usar. */
  situacao: "em uso" | "a testar" | "não usar";
  historico: EnvioDivulgador[];
  obs: string;
  criado: string;
  atualizado?: string;
}

/* ══════════ Mailing ══════════ */

/** Uma linha da lista do Sympla: um ingresso. O e-mail é de quem fez o pedido
    (um pedido leva até 3 ingressos). Campos vazios não são gravados. */
export interface ParticipanteMailing {
  email: string;
  nome?: string;
  pedido?: string;
  ingresso?: string;
  tipo?: string;
  /** Data e hora da retirada ("2026-07-30T14:05"). */
  retirada?: string;
  checkin?: boolean;
  checkinEm?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

export interface TotaisEventoMailing {
  ingressos: number;
  pedidos: number;
  emails: number;
  checkins: number;
  comUtm: number;
}

/** Documento `mailingEventos/me-<symplaId>` (parte 1) ou `me-<symplaId>-<n>`. */
export interface EventoMailing {
  id: string;
  symplaId: string;
  parte: number;
  partes: number;
  titulo: string;
  data: string;
  local: string;
  /** Dono do evento no Sympla (SdP, Gustavo, um parceiro). */
  organizador: string;
  plano: string;
  ciclo: string;
  /** Números do evento inteiro (iguais em todas as partes). */
  totais: TotaisEventoMailing;
  /** Nome do arquivo importado e quantas linhas ficaram de fora (sem e-mail). */
  arquivo: string;
  descartadas: number;
  importadoEm: string;
  importadoPor: string;
  participantes: ParticipanteMailing[];
  atualizado?: string;
}

/** Documento `mailingDescadastros/md-<hash do e-mail>`: quem pediu pra não receber. */
export interface DescadastroMailing {
  id: string;
  email: string;
  data: string;
  motivo: string;
  quem: string;
}

export const ACOES_REGISTRO = ["abriu", "importou", "exportou", "apagou", "descadastrou", "recadastrou", "contou"] as const;
export type AcaoRegistroMailing = (typeof ACOES_REGISTRO)[number];

/** Documento `mailingRegistro/mr-…`: uma linha por acesso. Só se acrescenta. */
export interface RegistroMailing {
  id: string;
  quem: string;
  quando: string;
  acao: AcaoRegistroMailing;
  detalhe: string;
}

/** Linhas por documento de evento (~170 bytes cada: 1.500 linhas ≈ 260 KB). */
export const PARTICIPANTES_POR_PARTE = 1500;

export const COLECOES_MAILING = ["mailingEventos", "mailingDescadastros", "mailingRegistro"] as const;
export const MODULO_MAILING = "mailing";

/** Os eventos da conta do Samba de Ponta no Sympla (referência 12 e Painel Ponta
    de Lança). Só dados públicos do evento: servem pra escolher o evento na
    importação, conferir o número de linhas e mostrar o que falta importar. */
export interface EventoSympla {
  symplaId: string;
  titulo: string;
  data: string;
  local: string;
  organizador: string;
  plano: string;
  ciclo: string;
  /** Retiradas que o Sympla mostrava (pra conferir a lista). */
  retiradas: number | null;
}

export const EVENTOS_SYMPLA: EventoSympla[] = [
  { symplaId: "3061961", titulo: "Feijuca com Samba", data: "2025-09-06", local: "Largo do Boticário", organizador: "Jo Joe", plano: "Samba de Ponta", ciclo: "", retiradas: 168 },
  { symplaId: "3120027", titulo: "Samba de Ponta no Beco da Cultura", data: "2025-09-19", local: "Beco da Cultura", organizador: "Beco da Cultura RJ", plano: "Samba de Ponta", ciclo: "", retiradas: 628 },
  { symplaId: "3111102", titulo: "Feijuca com Samba", data: "2025-10-04", local: "Largo do Boticário", organizador: "Jo Joe", plano: "Samba de Ponta", ciclo: "", retiradas: 159 },
  { symplaId: "3167700", titulo: "Samba de Ponta no Beco da Cultura", data: "2025-10-17", local: "Beco da Cultura", organizador: "Beco da Cultura RJ", plano: "Samba de Ponta", ciclo: "", retiradas: 227 },
  { symplaId: "3197231", titulo: "Swing da Barca", data: "2025-11-07", local: "Quintal da Lapa", organizador: "SdP", plano: "Samba de Ponta", ciclo: "", retiradas: 782 },
  { symplaId: "3182362", titulo: "Aniversário de 4 anos", data: "2025-11-08", local: "Arena Samol", organizador: "SdP", plano: "Samba de Ponta", ciclo: "", retiradas: 998 },
  { symplaId: "3215866", titulo: "Samba de Ponta no Beco da Cultura", data: "2025-11-21", local: "Beco da Cultura", organizador: "Beco da Cultura RJ", plano: "Samba de Ponta", ciclo: "", retiradas: 608 },
  { symplaId: "3259102", titulo: "Feijuca com Samba", data: "2026-01-03", local: "Largo do Boticário", organizador: "Jo Joe", plano: "Samba de Ponta", ciclo: "", retiradas: 23 },
  { symplaId: "3288014", titulo: "Feijuca com Samba", data: "2026-02-21", local: "Largo do Boticário", organizador: "Jo Joe", plano: "Samba de Ponta", ciclo: "", retiradas: 141 },
  { symplaId: "3315578", titulo: "De Ponta com Dendê", data: "2026-02-28", local: "Luiz Gama", organizador: "Luiz Paulo Rocha", plano: "Samba de Ponta", ciclo: "", retiradas: 2978 },
  { symplaId: "3348128", titulo: "SdP no Mocamba Livre", data: "2026-03-21", local: "Mocamba Livre", organizador: "Jonathan Machado", plano: "Samba de Ponta", ciclo: "", retiradas: 946 },
  { symplaId: "3384728", titulo: "De Ponta com Dendê", data: "2026-04-25", local: "Luiz Gama", organizador: "Luiz Paulo Rocha", plano: "Samba de Ponta", ciclo: "", retiradas: 2884 },
  { symplaId: "3389038", titulo: "Feijuca com Samba", data: "2026-05-02", local: "Largo do Boticário", organizador: "Jo Joe", plano: "Samba de Ponta", ciclo: "", retiradas: 21 },
  { symplaId: "3427389", titulo: "SdP no Mocamba Livre", data: "2026-05-23", local: "Mocamba Livre", organizador: "Jonathan Machado", plano: "Samba de Ponta", ciclo: "", retiradas: 1045 },
  { symplaId: "3453078", titulo: "Baile da Paixão (Copa, Brasil x Haiti)", data: "2026-06-19", local: "Rua da Constituição, 54", organizador: "CMC eventos", plano: "Samba de Ponta", ciclo: "", retiradas: 3278 },
  { symplaId: "3474886", titulo: "SdP no Mocamba Livre", data: "2026-06-27", local: "Mocamba Livre", organizador: "Jonathan Machado", plano: "Samba de Ponta", ciclo: "", retiradas: 358 },
  { symplaId: "3515521", titulo: "Ponta de Lança · edição 01", data: "2026-08-01", local: "Largo Alexandre Herculano", organizador: "Nós Sempre (Gustavo)", plano: "Ponta de Lança", ciclo: "Edição 01", retiradas: 4449 },
  { symplaId: "3573355", titulo: "Ponta de Lança · 03/10 (adiado)", data: "2026-10-03", local: "Largo Alexandre Herculano", organizador: "SdP", plano: "Ponta de Lança", ciclo: "Edição 02 (data adiada)", retiradas: 447 },
  { symplaId: "3629333", titulo: "Ponta de Lança · edição 02", data: "2026-11-06", local: "Largo de São Francisco de Paula", organizador: "SdP", plano: "Ponta de Lança", ciclo: "Edição 02", retiradas: null },
];

/** Página de participantes do evento na área do produtor (de onde sai "Exportar participantes"). */
export const linkParticipantesSympla = (symplaId: string) =>
  "https://organizador.sympla.com.br/participantes-administrar?id=" + encodeURIComponent(symplaId);
