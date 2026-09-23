/* Resolvedores de nomes entre coleções do Painel ("quais artistas estão neste
   projeto?", "qual o edital dele?") e rótulos derivados. */
import { porId } from "../store/mutacoes";
import { statusProjetoDe, type Edital, type Projeto, type Tarefa } from "../types";

/** Nomes dos artistas de um projeto, juntos ("Bloco Brasil, Simpatia"). */
export const nomesArtistas = (p?: Projeto): string =>
  (p?.artistaIds || []).map((id) => porId("artistas", id)?.nome).filter(Boolean).join(", ") || "—";

/** Nome de uma pessoa da equipe. */
export const nomeEquipe = (id?: string): string =>
  (id && porId("equipe", id)?.nome) || "—";

/** Edital de um projeto. */
export const editalDoProjeto = (p?: Projeto): Edital | undefined => (p?.editalId ? porId("editais", p.editalId) : undefined);

/** Nome curto de um edital (o do Mapa, ou o começo do nome). */
export const nomeCurto = (e?: Edital): string =>
  !e ? "" : e.curto || e.nome.split(/\s[—–(·]\s?|\s\(/)[0].trim();

export const nomeEditalDoProjeto = (p?: Projeto): string => {
  const e = editalDoProjeto(p);
  return e ? nomeCurto(e) : p?.formId === "livre" || !p ? "Livre" : "sem edital";
};

/** Prazo curto para cards: a data, quando há; senão o começo do texto. */
export function prazoCurto(e?: Edital): string {
  if (!e) return "";
  if (e.prazoIso) {
    const [a, m, d] = e.prazoIso.split("-");
    return `${d}/${m}/${a}`;
  }
  const t = (e.prazo || "").split(/[;(]|\. /)[0].trim();
  return t.length > 60 ? t.slice(0, 58).trimEnd() + "…" : t;
}

/** Rótulo do vínculo de uma tarefa ("Projeto · X", "Edital · Y", "Reunião · Z"). */
export function rotuloOrigem(origem?: string): string {
  if (!origem) return "—";
  const [tipo, id] = origem.split(":");
  if (tipo === "proj") return "Projeto · " + (porId("projetos", id)?.nome || "?");
  if (tipo === "edital") return "Edital · " + (nomeCurto(porId("editais", id)) || "?");
  if (tipo === "reuniao") {
    const r = porId("reunioes", id);
    return "Reunião · " + (r ? r.titulo || r.data : "?");
  }
  if (tipo === "cand") return "Candidatura antiga · " + id;
  return "?";
}

/** Badge de status de tarefa (classe + rótulo). */
export function badgeTarefa(t: Tarefa): { classe: string; rotulo: string } {
  if (t.status === "feito") return { classe: "pill-ok", rotulo: "Concluído" };
  if (t.status === "and") return { classe: "st-prev", rotulo: "Em andamento" };
  return { classe: "b-type", rotulo: "A fazer" };
}

/** Badge de status de projeto. */
export function badgeProjeto(p: Projeto): { classe: string; rotulo: string } {
  const s = statusProjetoDe(p.status);
  return { classe: "badge " + s.classe, rotulo: s.rotulo };
}
