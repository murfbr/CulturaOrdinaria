/* Pílulas de escolha: uma fileira de botões arredondados em que um fica
   marcado (vista de uma lista, filtro rápido, cenário). */
import type { ReactNode } from "react";
import { cx } from "../../utils/classes";

export interface OpcaoPilula { id: string; rotulo: ReactNode }

export function Pilulas({ opcoes, ativa, aoEscolher, className, children }: {
  opcoes: OpcaoPilula[]; ativa: string; aoEscolher: (id: string) => void; className?: string;
  /** O que vai depois das pílulas na mesma linha (um botão de ação). */
  children?: ReactNode;
}) {
  return (
    <div className={cx("mb-3.5 flex flex-wrap items-center gap-1.5", className)}>
      {opcoes.map((o) => (
        <button
          key={o.id} type="button"
          className={cx(
            "cursor-pointer rounded-full border border-solid px-3 py-1.5 text-sm font-semibold",
            o.id === ativa ? "border-accent bg-accent text-white" : "border-line bg-white text-muted hover:border-accent hover:text-ink",
          )}
          onClick={() => aoEscolher(o.id)}
        >
          {o.rotulo}
        </button>
      ))}
      {children}
    </div>
  );
}
