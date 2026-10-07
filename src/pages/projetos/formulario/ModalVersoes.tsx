/* Versões do rascunho: as fotografias automáticas, com "ver" (o texto da
   versão) e "restaurar". Restaurar fotografa o estado atual antes de voltar —
   restaurar nunca destrói nada. */
import { Fragment, useEffect, useState } from "react";
import { AcoesModal, Modal, RodapeModal } from "../../../components/Modal";
import { toast } from "../../../components/Toast";
import { Botao } from "../../../components/ui/Botao";
import { Dica } from "../../../components/ui/Dica";
import { Linha } from "../../../components/ui/Linha";
import { salvarRascunho } from "../../../store/mutacoes";
import { comoTexto } from "../../../lib/simulador/motor";
import { fotografar, listarVersoes, type VersaoRascunho } from "../../../lib/simulador/versoes";
import { clonar, relativo } from "../../../utils";
import type { Rascunho } from "../../../types";

export function ModalVersoes({ rascunho: r, aoFechar }: { rascunho: Rascunho; aoFechar: () => void }) {
  const [versoes, setVersoes] = useState<VersaoRascunho[] | null>(null);
  const [vendo, setVendo] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);

  useEffect(() => {
    listarVersoes(r.id).then(setVersoes).catch(() => setVersoes([]));
  }, [r.id]);

  async function restaurar(v: VersaoRascunho) {
    await fotografar(r); // o estado atual vira uma versão antes de voltar no tempo
    const alvo = clonar(v.rascunho);
    salvarRascunho({ ...alvo, id: r.id, criado: r.criado, arquivado: r.arquivado }, true);
    toast("Versão restaurada — o estado que estava na tela virou uma versão nova");
    aoFechar();
  }

  const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <Modal titulo="Versões do rascunho" aoFechar={aoFechar} largo>
      <Dica emModal className="mb-3">
        Fotografias automáticas: ao abrir o rascunho, no máximo uma a cada 4 horas
        (até 20 por rascunho — as mais antigas caem). <b>Restaurar</b> fotografa o
        estado atual antes de voltar, então nada se perde.
      </Dica>

      {versoes === null && <Dica emModal>carregando versões…</Dica>}
      {versoes?.length === 0 && (
        <Dica emModal>Nenhuma versão ainda — a primeira nasce na próxima abertura do rascunho com conteúdo.</Dica>
      )}

      <div>
        {(versoes || []).map((v) => (
          <Fragment key={v.id}>
            <Linha
              direita={<>
                <Botao variante="fantasma" tamanho="pequeno" onClick={() => setVendo(vendo === v.id ? null : v.id)}>
                  {vendo === v.id ? "fechar" : "ver"}
                </Botao>
                <Botao tamanho="pequeno" onClick={() => (confirmando === v.id ? void restaurar(v) : setConfirmando(v.id))}>
                  {confirmando === v.id ? "Confirmar restauração" : "Restaurar"}
                </Botao>
              </>}
            >
              <b>{quando(v.criadoEm)}</b>{" "}
              <span className="text-muted">{relativo(v.criadoEm)}{v.autor ? " · " + v.autor : ""}</span>
            </Linha>
            {vendo === v.id && (
              <pre className="mb-2 mt-0 max-h-[300px] overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-bg px-3 py-2.5 font-sans text-xs leading-[1.55]">
                {comoTexto(v.rascunho) || "(vazio)"}
              </pre>
            )}
          </Fragment>
        ))}
      </div>

      <RodapeModal>
        <AcoesModal><Botao variante="fantasma" onClick={aoFechar}>Fechar</Botao></AcoesModal>
      </RodapeModal>
    </Modal>
  );
}
