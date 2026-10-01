/* Moldura dos modais do artefato: título, fechar, corpo em duas colunas,
   rodapé com a auditoria, Excluir (dois cliques), Cancelar e Salvar. O
   conteúdo é um <form>: Enter salva. Esc e clique fora fecham. */
import { useEffect, type FormEvent, type ReactNode } from "react";
import { Botao } from "./Botao";
import { BotaoArmado } from "./BotaoArmado";

interface Props {
  titulo: string;
  auditoria?: string;
  aoFechar: () => void;
  aoSalvar: () => void;
  /** Com excluir, aparece o botão à esquerda (dois cliques). */
  aoExcluir?: () => void;
  children: ReactNode;
}

/** Faz o campo ocupar as duas colunas do corpo do modal. */
export const LINHA_INTEIRA = "cdf:md:col-span-2";

export function Modal({ titulo, auditoria, aoFechar, aoSalvar, aoExcluir, children }: Props) {
  useEffect(() => {
    const tecla = (ev: KeyboardEvent) => { if (ev.key === "Escape") aoFechar(); };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aoFechar]);

  function enviar(ev: FormEvent) { ev.preventDefault(); aoSalvar(); }

  return (
    <div
      className="cdf:fixed cdf:inset-0 cdf:z-50 cdf:flex cdf:items-center cdf:justify-center cdf:bg-[rgba(9,12,38,.55)] cdf:p-3"
      onClick={(e) => { if (e.target === e.currentTarget) aoFechar(); }}
    >
      <form
        onSubmit={enviar} noValidate role="dialog" aria-modal="true" aria-labelledby="cdf-modal-titulo"
        className="cdf:flex cdf:max-h-[calc(100dvh-32px)] cdf:w-[min(760px,100%)] cdf:flex-col cdf:rounded-[14px] cdf:bg-superficie cdf:text-tinta cdf:shadow-card"
      >
        <header className="cdf:flex cdf:items-center cdf:gap-3 cdf:border-b cdf:border-solid cdf:border-linha cdf:px-6 cdf:py-[18px]">
          <h2 id="cdf-modal-titulo" className="cdf:m-0 cdf:font-display cdf:text-[26px] cdf:font-black cdf:leading-[1.1] cdf:text-primaria">{titulo}</h2>
          <button
            type="button" onClick={aoFechar} aria-label="Fechar"
            className="cdf:ml-auto cdf:cursor-pointer cdf:rounded-md cdf:border-0 cdf:bg-transparent cdf:px-1.5 cdf:py-0.5 cdf:text-[26px] cdf:leading-none cdf:text-tinta-2"
          >
            ×
          </button>
        </header>
        <div className="cdf:grid cdf:grid-cols-1 cdf:gap-x-4 cdf:gap-y-3.5 cdf:overflow-y-auto cdf:px-6 cdf:py-5 cdf:md:grid-cols-2">{children}</div>
        <footer className="cdf:border-t cdf:border-solid cdf:border-linha cdf:px-6 cdf:py-3.5">
          {auditoria && <p className="cdf:m-0 cdf:mb-2.5 cdf:text-[13px] cdf:text-fraco">{auditoria}</p>}
          <div className="cdf:flex cdf:items-center cdf:gap-2">
            {aoExcluir && <BotaoArmado variante="perigo" confirmar="Confirmar exclusão" onClick={aoExcluir}>Excluir</BotaoArmado>}
            <span className="cdf:flex-1" />
            <Botao onClick={aoFechar}>Cancelar</Botao>
            <Botao type="submit" variante="primario">Salvar</Botao>
          </div>
        </footer>
      </form>
    </div>
  );
}
