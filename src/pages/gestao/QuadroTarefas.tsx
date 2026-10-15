/* Quadro de tarefas: colunas por pessoa (padrão) ou por status. Arraste o
   cartão para mudar de coluna (status ou responsável, conforme a visão) ou
   reordenar; ◀▶ segue girando o status direto no cartão. As concluídas ficam
   escondidas até marcar "mostrar concluídas"; cada coluna mostra 10 cartões
   por vez ("carregar mais"); a coluna de quem está logado (e-mail do login =
   e-mail do cadastro da equipe) vem primeiro e aparece mesmo vazia. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { girarStatusTarefa, porId, soltarTarefaEmPessoa, soltarTarefaEmStatus } from "../../store/mutacoes";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { emailSessao } from "../../services/sessao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../components/Filtros";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { Marcacao } from "../../components/ui/Campo";
import { CartaoQuadro, Coluna, Quadro } from "../../components/ui/Quadro";
import { usarArrasto, type Arrasto } from "../../lib/arrastar";
import { badgeTarefa, nomeEquipe, pessoaDaSessao, rotuloOrigem } from "../../lib/nomes";
import { ROTULO_TAREFA, STATUS_TAREFA, type StatusTarefa, type Tarefa } from "../../types";
import { formatarData } from "../../utils";

/** Cartões mostrados por coluna a cada "carregar mais". */
const POR_VEZ = 10;

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

/** Os cartões de uma coluna, `limite` por vez, com o botão "carregar mais" quando sobram. */
function CartoesDaColuna({ ts, limite, aoMais, mostrarStatus, arrasto, coluna }: {
  ts: Tarefa[]; limite: number; aoMais: () => void;
  mostrarStatus: boolean; arrasto: Arrasto<string>; coluna: string;
}) {
  const restantes = ts.length - limite;
  return (
    <>
      {ts.slice(0, limite).map((t) => <CartaoTarefa t={t} mostrarStatus={mostrarStatus} arrasto={arrasto} coluna={coluna} key={t.id} />)}
      {restantes > 0 && (
        <Botao variante="fantasma" tamanho="pequeno" className="mb-2 w-full" onClick={aoMais}>
          carregar mais ({restantes} restante{restantes === 1 ? "" : "s"})
        </Botao>
      )}
    </>
  );
}

/** Texto da coluna sem cartão: convite para soltar durante o arrasto. */
const textoVazia = (arrastando: boolean) => (arrastando ? "solte aqui" : "—");

export function QuadroTarefas() {
  const { painel } = usarCentral();
  const [visao, setVisao] = useState<"pessoa" | "status">("pessoa");
  const [busca, setBusca] = useState("");
  const [filtroResp, setFiltroResp] = useState("");
  const [mostrarFeitas, setMostrarFeitas] = useState(false);
  // Quantos cartões cada coluna mostra (chave "visão:coluna"); sem entrada = POR_VEZ.
  const [limites, setLimites] = useState<Record<string, number>>({});
  const limiteDe = (coluna: string) => limites[visao + ":" + coluna] ?? POR_VEZ;
  const carregarMais = (coluna: string) =>
    setLimites((l) => ({ ...l, [visao + ":" + coluna]: limiteDe(coluna) + POR_VEZ }));

  // Na visão por status a coluna é o status; na por pessoa, o id ("" = sem responsável).
  const arrasto = usarArrasto<string>((id, coluna, antesDe) => {
    if (visao === "status") soltarTarefaEmStatus(id, coluna as StatusTarefa, antesDe);
    else soltarTarefaEmPessoa(id, coluna, antesDe);
  });

  const visiveis = painel.tarefas.filter((t) =>
    (!filtroResp || t.respId === filtroResp) &&
    (mostrarFeitas || t.status !== "feito") &&
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
              <CartoesDaColuna ts={ts} limite={limiteDe(k)} aoMais={() => carregarMais(k)}
                mostrarStatus={false} arrasto={arrasto} coluna={k} />
            </Coluna>
          );
        })}
      </Quadro>
    );
  } else {
    // Quem está logado vem primeiro e aparece mesmo sem tarefa (para se dar tarefas arrastando);
    // sem e-mail casado (ou no modo local), fica a ordem do cadastro.
    const eu = pessoaDaSessao(painel.equipe, emailSessao());
    const comTarefa = painel.equipe.filter((e) => e.id !== eu?.id && visiveis.some((t) => t.respId === e.id));
    const colunas = eu ? [eu, ...comTarefa] : comTarefa;
    const semResponsavel = visiveis.filter((t) => !t.respId || !porId("equipe", t.respId));
    quadro = (
      <Quadro>
        {colunas.map((pessoa) => {
          const ts = visiveis.filter((t) => t.respId === pessoa.id);
          // A contagem conta todas as tarefas da pessoa, inclusive as concluídas escondidas.
          const todas = painel.tarefas.filter((t) => t.respId === pessoa.id);
          const abertas = todas.filter((t) => t.status !== "feito").length;
          return (
            <Coluna key={pessoa.id} larga
              titulo={<><Avatar iniciais={pessoa.nome[0]} />{pessoa.nome}</>}
              n={abertas + "/" + todas.length}
              alvo={arrasto.alvo === pessoa.id}
              vazia={!ts.length ? textoVazia(!!arrasto.arrastando) : undefined}
              {...arrasto.propsColuna(pessoa.id)}>
              <CartoesDaColuna ts={ts} limite={limiteDe(pessoa.id)} aoMais={() => carregarMais(pessoa.id)}
                mostrarStatus={true} arrasto={arrasto} coluna={pessoa.id} />
            </Coluna>
          );
        })}
        {(semResponsavel.length > 0 || arrasto.arrastando) && (
          <Coluna larga titulo="Sem responsável" n={semResponsavel.length} alvo={arrasto.alvo === ""}
            vazia={!semResponsavel.length ? textoVazia(!!arrasto.arrastando) : undefined}
            {...arrasto.propsColuna("")}>
            <CartoesDaColuna ts={semResponsavel} limite={limiteDe("")} aoMais={() => carregarMais("")}
              mostrarStatus={true} arrasto={arrasto} coluna="" />
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
        <Marcacao marcado={mostrarFeitas} aoMudar={setMostrarFeitas}>mostrar concluídas</Marcacao>
      </BarraFiltros>

      {quadro}
    </>
  );
}
