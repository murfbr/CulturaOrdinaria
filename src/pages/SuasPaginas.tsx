/* Casca de quem não tem módulo da Central (cliente, captador): a lista das
   páginas anexo que a conta abre, com o título do banco (presets/paginas)
   quando existe. Liga só `presets`, nada mais do coletivo. Também aparece
   quando a pessoa tenta um endereço de página que não está liberado. */
import { useEffect } from "react";
import { temModulo } from "../services/acesso";
import { sair } from "../services/sessao";
import { iniciarDados, usarCentral } from "../store/central";
import { Botao } from "../components/ui/Botao";
import { Dica } from "../components/ui/Dica";
import { Rotulo } from "../components/ui/Rotulo";
import { Selo } from "../components/ui/Selo";
import { moduloDaPagina } from "../types";
import { PAGINAS_PROPRIAS } from "./paginasProprias";

export function SuasPaginas({ emailUsuario, aviso }: { emailUsuario: string | null; aviso?: string }) {
  const { presets } = usarCentral();
  useEffect(() => { iniciarDados([]); }, []);
  const registro = presets.paginas?.paginas || [];
  const paginas = Object.entries(PAGINAS_PROPRIAS).filter(([slug]) => temModulo(moduloDaPagina(slug)));

  return (
    <div className="flex min-h-screen items-center justify-center px-gutter">
      <div className="w-full max-w-[520px] rounded-md border border-line bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <Selo letra="C" />
          <div>
            <b className="block font-display text-3xl font-normal leading-tight">Cultura Ordinária</b>
            <Rotulo className="text-muted">Central do Coletivo</Rotulo>
          </div>
        </div>
        <h1 className="m-0 mb-2 font-display text-4xl font-normal">Suas páginas</h1>
        {aviso && <Dica className="mb-3">{aviso}</Dica>}
        {paginas.length ? (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {paginas.map(([slug, p]) => (
              <li key={slug}>
                <a href={"/" + slug + "/"} className="flex items-center justify-between rounded-md border border-line px-3 py-2.5 text-lg text-ink no-underline hover:border-ink">
                  <span>{registro.find((r) => r.slug === slug)?.titulo || p.titulo}</span>
                  <span className="font-mono text-xs text-muted">/{slug}/ →</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-lg text-muted">Nenhuma página liberada para a sua conta ainda. Fale com quem coordena o coletivo.</p>
        )}
        {emailUsuario && (
          <div className="mt-5 flex items-center gap-3 border-t border-line pt-3 text-sm text-muted">
            <span className="min-w-0 truncate">{emailUsuario}</span>
            <Botao variante="fantasma" tamanho="pequeno" className="ml-auto" onClick={() => void sair()}>sair</Botao>
          </div>
        )}
      </div>
    </div>
  );
}
