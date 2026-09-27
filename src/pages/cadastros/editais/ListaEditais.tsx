/* Editais (Cadastros): o Mapa dos Editais dentro da Central. Cinco vistas:
   Todos (por status, com filtros), O que pontua (critérios por conceito),
   Campos que se repetem (formulários por conceito), O que falta (lacunas por
   quem resolve) e Alertas (o que muda decisão, com data). */
import { useState } from "react";
import { usarCentral } from "../../../store/central";
import { abrirDetalhe } from "../../../store/navegacao";
import { abrirEdicao, abrirNovo } from "../../../store/edicao";
import { CabecalhoSecao } from "../../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../../components/Filtros";
import { nomeCurto, prazoCurto } from "../../../lib/nomes";
import {
  CATEGORIAS_EDITAL, ESFERAS, STATUS_EDITAL,
  type CategoriaEdital, type Edital, type EsferaEdital, type StatusEdital,
} from "../../../types";
import { comparar } from "../../../utils";
import { alertasVigentes, prazoEncerrado, statusEfetivo } from "../../../lib/prazos";
import { MatrizCriterios, MatrizCampos, QuemResolve, ListaAlertas } from "./Panoramas";

const VISTAS: [string, string][] = [
  ["todos", "Todos os editais"], ["pontua", "O que pontua"], ["campos", "Campos que se repetem"],
  ["falta", "O que falta"], ["alertas", "Alertas"],
];

/** Sim / não / não diz, para as bandeiras de quem pode se inscrever. */
const flag = (v: boolean | null | undefined, rotulo: string) =>
  v == null ? null : <span className={"chip " + (v ? "chip-sim" : "chip-nao")} title={rotulo + (v ? ": aceita" : ": não aceita")}>{v ? "✓" : "✕"} {rotulo}</span>;

export function CartaoEdital({ e }: { e: Edital }) {
  const { painel } = usarCentral();
  const esf = ESFERAS[e.esfera as EsferaEdital] || { rotulo: "—", classe: "" };
  const st = STATUS_EDITAL[statusEfetivo(e)] || STATUS_EDITAL.open;
  const vigentes = alertasVigentes(e).length;
  const cat = CATEGORIAS_EDITAL[(e.categoria || "edital") as CategoriaEdital];
  const n = painel.projetos.filter((p) => p.editalId === e.id && !p.arquivado).length;
  const formularios = [...new Set([...(e.formIds || []), ...(e.formId ? [e.formId] : [])])];
  return (
    <div className="card click" onClick={() => abrirDetalhe("edital", e.id)}>
      <button className="edit" onClick={(ev) => { ev.stopPropagation(); abrirEdicao("edital", e.id); }}>editar</button>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
        <span className={"badge " + st.classe}>{st.rotulo}</span>
        {prazoEncerrado(e) && <span className="badge ur-vencido" title="Marcado como Aberto, mas o prazo passou: atualize o status">prazo passou</span>}
        <span className={"badge esfera " + esf.classe}>{esf.rotulo}</span>
        {cat && e.categoria && e.categoria !== "edital" && <span className="badge b-type">{cat.rotulo}</span>}
        {vigentes > 0 && <span className="badge ur-d7" title="alertas que mudam decisão (com data ainda valendo)">⚑ {vigentes}</span>}
      </div>
      <h3>{nomeCurto(e)}</h3>
      <p className="role">{e.nome}</p>
      {e.orgao && <div className="kv"><span>Órgão:</span> <b className="corta">{e.orgao}</b></div>}
      <div className="kv"><span>Prazo:</span> <b title={e.prazo}>{prazoCurto(e) || "—"}</b></div>
      {e.teto && <div className="kv"><span>Valores:</span> <b className="corta">{e.teto}</b></div>}
      <div style={{ marginTop: 6 }}>
        {flag(e.aceitaPf, "PF")}{flag(e.aceitaMei, "MEI")}{flag(e.aceitaColetivo, "coletivo sem CNPJ")}
      </div>
      <div className="foot">
        {n} projeto(s)
        {formularios.length > 0 && <span className="chip">{formularios.length > 1 ? formularios.length + " formulários" : "formulário mapeado"}</span>}
        {e.confianca && <span className={"conf conf-" + e.confianca} title="confiança do levantamento">{e.confianca}</span>}
        <span className="arrow">abrir →</span>
      </div>
    </div>
  );
}

export function ListaEditais() {
  const { painel } = usarCentral();
  const [vista, setVista] = useState("todos");
  const [busca, setBusca] = useState("");
  const [esfera, setEsfera] = useState("");
  const [status, setStatus] = useState("");
  const [categoria, setCategoria] = useState("");
  const [aceita, setAceita] = useState("");
  const [ordem, setOrdem] = useState("status");

  const termo = busca.toLowerCase();
  const editais = painel.editais.filter((e) =>
    (!esfera || e.esfera === esfera) &&
    (!status || statusEfetivo(e) === status) &&
    (!categoria || (e.categoria || "edital") === categoria) &&
    (!aceita || (aceita === "pf" ? e.aceitaPf : aceita === "mei" ? e.aceitaMei : e.aceitaColetivo)) &&
    (!termo || [e.nome, e.curto || "", e.orgao || "", e.mec, e.area, e.teto, e.estimula || ""].join(" ").toLowerCase().includes(termo)));

  const porPrazo = (a: Edital, b: Edital) => ((a.prazoIso || "9999") < (b.prazoIso || "9999") ? -1 : (a.prazoIso || "9999") > (b.prazoIso || "9999") ? 1 : 0);
  if (ordem === "prazo") editais.sort(porPrazo);
  if (ordem === "nome") editais.sort((a, b) => comparar(nomeCurto(a), nomeCurto(b)));
  if (ordem === "recentes") editais.sort((a, b) => (b.atualizado || "").localeCompare(a.atualizado || ""));

  let corpo;
  if (vista === "pontua") corpo = <MatrizCriterios editais={editais} />;
  else if (vista === "campos") corpo = <MatrizCampos editais={editais} />;
  else if (vista === "falta") corpo = <QuemResolve editais={editais} />;
  else if (vista === "alertas") corpo = <ListaAlertas editais={editais} />;
  else if (ordem === "status") {
    corpo = (Object.keys(STATUS_EDITAL) as StatusEdital[]).map((s) => {
      const doGrupo = editais.filter((e) => statusEfetivo(e) === s).sort(porPrazo);
      if (!doGrupo.length) return null;
      return (
        <div key={s} style={{ marginBottom: 18 }}>
          <div className="grupo-edital">{STATUS_EDITAL[s].rotulo} <span className="muted">· {doGrupo.length}</span></div>
          <div className="grid g2">{doGrupo.map((e) => <CartaoEdital key={e.id} e={e} />)}</div>
        </div>
      );
    });
  } else {
    corpo = <div className="grid g2">{editais.map((e) => <CartaoEdital key={e.id} e={e} />)}</div>;
  }

  return (
    <>
      <CabecalhoSecao titulo="Editais & fontes" sub="o Mapa dos Editais: o que cada um quer, como avalia e o que o formulário pede">
        <button className="btn" onClick={() => abrirNovo("edital")}>+ Novo edital</button>
      </CabecalhoSecao>

      <div className="pilulas">
        {VISTAS.map(([k, rotulo]) => (
          <button key={k} className={vista === k ? "on" : ""} onClick={() => setVista(k)}>{rotulo}</button>
        ))}
      </div>

      <BarraFiltros mostrando={editais.length} total={painel.editais.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar nome, órgão, o que financia…" />
        <SeletorFiltro valor={status} aoMudar={setStatus} rotuloTodos="qualquer status"
          opcoes={Object.entries(STATUS_EDITAL).map(([v, s]) => ({ valor: v, rotulo: s.rotulo }))} />
        <SeletorFiltro valor={categoria} aoMudar={setCategoria} rotuloTodos="todas as categorias"
          opcoes={Object.entries(CATEGORIAS_EDITAL).map(([v, c]) => ({ valor: v, rotulo: c.rotulo }))} />
        <SeletorFiltro valor={esfera} aoMudar={setEsfera} rotuloTodos="todas as esferas"
          opcoes={Object.entries(ESFERAS).map(([v, e]) => ({ valor: v, rotulo: e.rotulo }))} />
        <SeletorFiltro valor={aceita} aoMudar={setAceita} rotuloTodos="qualquer proponente"
          opcoes={[{ valor: "coletivo", rotulo: "aceita coletivo sem CNPJ" }, { valor: "pf", rotulo: "aceita pessoa física" }, { valor: "mei", rotulo: "aceita MEI" }]} />
        {vista === "todos" && (
          <SeletorFiltro valor={ordem} aoMudar={setOrdem}
            opcoes={[
              { valor: "status", rotulo: "agrupar por status" },
              { valor: "prazo", rotulo: "prazo mais próximo" },
              { valor: "nome", rotulo: "nome A→Z" },
              { valor: "recentes", rotulo: "editados por último" },
            ]} />
        )}
      </BarraFiltros>

      {corpo}
      {!editais.length && <p className="muted">Nenhum edital com esses filtros.</p>}
    </>
  );
}
