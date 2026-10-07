/* Cabeçalho de tela: título, subtítulo e ações à direita. `grande` é o
   título das telas de Projetos e Contexto (maior, com o subtítulo embaixo). */
import type { ReactNode } from "react";
import { cx } from "../utils/classes";

interface Props {
  titulo: ReactNode;
  sub?: ReactNode;
  grande?: boolean;
  children?: ReactNode;
}

export function CabecalhoSecao({ titulo, sub, grande, children }: Props) {
  if (grande) {
    return (
      <div className="mb-[18px] mt-[18px] flex flex-wrap items-end gap-4">
        <div className="min-w-0">
          <h2 className="m-0 text-2xl font-semibold tracking-[-.2px]">{titulo}</h2>
          {sub && <p className="m-0 mt-0.5 max-w-[60ch] text-sm text-muted">{sub}</p>}
        </div>
        {children && <span className="ml-auto flex flex-wrap gap-2">{children}</span>}
      </div>
    );
  }
  return (
    <div className={cx("mb-3.5 mt-[22px] flex flex-wrap items-center gap-3")}>
      <h2 className="m-0 text-lg font-bold tracking-[-.2px]">{titulo}</h2>
      {sub && <span className="text-sm text-muted">{sub}</span>}
      <span className="ml-auto flex flex-wrap gap-2">{children}</span>
    </div>
  );
}
