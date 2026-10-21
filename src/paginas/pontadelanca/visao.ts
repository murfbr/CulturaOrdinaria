/* Navegação interna da página: a festa ou uma edição aberta (com a aba), mais
   a âncora da seção da festa para rolar até ela. Fica em estado local, no
   localStorage e no endereço (#e02/financeiro), para dar para mandar o link
   de uma aba no WhatsApp; não passa pela navegação da Central. */

export type Aba = "resumo" | "decisoes" | "financeiro" | "operacao" | "tarefas" | "comunicacao" | "fechamento";

export type Visao = { sec: "festa" } | { sec: "edicao"; id: string; aba?: Aba };

export type IrPara = (visao: Visao, ancora?: string) => void;

const ABAS_VALIDAS: Aba[] = ["resumo", "decisoes", "financeiro", "operacao", "tarefas", "comunicacao", "fechamento"];

/** "#e02/financeiro" → visão; null quando o hash não é desta página (o da Central começa com "#/"). */
export function visaoDoHash(hash: string): Visao | null {
  const m = /^#(e\d+)(?:\/([a-z]+))?$/.exec(hash || "");
  if (!m) return null;
  const aba = ABAS_VALIDAS.includes(m[2] as Aba) ? (m[2] as Aba) : "resumo";
  return { sec: "edicao", id: m[1], aba };
}

/** Visão → hash ("" na festa). */
export const hashDaVisao = (v: Visao): string => (v.sec === "edicao" ? "#" + v.id + "/" + (v.aba || "resumo") : "");
