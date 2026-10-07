/* Aba Geral do projeto — a única de um projeto Livre e a seção interna de
   todos (nada daqui vai para a plataforma). É a casca: cada bloco grande
   mora num irmão GeralProjeto*.tsx — dados, alertas do edital e proponente
   (Dados); anotações, agentes e cronograma (Interno); documentos e produção
   (Documentos); tarefas e histórico de status (Tarefas). */
import type { Projeto } from "../../types";
import { EdicoesDoProjeto } from "./EdicoesDoProjeto";
import { GeralProjetoAlertas, GeralProjetoDados, GeralProjetoProponente } from "./GeralProjetoDados";
import { GeralProjetoInterno } from "./GeralProjetoInterno";
import { GeralProjetoDocumentos, GeralProjetoProducao } from "./GeralProjetoDocumentos";
import { GeralProjetoHistorico, GeralProjetoTarefas } from "./GeralProjetoTarefas";

export function GeralProjeto({ p }: { p: Projeto }) {
  return (
    <div className="max-w-[980px]">
      <GeralProjetoDados p={p} />
      <EdicoesDoProjeto p={p} />
      <GeralProjetoAlertas p={p} />
      <GeralProjetoProponente p={p} />
      <GeralProjetoInterno p={p} />
      <GeralProjetoDocumentos p={p} />
      <GeralProjetoProducao p={p} />
      <GeralProjetoTarefas p={p} />
      <GeralProjetoHistorico p={p} />
    </div>
  );
}
