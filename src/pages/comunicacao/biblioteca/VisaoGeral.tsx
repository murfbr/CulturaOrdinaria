/* Visão geral da rodada: a coleta, sem conclusão. Um cartão por referência
   (abre a ficha), o "Lado a lado", o que rende por editoria e os Reels. A
   interpretação (abertura, o que rende, devorar e devolver) mora nas análises
   (aba Análises), que esta tela lista no alto.
   Leitura rápida (~24 posts da página, editoria por palavra da legenda, sem
   views, evento nem D) só sustenta cadência, formato, collab e curtidas: nas
   rodadas rápidas e nas colunas rápidas da mista, o resto fica de fora. */
import { CabecalhoSecao } from "../../../components/CabecalhoSecao";
import { Badge } from "../../../components/ui/Badge";
import { CartaoLista } from "../../../components/ui/CartaoLista";
import { Dado, Dados } from "../../../components/ui/Dados";
import { Grade } from "../../../components/ui/Grade";
import { Painel } from "../../../components/ui/Painel";
import { Tabela, Td, Th } from "../../../components/ui/Tabela";
import { usarComunicacao } from "../../../store/comunicacao";
import { definirBibliotecaAberta } from "../../../store/navegacao";
import { comparativo, diaMes, formatar, janela, resumoReels } from "./calculo";
import { analisesEmOrdem, type VistaRodada } from "./dados";
import { DispersaoReels } from "./graficos/DispersaoReels";
import { PontosEditoria } from "./graficos/PontosEditoria";
import { Bolinha, NomeComCor } from "./Texto";

/** Linhas do "Lado a lado" que só a grade v5 sustenta (evento, chamada, aba Reels, views, destaques). */
const SO_V5 = new Set([
  "Posts ligados a evento", "Posts com chamada de evento", "Reels fora da grade", "Views por Reel (mediana)",
  "Curtidas por view (mediana)", "Reels próprios abaixo de 0,5%", "Destaques",
]);

export function VisaoGeral({ vista }: { vista: VistaRodada }) {
  const com = usarComunicacao();
  const { rodada, leituras, completas, cor, nivel } = vista;
  const rapidas = leituras.filter((l) => nivel(l.refId) === "rápida");
  const linhas = comparativo(leituras)
    .filter((linha) => !(SO_V5.has(linha.metrica) && !completas.length))
    .map((linha) => SO_V5.has(linha.metrica)
      ? { ...linha, valores: linha.valores.map((v, i) => (nivel(leituras[i].refId) === "rápida" ? null : v)) }
      : linha);
  const analises = analisesEmOrdem(com.analises, com.rodadas, com.referencias).filter((a) => a.rodadaIds.includes(rodada.id));

  return (
    <>
      <p className="m-0 mb-1 text-xl text-ink">{rodada.titulo}</p>
      <p className="m-0 mb-4 max-w-texto text-sm text-muted">
        {completas.length ? completas.length + " em grade v5 (últimos ~60 posts da grade, mais os Reels que só aparecem na aba Reels)" : ""}
        {completas.length && rapidas.length ? "; " : ""}
        {rapidas.length ? rapidas.length + " em leitura rápida (últimos ~24 posts da página, mais os fixados)" : ""}.{" "}
        {leituras.length <= 8 && leituras.map((l) => { const j = janela(l); return l.nome + " de " + diaMes(j.inicio) + " a " + diaMes(j.fim); }).join("; ")}
      </p>

      <Painel titulo={"Análises desta rodada (" + analises.length + ")"} sub="o que cada plano concluiu desta leitura">
        {!analises.length ? <p className="m-0 text-base text-muted">Nenhuma análise lê esta rodada ainda.</p> : (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {analises.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-2">
                <button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-base font-semibold text-accent hover:underline"
                  onClick={() => definirBibliotecaAberta(a.id)}>{a.titulo}</button>
                {a.planos.map((p) => <Badge key={p} mini>{p}</Badge>)}
                {a.legado && <Badge mini tom="aviso">dentro da rodada</Badge>}
              </li>
            ))}
          </ul>
        )}
      </Painel>

      {rapidas.length > 0 && (
        <Painel alerta titulo={completas.length ? "Rodada mista" : "Rodada de leitura rápida"}>
          A leitura rápida sustenta cadência, formato, collab e curtidas. Editoria (marcada por palavra da legenda), evento, D,
          views e amostra ficam pra grade v5: {completas.length ? "os gráficos por editoria e de Reels usam só as " + completas.length + " leituras completas." : "por isso esta rodada não tem gráficos por editoria nem de Reels."}
        </Painel>
      )}

      <Grade colunas={2} className="xl:grid-cols-4">
        {leituras.map((l) => {
          const ref = vista.referencias[l.refId];
          const j = janela(l);
          const r = resumoReels(l);
          const rapida = nivel(l.refId) === "rápida";
          return (
            <CartaoLista key={l.id} aoAbrir={() => definirBibliotecaAberta(l.refId)} rotuloAbrir="abrir a referência →"
              titulo={<span className="inline-flex items-baseline gap-1.5"><Bolinha cor={cor(l.refId)} className="relative -top-px" />{l.nome}</span>}
              sub={<>@{ref?.instagram || ""}{ref?.logica ? " · " + ref.logica : ""}</>}>
              <Dados compacto className="mt-2">
                <Dado compacto rotulo="Seguidores">{formatar(l.perfil.seguidores, "compact")}</Dado>
                <Dado compacto rotulo="Posts por semana">{formatar(j.porSemana, "dec1")}</Dado>
                <Dado compacto rotulo="Reels na grade">{formatar(j.pctReels, "pct")}</Dado>
                {rapida
                  ? <Dado compacto rotulo="Em collab">{formatar(j.pctCollab, "pct")}</Dado>
                  : <Dado compacto rotulo="Views por Reel">{formatar(r.viewsMed, "compact")}</Dado>}
              </Dados>
            </CartaoLista>
          );
        })}
      </Grade>

      <CabecalhoSecao titulo="Lado a lado" sub="cadência e proporções contam a janela de cada perfil" />
      {leituras.length > 6 ? (
        /* Muitas referências: uma linha por referência, as métricas nas colunas. */
        <Tabela minima="min-w-[960px]">
          <thead>
            <tr>
              <Th>Referência</Th>
              {linhas.map((linha) => <Th key={linha.metrica} numerico>{linha.metrica}</Th>)}
            </tr>
          </thead>
          <tbody>
            {leituras.map((l, i) => (
              <tr key={l.id}>
                <Td><NomeComCor nome={l.nome} cor={cor(l.refId)} /></Td>
                {linhas.map((linha) => <Td key={linha.metrica} numerico>{linha.valores[i] == null ? "" : formatar(linha.valores[i], linha.formato)}</Td>)}
              </tr>
            ))}
          </tbody>
        </Tabela>
      ) : (
      <Tabela minima="min-w-[640px]">
        <thead>
          <tr>
            <Th>Métrica</Th>
            {leituras.map((l) => <Th key={l.id} numerico><NomeComCor nome={l.nome} cor={cor(l.refId)} /></Th>)}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={linha.metrica}>
              <Td>{linha.metrica}</Td>
              {linha.valores.map((v, i) => <Td key={i} numerico>{v == null ? "" : formatar(v, linha.formato)}</Td>)}
            </tr>
          ))}
        </tbody>
      </Tabela>
      )}
      <p className="m-0 mt-2 max-w-texto text-sm text-muted">
        "Chamada": o post convida pra uma data (dia, lugar, ingresso). "Fora da grade": Reel que só aparece na aba Reels.
        {rapidas.length && completas.length ? " Célula vazia: a leitura rápida não sustenta a métrica." : ""}
      </p>

      {completas.length > 0 && (
        <>
          <CabecalhoSecao titulo="O que rende" sub={rapidas.length ? "só as leituras em grade v5" : undefined} />
          <p className="m-0 mb-3 max-w-texto text-base text-muted">
            Desempenho = curtidas do post ÷ mediana de curtidas do mesmo formato no mesmo perfil (formato com menos de 5 posts usa a
            mediana geral do perfil). 1× é o post típico daquele perfil, então dá pra comparar perfis de tamanhos diferentes. Posts com
            menos de 3 dias ficam fora. Passe o mouse (ou toque) num ponto para ver o número.
          </p>
          <Grade>
            <Painel titulo="Desempenho mediano por editoria" sub="escala de 2 em 2; a linha é o post típico (1×)" className="mb-0">
              <PontosEditoria leituras={completas} cor={cor} campo="desempenhoMed" formato="x" escala="log2" referencia={1} rotuloEixo="Desempenho mediano" />
            </Painel>
            <Painel titulo="Comentários a cada 100 curtidas" sub="mede conversa, não alcance" className="mb-0">
              <PontosEditoria leituras={completas} cor={cor} campo="coment100" formato="dec1" escala="linear" rotuloEixo="Comentários a cada 100 curtidas" />
            </Painel>
          </Grade>

          <CabecalhoSecao titulo="Reels" sub="views e curtidas de cada Reel" />
          <Painel titulo="Views × curtidas por Reel" sub="escala logarítmica nos dois eixos" className="mb-0">
            <DispersaoReels leituras={completas} cor={cor} />
          </Painel>
        </>
      )}
    </>
  );
}
