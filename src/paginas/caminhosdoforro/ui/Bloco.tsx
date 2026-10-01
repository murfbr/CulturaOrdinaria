/* Bloco de uma vista: título médio (Londrina) e uma nota explicativa opcional,
   com o conteúdo embaixo. É a `section.bloco` do artefato. */
import type { ReactNode } from "react";
import { cx } from "../../../utils/classes";

interface Props { titulo: string; nota?: string; className?: string; children: ReactNode }

export function Bloco({ titulo, nota, className, children }: Props) {
  return (
    <section className={cx("cdf:mt-[34px]", className)}>
      <h2 className="cdf:m-0 cdf:mb-1.5 cdf:font-display cdf:text-[26px] cdf:font-black cdf:leading-[1.1] cdf:text-primaria">{titulo}</h2>
      {nota && <p className="cdf:m-0 cdf:mb-3.5 cdf:max-w-[72ch] cdf:text-sm cdf:text-fraco">{nota}</p>}
      {children}
    </section>
  );
}

/** Caixa tracejada para lista vazia ou aviso ("Nenhum cadastro ainda…"). */
export function Vazio({ children }: { children: ReactNode }) {
  return (
    <div className="cdf:mt-2 cdf:max-w-[720px] cdf:rounded-xl cdf:border cdf:border-dashed cdf:border-linha cdf:bg-superficie cdf:p-6">
      <p className="cdf:m-0">{children}</p>
    </div>
  );
}
