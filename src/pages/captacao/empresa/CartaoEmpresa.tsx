/* Cartão de uma empresa no celular (a tabela fica para telas largas): nome e
   setor, os selos das negociações por projeto e a pessoa de contato. Clicar
   abre a ficha. Na visão de uma captadora, a empresa em conversa só com outra
   mostra "com outra captadora" no lugar do contato. */
import { Badge } from "../../../components/ui/Badge";
import type { Empresa, Negociacao } from "../../../types";
import { nomeCaptadora, nomeItem, nomeProjeto, tomEtapa } from "../apoio";
import { empresaFechada, restrita } from "../calculo";

interface Props {
  e: Empresa;
  negociacoes: Negociacao[];
  como: string;
  aoAbrir: () => void;
}

export function CartaoEmpresa({ e, negociacoes, como, aoAbrir }: Props) {
  const negs = negociacoes.filter((n) => n.empresaId === e.id);
  const fechada = empresaFechada(e.id, negociacoes, como);
  const pessoa = e.pessoas[0];
  return (
    <div
      className="cursor-pointer rounded-md border border-line bg-card px-3 py-2.5"
      role="button" tabIndex={0} onClick={aoAbrir} onKeyDown={(ev) => { if (ev.key === "Enter") aoAbrir(); }}
    >
      <b>{e.nome}</b>{e.setor && <span className="text-sm text-muted"> · {e.setor}</span>}
      <div className="mt-1 flex flex-wrap gap-1">
        {negs.map((n) => restrita(n, como)
          ? <Badge key={n.id} tom="neutro">{nomeProjeto(n.projetoId)} · com {nomeCaptadora(n.captadoraId)}</Badge>
          : <Badge key={n.id} tom={tomEtapa(n.etapa)}>{nomeProjeto(n.projetoId)} · {nomeItem("etapas", n.etapa)}</Badge>)}
        {!negs.length && <span className="text-sm text-muted">nenhuma negociação ainda</span>}
      </div>
      <div className="mt-1 text-sm text-muted">
        {fechada ? "com outra captadora" : pessoa ? [pessoa.nome, pessoa.telefone || pessoa.email].filter(Boolean).join(" · ") : "sem pessoa de contato"}
      </div>
    </div>
  );
}
