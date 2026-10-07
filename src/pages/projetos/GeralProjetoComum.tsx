/* O que os blocos da aba Geral do projeto compartilham: gravar uma mudança
   no projeto, a linha em grade das listas editáveis e o "×" de remover. */
import { salvarRegistro } from "../../store/mutacoes";
import { Botao } from "../../components/ui/Botao";
import type { Projeto } from "../../types";
import { clonar } from "../../utils";

/** Aplica uma mudança numa cópia do projeto e grava (texto digitado: rapido=false, com debounce). */
export function alterarProjeto(p: Projeto, fn: (c: Projeto) => void, rapido = true) {
  const copia = clonar(p);
  fn(copia);
  salvarRegistro("projetos", copia, rapido);
}

/** Linha em grade das listas editáveis (agentes, cronograma, documentos): as
    colunas do desktop vêm de quem usa; no celular são duas. */
export const ESTILO_LINHA_EDITAVEL = "grid grid-cols-2 items-center gap-2 border-t border-line py-1.5 first:border-t-0";

/** "×" de remover uma linha das listas editáveis. */
export function BotaoRemover({ title = "remover", onClick }: { title?: string; onClick: () => void }) {
  return <Botao variante="quieto" tamanho="mini" aria-label={title} title={title} onClick={onClick}>×</Botao>;
}
