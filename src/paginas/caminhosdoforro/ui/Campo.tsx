/* Campos de formulário: Campo (rótulo em cima e o controle embaixo, num
   <label> só, como o `campo()` do artefato), Grupo (o mesmo sem <label>, para
   chips e listas), Entrada/Selecao/AreaTexto (input, select e textarea com o
   visual da página), Opcoes (as <option> de um select), Chips (checkboxes em
   formato de chip) e Check (checkbox com texto ao lado). */
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cx } from "../../../utils/classes";

/** Visual dos controles sem largura (para controles em linha, na barra de filtros). */
export const ESTILO_CONTROLE_BASE =
  "cdf:min-w-0 cdf:rounded-lg cdf:border-[1.5px] cdf:border-solid cdf:border-linha cdf:bg-superficie cdf:px-2.5 cdf:py-2 cdf:text-base cdf:text-tinta cdf:disabled:opacity-75";
export const ESTILO_CONTROLE = "cdf:w-full " + ESTILO_CONTROLE_BASE;
export const ROTULO = "cdf:mb-[5px] cdf:block cdf:text-sm cdf:font-bold cdf:text-tinta-2";

interface PropsCampo {
  rotulo: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Campo({ rotulo, className, children }: PropsCampo) {
  return (
    <label className={cx("cdf:block cdf:min-w-0", className)}>
      <span className={ROTULO}>{rotulo}</span>
      {children}
    </label>
  );
}

export function Grupo({ rotulo, className, children }: PropsCampo) {
  return (
    <div className={cx("cdf:min-w-0", className)}>
      <span className={ROTULO}>{rotulo}</span>
      {children}
    </div>
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

/** As <option> de um select a partir de pares [valor, rótulo]. */
export function Opcoes({ lista }: { lista: [string, string][] }) {
  return <>{lista.map(([v, r]) => <option key={v} value={v}>{r}</option>)}</>;
}

interface PropsChips {
  nome: string;
  opcoes: [string, string][];
  marcados: string[];
  aoMudar: (ids: string[]) => void;
}

export function Chips({ nome, opcoes, marcados, aoMudar }: PropsChips) {
  return (
    <div className="cdf:flex cdf:flex-wrap cdf:gap-1.5">
      {opcoes.map(([id, rotulo]) => {
        const on = marcados.includes(id);
        return (
          <label
            key={id}
            className={cx(
              "cdf:inline-flex cdf:cursor-pointer cdf:items-center cdf:gap-1.5 cdf:rounded-full cdf:border-[1.5px] cdf:border-solid cdf:py-1 cdf:pl-2 cdf:pr-3 cdf:text-[14.5px]",
              on ? "cdf:border-primaria cdf:bg-primaria-suave" : "cdf:border-linha",
            )}
          >
            <input
              type="checkbox" name={nome} value={id} checked={on}
              onChange={(e) => aoMudar(e.target.checked ? [...marcados, id] : marcados.filter((x) => x !== id))}
              className="cdf:h-4 cdf:w-4 cdf:accent-primaria"
            />
            {rotulo}
          </label>
        );
      })}
    </div>
  );
}

export function Check({ rotulo, className, ...resto }: InputHTMLAttributes<HTMLInputElement> & { rotulo: ReactNode }) {
  return (
    <label className={cx("cdf:inline-flex cdf:cursor-pointer cdf:items-center cdf:gap-2 cdf:whitespace-nowrap cdf:text-base", className)}>
      <input type="checkbox" className="cdf:h-[18px] cdf:w-[18px] cdf:accent-primaria" {...resto} />
      {rotulo}
    </label>
  );
}
