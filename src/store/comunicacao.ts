/* Estado da Comunicação: as coleções da Biblioteca de referências, ligadas só
   quando o ambiente abre (fora do `pronto` da Central). Assim, enquanto as
   regras do banco não tiverem as coleções novas, só a Biblioteca avisa "sem
   acesso"; o resto da Central abre normalmente.

   `referencias`, `rodadasReferencias` e `analisesReferencias` são pequenas e vêm
   inteiras. As análises ficam fora do `pronto` e do "sem acesso" geral: se as
   regras ainda não tiverem a coleção, só a aba Análises avisa. As leituras
   (`leiturasReferencias`, um documento por perfil por rodada, com todos os
   posts) vêm uma a uma, pelo id, quando a tela mostra a rodada. */
import { useSyncExternalStore } from "react";
import { Banco } from "../services/banco";
import { podeGravar } from "../services/acesso";
import { toast } from "../components/Toast";
import type { AnaliseReferencias, LeituraPropria, LeituraReferencia, PerfilProprio, Referencia, RodadaReferencias } from "../types";

export interface EstadoComunicacao {
  /** As duas coleções pequenas confirmadas pelo servidor (ou modo local), ou já com dado de visita anterior. */
  pronto: boolean;
  /** O banco recusou a leitura (regras sem as coleções novas, ou conta sem módulo da Central). */
  semAcesso: boolean;
  referencias: Record<string, Referencia>;
  rodadas: Record<string, RodadaReferencias>;
  analises: Record<string, AnaliseReferencias>;
  /** O banco recusou só as análises (regras sem a linha de `analisesReferencias`). */
  analisesSemAcesso: boolean;
  perfisProprios: Record<string, PerfilProprio>;
  /** O banco já confirmou a coleção dos perfis próprios (antes disso, "não encontrado" seria cedo demais). */
  propriosProntos: boolean;
  /** Leituras por dentro já abertas, pelo id (vêm uma a uma, como as das referências). */
  leiturasProprias: Record<string, LeituraPropria>;
  /** O banco recusou os perfis próprios (regras sem as linhas de `perfisProprios` e `leiturasProprias`). */
  propriosSemAcesso: boolean;
  /** Leituras já abertas, pelo id. */
  leituras: Record<string, LeituraReferencia>;
  /** Ids de leitura pedidos que o banco confirmou não existir. */
  leiturasAusentes: string[];
}

let estado: EstadoComunicacao = { pronto: false, semAcesso: false, referencias: {}, rodadas: {}, analises: {}, analisesSemAcesso: false, perfisProprios: {}, propriosProntos: false, leiturasProprias: {}, propriosSemAcesso: false, leituras: {}, leiturasAusentes: [] };
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
  escutas.push(Banco.assinar("analisesReferencias", (mapa) => {
    estado.analises = mapa as unknown as Record<string, AnaliseReferencias>;
    publicar();
  }));
  escutas.push(Banco.assinar("perfisProprios", (mapa, confirmado) => {
    estado.perfisProprios = mapa as unknown as Record<string, PerfilProprio>;
    if (confirmado || Object.keys(mapa).length) estado.propriosProntos = true;
    publicar();
  }));
  // A escuta recusada pelo banco não chama de volta: o aviso chega pelo status do banco.
  escutas.push(Banco.aoMudarStatus((s) => {
    const recusado = /^sem acesso a (referencias|rodadasReferencias|leiturasReferencias)\b/.test(s.texto);
    if (recusado && !estado.semAcesso) { estado.semAcesso = true; publicar(); }
    if (/^sem acesso a analisesReferencias/.test(s.texto) && !estado.analisesSemAcesso) { estado.analisesSemAcesso = true; publicar(); }
    if (/^sem acesso a (perfisProprios|leiturasProprias)/.test(s.texto) && !estado.propriosSemAcesso) { estado.propriosSemAcesso = true; publicar(); }
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

/** Garante a escuta das leituras por dentro pedidas (a ficha de um perfil próprio). */
const escutasPropria: Record<string, () => void> = {};
export function abrirLeiturasProprias(ids: string[]) {
  for (const id of ids) {
    if (!id || escutasPropria[id]) continue;
    escutasPropria[id] = Banco.assinarDocumento("leiturasProprias", id, (documento) => {
      if (!documento) return;
      estado.leiturasProprias = { ...estado.leiturasProprias, [id]: documento as unknown as LeituraPropria };
      publicar();
    });
  }
}

/** Desliga tudo (logout). */
export function pararComunicacao() {
  Object.values(escutasLeitura).forEach((parar) => parar());
  for (const id of Object.keys(escutasLeitura)) delete escutasLeitura[id];
  Object.values(escutasPropria).forEach((parar) => parar());
  for (const id of Object.keys(escutasPropria)) delete escutasPropria[id];
  escutas.forEach((parar) => parar());
  escutas = [];
  confirmadas.clear();
  estado = { pronto: false, semAcesso: false, referencias: {}, rodadas: {}, analises: {}, analisesSemAcesso: false, perfisProprios: {}, propriosProntos: false, leiturasProprias: {}, propriosSemAcesso: false, leituras: {}, leiturasAusentes: [] };
  publicar();
}

/* ══════════ gravação (só pela tela Importar) ══════════
   A Biblioteca não tem edição na Central: o que entra vem do espelho do
   artefato, e mesmo id grava por cima. Por isso as gravações não passam por
   salvarRegistro (sem ordem de quadro nem lixeira); a guarda de acesso e o log
   de alterações do Banco valem igual. */

/** Grava rodada, referências, leituras e análises de uma vez (o arquivo pode trazer só análises).
    Devolve quantos documentos foram para o banco. */
export function gravarEspelhoBiblioteca(c: {
  rodada: RodadaReferencias | null; referencias: Referencia[]; leituras: LeituraReferencia[]; analises: AnaliseReferencias[];
  perfisProprios: PerfilProprio[]; leiturasProprias: LeituraPropria[];
}): number {
  if (!podeGravar("referencias", c.rodada?.id || c.analises[0]?.id || c.perfisProprios[0]?.id || "")) {
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
  if (c.rodada) gravar("rodadasReferencias", c.rodada);
  c.analises.forEach((a) => gravar("analisesReferencias", a));
  c.leiturasProprias.forEach((l) => gravar("leiturasProprias", l));
  c.perfisProprios.forEach((p) => gravar("perfisProprios", p));
  return n;
}
