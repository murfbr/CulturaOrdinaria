/* O que as sub-abas da ficha do artista compartilham: as props que a casca
   passa (o artista, o acervo `det` e a função que o altera), os ajudantes do
   texto "a | b | c" dos blocos editáveis, o aviso de bloco vazio e a linha
   com marca à esquerda (ano do portfólio, seta de link). */
import type { ReactNode } from "react";
import { Linha } from "../../../components/ui/Linha";
import { Vazio } from "../../../components/ui/Vazio";
import type { Artista, DetalheArtista } from "../../../types";
import { cx } from "../../../utils/classes";

export interface PropsAcervo {
  a: Artista;
  d: DetalheArtista;
  /** Toda edição do acervo passa por aqui: clona o artista, mexe no det, salva. */
  alterarDet: (mudar: (det: DetalheArtista) => void, rapido?: boolean) => void;
}

/** Quebra "a | b | c" nos pedaços, sem perder os do meio vazios. */
export const partes = (linha: string) => linha.split("|").map((x) => x.trim());
export const linhasDe = (texto: string) => texto.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

/** Aviso dos blocos editáveis sem conteúdo. */
export const VAZIO_ACERVO = <Vazio emLinha>nada registrado ainda — use o "editar" do bloco</Vazio>;

/** Linha de lista com uma marca laranja à esquerda: o ano (coluna fixa) ou a seta de um link (estreita). */
export function LinhaMarcada({ marca, estreita, children }: { marca: ReactNode; estreita?: boolean; children: ReactNode }) {
  return (
    <Linha compacta>
      <div className="flex gap-2.5">
        <span className={cx("flex-none text-xs font-bold text-accent", !estreita && "w-[46px]")}>{marca}</span>
        <span className="min-w-0">{children}</span>
      </div>
    </Linha>
  );
}
