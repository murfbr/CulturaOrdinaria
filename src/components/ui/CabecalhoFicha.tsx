/* Cabeçalho de ficha (artista, edital, projeto, reunião): "voltar", avatar com
   a inicial, nome, subtítulo, ações à direita e as sub-abas. Fica preso no
   alto ao rolar, logo abaixo da barra de abas do ambiente, para o nome e as
   sub-abas não sumirem nas fichas longas. */
import type { ReactNode } from "react";
import { cx } from "../../utils/classes";

export interface SubAba { id: string; rotulo: ReactNode; n?: number }

interface Props {
  rotuloVoltar: string;
  aoVoltar: () => void;
  /** Inicial ou ícone do avatar; sem ele o avatar não aparece. */
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
    <div className="sticky top-[45px] z-abas -mx-gutter mb-4 border-b border-line bg-bg/95 px-gutter pt-3 backdrop-blur-sm">
      <button type="button" className="mb-1 cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-accent hover:underline" onClick={aoVoltar}>
        ← {rotuloVoltar}
      </button>
      <div className="flex flex-wrap items-center gap-3">
        {avatar != null && (
          <div className="flex size-11 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-accent to-gold text-xl font-extrabold text-white">
            {avatar}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="m-0 truncate text-2xl font-bold leading-tight">{titulo}</h2>
          {sub && <div className="mt-0.5 text-sm text-muted">{sub}</div>}
        </div>
        {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
      </div>
      {abas && abas.length > 0 && (
        <SubAbas abas={abas} ativa={abaAtiva || abas[0].id} aoTrocar={aoTrocarAba || (() => {})} className="mt-2" />
      )}
    </div>
  );
}

/** Linha de sub-abas com traço embaixo. Também serve solta (abas da mesa de projetos). */
export function SubAbas({ abas, ativa, aoTrocar, className }: { abas: SubAba[]; ativa: string; aoTrocar: (id: string) => void; className?: string }) {
  return (
    <div className={cx("flex gap-1 overflow-x-auto", className)}>
      {abas.map((a) => (
        <button
          key={a.id} type="button"
          className={cx(
            "cursor-pointer whitespace-nowrap border-0 border-b-2 border-solid bg-transparent px-[11px] py-2 text-sm font-semibold",
            a.id === ativa ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink",
          )}
          onClick={() => aoTrocar(a.id)}
        >
          {a.rotulo}
          {a.n != null && a.n > 0 && (
            <span className="ml-1.5 rounded-full bg-sand px-1.5 py-px align-[1px] text-3xs font-bold text-muted">{a.n}</span>
          )}
        </button>
      ))}
    </div>
  );
}
