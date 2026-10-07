/* Menu de conta, no canto do cabeçalho: a bolinha do status do banco, o
   texto do status, o e-mail de quem está logado, Exportar, Importar, o que
   ainda não chegou ao banco (quando há problema) e Sair. Substitui a antiga
   barra de ferramentas e a linha de status embaixo da marca. */
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Banco, type StatusSalvamento } from "../../services/banco";
import { sair } from "../../services/sessao";
import { cx } from "../../utils/classes";
import { ModalExportar } from "../ferramentas/ModalExportar";
import { ModalImportar } from "../ferramentas/ModalImportar";
import { ModalGravacoes } from "./ModalGravacoes";

/** Indicador de salvamento, sincronizado com a camada de armazenamento. */
export function usarStatusBanco(): StatusSalvamento {
  return useSyncExternalStore((cb) => Banco.aoMudarStatus(cb), () => Banco.statusAtual());
}

/** Cor da bolinha do status: cinza (local), verde (sincronizado), dourado (sincronizando), laranja (erro). */
const COR_STATUS: Record<StatusSalvamento["classe"], string> = {
  "": "bg-brand-faint", ok: "bg-ok", sv: "bg-gold", er: "bg-accent",
};

type ModalAberto = "" | "exportar" | "importar" | "gravacoes";

function Item({ sub, children, ...resto }: { sub?: ReactNode; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      className="flex w-full cursor-pointer flex-col items-start rounded-md border-0 bg-transparent px-2.5 py-2 text-left text-sm font-medium text-ink hover:bg-accent-soft hover:text-accent-ink"
      {...resto}
    >
      {children}
      {sub && <small className="text-xs font-normal text-faint">{sub}</small>}
    </button>
  );
}

export function MenuConta({ emailUsuario }: { emailUsuario: string | null }) {
  const status = usarStatusBanco();
  const [aberto, setAberto] = useState(false);
  const [modal, setModal] = useState<ModalAberto>("");
  const caixa = useRef<HTMLDivElement>(null);
  const problema = status.classe === "er";

  // Fecha no clique fora e no Esc.
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (!caixa.current?.contains(e.target as Node)) setAberto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc); };
  }, [aberto]);

  const abrir = (m: ModalAberto) => { setAberto(false); setModal(m); };

  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        className={cx(
          "flex cursor-pointer items-center gap-2 rounded-lg border border-solid border-brand-line bg-brand-hover px-2.5 py-1.5 text-xs font-semibold text-brand-soft transition-colors hover:border-white/45 hover:text-white",
          problema && "text-accent-light",
        )}
        onClick={() => setAberto((v) => !v)} title={status.texto} aria-expanded={aberto}
      >
        <span className={cx("inline-block size-2 rounded-full", COR_STATUS[status.classe])} />
        <span className="max-w-[160px] truncate">{problema ? status.texto : emailUsuario ? emailUsuario.split("@")[0] : "conta"}</span>
        <span className="text-3xs opacity-70">▼</span>
      </button>

      {aberto && (
        <div className="absolute right-0 top-full z-menu mt-1 w-72 rounded-xl border border-line bg-card p-1 text-ink shadow-menu">
          <div className="px-2.5 py-2 text-xs text-muted">
            <div className="flex items-center gap-1.5">
              <span className={cx("inline-block size-2 rounded-full", COR_STATUS[status.classe])} />
              {status.texto}
            </div>
            {emailUsuario && <div className="mt-0.5 truncate text-faint">{emailUsuario}</div>}
            {Banco.modo === "local" && (
              <div className="mt-1.5 text-faint">Sem Firebase configurado: tudo fica salvo só neste navegador.</div>
            )}
          </div>
          {problema && <Item onClick={() => abrir("gravacoes")} sub="o que o banco recusou ou espera rede">⚠ Ver o que não chegou ao banco</Item>}
          <div className="my-1 border-t border-line" />
          <Item onClick={() => abrir("exportar")} sub="backup completo ou planilhas por coleção">⤓ Exportar dados</Item>
          <Item onClick={() => abrir("importar")} sub=".json da Central ou planilha .csv, com prévia">⤒ Importar dados</Item>
          {emailUsuario && (
            <>
              <div className="my-1 border-t border-line" />
              <Item onClick={() => void sair()}>Sair</Item>
            </>
          )}
        </div>
      )}

      {modal === "exportar" && <ModalExportar aoFechar={() => setModal("")} />}
      {modal === "importar" && <ModalImportar aoFechar={() => setModal("")} />}
      {modal === "gravacoes" && <ModalGravacoes aoFechar={() => setModal("")} />}
    </div>
  );
}
