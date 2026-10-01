/* Patrocínios e apoios: três abas, cotas, patrocínios (o funil) e parceiros
   institucionais. A aba escolhida vale enquanto a página está aberta. */
import { useState } from "react";
import type { Base } from "../tipos";
import { Abas } from "../ui/Abas";
import { CabecalhoVista } from "../ui/CabecalhoVista";
import { TITULOS, type IrPara } from "../vista";
import { Cotas } from "./Cotas";
import { Funil } from "./Funil";
import { Parceiros } from "./Parceiros";

type AbaPatrocinios = "cotas" | "patrocinios" | "parceiros";
let abaLembrada: AbaPatrocinios = "cotas";

export function TelaPatrocinios({ base, irPara }: { base: Base; irPara: IrPara }) {
  const [aba, setAba] = useState<AbaPatrocinios>(abaLembrada);
  const mudar = (a: AbaPatrocinios) => { abaLembrada = a; setAba(a); };
  const [titulo, lead] = TITULOS.patrocinios!;
  return (
    <>
      <CabecalhoVista titulo={titulo} lead={lead} />
      <Abas
        abas={[
          { id: "cotas", nome: "Cotas", n: Object.keys(base.cotas).length },
          { id: "patrocinios", nome: "Patrocínios", n: Object.keys(base.patrocinios).length },
          { id: "parceiros", nome: "Parceiros institucionais", n: Object.keys(base.parceiros).length },
        ]}
        ativa={aba} aoMudar={mudar}
      />
      {aba === "cotas" ? <Cotas base={base} irPara={irPara} /> : aba === "patrocinios" ? <Funil base={base} irPara={irPara} /> : <Parceiros base={base} />}
    </>
  );
}
