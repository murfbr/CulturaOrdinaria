/* Quadro de tarefas: colunas por pessoa (padrão) ou por status. Arraste o
   cartão para mudar de coluna (status ou responsável, conforme a visão) ou
   reordenar; ◀▶ segue girando o status direto no cartão. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { girarStatusTarefa, porId, soltarTarefaEmPessoa, soltarTarefaEmStatus } from "../../store/mutacoes";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../components/Filtros";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { Marcacao } from "../../components/ui/Campo";
import { CartaoQuadro, Coluna, Quadro } from "../../components/ui/Quadro";
import { usarArrasto, type Arrasto } from "../../lib/arrastar";
import { badgeTarefa, nomeEquipe, rotuloOrigem } from "../../lib/nomes";
import { ROTULO_TAREFA, STATUS_TAREFA, type StatusTarefa, type Tarefa } from "../../types";
import { formatarData } from "../../utils";

function CartaoTarefa({ t, mostrarStatus, arrasto, coluna }: {
  t: Tarefa; mostrarStatus: boolean; arrasto: Arrasto<string>; coluna: string;
}) {
  const b = badgeTarefa(t);
  return (
    <CartaoQuadro
      arrastando={arrasto.arrastando === t.id}
      antesDaqui={arrasto.antesDe === t.id && arrasto.arrastando !== t.id}
      onClick={() => abrirEdicao("tarefa", t.id)}
      {...arrasto.propsCartao(t.id, coluna)}>
      <p className="m-0 mb-1 text-sm font-bold leading-tight">{t.titulo}</p>
      <p className="m-0 mb-2 text-xs text-muted">{rotuloOrigem(t.origem)}</p>
      {t.obs && <p className="m-0 mb-2 text-xs italic text-faint">{t.obs}</p>}
      <div className="flex flex-wrap items-center gap-1.5 text-2xs text-faint">
        {mostrarStatus
          ? <Badge mini tom={b.classe}>{b.rotulo}</Badge>
          : <Avatar pequeno iniciais={nomeEquipe(t.respId)[0] || "?"} />}
        {t.prazo && <span className="font-semibold text-warn">⏱ {formatarData(t.prazo)}</span>}
        <span className="ml-auto flex gap-0.5">
          <Botao variante="quieto" tamanho="mini" title="voltar status" onClick={(e) => { e.stopPropagation(); girarStatusTarefa(t, -1); }}>◀</Botao>
          <Botao variante="quieto" tamanho="mini" title="avançar status" onClick={(e) => { e.stopPropagation(); girarStatusTarefa(t, 1); }}>▶</Botao>
        </span>
      </div>
    </CartaoQuadro>
  );
}

/** Texto da coluna sem cartão: convite para soltar durante o arrasto. */
const textoVazia = (arrastando: boolean) => (arrastando ? "solte aqui" : "—");

export function QuadroTarefas() {
  const { painel } = usarCentral();
  const [visao, setVisao] = useState<"pessoa" | "status">("pessoa");
  const [busca, setBusca] = useState("");
  const [filtroResp, setFiltroResp] = useState("");
  const [esconderFeitas, setEsconderFeitas] = useState(false);

  // Na visão por status a coluna é o status; na por pessoa, o id ("" = sem responsável).
  const arrasto = usarArrasto<string>((id, coluna, antesDe) => {
    if (visao === "status") soltarTarefaEmStatus(id, coluna as StatusTarefa, antesDe);
    else soltarTarefaEmPessoa(id, coluna, antesDe);
  });

  const visiveis = painel.tarefas.filter((t) =>
    (!filtroResp || t.respId === filtroResp) &&
    (!esconderFeitas || t.status !== "feito") &&
    (!busca || (t.titulo + " " + t.obs + " " + rotuloOrigem(t.origem)).toLowerCase().includes(busca.toLowerCase())));

  let quadro;
  if (visao === "status") {
    quadro = (
      <Quadro>
        {STATUS_TAREFA.map((k) => {
          const ts = visiveis.filter((t) => t.status === k);
          return (
            <Coluna key={k} larga titulo={ROTULO_TAREFA[k]} n={ts.length} alvo={arrasto.alvo === k}
              vazia={!ts.length ? textoVazia(!!arrasto.arrastando) : undefined}
              {...arrasto.propsColuna(k)}>
              {ts.map((t) => <CartaoTarefa t={t} mostrarStatus={false} arrasto={arrasto} coluna={k} key={t.id} />)}
            </Coluna>
          );
        })}
      </Quadro>
    );
  } else {
    const comTarefa = painel.equipe.filter((e) => visiveis.some((t) => t.respId === e.id));
    const semResponsavel = visiveis.filter((t) => !t.respId || !porId("equipe", t.respId));
    quadro = (
      <Quadro>
        {comTarefa.map((pessoa) => {
          const ts = visiveis.filter((t) => t.respId === pessoa.id);
          const abertas = ts.filter((t) => t.status !== "feito").length;
          return (
            <Coluna key={pessoa.id} larga
              titulo={<><Avatar iniciais={pessoa.nome[0]} />{pessoa.nome}</>}
              n={abertas + "/" + ts.length}
              alvo={arrasto.alvo === pessoa.id}
              vazia={!ts.length ? textoVazia(!!arrasto.arrastando) : undefined}
              {...arrasto.propsColuna(pessoa.id)}>
              {ts.map((t) => <CartaoTarefa t={t} mostrarStatus={true} arrasto={arrasto} coluna={pessoa.id} key={t.id} />)}
            </Coluna>
          );
        })}
        {(semResponsavel.length > 0 || arrasto.arrastando) && (
          <Coluna larga titulo="Sem responsável" n={semResponsavel.length} alvo={arrasto.alvo === ""}
            vazia={!semResponsavel.length ? textoVazia(!!arrasto.arrastando) : undefined}
            {...arrasto.propsColuna("")}>
            {semResponsavel.map((t) => <CartaoTarefa t={t} mostrarStatus={true} arrasto={arrasto} coluna="" key={t.id} />)}
          </Coluna>
        )}
      </Quadro>
    );
  }

  return (
    <>
      <CabecalhoSecao titulo="Tarefas" sub="designadas à equipe; nascem em projetos, editais e reuniões — arraste os cartões entre as colunas">
        <Botao variante="fantasma" tamanho="pequeno" onClick={() => setVisao(visao === "pessoa" ? "status" : "pessoa")}>
          Ver por: <b>{visao}</b> ⇄
        </Botao>
        <Botao onClick={() => abrirNovo("tarefa")}>+ Tarefa</Botao>
      </CabecalhoSecao>

      <BarraFiltros mostrando={visiveis.length} total={painel.tarefas.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar título, vínculo ou obs…" />
        <SeletorFiltro valor={filtroResp} aoMudar={setFiltroResp} rotuloTodos="qualquer responsável"
          opcoes={painel.equipe.map((p) => ({ valor: p.id, rotulo: p.nome }))} />
        <Marcacao marcado={esconderFeitas} aoMudar={setEsconderFeitas}>esconder concluídas</Marcacao>
      </BarraFiltros>

      {quadro}
    </>
  );
}
