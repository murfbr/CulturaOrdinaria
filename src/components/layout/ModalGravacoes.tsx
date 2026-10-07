/* O que ainda não chegou ao banco: aberto pelo menu de conta quando o status
   está em erro ("sem conexão" ou "erro ao gravar"). Separa o que o banco
   recusou (dado inválido: repetir não resolve) do que só está esperando rede,
   e oferece tentar de novo. Existe porque um aviso parado no topo foi
   confundido, por dias, com o antigo "sincronizando…" enquanto 5 fichas
   nunca subiam. */
import { useState, useSyncExternalStore } from "react";
import { Banco } from "../../services/banco";
import { ROTULO_COLECAO } from "../../types";
import { AcoesModal, Modal, RodapeModal } from "../Modal";
import { toast } from "../Toast";
import { Botao } from "../ui/Botao";
import { Tabela, Td, Th } from "../ui/Tabela";

const OUTRAS: Record<string, string> = {
  rascunhos: "Respostas de formulário", formularios: "Formulários", fichas: "Contexto (fichas)",
  regras: "Contexto (regras)", julgamentos: "Contexto (julgamentos)", lixeira: "Lixeira",
};
export const rotuloColecao = (c: string) => (ROTULO_COLECAO as Record<string, string>)[c] || OUTRAS[c] || c;

export function ModalGravacoes({ aoFechar }: { aoFechar: () => void }) {
  useSyncExternalStore((cb) => Banco.aoMudarFalhas(cb), () => Banco.versaoFalhas());
  const [tentando, setTentando] = useState(false);
  const falhas = Banco.falhas();
  const recusados = new Set(falhas.map((f) => f.colecao + "/" + f.id));
  const esperando = Banco.pendentesLocais().filter((p) => !recusados.has(p.colecao + "/" + p.id));

  async function tentar() {
    setTentando(true);
    const n = await Banco.tentarDeNovo();
    setTentando(false);
    const restam = Banco.pendentesLocais().length;
    toast(n === 0 ? "Nada esperando: tudo já está no banco." : restam ? `${restam} registro(s) ainda não subiram` : "Tudo enviado ao banco");
  }

  return (
    <Modal titulo="Gravações que ainda não chegaram ao banco" aoFechar={aoFechar} largo>
      {!falhas.length && !esperando.length && (
        <p className="m-0 text-sm">Nada pendente: tudo o que foi editado neste navegador já está no banco.</p>
      )}

      {falhas.length > 0 && (
        <>
          <p className="mb-3 mt-0 rounded-lg border border-gold bg-warn-soft px-3 py-2.5 text-sm text-warn-ink">
            O banco recusou {falhas.length} registro(s). Eles estão guardados <b>só neste navegador</b>: não limpe os dados
            do site nem troque de navegador até resolver. Tentar de novo não resolve sozinho; baixe um backup
            (Exportar) e mande para quem cuida do código.
          </p>
          <Tabela simples>
            <thead><tr><Th>Onde</Th><Th>Registro</Th><Th>Motivo</Th></tr></thead>
            <tbody>
              {falhas.map((f) => (
                <tr key={f.colecao + "/" + f.id}>
                  <Td>{rotuloColecao(f.colecao)}</Td>
                  <Td><b>{f.rotulo}</b> <span className="text-muted">({f.id})</span></Td>
                  <Td className="text-muted">{f.motivo}</Td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        </>
      )}

      {esperando.length > 0 && (
        <>
          <p className={falhas.length ? "mb-0 mt-4 text-sm" : "m-0 text-sm"}>
            {esperando.length} registro(s) editado(s) aqui ainda não foram confirmados pelo servidor
            (sem internet ou sessão expirada). Sobem sozinhos quando a conexão volta.
          </p>
          <ul className="mb-0 mt-1.5 pl-[18px] text-sm">
            {esperando.slice(0, 30).map((p) => (
              <li key={p.colecao + "/" + p.id}>{rotuloColecao(p.colecao)}: <b>{p.rotulo}</b> <span className="text-muted">({p.id})</span></li>
            ))}
            {esperando.length > 30 && <li className="text-muted">e mais {esperando.length - 30}</li>}
          </ul>
        </>
      )}

      <RodapeModal>
        <AcoesModal>
          <Botao variante="fantasma" onClick={aoFechar}>Fechar</Botao>
          {(falhas.length > 0 || esperando.length > 0) && (
            <Botao disabled={tentando} onClick={() => void tentar()}>
              {tentando ? "enviando…" : "Tentar de novo"}
            </Botao>
          )}
        </AcoesModal>
      </RodapeModal>
    </Modal>
  );
}
