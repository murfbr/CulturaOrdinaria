/* Modal padrão do site: overlay que fecha no clique fora + caixa com título.
   Todos os modais (edição de registro, regra, julgamento, confirmação de
   import) usam este componente.
   Ponte da migração: as classes "modal", "wide" e "mfoot" continuam no HTML
   porque o CSS antigo estiliza filhos por elas (.modal .hint, .mfoot .sp) nas
   telas que ainda não migraram. Saem na última etapa, junto com o CSS. */
import type { ReactNode } from "react";
import { cx } from "../utils/classes";

/** Fundo escuro que cobre a tela; fecha no clique fora do conteúdo. */
export function Overlay({ aoFechar, children }: { aoFechar: () => void; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-ink/45 px-3 py-6 md:px-4 md:py-10"
      onClick={(e) => { if (e.target === e.currentTarget) aoFechar(); }}
    >
      {children}
    </div>
  );
}

interface Props {
  titulo: ReactNode;
  aoFechar: () => void;
  /** Largura maior (680px em vez de 520px). */
  largo?: boolean;
  children: ReactNode;
}

export function Modal({ titulo, aoFechar, largo, children }: Props) {
  return (
    <Overlay aoFechar={aoFechar}>
      <div className={cx("modal w-full rounded-[14px] bg-white p-5 shadow-modal md:px-[22px]", largo ? "wide max-w-[680px]" : "max-w-[520px]")}>
        <h3 className="m-0 mb-3.5 text-lg font-bold">{titulo}</h3>
        {children}
      </div>
    </Overlay>
  );
}

/** Rodapé padrão do modal: excluir à esquerda, e as ações dentro de <AcoesModal> à direita. */
export function RodapeModal({ children }: { children: ReactNode }) {
  return <div className="mfoot mt-4 flex items-center gap-2">{children}</div>;
}

/** Grupo de botões alinhado à direita do rodapé. */
export function AcoesModal({ children }: { children: ReactNode }) {
  return <span className="ml-auto flex flex-wrap gap-2">{children}</span>;
}
