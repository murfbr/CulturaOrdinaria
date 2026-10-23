/* Grade e método: o que cada campo da grade de leitura virou depois das rodadas,
   como os dados foram coletados (e os limites), e de onde a rodada vem. */
import { Painel } from "../../../components/ui/Painel";
import { Badge } from "../../../components/ui/Badge";
import { formatarData } from "../../../utils";
import type { VistaRodada } from "./dados";
import { ListaTexto, Texto } from "./Texto";

export function Metodo({ vista }: { vista: VistaRodada }) {
  const { rodada } = vista;
  return (
    <>
      <Painel titulo={"A grade " + rodada.grade + ", campo a campo"} sub="o que cada campo virou depois das rodadas">
        <dl className="m-0 divide-y divide-line">
          {rodada.gradeCampos.map((g) => (
            <div key={g.campo} className="flex flex-col gap-1 py-2.5 md:flex-row md:gap-4">
              <dt className="flex shrink-0 flex-wrap items-baseline gap-2 md:w-[320px]">
                <span className="font-semibold text-ink">{g.campo}</span>
                <Badge mini>{g.situacao}</Badge>
              </dt>
              <dd className="m-0 text-base text-muted"><Texto>{g.nota}</Texto></dd>
            </div>
          ))}
        </dl>
      </Painel>
      <Painel titulo="Como foi coletado e limites"><ListaTexto itens={rodada.metodo} /></Painel>
      <Painel titulo="De onde vem esta rodada">
        <ListaTexto itens={[
          "A leitura mora no **artefato vivo** da Biblioteca, na conta do Antonio (o link abre só pra ele). Lá ficam os dados brutos, as contas e os textos de cada rodada.",
          "A cada rodada, a **rotina** relê os perfis, atualiza o artefato, gera o arquivo do espelho e grava aqui pela aba Importar. Mesmo id grava por cima: repetir não duplica.",
          "Ninguém edita a Biblioteca na Central. Corrigir é pedir ao Claude, que corrige no artefato e espelha de novo.",
        ]} />
        <p className="m-0 mt-3 text-sm text-muted">
          Arquivo gerado em {formatarData(rodada.origem.geradoEm)}
          {rodada.origem.artefato && <> · <a href={rodada.origem.artefato} target="_blank" rel="noreferrer" className="font-semibold text-accent hover:underline">abrir o artefato ↗</a></>}
        </p>
      </Painel>
    </>
  );
}
