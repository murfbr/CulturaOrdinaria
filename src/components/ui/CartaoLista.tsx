/* Cartão de lista: o item clicável das listas em grade (Artistas). Etiqueta
   em cima, título, subtítulo, o conteúdo (Dados compactos) e um rodapé com
   etiquetas e a seta "abrir". O botão "editar" fica no canto. */
import type { ReactNode } from "react";
import { cx } from "../../utils/classes";

interface Props {
  aoAbrir?: () => void;
  aoEditar?: () => void;
  /** Etiquetas acima do título (tipo, status). */
  etiquetas?: ReactNode;
  titulo: ReactNode;
  sub?: ReactNode;
  /** Rodapé: etiquetas e contagens; a seta "abrir ficha" entra sozinha quando há aoAbrir. */
  rodape?: ReactNode;
  rotuloAbrir?: string;
  className?: string;
  children?: ReactNode;
}

export function CartaoLista({ aoAbrir, aoEditar, etiquetas, titulo, sub, rodape, rotuloAbrir = "abrir ficha →", className, children }: Props) {
  return (
    <div
      className={cx(
        "relative rounded-xl border border-line bg-card p-4 shadow-card transition-[border-color,transform] duration-100",
        aoAbrir && "cursor-pointer hover:-translate-y-px hover:border-accent",
        className,
      )}
      onClick={aoAbrir}
    >
      {aoEditar && (
        <button
          type="button"
          className="absolute right-2.5 top-2.5 cursor-pointer rounded-md border-0 bg-sand px-[7px] py-[3px] text-2xs text-muted hover:bg-accent hover:text-white"
          onClick={(e) => { e.stopPropagation(); aoEditar(); }}
        >
          editar
        </button>
      )}
      {etiquetas && <div className="mb-2 flex flex-wrap gap-1 pr-14">{etiquetas}</div>}
      <h3 className="m-0 mb-0.5 text-[15px] font-bold leading-tight">{titulo}</h3>
      {sub && <p className="m-0 mb-2.5 text-sm text-muted">{sub}</p>}
      {children}
      {(rodape || aoAbrir) && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-[11px] text-xs text-faint">
          {rodape}
          {aoAbrir && <span className="ml-auto font-bold text-accent">{rotuloAbrir}</span>}
        </div>
      )}
    </div>
  );
}
