/* Funções puras da página: datas, dinheiro e a contagem regressiva. As contas
   do funil, do orçamento, da grade e das tarefas entram com as telas delas. */
import { formatarData } from "../../utils";

/** Hoje em ISO (yyyy-mm-dd), no fuso local. */
export const hojeIso = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

/** "2026-12-11" → "11/12/2026"; vazio → "—". */
export const dataBr = (iso?: string | null) => (iso ? formatarData(String(iso).slice(0, 10)) : "—");

/** Dinheiro inteiro como no artefato: "R$ 45.000"; vazio ou inválido → "—". */
export const brl = (n: unknown) =>
  n == null || n === "" || isNaN(Number(n)) ? "—" : "R$ " + Math.round(Number(n)).toLocaleString("pt-BR");

/** Dias entre hoje e o primeiro dia do festival (negativo = já começou); null sem data. */
export function diasParaOFestival(inicio?: string | null): number | null {
  if (!inicio) return null;
  const [a, m, d] = String(inicio).split("-").map(Number);
  if (!a || !m || !d) return null;
  const alvo = new Date(a, m - 1, d);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
}

/** O texto da contagem regressiva da barra lateral: número em destaque e o resto. */
export function textoContagem(inicio?: string | null): { numero: string; texto: string } | null {
  const dias = diasParaOFestival(inicio);
  if (dias == null) return null;
  if (dias > 1) return { numero: String(dias), texto: "dias para o festival" };
  if (dias === 1) return { numero: "1", texto: "dia para o festival" };
  if (dias === 0) return { numero: "Hoje", texto: "começa o festival" };
  return { numero: "", texto: "Festival em andamento ou realizado" };
}
