/* Cabeçalho de seção: título em letra de cartaz, subtítulo ao lado e ações à
   direita. `grande` fica aceito por quem já passa, sem efeito: desde a
   identidade de 07/10 todo título de seção tem o mesmo tamanho. */
import type { ReactNode } from "react";

interface Props {
  titulo: ReactNode;
  sub?: ReactNode;
  grande?: boolean;
  children?: ReactNode;
}

export function CabecalhoSecao({ titulo, sub, children }: Props) {
  return (
    <div className="mb-4 mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h2 className="m-0 font-display text-4xl font-normal">{titulo}</h2>
      {sub && <span className="max-w-texto text-lg text-muted">{sub}</span>}
      {children && <span className="ml-auto flex flex-wrap items-center gap-2 self-center">{children}</span>}
    </div>
  );
}
