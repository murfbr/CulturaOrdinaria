/* Minhas tarefas, no topo do Resumo: as primeiras tarefas em aberto de quem
   está logado (a pessoa da Equipe cujo e-mail de cadastro é o do login),
   vencidas primeiro, depois pelo prazo, sem prazo no fim. Cada linha abre a
   tarefa para editar; "ver todas" leva ao quadro de Gestão, que já põe a
   coluna da pessoa em primeiro. Sem casamento de e-mail, a caixa diz o que
   falta em vez de ficar vazia. */
import { usarCentral } from "../../store/central";
import { irParaAmbiente } from "../../store/navegacao";
import { abrirEdicao } from "../../store/edicao";
import { adiarTarefa, alternarTarefaConcluida } from "../../store/mutacoes";
import { emailSessao } from "../../services/sessao";
import { toast } from "../../components/Toast";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { Dica } from "../../components/ui/Dica";
import { Linha } from "../../components/ui/Linha";
import { Painel } from "../../components/ui/Painel";
import { Vazio } from "../../components/ui/Vazio";
import { ESTILO_AUXILIAR } from "../../components/ui/estilos";
import { tituloCurto } from "../../lib/agenda";
import { pessoaDaSessao } from "../../lib/nomes";
import { hojeIso } from "../../lib/prazos";
import { formatarData } from "../../utils";

/** Quantas linhas a caixa mostra antes do "ver todas". */
const MOSTRAR = 5;

export function MinhasTarefas() {
  const { painel } = usarCentral();
  const email = emailSessao();
  const eu = pessoaDaSessao(painel.equipe, email);
  const hoje = hojeIso();
  const minhas = eu
    ? painel.tarefas
      .filter((t) => t.respId === eu.id && t.status !== "feito")
      .sort((a, b) => (a.prazo || "9999").localeCompare(b.prazo || "9999"))
    : [];
  const restantes = Math.max(0, minhas.length - MOSTRAR);

  return (
    <Painel
      titulo={eu ? "Minhas tarefas · " + eu.nome : "Minhas tarefas"}
      sub={eu ? minhas.length + " em aberto" : undefined}
      acoes={eu && minhas.length > 0
        ? <Botao variante="fantasma" tamanho="pequeno" onClick={() => irParaAmbiente("gestao", "quadro")}>{restantes ? "ver todas (+" + restantes + ") →" : "ver no quadro →"}</Botao>
        : undefined}
    >
      {!eu && (
        <Dica>
          {email
            ? "O login " + email + " não está no cadastro da Equipe. Cadastre esse e-mail em Cadastros → Pessoas → Equipe para ver as suas tarefas aqui."
            : "Sem login (modo local): grave a chave central-email-teste no navegador com o e-mail de alguém da Equipe para simular."}
        </Dica>
      )}
      {eu && !minhas.length && <Vazio emLinha>nenhuma tarefa em aberto com você</Vazio>}
      {minhas.slice(0, MOSTRAR).map((t) => {
        const vencida = Boolean(t.prazo) && (t.prazo as string) < hoje;
        return (
          <Linha
            key={t.id} compacta title="editar a tarefa" aoClicar={() => abrirEdicao("tarefa", t.id)}
            direita={
              <>
                {t.prazo && (vencida
                  ? <Badge tom="ur-vencido">{formatarData(t.prazo)}</Badge>
                  : <span className={ESTILO_AUXILIAR}>{formatarData(t.prazo)}</span>)}
                <Botao variante="quieto" tamanho="mini" title="marcar como concluída"
                  onClick={(e) => { e.stopPropagation(); alternarTarefaConcluida(t); toast("Tarefa concluída"); }}>✓</Botao>
                {vencida && (
                  <Botao variante="quieto" tamanho="mini" title="adiar 7 dias a partir de hoje"
                    onClick={(e) => { e.stopPropagation(); adiarTarefa(t, 7); toast("Prazo adiado 7 dias"); }}>+7d</Botao>
                )}
              </>
            }
          >
            <div className="truncate">{tituloCurto(t.titulo) || <span className="text-faint">(sem título)</span>}</div>
          </Linha>
        );
      })}
    </Painel>
  );
}
