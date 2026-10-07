/* Projetos: o lugar de trabalho. Cada projeto é uma candidatura: nasce ligado
   a um dos formulários mapeados (e ao edital dele) ou Livre. Três telas:
   Visão geral (todos, abertos e arquivados), Pipeline (status em quadro) e a
   ficha do projeto, com Geral, Formulário, Transferência e Contexto. A
   largura e o respiro lateral vêm do <main> do App; aqui só se escolhe a tela. */
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

  if (detalhe && projeto) return <FichaProjeto p={projeto} sub={detalhe.sub || "geral"} />;
  if (nav.aba === "pipeline") return <Pipeline />;
  if (nav.aba === "textos") return <BancoTextos />;
  return <VisaoGeral />;
}
