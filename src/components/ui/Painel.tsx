/* Painel: caixa branca com borda, sombra e título em caixa alta. As ações
   (botões) ficam à direita do título. `alerta` destaca a borda em laranja
   claro (alertas de edital, aviso de duplicado). */
import type { ReactNode } from "react";
import { cx } from "../../utils/classes";

interface Props {
  titulo?: ReactNode;
  /** Texto pequeno ao lado do título (contagem, "só o artista responde"). */
  sub?: ReactNode;
  acoes?: ReactNode;
  alerta?: boolean;
  className?: string;
  children: ReactNode;
}

export function Painel({ titulo, sub, acoes, alerta, className, children }: Props) {
  return (
    <div className={cx("mb-3.5 rounded-xl border bg-card p-4 shadow-card", alerta ? "border-accent-soft bg-[#FFFBF9]" : "border-line", className)}>
      {titulo != null && (
        <h4 className="m-0 mb-3 flex flex-wrap items-center gap-2 text-sm font-bold uppercase tracking-[.4px] text-muted">
          {titulo}
          {sub && <span className="text-xs font-medium normal-case tracking-normal text-faint">{sub}</span>}
          {acoes && <span className="ml-auto flex flex-wrap items-center gap-2 normal-case tracking-normal">{acoes}</span>}
        </h4>
      )}
      {children}
    </div>
  );
}
