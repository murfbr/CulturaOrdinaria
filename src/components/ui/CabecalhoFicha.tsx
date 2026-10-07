/* Cabeçalho de ficha (artista, edital, projeto, reunião): "← Voltar", o selo
   com a inicial, o nome em letra de cartaz, o subtítulo, as ações à direita e
   as sub-abas com sublinhado vermelho. Fica preso no alto ao rolar, para o
   nome e as sub-abas não sumirem nas fichas longas. */
import type { ReactNode } from "react";
import { cx } from "../../utils/classes";
import { Selo } from "./Selo";

export interface SubAba { id: string; rotulo: ReactNode; n?: number }

interface Props {
  rotuloVoltar: string;
  aoVoltar: () => void;
  /** Inicial do nome no selo; sem ela o selo não aparece. */
  avatar?: ReactNode;
  titulo: ReactNode;
  sub?: ReactNode;
  acoes?: ReactNode;
  abas?: SubAba[];
  abaAtiva?: string;
  aoTrocarAba?: (id: string) => void;
}

export function CabecalhoFicha({ rotuloVoltar, aoVoltar, avatar, titulo, sub, acoes, abas, abaAtiva, aoTrocarAba }: Props) {
  return (
    <div className="sticky top-0 z-abas -mx-gutter mb-4 border-b border-line bg-bg/95 px-gutter pt-3 backdrop-blur-sm">
      <button type="button" className="mb-2 cursor-pointer border-0 bg-transparent p-0 text-lg font-semibold text-ink hover:text-accent" onClick={aoVoltar}>
        ← {rotuloVoltar}
      </button>
      <div className="flex flex-wrap items-center gap-4">
        {avatar != null && <Selo letra={String(avatar)} grande />}
        <div className="min-w-0 flex-1">
          <h2 className="m-0 truncate font-display text-5xl font-normal">{titulo}</h2>
          {sub && <div className="mt-1 text-lg text-muted">{sub}</div>}
        </div>
        {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
      </div>
      {abas && abas.length > 0 && (
        <SubAbas abas={abas} ativa={abaAtiva || abas[0].id} aoTrocar={aoTrocarAba || (() => {})} className="mt-3" />
      )}
    </div>
  );
}

/** Linha de sub-abas: a ativa em preto com sublinhado vermelho. Também serve solta (mesa de projetos). */
export function SubAbas({ abas, ativa, aoTrocar, className }: { abas: SubAba[]; ativa: string; aoTrocar: (id: string) => void; className?: string }) {
  return (
    <div className={cx("flex gap-1 overflow-x-auto", className)}>
      {abas.map((a) => (
        <button
          key={a.id} type="button"
          className={cx(
            "cursor-pointer whitespace-nowrap border-0 border-b-stamp border-solid bg-transparent px-3 py-2 text-lg",
            a.id === ativa ? "border-accent font-semibold text-ink" : "border-transparent text-muted hover:text-ink",
          )}
          onClick={() => aoTrocar(a.id)}
        >
          {a.rotulo}
          {a.n != null && a.n > 0 && (
            <span className="ml-1.5 rounded-pill bg-bg-sunk px-1.5 py-px align-[1px] font-mono text-2xs text-muted">{a.n}</span>
          )}
        </button>
      ))}
    </div>
  );
}
