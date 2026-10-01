/* Cadastro geral: três abas, pessoas e organizações, equipe e núcleos,
   espaços. A aba escolhida vale enquanto a página está aberta, como o S.aba
   do artefato. */
import { useState } from "react";
import { cadastrosDoTipo } from "../calculo";
import type { Base } from "../tipos";
import { Abas } from "../ui/Abas";
import { CabecalhoVista } from "../ui/CabecalhoVista";
import { TITULOS, type IrPara } from "../vista";
import { EquipeNucleos } from "./EquipeNucleos";
import { Espacos } from "./Espacos";
import { Pessoas } from "./Pessoas";

type AbaCadastro = "pessoas" | "equipe" | "espacos";
let abaLembrada: AbaCadastro = "pessoas";

export function TelaCadastro({ base, irPara }: { base: Base; irPara: IrPara }) {
  const [aba, setAba] = useState<AbaCadastro>(abaLembrada);
  const mudar = (a: AbaCadastro) => { abaLembrada = a; setAba(a); };
  const [titulo, lead] = TITULOS.cadastro!;
  return (
    <>
      <CabecalhoVista titulo={titulo} lead={lead} />
      <Abas
        abas={[
          { id: "pessoas", nome: "Pessoas e organizações", n: Object.keys(base.cadastro).length },
          { id: "equipe", nome: "Equipe e núcleos", n: cadastrosDoTipo(base, "equipe").length },
          { id: "espacos", nome: "Espaços", n: Object.keys(base.espacos).length },
        ]}
        ativa={aba} aoMudar={mudar}
      />
      {aba === "pessoas" ? <Pessoas base={base} /> : aba === "equipe" ? <EquipeNucleos base={base} irPara={irPara} /> : <Espacos base={base} />}
    </>
  );
}
