/* Contas da camada "por dentro" de um perfil próprio (Business Suite). As
   mesmas do Painel Ponta de Lança (aba Instagram), que esta tela substitui:
   - visualizações e alcance orgânicos = total menos a parte paga;
   - "quem publica" usa todos os posts (próprios e collabs); formato, editoria,
     dia, horário e os dez melhores usam só os próprios sem impulsionamento,
     pra não misturar alcance pago;
   - mediana ignora o que está vazio; num collab, visualizações são do post
     inteiro e o Business Suite não diz pra qual perfil foi cada seguidor.
   Puro: recebe a leitura, devolve linhas prontas pra tabela. */
import type { LeituraPropria, PostProprio } from "../../../types";
import { mediana } from "./calculo";

const med = (valores: (number | null)[]) => mediana(valores.filter((v): v is number => v != null));

export const organicas = (p: PostProprio) => (p.visualizacoes == null ? null : p.visualizacoes - (p.visualizacoesPagas ?? 0));
export const alcanceOrganico = (p: PostProprio) => (p.alcance == null ? null : p.alcance - (p.alcancePago ?? 0));
export const ehProprio = (p: PostProprio) => p.autor === "próprio";
/** Usuário do parceiro num collab ("collab: forrodepife" → "forrodepife"). */
export const parceiro = (p: PostProprio) => (ehProprio(p) ? "" : p.autor.replace(/^collab:\s*/, ""));
/** Próprios sem impulsionamento: a base de formato, editoria, dia, horário e dos melhores. */
export const baseOrganica = (l: LeituraPropria) => l.posts.filter((p) => ehProprio(p) && !p.impulsionado);

const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
export const diaDaSemana = (p: PostProprio) => {
  const [a, m, d] = p.publicadoEm.slice(0, 10).split("-").map(Number);
  return DIAS[new Date(a, m - 1, d).getDay()];
};
export const horaDe = (p: PostProprio) => Number(p.publicadoEm.slice(11, 13)) || 0;

export interface LinhaProprio {
  rotulo: string;
  posts: number;
  /** Mediana de visualizações orgânicas. */
  views: number | null;
  /** Mediana de seguidores ganhos. */
  seguidores: number | null;
  /** Mediana de compartilhamentos a cada mil contas alcançadas (orgânico). */
  compartPorMil: number | null;
}

function linha(rotulo: string, ps: PostProprio[]): LinhaProprio {
  const views = med(ps.map(organicas));
  return {
    rotulo, posts: ps.length,
    views: views == null ? null : Math.round(views),
    seguidores: med(ps.map((p) => p.seguidoresGanhos)),
    compartPorMil: (() => {
      const v = med(ps.map((p) => { const a = alcanceOrganico(p); return a ? (p.compartilhamentos ?? 0) / a * 1000 : null; }));
      return v == null ? null : Math.round(v);
    })(),
  };
}

/** Quem publica: próprio, cada parceiro com 5 posts ou mais em collab, e os outros collabs juntos. Todos os posts. */
export function porAutor(l: LeituraPropria): LinhaProprio[] {
  const contagem: Record<string, number> = {};
  for (const p of l.posts) if (!ehProprio(p)) contagem[parceiro(p)] = (contagem[parceiro(p)] || 0) + 1;
  const fortes = Object.keys(contagem).filter((u) => contagem[u] >= 5).sort((a, b) => contagem[b] - contagem[a]);
  const linhas = [linha("Próprio", l.posts.filter(ehProprio))];
  for (const u of fortes) linhas.push(linha("Collab com @" + u, l.posts.filter((p) => parceiro(p) === u)));
  const outros = l.posts.filter((p) => !ehProprio(p) && !fortes.includes(parceiro(p)));
  if (outros.length) linhas.push(linha(fortes.length ? "Collab com outros perfis" : "Collab", outros));
  return linhas;
}

export const porFormato = (l: LeituraPropria) =>
  ["Foto", "Carrossel", "Reel"].map((f) => linha(f, baseOrganica(l).filter((p) => p.formato === f))).filter((x) => x.posts);

export function porEditoria(l: LeituraPropria): LinhaProprio[] {
  const base = baseOrganica(l);
  const nomes = [...new Set(base.map((p) => p.editoria || "sem editoria"))];
  return nomes.map((e) => linha(e, base.filter((p) => (p.editoria || "sem editoria") === e)))
    .sort((a, b) => (b.views ?? -1) - (a.views ?? -1));
}

export const porDia = (l: LeituraPropria) =>
  ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"].map((d) => linha(d, baseOrganica(l).filter((p) => diaDaSemana(p) === d)));

const FAIXAS: [string, number, number][] = [["até 12h", 0, 12], ["12h às 15h", 12, 15], ["15h às 18h", 15, 18], ["18h às 20h", 18, 20], ["depois das 20h", 20, 24]];
export const porHorario = (l: LeituraPropria) =>
  FAIXAS.map(([nome, a, b]) => linha(nome, baseOrganica(l).filter((p) => horaDe(p) >= a && horaDe(p) < b)));

/** Os próprios sem impulsionamento com mais visualizações orgânicas. */
export const melhores = (l: LeituraPropria, n = 10) =>
  baseOrganica(l).filter((p) => organicas(p) != null).sort((a, b) => (organicas(b) as number) - (organicas(a) as number)).slice(0, n);

/** Próprios impulsionados, em ordem de data. */
export const impulsionados = (l: LeituraPropria) =>
  l.posts.filter((p) => ehProprio(p) && p.impulsionado).sort((a, b) => a.publicadoEm.localeCompare(b.publicadoEm));

/** Os números do alto da ficha. */
export function resumoProprio(l: LeituraPropria) {
  const proprios = l.posts.filter(ehProprio);
  const dias = Math.max(1, (Date.parse(l.fim) - Date.parse(l.inicio)) / 86400000 + 1);
  const autores = porAutor(l);
  const faixa = (de: string[]) => l.publico.idade.filter((f) => de.includes(f.rotulo)).reduce((s, f) => s + f.parcela, 0);
  return {
    seguidores: l.publico.seguidores,
    saldo: l.publico.novos != null && l.publico.perdidos != null ? l.publico.novos - l.publico.perdidos : null,
    propriosPorSemana: proprios.length / (dias / 7),
    pctCollab: l.posts.length ? (l.posts.length - proprios.length) / l.posts.length : null,
    pctReelsProprios: proprios.length ? proprios.filter((p) => p.formato === "Reel").length / proprios.length : null,
    viewsProprio: autores[0]?.views ?? null,
    /** O parceiro de collab que mais aparece, se houver, e a mediana dele. */
    maiorCollab: autores.find((a) => a.rotulo.startsWith("Collab com @")) || null,
    publico25a44: faixa(["25 a 34 anos", "35 a 44 anos"]) || null,
  };
}
