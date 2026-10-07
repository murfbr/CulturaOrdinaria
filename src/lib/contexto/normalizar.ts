/* Normalização das fichas e julgamentos do Contexto antes de gravar.
   O formato antigo (artefato v1 e os pacotes de enriquecimento) guardava
   vocabulário, "já foi dito" e lições como listas dentro de listas
   ([["usar", "evitar"], ...]). O Firestore recusa listas aninhadas: o documento
   nem sai do navegador. Aqui tudo vira lista de objetos nomeados, em qualquer
   caminho de gravação (Importar, migração, tela). */
import type { Ficha, Julgamento } from "../../types";

/** Converte uma tupla [a, b, c] em { nome1: a, nome2: b, ... }; objeto passa direto. */
export const tupla = <T,>(v: unknown, nomes: string[]): T =>
  Array.isArray(v) ? (Object.fromEntries(nomes.map((n, i) => [n, (v as unknown[])[i] ?? ""])) as T) : (v as T);

export function normalizarFicha<T extends Partial<Ficha>>(f: T): T {
  const copia = { ...f };
  if (Array.isArray(copia.vocabulario)) {
    copia.vocabulario = (copia.vocabulario as unknown[]).map((t) => tupla(t, ["usar", "evitar"]));
  }
  if (Array.isArray(copia.usados)) {
    copia.usados = (copia.usados as unknown[]).map((t) => tupla(t, ["texto", "onde", "quando"]));
  }
  return copia;
}

export function normalizarJulgamento<T extends Partial<Julgamento>>(j: T): T {
  const copia = { ...j };
  if (Array.isArray(copia.licoes)) {
    copia.licoes = (copia.licoes as unknown[]).map((t) => tupla(t, ["texto", "regra"]));
  }
  return copia;
}

/** Há alguma lista dentro de lista? (o Firestore recusa) */
export function temListaAninhada(v: unknown, dentroDeLista = false): boolean {
  if (Array.isArray(v)) return dentroDeLista || v.some((x) => temListaAninhada(x, true));
  if (v && typeof v === "object") return Object.values(v).some((x) => temListaAninhada(x, false));
  return false;
}
