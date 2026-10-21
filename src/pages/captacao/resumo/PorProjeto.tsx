/* Andamento por projeto aberto: confirmado contra a meta, em negociação e a data. */
import { Barra } from "../../../components/ui/Barra";
import { Painel } from "../../../components/ui/Painel";
import { Vazio } from "../../../components/ui/Vazio";
import type { Negociacao, ProjetoCaptacao } from "../../../types";
import { dataBr } from "../apoio";
import { brl, noEscopo, numero, totais } from "../calculo";

export function PorProjeto({ abertos, negociacoes, como }: { abertos: ProjetoCaptacao[]; negociacoes: Negociacao[]; como: string }) {
  return (
    <Painel titulo="Por projeto" sub="confirmado contra a meta, nos projetos abertos">
      {abertos.map((p) => {
        const t = totais(negociacoes.filter((n) => n.projetoId === p.id && noEscopo(n, como)), [p]);
        const meta = numero(p.meta);
        const pct = meta ? Math.min(100, (t.confirmado / meta) * 100) : 0;
        return (
          <div key={p.id} className="border-t border-line py-2.5 first:border-t-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <b>{p.nome}</b>
              <span className="tabular-nums">{brl(t.confirmado)} <span className="text-muted">de {meta ? brl(meta) : "meta a definir"}</span></span>
            </div>
            <Barra pct={pct} className="my-1.5" />
            <div className="text-sm text-muted">{brl(t.negociando)} em negociação · {p.inicio ? dataBr(p.inicio) : "sem data"}</div>
          </div>
        );
      })}
      {!abertos.length && <Vazio emLinha>Nenhum projeto aberto.</Vazio>}
    </Painel>
  );
}
