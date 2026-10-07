/* Chip: palavra-chave, tag ou item curto numa lista em linha. Pílula com fio. */
import type { HTMLAttributes } from "react";
import { cx } from "../../utils/classes";

export function Chip({ className, ...resto }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cx("mr-1 mt-0.5 inline-flex items-center rounded-pill border border-line bg-card px-2 py-px text-sm text-muted", className)}
      {...resto}
    />
  );
}
