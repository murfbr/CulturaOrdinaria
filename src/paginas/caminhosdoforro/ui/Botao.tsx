/* Botão da página: normal (superfície com borda), primário (cor da marca),
   fraco (só o texto, na cor de link), perigo (vermelho vazado) e armado (o
   estado "confirmar" do BotaoArmado). `mini` para ações de linha. */
import type { ButtonHTMLAttributes } from "react";
import { cx } from "../../../utils/classes";

export type VarianteBotao = "normal" | "primario" | "fraco" | "perigo" | "armado";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao;
  mini?: boolean;
}

const VARIANTES: Record<VarianteBotao, string> = {
  normal: "cdf:border-linha cdf:bg-superficie cdf:text-tinta cdf:hover:border-tinta-2",
  primario: "cdf:border-primaria cdf:bg-primaria cdf:text-primaria-texto cdf:hover:brightness-[1.08]",
  fraco: "cdf:border-transparent cdf:bg-transparent cdf:text-link cdf:hover:underline",
  perigo: "cdf:border-erro cdf:bg-transparent cdf:text-erro",
  armado: "cdf:border-erro cdf:bg-erro cdf:text-white",
};

export function Botao({ variante = "normal", mini, className, type = "button", ...resto }: Props) {
  return (
    <button
      type={type}
      className={cx(
        "cdf:inline-flex cdf:cursor-pointer cdf:items-center cdf:justify-center cdf:gap-1 cdf:whitespace-nowrap cdf:rounded-lg cdf:border-[1.5px] cdf:border-solid cdf:font-bold cdf:leading-tight cdf:disabled:cursor-not-allowed cdf:disabled:opacity-45",
        mini ? "cdf:px-2 cdf:py-[5px] cdf:text-[13px]" : "cdf:px-3.5 cdf:py-2 cdf:text-sm",
        VARIANTES[variante],
        className,
      )}
      {...resto}
    />
  );
}
