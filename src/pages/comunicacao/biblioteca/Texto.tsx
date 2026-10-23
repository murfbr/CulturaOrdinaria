/* Texto da síntese: o JSON traz **negrito** e nada mais. */
import { Fragment, type ReactNode } from "react";
import { cx } from "../../../utils/classes";

export function Texto({ children }: { children: string }) {
  const partes = children.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {partes.map((p, i) => (p.startsWith("**") && p.endsWith("**")
        ? <b key={i} className="font-semibold text-ink">{p.slice(2, -2)}</b>
        : <Fragment key={i}>{p}</Fragment>))}
    </>
  );
}

/** Lista de itens da síntese, com o fio da Central. */
export function ListaTexto({ itens, className }: { itens: string[]; className?: string }) {
  if (!itens.length) return null;
  return (
    <ul className={cx("m-0 flex list-none flex-col gap-2 p-0", className)}>
      {itens.map((t, i) => (
        <li key={i} className="relative pl-4 text-base leading-relaxed text-muted before:absolute before:left-0 before:top-[0.6em] before:size-1.5 before:rounded-full before:bg-line-strong">
          <Texto>{t}</Texto>
        </li>
      ))}
    </ul>
  );
}

/** Bolinha da cor da referência, ao lado do nome (identidade nunca só pela cor). */
export function Bolinha({ cor, vazada, className }: { cor: string; vazada?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cx("inline-block size-2.5 shrink-0 rounded-full align-middle", className)}
      style={vazada ? { boxShadow: `inset 0 0 0 2px ${cor}` } : { background: cor }}
    />
  );
}

/** Nome com a bolinha da cor. */
export function NomeComCor({ nome, cor, children }: { nome: string; cor: string; children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <Bolinha cor={cor} />
      {nome}
      {children}
    </span>
  );
}
