/* Captação · Portfólio: os projetos que o coletivo oferece às empresas, um
   cartão por projeto com as cotas dele. É o material que a captadora mostra. */
import { usarCentral } from "../../store/central";
import { abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { Botao } from "../../components/ui/Botao";
import { Vazio } from "../../components/ui/Vazio";
import { comparar } from "../../utils";
import { CartaoProjeto } from "./portfolio/CartaoProjeto";
import { usarComo } from "./visao";

export function Portfolio() {
  const { painel } = usarCentral();
  const como = usarComo();
  const projetos = [...painel.portfolio].sort((a, b) => (a.inicio || "9999").localeCompare(b.inicio || "9999") || comparar(a.nome, b.nome));

  return (
    <>
      <CabecalhoSecao titulo="Portfólio" sub="os projetos que o coletivo oferece às empresas — é o material que a captadora mostra na conversa">
        {!como && <Botao onClick={() => abrirNovo("projetoCaptacao")}>+ Projeto</Botao>}
      </CabecalhoSecao>
      {projetos.map((p) => <CartaoProjeto key={p.id} projeto={p} como={como} />)}
      {!projetos.length && <Vazio>Nenhum projeto no portfólio.</Vazio>}
    </>
  );
}
