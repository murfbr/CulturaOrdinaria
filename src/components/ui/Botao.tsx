/* Botão da Central. Variantes: primário (preto, texto claro), fantasma (fundo
   de cartão com fio forte), quieto (sem fio), perigo (vermelho cheio), escuro
   (igual ao primário), link (texto vermelho) e apagar (texto vermelho).
   Tamanhos: mini (o "editar" de canto), pequeno, normal, grande. */
import type { ButtonHTMLAttributes } from "react";
import { cx } from "../../utils/classes";

export type VarianteBotao = "primario" | "fantasma" | "quieto" | "perigo" | "escuro" | "link" | "apagar";
export type TamanhoBotao = "mini" | "pequeno" | "normal" | "grande";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
  /** Com `href` vira um link <a> com a mesma cara (abre em nova aba). */
  href?: string;
}

const VARIANTES: Record<VarianteBotao, string> = {
  primario: "bg-ink text-on-fill border-ink hover:bg-ink-hover",
  fantasma: "bg-card text-ink border-line-strong hover:border-ink",
  quieto: "bg-transparent text-muted border-transparent hover:bg-bg-hover hover:text-ink",
  perigo: "bg-accent text-on-fill border-accent hover:bg-ink",
  escuro: "bg-ink text-on-fill border-ink hover:bg-ink-hover",
  link: "bg-transparent text-accent hover:underline",
  apagar: "bg-transparent text-accent hover:underline",
};

// Com caixa: padding e fio. Sem caixa (link, apagar): só o texto.
const CAIXA: Record<TamanhoBotao, string> = {
  mini: "border rounded-md px-2 py-px text-xs",
  pequeno: "border rounded-md px-2.5 py-1 text-sm",
  normal: "border rounded-md px-3 py-1.5 text-lg",
  grande: "border rounded-md px-4 py-2.5 text-lg",
};
const TEXTO: Record<TamanhoBotao, string> = {
  mini: "border-0 p-0 text-xs",
  pequeno: "border-0 p-0 text-sm",
  normal: "border-0 p-0 text-lg",
  grande: "border-0 p-0 text-lg",
};

export function Botao({ variante = "primario", tamanho = "normal", className, type = "button", href, ...resto }: Props) {
  const semCaixa = variante === "link" || variante === "apagar";
  const classes = cx(
    "inline-flex items-center justify-center gap-1 whitespace-nowrap border-solid font-medium cursor-pointer no-underline transition-colors disabled:cursor-default disabled:opacity-45",
    semCaixa ? TEXTO[tamanho] : CAIXA[tamanho],
    semCaixa && "font-semibold",
    VARIANTES[variante],
    className,
  );
  if (href) {
    const { children, title, onClick } = resto;
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} title={title}
        onClick={onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}>
        {children}
      </a>
    );
  }
  return <button type={type} className={classes} {...resto} />;
}
