/* Cabeçalho de uma vista: o título grande (Londrina) e a frase de abertura. */
import type { ReactNode } from "react";

interface Props { titulo: string; lead?: string; children?: ReactNode }

export function CabecalhoVista({ titulo, lead, children }: Props) {
  return (
    <header className="cdf:mb-[22px]">
      <h1 className="cdf:m-0 cdf:mb-2.5 cdf:font-display cdf:text-[clamp(34px,4.2vw,48px)] cdf:font-black cdf:leading-none cdf:tracking-[.005em] cdf:text-primaria">{titulo}</h1>
      {lead && <p className="cdf:m-0 cdf:max-w-[68ch] cdf:text-tinta-2">{lead}</p>}
      {children}
    </header>
  );
}
