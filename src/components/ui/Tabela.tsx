/* Tabela da Central: caixa com borda e rolagem horizontal no celular; Th e Td
   com o visual padrão; Tr clicável quando a linha abre uma ficha. A página
   monta thead/tbody como quiser. `simples` tira a caixa (tabela dentro de
   painel ou de modal). */
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cx } from "../../utils/classes";

export const ESTILO_TH = "bg-sand px-3 py-2.5 text-left text-2xs font-bold uppercase tracking-[.4px] whitespace-nowrap";
export const ESTILO_TD = "border-t border-line px-3 py-[11px] align-top";

interface PropsTabela extends HTMLAttributes<HTMLDivElement> {
  simples?: boolean;
  /** Largura mínima da tabela (rola de lado quando não cabe). */
  minima?: string;
}

export function Tabela({ simples, minima, className, children, ...resto }: PropsTabela) {
  return (
    <div className={cx("overflow-x-auto", !simples && "rounded-xl border border-line bg-card shadow-card", className)} {...resto}>
      <table className={cx("w-full border-collapse text-sm", !simples && "[&_tbody_tr:hover]:bg-bg/60", minima)}>{children}</table>
    </div>
  );
}

interface PropsTh extends ThHTMLAttributes<HTMLTableCellElement> {
  /** Coluna de números: alinhada à direita. */
  numerico?: boolean;
  /** Cabeçalho longo que pode quebrar linha (matrizes). */
  quebra?: boolean;
}

export function Th({ numerico, quebra, className, ...resto }: PropsTh) {
  return <th className={cx(ESTILO_TH, "text-muted", numerico && "text-right", quebra && "whitespace-normal text-3xs", className)} {...resto} />;
}

interface PropsTd extends TdHTMLAttributes<HTMLTableCellElement> {
  /** Número alinhado à direita em coluna. */
  numerico?: boolean;
}

export function Td({ numerico, className, ...resto }: PropsTd) {
  return <td className={cx(ESTILO_TD, numerico && "text-right tabular-nums whitespace-nowrap", className)} {...resto} />;
}

/** Linha que abre algo ao clicar. */
export function Tr({ aoClicar, className, ...resto }: HTMLAttributes<HTMLTableRowElement> & { aoClicar?: () => void }) {
  return <tr className={cx(aoClicar && "cursor-pointer", className)} onClick={aoClicar} {...resto} />;
}
