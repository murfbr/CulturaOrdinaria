/* Ficha da reunião: pauta, ata e os encaminhamentos (tarefas ligadas),
   com o checkzinho de concluir direto na lista. */
import { usarCentral } from "../../store/central";
import { alternarTarefaConcluida, porId } from "../../store/mutacoes";
import { fecharDetalhe } from "../../store/navegacao";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { CabecalhoFicha } from "../../components/ui/CabecalhoFicha";
import { CaixaMarcar } from "../../components/ui/Campo";
import { Chip } from "../../components/ui/Chip";
import { Dica } from "../../components/ui/Dica";
import { Grade } from "../../components/ui/Grade";
import { Linha } from "../../components/ui/Linha";
import { Painel } from "../../components/ui/Painel";
import { Vazio } from "../../components/ui/Vazio";
import { emailsConvite, linkGoogleAgenda, nomesParticipantes } from "../../lib/agenda";
import { nomeEquipe } from "../../lib/nomes";
import { ROTULO_TAREFA } from "../../types";
import { formatarData } from "../../utils";

export function FichaReuniao({ id }: { id: string }) {
  const { painel } = usarCentral();
  const r = porId("reunioes", id)!;
  const encaminhamentos = painel.tarefas.filter((t) => t.origem === "reuniao:" + r.id);
  const participantes = nomesParticipantes(r);

  return (
    <>
      <CabecalhoFicha
        rotuloVoltar="Voltar para Reuniões"
        aoVoltar={fecharDetalhe}
        avatar="📅"
        titulo={r.titulo}
        sub={
          <div className="flex flex-wrap items-center gap-1.5">
            <span>{formatarData(r.data)}{r.hora ? " · " + r.hora : ""}{r.local ? " · " + r.local : ""}</span>
            {r.recorrencia && r.recorrencia !== "Avulsa" && <Badge tom="st-prev">{r.recorrencia}</Badge>}
            {r.proxima && <Badge tom="tipo">próxima: {formatarData(r.proxima)}</Badge>}
            <Badge tom={r.status === "realizada" ? "st-closed" : "st-open"}>
              {r.status === "realizada" ? "Realizada" : "Agendada"}
            </Badge>
          </div>
        }
        acoes={
          <>
            <Botao variante="fantasma" tamanho="pequeno" href={linkGoogleAgenda(r, emailsConvite(r))}>
              📅 Google Agenda
            </Botao>
            <Botao variante="fantasma" tamanho="pequeno" onClick={() => abrirEdicao("reuniao", r.id)}>Editar</Botao>
          </>
        }
      />

      {participantes.length > 0 && (
        <div className="mb-2.5 flex flex-wrap">{participantes.map((n) => <Chip key={n}>{n}</Chip>)}</div>
      )}

      <Grade colunas={2}>
        <Painel titulo="Pauta">
          {(r.pauta || []).map((p, i) => <Linha key={i}>{p}</Linha>)}
          {!(r.pauta || []).length && <Vazio emLinha>Sem itens de pauta.</Vazio>}
        </Painel>
        <Painel titulo="Ata / o que rolou">
          {r.ata
            ? <p className="m-0 whitespace-pre-wrap">{r.ata}</p>
            : <Vazio emLinha>A preencher depois da reunião (botão Editar).</Vazio>}
        </Painel>
      </Grade>

      <Painel
        titulo="Encaminhamentos → Tarefas"
        acoes={<Botao tamanho="pequeno" onClick={() => abrirNovo("tarefa", { origem: "reuniao:" + r.id })}>+ Encaminhamento</Botao>}
      >
        {encaminhamentos.map((t) => (
          <Linha key={t.id}>
            <div className="flex items-center gap-2.5">
              <CaixaMarcar marcado={t.status === "feito"} aoMudar={() => alternarTarefaConcluida(t)} />
              <span className="min-w-0 flex-1 cursor-pointer" onClick={() => abrirEdicao("tarefa", t.id)}>
                {t.titulo} <span className="text-muted">· {nomeEquipe(t.respId)} · {ROTULO_TAREFA[t.status]}</span>
              </span>
            </div>
          </Linha>
        ))}
        {!encaminhamentos.length && <Vazio emLinha>Nenhum encaminhamento ainda.</Vazio>}
        <Dica className="mt-2.5">
          Cada encaminhamento é uma tarefa ligada a esta reunião — aparece também na aba Tarefas, no responsável. Marque ✓ para concluir.
        </Dica>
      </Painel>
    </>
  );
}
