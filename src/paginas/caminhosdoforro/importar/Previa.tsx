/* Pedaços da prévia de uma importação: os números grandes, a lista que abre
   e fecha ("Ver as 34 tarefas") e as classes dos itens. Usados pelo Importar
   plano e pelo Importar cadastros. */
import type { ReactNode } from "react";

export const plural = (n: number, um: string, varios: string) => n + " " + (n === 1 ? um : varios);

export function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="cdf:rounded-[10px] cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie-2 cdf:px-3 cdf:py-2.5">
      <div className="cdf:font-display cdf:text-[30px] cdf:font-black cdf:leading-none cdf:text-primaria cdf:tabular-nums">{valor}</div>
      <div className="cdf:mt-1 cdf:text-[13px] cdf:text-tinta-2">{rotulo}</div>
    </div>
  );
}

/** Lista que abre e fecha ("Ver as 34 tarefas"). */
export function Detalhe({ resumo, children }: { resumo: string; children: ReactNode }) {
  return (
    <details className="cdf:mt-1.5 cdf:text-sm">
      <summary className="cdf:cursor-pointer cdf:font-bold cdf:text-link">{resumo}</summary>
      <ul className="cdf:m-0 cdf:mt-1.5 cdf:max-h-[180px] cdf:list-none cdf:overflow-y-auto cdf:rounded-lg cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie cdf:p-0">{children}</ul>
    </details>
  );
}

export const ITEM = "cdf:border-0 cdf:border-b cdf:border-solid cdf:border-linha cdf:px-2.5 cdf:py-1.5 cdf:last:border-b-0";
export const CODIGO = "cdf:mr-1.5 cdf:font-bold cdf:tabular-nums cdf:text-tinta-2";
export const DETALHE_ITEM = "cdf:block cdf:text-[13px] cdf:text-fraco";
export const ERRO = "cdf:m-0 cdf:rounded-lg cdf:bg-rec-bg cdf:px-3 cdf:py-2.5 cdf:font-bold cdf:text-rec";
