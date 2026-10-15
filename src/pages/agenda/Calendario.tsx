/* Calendário: grade do mês com tudo listado no dia, uma cor por tipo: prazo
   de edital em vermelho cheio (destaque), reunião em azul e tarefa em verde,
   mais a célula da semana (rótulo e os focos da aba Semana) à esquerda de cada
   linha. Clicar num dia abre o painel do dia ao lado da grade (DiaDoCalendario),
   sem sair da aba; o marcador do edital abre a ficha direto; a célula da semana
   é o único atalho para a aba Semana. Três filtros por tipo, lembrados no
   navegador, que também são a legenda das cores. A grade rola de lado no celular. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { abrirDetalhe, abrirSemana } from "../../store/navegacao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { Botao } from "../../components/ui/Botao";
import { CaixaMarcar } from "../../components/ui/Campo";
import { Rotulo } from "../../components/ui/Rotulo";
import { Dica } from "../../components/ui/Dica";
import { cx } from "../../utils/classes";
import { filtrarItens, itensPorDia, tituloCurto, type ItensDoDia, type TipoItem } from "../../lib/agenda";
import { hojeIso } from "../../lib/prazos";
import { rotuloSemana, segundaDe, somarDias } from "../../lib/semana";
import { DiaDoCalendario } from "./DiaDoCalendario";
import type { Semana } from "../../types";
import { MESES } from "../../utils";

/** Cor de cada tipo: o marcador na célula e o quadradinho da legenda ao lado do filtro. */
const COR_TIPO: Record<TipoItem, { marcador: string; legenda: string }> = {
  editais: { marcador: "bg-accent text-on-fill hover:bg-ink", legenda: "bg-accent" },
  reunioes: { marcador: "bg-est-soft text-est", legenda: "bg-est" },
  tarefas: { marcador: "bg-ok-soft text-ok", legenda: "bg-ok" },
};
const FILTROS: [TipoItem, string][] = [["editais", "Editais"], ["reunioes", "Reuniões"], ["tarefas", "Tarefas"]];
const CHAVE_FILTROS = "central-calendario-filtros";

function carregarFiltros(): Record<TipoItem, boolean> {
  const padrao = { editais: true, tarefas: true, reunioes: true };
  try { return { ...padrao, ...JSON.parse(localStorage.getItem(CHAVE_FILTROS) || "{}") }; } catch { return padrao; }
}

/** Meses que aparecem no calendário: os que têm algum item + o mês atual. */
function mesesDoCalendario(dias: string[], mesAtual: string): string[] {
  const conjunto = new Set(dias.map((d) => d.slice(0, 7)));
  conjunto.add(mesAtual);
  return [...conjunto].sort();
}

/** Célula da semana, à esquerda da linha: o intervalo e os focos da aba Semana. Clique abre a semana. */
function CelulaSemana({ segunda, doc }: { segunda: string; doc?: Semana }) {
  return (
    <div
      className="min-h-20 cursor-pointer rounded-lg border border-line bg-bg-sunk p-1.5 hover:border-accent"
      title="abrir a aba Semana nesta semana" onClick={() => abrirSemana(segunda)}>
      <Rotulo>{rotuloSemana(segunda).replace("Semana de ", "")}</Rotulo>
      {doc?.focos
        ? <p className="m-0 mt-1 line-clamp-3 whitespace-pre-line text-2xs leading-tight text-muted">{doc.focos}</p>
        : <p className="m-0 mt-1 text-2xs text-faint">sem focos</p>}
    </div>
  );
}

const MARCADOR = "mt-1 truncate rounded-md px-1.5 py-0.5 text-3xs font-semibold leading-tight";

/** Um dia da grade: número no alto e um marcador por item, na cor do tipo: prazo de
    edital (clique abre a ficha), reunião com hora e tarefa. Clique na célula seleciona
    o dia. `vazia` é o espaço antes do dia 1 e depois do último. */
function Celula({ vazia, iso, itens, hoje, selecionado, aoSelecionar }: {
  vazia?: boolean; iso: string; itens?: ItensDoDia; hoje: string; selecionado: boolean; aoSelecionar: () => void;
}) {
  if (vazia) return <div className="min-h-20 rounded-lg border border-transparent p-1.5" />;
  const ehHoje = iso === hoje;
  return (
    <div
      className={cx(
        "min-h-20 cursor-pointer rounded-lg border bg-card p-1.5 hover:border-ink",
        ehHoje ? "border-accent" : "border-line",
        selecionado && "bg-bg-sunk ring-2 ring-ink",
      )}
      title="ver o dia" onClick={aoSelecionar}>
      <div className={cx("text-xs font-semibold", ehHoje ? "text-accent" : "text-faint")}>{Number(iso.slice(8))}</div>
      {(itens?.editais || []).map((e) => (
        <div key={e.editalId} title="abrir a ficha do edital" className={cx(MARCADOR, COR_TIPO.editais.marcador)}
          onClick={(ev) => { ev.stopPropagation(); abrirDetalhe("edital", e.editalId); }}>
          {tituloCurto(e.titulo)}
        </div>
      ))}
      {(itens?.reunioes || []).map((r) => {
        const texto = (r.hora ? r.hora + " " : "") + (r.titulo || "Reunião");
        return <div key={r.id} className={cx(MARCADOR, COR_TIPO.reunioes.marcador)} title={texto}>{texto}</div>;
      })}
      {(itens?.tarefas || []).map((t) => (
        <div key={t.id} className={cx(MARCADOR, COR_TIPO.tarefas.marcador)} title={t.titulo}>{t.titulo}</div>
      ))}
    </div>
  );
}

export function Calendario() {
  const { painel, semanas } = usarCentral();
  const hoje = hojeIso();
  const [filtros, setFiltros] = useState(carregarFiltros);
  const todos = itensPorDia(painel);
  const mesAtual = hoje.slice(0, 7);
  const meses = mesesDoCalendario(Object.keys(todos), mesAtual);
  // Guarda o mês (não a posição): a lista de meses muda quando os dados chegam.
  const [mesAberto, setMesAberto] = useState(mesAtual);
  const [diaAberto, setDiaAberto] = useState(hoje);

  const i = Math.max(0, meses.indexOf(mesAberto));
  const [ano, mes] = meses[i].split("-").map(Number);
  const primeiroIso = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const inicioSemana = (new Date(ano, mes - 1, 1).getDay() + 6) % 7; // semana começa na segunda
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const linhas = Math.ceil((inicioSemana + diasNoMes) / 7);
  const segundaInicial = somarDias(primeiroIso, -inicioSemana);

  // Troca de mês: o dia aberto vai para hoje (no mês atual) ou para o dia 1.
  function irParaMes(chave: string) {
    setMesAberto(chave);
    setDiaAberto(chave === mesAtual ? hoje : chave + "-01");
  }
  function alternarFiltro(tipo: TipoItem) {
    const novo = { ...filtros, [tipo]: !filtros[tipo] };
    setFiltros(novo);
    try { localStorage.setItem(CHAVE_FILTROS, JSON.stringify(novo)); } catch { /* sem localStorage: só não lembra */ }
  }
  const itensDe = (iso: string) => (todos[iso] ? filtrarItens(todos[iso], filtros) : undefined);

  const celulas = [];
  for (let linha = 0; linha < linhas; linha++) {
    const segunda = somarDias(segundaInicial, linha * 7);
    celulas.push(<CelulaSemana key={"s" + segunda} segunda={segunda} doc={semanas[segunda]} />);
    for (let coluna = 0; coluna < 7; coluna++) {
      const iso = somarDias(segunda, coluna);
      const foraDoMes = iso.slice(0, 7) !== meses[i];
      celulas.push(
        <Celula key={iso} vazia={foraDoMes} iso={iso} itens={itensDe(iso)} hoje={hoje}
          selecionado={iso === diaAberto} aoSelecionar={() => setDiaAberto(iso)} />,
      );
    }
  }

  return (
    <>
      <CabecalhoSecao titulo="Calendário" sub="visão de mês — prazos dos editais, reuniões e tarefas no dia, uma cor por tipo" />
      <CabecalhoSecao titulo={`${MESES[mes - 1]} ${ano}`}>
        {FILTROS.map(([tipo, rotulo]) => (
          <label key={tipo} className="mr-1 flex cursor-pointer items-center gap-1.5 text-sm">
            <CaixaMarcar marcado={filtros[tipo]} aoMudar={() => alternarFiltro(tipo)} title={filtros[tipo] ? "esconder" : "mostrar"} />
            <span className={cx("inline-block size-2.5 rounded-sm", COR_TIPO[tipo].legenda)} />
            {rotulo}
          </label>
        ))}
        <Botao variante="fantasma" tamanho="pequeno" onClick={() => irParaMes(meses[Math.max(0, i - 1)])}>←</Botao>
        <Botao variante="fantasma" tamanho="pequeno" onClick={() => irParaMes(meses[Math.min(meses.length - 1, i + 1)])}>→</Botao>
      </CabecalhoSecao>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="overflow-x-auto">
          <div className="grid min-w-[640px] grid-cols-[minmax(104px,1fr)_repeat(7,minmax(0,1fr))] gap-1.5">
            <Rotulo className="p-0.5">Semana</Rotulo>
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => <Rotulo key={d} className="p-0.5 text-center">{d}</Rotulo>)}
            {celulas}
          </div>
        </div>
        <DiaDoCalendario iso={diaAberto} itens={itensDe(diaAberto)} />
      </div>
      <Dica className="mt-2">Clique no dia para ver o que ele tem ao lado; no marcador vermelho, abre a ficha do edital; na célula da semana, abre a aba Semana. As tarefas são as em aberto com prazo no dia.</Dica>
    </>
  );
}
