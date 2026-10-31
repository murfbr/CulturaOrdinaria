/* Links com UTM pros divulgadores (doc 02, seção 7a2): o mesmo evento do
   Sympla, com as etiquetas no fim do endereço. O Sympla guarda as etiquetas
   em cada ingresso, e a lista de participantes (Mailing) diz quantas
   retiradas vieram pelo link de cada perfil.
   Padrão: utm_source=instagram & utm_medium=agenda & utm_campaign=<plano>-<mês><ano> & utm_content=<perfil>. */
import type { Divulgador, EnvioDivulgador } from "../../../types";

export interface Etiquetas { source?: string; medium?: string; campaign?: string; content?: string }

/** Link do evento + etiquetas (troca as utm_* que já houver). "" se o link não é um endereço. */
export function linkComUtm(base: string, utm: Etiquetas): string {
  const limpo = base.trim();
  if (!limpo) return "";
  let u: URL;
  try { u = new URL(/^https?:\/\//i.test(limpo) ? limpo : "https://" + limpo); } catch { return ""; }
  if (!u.hostname.includes(".")) return "";
  for (const k of [...u.searchParams.keys()]) if (k.toLowerCase().startsWith("utm_")) u.searchParams.delete(k);
  if (utm.source) u.searchParams.set("utm_source", utm.source);
  if (utm.medium) u.searchParams.set("utm_medium", utm.medium);
  if (utm.campaign) u.searchParams.set("utm_campaign", utm.campaign);
  if (utm.content) u.searchParams.set("utm_content", utm.content);
  return u.toString();
}

/** Texto → etiqueta: minúsculas, sem acento, hífen no lugar de espaço. */
export const etiqueta = (s: string) =>
  String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9._]+/g, "-").replace(/^-+|-+$/g, "");

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "Ponta de Lança", "2026-11-06" → "pontadelanca-nov26". */
export function campanhaPadrao(plano: string, data: string): string {
  const p = etiqueta(plano).replace(/[-.]/g, "");
  const m = /^(\d{4})-(\d{2})/.exec(data || "");
  return [p, m ? MESES[Number(m[2]) - 1] + m[1].slice(2) : ""].filter(Boolean).join("-");
}

/** Etiquetas do link de um divulgador. */
export const etiquetasDivulgador = (d: Pick<Divulgador, "instagram">, campanha: string): Etiquetas =>
  ({ source: "instagram", medium: "agenda", campaign: campanha, content: d.instagram });

/** Mensagem do kit com o link do divulgador no lugar de {link}. */
export const mensagemDoKit = (modelo: string, link: string) =>
  modelo.includes("{link}") ? modelo.split("{link}").join(link) : (modelo.trim() + "\n" + link).trim();

/** Soma das retiradas registradas e quantos envios publicaram. */
export function resumoHistorico(historico: EnvioDivulgador[]) {
  const respondidos = historico.filter((h) => h.publicou !== "aguardando");
  return {
    envios: historico.length,
    publicaram: historico.filter((h) => h.publicou === "sim").length,
    respondidos: respondidos.length,
    retiradas: historico.reduce((s, h) => s + (h.retiradas || 0), 0),
    comContagem: historico.filter((h) => h.retiradas != null).length,
  };
}

/* O link do evento e a campanha do último kit ficam neste navegador (conveniência de quem monta o kit;
   não é dado do coletivo): o kit reabre com eles e a ficha de cada divulgador já monta o link. */
const CHAVE_KIT = "central-kit-divulgadores";
interface KitLembrado { base: string; campanha: string }
function lerKits(): { ultimo?: string; eventos: Record<string, KitLembrado> } {
  try { return JSON.parse(localStorage.getItem(CHAVE_KIT) || "") || { eventos: {} }; } catch { return { eventos: {} }; }
}
export function lembrarKit(symplaId: string, kit: KitLembrado) {
  try {
    const k = lerKits();
    k.eventos = { ...(k.eventos || {}), [symplaId || "outro"]: kit };
    k.ultimo = symplaId || "outro";
    localStorage.setItem(CHAVE_KIT, JSON.stringify(k));
  } catch { /* sem localStorage: só não lembra */ }
}
/** O kit lembrado de um evento, ou o último montado. */
export function kitLembrado(symplaId?: string): KitLembrado | null {
  const k = lerKits();
  const id = symplaId ?? k.ultimo ?? "";
  return (k.eventos || {})[id || "outro"] || null;
}
