/* Escolha segmentada: uma fileira de botões colados, com fio forte, em que um
   fica marcado em vermelho (vista de uma lista, filtro rápido, cenário). */
import type { ReactNode } from "react";
import { cx } from "../../utils/classes";

export interface OpcaoPilula { id: string; rotulo: ReactNode }

export function Pilulas({ opcoes, ativa, aoEscolher, className, children }: {
  opcoes: OpcaoPilula[]; ativa: string; aoEscolher: (id: string) => void; className?: string;
  /** O que vai depois das pílulas na mesma linha (um botão de ação). */
  children?: ReactNode;
}) {
  return (
    <div className={cx("mb-3.5 flex flex-wrap items-center gap-3", className)}>
      <div className="inline-flex max-w-full overflow-x-auto rounded-md border border-line-strong bg-card">
        {opcoes.map((o) => (
          <button
            key={o.id} type="button"
            className={cx(
              "cursor-pointer whitespace-nowrap border-0 border-l border-solid border-line-strong px-3.5 py-1.5 text-lg font-medium first:border-l-0",
              o.id === ativa ? "bg-accent text-on-fill" : "bg-transparent text-muted hover:text-ink",
            )}
            onClick={() => aoEscolher(o.id)}
          >
            {o.rotulo}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
