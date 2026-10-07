/* O que as sub-abas da ficha do edital compartilham: o parágrafo de texto
   corrido (ou o traço quando o edital não informa), o dado "rótulo + valor"
   com o mesmo traço, o nome legível de um conceito e o tom da etiqueta de
   confiança (também usado na ficha do formulário). */
import type { ReactNode } from "react";
import { Dado } from "../../../components/ui/Dados";
import { ESTILO_AUXILIAR } from "../../../components/ui/estilos";
import { cx } from "../../../utils/classes";

/** O traço dos campos que o edital não informa. */
export const TRACO = <p className={cx("m-0", ESTILO_AUXILIAR)}>—</p>;

/** Texto corrido do edital, com as quebras de linha preservadas. */
export function Texto({ t }: { t?: string }) {
  return t ? <p className="m-0 max-w-texto whitespace-pre-wrap">{t}</p> : TRACO;
}

/** Rótulo + valor; mostra o traço quando o valor está vazio. */
export function DadoEdital({ rotulo, children }: { rotulo: string; children?: ReactNode }) {
  return <Dado rotulo={rotulo}>{children || <span className="text-muted">—</span>}</Dado>;
}

/** Nome legível de um conceito (de campo ou de critério) a partir da chave. */
export const rotuloConceito = (lista: [string, string][], k: string) => lista.find(([x]) => x === k)?.[1] || k;

/** Tom da etiqueta de confiança do mapeamento (alta, media, baixa). */
export const TOM_CONFIANCA: Record<string, string> = { alta: "ok", media: "aviso", baixa: "erro" };
