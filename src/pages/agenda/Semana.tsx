/* Semana: o planejamento semanal do coletivo. A semana aberta vem da navegação
   (URL #/agenda/semana/<segunda>; sem ela, a atual). Três textos da semana (focos,
   o que fica pronto até sexta, prazos no horizonte) e seis colunas numa grade
   de duas linhas por três (o site é de mesa): segunda a sexta mais "Durante a
   semana", com as tarefas de cada dia. Os itens são tarefas normais: as com
   prazo no dia, de qualquer origem, e as nascidas aqui sem prazo. Arrastar
   entre colunas muda o prazo; "adicionar…" cria no dia; "+ reunião" abre o
   formulário da aba Reuniões já com a data do dia, e as reuniões do dia
   aparecem no alto da caixa, com hora, abrindo a ficha. */
import { useEffect, useState, type KeyboardEvent } from "react";
import { usarCentral } from "../../store/central";
import { alternarTarefaConcluida, salvarRegistro, salvarSemana, soltarTarefaEmDia } from "../../store/mutacoes";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { abrirDetalhe, definirSemanaAberta, usarNavegacao } from "../../store/navegacao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { Avatar } from "../../components/ui/Avatar";
import { Botao } from "../../components/ui/Botao";
import { AreaTexto, CaixaMarcar, ESTILO_CONTROLE } from "../../components/ui/Campo";
import { Dica } from "../../components/ui/Dica";
import { Painel } from "../../components/ui/Painel";
import { CartaoQuadro, Coluna } from "../../components/ui/Quadro";
import { usarArrasto, type Arrasto } from "../../lib/arrastar";
import { nomeEquipe, rotuloOrigem } from "../../lib/nomes";
import { hojeIso } from "../../lib/prazos";
import {
  colunasDaSemana, origemSemana, reunioesPorDia, rotuloSemana, segundaDe, somarDias, tarefasPorColuna, type DiaSemana,
} from "../../lib/semana";
import type { Reuniao, Semana as SemanaDoc, Tarefa } from "../../types";
import { cx } from "../../utils/classes";
import { uid } from "../../utils";

type CampoSemana = "focos" | "entregas" | "prazos";

const CAIXAS: [CampoSemana, string, string][] = [
  ["focos", "Focos da semana", "Os 2 ou 3 focos que valem para a semana inteira…"],
  ["entregas", "O que fica pronto até sexta", "As entregas concretas de fim de semana…"],
  ["prazos", "Prazos no horizonte", "Datas que puxam a semana (editais, reuniões marcadas)…"],
];

/** Um dos três textos da semana: edita livre e grava ao sair do campo. */
function CaixaSemana({ semanaId, campo, titulo, placeholder, doc }: {
  semanaId: string; campo: CampoSemana; titulo: string; placeholder: string; doc?: SemanaDoc;
}) {
  const gravado = doc?.[campo] || "";
  const [texto, setTexto] = useState(gravado);
  // Trocou de semana (ou outra pessoa gravou): o campo acompanha.
  useEffect(() => { setTexto(gravado); }, [semanaId, gravado]);
  return (
    <Painel titulo={titulo} className="mb-0">
      <AreaTexto value={texto} placeholder={placeholder} className="min-h-24 text-base"
        onChange={(e) => setTexto(e.target.value)}
        onBlur={() => salvarSemana(semanaId, campo, texto)} />
    </Painel>
  );
}

/** Cartão da tarefa no dia: feito, título, responsável e a origem (quando não é a própria semana). */
function CartaoDia({ t, origemDaSemana, arrasto, coluna }: {
  t: Tarefa; origemDaSemana: string; arrasto: Arrasto<DiaSemana>; coluna: DiaSemana;
}) {
  const feita = t.status === "feito";
  return (
    <CartaoQuadro
      arrastando={arrasto.arrastando === t.id}
      antesDaqui={arrasto.antesDe === t.id && arrasto.arrastando !== t.id}
      onClick={() => abrirEdicao("tarefa", t.id)}
      {...arrasto.propsCartao(t.id, coluna)}>
      <div className="flex items-start gap-2">
        <span onClick={(e) => e.stopPropagation()}>
          <CaixaMarcar marcado={feita} aoMudar={() => alternarTarefaConcluida(t)} title={feita ? "reabrir" : "concluir"} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cx("m-0 text-sm font-bold leading-tight", feita && "text-faint line-through")}>{t.titulo}</p>
          {t.origem && t.origem !== origemDaSemana && (
            <p className="m-0 mt-1 text-xs text-muted">{rotuloOrigem(t.origem)}</p>
          )}
        </div>
        {t.respId && <Avatar pequeno iniciais={nomeEquipe(t.respId)[0] || "?"} title={nomeEquipe(t.respId)} />}
      </div>
    </CartaoQuadro>
  );
}

/** Reunião do dia: hora e título, régua laranja à esquerda; clique abre a ficha. */
function LinhaReuniao({ r }: { r: Reuniao }) {
  return (
    <div
      className="mb-2 flex cursor-pointer items-baseline gap-2 rounded-md border border-line border-l-stamp border-l-accent bg-card px-2.5 py-1.5 text-sm hover:border-ink"
      title="abrir a ficha da reunião"
      onClick={() => abrirDetalhe("reuniao", r.id)}>
      <span className="font-mono text-xs text-muted">{r.hora || "—:—"}</span>
      <span className={cx("min-w-0 flex-1 truncate font-semibold", r.status === "realizada" && "text-faint line-through")}>{r.titulo || "Reunião"}</span>
    </div>
  );
}

/** "adicionar…" no pé da coluna: título + pessoa + Enter cria a tarefa já no dia. */
function AdicionarNoDia({ segunda, prazo }: { segunda: string; prazo: string }) {
  const { painel } = usarCentral();
  const [titulo, setTitulo] = useState("");
  const [respId, setRespId] = useState("");

  function adicionar() {
    const t = titulo.trim();
    if (!t) return;
    const nova: Tarefa = { id: uid("t"), titulo: t, respId, origem: origemSemana(segunda), prazo, obs: "", status: "fazer" };
    salvarRegistro("tarefas", nova);
    setTitulo("");
  }
  const aoTeclar = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") { e.preventDefault(); adicionar(); } };

  return (
    <div className="mt-1 flex gap-1">
      <input value={titulo} placeholder="adicionar…" onChange={(e) => setTitulo(e.target.value)} onKeyDown={aoTeclar}
        className={cx(ESTILO_CONTROLE, "min-w-0 flex-1 px-2 py-1 text-sm")} />
      <select value={respId} onChange={(e) => setRespId(e.target.value)} title="responsável"
        className={cx(ESTILO_CONTROLE, "max-w-[76px] px-1 py-1 text-xs")}>
        <option value="">quem</option>
        {painel.equipe.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
      </select>
      <Botao variante="fantasma" tamanho="mini" title="adicionar" onClick={adicionar}>+</Botao>
    </div>
  );
}

export function Semana() {
  const { painel, semanas } = usarCentral();
  const { semanaAberta } = usarNavegacao();
  const hoje = hojeIso();
  const semanaAtual = segundaDe(hoje);
  // A semana aberta mora na navegação (e na URL): o Calendário abre uma semana, e o voltar do navegador funciona.
  const segunda = semanaAberta || semanaAtual;
  const setSegunda = (s: string) => definirSemanaAberta(s === semanaAtual ? null : s);
  const doc = semanas[segunda];
  const colunas = colunasDaSemana(segunda);
  const porColuna = tarefasPorColuna(painel.tarefas, segunda);
  const reunioesDoDia = reunioesPorDia(painel.reunioes, segunda);
  const origemDaSemana = origemSemana(segunda);

  // Soltar numa coluna: dia grava o prazo; "Durante a semana" limpa.
  const arrasto = usarArrasto<DiaSemana>((id, coluna, antesDe) => {
    const col = colunas.find((c) => c.chave === coluna);
    soltarTarefaEmDia(id, col?.iso || "", antesDe);
  });

  return (
    <>
      <CabecalhoSecao titulo="Semana" sub="planejamento da semana — os itens são tarefas normais, de qualquer projeto">
        <Botao variante="fantasma" tamanho="pequeno" onClick={() => setSegunda(somarDias(segunda, -7))}>← anterior</Botao>
        <b className="text-base">{rotuloSemana(segunda)}</b>
        <Botao variante="fantasma" tamanho="pequeno" onClick={() => setSegunda(somarDias(segunda, 7))}>próxima →</Botao>
        {segunda !== semanaAtual && (
          <Botao variante="quieto" tamanho="pequeno" onClick={() => setSegunda(semanaAtual)}>ir para a semana atual</Botao>
        )}
      </CabecalhoSecao>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {CAIXAS.map(([campo, titulo, placeholder]) => (
          <CaixaSemana key={campo + segunda} semanaId={segunda} campo={campo} titulo={titulo} placeholder={placeholder} doc={doc} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {colunas.map((c) => {
          const ts = porColuna[c.chave];
          const rs = c.iso ? reunioesDoDia[c.iso] : [];
          const ehHoje = c.iso === hoje;
          return (
            <Coluna key={c.chave} cheia
              titulo={<>{c.nome}{c.iso && <span className={cx("font-mono text-2xs font-normal", ehHoje ? "text-accent" : "text-faint")}>{c.iso.slice(8)}/{c.iso.slice(5, 7)}</span>}</>}
              n={ts.length + rs.length || undefined}
              alvo={arrasto.alvo === c.chave}
              className={cx(ehHoje && "border-t-accent")}
              vazia={!ts.length && arrasto.arrastando ? "solte aqui" : undefined}
              {...arrasto.propsColuna(c.chave)}>
              {rs.map((r) => <LinhaReuniao key={r.id} r={r} />)}
              {ts.map((t) => <CartaoDia key={t.id} t={t} origemDaSemana={origemDaSemana} arrasto={arrasto} coluna={c.chave} />)}
              <AdicionarNoDia segunda={segunda} prazo={c.iso} />
              <div className="mt-1 flex flex-wrap gap-x-3">
                <Botao variante="link" tamanho="mini"
                  onClick={() => abrirNovo("tarefa", { prazo: c.iso, origem: origemDaSemana })}>+ tarefa completa</Botao>
                <Botao variante="link" tamanho="mini" title="abre o formulário da aba Reuniões, já com a data"
                  onClick={() => abrirNovo("reuniao", c.iso ? { data: c.iso } : {})}>+ reunião</Botao>
              </div>
            </Coluna>
          );
        })}
      </div>
      <Dica className="mt-1">Arraste um cartão para outro dia para mudar o prazo; em "Durante a semana" a tarefa fica sem prazo. Clique no cartão para editar.</Dica>
    </>
  );
}
