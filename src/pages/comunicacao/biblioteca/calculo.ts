/* As contas da Biblioteca, puras: recebem as leituras de uma rodada e devolvem
   os números das tabelas e dos gráficos. São as mesmas fórmulas do artefato
   vivo (Benchmarking · perfis de referência), de onde a rodada vem:

   - janela: do post não fixado mais antigo ao mais recente da grade; a cadência
     conta só a grade (Reel que só aparece na aba Reels fica fora dela);
   - desempenho: curtidas do post ÷ mediana de curtidas do mesmo formato no
     mesmo perfil; formato com menos de 5 posts usa a mediana geral do perfil;
     post com menos de 3 dias ou sem curtidas visíveis fica sem desempenho;
   - curtidas por view: só Reels com views lidas na aba Reels.

   Se uma fórmula mudar lá, muda aqui também (e o contrário). */
import type { AmostraReferencia, FormatoPost, LeituraReferencia, PostReferencia, ResumoLeitura } from "../../../types";
import { FORMATOS_POST } from "../../../types";

const DIA = 864e5;

export function mediana(valores: number[]): number | null {
  const s = valores.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const fracao = <T,>(lista: T[], f: (x: T) => boolean) => (lista.length ? lista.filter(f).length / lista.length : 0);

export interface Janela {
  inicio: string;
  fim: string;
  dias: number;
  postsGrade: number;
  porSemana: number;
  pctReels: number;
  postsJanela: number;
  pctEvento: number;
  pctChamada: number;
  pctCollab: number;
  /** Reels que só aparecem na aba Reels. */
  foraGrade: number;
  foraGradeProprios: number;
}

/** Os posts da janela (do primeiro não fixado em diante). */
export function postsDaJanela(l: LeituraReferencia): PostReferencia[] {
  const inicio = l.posts.filter((p) => !p.fixado).map((p) => p.data).sort()[0] || "";
  return l.posts.filter((p) => p.data >= inicio);
}

export function janela(l: LeituraReferencia): Janela {
  const win = postsDaJanela(l);
  const inicio = win.filter((p) => !p.fixado).map((p) => p.data).sort()[0] || "";
  const grade = win.filter((p) => p.naGrade);
  const fim = grade.map((p) => p.data).sort().slice(-1)[0] || inicio;
  const dias = inicio && fim ? (Date.parse(fim) - Date.parse(inicio)) / DIA + 1 : 0;
  return {
    inicio, fim, dias,
    postsGrade: grade.length,
    porSemana: dias ? (grade.length / dias) * 7 : 0,
    pctReels: fracao(grade, (p) => p.formato === "Reels"),
    postsJanela: win.length,
    pctEvento: fracao(win, (p) => p.evento !== ""),
    pctChamada: fracao(win, (p) => p.chamada),
    pctCollab: fracao(win, (p) => p.collab),
    foraGrade: win.filter((p) => !p.naGrade).length,
    foraGradeProprios: win.filter((p) => !p.naGrade && !p.collab).length,
  };
}

export interface LinhaFormato { formato: FormatoPost; posts: number; curtidasMed: number | null; referencia: number | null }

/** Curtidas típicas por formato, e a referência que o desempenho usa. */
export function formatos(l: LeituraReferencia): LinhaFormato[] {
  const ok = postsDaJanela(l).filter((p) => p.maduro && p.curtidas != null);
  const geral = mediana(ok.map((p) => p.curtidas as number));
  return FORMATOS_POST.map((formato) => {
    const v = ok.filter((p) => p.formato === formato).map((p) => p.curtidas as number);
    const m = mediana(v);
    return { formato, posts: v.length, curtidasMed: m, referencia: v.length >= 5 ? m : geral };
  });
}

/** Desempenho de cada post (pelo código n); null fora da janela, imaturo ou sem curtidas. */
export function desempenhos(l: LeituraReferencia): Record<string, number | null> {
  const win = new Set(postsDaJanela(l).map((p) => p.n));
  const ref: Partial<Record<FormatoPost, number | null>> = {};
  formatos(l).forEach((f) => { ref[f.formato] = f.referencia; });
  const saida: Record<string, number | null> = {};
  for (const p of l.posts) {
    const r = ref[p.formato];
    saida[p.n] = win.has(p.n) && p.maduro && p.curtidas != null && r ? p.curtidas / r : null;
  }
  return saida;
}

export interface LinhaEditoria {
  editoria: string;
  posts: number;
  curtidasMed: number | null;
  comentariosMed: number | null;
  desempenhoMed: number | null;
  /** Comentários a cada 100 curtidas (mediana). */
  coment100: number | null;
}

export function editorias(l: LeituraReferencia): LinhaEditoria[] {
  const d = desempenhos(l);
  const ok = l.posts.filter((p) => d[p.n] != null);
  const nomes = [...new Set(ok.map((p) => p.editoria))];
  return nomes.map((editoria) => {
    const g = ok.filter((p) => p.editoria === editoria);
    return {
      editoria, posts: g.length,
      curtidasMed: mediana(g.map((p) => p.curtidas as number)),
      comentariosMed: mediana(g.map((p) => p.comentarios || 0)),
      desempenhoMed: mediana(g.map((p) => d[p.n] as number)),
      coment100: mediana(g.map((p) => ((p.comentarios || 0) / (p.curtidas as number)) * 100)),
    };
  });
}

export interface LinhaChamada { chamada: boolean; posts: number; desempenhoMed: number | null }

/** Desempenho mediano com e sem chamada de evento. */
export function chamadas(l: LeituraReferencia): LinhaChamada[] {
  const d = desempenhos(l);
  return [true, false].map((chamada) => {
    const g = l.posts.filter((p) => p.chamada === chamada && d[p.n] != null);
    return { chamada, posts: g.length, desempenhoMed: mediana(g.map((p) => d[p.n] as number)) };
  });
}

export interface PontoReel { post: PostReferencia; views: number; curtidas: number; taxa: number; abaixo: boolean }

/** Limite abaixo do qual o Reel provavelmente teve mídia paga (curtidas por view). */
export const LIMITE_TAXA = 0.005;

export function reels(l: LeituraReferencia): PontoReel[] {
  return postsDaJanela(l)
    .filter((p) => p.formato === "Reels" && p.views != null && p.views > 0 && p.curtidas != null)
    .map((p) => {
      const taxa = (p.curtidas as number) / (p.views as number);
      return { post: p, views: p.views as number, curtidas: p.curtidas as number, taxa, abaixo: taxa < LIMITE_TAXA };
    });
}

export interface ResumoReels { reels: number; viewsMed: number | null; taxaMed: number | null; abaixo: number; abaixoProprios: number }

export function resumoReels(l: LeituraReferencia): ResumoReels {
  const g = reels(l);
  return {
    reels: g.length,
    viewsMed: mediana(g.map((r) => r.views)),
    taxaMed: mediana(g.map((r) => r.taxa)),
    abaixo: g.filter((r) => r.abaixo).length,
    abaixoProprios: g.filter((r) => r.abaixo && !r.post.collab).length,
  };
}

export interface Ciclo { evento: string; dataEvento: string; posts: number; dMin: number; dMax: number; antes: number }

/** Posts por evento; a data do evento é a data do post menos o dia relativo. */
export function ciclos(l: LeituraReferencia): Ciclo[] {
  const g: Record<string, Ciclo> = {};
  for (const p of postsDaJanela(l)) {
    if (!p.evento || p.dia == null) continue;
    const dataEvento = new Date(Date.parse(p.data) - p.dia * DIA).toISOString().slice(0, 10);
    const c = (g[p.evento] = g[p.evento] || { evento: p.evento, dataEvento, posts: 0, dMin: p.dia, dMax: p.dia, antes: 0 });
    c.posts += 1;
    c.dMin = Math.min(c.dMin, p.dia);
    c.dMax = Math.max(c.dMax, p.dia);
  }
  return Object.values(g).map((c) => ({ ...c, antes: -c.dMin })).sort((a, b) => a.dataEvento.localeCompare(b.dataEvento));
}

export interface ResumoAmostra { total: number; comTexto: number; comPublico: number; naoVistos: number }

export function resumoAmostra(amostra: AmostraReferencia[]): ResumoAmostra {
  return {
    total: amostra.length,
    comTexto: amostra.filter((a) => a.textoNaTela.toLowerCase().startsWith("sim")).length,
    comPublico: amostra.filter((a) => /público|multidão/i.test(a.quemAparece)).length,
    naoVistos: amostra.filter((a) => a.textoNaTela === "não visto").length,
  };
}

/** O resumo que a referência guarda (`ultimaLeitura`) e a linha do histórico. */
export function resumoDaLeitura(l: LeituraReferencia): ResumoLeitura {
  const j = janela(l);
  const r = resumoReels(l);
  return {
    leituraId: l.id, rodadaId: l.rodadaId, data: l.data, inicio: j.inicio, fim: j.fim,
    seguidores: l.perfil.seguidores, postsGrade: j.postsGrade, postsSemana: j.porSemana, pctReels: j.pctReels,
    pctEvento: j.pctEvento, pctChamada: j.pctChamada, pctCollab: j.pctCollab, viewsReel: r.viewsMed, curtidasPorView: r.taxaMed,
  };
}

export type FormatoNumero = "int" | "compact" | "dec1" | "pct" | "pct2" | "x";

export interface LinhaComparativo { metrica: string; formato: FormatoNumero; valores: (number | null)[] }

/** "Lado a lado": as principais medidas, uma por linha, na ordem das leituras. */
export function comparativo(leituras: LeituraReferencia[]): LinhaComparativo[] {
  const js = leituras.map(janela);
  const rs = leituras.map(resumoReels);
  const linha = (metrica: string, formato: FormatoNumero, f: (i: number) => number | null): LinhaComparativo =>
    ({ metrica, formato, valores: leituras.map((_, i) => f(i)) });
  return [
    linha("Seguidores", "compact", (i) => leituras[i].perfil.seguidores),
    linha("Perfis que segue", "int", (i) => leituras[i].perfil.seguindo),
    linha("Dias da janela", "int", (i) => js[i].dias),
    linha("Posts por semana (grade)", "dec1", (i) => js[i].porSemana),
    linha("Reels na grade", "pct", (i) => js[i].pctReels),
    linha("Posts ligados a evento", "pct", (i) => js[i].pctEvento),
    linha("Posts com chamada de evento", "pct", (i) => js[i].pctChamada),
    linha("Posts em collab de outro perfil", "pct", (i) => js[i].pctCollab),
    linha("Reels fora da grade", "int", (i) => js[i].foraGrade),
    linha("Views por Reel (mediana)", "compact", (i) => rs[i].viewsMed),
    linha("Curtidas por view (mediana)", "pct2", (i) => rs[i].taxaMed),
    linha("Reels próprios abaixo de 0,5%", "int", (i) => rs[i].abaixoProprios),
    linha("Destaques", "int", (i) => leituras[i].perfil.destaques),
  ];
}

/* ══════════ formatos de número e de dia ══════════ */

const nf = new Intl.NumberFormat("pt-BR");
const nf1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nfCompacto = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const nfPct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });
const nfPct1 = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nfPct2 = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Os mesmos formatos do artefato, para o número da tela bater com o do texto da síntese. */
export function formatar(v: number | null | undefined, formato: FormatoNumero): string {
  if (v == null || !Number.isFinite(v)) return "—";
  switch (formato) {
    case "int": return nf.format(Math.round(v));
    case "compact": return v >= 1000 ? nfCompacto.format(v) : nf.format(v);
    case "dec1": return nf1.format(v);
    case "pct": return nfPct.format(v);
    case "pct2": return (v < 0.01 ? nfPct2 : nfPct1).format(v);
    case "x": return nf1.format(v) + "×";
  }
}

/** Dia relativo ao evento: 0 → "Dia", -5 → "D-5", 1 → "D+1". */
export const rotuloDia = (d: number | null | undefined) => (d == null ? "" : d === 0 ? "Dia" : d > 0 ? "D+" + d : "D" + d);

/** "2026-10-19" → "19/10". */
export const diaMes = (iso: string) => (iso ? iso.slice(8, 10) + "/" + iso.slice(5, 7) : "");
