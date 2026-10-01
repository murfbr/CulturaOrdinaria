/* Os cards de números do artefato (dl.resumo): título, valor grande
   (Londrina) e uma linha de apoio; opcionalmente um extra entre os dois
   (a barra da meta). Barra é a barrinha de progresso. */
import type { ReactNode } from "react";
import { cx } from "../../../utils/classes";

export interface ItemResumo {
  titulo: string;
  valor: ReactNode;
  sub?: ReactNode;
  /** Classe da cor do valor (sobra verde, falta vermelha). */
  classeValor?: string;
  extra?: ReactNode;
}

export function Resumo({ itens, className }: { itens: ItemResumo[]; className?: string }) {
  return (
    <dl className={cx("cdf:m-0 cdf:mb-5 cdf:grid cdf:grid-cols-[repeat(auto-fit,minmax(210px,1fr))] cdf:overflow-hidden cdf:rounded-xl cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie", className)}>
      {itens.map((it, i) => (
        <div key={i} className="cdf:border-b cdf:border-solid cdf:border-linha cdf:px-5 cdf:py-4 cdf:last:border-b-0 cdf:md:border-b-0 cdf:md:border-r cdf:md:last:border-r-0">
          <dt className="cdf:text-sm cdf:font-bold cdf:text-tinta-2">{it.titulo}</dt>
          <dd className={cx("cdf:m-0 cdf:mt-0.5 cdf:font-display cdf:text-display cdf:font-black cdf:leading-[1.25] cdf:tracking-[.01em] cdf:tabular-nums", it.classeValor)}>{it.valor}</dd>
          {it.extra}
          {it.sub && <dd className="cdf:m-0 cdf:text-[13.5px] cdf:text-fraco">{it.sub}</dd>}
        </div>
      ))}
    </dl>
  );
}

/** Barra de progresso fina (0 a 100). */
export function Barra({ pct }: { pct: number }) {
  return (
    <dd className="cdf:m-0 cdf:my-1 cdf:h-2 cdf:overflow-hidden cdf:rounded-full cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie-2" aria-hidden="true">
      <span className="cdf:block cdf:h-full cdf:bg-destaque" style={{ width: Math.max(0, Math.min(100, pct)) + "%" }} />
    </dd>
  );
}
