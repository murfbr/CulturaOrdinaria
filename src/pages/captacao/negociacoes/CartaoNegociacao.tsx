/* Cartão de uma negociação no celular (a tabela fica para telas largas):
   empresa com os avisos, projeto e cota, valor, etapa trocável num controle
   de tamanho normal, quem capta, último contato e próximo passo. Clicar no
   cartão abre o modal; o seletor de etapa não abre. Na visão de uma
   captadora, a negociação de outra mostra só que a conversa existe. */
import { Badge } from "../../../components/ui/Badge";
import { ESTILO_CONTROLE } from "../../../components/ui/Campo";
import type { Negociacao } from "../../../types";
import { dataCurta, itensDaLista, nomeCaptadora, nomeCota, nomeEmpresa, nomeProjeto } from "../apoio";
import { brl, conflitos, reservaAtiva, restrita } from "../calculo";

interface Props {
  n: Negociacao;
  todas: Negociacao[];
  como: string;
  hoje: string;
  aoAbrir: () => void;
  aoTrocarEtapa: (etapa: string) => void;
}

const CAIXA = "rounded-md border border-line bg-card px-3 py-2.5";

export function CartaoNegociacao({ n, todas, como, hoje, aoAbrir, aoTrocarEtapa }: Props) {
  if (restrita(n, como)) {
    return (
      <div className={CAIXA}>
        <b>{nomeEmpresa(n.empresaId)}</b> <span className="text-muted">· {nomeProjeto(n.projetoId)}</span>
        <div className="text-sm text-muted">Em conversa com {nomeCaptadora(n.captadoraId)}</div>
      </div>
    );
  }
  const cf = conflitos(n, todas);
  const temPasso = Boolean(n.proximoPasso || n.dataProximo);
  return (
    <div className={CAIXA + " cursor-pointer"} role="button" tabIndex={0} onClick={aoAbrir} onKeyDown={(e) => { if (e.key === "Enter") aoAbrir(); }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <b>{nomeEmpresa(n.empresaId)}</b>
          <div className="text-sm text-muted">{nomeProjeto(n.projetoId)}{n.cotaId && " · " + nomeCota(n.cotaId)}</div>
        </div>
        <span className="flex-none font-semibold tabular-nums">{brl(n.valor)}</span>
      </div>
      {(cf.length > 0 || reservaAtiva(n, hoje)) && (
        <div className="mt-1 flex flex-wrap gap-1">
          {cf.length > 0 && <Badge tom="aviso" mini>também com {cf.map((o) => nomeCaptadora(o.captadoraId)).join(", ")}</Badge>}
          {reservaAtiva(n, hoje) && <Badge tom="info" mini>reservado até {dataCurta(n.reservaAte)}</Badge>}
        </div>
      )}
      <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <select className={ESTILO_CONTROLE + " min-w-0 flex-1"} value={n.etapa} aria-label="Etapa" onChange={(e) => aoTrocarEtapa(e.target.value)}>
          {itensDaLista("etapas").map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <span className="flex-none text-sm text-muted">{nomeCaptadora(n.captadoraId)}</span>
      </div>
      {(n.ultimoContato || temPasso) && (
        <div className="mt-1.5 text-sm text-muted">
          {n.ultimoContato && <span className="tabular-nums">último contato {dataCurta(n.ultimoContato)}</span>}
          {n.ultimoContato && temPasso && " · "}
          {temPasso && <span>{n.dataProximo && <b className="tabular-nums text-ink">{dataCurta(n.dataProximo)} · </b>}{n.proximoPasso}</span>}
        </div>
      )}
    </div>
  );
}
