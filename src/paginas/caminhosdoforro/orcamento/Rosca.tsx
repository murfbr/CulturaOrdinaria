/* Gráfico de rosca em SVG, como o do artefato: fatias com dica (valor e
   percentual), o total no meio e a legenda em ordem de valor. */
import { brl, pctTexto } from "../calculo";

export interface Fatia { nome: string; valor: number; cor: string }

const CX = 100, CY = 100, R = 88, r = 56;
const ponto = (raio: number, a: number) => (CX + raio * Math.cos(a)).toFixed(2) + " " + (CY + raio * Math.sin(a)).toFixed(2);

export function Rosca({ titulo, fatias }: { titulo: string; fatias: Fatia[] }) {
  const itens = fatias.filter((f) => f.valor > 0);
  const total = itens.reduce((t, f) => t + f.valor, 0);
  const caixa = "cdf:m-0 cdf:rounded-xl cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie cdf:px-[18px] cdf:py-4";
  const legenda = <figcaption className="cdf:mb-2 cdf:font-display cdf:text-xl cdf:font-black cdf:text-primaria">{titulo}</figcaption>;
  if (!total) return <figure className={caixa}>{legenda}<p className="cdf:m-0 cdf:text-fraco">Sem valores ainda.</p></figure>;

  let a0 = -Math.PI / 2;
  const caminhos = itens.map((f, i) => {
    const fracao = f.valor / total;
    const dica = f.nome + ": " + brl(f.valor) + " (" + pctTexto(f.valor, total) + ")";
    let d: string;
    if (fracao > 0.9999) {
      d = `M${CX - R} ${CY} A${R} ${R} 0 1 1 ${CX + R} ${CY} A${R} ${R} 0 1 1 ${CX - R} ${CY} Z M${CX - r} ${CY} A${r} ${r} 0 1 0 ${CX + r} ${CY} A${r} ${r} 0 1 0 ${CX - r} ${CY} Z`;
    } else {
      const a1 = a0 + fracao * 2 * Math.PI, g = fracao > 0.5 ? 1 : 0;
      d = `M${ponto(R, a0)} A${R} ${R} 0 ${g} 1 ${ponto(R, a1)} L${ponto(r, a1)} A${r} ${r} 0 ${g} 0 ${ponto(r, a0)} Z`;
      a0 = a1;
    }
    return (
      <path key={i} d={d} fill={f.cor} fillRule="evenodd" tabIndex={0} aria-label={dica} className="cdf:cursor-help cdf:stroke-superficie cdf:stroke-[1.5] cdf:hover:opacity-80 cdf:focus:opacity-80 cdf:focus:outline-none">
        <title>{dica}</title>
      </path>
    );
  });

  return (
    <figure className={caixa}>
      {legenda}
      <svg viewBox="0 0 200 200" role="img" aria-label={titulo + ", total " + brl(total)} className="cdf:mx-auto cdf:block cdf:w-full cdf:max-w-[230px]">
        {caminhos}
        <text x="100" y="100" textAnchor="middle" className="cdf:fill-tinta cdf:font-display cdf:text-[19px] cdf:font-black">{brl(total)}</text>
        <text x="100" y="118" textAnchor="middle" className="cdf:fill-fraco cdf:text-[10.5px]">total</text>
      </svg>
      <ul className="cdf:m-0 cdf:mt-3 cdf:flex cdf:list-none cdf:flex-col cdf:gap-1 cdf:p-0 cdf:text-sm">
        {[...itens].sort((a, b) => b.valor - a.valor).map((f, i) => (
          <li key={i} title={f.nome + ": " + brl(f.valor)} className="cdf:flex cdf:cursor-help cdf:items-center cdf:gap-2">
            <i className="cdf:h-[11px] cdf:w-[11px] cdf:shrink-0 cdf:rounded-[3px]" style={{ background: f.cor }} />
            {f.nome}
            <b className="cdf:ml-auto cdf:tabular-nums">{pctTexto(f.valor, total)}</b>
          </li>
        ))}
      </ul>
    </figure>
  );
}
