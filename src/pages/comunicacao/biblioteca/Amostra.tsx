/* A amostra assistida: os posts de maior desempenho de cada referência, abertos
   um a um (gancho, texto na tela, quem aparece, captação), e o que eles têm em
   comum. */
import { GradeKpis, Kpi } from "../../../components/ui/Kpi";
import { Grade } from "../../../components/ui/Grade";
import { Painel } from "../../../components/ui/Painel";
import { Tabela, Td, Th } from "../../../components/ui/Tabela";
import { Vazio } from "../../../components/ui/Vazio";
import type { LeituraReferencia } from "../../../types";
import { formatar, resumoAmostra } from "./calculo";
import type { VistaRodada } from "./dados";
import { Bolinha, ListaTexto, NomeComCor, Texto } from "./Texto";

export function TabelaAmostra({ leituras, cor, soUma }: { leituras: LeituraReferencia[]; cor: (refId: string) => string; soUma?: boolean }) {
  const linhas = leituras.flatMap((l) => l.amostra.map((a) => ({ a, l, post: l.posts.find((p) => p.n === a.n) })));
  if (!linhas.length) return <Vazio>Nenhum post aberto nesta rodada.</Vazio>;
  return (
    <Tabela minima="min-w-[980px]">
      <thead>
        <tr><Th>#</Th><Th>Editoria</Th><Th numerico>Desemp.</Th><Th>Gancho</Th><Th>Texto na tela</Th><Th>Quem aparece</Th><Th>Captação</Th></tr>
      </thead>
      <tbody>
        {linhas.map(({ a, l, post }) => (
          <tr key={a.n}>
            <Td className="whitespace-nowrap font-mono text-xs">
              {!soUma && <Bolinha cor={cor(l.refId)} className="mr-1.5" />}
              {post?.link ? <a href={post.link} target="_blank" rel="noreferrer" className="font-semibold text-accent hover:underline">{a.n} ↗</a> : a.n}
            </Td>
            <Td className="whitespace-nowrap">{post?.editoria}{post?.serie ? <span className="block text-xs text-faint">{post.serie}</span> : null}</Td>
            <Td numerico>{formatar(a.desempenho, "x")}</Td>
            <Td className="min-w-[220px]">{a.gancho}</Td>
            <Td className="min-w-[140px] text-muted">{a.textoNaTela}</Td>
            <Td className="min-w-[140px] text-muted">{a.quemAparece}</Td>
            <Td className="min-w-[160px] text-muted">{a.captacao}{a.audio ? <span className="block text-xs text-faint">{a.audio}</span> : null}</Td>
          </tr>
        ))}
      </tbody>
    </Tabela>
  );
}

export function Amostra({ vista }: { vista: VistaRodada }) {
  const { rodada, leituras, cor } = vista;
  const secao = rodada.secoes.find((s) => s.id === "amostra");
  const r = resumoAmostra(leituras.flatMap((l) => l.amostra));
  return (
    <>
      {secao?.nota && <p className="m-0 mb-3 max-w-texto text-base text-muted"><Texto>{secao.nota}</Texto></p>}
      <GradeKpis>
        <Kpi n={r.total} rotulo="posts abertos" />
        <Kpi n={r.comTexto} rotulo={"com texto na tela"} />
        <Kpi n={r.comPublico} rotulo="mostram o público" />
      </GradeKpis>
      <Grade>
        {secao?.blocos.map((b) => <Painel key={b.titulo} titulo={b.titulo} className="mb-0"><ListaTexto itens={b.itens} /></Painel>)}
        <Painel titulo="Por referência" className="mb-0">
          <div className="flex flex-col gap-3">
            {leituras.filter((l) => l.notas.amostra.length).map((l) => (
              <div key={l.id}>
                <div className="mb-1 text-lg font-semibold"><NomeComCor nome={l.nome} cor={cor(l.refId)} /></div>
                <ListaTexto itens={l.notas.amostra} />
              </div>
            ))}
          </div>
        </Painel>
      </Grade>
      <div className="mt-3.5"><TabelaAmostra leituras={leituras} cor={cor} /></div>
    </>
  );
}
