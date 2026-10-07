/* Números de resumo: uma fileira de cartões pequenos com o número grande e o
   rótulo embaixo. */
import type { ReactNode } from "react";
import { cx } from "../../utils/classes";

export function GradeKpis({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("mb-3.5 flex flex-wrap gap-2.5", className)}>{children}</div>;
}

export function Kpi({ n, rotulo, aoClicar, title }: { n: ReactNode; rotulo: ReactNode; aoClicar?: () => void; title?: string }) {
  return (
    <div
      className={cx("min-w-[118px] rounded-[10px] border border-line bg-card px-3.5 py-2.5 shadow-card", aoClicar && "cursor-pointer hover:border-accent")}
      onClick={aoClicar} title={title}
    >
      <div className="text-2xl font-bold tracking-[-.3px] tabular-nums">{n}</div>
      <div className="text-xs text-muted">{rotulo}</div>
    </div>
  );
}
