/* Ciclos de evento de uma referência: uma linha por evento com mais de um post,
   na ordem das datas; eventos de um post só vão para "Outros eventos". O
   losango (só o contorno) marca o dia do evento; cada ponto é um post na data em que saiu.
   Ponto cheio: convida pra uma data (chamada); vazado: não convida. */
import { useState } from "react";
import type { LeituraReferencia, PostReferencia } from "../../../../types";
import { ciclos, diaMes, formatar, postsDaJanela, rotuloDia } from "../calculo";
import { COR_EIXO, COR_GRADE, COR_SUPERFICIE, COR_TEXTO } from "../cores";
import { DicaGrafico, Legenda, posicaoNo, usarLargura, type EstadoDica } from "./base";

const OUTROS = "Outros eventos";
const ALTURA_LINHA = 30;
const TOPO = 6;
const BASE = 26;
const DIA = 864e5;

export function LinhaCiclos({ leitura, cor, desempenho }: {
  leitura: LeituraReferencia; cor: string; desempenho: Record<string, number | null>;
}) {
  const { ref, el, largura } = usarLargura<HTMLDivElement>();
  const [dica, setDica] = useState<EstadoDica | null>(null);
  const cs = ciclos(leitura);
  const grandes = cs.filter((c) => c.posts > 1);
  const nomes = [...grandes.map((c) => c.evento), ...(cs.some((c) => c.posts === 1) ? [OUTROS] : [])];
  const linhaDe = (evento: string) => (grandes.some((c) => c.evento === evento) ? evento : OUTROS);
  const posts = postsDaJanela(leitura).filter((p) => p.evento && p.dia != null);
  if (!posts.length) return <div ref={ref} className="text-sm italic text-faint">Nenhum post ligado a evento nesta janela.</div>;

  const datas = [...posts.map((p) => Date.parse(p.data)), ...cs.map((c) => Date.parse(c.dataEvento))];
  const ini = Math.min(...datas) - DIA, fim = Math.max(...datas) + DIA;
  const celular = largura < 420;
  const esquerda = celular ? 128 : 190;
  const w = Math.max(0, largura - esquerda - 12);
  const x = (t: number) => esquerda + ((t - ini) / (fim - ini)) * w;
  const altura = TOPO + nomes.length * ALTURA_LINHA + BASE;
  const yDe = (nome: string) => TOPO + nomes.indexOf(nome) * ALTURA_LINHA + ALTURA_LINHA / 2;

  // Marcas do eixo: o primeiro dia de cada mês da janela (ou de 15 em 15 dias numa janela curta).
  const marcas: number[] = [];
  const d0 = new Date(ini);
  const curta = fim - ini < 75 * DIA;
  for (let d = new Date(Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth(), 1)); d.getTime() <= fim; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))) {
    if (d.getTime() >= ini) marcas.push(d.getTime());
    const meio = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 15);
    if (curta && meio >= ini && meio <= fim) marcas.push(meio);
  }
  // No celular o nome encurta, mas a data entre parênteses fica: é ela que separa "Quinta no Glorioso" de uma semana pra outra.
  const curto = (s: string) => {
    const max = celular ? 18 : 30;
    if (s.length <= max) return s;
    const m = s.match(/^(.*?)(\s*\([^)]*\))$/);
    const fim = m ? m[2] : "";
    return (m ? m[1] : s).slice(0, Math.max(4, max - fim.length - 1)).trimEnd() + "…" + fim;
  };

  const mostrar = (ev: React.MouseEvent | React.FocusEvent, p: PostReferencia) => setDica({
    ...posicaoNo(el, ev.currentTarget as Element),
    conteudo: (
      <>
        <b>{p.n}</b> · {diaMes(p.data)} · {rotuloDia(p.dia)} · {p.formato}<br />
        {p.editoria}{p.chamada ? " · com chamada" : ""} · {formatar(p.curtidas, "int")} curtidas
        {desempenho[p.n] != null && <> · {formatar(desempenho[p.n], "x")}</>}<br />
        <span className="text-muted">{p.evento}. {p.resumo.slice(0, 100)}{p.resumo.length > 100 ? "…" : ""}</span>
      </>
    ),
  });

  return (
    <div>
      <div ref={ref} className="relative w-full" onMouseLeave={() => setDica(null)}>
        {largura > 0 && (
          <svg width={largura} height={altura} role="img" aria-label={"Posts de " + leitura.nome + " por evento, na linha do tempo"}>
            {marcas.map((m) => (
              <g key={m}>
                <line x1={x(m)} x2={x(m)} y1={TOPO} y2={altura - BASE} stroke={COR_GRADE} />
                <text x={x(m)} y={altura - BASE + 16} textAnchor="middle" fontSize={11} fill={COR_TEXTO}>{diaMes(new Date(m).toISOString())}</text>
              </g>
            ))}
            {nomes.map((nome) => {
              const y = yDe(nome);
              const c = grandes.find((z) => z.evento === nome);
              return (
                <g key={nome}>
                  <text x={esquerda - 10} y={y + 4} textAnchor="end" fontSize={celular ? 11 : 12} fill={COR_TEXTO}>
                    <title>{nome}</title>{curto(nome)}
                  </text>
                  <line x1={esquerda} x2={esquerda + w} y1={y} y2={y} stroke={COR_GRADE} strokeOpacity={0.6} />
                </g>
              );
            })}
            {posts.map((p) => {
              const cx = x(Date.parse(p.data)), cy = yDe(linhaDe(p.evento));
              return (
                <g key={p.n} tabIndex={0} className="cursor-pointer outline-none"
                  onMouseEnter={(ev) => mostrar(ev, p)} onFocus={(ev) => mostrar(ev, p)} onBlur={() => setDica(null)} onClick={(ev) => mostrar(ev, p)}>
                  <circle cx={cx} cy={cy} r={10} fill="transparent" />
                  <circle cx={cx} cy={cy} r={5} fill={p.chamada ? cor : COR_SUPERFICIE} stroke={p.chamada ? COR_SUPERFICIE : cor} strokeWidth={2} />
                </g>
              );
            })}
            {/* O dia do evento por cima dos pontos, só o contorno: o post do Dia aparece dentro do losango. */}
            {grandes.map((c) => {
              const cx = x(Date.parse(c.dataEvento)), y = yDe(c.evento);
              return <path key={c.evento} d={`M${cx} ${y - 10} L${cx + 10} ${y} L${cx} ${y + 10} L${cx - 10} ${y} Z`} fill="none" stroke={COR_EIXO} strokeWidth={1.5} pointerEvents="none" />;
            })}
          </svg>
        )}
        <DicaGrafico dica={dica} largura={largura} />
      </div>
      <Legenda itens={[
        { nome: "post com chamada", cor },
        { nome: "sem chamada", cor, vazada: true },
        { nome: "dia do evento", cor: COR_EIXO, losango: true },
      ]} />
    </div>
  );
}
