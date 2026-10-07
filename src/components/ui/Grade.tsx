/* Grade de cartões ou painéis: 1 coluna no celular, 2 ou 3 no desktop.
   `auto` enche a largura com cartões de 280px (listas em cartão). */
import type { ReactNode } from "react";
import { cx } from "../../utils/classes";

const COLUNAS = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  auto: "md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]",
  lateral: "md:grid-cols-[270px_1fr] md:items-start",
};

export function Grade({ colunas = 2, className, children }: { colunas?: keyof typeof COLUNAS; className?: string; children: ReactNode }) {
  return <div className={cx("grid grid-cols-1 gap-3.5", COLUNAS[colunas], className)}>{children}</div>;
}
