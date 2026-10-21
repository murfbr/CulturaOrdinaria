/* O funil: uma caixa por etapa com a quantidade e a soma dos valores. Clicar
   escolhe a etapa (filtra a lista ou leva a Negociações). Negociações
   restritas (de outra captadora, na visão de uma) não entram nas caixas. */
import { Badge } from "../../../components/ui/Badge";
import type { Negociacao } from "../../../types";
import { itensDaLista, tomEtapa } from "../apoio";
import { brl, numero, restrita } from "../calculo";

interface Props {
  negociacoes: Negociacao[];
  como: string;
  ativa?: string;
  aoEscolher: (etapa: string) => void;
}

export function Funil({ negociacoes, como, ativa, aoEscolher }: Props) {
  const visiveis = negociacoes.filter((n) => !restrita(n, como));
  return (
    <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
      {itensDaLista("etapas").map((e) => {
        const x = visiveis.filter((n) => n.etapa === e.id);
        const soma = x.reduce((s, n) => s + (numero(n.valor) || 0), 0);
        const escolhida = ativa === e.id;
        return (
          <button
            key={e.id} type="button" aria-pressed={escolhida}
            className={"flex cursor-pointer flex-col items-start gap-1 rounded-md border bg-card p-2.5 text-left hover:border-ink " + (escolhida ? "border-ink" : "border-line")}
            onClick={() => aoEscolher(e.id)}
          >
            <Badge tom={tomEtapa(e.id)}>{e.nome}</Badge>
            <span className="text-2xl font-semibold tabular-nums">{x.length}</span>
            <span className="text-xs text-muted tabular-nums">{brl(soma)}</span>
          </button>
        );
      })}
    </div>
  );
}
