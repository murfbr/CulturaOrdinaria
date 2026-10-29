/* O que as telas da Biblioteca leem. Dois recortes:
   - por RODADA (usarRodada): as leituras de uma coleta, lado a lado. É o que a
     visão geral, todos os posts, a amostra e o método mostram.
   - por REFERÊNCIA (usarReferencia): todas as leituras que um perfil já teve,
     em qualquer rodada, da mais nova pra mais antiga. É o que a ficha mostra:
     a referência é a unidade da Biblioteca, a rodada é só a coleta.
   A cor de uma referência é a posição dela na rodada; na ficha, fora de uma
   rodada, vale a posição no catálogo ordenado por nome. */
import { useEffect, useMemo } from "react";
import { abrirLeituras, usarComunicacao } from "../../../store/comunicacao";
import type { LeituraReferencia, Referencia, ResumoLeitura, RodadaReferencias } from "../../../types";
import { comparar } from "../../../utils";
import { corDa } from "./cores";
import { desempenhos } from "./calculo";

export interface VistaRodada {
  rodada: RodadaReferencias;
  /** Leituras já carregadas, na ordem da rodada. */
  leituras: LeituraReferencia[];
  /** Ainda não chegaram do banco. */
  carregando: boolean;
  /** Pedidas e confirmadas como inexistentes (importação incompleta). */
  ausentes: string[];
  referencias: Record<string, Referencia>;
  /** Cor pela referência (posição na rodada). */
  cor: (refId: string) => string;
  /** Desempenho de cada post, pelo código, de todas as leituras. */
  desempenho: Record<string, number | null>;
}

/** Rodadas da mais recente para a mais antiga. */
export function rodadasEmOrdem(rodadas: Record<string, RodadaReferencias>): RodadaReferencias[] {
  return Object.values(rodadas).sort((a, b) => b.data.localeCompare(a.data));
}

/** Nível de uma leitura: "grade v5" ou "rápida", pela rodada que a gerou (a rodada mista
    guarda os dois; aí vale o nível da referência no catálogo). */
export function nivelDaLeitura(h: ResumoLeitura, rodadas: Record<string, RodadaReferencias>, ref?: Referencia): "grade v5" | "rápida" {
  const g = rodadas[h.rodadaId]?.grade || "";
  if (/^v5$/i.test(g) || /^grade v5$/i.test(g)) return "grade v5";
  if (/^r[áa]pida$/i.test(g)) return "rápida";
  // Mista ou desconhecida: a referência diz o melhor nível que já teve.
  return ref?.nivelLeitura === "grade v5" ? "grade v5" : "rápida";
}

/** A rodada escolhida (ou a mais recente), com as leituras pedidas ao banco. */
export function usarRodada(rodadaId: string): VistaRodada | null {
  const com = usarComunicacao();
  const rodada = com.rodadas[rodadaId] || rodadasEmOrdem(com.rodadas)[0];
  const ids = rodada?.leituraIds || [];
  useEffect(() => { abrirLeituras(ids); }, [ids.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  const leituras = useMemo(
    () => ids.map((id) => com.leituras[id]).filter(Boolean),
    [ids.join("|"), com.leituras], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const desempenho = useMemo(() => Object.assign({}, ...leituras.map(desempenhos)) as Record<string, number | null>, [leituras]);
  if (!rodada) return null;
  const ausentes = ids.filter((id) => com.leiturasAusentes.includes(id));
  const ordem = rodada.refIds || [];
  return {
    rodada, leituras, ausentes, desempenho,
    carregando: leituras.length + ausentes.length < ids.length,
    referencias: com.referencias,
    cor: (refId: string) => corDa(ordem.indexOf(refId)),
  };
}

/** Uma linha do histórico de uma referência, com a leitura carregada (ou não). */
export interface LeituraDaReferencia {
  resumo: ResumoLeitura;
  nivel: "grade v5" | "rápida";
  rodada?: RodadaReferencias;
  /** O documento, quando já chegou do banco. */
  leitura?: LeituraReferencia;
  ausente: boolean;
}

export interface VistaReferencia {
  ref: Referencia;
  cor: string;
  /** Da mais nova pra mais antiga. */
  leituras: LeituraDaReferencia[];
  /** A v5 mais recente (a leitura completa que a ficha abre por padrão), se houver. */
  v5: LeituraDaReferencia | undefined;
  /** A mais nova de qualquer nível (os números atuais). */
  atual: LeituraDaReferencia | undefined;
  carregando: boolean;
}

/** Referências em ordem de nome (a ordem das cores fora de uma rodada). */
export function referenciasEmOrdem(refs: Record<string, Referencia>): Referencia[] {
  return Object.values(refs).sort((a, b) => comparar(a.nome, b.nome));
}

/** Todas as leituras de uma referência, em qualquer rodada, pedidas ao banco. */
export function usarReferencia(refId: string): VistaReferencia | null {
  const com = usarComunicacao();
  const ref = com.referencias[refId];
  const historico = useMemo(() => {
    // O histórico gravado na referência mais qualquer rodada que a liste e o histórico não saiba (importação antiga).
    const linhas = [...(ref?.historico || [])];
    for (const r of Object.values(com.rodadas)) {
      const i = (r.refIds || []).indexOf(refId);
      if (i < 0 || linhas.some((h) => h.rodadaId === r.id)) continue;
      const leituraId = (r.leituraIds || [])[i];
      if (leituraId) linhas.push({ leituraId, rodadaId: r.id, data: r.data } as ResumoLeitura);
    }
    return linhas.sort((a, b) => b.data.localeCompare(a.data));
  }, [ref, com.rodadas, refId]);
  const ids = historico.map((h) => h.leituraId);
  useEffect(() => { abrirLeituras(ids); }, [ids.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!ref) return null;
  const leituras: LeituraDaReferencia[] = historico.map((h) => ({
    resumo: h, rodada: com.rodadas[h.rodadaId], leitura: com.leituras[h.leituraId],
    nivel: nivelDaLeitura(h, com.rodadas, ref), ausente: com.leiturasAusentes.includes(h.leituraId),
  }));
  const ordem = referenciasEmOrdem(com.referencias).map((r) => r.id);
  return {
    ref, leituras,
    cor: corDa(ordem.indexOf(refId) % 8),
    v5: leituras.find((l) => l.nivel === "grade v5"),
    atual: leituras[0],
    carregando: leituras.some((l) => !l.leitura && !l.ausente),
  };
}

/** Grupo de uma referência (festivais, bandas, eventos). O campo `grupo` quando o gerador gravou;
    senão, pelas marcações (as rodadas de outubro gravaram só marcações). */
export function grupoDa(ref: Referencia): string {
  if (ref.grupo) return ref.grupo;
  const m = (ref.marcacoes || []).map((x) => x.toLowerCase());
  if (m.includes("festival")) return "festivais";
  if (m.includes("evento")) return "eventos";
  if (m.includes("banda") || m.includes("roda própria") || m.includes("vende show")) return "bandas";
  return "";
}

/** Planos em que a referência entra: o campo `planos`; senão, as marcações que são nome de plano. */
export function planosDa(ref: Referencia): string[] {
  if (ref.planos?.length) return ref.planos;
  const planos = new Set<string>();
  for (const m of ref.marcacoes || []) if (/^(Caminhos do Forró|Samba de Ponta|Ponta de Lança)$/.test(m)) planos.add(m);
  // As quatro de 22/10 (samba) são do Samba de Ponta; o Forró de Pife também é do Ponta de Lança.
  if (!planos.size && (ref.marcacoes || []).some((m) => /samba|pagode/i.test(m))) planos.add("Samba de Ponta");
  if (ref.instagram === "forrodepife") { planos.add("Ponta de Lança"); planos.add("Caminhos do Forró"); }
  return [...planos];
}
