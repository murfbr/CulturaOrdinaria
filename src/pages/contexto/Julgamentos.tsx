/* Julgamentos: cada projeto já avaliado — o que o parecer disse na leitura do
   julgador, pontos fortes e fracos, e as lições. Cada lição pode "virar regra",
   com este julgamento como fonte. Lista lateral à esquerda, o registro aberto
   à direita. */
import { usarCentral } from "../../store/central";
import { abrirFichaContexto, definirJulgamentoAberto, usarNavegacao } from "../../store/navegacao";
import { julgamentosOrdenados, nomeDaEntidade } from "../../lib/contexto/consultas";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { Grade } from "../../components/ui/Grade";
import { Linha } from "../../components/ui/Linha";
import { Painel } from "../../components/ui/Painel";
import { Vazio } from "../../components/ui/Vazio";
import { ESTILO_LINK, ESTILO_MONO } from "../../components/ui/estilos";
import { ItemMarcado } from "./ItemMarcado";
import { GrupoLista, ItemLista, ListaLateral } from "./ListaLateral";
import type { PedidoModalRegra } from "./ModalRegra";
import { clonar } from "../../utils";
import { ROTULO_RESULTADO, type Julgamento } from "../../types";

interface Props {
  aoAbrirRegra: (p: PedidoModalRegra) => void;
  aoAbrirJulgamento: (j: Julgamento | "novo") => void;
}

export function TelaJulgamentos({ aoAbrirRegra, aoAbrirJulgamento }: Props) {
  const { julgamentos, regras } = usarCentral();
  const nav = usarNavegacao();
  const lista = julgamentosOrdenados();
  const selecionado = (nav.julgamentoAberto && julgamentos[nav.julgamentoAberto]) || lista[0];

  const cabecalho = (
    <CabecalhoSecao
      grande
      titulo="Julgamentos"
      sub="Cada projeto já avaliado: o que o parecer disse, na leitura do julgador, e as lições que viraram regra. Registre também inscrições sem resultado, para comparar depois."
    >
      <Botao onClick={() => aoAbrirJulgamento("novo")}>+ novo julgamento</Botao>
    </CabecalhoSecao>
  );

  if (!selecionado) {
    return <>{cabecalho}<Vazio>Nenhum julgamento registrado ainda.</Vazio></>;
  }
  const j = selecionado;

  const ListaItens = ({ itens }: { itens: string[] }) =>
    itens.length
      ? <div className="max-w-texto">{itens.map((a, i) => <ItemMarcado marca="·" key={i}>{a}</ItemMarcado>)}</div>
      : <Vazio emLinha>nada registrado</Vazio>;

  const linkFicha = (id: string, texto: string) => (
    <a href="#" className={ESTILO_LINK} onClick={(e) => { e.preventDefault(); abrirFichaContexto(id); }}>{texto}</a>
  );
  const resultado = (x: Julgamento, mini?: boolean) => (
    <Badge caixaAlta mini={mini} tom={x.resultado}>{ROTULO_RESULTADO[x.resultado] || x.resultado}</Badge>
  );

  return (
    <>
      {cabecalho}
      <Grade colunas="lateral">
        <ListaLateral className="md:mt-gutter">
          <GrupoLista>registros</GrupoLista>
          {lista.map((x) => (
            <ItemLista key={x.id} ativo={x.id === j.id}
              onClick={() => { definirJulgamentoAberto(x.id); window.scrollTo({ top: 0 }); }}>
              <span className="flex items-center gap-2">
                {resultado(x, true)}
                <span className="min-w-0">{nomeDaEntidade(x.edital).split(" (")[0]}{x.projeto ? " · " + nomeDaEntidade(x.projeto) : ""}</span>
              </span>
            </ItemLista>
          ))}
        </ListaLateral>

        <div className="min-w-0">
          <CabecalhoSecao
            grande
            titulo={<>{linkFicha(j.edital, nomeDaEntidade(j.edital))} {resultado(j)}</>}
            sub={<>
              {j.projeto && <>projeto {linkFicha(j.projeto, nomeDaEntidade(j.projeto))} · </>}
              {j.ano}{j.nota && <> · nota {j.nota}</>} · <code className={ESTILO_MONO}>{j.id}</code>
            </>}
          >
            <Botao variante="quieto" tamanho="pequeno" onClick={() => aoAbrirJulgamento(clonar(j))}>editar</Botao>
          </CabecalhoSecao>

          <Painel titulo="O que aconteceu">
            {j.resumo ? <p className="m-0 max-w-texto whitespace-pre-wrap">{j.resumo}</p> : <Vazio emLinha>sem resumo</Vazio>}
          </Painel>

          <Grade colunas={2}>
            <Painel titulo="Pontos fortes" sub={<span className="italic">na leitura do julgador</span>}>
              <ListaItens itens={j.fortes || []} />
            </Painel>
            <Painel titulo="Pontos fracos" sub={<span className="italic">o que foi criticado ou ficou frágil</span>}>
              <ListaItens itens={j.fracos || []} />
            </Painel>
          </Grade>

          <Painel titulo="Lições" sub={<span className="italic">cada lição pode virar uma regra, com este julgamento como fonte</span>}>
            {(j.licoes || []).map((licao, i) => (
              <Linha topo key={i} direita={
                licao.regra && regras[licao.regra] ? (
                  <span className="whitespace-nowrap text-xs text-faint">
                    virou regra <code className={ESTILO_MONO}>{licao.regra}</code>{" "}
                    <Botao variante="quieto" tamanho="mini" onClick={() => aoAbrirRegra({ regra: clonar(regras[licao.regra]) })}>ver</Botao>
                  </span>
                ) : (
                  <Botao variante="quieto" tamanho="mini" onClick={() => aoAbrirRegra({
                    contexto: {
                      tipo: "edital", id: j.edital, texto: licao.texto,
                      fonte: { tipo: "julgamento", ref: j.id },
                      julgamentoId: j.id, licao: i,
                    },
                  })}>virar regra</Botao>
                )
              }>
                <span className="text-base">{licao.texto}</span>
              </Linha>
            ))}
            {!(j.licoes || []).length && <Vazio emLinha>nenhuma lição</Vazio>}
          </Painel>
        </div>
      </Grade>
    </>
  );
}
