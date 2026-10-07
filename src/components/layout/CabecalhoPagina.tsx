/* Cabeçalho da página: a data em mono, o nome do ambiente em letra de cartaz
   e as abas do ambiente ao lado, tudo fechado por uma régua preta; a aba
   ativa tem a barra vermelha sobre a régua. Em Gestão, a aba "Migração v3"
   só aparece enquanto houver dado no formato antigo (ou quando já está
   aberta). No celular as abas descem e rolam de lado. */
import { usarCentral } from "../../store/central";
import { ambienteDe, irParaAba, usarNavegacao } from "../../store/navegacao";
import { cx } from "../../utils/classes";
import { Rotulo } from "../ui/Rotulo";

const dataDeHoje = () => new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "long" });

export function CabecalhoPagina() {
  const nav = usarNavegacao();
  const { legado } = usarCentral();
  const ambiente = ambienteDe(nav.amb);
  const pendente = legado.candidaturas.length > 0 || legado.projetosV2 > 0;
  const abas = ambiente.abas.filter(([id]) => id !== "migracao" || pendente || nav.aba === "migracao");

  return (
    <header className="border-b-rule border-ink pt-4 md:pt-5">
      <Rotulo className="mb-1">{dataDeHoje()}</Rotulo>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:gap-8">
        <h1 className="m-0 font-display text-6xl font-normal">{ambiente.rotulo}</h1>
        <nav className="-mb-[2px] flex gap-1 overflow-x-auto">
          {abas.map(([id, rotulo]) => (
            <button
              key={id} type="button"
              className={cx(
                "cursor-pointer whitespace-nowrap border-0 border-b-stamp border-solid bg-transparent px-3 pb-2.5 pt-2 text-lg disabled:cursor-default disabled:opacity-40",
                id === nav.aba ? "border-accent font-semibold text-ink" : "border-transparent text-muted hover:text-ink",
              )}
              onClick={() => irParaAba(id)}
            >
              {rotulo}
              {id === "migracao" && pendente && (
                <span className="ml-1.5 rounded-pill bg-accent px-1.5 py-px font-mono text-2xs text-on-fill">!</span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
