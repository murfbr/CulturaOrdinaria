/* As abas de uma vista (role=tablist), com a contagem ao lado do nome. */
import { cx } from "../../../utils/classes";

export interface Aba<T extends string> { id: T; nome: string; n?: number }

interface Props<T extends string> { abas: Aba<T>[]; ativa: T; aoMudar: (id: T) => void }

export function Abas<T extends string>({ abas, ativa, aoMudar }: Props<T>) {
  return (
    <div role="tablist" className="cdf:mb-[18px] cdf:flex cdf:gap-0.5 cdf:overflow-x-auto cdf:border-b-2 cdf:border-solid cdf:border-linha">
      {abas.map((a) => (
        <button
          key={a.id} role="tab" type="button" aria-selected={ativa === a.id} onClick={() => aoMudar(a.id)}
          className={cx(
            "cdf:-mb-0.5 cdf:cursor-pointer cdf:whitespace-nowrap cdf:border-0 cdf:border-b-4 cdf:border-solid cdf:bg-transparent cdf:px-3.5 cdf:py-2.5 cdf:text-[15px] cdf:font-bold",
            ativa === a.id ? "cdf:border-destaque cdf:text-tinta" : "cdf:border-transparent cdf:text-tinta-2",
          )}
        >
          {a.nome}
          {a.n != null && <span className="cdf:ml-1 cdf:font-normal cdf:text-fraco">{a.n}</span>}
        </button>
      ))}
    </div>
  );
}
