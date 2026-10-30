/* Análises da Biblioteca: o que cada plano leu das referências, por rodada
   (doc 01 da metodologia, seção 8b). A referência é uma só; a análise é por
   plano. A lista filtra por plano; a ficha (#/comunicacao/biblioteca/an-…)
   mostra a abertura, as referências que ela usa e as seções (o que rende,
   Reels, amostra, devorar e devolver). A análise que ainda mora dentro de uma
   rodada antiga aparece marcada como "dentro da rodada" até o arquivo das
   análises ser importado. */
import { useState } from "react";
import { CabecalhoSecao } from "../../../components/CabecalhoSecao";
import { BarraFiltros, SeletorFiltro } from "../../../components/Filtros";
import { Badge } from "../../../components/ui/Badge";
import { CabecalhoFicha } from "../../../components/ui/CabecalhoFicha";
import { CartaoLista } from "../../../components/ui/CartaoLista";
import { Grade } from "../../../components/ui/Grade";
import { Painel } from "../../../components/ui/Painel";
import { Vazio } from "../../../components/ui/Vazio";
import { usarComunicacao } from "../../../store/comunicacao";
import { definirBibliotecaAberta } from "../../../store/navegacao";
import type { SecaoSintese } from "../../../types";
import { diaMes } from "./calculo";
import { corDa } from "./cores";
import { analisesEmOrdem, planosDasAnalises, type VistaAnalise } from "./dados";
import { ListaTexto, NomeComCor, Texto } from "./Texto";

const dataLonga = (d: string) => diaMes(d) + "/" + d.slice(0, 4);

/** Os blocos de uma seção, em painéis lado a lado. */
export function BlocosSintese({ secao, colunas = 2 }: { secao?: SecaoSintese; colunas?: 2 | 3 }) {
  if (!secao) return null;
  if (secao.blocos.length === 1) {
    const b = secao.blocos[0];
    return <Painel titulo={b.titulo} className="mb-0 max-w-[900px]"><ListaTexto itens={b.itens} /></Painel>;
  }
  return (
    <Grade colunas={colunas}>
      {secao.blocos.map((b) => (
        <Painel key={b.titulo} titulo={b.titulo} className="mb-0"><ListaTexto itens={b.itens} /></Painel>
      ))}
    </Grade>
  );
}

/** As análises, com filtro por plano. */
export function ListaAnalises() {
  const com = usarComunicacao();
  const [plano, setPlano] = useState("");
  const todas = analisesEmOrdem(com.analises, com.rodadas, com.referencias);
  const planos = planosDasAnalises(todas);
  const lista = plano ? todas.filter((a) => a.planos.includes(plano)) : todas;

  return (
    <>
      {com.analisesSemAcesso && (
        <Painel alerta titulo="Sem acesso às análises">
          As regras do Firestore ainda não têm a coleção analisesReferencias (o arquivo firestore.rules do repositório tem a
          linha; publicar pelo console). O resto da Biblioteca segue normal; as análises antigas aparecem pelas rodadas.
        </Painel>
      )}
      <BarraFiltros mostrando={lista.length} total={todas.length}>
        {planos.length > 1 && <SeletorFiltro valor={plano} aoMudar={setPlano} rotuloTodos="todos os planos" opcoes={planos} />}
      </BarraFiltros>
      {!lista.length ? <Vazio>Nenhuma análise{plano ? " de " + plano : ""} ainda.</Vazio> : (
        <Grade colunas={2}>
          {lista.map((a) => (
            <CartaoLista key={a.id} aoAbrir={() => definirBibliotecaAberta(a.id)} rotuloAbrir="abrir a análise →"
              etiquetas={<>
                {a.planos.length ? a.planos.map((p) => <Badge key={p} mini>{p}</Badge>) : <Badge mini tom="aviso">plano não marcado</Badge>}
                {a.legado && <Badge mini tom="aviso">dentro da rodada</Badge>}
              </>}
              titulo={a.titulo}
              sub={dataLonga(a.data) + " · " + a.refIds.length + " referência(s) · " + a.secoes.length + " seção(ões)"}>
              {a.abertura && <p className="m-0 mt-2 line-clamp-3 text-base text-muted"><Texto>{a.abertura}</Texto></p>}
            </CartaoLista>
          ))}
        </Grade>
      )}
    </>
  );
}

/** Uma análise: abertura, referências usadas e as seções. */
export function FichaAnalise({ id, aoAbrirRodada }: { id: string; aoAbrirRodada: (rodadaId: string) => void }) {
  const com = usarComunicacao();
  const a: VistaAnalise | undefined = analisesEmOrdem(com.analises, com.rodadas, com.referencias).find((x) => x.id === id);
  const voltar = () => definirBibliotecaAberta("analises");
  if (!a) {
    return (
      <>
        <CabecalhoFicha rotuloVoltar="Análises" aoVoltar={voltar} titulo={id} />
        <Vazio>Análise não encontrada na Central.</Vazio>
      </>
    );
  }
  const rodadas = a.rodadaIds.map((r) => com.rodadas[r]).filter(Boolean);

  return (
    <>
      <CabecalhoFicha rotuloVoltar="Análises" aoVoltar={voltar} titulo={a.titulo}
        sub={<>
          {a.planos.length ? a.planos.join(", ") : "plano não marcado"} · {dataLonga(a.data)} · lê{" "}
          {rodadas.length ? rodadas.map((r, i) => (
            <span key={r.id}>
              {i > 0 && ", "}
              <button type="button" className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-accent hover:underline" onClick={() => aoAbrirRodada(r.id)}>
                a rodada de {dataLonga(r.data)} ({r.grade})
              </button>
            </span>
          )) : "rodada que não está na Central"}
        </>} />

      {a.legado && (
        <Painel alerta titulo="Ainda dentro da rodada">
          Esta análise foi gravada no formato antigo, como parte da rodada. Ela aparece aqui pra não sumir; quando o arquivo das
          análises for importado (aba Importar), passa a ser um documento próprio, com os planos marcados.
        </Painel>
      )}

      {a.abertura && <p className="m-0 mb-4 max-w-texto text-xl text-ink"><Texto>{a.abertura}</Texto></p>}

      <Painel titulo={"Referências que esta análise usa (" + a.refIds.length + ")"} sub="clique pra abrir a ficha">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {a.refIds.map((refId, i) => {
            const ref = com.referencias[refId];
            return (
              <button key={refId} type="button" className="cursor-pointer border-0 bg-transparent p-0 text-base text-ink hover:underline"
                onClick={() => definirBibliotecaAberta(refId)}>
                <NomeComCor nome={ref?.nome || refId} cor={corDa(i)} />
              </button>
            );
          })}
        </div>
      </Painel>

      {a.secoes.map((s) => (
        <div key={s.id || s.titulo}>
          <CabecalhoSecao titulo={s.titulo} sub={s.id === "devorar" ? "o que cada projeto leva desta leitura" : undefined} />
          {s.nota && <p className="m-0 mb-3 max-w-texto text-base text-muted"><Texto>{s.nota}</Texto></p>}
          <BlocosSintese secao={s} />
        </div>
      ))}
      {!a.secoes.length && !a.abertura && <Vazio>Esta análise não tem texto.</Vazio>}
    </>
  );
}
