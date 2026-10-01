/* Texto de apoio: a nota pequena e apagada embaixo de um controle ou de um
   bloco. Dentro de modal é um pouco maior e menos apagada. Sem margem
   própria: quem usa põe mt-2, mb-3 etc. */
import type { HTMLAttributes } from "react";
import { cx } from "../../utils/classes";

interface Props extends HTMLAttributes<HTMLParagraphElement> {
  emModal?: boolean;
}

export function Dica({ emModal, className, ...resto }: Props) {
  return <p className={cx("m-0", emModal ? "text-sm text-muted" : "text-xs text-faint", className)} {...resto} />;
}
