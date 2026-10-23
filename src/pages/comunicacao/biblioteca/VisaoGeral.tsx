/* Visão geral da rodada: a abertura, um cartão por referência (abre a ficha),
   o "Lado a lado", o que rende por editoria, os Reels e o "Devorar e devolver".
   Os números vêm das contas da Biblioteca; os textos, da síntese da rodada. */
import { CabecalhoSecao } from "../../../components/CabecalhoSecao";
import { CartaoLista } from "../../../components/ui/CartaoLista";
import { Dado, Dados } from "../../../components/ui/Dados";
import { Grade } from "../../../components/ui/Grade";
import { Painel } from "../../../components/ui/Painel";
import { Tabela, Td, Th } from "../../../components/ui/Tabela";
import { definirBibliotecaAberta } from "../../../store/navegacao";
import type { SecaoSintese } from "../../../types";
import { comparativo, diaMes, formatar, janela, resumoReels } from "./calculo";
import type { VistaRodada } from "./dados";
import { DispersaoReels } from "./graficos/DispersaoReels";
import { PontosEditoria } from "./graficos/PontosEditoria";
import { ListaTexto, NomeComCor, Texto } from "./Texto";

/** Os blocos de uma seção da síntese, em painéis lado a lado. */
export function BlocosSintese({ secao, colunas = 2 }: { secao?: SecaoSintese; colunas?: 2 | 3 }) {
  if (!secao) return null;
  return (
    <Grade colunas={colunas}>
      {secao.blocos.map((b) => (
        <Painel key={b.titulo} titulo={b.titulo} className="mb-0"><ListaTexto itens={b.itens} /></Painel>
      ))}
    </Grade>
  );
}

export function VisaoGeral({ vista }: { vista: VistaRodada }) {
  const { rodada, leituras, cor } = vista;
  const secao = (id: string) => rodada.secoes.find((s) => s.id === id);
  const linhas = comparativo(leituras);
  const rende = secao("rende");
  const reels = secao("reels");

  return (
    <>
      <p className="m-0 mb-2 max-w-texto text-xl text-ink"><Texto>{rodada.abertura}</Texto></p>
      <p className="m-0 mb-5 text-sm text-muted">
        Últimos ~60 posts da grade de cada perfil, mais os Reels que só aparecem na aba Reels.{" "}
        {leituras.map((l) => { const j = janela(l); return l.nome + " de " + diaMes(j.inicio) + " a " + diaMes(j.fim); }).join("; ")}.
      </p>

      <Grade colunas={2} className="xl:grid-cols-4">
        {leituras.map((l) => {
          const ref = vista.referencias[l.refId];
          const j = janela(l);
          const r = resumoReels(l);
          return (
            <CartaoLista key={l.id} aoAbrir={() => definirBibliotecaAberta(l.refId)} rotuloAbrir="abrir a leitura →"
              titulo={<NomeComCor nome={l.nome} cor={cor(l.refId)} />}
              sub={<>@{ref?.instagram || ""}{ref?.logica ? " · " + ref.logica : ""}</>}>
              <Dados compacto className="mt-2">
                <Dado compacto rotulo="Seguidores">{formatar(l.perfil.seguidores, "compact")}</Dado>
                <Dado compacto rotulo="Posts por semana">{formatar(j.porSemana, "dec1")}</Dado>
                <Dado compacto rotulo="Reels na grade">{formatar(j.pctReels, "pct")}</Dado>
                <Dado compacto rotulo="Views por Reel">{formatar(r.viewsMed, "compact")}</Dado>
              </Dados>
            </CartaoLista>
          );
        })}
      </Grade>

      <CabecalhoSecao titulo="Lado a lado" sub="cadência e proporções contam a janela de cada perfil" />
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
              {linha.valores.map((v, i) => <Td key={i} numerico>{formatar(v, linha.formato)}</Td>)}
            </tr>
          ))}
        </tbody>
      </Tabela>
      <p className="m-0 mt-2 max-w-texto text-sm text-muted">
        "Chamada": o post convida pra uma data (dia, lugar, ingresso). "Fora da grade": Reel que só aparece na aba Reels.
      </p>

      <CabecalhoSecao titulo={rende?.titulo || "O que rende"} />
      <p className="m-0 mb-3 max-w-texto text-base text-muted">
        Desempenho = curtidas do post ÷ mediana de curtidas do mesmo formato no mesmo perfil (formato com menos de 5 posts usa a
        mediana geral do perfil). 1× é o post típico daquele perfil, então dá pra comparar perfis de tamanhos diferentes. Posts com
        menos de 3 dias ficam fora. Passe o mouse (ou toque) num ponto para ver o número.
      </p>
      <Grade>
        <Painel titulo="Desempenho mediano por editoria" sub="escala de 2 em 2; a linha é o post típico (1×)" className="mb-0">
          <PontosEditoria leituras={leituras} cor={cor} campo="desempenhoMed" formato="x" escala="log2" referencia={1} rotuloEixo="Desempenho mediano" />
        </Painel>
        <Painel titulo="Comentários a cada 100 curtidas" sub="mede conversa, não alcance" className="mb-0">
          <PontosEditoria leituras={leituras} cor={cor} campo="coment100" formato="dec1" escala="linear" rotuloEixo="Comentários a cada 100 curtidas" />
        </Painel>
      </Grade>
      <div className="mt-3.5"><BlocosSintese secao={rende} /></div>

      <CabecalhoSecao titulo={reels?.titulo || "Reels"} />
      <Grade>
        <Painel titulo="Views × curtidas por Reel" sub="escala logarítmica nos dois eixos" className="mb-0">
          <DispersaoReels leituras={leituras} cor={cor} />
        </Painel>
        {reels?.blocos.map((b) => (
          <Painel key={b.titulo} titulo={b.titulo} className="mb-0"><ListaTexto itens={b.itens} /></Painel>
        ))}
      </Grade>

      <CabecalhoSecao titulo={secao("devorar")?.titulo || "Devorar e devolver"} sub="o que cada projeto leva desta rodada" />
      <BlocosSintese secao={secao("devorar")} />
    </>
  );
}
