/* Cabeçalho da página: a data em mono, o nome do ambiente em letra de cartaz
   e as abas do ambiente ao lado, tudo fechado por uma régua preta; a aba
   ativa tem a barra vermelha sobre a régua. Em Gestão, a aba "Migração v3"
   só aparece enquanto houver dado no formato antigo (ou quando já está
   aberta). Em Páginas anexo, depois das abas vem uma aba por página do
   registro em código: é um link que sai da Central para /<slug>/ (as páginas
   têm "← Central" de volta). No celular as abas descem e rolam de lado. */
import { temModulo, usarAcesso } from "../../services/acesso";
import { usarCentral } from "../../store/central";
import { ambienteDe, irParaAba, usarNavegacao } from "../../store/navegacao";
import { PAGINAS_PROPRIAS } from "../../pages/paginasProprias";
import { moduloDaPagina } from "../../types";
import { cx } from "../../utils/classes";
import { Rotulo } from "../ui/Rotulo";

const dataDeHoje = () => new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "long" });

const ESTILO_ABA = "cursor-pointer whitespace-nowrap border-0 border-b-stamp border-solid bg-transparent px-3 pb-2.5 pt-2 text-lg";

export function CabecalhoPagina() {
  const nav = usarNavegacao();
  const { legado, presets } = usarCentral();
  usarAcesso(); // redesenha quando o acesso muda
  const ambiente = ambienteDe(nav.amb);
  const pendente = legado.candidaturas.length > 0 || legado.projetosV2 > 0;
  const abas = ambiente.abas.filter(([id]) => id !== "migracao" || pendente || nav.aba === "migracao");
  // As páginas anexo que a conta abre: título do banco (presets/paginas) quando existe, senão o de reserva.
  const paginas = ambiente.id === "anexos"
    ? Object.entries(PAGINAS_PROPRIAS)
      .filter(([slug]) => temModulo(moduloDaPagina(slug)))
      .map(([slug, p]) => [slug, presets.paginas?.paginas.find((r) => r.slug === slug)?.titulo || p.titulo] as [string, string])
    : [];

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
                ESTILO_ABA, "disabled:cursor-default disabled:opacity-40",
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
          {paginas.map(([slug, titulo]) => (
            <a key={slug} href={"/" + slug + "/"} title={"abrir /" + slug + "/"}
              className={cx(ESTILO_ABA, "border-transparent text-muted no-underline hover:text-ink")}>
              {titulo} ↗
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
