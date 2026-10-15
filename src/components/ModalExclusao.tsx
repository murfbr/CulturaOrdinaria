/* Confirmação de exclusão com o impacto nos vínculos: lista o que está ligado
   ao registro e oferece excluir levando junto ou desvinculando (mantém os
   registros, só limpa a ligação). Sem vínculos, é uma confirmação simples.
   Com `confirmarComTexto`, a pessoa precisa digitar a palavra para os botões
   de excluir liberarem (projeto). */
import { useState } from "react";
import { AcoesModal, Modal, RodapeModal } from "./Modal";
import { Botao } from "./ui/Botao";
import { Entrada } from "./ui/Campo";
import { Dica } from "./ui/Dica";
import type { DestinoVinculos, ImpactoExclusao } from "../store/vinculos";

interface Props {
  /** Título da entidade ("Projeto", "Edital"...). */
  titulo: string;
  /** Nome do registro, quando houver. */
  nome?: string;
  impacto: ImpactoExclusao;
  /** Palavra que a pessoa precisa digitar para liberar a exclusão (ex. "excluir"). */
  confirmarComTexto?: string;
  aoFechar: () => void;
  aoExcluir: (destino: DestinoVinculos) => void;
}

export function ModalExclusao({ titulo, nome, impacto, confirmarComTexto, aoFechar, aoExcluir }: Props) {
  const temVinculos = impacto.vinculos.length > 0;
  const [digitado, setDigitado] = useState("");
  const liberado = !confirmarComTexto || digitado.trim().toLowerCase() === confirmarComTexto.toLowerCase();
  return (
    <Modal titulo={"Excluir " + titulo.toLowerCase() + (nome ? ": " + nome : "") + "?"} aoFechar={aoFechar}>
      {temVinculos ? (
        <>
          <Dica emModal className="mb-3">Este registro tem vínculos:</Dica>
          <ul className="mb-3 mt-1.5 list-disc pl-[18px] text-sm text-muted [&_li]:my-0.5">
            {impacto.vinculos.map((v) => <li key={v}>{v}</li>)}
          </ul>
          <Dica emModal className="mb-3">
            <b className="text-ink">Levar junto</b> apaga também o que está listado.{" "}
            <b className="text-ink">Desvincular</b> mantém esses registros, só limpando a ligação.
          </Dica>
        </>
      ) : (
        <Dica emModal className="mb-3">Nenhum registro do Painel depende deste.</Dica>
      )}
      {impacto.notas.map((nota) => <Dica emModal className="mb-3" key={nota}>{nota}</Dica>)}
      {confirmarComTexto && (
        <label className="mb-1 block text-sm text-muted">
          Para confirmar, digite <b className="text-ink">{confirmarComTexto}</b>:
          <Entrada className="mt-1" value={digitado} autoFocus autoComplete="off" spellCheck={false}
            placeholder={confirmarComTexto} aria-label={"digite " + confirmarComTexto + " para confirmar"}
            onChange={(e) => setDigitado(e.target.value)} />
        </label>
      )}
      <RodapeModal>
        <AcoesModal>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          {temVinculos && (
            <Botao variante="fantasma" disabled={!liberado} onClick={() => aoExcluir("desvincular")}>Excluir e desvincular</Botao>
          )}
          <Botao variante="perigo" disabled={!liberado} onClick={() => aoExcluir("junto")}>
            {temVinculos ? "Excluir levando junto" : "Excluir"}
          </Botao>
        </AcoesModal>
      </RodapeModal>
    </Modal>
  );
}
