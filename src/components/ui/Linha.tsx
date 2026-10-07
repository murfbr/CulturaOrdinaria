/* Linha de lista dentro de um painel: conteúdo à esquerda, detalhe ou ações à
   direita, traço entre as linhas (a primeira sem). Clicável quando abre algo.
   Serve para prazos do Resumo, histórico do artista, documentos, alertas. */
import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../../utils/classes";

interface Props extends HTMLAttributes<HTMLDivElement> {
  aoClicar?: () => void;
  /** Alinha pelo topo (texto de várias linhas) em vez de pelo centro. */
  topo?: boolean;
  /** Mais apertada (7px em vez de 9px). */
  compacta?: boolean;
  /** O que fica à direita (data, etiqueta, botões). */
  direita?: ReactNode;
  apagada?: boolean;
}

export function Linha({ aoClicar, topo, compacta, direita, apagada, className, children, ...resto }: Props) {
  return (
    <div
      className={cx(
        "flex gap-2.5 border-t border-line text-sm first:border-t-0",
        topo ? "items-start" : "items-center",
        compacta ? "py-[7px]" : "py-[9px]",
        aoClicar && "-mx-1.5 cursor-pointer rounded-md px-1.5 hover:bg-bg/70",
        apagada && "opacity-60",
        className,
      )}
      onClick={aoClicar}
      {...resto}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {direita != null && <div className="flex flex-none items-center gap-1.5">{direita}</div>}
    </div>
  );
}
