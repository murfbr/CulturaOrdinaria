/* Botão da Central. As variantes cobrem os botões do site: primário (laranja),
   fantasma (branco com borda), quieto (sem borda), perigo (vermelho), escuro
   (marca), link (só texto laranja) e apagar (só texto vermelho).
   Tamanhos: mini (ações rápidas numa linha), pequeno, normal, grande. */
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
  primario: "bg-accent text-white border-transparent hover:bg-accent-ink",
  fantasma: "bg-white text-ink border-line hover:border-accent",
  quieto: "bg-transparent text-muted border-transparent hover:bg-sand hover:text-ink",
  perigo: "bg-no text-white border-transparent hover:bg-no-ink",
  escuro: "bg-brand text-white border-transparent",
  link: "bg-transparent text-accent hover:underline",
  apagar: "bg-transparent text-no hover:underline",
};

// Com caixa: padding e borda. Sem caixa (link, apagar): só o texto.
const CAIXA: Record<TamanhoBotao, string> = {
  mini: "border rounded-md px-[7px] py-px text-2xs leading-[18px]",
  pequeno: "border rounded-lg px-2.5 py-[5px] text-xs",
  normal: "border rounded-lg px-3 py-2 text-sm",
  grande: "border rounded-lg px-3 py-2.5 text-base",
};
const TEXTO: Record<TamanhoBotao, string> = {
  mini: "border-0 p-0 text-2xs",
  pequeno: "border-0 p-0 text-xs",
  normal: "border-0 p-0 text-sm",
  grande: "border-0 p-0 text-base",
};

export function Botao({ variante = "primario", tamanho = "normal", className, type = "button", href, ...resto }: Props) {
  const semCaixa = variante === "link" || variante === "apagar";
  const classes = cx(
    "inline-flex items-center justify-center gap-1 font-semibold cursor-pointer whitespace-nowrap border-solid no-underline transition-colors disabled:opacity-45 disabled:cursor-default disabled:hover:bg-accent",
    semCaixa ? TEXTO[tamanho] : CAIXA[tamanho],
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
