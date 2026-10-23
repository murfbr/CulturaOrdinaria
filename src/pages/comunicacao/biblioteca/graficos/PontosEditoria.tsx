/* "O que rende": uma linha por editoria, um ponto por referência. O eixo é o
   desempenho mediano (1,0× é o post típico do perfil), em escala de 2 em 2
   (razão é multiplicativa: 0,5× e 2× ficam à mesma distância do típico), ou os
   comentários a cada 100 curtidas, linear. Ponto vazado: menos de 3 posts na
   editoria. O eixo vai até onde os dados vão, sem cortar ninguém. */
import { useState } from "react";
import { EDITORIAS_REFERENCIA, type LeituraReferencia } from "../../../../types";
import { editorias, formatar, type FormatoNumero, type LinhaEditoria } from "../calculo";
import { COR_EIXO, COR_GRADE, COR_SUPERFICIE, COR_TEXTO } from "../cores";
import { DicaGrafico, Legenda, posicaoNo, usarLargura, type EstadoDica } from "./base";

interface Props {
  leituras: LeituraReferencia[];
  cor: (refId: string) => string;
  campo: "desempenhoMed" | "coment100";
  formato: FormatoNumero;
  /** "log2" para razões (desempenho); "linear" para contagens. */
  escala: "log2" | "linear";
  /** Linha de referência (o post típico, 1,0×). */
  referencia?: number;
  rotuloEixo: string;
}

const ALTURA_LINHA = 30;
const TOPO = 8;
const BASE = 28;

export function PontosEditoria({ leituras, cor, campo, formato, escala, referencia, rotuloEixo }: Props) {
  const { ref, el, largura } = usarLargura<HTMLDivElement>();
  const [dica, setDica] = useState<EstadoDica | null>(null);
  const porLeitura = leituras.map((l) => ({ l, linhas: editorias(l) }));
  const presentes = EDITORIAS_REFERENCIA.filter((e) => porLeitura.some((p) => p.linhas.some((x) => x.editoria === e)));
  const extras = [...new Set(porLeitura.flatMap((p) => p.linhas.map((x) => x.editoria)))].filter((e) => !(EDITORIAS_REFERENCIA as readonly string[]).includes(e));
  const linhas = [...presentes, ...extras];

  const esquerda = largura < 420 ? 92 : 118;
  const direita = 16;
  const w = Math.max(0, largura - esquerda - direita);
  const valores = porLeitura.flatMap((p) => p.linhas.map((x) => x[campo])).filter((v): v is number => v != null && v > 0);
  const maior = Math.max(1, ...valores);
  let x: (v: number) => number;
  let marcas: number[];
  if (escala === "log2") {
    const lo = Math.min(-2, Math.floor(Math.log2(Math.min(...valores, 1))));
    const hi = Math.max(1, Math.ceil(Math.log2(maior)));
    x = (v: number) => esquerda + ((Math.log2(Math.max(v, 2 ** lo)) - lo) / (hi - lo)) * w;
    marcas = Array.from({ length: hi - lo + 1 }, (_, i) => 2 ** (lo + i));
  } else {
    const passo = maior <= 5 ? 1 : maior <= 12 ? 2 : maior <= 30 ? 5 : 10;
    const topo = Math.ceil(maior / passo) * passo;
    x = (v: number) => esquerda + (v / topo) * w;
    marcas = Array.from({ length: topo / passo + 1 }, (_, i) => i * passo);
  }
  const altura = TOPO + linhas.length * ALTURA_LINHA + BASE;
  const rotuloMarca = (m: number) => String(m).replace(".", ",") + (formato === "x" ? "×" : "");
  // Rótulo do eixo some quando não cabe (celular): fica um sim, um não.
  const pulo = w / Math.max(1, marcas.length - 1) < 34 ? 2 : 1;

  const mostrar = (ev: React.MouseEvent | React.FocusEvent, l: LeituraReferencia, e: LinhaEditoria) => {
    setDica({
      ...posicaoNo(el, ev.currentTarget as Element),
      conteudo: (
        <>
          <b>{l.nome}</b> · {e.editoria}<br />
          {formatar(e[campo], formato)} · {e.posts} post(s)<br />
          <span className="text-muted">curtidas típicas {formatar(e.curtidasMed, "int")}</span>
        </>
      ),
    });
  };

  return (
    <div>
      <div ref={ref} className="relative w-full" onMouseLeave={() => setDica(null)}>
        {largura > 0 && (
          <svg width={largura} height={altura} role="img" aria-label={rotuloEixo + " por editoria, uma marca por referência"}>
            {marcas.map((m) => (
              <g key={m}>
                <line x1={x(m)} x2={x(m)} y1={TOPO} y2={altura - BASE} stroke={COR_GRADE} strokeWidth={1} />
                {marcas.indexOf(m) % pulo === 0 && <text x={x(m)} y={altura - BASE + 16} textAnchor="middle" fontSize={11} fill={COR_TEXTO}>{rotuloMarca(m)}</text>}
              </g>
            ))}
            {referencia != null && (
              <line x1={x(referencia)} x2={x(referencia)} y1={TOPO} y2={altura - BASE} stroke={COR_EIXO} strokeWidth={1.5} />
            )}
            {linhas.map((ed, i) => {
              const y = TOPO + i * ALTURA_LINHA + ALTURA_LINHA / 2;
              return (
                <g key={ed}>
                  <text x={esquerda - 10} y={y + 4} textAnchor="end" fontSize={12} fill={COR_TEXTO}>{ed}</text>
                  <line x1={esquerda} x2={esquerda + w} y1={y} y2={y} stroke={COR_GRADE} strokeWidth={1} strokeOpacity={0.6} />
                  {porLeitura.map(({ l, linhas: ls }, j) => {
                    const e = ls.find((z) => z.editoria === ed);
                    const v = e?.[campo];
                    if (!e || v == null) return null;
                    const c = cor(l.refId);
                    const desloc = (j - (porLeitura.length - 1) / 2) * 4.5; // separa pontos iguais
                    return (
                      <g key={l.id} tabIndex={0} className="cursor-pointer outline-none"
                        onMouseEnter={(ev) => mostrar(ev, l, e)} onFocus={(ev) => mostrar(ev, l, e)} onBlur={() => setDica(null)}
                        onClick={(ev) => mostrar(ev, l, e)}>
                        <circle cx={x(v)} cy={y + desloc} r={12} fill="transparent" />
                        <circle cx={x(v)} cy={y + desloc} r={5.5}
                          fill={e.posts < 3 ? COR_SUPERFICIE : c} stroke={e.posts < 3 ? c : COR_SUPERFICIE} strokeWidth={2} />
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        )}
        <DicaGrafico dica={dica} largura={largura} />
      </div>
      <Legenda itens={[
        ...leituras.map((l) => ({ nome: l.nome, cor: cor(l.refId) })),
        { nome: "menos de 3 posts", cor: COR_EIXO, vazada: true },
      ]} />
    </div>
  );
}
