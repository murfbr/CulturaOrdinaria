/* Rótulo e valor em linha, a leitura de uma ficha. Dois jeitos:
   - padrão: rótulo numa coluna fixa à esquerda, valor à direita, uma linha
     por dado com traço entre elas (a ficha geral do projeto);
   - compacto: "Rótulo: valor" em texto corrido, sem traço (cartões de lista). */
import type { ReactNode } from "react";
import { cx } from "../../utils/classes";

export function Dados({ compacto, className, children }: { compacto?: boolean; className?: string; children: ReactNode }) {
  return <dl className={cx("m-0", compacto ? "flex flex-col gap-0.5" : "divide-y divide-line", className)}>{children}</dl>;
}

interface PropsDado {
  rotulo: ReactNode;
  compacto?: boolean;
  /** Valor em negrito (padrão no compacto). */
  forte?: boolean;
  className?: string;
  children: ReactNode;
}

export function Dado({ rotulo, compacto, forte, className, children }: PropsDado) {
  if (compacto) {
    return (
      <div className={cx("flex gap-1.5 text-sm text-muted", className)}>
        <dt className="shrink-0">{rotulo}:</dt>
        <dd className={cx("m-0 min-w-0 text-ink", forte !== false && "font-semibold")}>{children}</dd>
      </div>
    );
  }
  return (
    <div className={cx("flex flex-col gap-0.5 py-[7px] text-sm md:flex-row md:items-baseline md:gap-3", className)}>
      <dt className="shrink-0 text-xs text-faint md:w-[150px]">{rotulo}</dt>
      <dd className={cx("m-0 min-w-0 flex-1", forte && "font-semibold")}>{children}</dd>
    </div>
  );
}
