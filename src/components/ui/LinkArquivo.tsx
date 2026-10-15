/* Link de arquivo externo. Se for arquivo do Drive/Docs, o clique simples abre
   o visualizador num modal do site; qualquer outro link (ou ctrl+clique e botão
   do meio) abre em aba nova, como o <a target="_blank"> de sempre. */
import { useState, type AnchorHTMLAttributes, type MouseEvent } from "react";
import { ModalArquivo } from "../ModalArquivo";
import { urlDePreview } from "../../utils/drive";

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  /** Título do modal; sem ele usa o texto do link ou o endereço. */
  titulo?: string;
}

export function LinkArquivo({ href, titulo, children, onClick, ...resto }: Props) {
  const [aberto, setAberto] = useState(false);
  const preview = urlDePreview(href);

  function clicar(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (!preview || e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    setAberto(true);
  }

  const rotulo = titulo || (typeof children === "string" ? children : href);
  return (
    <>
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={clicar} {...resto}>{children}</a>
      {aberto && preview && <ModalArquivo titulo={rotulo} href={href} preview={preview} aoFechar={() => setAberto(false)} />}
    </>
  );
}
