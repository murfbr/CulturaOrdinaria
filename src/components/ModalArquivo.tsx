/* Modal que mostra um arquivo do Drive/Docs dentro do site, num iframe com o
   visualizador do Google. Usa o Overlay padrão (portal + fecha no clique fora);
   a caixa é mais larga e alta que a do Modal comum para o PDF caber. */
import { Overlay } from "./Modal";
import { Botao } from "./ui/Botao";

interface Props {
  titulo: string;
  /** Endereço original do link, para o botão "abrir no Drive". */
  href: string;
  /** Endereço de preview (de `urlDePreview`). */
  preview: string;
  aoFechar: () => void;
}

export function ModalArquivo({ titulo, href, preview, aoFechar }: Props) {
  return (
    <Overlay aoFechar={aoFechar}>
      <div className="flex w-full max-w-[1100px] flex-col border-rule border-solid border-ink bg-card p-4 shadow-hard md:px-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="m-0 min-w-0 flex-1 truncate font-display text-3xl font-normal">{titulo}</h3>
          <Botao variante="fantasma" tamanho="pequeno" href={href}>abrir no Drive ↗</Botao>
          <Botao variante="fantasma" tamanho="pequeno" onClick={aoFechar}>fechar</Botao>
        </div>
        <iframe src={preview} title={titulo} className="h-[78vh] w-full border border-solid border-line bg-bg" allow="autoplay" />
      </div>
    </Overlay>
  );
}
