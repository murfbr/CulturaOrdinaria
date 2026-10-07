/* Estado vazio: a mensagem quando uma lista ou um bloco não tem nada.
   Em caixa tracejada (listas inteiras) ou em linha (dentro de um painel). */
import type { ReactNode } from "react";
import { cx } from "../../utils/classes";

export function Vazio({ emLinha, className, children }: { emLinha?: boolean; className?: string; children: ReactNode }) {
  if (emLinha) return <p className={cx("m-0 text-sm italic text-faint", className)}>{children}</p>;
  return (
    <div className={cx("rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-sm text-muted", className)}>
      {children}
    </div>
  );
}
