/* Reels: views × curtidas, escala logarítmica nos dois eixos, um ponto por
   Reel na cor da referência. A diagonal marca 0,5% de curtidas por view:
   abaixo dela (ponto vazado) o alcance cresceu mais que o interesse, o que
   costuma ser mídia paga, do perfil ou do parceiro. */
import { useState } from "react";
import type { LeituraReferencia } from "../../../../types";
import { LIMITE_TAXA, diaMes, formatar, reels, type PontoReel } from "../calculo";
import { COR_EIXO, COR_GRADE, COR_SUPERFICIE, COR_TEXTO } from "../cores";
import { DicaGrafico, Legenda, marcasLog, posicaoNo, usarLargura, type EstadoDica } from "./base";

const MARGEM = { topo: 24, direita: 14, base: 34, esquerda: 52 };

export function DispersaoReels({ leituras, cor }: { leituras: LeituraReferencia[]; cor: (refId: string) => string }) {
  const { ref, el, largura } = usarLargura<HTMLDivElement>();
  const [dica, setDica] = useState<EstadoDica | null>(null);
  const pontos = leituras.flatMap((l) => reels(l).map((p) => ({ ...p, l })));
  if (!pontos.length) return <div ref={ref} className="text-sm italic text-faint">Nenhum Reel com views nesta rodada.</div>;

  const altura = Math.max(260, Math.min(380, largura * 0.72));
  const potencia = (v: number, cima: boolean) => 10 ** (cima ? Math.ceil(Math.log10(v)) : Math.floor(Math.log10(v)));
  const xMin = potencia(Math.min(...pontos.map((p) => p.views)), false);
  const xMax = potencia(Math.max(...pontos.map((p) => p.views)), true);
  const yMin = potencia(Math.min(...pontos.map((p) => p.curtidas)), false);
  const yMax = potencia(Math.max(...pontos.map((p) => p.curtidas)), true);
  const w = largura - MARGEM.esquerda - MARGEM.direita;
  const h = altura - MARGEM.topo - MARGEM.base;
  const x = (v: number) => MARGEM.esquerda + ((Math.log10(v) - Math.log10(xMin)) / (Math.log10(xMax) - Math.log10(xMin))) * w;
  const y = (v: number) => MARGEM.topo + h - ((Math.log10(v) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin))) * h;
  const compacto = (v: number) => formatar(v, "compact");
  // Grade em 1, 2 e 5 de cada década; número só nas potências de 10 quando são muitas décadas.
  const comRotulo = (m: number, decadas: number) => decadas <= 2 || Number.isInteger(Math.round(Math.log10(m) * 1000) / 1000);
  const decX = Math.log10(xMax / xMin), decY = Math.log10(yMax / yMin);

  // Diagonal de 0,5%: curtidas = views × 0,005, recortada na área do gráfico.
  const vIni = Math.max(xMin, yMin / LIMITE_TAXA), vFim = Math.min(xMax, yMax / LIMITE_TAXA);

  const mostrar = (ev: React.MouseEvent | React.FocusEvent, p: PontoReel & { l: LeituraReferencia }) => {
    setDica({
      ...posicaoNo(el, ev.currentTarget as Element),
      conteudo: (
        <>
          <b>{p.l.nome}</b> · {p.post.n} · {diaMes(p.post.data)}{p.post.collab ? " · collab" : ""}<br />
          {compacto(p.views)} views · {compacto(p.curtidas)} curtidas · {formatar(p.taxa, "pct2")}<br />
          <span className="text-muted">{p.post.editoria}. {p.post.resumo.slice(0, 110)}{p.post.resumo.length > 110 ? "…" : ""}</span>
        </>
      ),
    });
  };

  return (
    <div>
      <div ref={ref} className="relative w-full" onMouseLeave={() => setDica(null)}>
        {largura > 0 && (
          <svg width={largura} height={altura} role="img" aria-label="Views e curtidas de cada Reel, em escala logarítmica">
            {marcasLog(xMin, xMax).map((m) => (
              <g key={"x" + m}>
                <line x1={x(m)} x2={x(m)} y1={MARGEM.topo} y2={MARGEM.topo + h} stroke={COR_GRADE} />
                {comRotulo(m, decX) && <text x={x(m)} y={altura - MARGEM.base + 16} textAnchor="middle" fontSize={11} fill={COR_TEXTO}>{compacto(m)}</text>}
              </g>
            ))}
            {marcasLog(yMin, yMax).map((m) => (
              <g key={"y" + m}>
                <line x1={MARGEM.esquerda} x2={MARGEM.esquerda + w} y1={y(m)} y2={y(m)} stroke={COR_GRADE} />
                {comRotulo(m, decY) && <text x={MARGEM.esquerda - 6} y={y(m) + 4} textAnchor="end" fontSize={11} fill={COR_TEXTO}>{compacto(m)}</text>}
              </g>
            ))}
            <text x={MARGEM.esquerda + w} y={altura - 4} textAnchor="end" fontSize={11} fill={COR_TEXTO}>views →</text>
            <text x={4} y={12} fontSize={11} fill={COR_TEXTO}>↑ curtidas</text>
            {vFim > vIni && (
              <g>
                <line x1={x(vIni)} y1={y(vIni * LIMITE_TAXA)} x2={x(vFim)} y2={y(vFim * LIMITE_TAXA)} stroke={COR_EIXO} strokeWidth={1.5} />
              </g>
            )}
            {pontos.map((p) => {
              const c = cor(p.l.refId);
              return (
                <g key={p.post.n} tabIndex={0} className="cursor-pointer outline-none"
                  onMouseEnter={(ev) => mostrar(ev, p)} onFocus={(ev) => mostrar(ev, p)} onBlur={() => setDica(null)} onClick={(ev) => mostrar(ev, p)}>
                  <circle cx={x(p.views)} cy={y(p.curtidas)} r={11} fill="transparent" />
                  <circle cx={x(p.views)} cy={y(p.curtidas)} r={5}
                    fill={p.abaixo ? COR_SUPERFICIE : c} stroke={p.abaixo ? c : COR_SUPERFICIE} strokeWidth={2} />
                </g>
              );
            })}
          </svg>
        )}
        <DicaGrafico dica={dica} largura={largura} />
      </div>
      <Legenda itens={[
        ...leituras.map((l) => ({ nome: l.nome, cor: cor(l.refId) })),
        { nome: "0,5% curtidas por view", cor: COR_EIXO, linha: true },
        { nome: "abaixo da linha", cor: COR_EIXO, vazada: true },
      ]} />
    </div>
  );
}
