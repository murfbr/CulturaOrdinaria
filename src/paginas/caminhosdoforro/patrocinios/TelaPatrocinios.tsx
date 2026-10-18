/* Patrocínios e apoios: quatro abas, cotas, patrocínios (o funil), parceiros
   institucionais e captadores. Mora na página do núcleo de captação (sem o
   cabeçalho próprio) e, se esse núcleo não existir, abre como vista solta.
   A aba escolhida vale enquanto a página está aberta. */
import { useState } from "react";
import { captadores } from "../calculo";
import type { Base } from "../tipos";
import { Abas } from "../ui/Abas";
import { CabecalhoVista } from "../ui/CabecalhoVista";
import { TITULOS, type IrPara } from "../vista";
import { Captadores } from "./Captadores";
import { Cotas } from "./Cotas";
import { Funil } from "./Funil";
import { Parceiros } from "./Parceiros";

type AbaPatrocinios = "cotas" | "patrocinios" | "parceiros" | "captadores";
let abaLembrada: AbaPatrocinios = "cotas";

export function TelaPatrocinios({ base, irPara, semCabecalho }: { base: Base; irPara: IrPara; semCabecalho?: boolean }) {
  const [aba, setAba] = useState<AbaPatrocinios>(abaLembrada);
  const mudar = (a: AbaPatrocinios) => { abaLembrada = a; setAba(a); };
  const [titulo, lead] = TITULOS.patrocinios!;
  return (
    <>
      {!semCabecalho && <CabecalhoVista titulo={titulo} lead={lead} />}
      <Abas
        abas={[
          { id: "cotas", nome: "Cotas", n: Object.keys(base.cotas).length },
          { id: "patrocinios", nome: "Patrocínios", n: Object.keys(base.patrocinios).length },
          { id: "parceiros", nome: "Parceiros institucionais", n: Object.keys(base.parceiros).length },
          { id: "captadores", nome: "Captadores", n: captadores(base).length },
        ]}
        ativa={aba} aoMudar={mudar}
      />
      {aba === "cotas" ? <Cotas base={base} irPara={irPara} />
        : aba === "patrocinios" ? <Funil base={base} irPara={irPara} />
        : aba === "parceiros" ? <Parceiros base={base} />
        : <Captadores base={base} />}
    </>
  );
}
