/* Campo de formulário: rótulo em cima e o controle embaixo. Entrada, Selecao e
   AreaTexto são o input, select e textarea com o visual da Central.
   ESTILO_CONTROLE é o mesmo visual sem largura, para controles em linha.
   Linhas põe campos lado a lado (2 ou 3 por linha no desktop, 1 no celular).
   Marcacao é a caixa de marcar com texto ao lado. */
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cx } from "../../utils/classes";

export const ESTILO_CONTROLE =
  "rounded-lg border border-line bg-white px-2.5 py-2 text-sm text-ink outline-none focus:border-accent";

/** Controle discreto: sem borda até passar o mouse (nome editável no cabeçalho, nota). */
export const ESTILO_CONTROLE_DISCRETO =
  "rounded-md border border-transparent bg-transparent px-1.5 py-1 text-ink outline-none hover:border-line-strong hover:bg-bg focus:border-line-strong focus:bg-bg";

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

const COLUNAS = { 2: "md:grid-cols-[1fr_1.4fr]", 3: "md:grid-cols-3" };

/** Campos lado a lado. Cada filho é um <Campo>. */
export function Linhas({ colunas = 2, className, children }: { colunas?: 2 | 3; className?: string; children: ReactNode }) {
  return <div className={cx("grid grid-cols-1 gap-x-2", COLUNAS[colunas], className)}>{children}</div>;
}

/** Caixa de marcar com o texto ao lado, clicável inteira. */
export function Marcacao({ marcado, aoMudar, className, children, ...resto }: {
  marcado: boolean; aoMudar: (v: boolean) => void; className?: string; children: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "checked" | "className" | "children">) {
  return (
    <label className={cx("inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted", className)}>
      <input type="checkbox" className="accent-accent" checked={marcado} onChange={(e) => aoMudar(e.target.checked)} {...resto} />
      {children}
    </label>
  );
}

/** Caixa quadrada de marcar (pendências, documentos): verde quando feita. */
export function CaixaMarcar({ marcado, aoMudar, title }: { marcado: boolean; aoMudar: () => void; title?: string }) {
  return (
    <button
      type="button" title={title} aria-pressed={marcado} onClick={aoMudar}
      className={cx(
        "inline-flex size-[18px] flex-none cursor-pointer items-center justify-center rounded-[5px] border-[1.5px] border-solid p-0 text-2xs text-white",
        marcado ? "border-ok bg-ok" : "border-line bg-white",
      )}
    >
      {marcado ? "✓" : ""}
    </button>
  );
}
