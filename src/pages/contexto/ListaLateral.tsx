/* Lista lateral das telas Fichas e Julgamentos: painel preso ao rolar no
   desktop, com grupos rotulados e um botão por registro (o aberto fica
   marcado em laranja; o "sem ficha" fica apagado). Componente local do
   Contexto, não é bloco de ui/. */
import type { ReactNode } from "react";
import { Painel } from "../../components/ui/Painel";
import { Rotulo } from "../../components/ui/Rotulo";
import { cx } from "../../utils/classes";

export function ListaLateral({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Painel className={cx("md:sticky md:top-[60px] md:max-h-[calc(100vh-72px)] md:overflow-auto", className)}>
      {/* O Painel tem 16px de padding; a lista é mais apertada (8px), daí a margem negativa. */}
      <div className="-m-2">{children}</div>
    </Painel>
  );
}

/** Rótulo de um grupo da lista; `separado` põe um traço em cima (do segundo grupo em diante). */
export function GrupoLista({ separado, children }: { separado?: boolean; children: ReactNode }) {
  return (
    <Rotulo className={cx("px-2 pb-1", separado ? "mt-1.5 border-t border-line pt-2.5" : "pt-2")}>{children}</Rotulo>
  );
}

interface PropsItem {
  ativo?: boolean;
  /** Registro sem ficha ainda: itálico e apagado. */
  apagado?: boolean;
  /** Contagem à direita (regras do escopo). */
  direita?: ReactNode;
  onClick: () => void;
  children: ReactNode;
}

export function ItemLista({ ativo, apagado, direita, onClick, children }: PropsItem) {
  const estado = ativo
    ? "bg-accent-soft font-semibold text-accent-ink"
    : apagado
      ? "bg-transparent italic text-faint hover:bg-sand hover:text-ink"
      : "bg-transparent text-muted hover:bg-sand hover:text-ink";
  return (
    <button
      type="button"
      className={cx("flex w-full cursor-pointer items-center gap-2 rounded-md border-0 px-2 py-[7px] text-left text-sm", estado)}
      onClick={onClick}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {direita != null && <span className="ml-auto text-2xs text-faint tabular-nums">{direita}</span>}
    </button>
  );
}
