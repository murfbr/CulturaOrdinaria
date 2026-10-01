/* Configuração: parâmetros do festival, as listas de seleção e o que está
   carregado na base. Um bloco por arquivo. */
import type { Base } from "../tipos";
import { CabecalhoVista } from "../ui/CabecalhoVista";
import { TITULOS } from "../vista";
import { DadosNaBase } from "./DadosNaBase";
import { Listas } from "./Listas";
import { Parametros } from "./Parametros";

export function TelaConfiguracao({ base }: { base: Base }) {
  const [titulo, lead] = TITULOS.config!;
  return (
    <>
      <CabecalhoVista titulo={titulo} lead={lead} />
      <Parametros parametros={base.pagina.parametros} />
      <Listas base={base} />
      <DadosNaBase base={base} />
    </>
  );
}
