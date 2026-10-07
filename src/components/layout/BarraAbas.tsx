/* Barra de abas do ambiente ativo, presa no alto ao rolar. Em Gestão, a aba
   "Migração v3" só aparece enquanto houver dado no formato antigo (ou quando
   já está aberta). No celular as abas rolam de lado. */
import { usarCentral } from "../../store/central";
import { ambienteDe, irParaAba, usarNavegacao } from "../../store/navegacao";
import { cx } from "../../utils/classes";

export function BarraAbas() {
  const nav = usarNavegacao();
  const { legado } = usarCentral();
  const ambiente = ambienteDe(nav.amb);
  const pendente = legado.candidaturas.length > 0 || legado.projetosV2 > 0;

  return (
    <nav className="sticky top-0 z-abas border-b border-line bg-bg">
      <div className="mx-auto flex max-w-site gap-0.5 overflow-x-auto px-gutter">
        {ambiente.abas
          .filter(([id]) => id !== "migracao" || pendente || nav.aba === "migracao")
          .map(([id, rotulo]) => (
            <button
              key={id} type="button"
              className={cx(
                "cursor-pointer whitespace-nowrap border-0 border-b-2 border-solid bg-transparent px-3.5 py-3 text-sm font-semibold disabled:cursor-default disabled:opacity-40",
                id === nav.aba ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink",
              )}
              onClick={() => irParaAba(id)}
            >
              {rotulo}
              {id === "migracao" && pendente && (
                <span className="ml-1.5 rounded-full bg-accent px-1.5 py-px align-[1px] text-3xs font-bold text-white">!</span>
              )}
            </button>
          ))}
      </div>
    </nav>
  );
}
