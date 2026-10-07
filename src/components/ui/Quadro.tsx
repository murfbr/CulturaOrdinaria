/* Quadro de colunas (kanban) com arrastar e soltar: o Pipeline dos projetos e
   o quadro de Tarefas. Quadro rola de lado; Coluna tem régua preta no topo,
   título, contagem e o estado "alvo" quando um cartão está sendo arrastado
   sobre ela; CartaoQuadro é o cartão, com os estados de arrasto. A lógica do
   arrasto fica na tela. */
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
        "flex-none rounded-md border-t-rule border-ink bg-bg-sunk p-2",
        larga ? "w-[300px]" : "w-[236px]",
        alvo && "bg-bg-hover outline-dashed outline-2 -outline-offset-2 outline-accent",
        className,
      )}
      {...resto}
    >
      <div className="flex items-center gap-1.5 px-1.5 pb-2 pt-1.5 text-sm font-semibold text-ink">
        {titulo}
        {n != null && <span className="ml-auto rounded-pill bg-shade px-[7px] py-px font-mono text-2xs text-ink">{n}</span>}
      </div>
      {children}
      {vazia != null && (
        <div className={cx("rounded-md border border-dashed p-1.5 text-xs text-faint", alvo ? "border-accent px-1.5 py-3.5 text-center text-accent" : "border-transparent")}>
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
        "mb-2 cursor-grab rounded-md border border-line bg-card p-2.5 hover:border-ink",
        arrastando && "opacity-35",
        antesDaqui && "border-t-stamp border-t-accent",
        className,
      )}
      {...resto}
    />
  );
}
