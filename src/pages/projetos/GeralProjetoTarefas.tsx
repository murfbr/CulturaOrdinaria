/* Aba Geral do projeto, parte 4: as tarefas ligadas ao projeto e o histórico
   de mudanças de status (com a origem na migração v3, quando houver). */
import { usarCentral } from "../../store/central";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { badgeTarefa, editalDoProjeto, nomeCurto, nomeEquipe } from "../../lib/nomes";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { Dica } from "../../components/ui/Dica";
import { Linha } from "../../components/ui/Linha";
import { Painel } from "../../components/ui/Painel";
import { Vazio } from "../../components/ui/Vazio";
import { ROTULO_STATUS_PROJETO, type Projeto, type StatusProjeto } from "../../types";
import { formatarData } from "../../utils";

export function GeralProjetoTarefas({ p }: { p: Projeto }) {
  const { painel } = usarCentral();
  const tarefas = painel.tarefas.filter((t) => t.origem === "proj:" + p.id);
  return (
    <Painel titulo="Tarefas"
      acoes={<Botao variante="fantasma" tamanho="pequeno" onClick={() => abrirNovo("tarefa", { origem: "proj:" + p.id })}>+ tarefa</Botao>}>
      <div>
        {tarefas.map((t) => {
          const b = badgeTarefa(t);
          return (
            <Linha key={t.id} compacta aoClicar={() => abrirEdicao("tarefa", t.id)}
              direita={<Badge tom={t.status === "feito" ? "ok" : t.status === "and" ? "aviso" : "neutro"}>{b.rotulo}</Badge>}>
              {t.titulo} <span className="text-muted">· {nomeEquipe(t.respId)}{t.prazo ? " · " + formatarData(t.prazo) : ""}</span>
            </Linha>
          );
        })}
      </div>
      {!tarefas.length && <Vazio emLinha>nenhuma tarefa ligada a este projeto</Vazio>}
    </Painel>
  );
}

export function GeralProjetoHistorico({ p }: { p: Projeto }) {
  usarCentral();
  const edital = editalDoProjeto(p);
  return (
    <Painel titulo="Histórico de status">
      {p.historico.length ? (
        <div>
          {[...p.historico].reverse().map((h, i) => (
            <Linha key={i} compacta>
              <span className="mr-2.5 inline-block min-w-[90px] text-muted">{formatarData(h.data)}</span>
              {h.de ? ROTULO_STATUS_PROJETO[h.de as StatusProjeto] || h.de : "criado"} → <b>{ROTULO_STATUS_PROJETO[h.para as StatusProjeto] || h.para}</b>
            </Linha>
          ))}
        </div>
      ) : (
        <Vazio emLinha>sem mudanças registradas</Vazio>
      )}
      {p.origem && (p.origem.candidatura || p.origem.projeto) && (
        <Dica className="mt-2">
          Veio da migração v3: {p.origem.projeto ? "projeto antigo " + p.origem.projeto : ""}
          {p.origem.candidatura ? (p.origem.projeto ? " × " : "") + "candidatura " + p.origem.candidatura : ""}
          {edital ? " · edital " + nomeCurto(edital) : ""}.
        </Dica>
      )}
    </Painel>
  );
}
