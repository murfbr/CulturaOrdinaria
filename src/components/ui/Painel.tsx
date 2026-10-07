/* Painel: caixa de cartão com fio, cantos retos, sem sombra, e o título em
   mono caixa alta. As ações (botões) ficam à direita do título; `sub` é a
   explicação curta em itálico ao lado. `alerta` destaca em âmbar (avisos). */
import type { ReactNode } from "react";
import { cx } from "../../utils/classes";

interface Props {
  titulo?: ReactNode;
  sub?: ReactNode;
  acoes?: ReactNode;
  alerta?: boolean;
  className?: string;
  children: ReactNode;
}

export function Painel({ titulo, sub, acoes, alerta, className, children }: Props) {
  return (
    <div className={cx("mb-3.5 rounded-md border p-4", alerta ? "border-gold bg-warn-soft" : "border-line bg-card", className)}>
      {titulo != null && (
        <h4 className="m-0 mb-3 flex flex-wrap items-baseline gap-2 font-mono text-3xs font-medium uppercase text-muted">
          {titulo}
          {sub && <span className="font-sans text-sm font-normal normal-case italic tracking-normal text-faint">{sub}</span>}
          {acoes && <span className="ml-auto flex flex-wrap items-center gap-2 font-sans normal-case tracking-normal">{acoes}</span>}
        </h4>
      )}
      {children}
    </div>
  );
}
