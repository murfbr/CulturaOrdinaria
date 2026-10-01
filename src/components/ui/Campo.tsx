/* Campo de formulário: rótulo em cima e o controle embaixo. Entrada, Selecao e
   AreaTexto são o input, select e textarea com o visual da Central.
   ESTILO_CONTROLE é o mesmo visual sem largura, para controles em linha. */
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cx } from "../../utils/classes";

export const ESTILO_CONTROLE =
  "rounded-lg border border-line bg-white px-2.5 py-2 text-sm text-ink outline-none focus:border-accent";

interface PropsCampo {
  rotulo: ReactNode;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

export function Campo({ rotulo, htmlFor, className, children }: PropsCampo) {
  return (
    <div className={cx("mb-3", className)}>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold text-muted">{rotulo}</label>
      {children}
    </div>
  );
}

export function Entrada({ className, ...resto }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx("w-full", ESTILO_CONTROLE, className)} {...resto} />;
}

export function Selecao({ className, ...resto }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx("w-full", ESTILO_CONTROLE, className)} {...resto} />;
}

export function AreaTexto({ className, ...resto }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx("min-h-16 w-full resize-y", ESTILO_CONTROLE, className)} {...resto} />;
}
