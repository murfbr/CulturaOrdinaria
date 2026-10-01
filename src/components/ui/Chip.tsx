/* Chip: palavra-chave, tag ou item curto numa lista em linha. */
import type { HTMLAttributes } from "react";
import { cx } from "../../utils/classes";

export function Chip({ className, ...resto }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cx("mr-[3px] mt-0.5 inline-block rounded-md bg-sand px-2 py-0.5 text-2xs font-semibold text-muted", className)}
      {...resto}
    />
  );
}
