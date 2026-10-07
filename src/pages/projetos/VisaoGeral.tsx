/* Visão geral dos projetos: todos, em aberto ou arquivados, agrupados por
   edital (o status de cada um aparece no cartão e no Pipeline), com o
   progresso do formulário, filtros e o "Novo projeto". Cartões, e não
   tabela, porque cada projeto carrega barra de progresso, etiquetas e ações. */
import { useState, type ReactNode } from "react";
import { paginaDoProjeto, usarCentral } from "../../store/central";
import { arquivarProjeto, duplicarProjeto } from "../../store/mutacoes";
import { abrirDetalhe, abrirProjeto } from "../../store/navegacao";
import { editalDoProjeto, nomeCurto, nomeEquipe, nomesArtistas, prazoCurto } from "../../lib/nomes";
import { resumoRascunho } from "../../lib/simulador/motor";
import { toast } from "../../components/Toast";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../components/Filtros";
import { Badge } from "../../components/ui/Badge";
import { Barra } from "../../components/ui/Barra";
import { Botao } from "../../components/ui/Botao";
import { SubAbas } from "../../components/ui/CabecalhoFicha";
import { CartaoLista } from "../../components/ui/CartaoLista";
import { Chip } from "../../components/ui/Chip";
import { Grade } from "../../components/ui/Grade";
import { Vazio } from "../../components/ui/Vazio";
import { ESTILO_LINK } from "../../components/ui/estilos";
import { STATUS_EDITAL, STATUS_PROJETO, type Edital, type Projeto } from "../../types";
import { comparar, relativo } from "../../utils";
import { cx } from "../../utils/classes";
import { ModalNovoProjeto } from "./ModalNovoProjeto";
import { ResumoEdicoesCartao } from "./EdicoesDoProjeto";
import { usarExclusaoProjeto } from "./exclusao";

/** Ordem dos grupos: editais abertos e em fluxo contínuo primeiro, depois
    previstos, encerrados e normas; dentro de cada faixa, o prazo mais próximo
    primeiro (sem data vai para o fim da faixa). */
function compararEditais(a: Edital, b: Edital): number {
  const oa = STATUS_EDITAL[a.status]?.ordem ?? 9;
  const ob = STATUS_EDITAL[b.status]?.ordem ?? 9;
  if (oa !== ob) return oa - ob;
  const pa = a.prazoIso || "9999";
  const pb = b.prazoIso || "9999";
  if (pa !== pb) return pa.localeCompare(pb);
  return comparar(nomeCurto(a), nomeCurto(b));
}

/** Barra de progresso do formulário (colado, revisado, rascunho). */
export function ProgressoFormulario({ p }: { p: Projeto }) {
  const { rascunhos, formularios } = usarCentral();
  if (p.formId === "livre") return <div className="text-xs text-muted">Livre: só a seção Geral</div>;
  const r = p.rascunhoId ? rascunhos[p.rascunhoId] : undefined;
  if (!r || !formularios[p.formId]) return <div className="text-xs text-muted">formulário {p.formId}</div>;
  const s = resumoRascunho(r);
  const pct = (k: "col" | "rev" | "rasc") => (s.total ? (100 * s[k]) / s.total : 0);
  const total = s.total ? Math.round((100 * (s.rasc + s.rev + s.col)) / s.total) : 0;
  return (
    <div className="flex items-center gap-2.5 text-xs text-muted tabular-nums">
      <Barra className="flex-1" trechos={[{ pct: pct("col"), cor: "ok" }, { pct: pct("rev"), cor: "rev" }, { pct: pct("rasc"), cor: "gold" }]} />
      {total}%
    </div>
  );
}

/** Quadradinho da legenda das cores da barra. */
function Legenda({ cor, children }: { cor: string; children: ReactNode }) {
  return <span className="inline-flex items-center gap-1.5"><i className={cx("inline-block size-2.5 rounded-sm", cor)} />{children}</span>;
}

export function VisaoGeral() {
  const { painel } = usarCentral();
  const [aba, setAba] = useState<"abertos" | "arquivados">("abertos");
  const [novo, setNovo] = useState(false);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [artista, setArtista] = useState("");
  const [edital, setEdital] = useState("");
  const [resp, setResp] = useState("");
  const [ordem, setOrdem] = useState<"edital" | "recentes" | "nome">("edital");
  const exclusao = usarExclusaoProjeto();

  const abertos = painel.projetos.filter((p) => !p.arquivado);
  const arquivados = painel.projetos.filter((p) => p.arquivado);
  const base = aba === "abertos" ? abertos : arquivados;
  const termo = busca.trim().toLowerCase();
  const lista = base.filter((p) =>
    (!status || p.status === status)
    && (!artista || p.artistaIds.includes(artista))
    && (!edital || p.editalId === edital)
    && (!resp || p.respId === resp)
    && (!termo || [p.nome, p.grupo, nomesArtistas(p), nomeCurto(editalDoProjeto(p)), p.inscricao].join(" ").toLowerCase().includes(termo)));

  const cartao = (p: Projeto) => {
    const e = editalDoProjeto(p);
    const st = STATUS_PROJETO.find((s) => s.id === p.status);
    const pagina = paginaDoProjeto(p.id);
    return (
      <CartaoLista key={p.id} aoAbrir={() => abrirProjeto(p.id)} rotuloAbrir="abrir →"
        titulo={p.nome}
        sub={<>{nomesArtistas(p)}{" · "}{e ? <>{nomeCurto(e)}{e.prazo && e.status !== "closed" ? " · prazo " + prazoCurto(e) : ""}</> : "sem edital"}</>}
        rodape={
          <>
            <span className="min-w-0 truncate">{p.respId ? nomeEquipe(p.respId) + " · " : ""}editado {relativo(p.atualizado)}</span>
            <span className="ml-auto flex gap-0.5" onClick={(ev) => ev.stopPropagation()}>
              <Botao variante="quieto" tamanho="mini" onClick={() => { const id = duplicarProjeto(p); toast("Projeto duplicado"); abrirProjeto(id); }}>Duplicar</Botao>
              <Botao variante="quieto" tamanho="mini" onClick={() => { arquivarProjeto(p, !p.arquivado); toast(p.arquivado ? "Projeto reaberto" : "Projeto arquivado"); }}>
                {p.arquivado ? "Reabrir" : "Arquivar"}
              </Botao>
              {p.arquivado && <Botao variante="apagar" tamanho="mini" onClick={() => exclusao.pedir(p)}>Excluir</Botao>}
            </span>
          </>
        }>
        <div className="mb-2 flex flex-wrap items-center gap-1">
          <Badge tom={st?.classe || "neutro"}>{st?.rotulo}</Badge>
          {p.grupo && <Chip title="faz parte de">{p.grupo}</Chip>}
          {p.inscricao && <Chip title="nº de inscrição">nº {p.inscricao}</Chip>}
          {pagina && <a className={cx(ESTILO_LINK, "text-2xs")} href={"/" + pagina.slug + "/"} title="página própria do projeto" onClick={(ev) => ev.stopPropagation()}>página ↗</a>}
        </div>
        <ProgressoFormulario p={p} />
        <ResumoEdicoesCartao p={p} />
      </CartaoLista>
    );
  };

  let corpo;
  if (ordem === "edital") {
    // Um grupo por edital; "Livre" e "Sem edital" no fim. Dentro do grupo, pela ordem do pipeline.
    const porStatus = (a: Projeto, b: Projeto) =>
      STATUS_PROJETO.findIndex((s) => s.id === a.status) - STATUS_PROJETO.findIndex((s) => s.id === b.status)
      || comparar(a.nome, b.nome);
    const editais = [...new Set(lista.map((p) => p.editalId).filter(Boolean))]
      .map((id) => painel.editais.find((e) => e.id === id))
      .filter((e): e is Edital => Boolean(e))
      .sort(compararEditais);
    const semEdital = lista.filter((p) => !editalDoProjeto(p));
    const grupo = (chave: string, titulo: ReactNode, extra: ReactNode, projetos: Projeto[]) => (
      <div className="mb-6" key={chave}>
        <div className="mb-2.5 flex flex-wrap items-baseline gap-2.5 border-b border-line pb-1.5">
          <h3 className="m-0 text-base font-semibold">{titulo}</h3>
          {extra}
          <span className="ml-auto text-xs text-faint">{projetos.length} projeto{projetos.length === 1 ? "" : "s"}</span>
        </div>
        <Grade colunas="auto">{[...projetos].sort(porStatus).map(cartao)}</Grade>
      </div>
    );
    corpo = (
      <>
        {editais.map((e) => {
          const st = STATUS_EDITAL[e.status] || STATUS_EDITAL.open;
          const prazo = e.status !== "closed" && e.prazo ? prazoCurto(e) : "";
          return grupo(
            e.id,
            <a className={ESTILO_LINK} onClick={() => abrirDetalhe("edital", e.id)} title={e.nome}>{nomeCurto(e)}</a>,
            <>
              <Badge tom={st.classe}>{st.rotulo}</Badge>
              {prazo && <span className="text-xs text-faint">prazo {prazo}</span>}
            </>,
            lista.filter((p) => p.editalId === e.id),
          );
        })}
        {semEdital.some((p) => p.formId === "livre")
          && grupo("_livre", "Livre", <span className="text-xs text-faint">sem formulário de edital</span>, semEdital.filter((p) => p.formId === "livre"))}
        {semEdital.some((p) => p.formId !== "livre")
          && grupo("_sem", "Sem edital", null, semEdital.filter((p) => p.formId !== "livre"))}
      </>
    );
  } else {
    const ordenada = [...lista].sort((a, b) => ordem === "nome"
      ? comparar(a.nome, b.nome)
      : String(b.atualizado || "").localeCompare(String(a.atualizado || "")));
    corpo = <Grade colunas="auto">{ordenada.map(cartao)}</Grade>;
  }

  return (
    <>
      <CabecalhoSecao grande titulo="Projetos"
        sub="Cada projeto é uma candidatura: nasce ligado a um formulário mapeado (e ao edital dele) ou Livre. Aqui eles aparecem agrupados por edital; o status de cada um está no cartão e no Pipeline.">
        <Botao onClick={() => setNovo(true)}>+ Novo projeto</Botao>
      </CabecalhoSecao>

      <SubAbas className="mb-3.5 border-b border-line" ativa={aba} aoTrocar={(id) => setAba(id as typeof aba)}
        abas={[{ id: "abertos", rotulo: "Em aberto", n: abertos.length }, { id: "arquivados", rotulo: "Arquivados", n: arquivados.length }]} />

      <BarraFiltros mostrando={lista.length} total={base.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar projeto, artista, edital, nº…" />
        <SeletorFiltro valor={status} aoMudar={setStatus} rotuloTodos="todos os status"
          opcoes={STATUS_PROJETO.map((s) => ({ valor: s.id, rotulo: s.rotulo }))} />
        <SeletorFiltro valor={artista} aoMudar={setArtista} rotuloTodos="todos os artistas"
          opcoes={[...painel.artistas].sort((a, b) => comparar(a.nome, b.nome)).map((a) => ({ valor: a.id, rotulo: a.nome }))} />
        <SeletorFiltro valor={edital} aoMudar={setEdital} rotuloTodos="todos os editais"
          opcoes={[...painel.editais].sort((a, b) => comparar(nomeCurto(a), nomeCurto(b))).map((e) => ({ valor: e.id, rotulo: nomeCurto(e) }))} />
        <SeletorFiltro valor={resp} aoMudar={setResp} rotuloTodos="qualquer responsável"
          opcoes={painel.equipe.map((p) => ({ valor: p.id, rotulo: p.nome }))} />
        <SeletorFiltro valor={ordem} aoMudar={(v) => setOrdem(v as typeof ordem)}
          opcoes={[{ valor: "edital", rotulo: "agrupar por edital" }, { valor: "recentes", rotulo: "editados por último" }, { valor: "nome", rotulo: "nome A→Z" }]} />
      </BarraFiltros>

      <div className="mb-[18px] flex flex-wrap gap-4 text-xs text-muted">
        <Legenda cor="bg-gold">rascunho</Legenda>
        <Legenda cor="bg-rev">revisado</Legenda>
        <Legenda cor="bg-ok">colado na plataforma</Legenda>
        <Legenda cor="bg-vazio">vazio</Legenda>
      </div>

      {corpo}

      {!lista.length && (
        <Vazio>
          {base.length
            ? "Nenhum projeto com esses filtros."
            : aba === "abertos" ? "Nenhum projeto em aberto. Crie um em \"+ Novo projeto\"." : "Nenhum projeto arquivado."}
        </Vazio>
      )}

      {novo && <ModalNovoProjeto aoFechar={() => setNovo(false)} />}
      {exclusao.modal}
    </>
  );
}
