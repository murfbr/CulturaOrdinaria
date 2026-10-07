/* Barra de progresso fina, preta sobre o fundo afundado. Um trecho só
   (percentual) ou vários trechos coloridos (rascunho âmbar, revisado violeta,
   colado verde no formulário do projeto). A largura vem de dado, por isso é o
   único style={{}} permitido aqui. */
import { cx } from "../../utils/classes";

export interface Trecho { pct: number; cor: "accent" | "gold" | "rev" | "ok" | "no" }

const COR: Record<Trecho["cor"], string> = {
  accent: "bg-ink", gold: "bg-warn", rev: "bg-fed", ok: "bg-ok", no: "bg-accent",
};

export function Barra({ pct, trechos, className }: { pct?: number; trechos?: Trecho[]; className?: string }) {
  const partes = trechos || [{ pct: pct || 0, cor: "accent" as const }];
  return (
    <div className={cx("flex h-2 overflow-hidden rounded-sm bg-bg-sunk", className)}>
      {partes.map((t, i) => (
        <i key={i} className={cx("block h-full", COR[t.cor])} style={{ width: Math.max(0, Math.min(100, t.pct)) + "%" }} />
      ))}
    </div>
  );
}
