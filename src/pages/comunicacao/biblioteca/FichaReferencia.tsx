/* Ficha de uma referência: todas as leituras que ela já teve, em qualquer
   rodada. Abre na leitura completa (grade v5) mais recente, que é a que tem
   ciclos, editorias, Reels e amostra; quando a mais nova é uma leitura rápida,
   os números dela aparecem como "atual" no alto, sem apagar a v5. Um seletor
   troca de leitura; o histórico lista todas. */
import { useEffect, useState } from "react";
import { SeletorFiltro } from "../../../components/Filtros";
import { Badge } from "../../../components/ui/Badge";
import { CabecalhoFicha } from "../../../components/ui/CabecalhoFicha";
import { Chip } from "../../../components/ui/Chip";
import { Grade } from "../../../components/ui/Grade";
import { GradeKpis, Kpi } from "../../../components/ui/Kpi";
import { Painel } from "../../../components/ui/Painel";
import { Tabela, Td, Th } from "../../../components/ui/Tabela";
import { Vazio } from "../../../components/ui/Vazio";
import { usarComunicacao } from "../../../store/comunicacao";
import { definirBibliotecaAberta } from "../../../store/navegacao";
import type { LeituraReferencia } from "../../../types";
import { chamadas, desempenhos, diaMes, editorias, formatar, janela, mediana, postsDaJanela, resumoReels } from "./calculo";
import { analisesEmOrdem, planosDa, usarReferencia, type LeituraDaReferencia } from "./dados";
import { LinhaCiclos } from "./graficos/LinhaCiclos";
import { TabelaAmostra } from "./Amostra";
import { TabelaPosts } from "./TabelaPosts";
import { ListaTexto, NomeComCor } from "./Texto";

const rotuloLeitura = (l: LeituraDaReferencia) => diaMes(l.resumo.data) + "/" + l.resumo.data.slice(0, 4) + " · " + l.nivel;

export function FichaReferencia({ refId }: { refId: string }) {
  const [sub, setSub] = useState("leitura");
  const [escolhida, setEscolhida] = useState("");
  const vista = usarReferencia(refId);
  // Ao abrir, a v5 mais recente; sem v5, a mais nova.
  const padrao = vista?.v5?.resumo.leituraId || vista?.atual?.resumo.leituraId || "";
  useEffect(() => { setEscolhida(""); setSub("leitura"); }, [refId]);
  const voltar = () => definirBibliotecaAberta(null);

  if (!vista) {
    return (
      <>
        <CabecalhoFicha rotuloVoltar="Biblioteca" aoVoltar={voltar} titulo={refId} />
        <Vazio>Referência não encontrada na Central.</Vazio>
      </>
    );
  }
  const { ref, cor } = vista;
  const sel = vista.leituras.find((l) => l.resumo.leituraId === (escolhida || padrao)) || vista.atual;
  const leitura = sel?.leitura;
  const atualEhOutra = vista.atual && sel && vista.atual.resumo.leituraId !== sel.resumo.leituraId ? vista.atual : undefined;

  const cabecalho = (
    <CabecalhoFicha
      rotuloVoltar="Biblioteca" aoVoltar={voltar}
      titulo={<NomeComCor nome={ref.nome} cor={cor} />}
      sub={<>
        <a href={"https://www.instagram.com/" + ref.instagram + "/"} target="_blank" rel="noreferrer" className="font-semibold text-accent hover:underline">@{ref.instagram}</a>
        {ref.logica ? " · " + ref.logica : ""}{ref.papel ? " · " + ref.papel : ""}
        {planosDa(ref).length ? " · " + planosDa(ref).join(", ") : ""}
      </>}
      acoes={vista.leituras.length > 1 ? (
        <SeletorFiltro valor={sel?.resumo.leituraId || ""} aoMudar={setEscolhida}
          opcoes={vista.leituras.map((l) => ({ valor: l.resumo.leituraId, rotulo: rotuloLeitura(l) }))} />
      ) : sel ? <Badge tom={sel.nivel === "grade v5" ? "ok" : "neutro"}>{rotuloLeitura(sel)}</Badge> : undefined}
      abas={leitura ? [
        { id: "leitura", rotulo: "Leitura" },
        { id: "posts", rotulo: "Posts", n: leitura.posts.length },
        { id: "amostra", rotulo: "Amostra", n: leitura.amostra.length },
      ] : undefined}
      abaAtiva={sub} aoTrocarAba={setSub}
    />
  );

  if (!sel) return <>{cabecalho}<Vazio>Esta referência está no catálogo, mas ainda não tem leitura gravada.</Vazio></>;
  if (!leitura) {
    return <>{cabecalho}{sel.ausente
      ? <Vazio>A leitura de {diaMes(sel.resumo.data)} não está no banco. Importe o espelho daquela rodada de novo.</Vazio>
      : <div className="py-10 text-center text-lg text-muted">carregando a leitura…</div>}</>;
  }

  const rapida = sel.nivel === "rápida";
  const desempenho = desempenhos(leitura);
  return (
    <>
      {cabecalho}
      {sub === "posts" && <TabelaPosts leituras={[leitura]} cor={() => cor} desempenho={desempenho} soUma />}
      {sub === "amostra" && (leitura.amostra.length ? (
        <>
          <Painel titulo="O que a amostra mostrou aqui"><ListaTexto itens={leitura.notas.amostra} /></Painel>
          <TabelaAmostra leituras={[leitura]} cor={() => cor} soUma />
        </>
      ) : <Vazio>A leitura rápida não abre posts. A amostra assistida vem com a grade completa.</Vazio>)}
      {sub === "leitura" && <Leitura leitura={leitura} sel={sel} atual={atualEhOutra} cor={cor} rapida={rapida} desempenho={desempenho} vista={vista} />}
    </>
  );
}

function Leitura({ leitura, sel, atual, cor, rapida, desempenho, vista }: {
  leitura: LeituraReferencia; sel: LeituraDaReferencia; atual?: LeituraDaReferencia; cor: string; rapida: boolean;
  desempenho: Record<string, number | null>; vista: NonNullable<ReturnType<typeof usarReferencia>>;
}) {
  const { ref } = vista;
  const com = usarComunicacao();
  const analises = analisesEmOrdem(com.analises, com.rodadas, com.referencias).filter((x) => x.refIds.includes(ref.id));
  const j = janela(leitura);
  const r = resumoReels(leitura);
  const eds = editorias(leitura).sort((a, b) => (b.desempenhoMed ?? 0) - (a.desempenhoMed ?? 0));
  const ch = chamadas(leitura);
  const curtidasMed = mediana(postsDaJanela(leitura).filter((p) => p.curtidas != null && !p.fixado).map((p) => p.curtidas as number));
  const a = atual?.resumo;

  return (
    <>
      {atual && a && (
        <Painel titulo={"Números atuais · " + rotuloLeitura(atual)} sub="a leitura mais recente; o resto da ficha é a leitura completa escolhida acima" className="mb-3.5">
          <GradeKpis className="mb-0">
            <Kpi n={formatar(a.seguidores, "compact")} rotulo="seguidores" />
            <Kpi n={formatar(a.postsSemana, "dec1")} rotulo="posts por semana" />
            <Kpi n={formatar(a.pctReels, "pct")} rotulo="Reels na grade" />
            <Kpi n={formatar(a.pctCollab, "pct")} rotulo="em collab" />
            {a.viewsReel != null && <Kpi n={formatar(a.viewsReel, "compact")} rotulo="views por Reel" />}
          </GradeKpis>
        </Painel>
      )}

      <GradeKpis>
        <Kpi n={formatar(leitura.perfil.seguidores, "compact")} rotulo={"seguidores em " + diaMes(leitura.data)} />
        <Kpi n={formatar(j.porSemana, "dec1")} rotulo="posts por semana" />
        <Kpi n={formatar(j.pctReels, "pct")} rotulo="Reels na grade" />
        <Kpi n={formatar(j.pctCollab, "pct")} rotulo="em collab" />
        <Kpi n={formatar(curtidasMed, "int")} rotulo="curtidas (mediana)" />
        {!rapida && <Kpi n={formatar(r.viewsMed, "compact")} rotulo="views por Reel" />}
        {!rapida && <Kpi n={formatar(r.taxaMed, "pct2")} rotulo="curtidas por view" />}
      </GradeKpis>
      {ref.marcacoes?.length ? <div className="mb-4">{ref.marcacoes.map((m) => <Chip key={m}>{m}</Chip>)}</div> : null}

      {rapida && (
        <Painel alerta titulo="Leitura rápida">
          Os últimos ~24 posts, lidos dos dados da página: curtidas, comentários, formato e collab. Sem views, sem evento e D, e com
          editoria marcada por palavra da legenda, só pra triagem. Por isso esta ficha não mostra ciclos, desempenho por editoria nem
          amostra. A leitura completa (grade v5) entra quando a referência vira principal de um plano.
        </Painel>
      )}

      <Grade>
        <Painel titulo="A página" sub={leitura.perfil.bio} className="mb-0">
          {leitura.notas.pagina.length ? <ListaTexto itens={leitura.notas.pagina} /> : <Vazio emLinha>Sem notas sobre a página nesta leitura.</Vazio>}
        </Painel>
        {leitura.notas.linguagem.length > 0 && <Painel titulo="Linguagem" className="mb-0"><ListaTexto itens={leitura.notas.linguagem} /></Painel>}
      </Grade>

      {!rapida && (
        <Painel titulo="Ciclos de evento" sub={"janela de " + diaMes(j.inicio) + " a " + diaMes(j.fim) + ", " + j.postsJanela + " posts"} className="mt-3.5">
          <LinhaCiclos leitura={leitura} cor={cor} desempenho={desempenho} />
          <ListaTexto itens={leitura.notas.ciclos} className="mt-4" />
        </Painel>
      )}

      <Grade>
        {!rapida && (
          <Painel titulo="O que rende aqui" sub="desempenho mediano por editoria" className="mb-0">
            <Tabela simples>
              <thead><tr><Th>Editoria</Th><Th numerico>Posts</Th><Th numerico>Desemp.</Th><Th numerico>Coment. /100</Th></tr></thead>
              <tbody>
                {eds.map((e) => (
                  <tr key={e.editoria}>
                    <Td>{e.editoria}</Td><Td numerico>{e.posts}</Td>
                    <Td numerico className={(e.desempenhoMed ?? 0) >= 1.5 ? "font-semibold" : ""}>{formatar(e.desempenhoMed, "x")}</Td>
                    <Td numerico>{formatar(e.coment100, "dec1")}</Td>
                  </tr>
                ))}
              </tbody>
            </Tabela>
            <p className="m-0 mt-3 text-sm text-muted">
              Com chamada de evento: {formatar(ch[0].desempenhoMed, "x")} ({ch[0].posts} posts) · sem chamada: {formatar(ch[1].desempenhoMed, "x")} ({ch[1].posts} posts).
            </p>
          </Painel>
        )}
        {leitura.destaques.length > 0 && (
          <Painel titulo={"Destaques (" + leitura.destaques.length + ")"} className="mb-0">
            <Tabela simples>
              <thead><tr><Th>Destaque</Th><Th>O que guarda</Th></tr></thead>
              <tbody>
                {leitura.destaques.map((d) => (
                  <tr key={d.ordem + d.nome}>
                    <Td className="whitespace-nowrap font-semibold">{d.nome}</Td>
                    <Td className="text-muted">{d.guarda}<span className="block text-xs text-faint">{d.tipo} · {d.comoSei}</span></Td>
                  </tr>
                ))}
              </tbody>
            </Tabela>
          </Painel>
        )}
      </Grade>

      <Painel titulo="Histórico das leituras" sub="todas as rodadas em que esta referência entrou" className="mt-3.5">
        <Tabela simples minima="min-w-[640px]">
          <thead><tr><Th>Leitura</Th><Th>Nível</Th><Th numerico>Seguidores</Th><Th numerico>Posts/semana</Th><Th numerico>Reels</Th><Th numerico>Collab</Th><Th numerico>Views/Reel</Th><Th numerico>Curtidas/view</Th></tr></thead>
          <tbody>
            {vista.leituras.map((l) => {
              const h = l.resumo;
              const ativa = l.resumo.leituraId === sel.resumo.leituraId;
              return (
                <tr key={h.leituraId} className={ativa ? "bg-bg-sunk/50" : ""}>
                  <Td className="whitespace-nowrap">{diaMes(h.data)}/{h.data.slice(0, 4)}{l.rodada ? <span className="block text-xs text-faint">{l.rodada.titulo}</span> : null}</Td>
                  <Td><Badge mini tom={l.nivel === "grade v5" ? "ok" : "neutro"}>{l.nivel}</Badge></Td>
                  <Td numerico>{formatar(h.seguidores, "compact")}</Td>
                  <Td numerico>{formatar(h.postsSemana, "dec1")}</Td>
                  <Td numerico>{formatar(h.pctReels, "pct")}</Td>
                  <Td numerico>{formatar(h.pctCollab, "pct")}</Td>
                  <Td numerico>{h.viewsReel != null ? formatar(h.viewsReel, "compact") : ""}</Td>
                  <Td numerico>{h.curtidasPorView != null ? formatar(h.curtidasPorView, "pct2") : ""}</Td>
                </tr>
              );
            })}
          </tbody>
        </Tabela>
      </Painel>

      <Painel titulo={"Nas análises (" + analises.length + ")"} sub="o que os planos concluíram lendo esta referência junto com as outras" className="mt-3.5">
        {!analises.length ? <p className="m-0 text-base text-muted">Nenhuma análise usa esta referência ainda.</p> : (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {analises.map((a) => (
              <li key={a.id} className="text-base">
                <button type="button" className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-accent hover:underline"
                  onClick={() => definirBibliotecaAberta(a.id)}>{a.titulo}</button>
                <span className="text-muted"> · {a.planos.join(", ") || "plano não marcado"} · {diaMes(a.data)}/{a.data.slice(0, 4)}</span>
              </li>
            ))}
          </ul>
        )}
      </Painel>
    </>
  );
}
