/* Barra de abas do ambiente ativo. Em Gestão, a aba "Migração v3" só
   aparece enquanto houver dado no formato antigo (ou quando já está aberta). */
import { usarCentral } from "../../store/central";
import { ambienteDe, irParaAba, usarNavegacao } from "../../store/navegacao";

export function BarraAbas() {
  const nav = usarNavegacao();
  const { legado } = usarCentral();
  const ambiente = ambienteDe(nav.amb);
  const pendente = legado.candidaturas.length > 0 || legado.projetosV2 > 0;

  return (
    <nav className="tabs">
      <div className="tabs-in">
        {ambiente.abas
          .filter(([id]) => id !== "migracao" || pendente || nav.aba === "migracao")
          .map(([id, rotulo]) => (
            <button key={id} className={id === nav.aba ? "on" : ""} onClick={() => irParaAba(id)}>
              {rotulo}{id === "migracao" && pendente && <span className="amb-badge">!</span>}
            </button>
          ))}
      </div>
    </nav>
  );
}
