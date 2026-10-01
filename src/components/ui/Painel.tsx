/* Painel: caixa branca com borda, sombra e título em caixa alta. As ações
   (botões) ficam à direita do título. */
import type { ReactNode } from "react";
import { cx } from "../../utils/classes";

interface Props {
  titulo?: ReactNode;
  acoes?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Painel({ titulo, acoes, className, children }: Props) {
  return (
    <div className={cx("mb-3.5 rounded-xl border border-line bg-card p-4 shadow-card", className)}>
      {titulo != null && (
        <h4 className="m-0 mb-3 flex items-center text-sm font-bold uppercase tracking-[.4px] text-muted">
          {titulo}
          {acoes && <span className="ml-auto flex gap-2">{acoes}</span>}
        </h4>
      )}
      {children}
    </div>
  );
}
