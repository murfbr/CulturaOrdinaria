/* Modal padrão do site: overlay que fecha no clique fora + caixa com moldura
   preta, sombra dura deslocada (o único lugar do site com sombra) e título em
   letra de cartaz. Todos os modais (edição de registro, regra, julgamento,
   confirmação de import) usam este componente. */
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "../utils/classes";

/** Fundo escuro que cobre a tela; fecha no clique fora do conteúdo.
    Vai para o <body> por portal: dentro da barra lateral (sticky) ou de qualquer
    outro bloco com contexto de empilhamento próprio, o z-index do overlay não
    valeria contra o resto da página e os cartões ficavam por cima do modal. */
export function Overlay({ aoFechar, children }: { aoFechar: () => void; children: ReactNode }) {
  return createPortal(
    <div
      className="fixed inset-0 z-modal flex items-start justify-center overflow-auto bg-overlay px-3 py-6 md:px-4 md:py-10"
      onClick={(e) => { if (e.target === e.currentTarget) aoFechar(); }}
    >
      {children}
    </div>,
    document.body,
  );
}

interface Props {
  titulo: ReactNode;
  aoFechar: () => void;
  /** Largura maior (780px em vez de 560px). */
  largo?: boolean;
  children: ReactNode;
}

export function Modal({ titulo, aoFechar, largo, children }: Props) {
  return (
    <Overlay aoFechar={aoFechar}>
      <div className={cx("w-full border-rule border-solid border-ink bg-card p-6 shadow-hard md:px-8", largo ? "max-w-[780px]" : "max-w-[560px]")}>
        <h3 className="m-0 mb-4 font-display text-5xl font-normal">{titulo}</h3>
        {children}
      </div>
    </Overlay>
  );
}

/** Rodapé padrão do modal: excluir à esquerda, e as ações dentro de <AcoesModal> à direita. */
export function RodapeModal({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex items-center gap-2">{children}</div>;
}

/** Grupo de botões alinhado à direita do rodapé. */
export function AcoesModal({ children }: { children: ReactNode }) {
  return <span className="ml-auto flex flex-wrap gap-2">{children}</span>;
}
