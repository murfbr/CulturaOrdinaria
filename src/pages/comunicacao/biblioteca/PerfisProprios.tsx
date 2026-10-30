/* Perfis próprios: os perfis de Instagram dos planos do coletivo (doc 01 da
   metodologia, seção 8b). A lista mostra cada perfil, os planos que publicam
   nele, quem tem acesso e quem alimenta. A ficha (#/comunicacao/biblioteca/pp-…)
   tem a camada "por dentro", tirada do Meta Business Suite: público, quem
   publica (próprio ou collab), formato, editoria, dia, horário, os melhores,
   os impulsionados e o diagnóstico. É o que era a aba Instagram do Painel
   Ponta de Lança, com as mesmas contas (calculoProprio.ts). Quando o perfil
   também tem leitura de fora (como as referências), a ficha aponta pra ela. */
import { useEffect, useState } from "react";
import { BarraFiltros, SeletorFiltro } from "../../../components/Filtros";
import { Badge } from "../../../components/ui/Badge";
import { Barra } from "../../../components/ui/Barra";
import { CabecalhoFicha } from "../../../components/ui/CabecalhoFicha";
import { CartaoLista } from "../../../components/ui/CartaoLista";
import { Dado, Dados } from "../../../components/ui/Dados";
import { Grade } from "../../../components/ui/Grade";
import { GradeKpis, Kpi } from "../../../components/ui/Kpi";
import { Painel } from "../../../components/ui/Painel";
import { Tabela, Td, Th } from "../../../components/ui/Tabela";
import { Vazio } from "../../../components/ui/Vazio";
import { abrirLeiturasProprias, usarComunicacao } from "../../../store/comunicacao";
import { definirBibliotecaAberta } from "../../../store/navegacao";
import type { AcessoProprio, FatiaPublico, LeituraPropria, PerfilProprio, PostProprio } from "../../../types";
import { comparar } from "../../../utils";
import { diaMes, formatar } from "./calculo";
import {
  alcanceOrganico, impulsionados, melhores, organicas, porAutor, porDia, porEditoria, porFormato, porHorario,
  resumoProprio, type LinhaProprio,
} from "./calculoProprio";
import { ListaTexto, Texto } from "./Texto";

const dataLonga = (d: string) => diaMes(d) + "/" + d.slice(0, 4);
const ROTULO_ACESSO: Record<AcessoProprio, string> = {
  total: "acesso total", pedir: "acesso a pedir", "temporário": "acesso temporário", "sem perfil": "perfil a criar",
};
const TOM_ACESSO: Record<AcessoProprio, "ok" | "aviso" | "neutro"> = { total: "ok", pedir: "aviso", "temporário": "aviso", "sem perfil": "neutro" };
const quando = (p: PostProprio) => diaMes(p.publicadoEm.slice(0, 10)) + ", " + p.publicadoEm.slice(11, 16).replace(":", "h");

/** Perfis em ordem: com leitura por dentro primeiro, depois os no ar, depois os a criar. */
export function perfisEmOrdem(perfis: Record<string, PerfilProprio>): PerfilProprio[] {
  const peso = (p: PerfilProprio) => (p.leituras?.length ? 0 : p.situacao === "no ar" ? 1 : 2);
  return Object.values(perfis).sort((a, b) => peso(a) - peso(b) || comparar(a.nome, b.nome));
}

function Arroba({ perfil }: { perfil: PerfilProprio }) {
  if (perfil.instagram) {
    return <a href={"https://www.instagram.com/" + perfil.instagram + "/"} target="_blank" rel="noreferrer" className="font-semibold text-accent hover:underline">@{perfil.instagram}</a>;
  }
  return <span className="text-muted">{perfil.situacao === "a criar" ? "perfil ainda não existe" : "@ a confirmar"}</span>;
}

/** A lista dos perfis próprios, com filtro por plano. */
export function ListaPerfisProprios() {
  const com = usarComunicacao();
  const [plano, setPlano] = useState("");
  const todos = perfisEmOrdem(com.perfisProprios);
  const planos = [...new Set(todos.flatMap((p) => p.planos))].sort(comparar);
  const lista = plano ? todos.filter((p) => p.planos.includes(plano)) : todos;

  if (com.propriosSemAcesso) {
    return (
      <Painel alerta titulo="Sem acesso aos perfis próprios">
        As regras do Firestore ainda não têm as coleções perfisProprios e leiturasProprias (o arquivo firestore.rules do
        repositório tem as linhas; publicar pelo console). O resto da Biblioteca segue normal.
      </Painel>
    );
  }
  if (!todos.length && !com.propriosProntos) return <div className="py-10 text-center text-lg text-muted">carregando os perfis próprios…</div>;
  if (!todos.length) return <Vazio>Nenhum perfil próprio na Central ainda. Eles chegam pelo arquivo da Biblioteca, na vista Importar.</Vazio>;
  return (
    <>
      <BarraFiltros mostrando={lista.length} total={todos.length}>
        {planos.length > 1 && <SeletorFiltro valor={plano} aoMudar={setPlano} rotuloTodos="todos os planos" opcoes={planos} />}
      </BarraFiltros>
      <Grade colunas={2}>
        {lista.map((p) => {
          const ultima = p.leituras?.[p.leituras.length - 1];
          return (
            <CartaoLista key={p.id} aoAbrir={() => definirBibliotecaAberta(p.id)} rotuloAbrir="abrir o perfil →"
              etiquetas={<>
                <Badge mini tom={TOM_ACESSO[p.acesso]}>{ROTULO_ACESSO[p.acesso] || p.acesso}</Badge>
                {ultima ? <Badge mini tom="ok">por dentro em {dataLonga(ultima.data)}</Badge> : <Badge mini>sem leitura por dentro</Badge>}
              </>}
              titulo={p.nome}
              sub={<Arroba perfil={p} />}>
              <Dados compacto className="mt-2">
                <Dado compacto rotulo="Planos">{p.planos.join(", ") || "—"}</Dado>
                <Dado compacto rotulo="Quem acessa">{p.quemAcessa || "—"}</Dado>
                <Dado compacto rotulo="Quem alimenta">{p.alimenta || "—"}</Dado>
              </Dados>
            </CartaoLista>
          );
        })}
      </Grade>
    </>
  );
}

/** Barras de uma parte do público (gênero, idade, cidades). */
function Fatias({ fatias }: { fatias: FatiaPublico[] }) {
  if (!fatias.length) return <p className="m-0 text-base text-muted">Sem dado nesta leitura.</p>;
  const max = Math.max(...fatias.map((f) => f.parcela), 0.0001);
  return (
    <div className="flex flex-col gap-2">
      {fatias.map((f) => (
        <div key={f.rotulo} className="grid grid-cols-[minmax(7rem,11rem)_1fr_3.5rem] items-center gap-2 text-sm">
          <span className="truncate text-ink">{f.rotulo}</span>
          <Barra pct={f.parcela / max * 100} />
          <span className="text-right tabular-nums">{formatar(f.parcela, "pct")}</span>
        </div>
      ))}
    </div>
  );
}

/** Tabela de linhas (quem publica, formato, editoria, dia, horário), com a maior mediana em negrito. */
function TabelaLinhas({ linhas, rotulo, comCompart, comSeguidores }: { linhas: LinhaProprio[]; rotulo: string; comCompart?: boolean; comSeguidores?: boolean }) {
  const topo = Math.max(...linhas.map((l) => l.views ?? -1));
  return (
    <Tabela simples>
      <thead><tr>
        <Th>{rotulo}</Th><Th numerico>Posts</Th><Th numerico>Visualizações</Th>
        {comSeguidores && <Th numerico>Seguidores</Th>}
        {comCompart && <Th numerico>Compart./mil</Th>}
      </tr></thead>
      <tbody>
        {linhas.map((l) => (
          <tr key={l.rotulo}>
            <Td>{l.rotulo}</Td>
            <Td numerico>{l.posts}</Td>
            <Td numerico className={l.views === topo && l.posts ? "font-semibold" : ""}>{l.posts ? formatar(l.views, "int") : "—"}</Td>
            {comSeguidores && <Td numerico>{formatar(l.seguidores, "int")}</Td>}
            {comCompart && <Td numerico>{formatar(l.compartPorMil, "int")}</Td>}
          </tr>
        ))}
      </tbody>
    </Tabela>
  );
}

function TabelaPostsProprios({ posts, colunas }: { posts: PostProprio[]; colunas: "melhores" | "impulsionados" | "todos" }) {
  return (
    <Tabela simples minima="min-w-[760px]">
      <thead><tr>
        <Th>Publicado</Th><Th>Formato</Th>{colunas === "todos" && <Th>Quem</Th>}<Th>Editoria</Th>
        {colunas === "impulsionados"
          ? <><Th numerico>Alcance</Th><Th numerico>Alcance pago</Th></>
          : <><Th numerico>Visualizações</Th><Th numerico>Alcance</Th></>}
        {colunas !== "impulsionados" && <Th numerico>Compart.</Th>}
        {colunas === "todos" && <Th numerico>Salvam.</Th>}
        <Th numerico>Seguidores</Th><Th>Começo da legenda</Th>
      </tr></thead>
      <tbody>
        {posts.map((p) => (
          <tr key={p.publicadoEm + p.legenda}>
            <Td className="whitespace-nowrap">{quando(p)}</Td>
            <Td>{p.formato}{p.impulsionado && colunas === "todos" ? <span className="block text-xs text-faint">impulsionado</span> : null}</Td>
            {colunas === "todos" && <Td className="whitespace-nowrap">{p.autor === "próprio" ? "próprio" : p.autor.replace("collab: ", "collab @")}</Td>}
            <Td>{p.editoria}</Td>
            {colunas === "impulsionados"
              ? <><Td numerico>{formatar(p.alcance, "int")}</Td><Td numerico>{formatar(p.alcancePago, "int")}</Td></>
              : <><Td numerico>{formatar(organicas(p), "int")}</Td><Td numerico>{formatar(alcanceOrganico(p), "int")}</Td></>}
            {colunas !== "impulsionados" && <Td numerico>{formatar(p.compartilhamentos, "int")}</Td>}
            {colunas === "todos" && <Td numerico>{formatar(p.salvamentos, "int")}</Td>}
            <Td numerico>{formatar(p.seguidoresGanhos, "int")}</Td>
            <Td className="min-w-[220px] text-muted">{p.legenda}</Td>
          </tr>
        ))}
      </tbody>
    </Tabela>
  );
}

/** A camada "por dentro" de uma leitura. */
function PorDentro({ l }: { l: LeituraPropria }) {
  const r = resumoProprio(l);
  return (
    <>
      <GradeKpis>
        <Kpi n={formatar(r.seguidores, "compact")} rotulo="seguidores" />
        {r.saldo != null && <Kpi n={(r.saldo > 0 ? "+" : "") + formatar(r.saldo, "int")} rotulo={"no saldo (" + formatar(l.publico.novos, "int") + " entraram, " + formatar(l.publico.perdidos, "int") + " saíram)"} />}
        <Kpi n={formatar(r.propriosPorSemana, "dec1")} rotulo="posts próprios por semana" />
        <Kpi n={formatar(r.pctCollab, "pct")} rotulo="dos posts em collab" />
        <Kpi n={formatar(r.viewsProprio, "compact")} rotulo="visualizações por post próprio (mediana)" />
        {r.maiorCollab && <Kpi n={formatar(r.maiorCollab.views, "compact")} rotulo={r.maiorCollab.rotulo.toLowerCase()} />}
      </GradeKpis>

      {(l.diagnostico.rende.length > 0 || l.diagnostico.naoRende.length > 0 || l.diagnostico.comparacao) && (
        <>
          <Grade>
            <Painel titulo="O que rende" className="mb-0"><ListaTexto itens={l.diagnostico.rende} /></Painel>
            <Painel titulo="O que não rende" className="mb-0"><ListaTexto itens={l.diagnostico.naoRende} /></Painel>
          </Grade>
          {l.diagnostico.comparacao && (
            <Painel titulo="Contra as referências" className="mt-3.5"><p className="m-0 max-w-texto text-base"><Texto>{l.diagnostico.comparacao}</Texto></p></Painel>
          )}
        </>
      )}

      <Painel titulo="Público" sub={"seguidores em " + dataLonga(l.data) + (l.publico.periodoMovimento ? "; entradas e saídas de " + l.publico.periodoMovimento : "")} className="mt-3.5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div><h4 className="m-0 mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Gênero</h4><Fatias fatias={l.publico.genero} /></div>
          <div><h4 className="m-0 mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Idade</h4><Fatias fatias={l.publico.idade} /></div>
          <div><h4 className="m-0 mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Cidades</h4><Fatias fatias={l.publico.cidades} /></div>
        </div>
      </Painel>

      <Grade>
        <Painel titulo="Quem publica" sub="todos os posts; num collab as visualizações são do post inteiro" className="mb-0">
          <TabelaLinhas linhas={porAutor(l)} rotulo="Autor" comSeguidores />
        </Painel>
        <Painel titulo="Formato" sub="próprios sem impulsionamento" className="mb-0">
          <TabelaLinhas linhas={porFormato(l)} rotulo="Formato" comCompart />
        </Painel>
        <Painel titulo="Editoria" sub="próprios sem impulsionamento" className="mb-0">
          <TabelaLinhas linhas={porEditoria(l)} rotulo="Editoria" comSeguidores />
        </Painel>
        <Painel titulo="Dia e horário de publicação" sub="próprios sem impulsionamento; poucos posts no fim de semana" className="mb-0">
          <TabelaLinhas linhas={porDia(l)} rotulo="Dia" />
          <div className="mt-3"><TabelaLinhas linhas={porHorario(l)} rotulo="Horário" /></div>
        </Painel>
      </Grade>

      <Painel titulo="Os dez próprios com mais visualizações orgânicas" sub="sem impulsionamento" className="mt-3.5">
        <TabelaPostsProprios posts={melhores(l)} colunas="melhores" />
      </Painel>
      {impulsionados(l).length > 0 && (
        <Painel titulo={"Próprios impulsionados (" + impulsionados(l).length + ")"} sub="sem o gasto de cada um não dá pra calcular custo por seguidor">
          <TabelaPostsProprios posts={impulsionados(l)} colunas="impulsionados" />
        </Painel>
      )}
      <p className="m-0 mt-2 max-w-texto text-sm text-muted">
        Visualizações e alcance orgânicos: o total menos a parte paga. Mediana: o post do meio, sem deixar um viral puxar a conta.
        Fonte: {(l.fonte || "Meta Business Suite").replace(/\.$/, "")}.
        {l.origem.artefato && <> <a href={l.origem.artefato} target="_blank" rel="noreferrer" className="font-semibold text-accent hover:underline">de onde veio ↗</a></>}
      </p>
    </>
  );
}

/** Como alimentar a camada por dentro, conforme o acesso. */
function SemLeitura({ perfil }: { perfil: PerfilProprio }) {
  const texto = perfil.acesso === "sem perfil"
    ? "O perfil ainda não existe. A primeira leitura é o dia em que ele abrir."
    : perfil.acesso === "pedir"
      ? "Ainda sem acesso aos dados de dentro. Com o acesso ao Meta Business Suite, a rotina mensal lê o público e os posts."
      : perfil.acesso === "temporário"
        ? "O acesso é temporário: a leitura acontece quando o acesso for liberado, e fica guardada aqui."
        : "Ainda sem leitura por dentro. Quem alimenta: " + (perfil.alimenta || "a definir") + ", pelo Meta Business Suite (Insights > Conteúdo e Público).";
  return <Vazio>{texto}</Vazio>;
}

/** A ficha de um perfil próprio. */
export function FichaPerfilProprio({ id }: { id: string }) {
  const com = usarComunicacao();
  const perfil = com.perfisProprios[id];
  const [sub, setSub] = useState("dentro");
  const [escolhida, setEscolhida] = useState("");
  const ids = (perfil?.leituras || []).map((x) => x.id);
  useEffect(() => { abrirLeiturasProprias(ids); }, [ids.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setSub("dentro"); setEscolhida(""); }, [id]);
  const voltar = () => definirBibliotecaAberta("proprios");

  if (!perfil) {
    return (
      <>
        <CabecalhoFicha rotuloVoltar="Perfis próprios" aoVoltar={voltar} titulo={id} />
        <Vazio>{com.propriosProntos ? "Perfil próprio não encontrado na Central." : "carregando…"}</Vazio>
      </>
    );
  }
  const leituras = [...(perfil.leituras || [])].reverse();
  const selId = escolhida || leituras[0]?.id || "";
  const l = com.leiturasProprias[selId];
  const deFora = perfil.instagram
    ? Object.values(com.referencias).find((r) => r.instagram.toLowerCase() === perfil.instagram.toLowerCase())
    : undefined;

  return (
    <>
      <CabecalhoFicha
        rotuloVoltar="Perfis próprios" aoVoltar={voltar} titulo={perfil.nome}
        sub={<><Arroba perfil={perfil} /> · {perfil.planos.join(", ")} · {ROTULO_ACESSO[perfil.acesso] || perfil.acesso}</>}
        acoes={leituras.length > 1 ? (
          <SeletorFiltro valor={selId} aoMudar={setEscolhida} opcoes={leituras.map((x) => ({ valor: x.id, rotulo: "Por dentro em " + dataLonga(x.data) }))} />
        ) : undefined}
        abas={[
          { id: "dentro", rotulo: "Por dentro" },
          { id: "posts", rotulo: "Posts", n: l?.posts.length },
          { id: "sobre", rotulo: "Acesso e planos" },
        ]}
        abaAtiva={sub} aoTrocarAba={setSub}
      />

      {sub === "sobre" && (
        <Grade>
          <Painel titulo="Acesso aos dados de dentro" className="mb-0">
            <Dados>
              <Dado rotulo="Situação">{perfil.situacao}</Dado>
              <Dado rotulo="Acesso">{ROTULO_ACESSO[perfil.acesso] || perfil.acesso}</Dado>
              <Dado rotulo="Quem acessa">{perfil.quemAcessa || "—"}</Dado>
              <Dado rotulo="Quem alimenta">{perfil.alimenta || "—"}</Dado>
              <Dado rotulo="Leituras por dentro">{leituras.length ? leituras.map((x) => dataLonga(x.data)).join(", ") : "nenhuma ainda"}</Dado>
            </Dados>
          </Painel>
          <Painel titulo="Planos e observações" className="mb-0">
            <p className="m-0 mb-2 text-base"><b className="font-semibold">Publicam aqui:</b> {perfil.planos.join(", ") || "—"}</p>
            <ListaTexto itens={perfil.obs} />
            <p className="m-0 mt-3 text-sm text-muted">
              {deFora
                ? <>Leitura de fora (a mesma das referências): <button type="button" className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-accent hover:underline" onClick={() => definirBibliotecaAberta(deFora.id)}>abrir a ficha de @{deFora.instagram}</button>.</>
                : "Sem leitura de fora ainda: quando a rotina ler este perfil como as referências, a ficha aponta pra ela."}
            </p>
          </Painel>
        </Grade>
      )}

      {sub !== "sobre" && (!leituras.length ? <SemLeitura perfil={perfil} />
        : !l ? <div className="py-10 text-center text-lg text-muted">carregando a leitura por dentro…</div>
          : sub === "posts" ? (
            <Painel titulo={"Todos os posts da leitura (" + l.posts.length + ")"} sub={"de " + dataLonga(l.inicio) + " a " + dataLonga(l.fim) + ", com os collabs"}>
              <TabelaPostsProprios posts={[...l.posts].sort((a, b) => b.publicadoEm.localeCompare(a.publicadoEm))} colunas="todos" />
            </Painel>
          ) : <PorDentro l={l} />)}
    </>
  );
}
