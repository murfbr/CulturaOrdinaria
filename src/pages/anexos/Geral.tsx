/* Páginas anexo, aba Geral: um cartão por página registrada em código, com o
   título do banco (presets/paginas) quando existe, o endereço e os projetos
   da Central que apontam para ela (Projeto.paginaSlug). Abrir leva para a
   página, fora da casca da Central. Página anexo é projeto ou braço contínuo
   do coletivo, sem prazo para acabar; a seção Projetos é para o que tem
   início, meio e fim. */
import { usarCentral } from "../../store/central";
import { abrirProjeto } from "../../store/navegacao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { CartaoLista } from "../../components/ui/CartaoLista";
import { Dica } from "../../components/ui/Dica";
import { Grade } from "../../components/ui/Grade";
import { ESTILO_LINK } from "../../components/ui/estilos";
import { temModulo } from "../../services/acesso";
import { moduloDaPagina } from "../../types";
import { PAGINAS_PROPRIAS } from "../paginasProprias";

export function GeralAnexos() {
  const { painel, presets } = usarCentral();
  const registro = presets.paginas?.paginas || [];

  return (
    <>
      <CabecalhoSecao titulo="Geral" sub="projetos ou braços contínuos do coletivo, sem prazo para acabar, cada um com página e acompanhamento próprios" />

      <Grade colunas="auto">
        {Object.entries(PAGINAS_PROPRIAS).filter(([slug]) => temModulo(moduloDaPagina(slug))).map(([slug, p]) => {
          const noBanco = registro.find((r) => r.slug === slug);
          const projetos = painel.projetos.filter((x) => x.paginaSlug === slug && !x.arquivado);
          return (
            <CartaoLista key={slug} titulo={noBanco?.titulo || p.titulo} sub={"/" + slug + "/"}
              aoAbrir={() => { window.location.href = "/" + slug + "/"; }} rotuloAbrir="abrir a página →"
              rodape={<span>{projetos.length ? projetos.length + (projetos.length === 1 ? " projeto ligado" : " projetos ligados") : "nenhum projeto ligado"}</span>}>
              {projetos.length > 0 && (
                <ul className="m-0 list-none p-0 text-sm">
                  {projetos.map((x) => (
                    <li key={x.id}>
                      <a href="#" className={ESTILO_LINK} onClick={(e) => { e.preventDefault(); e.stopPropagation(); abrirProjeto(x.id); }}>{x.nome}</a>
                    </li>
                  ))}
                </ul>
              )}
            </CartaoLista>
          );
        })}
      </Grade>

      <Dica>Página nova nasce pelo Modelo: a pessoa monta no Claude dela, a equipe técnica verifica e transforma. Um projeto com início, meio e fim que pertence a uma página anexo aponta para ela na ficha (Dados do projeto → Página anexo).</Dica>
    </>
  );
}
