/* Gaveta: caixa destacada em laranja que abre dentro de uma tela para mostrar
   algo de outro lugar (as regras e as fichas do Contexto dentro do formulário,
   o contexto embutido numa ficha). Tem título, ações e grupos com rótulo. */
import type { ReactNode } from "react";
import { Rotulo } from "./Rotulo";
import { cx } from "../../utils/classes";

export function Gaveta({ titulo, acoes, className, children }: { titulo: ReactNode; acoes?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <div className={cx("mb-3.5 rounded-xl border border-accent bg-card px-[18px] py-3.5 shadow-card", className)}>
      <div className="mb-2 flex flex-wrap items-center gap-2.5">
        <b className="text-base">{titulo}</b>
        {acoes && <span className="ml-auto flex gap-2">{acoes}</span>}
      </div>
      {children}
    </div>
  );
}

/** Grupo dentro da gaveta: rótulo em cima, traço entre os grupos. */
export function GrupoGaveta({ rotulo, children }: { rotulo: ReactNode; children: ReactNode }) {
  return (
    <div className="border-t border-line py-2 first:border-t-0">
      <Rotulo className="mb-1.5">{rotulo}</Rotulo>
      {children}
    </div>
  );
}
