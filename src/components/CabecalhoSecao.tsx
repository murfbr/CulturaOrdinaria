/* Cabeçalho de seção das telas do Painel: título, subtítulo e ações à direita. */
import type { ReactNode } from "react";

interface Props {
  titulo: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
}

export function CabecalhoSecao({ titulo, sub, children }: Props) {
  return (
    <div className="mb-3.5 mt-[22px] flex flex-wrap items-center gap-3">
      <h2 className="m-0 text-lg font-bold tracking-[-.2px]">{titulo}</h2>
      {sub && <span className="text-sm text-muted">{sub}</span>}
      <span className="ml-auto flex flex-wrap gap-2">{children}</span>
    </div>
  );
}
