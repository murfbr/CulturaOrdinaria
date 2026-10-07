/* Rótulo pequeno em mono e caixa alta (o "eyebrow"): nomeia um grupo, uma
   coluna, um bloco. Sem margem própria. */
import type { HTMLAttributes } from "react";
import { cx } from "../../utils/classes";

export function Rotulo({ className, ...resto }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("block font-mono text-3xs font-medium uppercase text-faint", className)} {...resto} />;
}
