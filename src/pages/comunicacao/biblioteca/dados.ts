/* A rodada na tela: qual rodada, as leituras dela na ordem das colunas, as
   referências e a cor de cada uma. As telas da Biblioteca leem tudo daqui. */
import { useEffect, useMemo } from "react";
import { abrirLeituras, usarComunicacao } from "../../../store/comunicacao";
import type { LeituraReferencia, Referencia, RodadaReferencias } from "../../../types";
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
