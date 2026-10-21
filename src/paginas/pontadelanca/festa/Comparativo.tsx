/* Comparativo edição a edição: os indicadores por presente, com melhor e
   pior marcados só entre edições fechadas. */
import { FORMATO_KPI, MELHOR_KPI, R, br, calcular, kpis } from "../calculo";
import type { Painel } from "../tipos";

export function Comparativo({ painel }: { painel: Painel }) {
  const colunas = painel.edicoes;
  if (!colunas.length) return null;
  const porEdicao = colunas.map((e) => ({ fechada: calcular(painel, e).fechada, valores: new Map(kpis(painel, e)) }));
  const nomes = kpis(painel, colunas[0]).map(([nome]) => nome);

  return (
    <section id="l-comparativo">
      <div className="sdp-eyebrow">Festa · comparativo</div>
      <h2>Edição a edição</h2>
      <p className="lead">
        Os indicadores que dizem se a festa está melhorando: tudo por presente, porque o problema é faturamento por
        pessoa, não volume de gente.
      </p>
      <div className="tw">
        <table className="cmp">
          <thead>
            <tr>
              <th>Indicador</th>
              {colunas.map((e, i) => (
                <th className="num" key={e.id}>
                  {e.nome}<br />
                  <span style={{ fontWeight: 400, opacity: 0.8 }}>{br(e.data)}{porEdicao[i].fechada ? "" : " · previsto"}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nomes.map((nome) => {
              const valores = porEdicao.map((c) => c.valores.get(nome) ?? null);
              const formato = FORMATO_KPI[nome] || R;
              const validos = valores
                .map((v, i) => ({ v, i }))
                .filter((x): x is { v: number; i: number } => x.v != null && porEdicao[x.i].fechada);
              let melhor = -1;
              let pior = -1;
              const direcao = MELHOR_KPI[nome];
              if (validos.length > 1 && direcao) {
                const ordem = [...validos].sort((a, b) => (a.v - b.v) * direcao);
                melhor = ordem[ordem.length - 1].i;
                pior = ordem[0].i;
              }
              return (
                <tr key={nome}>
                  <td>{nome}</td>
                  {valores.map((v, i) => (
                    <td key={i} className={"num " + (i === melhor ? "best" : i === pior ? "worst" : "")}>{formato(v)}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="legend">
        Colunas de edições não fechadas mostram a projeção (receitas previstas e custos previstos). Melhor e pior só
        entre edições fechadas.
      </div>
    </section>
  );
}
