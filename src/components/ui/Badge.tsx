/* Etiqueta pequena e arredondada (tipo, status, esfera). */
import type { HTMLAttributes } from "react";
import { cx } from "../../utils/classes";

export type TomBadge = "neutro" | "ok" | "aviso" | "erro" | "info" | "fed" | "est" | "mun" | "priv";

const TONS: Record<TomBadge, string> = {
  neutro: "bg-sand text-muted",
  ok: "bg-ok-soft text-ok-ink",
  aviso: "bg-warn-soft text-warn-ink",
  erro: "bg-no-soft text-no-ink",
  info: "bg-rev-soft text-rev",
  fed: "bg-fed text-white",
  est: "bg-est text-white",
  mun: "bg-mun text-white",
  priv: "bg-priv text-white",
};

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tom?: TomBadge;
  mini?: boolean;
}

export function Badge({ tom = "neutro", mini, className, ...resto }: Props) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-[3px] font-bold tracking-[.2px]",
        mini ? "text-3xs" : "text-2xs",
        TONS[tom],
        className,
      )}
      {...resto}
    />
  );
}
