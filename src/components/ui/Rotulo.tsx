/* Rótulo pequeno em caixa alta (o "eyebrow"): nomeia um grupo, uma coluna,
   um bloco. Sem margem própria. */
import type { HTMLAttributes } from "react";
import { cx } from "../../utils/classes";

export function Rotulo({ className, ...resto }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("block text-2xs font-bold uppercase tracking-[.08em] text-faint", className)} {...resto} />;
}
