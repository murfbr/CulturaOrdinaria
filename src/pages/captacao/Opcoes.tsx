/* Captação · Opções: as listas de escolha, o que há na base e o botão de trazer
   os dados do artefato. Na visão de uma captadora, só o aviso: as listas são
   da equipe. */
import { usarCentral } from "../../store/central";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { Dica } from "../../components/ui/Dica";
import { Painel } from "../../components/ui/Painel";
import { COLECOES_CAPTACAO, ROTULO_COLECAO } from "../../types";
import { ImportarArtefato } from "./opcoes/ImportarArtefato";
import { Listas } from "./opcoes/Listas";
import { usarComo } from "./visao";

export function Opcoes() {
  const { painel } = usarCentral();
  const como = usarComo();

  if (como) {
    return (
      <>
        <CabecalhoSecao titulo="Opções" sub="as listas de escolha da Captação" />
        <Dica emModal>Só a equipe do coletivo mexe nas listas. Volte para “Todos (coletivo)” na faixa acima.</Dica>
      </>
    );
  }

  return (
    <>
      <CabecalhoSecao titulo="Opções" sub="as listas de escolha da Captação: renomeie à vontade; para apagar, o item não pode estar em uso" />
      <Listas />
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Painel titulo="Dados na base" sub="registros em cada coleção" className="mb-0">
          <ul className="m-0 list-none p-0 text-sm">
            {COLECOES_CAPTACAO.map((c) => (
              <li key={c} className="flex justify-between border-t border-line py-1 first:border-t-0">
                <span>{ROTULO_COLECAO[c]}</span><b className="tabular-nums">{painel[c].length}</b>
              </li>
            ))}
          </ul>
          <Dica className="mt-2">Exportar e as planilhas ficam em Gestão, como o resto da Central.</Dica>
        </Painel>
        <ImportarArtefato />
      </div>
    </>
  );
}
