/* Peças comuns dos gráficos da Biblioteca: a largura do contêiner (o SVG é
   desenhado na largura real, sem esticar o texto), a dica que segue o mouse
   ou o toque, e a legenda com nome e bolinha. */
import { useEffect, useState, type ReactNode } from "react";
import { Bolinha } from "../Texto";

/** Largura atual do elemento (ResizeObserver). `ref` é de callback: mede também
    quando o contêiner aparece depois (dados que chegam do banco). */
export function usarLargura<T extends HTMLElement>(): { ref: (el: T | null) => void; el: T | null; largura: number } {
  const [el, setEl] = useState<T | null>(null);
  const [largura, setLargura] = useState(0);
  useEffect(() => {
    if (!el) return;
    const medir = () => setLargura(Math.floor(el.getBoundingClientRect().width));
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return { ref: setEl, el, largura };
}

/** Posição de um elemento do gráfico relativa ao contêiner (para a dica). */
export function posicaoNo(caixa: HTMLElement | null, alvo: Element): { x: number; y: number } {
  const c = caixa?.getBoundingClientRect();
  const a = alvo.getBoundingClientRect();
  return { x: a.left - (c?.left || 0), y: a.top - (c?.top || 0) };
}

export interface EstadoDica { x: number; y: number; conteudo: ReactNode }

/** Dica posicionada dentro do contêiner do gráfico (que precisa de `relative`). */
export function DicaGrafico({ dica, largura }: { dica: EstadoDica | null; largura: number }) {
  if (!dica) return null;
  const esquerda = Math.max(4, Math.min(dica.x + 12, largura - 244));
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-abas w-[240px] rounded-md border border-ink bg-card px-3 py-2 text-sm text-ink shadow-hard-sm"
      style={{ left: esquerda, top: Math.max(0, dica.y + 12) }}
    >
      {dica.conteudo}
    </div>
  );
}

export interface ItemLegenda { nome: string; cor: string; vazada?: boolean; losango?: boolean; linha?: boolean }

export function Legenda({ itens, className }: { itens: ItemLegenda[]; className?: string }) {
  return (
    <div className={"mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted " + (className || "")}>
      {itens.map((i) => (
        <span key={i.nome} className="inline-flex items-center gap-1.5">
          {i.losango
            ? <svg width={12} height={12} aria-hidden><path d="M6 1 L11 6 L6 11 L1 6 Z" fill="none" stroke={i.cor} strokeWidth={1.5} /></svg>
            : i.linha
              ? <svg width={16} height={12} aria-hidden><line x1={1} y1={11} x2={15} y2={1} stroke={i.cor} strokeWidth={1.5} /></svg>
              : <Bolinha cor={i.cor} vazada={i.vazada} />}
          {i.nome}
        </span>
      ))}
    </div>
  );
}

/** Marcas "redondas" para eixos: 1, 2, 5, 10, 20, 50... entre min e max. */
export function marcasLog(min: number, max: number): number[] {
  const saida: number[] = [];
  for (let e = Math.floor(Math.log10(min)); e <= Math.ceil(Math.log10(max)); e++) {
    for (const m of [1, 2, 5]) {
      const v = m * 10 ** e;
      if (v >= min && v <= max) saida.push(v);
    }
  }
  return saida;
}
