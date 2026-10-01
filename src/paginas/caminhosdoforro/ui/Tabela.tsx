/* Tabela da página: caixa com borda e rolagem horizontal no celular; Th e Td
   com o visual do artefato. A tela monta thead/tbody/tr como quiser. NUM é a
   classe das colunas de número (à direita, algarismos tabulares). */
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cx } from "../../../utils/classes";

export const NUM = "cdf:text-right cdf:tabular-nums cdf:whitespace-nowrap";

export function Tabela({ className, children, ...resto }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("cdf:overflow-x-auto cdf:rounded-xl cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie", className)} {...resto}>
      {/* border-0 e bg-transparent: o CSS antigo da Central dá borda e fundo a todo <table>. */}
      <table className="cdf:w-full cdf:border-0 cdf:border-collapse cdf:bg-transparent cdf:text-base cdf:[&_tbody_tr:last-child_td]:border-b-0">{children}</table>
    </div>
  );
}

export function Th({ className, ...resto }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cx("cdf:border-b-2 cdf:border-solid cdf:border-linha cdf:bg-superficie-2 cdf:px-3.5 cdf:py-3 cdf:text-left cdf:text-[13px] cdf:font-bold cdf:normal-case cdf:tracking-normal cdf:whitespace-nowrap cdf:text-tinta-2", className)}
      {...resto}
    />
  );
}

export function Td({ className, ...resto }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cx("cdf:border-b cdf:border-solid cdf:border-linha cdf:px-3.5 cdf:py-[11px] cdf:align-top", className)} {...resto} />;
}
