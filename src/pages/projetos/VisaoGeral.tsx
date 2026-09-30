/* Visão geral dos projetos: todos, em aberto ou arquivados, agrupados por
   edital (o status de cada um aparece no cartão e no Pipeline), com o
   progresso do formulário, filtros e o "Novo projeto". */
import { useState, type ReactNode } from "react";
import { paginaDoProjeto, usarCentral } from "../../store/central";
import { arquivarProjeto, duplicarProjeto } from "../../store/mutacoes";
import { abrirDetalhe, abrirProjeto } from "../../store/navegacao";
import { editalDoProjeto, nomeCurto, nomeEquipe, nomesArtistas, prazoCurto } from "../../lib/nomes";
import { resumoRascunho } from "../../lib/simulador/motor";
import { toast } from "../../components/Toast";
import { STATUS_EDITAL, STATUS_PROJETO, type Edital, type Projeto } from "../../types";
import { comparar, relativo } from "../../utils";
import { ModalNovoProjeto } from "./ModalNovoProjeto";
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
  if (p.formId === "livre") return <div className="ref">Livre: só a seção Geral</div>;
  const r = p.rascunhoId ? rascunhos[p.rascunhoId] : undefined;
  if (!r || !formularios[p.formId]) return <div className="ref">formulário {p.formId}</div>;
  const s = resumoRascunho(r);
  const pct = (k: "col" | "rev" | "rasc") => (s.total ? (100 * s[k]) / s.total : 0);
  const total = s.total ? Math.round((100 * (s.rasc + s.rev + s.col)) / s.total) : 0;
  return (
    <div className="prog">
      <div className="bar">
        <i className="c" style={{ width: pct("col") + "%" }} />
        <i className="v" style={{ width: pct("rev") + "%" }} />
        <i className="r" style={{ width: pct("rasc") + "%" }} />
      </div>
      {total}%
    </div>
  );
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
    return (
      <div className="card" key={p.id}>
        <button className="abrir" onClick={() => abrirProjeto(p.id)}>
          <h4>{p.nome}</h4>
          <div className="ref">
            {nomesArtistas(p)}{" · "}
            {e ? <>{nomeCurto(e)}{e.prazo && e.status !== "closed" ? " · prazo " + prazoCurto(e) : ""}</> : "sem edital"}
          </div>
        </button>
        <div className="proj-tags">
          <span className={"badge " + (STATUS_PROJETO.find((s) => s.id === p.status)?.classe || "")}>
            {STATUS_PROJETO.find((s) => s.id === p.status)?.rotulo}
          </span>
          {p.grupo && <span className="chip" title="faz parte de">{p.grupo}</span>}
          {p.inscricao && <span className="chip" title="nº de inscrição">nº {p.inscricao}</span>}
          {paginaDoProjeto(p.id) && <a className="chip" href={"/" + paginaDoProjeto(p.id)!.slug + "/"} title="página própria do projeto">página ↗</a>}
        </div>
        <ProgressoFormulario p={p} />
        <div className="meta">
          {p.respId ? nomeEquipe(p.respId) + " · " : ""}editado {relativo(p.atualizado)}
          <span className="sp">
            <button className="btn sm quiet" onClick={() => { const id = duplicarProjeto(p); toast("Projeto duplicado"); abrirProjeto(id); }}>Duplicar</button>
            <button className="btn sm quiet" onClick={() => { arquivarProjeto(p, !p.arquivado); toast(p.arquivado ? "Projeto reaberto" : "Projeto arquivado"); }}>
              {p.arquivado ? "Reabrir" : "Arquivar"}
            </button>
            {p.arquivado && <button className="btn sm quiet danger" onClick={() => exclusao.pedir(p)}>Excluir</button>}
          </span>
        </div>
      </div>
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
      <div className="grupo" key={chave}>
        <div className="grupo-h">
          <h3>{titulo}</h3>
          {extra}
          <span className="n">{projetos.length} projeto{projetos.length === 1 ? "" : "s"}</span>
        </div>
        <div className="rasc">{[...projetos].sort(porStatus).map(cartao)}</div>
      </div>
    );
    corpo = (
      <>
        {editais.map((e) => {
          const st = STATUS_EDITAL[e.status] || STATUS_EDITAL.open;
          const prazo = e.status !== "closed" && e.prazo ? prazoCurto(e) : "";
          return grupo(
            e.id,
            <a className="lnk" onClick={() => abrirDetalhe("edital", e.id)} title={e.nome}>{nomeCurto(e)}</a>,
            <>
              <span className={"badge " + st.classe}>{st.rotulo}</span>
              {prazo && <span className="plat">prazo {prazo}</span>}
            </>,
            lista.filter((p) => p.editalId === e.id),
          );
        })}
        {semEdital.some((p) => p.formId === "livre")
          && grupo("_livre", "Livre", <span className="plat">sem formulário de edital</span>, semEdital.filter((p) => p.formId === "livre"))}
        {semEdital.some((p) => p.formId !== "livre")
          && grupo("_sem", "Sem edital", null, semEdital.filter((p) => p.formId !== "livre"))}
      </>
    );
  } else {
    const ordenada = [...lista].sort((a, b) => ordem === "nome"
      ? comparar(a.nome, b.nome)
      : String(b.atualizado || "").localeCompare(String(a.atualizado || "")));
    corpo = <div className="rasc">{ordenada.map(cartao)}</div>;
  }

  return (
    <>
      <div className="shead">
        <div>
          <h2>Projetos</h2>
          <p className="sub">
            Cada projeto é uma candidatura: nasce ligado a um formulário mapeado (e ao edital dele) ou Livre.
            Aqui eles aparecem agrupados por edital; o status de cada um está no cartão e no Pipeline.
          </p>
        </div>
        <div className="acts">
          <button className="btn primary" onClick={() => setNovo(true)}>+ Novo projeto</button>
        </div>
      </div>

      <div className="mesa-tabs">
        <button className={aba === "abertos" ? "on" : ""} onClick={() => setAba("abertos")}>Em aberto <span>{abertos.length}</span></button>
        <button className={aba === "arquivados" ? "on" : ""} onClick={() => setAba("arquivados")}>Arquivados <span>{arquivados.length}</span></button>
      </div>

      <div className="filtros-sim">
        <input type="search" value={busca} placeholder="buscar projeto, artista, edital, nº…" onChange={(e) => setBusca(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">todos os status</option>
          {STATUS_PROJETO.map((s) => <option key={s.id} value={s.id}>{s.rotulo}</option>)}
        </select>
        <select value={artista} onChange={(e) => setArtista(e.target.value)}>
          <option value="">todos os artistas</option>
          {[...painel.artistas].sort((a, b) => comparar(a.nome, b.nome)).map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
        <select value={edital} onChange={(e) => setEdital(e.target.value)}>
          <option value="">todos os editais</option>
          {[...painel.editais].sort((a, b) => comparar(nomeCurto(a), nomeCurto(b))).map((e) => <option key={e.id} value={e.id}>{nomeCurto(e)}</option>)}
        </select>
        <select value={resp} onChange={(e) => setResp(e.target.value)}>
          <option value="">qualquer responsável</option>
          {painel.equipe.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <select value={ordem} onChange={(e) => setOrdem(e.target.value as typeof ordem)}>
          <option value="edital">agrupar por edital</option>
          <option value="recentes">editados por último</option>
          <option value="nome">nome A→Z</option>
        </select>
        <span className="n">{lista.length === base.length ? lista.length + " projeto(s)" : lista.length + " de " + base.length}</span>
      </div>

      <div className="legenda">
        <span className="l-r">rascunho</span><span className="l-v">revisado</span><span className="l-c">colado na plataforma</span><span>vazio</span>
      </div>

      {corpo}

      {!lista.length && (
        <div className="vazio-msg">
          {base.length
            ? "Nenhum projeto com esses filtros."
            : aba === "abertos" ? "Nenhum projeto em aberto. Crie um em \"+ Novo projeto\"." : "Nenhum projeto arquivado."}
        </div>
      )}

      {novo && <ModalNovoProjeto aoFechar={() => setNovo(false)} />}
      {exclusao.modal}
    </>
  );
}
