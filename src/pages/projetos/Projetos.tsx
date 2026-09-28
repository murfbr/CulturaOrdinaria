/* Projetos: o lugar de trabalho. Cada projeto é uma candidatura: nasce ligado
   a um dos formulários mapeados (e ao edital dele) ou Livre. Três telas:
   Visão geral (todos, abertos e arquivados), Pipeline (status em quadro) e a
   ficha do projeto, com Geral, Formulário, Transferência e Contexto. */
import { useEffect } from "react";
import { usarCentral } from "../../store/central";
import { fecharDetalhe, usarNavegacao } from "../../store/navegacao";
import { VisaoGeral } from "./VisaoGeral";
import { Pipeline } from "./Pipeline";
import { FichaProjeto } from "./FichaProjeto";
import { BancoTextos } from "./BancoTextos";

export function Projetos() {
  const nav = usarNavegacao();
  const { pronto, painel } = usarCentral();
  const detalhe = nav.detalhe?.tipo === "projeto" ? nav.detalhe : null;
  const projeto = detalhe ? painel.projetos.find((p) => p.id === detalhe.id) : undefined;

  // Link para projeto que não existe (excluído, ou id antigo): volta para a lista.
  useEffect(() => {
    if (pronto && detalhe && !projeto) fecharDetalhe();
  }, [pronto, detalhe, projeto]);

  let tela;
  if (detalhe && projeto) tela = <FichaProjeto p={projeto} sub={detalhe.sub || "geral"} />;
  else if (nav.aba === "pipeline") tela = <Pipeline />;
  else if (nav.aba === "textos") tela = <BancoTextos />;
  else tela = <VisaoGeral />;

  return <div id="sim">{tela}</div>;
}
