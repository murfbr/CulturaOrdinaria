/* Campo de formulário: rótulo em cima e o controle embaixo, num <label> só,
   como o `campo()` do artefato. Entrada, Selecao e AreaTexto são o input, o
   select e o textarea com o visual da página. */
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cx } from "../../../utils/classes";

export const ESTILO_CONTROLE =
  "cdf:w-full cdf:min-w-0 cdf:rounded-lg cdf:border-[1.5px] cdf:border-solid cdf:border-linha cdf:bg-superficie cdf:px-2.5 cdf:py-2 cdf:text-base cdf:text-tinta cdf:disabled:opacity-75";

interface PropsCampo {
  rotulo: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Campo({ rotulo, className, children }: PropsCampo) {
  return (
    <label className={cx("cdf:block cdf:min-w-0", className)}>
      <span className="cdf:mb-[5px] cdf:block cdf:text-sm cdf:font-bold cdf:text-tinta-2">{rotulo}</span>
      {children}
    </label>
  );
}

export function Entrada({ className, ...resto }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(ESTILO_CONTROLE, className)} {...resto} />;
}

export function Selecao({ className, ...resto }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(ESTILO_CONTROLE, "cdf:cursor-pointer", className)} {...resto} />;
}

export function AreaTexto({ className, ...resto }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(ESTILO_CONTROLE, "cdf:resize-y cdf:leading-[1.45]", className)} {...resto} />;
}
