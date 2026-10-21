/* Instagram e as outras redes do cadastro. O perfil aceita como a pessoa
   colar (com ou sem @, ou o link inteiro) e guarda só o nome; os seguidores
   aceitam "9.369", "9369", "9,4 mil" ou "1,2 mi". */
import { normalizar } from "../listas";
import { REDES, type Cadastro, type Rede } from "../tipos";

/** "@forroderabecarj", "instagram.com/forroderabecarj/" ou "forroderabecarj" → "forroderabecarj". */
export function perfilInstagram(texto: string | null | undefined): string {
  let t = String(texto || "").trim();
  const m = t.match(/instagram\.com\/([^/?#\s]+)/i);
  if (m) t = m[1];
  return t.replace(/^@/, "").replace(/\/+$/, "").trim();
}

export const linkInstagram = (perfil: string) => "https://www.instagram.com/" + perfilInstagram(perfil) + "/";

/** Texto da contagem → número; null quando vazio ou ilegível. */
export function lerSeguidores(texto: string | number | null | undefined): number | null {
  if (typeof texto === "number") return Number.isFinite(texto) && texto >= 0 ? Math.round(texto) : null;
  const t = normalizar(String(texto || "")).replace(/\s+/g, " ").trim();
  if (!t) return null;
  const m = t.match(/^([\d.,]+)\s*(mil|k|milhoes|milhao|mi|m)?\b/);
  if (!m) return null;
  const mult = m[2] ? (m[2] === "mil" || m[2] === "k" ? 1e3 : 1e6) : 1;
  const n = mult === 1 ? Number(m[1].replace(/[.,]/g, "")) : Number(m[1].replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * mult) : null;
}

/** As redes preenchidas de um cadastro, na ordem de REDES. */
export const redesDe = (d: Cadastro): { rede: Rede; nome: string; url: string }[] =>
  REDES.filter(([r]) => d.redes?.[r]).map(([rede, nome]) => ({ rede, nome, url: d.redes![rede]! }));

/** Só as redes com link, sem espaços sobrando; vazio vira undefined para não gravar objeto vazio. */
export function limparRedes(redes: Cadastro["redes"]): Cadastro["redes"] {
  const r: Partial<Record<Rede, string>> = {};
  for (const [rede] of REDES) {
    const v = (redes?.[rede] || "").trim();
    if (v) r[rede] = v;
  }
  return Object.keys(r).length ? r : undefined;
}
