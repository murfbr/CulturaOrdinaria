/* Cabeçalho do site, uma faixa só: a marca, os sete ambientes, a busca e o
   menu de conta (status do banco, exportar, importar, sair). O botão Agenda
   mostra quantos prazos pedem atenção (vencidos ou em até 7 dias); Gestão
   avisa quando há dado no formato antigo. No celular os ambientes descem
   para uma linha própria, que rola de lado. */
import { usarCentral } from "../../store/central";
import { AMBIENTES, irParaAmbiente, usarNavegacao } from "../../store/navegacao";
import { abrirBusca } from "../BuscaGlobal";
import { contarUrgentes } from "../../lib/prazos";
import { cx } from "../../utils/classes";
import { MenuConta } from "./MenuConta";

/** Contador vermelho ao lado do nome do ambiente. */
function Marcador({ children, title }: { children: React.ReactNode; title?: string }) {
  return <span className="ml-1.5 rounded-full bg-accent px-1.5 py-px align-[1px] text-3xs font-bold text-white" title={title}>{children}</span>;
}

export function Cabecalho({ emailUsuario }: { emailUsuario: string | null }) {
  const nav = usarNavegacao();
  const { painel, legado } = usarCentral();
  const urgentes = contarUrgentes(painel);
  const migrar = legado.candidaturas.length > 0 || legado.projetosV2 > 0;

  const ambientes = AMBIENTES.map((a) => (
    <button
      key={a.id} type="button"
      className={cx(
        "cursor-pointer whitespace-nowrap rounded-lg border-0 px-3 py-1.5 text-sm font-semibold transition-colors",
        a.id === nav.amb ? "bg-white/[.14] text-white" : "bg-transparent text-brand-soft hover:bg-brand-hover hover:text-white",
      )}
      onClick={() => irParaAmbiente(a.id)}
    >
      {a.rotulo}
      {a.id === "agenda" && urgentes > 0 && <Marcador>{urgentes}</Marcador>}
      {a.id === "gestao" && migrar && <Marcador title="migração v3 pendente">!</Marcador>}
    </button>
  ));

  return (
    <header className="bg-brand text-white">
      <div className="mx-auto flex max-w-site items-center gap-2 px-gutter py-2">
        <h1 className="m-0 mr-2 whitespace-nowrap text-lg font-bold tracking-[-.2px]">Central do Coletivo</h1>
        <nav className="hidden min-w-0 flex-1 gap-0.5 md:flex">{ambientes}</nav>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="cursor-pointer rounded-lg border border-solid border-brand-line bg-brand-hover px-[11px] py-1.5 text-xs font-semibold text-brand-soft transition-colors hover:border-white/45 hover:text-white"
            onClick={abrirBusca} title="Buscar em tudo (Ctrl+K)"
          >
            🔍 buscar <span className="ml-1 hidden rounded border border-solid border-white/25 px-[5px] py-px text-3xs font-bold uppercase tracking-[.4px] opacity-80 sm:inline">ctrl K</span>
          </button>
          <MenuConta emailUsuario={emailUsuario} />
        </div>
      </div>
      <nav className="flex gap-0.5 overflow-x-auto px-gutter pb-2 md:hidden">{ambientes}</nav>
    </header>
  );
}
