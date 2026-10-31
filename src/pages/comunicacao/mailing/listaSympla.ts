/* Leitura da lista de participantes exportada do Sympla, no navegador de quem
   importa: o arquivo vai do computador direto pro banco da Central, sem passar
   por nenhum outro lugar. Aceita .xlsx e .csv. O cabeçalho do Sympla muda de
   tempos em tempos, então as colunas não são fixas: este módulo acha a linha
   do cabeçalho, dá um palpite de qual coluna é qual campo (pelo nome) e a tela
   deixa a pessoa corrigir. Só os campos daqui entram no banco; o resto da
   planilha (CPF, telefone, respostas do formulário, navegador) fica de fora. */
import type { ParticipanteMailing, TotaisEventoMailing } from "../../../types";

export type CampoLista =
  | "email" | "nome" | "sobrenome" | "pedido" | "ingresso" | "tipo" | "retirada" | "checkin" | "checkinEm"
  | "utm" | "utmSource" | "utmMedium" | "utmCampaign" | "utmContent" | "utmTerm";

export interface DefinicaoCampo {
  campo: CampoLista;
  rotulo: string;
  ajuda: string;
  obrigatorio?: boolean;
}

export const CAMPOS_LISTA: DefinicaoCampo[] = [
  { campo: "email", rotulo: "E-mail", ajuda: "de quem fez o pedido", obrigatorio: true },
  { campo: "nome", rotulo: "Nome", ajuda: "ou nome completo" },
  { campo: "sobrenome", rotulo: "Sobrenome", ajuda: "quando vem separado do nome" },
  { campo: "pedido", rotulo: "Nº do pedido", ajuda: "um pedido leva até 3 ingressos" },
  { campo: "ingresso", rotulo: "Nº do ingresso", ajuda: "código de cada ingresso" },
  { campo: "tipo", rotulo: "Tipo de ingresso", ajuda: "lote, cortesia, meia..." },
  { campo: "retirada", rotulo: "Data da retirada", ajuda: "data e hora da compra" },
  { campo: "checkin", rotulo: "Check-in", ajuda: "sim/não ou a hora" },
  { campo: "checkinEm", rotulo: "Hora do check-in", ajuda: "quando vem em coluna própria" },
  { campo: "utmSource", rotulo: "utm_source", ajuda: "" },
  { campo: "utmMedium", rotulo: "utm_medium", ajuda: "" },
  { campo: "utmCampaign", rotulo: "utm_campaign", ajuda: "" },
  { campo: "utmContent", rotulo: "utm_content", ajuda: "o perfil, no link de divulgador" },
  { campo: "utmTerm", rotulo: "utm_term", ajuda: "" },
  { campo: "utm", rotulo: "UTM inteira", ajuda: "quando as etiquetas vêm juntas numa coluna só" },
];

export type MapaColunas = Record<CampoLista, number>;

/** "Data do Check-in" → "data do check in"; "Nº" → "no". */
export const normalizarCabecalho = (s: string) =>
  String(s ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[_\-.:/()]/g, " ").replace(/\s+/g, " ").trim();

const ehEmail = (h: string) => /\be ?mail\b/.test(h);
const ehCheckin = (h: string) => /check ?in/.test(h);

/** Linha do cabeçalho: a primeira (entre as 15 primeiras) com uma coluna de e-mail. */
export function acharCabecalho(linhas: string[][]): number {
  for (let i = 0; i < Math.min(linhas.length, 15); i++) {
    if ((linhas[i] || []).some((c) => ehEmail(normalizarCabecalho(c)))) return i;
  }
  return 0;
}

/** Palpite de coluna para cada campo, pelo nome do cabeçalho (-1 = nenhuma). */
export function palpiteDeColunas(cabecalho: string[]): MapaColunas {
  const h = cabecalho.map(normalizarCabecalho);
  const usadas = new Set<number>();
  const achar = (teste: (x: string) => boolean): number => {
    const i = h.findIndex((x, j) => !usadas.has(j) && x && teste(x));
    if (i >= 0) usadas.add(i);
    return i;
  };
  const m = {} as MapaColunas;
  // Os específicos primeiro, pra não serem pegos pelos genéricos ("data do check-in" não é a data da retirada).
  m.utmSource = achar((x) => /utm ?source/.test(x));
  m.utmMedium = achar((x) => /utm ?medium/.test(x));
  m.utmCampaign = achar((x) => /utm ?campaign/.test(x));
  m.utmContent = achar((x) => /utm ?content/.test(x));
  m.utmTerm = achar((x) => /utm ?term/.test(x));
  m.utm = [m.utmSource, m.utmMedium, m.utmCampaign, m.utmContent].some((i) => i >= 0) ? -1 : achar((x) => /\butms?\b/.test(x));
  m.checkinEm = achar((x) => ehCheckin(x) && /\b(data|hora|horario|em)\b/.test(x));
  m.checkin = achar((x) => ehCheckin(x));
  m.email = achar((x) => ehEmail(x) && /comprador|pedido|responsavel/.test(x));
  if (m.email < 0) m.email = achar(ehEmail);
  m.sobrenome = achar((x) => /sobrenome/.test(x));
  m.tipo = achar((x) => /tipo (de )?ingresso|^tipo$|^ingresso tipo|categoria|^lote$/.test(x));
  m.ingresso = achar((x) => /ingresso|ticket|inscricao/.test(x) && /\b(numero|codigo|no|n|id|cod)\b/.test(x) && !/tipo|valor|data/.test(x));
  m.pedido = achar((x) => /pedido|order/.test(x) && !/data|valor|status|e ?mail|forma/.test(x));
  m.retirada = achar((x) => /data|hora/.test(x) && /compra|pedido|retirada|inscricao|emissao|criacao/.test(x));
  if (m.retirada < 0) m.retirada = achar((x) => /^data( e hora)?$/.test(x));
  m.nome = achar((x) => /^nome( completo)?$|^nome do (participante|comprador)|^participante$|^nome/.test(x) && !/evento|ingresso|sobrenome/.test(x));
  return m;
}

/** Valor de célula → data e hora ISO ("2026-07-30T14:05"), ou o texto como veio. */
export function dataDoSympla(v: string): string {
  const t = String(v ?? "").trim();
  if (!t) return "";
  // Número de série do Excel (dias desde 30/12/1899, com a hora na fração).
  if (/^\d{5}(\.\d+)?$/.test(t)) {
    const ms = Math.round((Number(t) - 25569) * 86400000);
    return new Date(ms).toISOString().slice(0, 16);
  }
  const br = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:[ T,]+(\d{1,2}):(\d{2})(?::\d{2})?)?/);
  if (br) {
    const ano = br[3].length === 2 ? "20" + br[3] : br[3];
    const dia = ano + "-" + br[2].padStart(2, "0") + "-" + br[1].padStart(2, "0");
    return br[4] ? dia + "T" + br[4].padStart(2, "0") + ":" + br[5] : dia;
  }
  const iso = t.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}))?/);
  if (iso) return iso[2] ? iso[1] + "T" + iso[2] : iso[1];
  return t;
}

/** "Sim", "1", uma data → fez check-in; "Não", "0", vazio → não fez. */
export function simNao(v: string): boolean {
  const t = normalizarCabecalho(v);
  if (!t) return false;
  if (/^(nao|n|no|false|0|pendente|nao realizado|sem check in|aguardando)$/.test(t)) return false;
  return true;
}

/** "utm_source=instagram&utm_medium=agenda" (ou a URL inteira) → as etiquetas. */
export function lerUtm(v: string): Partial<Record<"utmSource" | "utmMedium" | "utmCampaign" | "utmContent" | "utmTerm", string>> {
  const t = String(v ?? "").trim();
  if (!t) return {};
  if (!t.includes("=")) return { utmSource: t };
  const saida: Partial<Record<"utmSource" | "utmMedium" | "utmCampaign" | "utmContent" | "utmTerm", string>> = {};
  const qs = t.includes("?") ? t.slice(t.indexOf("?") + 1) : t;
  for (const par of qs.split(/[&;|]/)) {
    const [k, ...resto] = par.split("=");
    const valor = decodeURIComponentSeguro(resto.join("=").trim());
    const chave = normalizarCabecalho(k).replace(/\s/g, "");
    if (!valor) continue;
    if (chave === "utmsource") saida.utmSource = valor;
    else if (chave === "utmmedium") saida.utmMedium = valor;
    else if (chave === "utmcampaign") saida.utmCampaign = valor;
    else if (chave === "utmcontent") saida.utmContent = valor;
    else if (chave === "utmterm") saida.utmTerm = valor;
  }
  return saida;
}
function decodeURIComponentSeguro(s: string): string {
  try { return decodeURIComponent(s.replace(/\+/g, " ")); } catch { return s; }
}

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ListaLida {
  participantes: ParticipanteMailing[];
  /** Linhas com conteúdo mas sem e-mail válido (ficam de fora). */
  descartadas: number;
  /** Exemplos de linhas descartadas (só o valor da coluna de e-mail), pra conferência. */
  exemplosDescartados: string[];
}

/** As linhas abaixo do cabeçalho → participantes, só com os campos mapeados (vazios não entram). */
export function lerParticipantes(linhas: string[][], linhaCabecalho: number, mapa: MapaColunas): ListaLida {
  const participantes: ParticipanteMailing[] = [];
  let descartadas = 0;
  const exemplosDescartados: string[] = [];
  const cel = (l: string[], campo: CampoLista) => (mapa[campo] >= 0 ? String(l[mapa[campo]] ?? "").trim() : "");
  for (const l of linhas.slice(linhaCabecalho + 1)) {
    if (!l || !l.some((c) => String(c ?? "").trim())) continue;
    const email = cel(l, "email").toLowerCase();
    if (!EMAIL_VALIDO.test(email)) {
      descartadas++;
      if (exemplosDescartados.length < 3) exemplosDescartados.push(email || "(vazio)");
      continue;
    }
    const p: ParticipanteMailing = { email };
    const nome = [cel(l, "nome"), cel(l, "sobrenome")].filter(Boolean).join(" ").replace(/\s+/g, " ");
    if (nome) p.nome = nome;
    const pedido = cel(l, "pedido"); if (pedido) p.pedido = pedido;
    const ingresso = cel(l, "ingresso"); if (ingresso) p.ingresso = ingresso;
    const tipo = cel(l, "tipo"); if (tipo) p.tipo = tipo;
    const retirada = dataDoSympla(cel(l, "retirada")); if (retirada) p.retirada = retirada;
    const checkinEm = dataDoSympla(cel(l, "checkinEm"));
    const checkinCru = cel(l, "checkin");
    const checkin = mapa.checkin >= 0 ? simNao(checkinCru) : Boolean(checkinEm);
    if (mapa.checkin >= 0 || mapa.checkinEm >= 0) p.checkin = checkin;
    // A coluna de check-in às vezes traz a própria hora.
    const horaNoCheckin = checkin && /\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2}|^\d{5}/.test(checkinCru) ? dataDoSympla(checkinCru) : "";
    if (checkinEm || horaNoCheckin) p.checkinEm = checkinEm || horaNoCheckin;
    const utm = { ...lerUtm(cel(l, "utm")) };
    for (const c of ["utmSource", "utmMedium", "utmCampaign", "utmContent", "utmTerm"] as const) {
      const v = cel(l, c);
      if (v) utm[c] = v;
    }
    Object.assign(p, utm);
    participantes.push(p);
  }
  return { participantes, descartadas, exemplosDescartados };
}

export const temUtm = (p: ParticipanteMailing) => Boolean(p.utmSource || p.utmMedium || p.utmCampaign || p.utmContent || p.utmTerm);

export function totaisDe(participantes: ParticipanteMailing[]): TotaisEventoMailing {
  return {
    ingressos: participantes.length,
    pedidos: new Set(participantes.map((p) => p.pedido || "e:" + p.email)).size,
    emails: new Set(participantes.map((p) => p.email)).size,
    checkins: participantes.filter((p) => p.checkin).length,
    comUtm: participantes.filter(temUtm).length,
  };
}
