/* Editais (Cadastros): o Mapa dos Editais dentro da Central. Cinco vistas:
   Todos (tabela com filtros, agrupada por status ou ordenada), O que pontua
   (critérios por conceito), Campos que se repetem (formulários por conceito),
   O que falta (lacunas por quem resolve) e Alertas (o que muda decisão, com
   data). Na tabela, a linha abre a ficha e "editar" abre o formulário. */
import { useState } from "react";
import { usarCentral } from "../../../store/central";
import { abrirDetalhe } from "../../../store/navegacao";
import { abrirEdicao, abrirNovo } from "../../../store/edicao";
import { CabecalhoSecao } from "../../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../../components/Filtros";
import { Badge } from "../../../components/ui/Badge";
import { Botao } from "../../../components/ui/Botao";
import { Chip } from "../../../components/ui/Chip";
import { Pilulas } from "../../../components/ui/Pilulas";
import { Rotulo } from "../../../components/ui/Rotulo";
import { Tabela, Td, Th, Tr } from "../../../components/ui/Tabela";
import { Vazio } from "../../../components/ui/Vazio";
import { ESTILO_APAGADO } from "../../../components/ui/estilos";
import { cx } from "../../../utils/classes";
import { nomeCurto, prazoCurto } from "../../../lib/nomes";
import {
  CATEGORIAS_EDITAL, ESFERAS, STATUS_EDITAL,
  type CategoriaEdital, type Edital, type EsferaEdital, type StatusEdital,
} from "../../../types";
import { comparar } from "../../../utils";
import {
  CLASSE_URGENCIA, ROTULO_URGENCIA, alertasVigentes, prazoEncerrado, statusEfetivo, urgenciaDe,
} from "../../../lib/prazos";
import { BadgeConfianca } from "../formularios/ListaFormularios";
import { MatrizCriterios, MatrizCampos, QuemResolve, ListaAlertas } from "./Panoramas";

const VISTAS = [
  { id: "todos", rotulo: "Todos os editais" }, { id: "pontua", rotulo: "O que pontua" },
  { id: "campos", rotulo: "Campos que se repetem" }, { id: "falta", rotulo: "O que falta" },
  { id: "alertas", rotulo: "Alertas" },
];

/** Sim / não / não diz, para as bandeiras de quem pode se inscrever. */
const bandeira = (v: boolean | null | undefined, rotulo: string) =>
  v == null ? null : (
    <Badge mini tom={v ? "ok" : "erro"} title={rotulo + (v ? ": aceita" : ": não aceita")}>{v ? "✓" : "✕"} {rotulo}</Badge>
  );

/** Urgência do prazo, só quando o edital ainda conta (não encerrado nem norma) e está perto. */
function BadgePrazo({ e }: { e: Edital }) {
  const st = statusEfetivo(e);
  if (!e.prazoIso || st === "closed" || st === "norma") return null;
  const u = urgenciaDe(e.prazoIso);
  if (u === "futuro") return null;
  return <Badge mini tom={CLASSE_URGENCIA[u]}>{ROTULO_URGENCIA[u]}</Badge>;
}

const COLUNAS = 10;
const CABECALHO = (
  <thead>
    <tr>
      <Th>Edital</Th>
      <Th>Status</Th>
      <Th>Esfera</Th>
      <Th>Órgão</Th>
      <Th>Prazo</Th>
      <Th>Valores</Th>
      <Th>Aceita</Th>
      <Th><span className="block text-right">Projetos</span></Th>
      <Th>Formulário</Th>
      <Th />
    </tr>
  </thead>
);

/** Uma linha da tabela de editais: o que o cartão antigo mostrava, em colunas. */
export function LinhaEdital({ e }: { e: Edital }) {
  const { painel } = usarCentral();
  const esf = ESFERAS[e.esfera as EsferaEdital] || { rotulo: "—", classe: "" };
  const st = STATUS_EDITAL[statusEfetivo(e)] || STATUS_EDITAL.open;
  const vigentes = alertasVigentes(e).length;
  const cat = CATEGORIAS_EDITAL[(e.categoria || "edital") as CategoriaEdital];
  const n = painel.projetos.filter((p) => p.editalId === e.id && !p.arquivado).length;
  const formularios = [...new Set([...(e.formIds || []), ...(e.formId ? [e.formId] : [])])];
  return (
    <Tr aoClicar={() => abrirDetalhe("edital", e.id)}>
      <Td className="min-w-[200px]">
        <div className="font-semibold">{nomeCurto(e)}</div>
        <div className={cx(ESTILO_APAGADO, "max-w-[40ch] truncate")} title={e.nome}>{e.nome}</div>
      </Td>
      <Td>
        <div className="flex flex-wrap gap-1">
          <Badge tom={st.classe}>{st.rotulo}</Badge>
          {prazoEncerrado(e) && <Badge tom="ur-vencido" title="Marcado como Aberto, mas o prazo passou: atualize o status">prazo passou</Badge>}
          {vigentes > 0 && <Badge tom="ur-d7" title="alertas que mudam decisão (com data ainda valendo)">⚑ {vigentes}</Badge>}
        </div>
      </Td>
      <Td>
        <div className="flex flex-wrap gap-1">
          <Badge tom={esf.classe}>{esf.rotulo}</Badge>
          {cat && e.categoria && e.categoria !== "edital" && <Badge tom="tipo">{cat.rotulo}</Badge>}
        </div>
      </Td>
      <Td><div className="max-w-[24ch] truncate" title={e.orgao}>{e.orgao || "—"}</div></Td>
      <Td>
        <div className="flex flex-wrap items-center gap-1 whitespace-nowrap" title={e.prazo}>
          {prazoCurto(e) || "—"}
          <BadgePrazo e={e} />
        </div>
      </Td>
      <Td><div className="max-w-[28ch] truncate" title={e.teto}>{e.teto || "—"}</div></Td>
      <Td>
        <div className="flex flex-wrap gap-1">
          {bandeira(e.aceitaPf, "PF")}{bandeira(e.aceitaMei, "MEI")}{bandeira(e.aceitaColetivo, "coletivo sem CNPJ")}
        </div>
      </Td>
      <Td numerico>{n || ""}</Td>
      <Td>
        <div className="flex flex-wrap items-center gap-1">
          {formularios.length > 0 && <Chip>{formularios.length > 1 ? formularios.length + " formulários" : "formulário mapeado"}</Chip>}
          {e.confianca && <BadgeConfianca nivel={e.confianca} />}
        </div>
      </Td>
      <Td className="text-right">
        <Botao variante="quieto" tamanho="mini" onClick={(ev) => { ev.stopPropagation(); abrirEdicao("edital", e.id); }}>editar</Botao>
      </Td>
    </Tr>
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
  else if (!editais.length) corpo = null;
  else if (ordem === "status") {
    // Um tbody por status, com o rótulo do grupo numa linha inteira.
    corpo = (
      <Tabela minima="min-w-[960px]">
        {CABECALHO}
        {(Object.keys(STATUS_EDITAL) as StatusEdital[]).map((s) => {
          const doGrupo = editais.filter((e) => statusEfetivo(e) === s).sort(porPrazo);
          if (!doGrupo.length) return null;
          return (
            <tbody key={s}>
              <tr>
                <td colSpan={COLUNAS} className="border-t border-line bg-bg px-3 py-1.5">
                  <Rotulo>{STATUS_EDITAL[s].rotulo} · {doGrupo.length}</Rotulo>
                </td>
              </tr>
              {doGrupo.map((e) => <LinhaEdital key={e.id} e={e} />)}
            </tbody>
          );
        })}
      </Tabela>
    );
  } else {
    corpo = (
      <Tabela minima="min-w-[960px]">
        {CABECALHO}
        <tbody>{editais.map((e) => <LinhaEdital key={e.id} e={e} />)}</tbody>
      </Tabela>
    );
  }

  return (
    <>
      <CabecalhoSecao titulo="Editais & fontes" sub="o Mapa dos Editais: o que cada um quer, como avalia e o que o formulário pede">
        <Botao onClick={() => abrirNovo("edital")}>+ Novo edital</Botao>
      </CabecalhoSecao>

      <Pilulas opcoes={VISTAS} ativa={vista} aoEscolher={setVista} />

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
      {!editais.length && <Vazio>Nenhum edital com esses filtros.</Vazio>}
    </>
  );
}
