/* Barra de progresso fina. Um trecho só (percentual) ou vários trechos
   coloridos (rascunho, revisão, concluído no formulário do projeto).
   A largura vem de dado, por isso é o único style={{}} permitido aqui. */
import { cx } from "../../utils/classes";

export interface Trecho { pct: number; cor: "accent" | "gold" | "rev" | "ok" | "no" }

const COR: Record<Trecho["cor"], string> = {
  accent: "bg-accent", gold: "bg-gold", rev: "bg-rev", ok: "bg-ok", no: "bg-no",
};

export function Barra({ pct, trechos, className }: { pct?: number; trechos?: Trecho[]; className?: string }) {
  const partes = trechos || [{ pct: pct || 0, cor: "accent" as const }];
  return (
    <div className={cx("flex h-1.5 overflow-hidden rounded-[3px] bg-sand", className)}>
      {partes.map((t, i) => (
        <i key={i} className={cx("block h-full", COR[t.cor])} style={{ width: Math.max(0, Math.min(100, t.pct)) + "%" }} />
      ))}
    </div>
  );
}
