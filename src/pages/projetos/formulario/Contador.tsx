/* Contador de caracteres com aviso perto do limite (90%) e no estouro, e o
   rodapé de campo em que ele mora (a linha pequena e apagada embaixo do
   controle, que também carrega outros avisos). */
import type { ReactNode } from "react";
import { cx } from "../../../utils/classes";

/** Rodapé do campo: contador, "limite real da plataforma", avisos curtos. */
export function RodapeCampo({ children }: { children: ReactNode }) {
  return <div className="mt-1.5 flex items-center gap-3 text-xs text-faint tabular-nums">{children}</div>;
}

export function Contador({ atual, max }: { atual: number; max?: number }) {
  return (
    <span className={cx(max && atual >= max ? "font-semibold text-no" : max && atual >= max * 0.9 ? "text-gold" : undefined)}>
      {atual}{max ? " / " + max : " caracteres · sem limite"}
    </span>
  );
}
