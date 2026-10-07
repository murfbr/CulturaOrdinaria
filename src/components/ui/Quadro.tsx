/* Quadro de colunas (kanban) com arrastar e soltar: o Pipeline dos projetos e
   o quadro de Tarefas. Quadro rola de lado; Coluna tem título, contagem e o
   estado "alvo" quando um cartão está sendo arrastado sobre ela; CartaoQuadro
   é o cartão, com os estados de arrasto. A lógica do arrasto fica na tela. */
import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../../utils/classes";

export function Quadro({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("flex gap-3 overflow-x-auto px-0.5 pb-3.5 pt-1", className)}>{children}</div>;
}

interface PropsColuna extends HTMLAttributes<HTMLDivElement> {
  titulo: ReactNode;
  /** Contagem à direita do título (número ou "abertas/total"). */
  n?: ReactNode;
  alvo?: boolean;
  vazia?: ReactNode;
  /** Coluna mais larga (300px em vez de 236px): cartões com texto. */
  larga?: boolean;
}

export function Coluna({ titulo, n, alvo, vazia, larga, className, children, ...resto }: PropsColuna) {
  return (
    <div
      className={cx(
        "flex-none rounded-xl bg-sand p-2",
        larga ? "w-[300px]" : "w-[236px]",
        alvo && "bg-[#EAE1D3] outline-dashed outline-2 -outline-offset-2 outline-accent",
        className,
      )}
      {...resto}
    >
      <div className="flex items-center gap-1.5 px-1.5 pb-[9px] pt-1 text-xs font-bold text-[#5A5049]">
        {titulo}
        {n != null && <span className="ml-auto rounded-full bg-[#DDD3C6] px-[7px] py-px text-2xs text-muted">{n}</span>}
      </div>
      {children}
      {vazia != null && (
        <div className={cx("rounded-lg border border-dashed p-1.5 text-2xs text-faint", alvo ? "border-accent px-1.5 py-3.5 text-center text-accent" : "border-transparent")}>
          {vazia}
        </div>
      )}
    </div>
  );
}

interface PropsCartao extends HTMLAttributes<HTMLDivElement> {
  arrastando?: boolean;
  antesDaqui?: boolean;
}

export function CartaoQuadro({ arrastando, antesDaqui, className, ...resto }: PropsCartao) {
  return (
    <div
      className={cx(
        "mb-2 cursor-grab rounded-[9px] border border-line bg-white p-2.5 shadow-[0_1px_2px_rgba(0,0,0,.04)] hover:border-accent",
        arrastando && "opacity-35",
        antesDaqui && "shadow-[0_-3px_0_0_var(--color-accent),0_1px_2px_rgba(0,0,0,.04)]",
        className,
      )}
      {...resto}
    />
  );
}
