/* Ficha de uma referência na rodada: os números da janela, a página (bio,
   fixados, destaques), os ciclos de evento, o que rende ali, a linguagem, a
   amostra assistida, todos os posts e o histórico das rodadas. */
import { useState } from "react";
import { CabecalhoFicha } from "../../../components/ui/CabecalhoFicha";
import { Chip } from "../../../components/ui/Chip";
import { Grade } from "../../../components/ui/Grade";
import { GradeKpis, Kpi } from "../../../components/ui/Kpi";
import { Painel } from "../../../components/ui/Painel";
import { Tabela, Td, Th } from "../../../components/ui/Tabela";
import { Vazio } from "../../../components/ui/Vazio";
import { definirBibliotecaAberta } from "../../../store/navegacao";
import { chamadas, diaMes, editorias, formatar, janela, resumoReels } from "./calculo";
import type { VistaRodada } from "./dados";
import { LinhaCiclos } from "./graficos/LinhaCiclos";
import { TabelaAmostra } from "./Amostra";
import { TabelaPosts } from "./TabelaPosts";
import { ListaTexto, NomeComCor } from "./Texto";

export function FichaReferencia({ vista, refId }: { vista: VistaRodada; refId: string }) {
  const [sub, setSub] = useState("leitura");
  const leitura = vista.leituras.find((l) => l.refId === refId);
  const ref = vista.referencias[refId];
  if (!leitura) {
    return (
      <>
        <CabecalhoFicha rotuloVoltar="Biblioteca" aoVoltar={() => definirBibliotecaAberta(null)} titulo={ref?.nome || refId} />
        <Vazio>Esta referência não tem leitura na rodada de {diaMes(vista.rodada.data)}.</Vazio>
      </>
    );
  }
  const cor = vista.cor(refId);
  const j = janela(leitura);
  const r = resumoReels(leitura);
  const eds = editorias(leitura).sort((a, b) => (b.desempenhoMed ?? 0) - (a.desempenhoMed ?? 0));
  const ch = chamadas(leitura);
  const historico = ref?.historico || [];

  return (
    <>
      <CabecalhoFicha
        rotuloVoltar="Biblioteca" aoVoltar={() => definirBibliotecaAberta(null)}
        titulo={<NomeComCor nome={leitura.nome} cor={cor} />}
        sub={<>
          <a href={"https://www.instagram.com/" + (ref?.instagram || "") + "/"} target="_blank" rel="noreferrer" className="font-semibold text-accent hover:underline">@{ref?.instagram}</a>
          {ref?.logica ? " · " + ref.logica : ""} · leitura de {diaMes(leitura.data)}
        </>}
        abas={[
          { id: "leitura", rotulo: "Leitura" },
          { id: "posts", rotulo: "Posts", n: leitura.posts.length },
          { id: "amostra", rotulo: "Amostra", n: leitura.amostra.length },
        ]}
        abaAtiva={sub} aoTrocarAba={setSub}
      />

      {sub === "posts" && <TabelaPosts leituras={[leitura]} cor={vista.cor} desempenho={vista.desempenho} soUma />}

      {sub === "amostra" && (
        <>
          <Painel titulo="O que a amostra mostrou aqui"><ListaTexto itens={leitura.notas.amostra} /></Painel>
          <TabelaAmostra leituras={[leitura]} cor={vista.cor} soUma />
        </>
      )}

      {sub === "leitura" && (
        <>
          <GradeKpis>
            <Kpi n={formatar(leitura.perfil.seguidores, "compact")} rotulo="seguidores" />
            <Kpi n={formatar(j.porSemana, "dec1")} rotulo="posts por semana" />
            <Kpi n={formatar(j.pctReels, "pct")} rotulo="Reels na grade" />
            <Kpi n={formatar(r.viewsMed, "compact")} rotulo="views por Reel" />
            <Kpi n={formatar(r.taxaMed, "pct2")} rotulo="curtidas por view" />
            <Kpi n={formatar(j.pctCollab, "pct")} rotulo="em collab" />
          </GradeKpis>
          {ref?.marcacoes?.length ? <div className="mb-4">{ref.marcacoes.map((m) => <Chip key={m}>{m}</Chip>)}</div> : null}

          <Grade>
            <Painel titulo="A página" sub={leitura.perfil.bio} className="mb-0">
              <ListaTexto itens={leitura.notas.pagina} />
            </Painel>
            <Painel titulo="Linguagem" className="mb-0"><ListaTexto itens={leitura.notas.linguagem} /></Painel>
          </Grade>

          <Painel titulo="Ciclos de evento" sub={"janela de " + diaMes(j.inicio) + " a " + diaMes(j.fim) + ", " + j.postsJanela + " posts"} className="mt-3.5">
            <LinhaCiclos leitura={leitura} cor={cor} desempenho={vista.desempenho} />
            <ListaTexto itens={leitura.notas.ciclos} className="mt-4" />
          </Painel>

          <Grade>
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
          </Grade>

          {historico.length > 0 && (
            <Painel titulo="Histórico das rodadas" className="mt-3.5">
              <Tabela simples minima="min-w-[560px]">
                <thead><tr><Th>Leitura</Th><Th numerico>Seguidores</Th><Th numerico>Posts/semana</Th><Th numerico>Reels</Th><Th numerico>Views/Reel</Th><Th numerico>Curtidas/view</Th></tr></thead>
                <tbody>
                  {historico.map((h) => (
                    <tr key={h.leituraId}>
                      <Td>{diaMes(h.data)}/{h.data.slice(0, 4)}</Td>
                      <Td numerico>{formatar(h.seguidores, "compact")}</Td>
                      <Td numerico>{formatar(h.postsSemana, "dec1")}</Td>
                      <Td numerico>{formatar(h.pctReels, "pct")}</Td>
                      <Td numerico>{formatar(h.viewsReel, "compact")}</Td>
                      <Td numerico>{formatar(h.curtidasPorView, "pct2")}</Td>
                    </tr>
                  ))}
                </tbody>
              </Tabela>
            </Painel>
          )}
        </>
      )}
    </>
  );
}
