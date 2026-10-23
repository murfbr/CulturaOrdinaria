/* Estado da Comunicação: as coleções da Biblioteca de referências, ligadas só
   quando o ambiente abre (fora do `pronto` da Central). Assim, enquanto as
   regras do banco não tiverem as coleções novas, só a Biblioteca avisa "sem
   acesso"; o resto da Central abre normalmente.

   `referencias` e `rodadasReferencias` são pequenas e vêm inteiras. As leituras
   (`leiturasReferencias`, um documento por perfil por rodada, com todos os
   posts) vêm uma a uma, pelo id, quando a tela mostra a rodada. */
import { useSyncExternalStore } from "react";
import { Banco } from "../services/banco";
import { podeGravar } from "../services/acesso";
import { toast } from "../components/Toast";
import type { LeituraReferencia, Referencia, RodadaReferencias } from "../types";

export interface EstadoComunicacao {
  /** As duas coleções pequenas confirmadas pelo servidor (ou modo local), ou já com dado de visita anterior. */
  pronto: boolean;
  /** O banco recusou a leitura (regras sem as coleções novas, ou conta sem módulo da Central). */
  semAcesso: boolean;
  referencias: Record<string, Referencia>;
  rodadas: Record<string, RodadaReferencias>;
  /** Leituras já abertas, pelo id. */
  leituras: Record<string, LeituraReferencia>;
  /** Ids de leitura pedidos que o banco confirmou não existir. */
  leiturasAusentes: string[];
}

let estado: EstadoComunicacao = { pronto: false, semAcesso: false, referencias: {}, rodadas: {}, leituras: {}, leiturasAusentes: [] };
const assinantes = new Set<() => void>();
function publicar() {
  estado = { ...estado };
  assinantes.forEach((f) => f());
}

export const obterComunicacao = () => estado;

export function usarComunicacao(): EstadoComunicacao {
  return useSyncExternalStore(
    (cb) => { assinantes.add(cb); return () => assinantes.delete(cb); },
    obterComunicacao,
  );
}

let escutas: (() => void)[] = [];
const confirmadas = new Set<string>();
const escutasLeitura: Record<string, () => void> = {};

function conferirPronto() {
  const temDado = Object.keys(estado.referencias).length > 0 && Object.keys(estado.rodadas).length > 0;
  estado.pronto = estado.pronto || confirmadas.size >= 2 || temDado;
}

/** Liga as coleções da Biblioteca. Idempotente; a tela chama ao abrir. */
export function iniciarComunicacao() {
  if (escutas.length) return;
  escutas.push(Banco.assinar("referencias", (mapa, confirmado) => {
    estado.referencias = mapa as unknown as Record<string, Referencia>;
    if (confirmado) confirmadas.add("referencias");
    conferirPronto();
    publicar();
  }));
  escutas.push(Banco.assinar("rodadasReferencias", (mapa, confirmado) => {
    estado.rodadas = mapa as unknown as Record<string, RodadaReferencias>;
    if (confirmado) confirmadas.add("rodadasReferencias");
    conferirPronto();
    publicar();
  }));
  // A escuta recusada pelo banco não chama de volta: o aviso chega pelo status do banco.
  escutas.push(Banco.aoMudarStatus((s) => {
    const recusado = /^sem acesso a (referencias|rodadasReferencias|leiturasReferencias)/.test(s.texto);
    if (recusado && !estado.semAcesso) { estado.semAcesso = true; publicar(); }
  }));
}

/** Garante a escuta das leituras pedidas (as da rodada na tela). As outras continuam ligadas: são poucas. */
export function abrirLeituras(ids: string[]) {
  for (const id of ids) {
    if (!id || escutasLeitura[id]) continue;
    escutasLeitura[id] = Banco.assinarDocumento("leiturasReferencias", id, (documento, confirmado) => {
      if (documento) {
        estado.leituras = { ...estado.leituras, [id]: documento as unknown as LeituraReferencia };
        estado.leiturasAusentes = estado.leiturasAusentes.filter((x) => x !== id);
      } else if (confirmado && !estado.leiturasAusentes.includes(id)) {
        estado.leiturasAusentes = [...estado.leiturasAusentes, id];
      }
      publicar();
    });
  }
}

/** Desliga tudo (logout). */
export function pararComunicacao() {
  Object.values(escutasLeitura).forEach((parar) => parar());
  for (const id of Object.keys(escutasLeitura)) delete escutasLeitura[id];
  escutas.forEach((parar) => parar());
  escutas = [];
  confirmadas.clear();
  estado = { pronto: false, semAcesso: false, referencias: {}, rodadas: {}, leituras: {}, leiturasAusentes: [] };
  publicar();
}

/* ══════════ gravação (só pela tela Importar) ══════════
   A Biblioteca não tem edição na Central: o que entra vem do espelho do
   artefato, e mesmo id grava por cima. Por isso as gravações não passam por
   salvarRegistro (sem ordem de quadro nem lixeira); a guarda de acesso e o log
   de alterações do Banco valem igual. */

/** Grava rodada, referências e leituras de uma vez. Devolve quantos documentos foram para o banco. */
export function gravarEspelhoBiblioteca(c: { rodada: RodadaReferencias; referencias: Referencia[]; leituras: LeituraReferencia[] }): number {
  if (!podeGravar("referencias", c.rodada.id)) {
    toast("Sem acesso para gravar na Biblioteca: sua conta não tem o módulo Comunicação.");
    return 0;
  }
  let n = 0;
  const gravar = (colecao: string, documento: { id: string }) => {
    Banco.gravar(colecao, documento.id, documento as unknown as Record<string, unknown> & { id: string }, true);
    n++;
  };
  c.leituras.forEach((l) => gravar("leiturasReferencias", l));
  c.referencias.forEach((r) => gravar("referencias", r));
  gravar("rodadasReferencias", c.rodada);
  return n;
}
