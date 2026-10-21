/* Apoio das telas da Captação: nomes pelos ids, as listas do preset, o tom de
   cada etapa e as datas curtas. Lê o estado da Central (as telas re-renderizam
   por usarCentral, então chamar isto no render é seguro). */
import { obterEstado, presetCaptacao } from "../../store/central";
import { porId } from "../../store/mutacoes";
import type { NomeListaCaptacao } from "../../types";
import { formatarData } from "../../utils";

export const EQUIPE = "Equipe do coletivo";

export const itensDaLista = (lista: NomeListaCaptacao) => presetCaptacao().listas[lista];

export const nomeItem = (lista: NomeListaCaptacao, id: string) =>
  itensDaLista(lista).find((i) => i.id === id)?.nome || (id ? id : "—");

export const nomeEmpresa = (id: string) => porId("empresas", id)?.nome || "(empresa apagada)";
export const nomeProjeto = (id: string) => (id ? porId("portfolio", id)?.nome || "(projeto apagado)" : "—");
export const nomeCota = (id: string) => (id ? porId("cotas", id)?.nome || "" : "");
export const nomeCaptadora = (id: string) => (id ? porId("captadoras", id)?.nome || "(captadora apagada)" : EQUIPE);

/** Tom do selo de cada etapa que o código conhece; etapa nova fica neutra. */
const TOM_ETAPA: Record<string, string> = {
  prospeccao: "neutro", contato_feito: "info", proposta_enviada: "aviso", negociacao: "aviso", confirmado: "ok", perdido: "erro",
};
export const tomEtapa = (id: string) => TOM_ETAPA[id] || "neutro";

/** Posição da etapa na lista (para ordenar do fim do funil para o começo). */
export const indiceEtapa = (id: string) => itensDaLista("etapas").findIndex((e) => e.id === id);

export const dataBr = (iso?: string) => (iso ? formatarData(iso) : "");
export const dataCurta = (iso?: string) => (iso ? iso.slice(8, 10) + "/" + iso.slice(5, 7) : "");

/** Nome de quem registrou (pela equipe, quando o e-mail bate), senão o e-mail. */
export function quemFala(email: string): string {
  const e = (email || "").toLowerCase();
  const p = obterEstado().painel.equipe.find((x) => (x.email || "").toLowerCase() === e);
  return p?.nome || email || "—";
}
