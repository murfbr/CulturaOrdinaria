/* Apoio às especificações da Captação: as opções das listas de escolha vêm do
   preset (editável em Opções) na hora de abrir o formulário, e os campos
   numéricos que o formulário deixa como "" (sem valor) viram null no registro,
   que é como as contas da Captação entendem "em branco". */
import { presetCaptacao } from "../../store/central";
import type { NomeListaCaptacao } from "../../types";

/** Pares [id, nome] de uma lista do preset, para campos `opts`. */
export const opcoesDaLista = (lista: NomeListaCaptacao) => (): [string, string][] =>
  presetCaptacao().listas[lista].map((i) => [i.id, i.nome] as [string, string]);

/** `depois` das specs: "" nos campos numéricos vira null. */
export const numerosOuNulo = (chaves: string[]) => (registro: Record<string, unknown>) => {
  for (const k of chaves) if (registro[k] === "" || registro[k] === undefined) registro[k] = null;
};
