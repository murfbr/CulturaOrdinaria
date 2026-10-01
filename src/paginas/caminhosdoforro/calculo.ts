/* Funções puras da página: datas, dinheiro, contagem regressiva, e o que o
   cadastro, os núcleos e as tarefas precisam. As contas do funil, do orçamento
   e da grade entram com as telas delas. */
import { formatarData } from "../../utils";
import type { Base, Cadastro, Nucleo, TarefaFestival } from "./tipos";

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

/* ══════════ cadastro ══════════ */

/** Ordem alfabética pt-BR pelo nome. */
export const porNome = (a: { nome?: string }, b: { nome?: string }) =>
  String(a.nome || "").localeCompare(String(b.nome || ""), "pt");

export const temTipo = (d: Cadastro, tipo: string) => Array.isArray(d.tipos) && d.tipos.includes(tipo);

/** Cadastros de um tipo, em ordem de nome. */
export const cadastrosDoTipo = (base: Base, tipo: string): Cadastro[] =>
  Object.values(base.cadastro).filter((d) => temTipo(d, tipo)).sort(porNome);

/** Nome pelo id; id sem cadastro avisa; vazio mostra "—". */
export const nomeCadastro = (base: Base, id: string | null | undefined) =>
  id ? (base.cadastro[id]?.nome || "(removido do cadastro)") : "—";

/** Data do último contato registrado (ISO) ou "". */
export const ultimoContato = (d: Cadastro) =>
  (d.historico || []).reduce((m, h) => (h.data && h.data > m ? h.data : m), "");

/** "Última alteração em 30/09/2026 às 21:40 por fulano@…", ou o aviso da carga inicial. */
export function auditoria(d: { atualizado?: string; atualizadoPor?: string; revisar?: boolean } | null | undefined): string {
  if (!d) return "";
  if (d.atualizadoPor && d.atualizado) {
    const dt = new Date(d.atualizado);
    return "Última alteração em " + dt.toLocaleDateString("pt-BR") + " às "
      + dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) + " por " + d.atualizadoPor;
  }
  return d.revisar ? "Veio da carga inicial e ainda não foi revisado." : "";
}

/** Onde um cadastro é usado (o que impede excluí-lo). */
export function referenciasDoCadastro(base: Base, id: string): string[] {
  const r = new Set<string>();
  Object.values(base.patrocinios).forEach((p) => { if (p.empresa === id) r.add("patrocínios"); });
  Object.values(base.parceiros).forEach((p) => { if (p.parceiro === id) r.add("parceiros institucionais"); });
  Object.values(base.slots).forEach((s) => { if ((s.participantes || []).includes(id)) r.add("grade"); });
  Object.values(base.orcamento_itens).forEach((o) => { if (o.fornecedor === id) r.add("orçamento"); });
  base.pagina.nucleos.forEach((n) => { if (n.responsavel === id || (n.membros || []).includes(id)) r.add("núcleos"); });
  Object.values(base.tarefas).forEach((t) => { if (t.responsavel === id) r.add("tarefas"); });
  Object.values(base.cadastro).forEach((c) => (c.historico || []).forEach((h) => { if (h.por === id) r.add("histórico de contatos"); }));
  return [...r];
}

/* ══════════ núcleos e tarefas ══════════ */

export const nucleo = (base: Base, id: string | null | undefined): Nucleo | null =>
  base.pagina.nucleos.find((n) => n.id === id) || null;

/** Núcleos de que a pessoa é membro. */
export const nucleosDe = (base: Base, pessoaId: string): Nucleo[] =>
  base.pagina.nucleos.filter((n) => (n.membros || []).includes(pessoaId));

/** Responsável efetivo da tarefa: o dela, senão o do núcleo. */
export const respEfetivo = (base: Base, t: TarefaFestival): string | null =>
  t.responsavel || nucleo(base, t.nucleo)?.responsavel || null;

export const tarefaAberta = (t: TarefaFestival) => t.status !== "concluido";
export const tarefaAtrasada = (t: TarefaFestival) => !!t.prazo && t.status !== "concluido" && t.prazo < hojeIso();

/** O responsável da tarefa não é mais membro do núcleo dela. */
export const foraDoNucleo = (base: Base, t: TarefaFestival) =>
  !!t.responsavel && !(nucleo(base, t.nucleo)?.membros || []).includes(t.responsavel);

/** Contagem de tarefas do núcleo ("_sem" = sem núcleo). */
export function contasNucleo(base: Base, nucleoId: string) {
  const ts = Object.values(base.tarefas).filter((t) => (t.nucleo || "_sem") === nucleoId);
  return {
    total: ts.length,
    feitas: ts.filter((t) => !tarefaAberta(t)).length,
    abertas: ts.filter(tarefaAberta).length,
    atrasadas: ts.filter(tarefaAtrasada).length,
  };
}
