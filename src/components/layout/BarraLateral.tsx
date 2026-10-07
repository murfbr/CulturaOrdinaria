/* Barra lateral do site: a marca em selo, a busca, os sete ambientes em
   grupos (Painel; Trabalho; Escrita) com o item ativo em vermelho, e no
   rodapé o status do banco, Exportar, Importar, o que ainda não chegou ao
   banco (quando há problema) e Sair. O botão Agenda mostra quantos prazos
   pedem atenção; Gestão avisa quando há dado no formato antigo. No celular
   vira uma faixa no topo com o botão ☰: o menu abre embaixo da faixa e
   fecha ao escolher um ambiente, no Esc ou no ✕. */
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Banco, type StatusSalvamento } from "../../services/banco";
import { sair } from "../../services/sessao";
import { usarCentral } from "../../store/central";
import { AMBIENTES, irParaAmbiente, usarNavegacao } from "../../store/navegacao";
import { abrirBusca } from "../BuscaGlobal";
import { contarUrgentes } from "../../lib/prazos";
import { cx } from "../../utils/classes";
import { Botao } from "../ui/Botao";
import { Rotulo } from "../ui/Rotulo";
import { Selo } from "../ui/Selo";
import { ModalExportar } from "../ferramentas/ModalExportar";
import { ModalImportar } from "../ferramentas/ModalImportar";
import { ModalGravacoes } from "./ModalGravacoes";

/** Os grupos do menu, por id de ambiente. O que não está aqui vai solto no topo. */
const GRUPOS: { rotulo: string; ids: string[] }[] = [
  { rotulo: "", ids: ["painel"] },
  { rotulo: "Trabalho", ids: ["cadastros", "projetos", "agenda", "pessoas", "gestao"] },
  { rotulo: "Escrita", ids: ["contexto"] },
];

/** Indicador de salvamento, sincronizado com a camada de armazenamento. */
export function usarStatusBanco(): StatusSalvamento {
  return useSyncExternalStore((cb) => Banco.aoMudarStatus(cb), () => Banco.statusAtual());
}

/** Cor da bolinha do status: cinza (local), verde (sincronizado), âmbar (sincronizando), vermelho (erro). */
const COR_STATUS: Record<StatusSalvamento["classe"], string> = {
  "": "bg-line-strong", ok: "bg-ok", sv: "bg-gold", er: "bg-accent",
};

type ModalAberto = "" | "exportar" | "importar" | "gravacoes";

/** Contador ao lado do nome do ambiente. */
function Marcador({ children, title, ativo }: { children: ReactNode; title?: string; ativo: boolean }) {
  return (
    <span
      className={cx("ml-auto rounded-pill px-1.5 py-px font-mono text-2xs", ativo ? "bg-card/20 text-on-fill" : "bg-accent text-on-fill")}
      title={title}
    >
      {children}
    </span>
  );
}

/** Botão só do celular (busca e ☰): quadrado com fio. */
const ESTILO_BOTAO_TOPO = "flex size-9 cursor-pointer items-center justify-center rounded-md border border-solid border-line-strong bg-card text-lg text-ink hover:border-ink md:hidden";

export function BarraLateral({ emailUsuario }: { emailUsuario: string | null }) {
  const nav = usarNavegacao();
  const { painel, legado } = usarCentral();
  const status = usarStatusBanco();
  const [modal, setModal] = useState<ModalAberto>("");
  const [aberto, setAberto] = useState(false);
  const urgentes = contarUrgentes(painel);
  const migrar = legado.candidaturas.length > 0 || legado.projetosV2 > 0;
  const problema = status.classe === "er";

  // Esc fecha o menu do celular.
  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [aberto]);

  const ir = (id: string) => { irParaAmbiente(id); setAberto(false); };
  const abrir = (m: ModalAberto) => { setModal(m); setAberto(false); };

  const item = (id: string) => {
    const a = AMBIENTES.find((x) => x.id === id);
    if (!a) return null;
    const ativo = a.id === nav.amb;
    return (
      <button
        key={a.id} type="button" aria-current={ativo || undefined}
        className={cx(
          "flex w-full cursor-pointer items-center gap-2 whitespace-nowrap rounded-md border-0 px-2.5 py-[5px] text-left text-lg transition-colors",
          ativo ? "bg-accent font-medium text-on-fill" : "bg-transparent text-ink hover:bg-bg-hover",
        )}
        onClick={() => ir(a.id)}
      >
        {a.rotulo}
        {a.id === "agenda" && urgentes > 0 && <Marcador ativo={ativo}>{urgentes}</Marcador>}
        {a.id === "gestao" && migrar && <Marcador ativo={ativo} title="migração v3 pendente">!</Marcador>}
      </button>
    );
  };

  return (
    <aside className="border-b border-line bg-bg-sunk md:sticky md:top-0 md:flex md:h-screen md:flex-col md:overflow-auto md:border-b-0 md:border-r">
      {/* Faixa do topo: no celular é tudo o que aparece com o menu fechado. */}
      <div className="flex items-center gap-3 px-4 py-3 md:pt-4 md:pb-0">
        <Selo letra="C" />
        <div className="min-w-0">
          <b className="block font-display text-3xl font-normal leading-tight">Cultura Ordinária</b>
          <Rotulo className="mt-0.5 text-muted">Central do Coletivo</Rotulo>
        </div>
        <button type="button" className={cx(ESTILO_BOTAO_TOPO, "ml-auto")} onClick={abrirBusca} title="Buscar em tudo (Ctrl+K)" aria-label="Buscar">🔍</button>
        <button type="button" className={ESTILO_BOTAO_TOPO} onClick={() => setAberto((v) => !v)} aria-expanded={aberto} aria-label={aberto ? "Fechar o menu" : "Abrir o menu"}>
          {aberto ? "✕" : "☰"}
        </button>
      </div>

      {/* O menu: no celular abre embaixo da faixa; no desktop está sempre à vista. */}
      <div className={cx("flex-col gap-4 px-4 pb-4 md:flex md:flex-1 md:pt-4", aberto ? "flex" : "hidden")}>
        <button
          type="button"
          className="hidden cursor-pointer items-center justify-between rounded-md border border-solid border-line-strong bg-card px-2.5 py-1.5 text-sm text-muted hover:border-ink hover:text-ink md:flex"
          onClick={abrirBusca} title="Buscar em tudo (Ctrl+K)"
        >
          <span>🔍 buscar</span>
          <span className="font-mono text-2xs uppercase text-faint">ctrl K</span>
        </button>

        <nav className="flex flex-col gap-2.5">
          {GRUPOS.map((g) => (
            <div key={g.rotulo || "topo"} className="grid gap-0.5">
              {g.rotulo && <Rotulo className="px-2.5 pb-1">{g.rotulo}</Rotulo>}
              {g.ids.map(item)}
            </div>
          ))}
        </nav>

        <div className="flex flex-col gap-2.5 border-t border-line pt-3 md:mt-auto md:border-t-0 md:pt-0">
          <button
            type="button"
            className={cx("flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-left text-sm", problema ? "text-accent hover:underline" : "text-muted")}
            onClick={() => problema && abrir("gravacoes")} title={problema ? "ver o que ainda não chegou ao banco" : status.texto}
          >
            <span className={cx("inline-block size-2.5 flex-none rounded-full", COR_STATUS[status.classe])} />
            <span className="min-w-0 truncate">{status.texto}</span>
          </button>
          <div className="flex gap-2">
            <Botao variante="fantasma" tamanho="pequeno" className="flex-1" onClick={() => abrir("exportar")}>Exportar</Botao>
            <Botao variante="fantasma" tamanho="pequeno" className="flex-1" onClick={() => abrir("importar")}>Importar</Botao>
          </div>
          {emailUsuario && (
            <button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-left text-xs text-faint hover:text-ink hover:underline" onClick={() => void sair()}>
              sair · {emailUsuario}
            </button>
          )}
        </div>
      </div>

      {modal === "exportar" && <ModalExportar aoFechar={() => setModal("")} />}
      {modal === "importar" && <ModalImportar aoFechar={() => setModal("")} />}
      {modal === "gravacoes" && <ModalGravacoes aoFechar={() => setModal("")} />}
    </aside>
  );
}
