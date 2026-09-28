/* Cabeçalho do site: marca, indicador "salvo às..." (ligado direto no Banco),
   botão sair, busca global e a navegação entre os sete ambientes — o botão
   Agenda mostra quantos prazos pedem atenção (vencidos ou em até 7 dias).
   No celular a navegação desce para uma linha própria, abaixo da marca. */
import { useState, useSyncExternalStore } from "react";
import { Banco, type StatusSalvamento } from "../../services/banco";
import { sair } from "../../services/sessao";
import { usarCentral } from "../../store/central";
import { AMBIENTES, irParaAmbiente, usarNavegacao } from "../../store/navegacao";
import { abrirBusca } from "../BuscaGlobal";
import { contarUrgentes } from "../../lib/prazos";
import { cx } from "../../utils/classes";
import { ModalGravacoes } from "./ModalGravacoes";

/** Indicador de salvamento, sincronizado com a camada de armazenamento. */
function usarStatusBanco(): StatusSalvamento {
  return useSyncExternalStore(
    (cb) => Banco.aoMudarStatus(cb),
    () => Banco.statusAtual(),
  );
}

/** Cor da bolinha do status: cinza (local), verde (sincronizado), dourado (sincronizando), laranja (erro). */
const COR_STATUS: Record<StatusSalvamento["classe"], string> = {
  "": "bg-brand-faint", ok: "bg-ok", sv: "bg-gold", er: "bg-accent",
};

/** Contador vermelho ao lado do nome do ambiente. */
function Marcador({ children, title }: { children: React.ReactNode; title?: string }) {
  return <span className="ml-1.5 rounded-full bg-accent px-1.5 py-px align-[1px] text-3xs font-bold text-white" title={title}>{children}</span>;
}

export function Cabecalho({ emailUsuario }: { emailUsuario: string | null }) {
  const nav = usarNavegacao();
  const status = usarStatusBanco();
  const { painel, legado } = usarCentral();
  const urgentes = contarUrgentes(painel);
  const migrar = legado.candidaturas.length > 0 || legado.projetosV2 > 0;
  const [verGravacoes, setVerGravacoes] = useState(false);
  // Aviso vermelho (sem conexão, erro ao gravar) vira link para ver o que está pendente.
  const problema = status.classe === "er";

  return (
    <header className="bg-brand text-white">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-end gap-4 px-[18px] pt-4">
        <div>
          <h1 className="m-0 text-xl font-bold tracking-[-.2px]">Central do Coletivo</h1>
          <p className="m-0 mt-0.5 text-xs text-brand-soft">
            <span className={cx("mr-1.5 inline-block h-[7px] w-[7px] rounded-full align-middle", COR_STATUS[status.classe])} />
            {problema
              ? (
                <button
                  className="cursor-pointer border-0 bg-transparent p-0 text-xs text-[#FFB9A3] underline hover:text-white"
                  onClick={() => setVerGravacoes(true)} title="ver o que ainda não chegou ao banco"
                >
                  {status.texto} · ver
                </button>
              )
              : <span>{status.texto}</span>} · captação, escrita e contexto dos projetos culturais
            {emailUsuario && (
              <button className="ml-2 cursor-pointer border-0 bg-transparent p-0 text-2xs text-brand-soft underline hover:text-white" onClick={() => void sair()}>
                sair ({emailUsuario})
              </button>
            )}
          </p>
        </div>
        <div className="mt-1.5 flex w-full flex-wrap gap-0.5 md:ml-auto md:mt-0 md:w-auto">
          <button
            className="mr-2 cursor-pointer self-center rounded-lg border border-solid border-white/20 bg-white/[.07] px-[11px] py-1.5 text-xs font-semibold text-brand-soft transition-colors hover:border-white/45 hover:text-white"
            onClick={abrirBusca} title="Buscar em tudo (Ctrl+K)"
          >
            🔍 buscar <span className="ml-1 rounded border border-solid border-white/25 px-[5px] py-px text-3xs font-bold uppercase tracking-[.4px] opacity-80">ctrl K</span>
          </button>
          {AMBIENTES.map((a) => (
            <button
              key={a.id}
              className={cx(
                "cursor-pointer rounded-t-[9px] border-0 px-3.5 py-[9px] text-sm font-semibold transition-colors",
                a.id === nav.amb ? "bg-bg text-brand" : "bg-transparent text-brand-soft hover:text-white",
              )}
              onClick={() => irParaAmbiente(a.id)}
            >
              {a.rotulo}
              {a.id === "agenda" && urgentes > 0 && <Marcador>{urgentes}</Marcador>}
              {a.id === "gestao" && migrar && <Marcador title="migração v3 pendente">!</Marcador>}
            </button>
          ))}
        </div>
      </div>
      {verGravacoes && <ModalGravacoes aoFechar={() => setVerGravacoes(false)} />}
    </header>
  );
}
