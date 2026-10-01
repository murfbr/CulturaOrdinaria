/* Botão da Central. As variantes cobrem os botões do site: primário (laranja),
   fantasma (branco com borda), quieto (sem borda), perigo (vermelho), escuro
   (marca), link (só texto laranja) e apagar (só texto vermelho). */
import type { ButtonHTMLAttributes } from "react";
import { cx } from "../../utils/classes";

export type VarianteBotao = "primario" | "fantasma" | "quieto" | "perigo" | "escuro" | "link" | "apagar";
export type TamanhoBotao = "pequeno" | "normal" | "grande";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
}

const VARIANTES: Record<VarianteBotao, string> = {
  primario: "bg-accent text-white border-transparent",
  fantasma: "bg-white text-ink border-line",
  quieto: "bg-transparent text-muted border-transparent hover:bg-sand hover:text-ink",
  perigo: "bg-no text-white border-transparent",
  escuro: "bg-brand text-white border-transparent",
  link: "bg-transparent text-accent",
  apagar: "bg-transparent text-no",
};

// Com caixa: padding e borda. Sem caixa (link, apagar): só o texto.
const CAIXA: Record<TamanhoBotao, string> = {
  pequeno: "border rounded-lg px-2.5 py-[5px] text-xs",
  normal: "border rounded-lg px-3 py-2 text-sm",
  grande: "border rounded-lg px-3 py-2.5 text-base",
};
const TEXTO: Record<TamanhoBotao, string> = {
  pequeno: "border-0 p-0 text-xs",
  normal: "border-0 p-0 text-sm",
  grande: "border-0 p-0 text-base",
};

export function Botao({ variante = "primario", tamanho = "normal", className, type = "button", ...resto }: Props) {
  const semCaixa = variante === "link" || variante === "apagar";
  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center gap-1 font-semibold cursor-pointer whitespace-nowrap border-solid disabled:opacity-45 disabled:cursor-default",
        semCaixa ? TEXTO[tamanho] : CAIXA[tamanho],
        VARIANTES[variante],
        className,
      )}
      {...resto}
    />
  );
}
