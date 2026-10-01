/* Tabela da Central: caixa com borda e rolagem horizontal no celular; Th e Td
   com o visual padrão. A página monta thead/tbody/tr como quiser. */
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cx } from "../../utils/classes";

export const ESTILO_TH = "bg-sand px-3 py-2.5 text-left text-2xs font-bold uppercase tracking-[.4px] whitespace-nowrap";
export const ESTILO_TD = "border-t border-line px-3 py-[11px] align-top";

export function Tabela({ className, children, ...resto }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("overflow-x-auto rounded-xl border border-line bg-card shadow-card", className)} {...resto}>
      <table className="w-full border-collapse text-sm [&_tbody_tr:hover]:bg-bg/60">{children}</table>
    </div>
  );
}

export function Th({ className, ...resto }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cx(ESTILO_TH, "text-muted", className)} {...resto} />;
}

export function Td({ className, ...resto }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cx(ESTILO_TD, className)} {...resto} />;
}
