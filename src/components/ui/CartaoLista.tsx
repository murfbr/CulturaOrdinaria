/* Cartão de lista: o item clicável das listas em grade (Artistas, mesa de
   projetos). Selos em cima, título, subtítulo, o conteúdo (Dados compactos)
   e um rodapé com contagens e a ligação "abrir ficha →" em vermelho. O botão
   "editar" com fio fica no canto. */
import type { ReactNode } from "react";
import { cx } from "../../utils/classes";

interface Props {
  aoAbrir?: () => void;
  aoEditar?: () => void;
  /** Selos acima do título (tipo, status). */
  etiquetas?: ReactNode;
  titulo: ReactNode;
  sub?: ReactNode;
  /** Rodapé: contagens e selos; a ligação "abrir ficha" entra sozinha quando há aoAbrir. */
  rodape?: ReactNode;
  rotuloAbrir?: string;
  className?: string;
  children?: ReactNode;
}

export function CartaoLista({ aoAbrir, aoEditar, etiquetas, titulo, sub, rodape, rotuloAbrir = "abrir ficha →", className, children }: Props) {
  return (
    <div
      className={cx(
        "relative rounded-md border border-line bg-card p-4 transition-colors",
        aoAbrir && "cursor-pointer hover:border-ink",
        className,
      )}
      onClick={aoAbrir}
    >
      {aoEditar && (
        <button
          type="button"
          className="absolute right-3 top-3 cursor-pointer rounded-md border border-solid border-line-strong bg-card px-2 py-0.5 text-xs text-muted hover:border-ink hover:text-ink"
          onClick={(e) => { e.stopPropagation(); aoEditar(); }}
        >
          editar
        </button>
      )}
      {etiquetas && <div className="mb-2.5 flex flex-wrap gap-1.5 pr-16">{etiquetas}</div>}
      <h3 className="m-0 mb-0.5 text-2xl font-semibold leading-tight">{titulo}</h3>
      {sub && <p className="m-0 mb-2.5 text-sm text-muted">{sub}</p>}
      {children}
      {(rodape || aoAbrir) && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-2.5 text-sm text-muted">
          {rodape}
          {aoAbrir && <span className="ml-auto font-semibold text-accent">{rotuloAbrir}</span>}
        </div>
      )}
    </div>
  );
}
