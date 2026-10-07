/* Fichas: o conhecimento de escrita de cada artista, projeto e edital — sempre
   apontando o MESMO id do Painel. A tela é a lista lateral (por tipo, com a
   contagem de regras de cada um) e a ficha aberta ao lado. A ficha em si
   (PainelFicha) vive em PainelFicha.tsx e continua exportada daqui para as
   abas Contexto de Cadastros e de Projetos, que a embutem. */
import { Fragment, useEffect } from "react";
import { usarCentral } from "../../store/central";
import { definirFichaAberta, usarNavegacao } from "../../store/navegacao";
import { TIPOS_FICHA, entidadePorId, entidades, regrasDe, temFicha } from "../../lib/contexto/consultas";
import { Grade } from "../../components/ui/Grade";
import { Vazio } from "../../components/ui/Vazio";
import { GrupoLista, ItemLista, ListaLateral } from "./ListaLateral";
import { PainelFicha } from "./PainelFicha";
import type { PedidoModalRegra } from "./ModalRegra";
import type { TipoFicha } from "../../types";

export { PainelFicha };

export function TelaFichas({ aoAbrirRegra }: { aoAbrirRegra: (p: PedidoModalRegra) => void }) {
  const { pronto, fichas, regras, julgamentos } = usarCentral();
  void fichas; void regras; void julgamentos; // re-render quando qualquer um mudar
  const nav = usarNavegacao();

  const tipos: TipoFicha[] = ["artista", "projeto", "edital"];
  const todas = tipos.flatMap(entidades);

  // Garante uma ficha selecionada válida — só com os dados carregados, senão
  // um link profundo (#/contexto/fichas/a5) seria limpo antes de a coleção chegar.
  const selecionada = nav.fichaAberta && entidadePorId(nav.fichaAberta) ? nav.fichaAberta : todas[0]?.id || null;
  useEffect(() => {
    if (pronto && selecionada !== nav.fichaAberta) definirFichaAberta(selecionada);
  }, [pronto, selecionada, nav.fichaAberta]);

  if (!selecionada) {
    return <Vazio className="mt-gutter">Cadastre artistas, projetos e editais para ter fichas aqui.</Vazio>;
  }

  return (
    <Grade colunas="lateral">
      <ListaLateral className="mt-gutter">
        {tipos.map((t) => (
          <Fragment key={t}>
            <GrupoLista separado={t !== "artista"}>{TIPOS_FICHA[t]}</GrupoLista>
            {entidades(t).map((x) => (
              <ItemLista
                key={x.id}
                ativo={x.id === selecionada}
                apagado={!temFicha(x.id)}
                direita={regrasDe(t, x.id).length || undefined}
                onClick={() => { definirFichaAberta(x.id); window.scrollTo({ top: 0 }); }}
              >
                {x.nome}
              </ItemLista>
            ))}
          </Fragment>
        ))}
      </ListaLateral>
      <PainelFicha key={selecionada} id={selecionada} aoAbrirRegra={aoAbrirRegra} />
    </Grade>
  );
}
