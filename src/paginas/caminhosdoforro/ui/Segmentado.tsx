/* Botões em grupo com um escolhido (o `.seg` do artefato): cenário do
   orçamento, operação do bar, modo do patrocínio, agrupar a grade. */
import { cx } from "../../../utils/classes";

interface Props<T extends string> {
  rotulo: string;
  opcoes: [T, string][];
  valor: T;
  aoMudar: (v: T) => void;
}

export function Segmentado<T extends string>({ rotulo, opcoes, valor, aoMudar }: Props<T>) {
  return (
    <div role="group" aria-label={rotulo} className="cdf:inline-flex cdf:overflow-hidden cdf:rounded-[10px] cdf:border-[1.5px] cdf:border-solid cdf:border-linha cdf:bg-superficie">
      {opcoes.map(([v, nome], i) => (
        <button
          key={v} type="button" aria-pressed={valor === v} onClick={() => aoMudar(v)}
          className={cx(
            "cdf:cursor-pointer cdf:border-0 cdf:px-3 cdf:py-2 cdf:text-sm cdf:font-semibold",
            i > 0 && "cdf:border-l-[1.5px] cdf:border-solid cdf:border-linha",
            valor === v ? "cdf:bg-primaria cdf:text-primaria-texto" : "cdf:bg-transparent cdf:text-tinta-2",
          )}
        >
          {nome}
        </button>
      ))}
    </div>
  );
}
