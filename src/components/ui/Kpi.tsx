/* Números de resumo: pílulas com o número num círculo preto e o rótulo ao lado. */
import type { ReactNode } from "react";
import { cx } from "../../utils/classes";

export function GradeKpis({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("mb-4 flex flex-wrap gap-3", className)}>{children}</div>;
}

export function Kpi({ n, rotulo, aoClicar, title }: { n: ReactNode; rotulo: ReactNode; aoClicar?: () => void; title?: string }) {
  return (
    <div
      className={cx(
        "inline-flex items-center gap-2.5 rounded-pill border border-line bg-card py-1.5 pl-1.5 pr-4",
        aoClicar && "cursor-pointer hover:border-ink",
      )}
      onClick={aoClicar} title={title}
    >
      <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-ink px-1.5 text-lg font-semibold text-on-fill tabular-nums">{n}</span>
      <span className="text-lg text-ink">{rotulo}</span>
    </div>
  );
}
