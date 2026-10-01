/* Confirmação de exclusão com o impacto nos vínculos: lista o que está ligado
   ao registro e oferece excluir levando junto ou desvinculando (mantém os
   registros, só limpa a ligação). Sem vínculos, é uma confirmação simples. */
import { AcoesModal, Modal, RodapeModal } from "./Modal";
import { Botao } from "./ui/Botao";
import { Dica } from "./ui/Dica";
import type { DestinoVinculos, ImpactoExclusao } from "../store/vinculos";

interface Props {
  /** Título da entidade ("Projeto", "Edital"...). */
  titulo: string;
  /** Nome do registro, quando houver. */
  nome?: string;
  impacto: ImpactoExclusao;
  aoFechar: () => void;
  aoExcluir: (destino: DestinoVinculos) => void;
}

export function ModalExclusao({ titulo, nome, impacto, aoFechar, aoExcluir }: Props) {
  const temVinculos = impacto.vinculos.length > 0;
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
      <RodapeModal>
        <AcoesModal>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          {temVinculos && (
            <Botao variante="fantasma" onClick={() => aoExcluir("desvincular")}>Excluir e desvincular</Botao>
          )}
          <Botao variante="perigo" onClick={() => aoExcluir("junto")}>
            {temVinculos ? "Excluir levando junto" : "Excluir"}
          </Botao>
        </AcoesModal>
      </RodapeModal>
    </Modal>
  );
}
