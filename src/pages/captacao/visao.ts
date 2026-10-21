/* A visão "Ver como" da Captação: todos (o coletivo) ou uma captadora. Fica no
   navegador (localStorage), como um filtro; nada vai ao banco. Na etapa 2
   passa a vir da conta logada quando ela é captadora. */
import { useSyncExternalStore } from "react";

const CHAVE = "central-captacao-como";

function ler(): string {
  try { return localStorage.getItem(CHAVE) || ""; } catch { return ""; }
}

let como = ler();
const assinantes = new Set<() => void>();

/** Id da captadora escolhida, ou "" para todos. */
export const comoAtual = () => como;

export function definirComo(id: string) {
  como = id;
  try { if (id) localStorage.setItem(CHAVE, id); else localStorage.removeItem(CHAVE); } catch { /* sem armazenamento */ }
  assinantes.forEach((f) => f());
}

/* O funil do Resumo pede uma etapa e vai para Negociações; a tela lê o pedido ao montar. */
let etapaPedida = "";
export const pedirEtapa = (etapa: string) => { etapaPedida = etapa; };
export function consumirEtapaPedida(): string {
  const e = etapaPedida;
  etapaPedida = "";
  return e;
}

export function usarComo(): string {
  return useSyncExternalStore(
    (cb) => { assinantes.add(cb); return () => { assinantes.delete(cb); }; },
    comoAtual,
  );
}
