/* Orçamento: o cenário (essencial, ideal, expandido) vale para as três
   abas, painel, simulador e detalhamento. A aba escolhida vale enquanto a
   página está aberta. */
import { useState } from "react";
import { CENARIOS } from "../calculo";
import { alterarSimulador } from "../dados";
import type { Base } from "../tipos";
import { Abas } from "../ui/Abas";
import { CabecalhoVista } from "../ui/CabecalhoVista";
import { Segmentado } from "../ui/Segmentado";
import { TITULOS } from "../vista";
import { Detalhamento } from "./Detalhamento";
import { PainelOrcamento } from "./PainelOrcamento";
import { Simulador } from "./Simulador";

type AbaOrcamento = "painel" | "simulador" | "detalhamento";
let abaLembrada: AbaOrcamento = "painel";

export function TelaOrcamento({ base }: { base: Base }) {
  const [aba, setAba] = useState<AbaOrcamento>(abaLembrada);
  const mudar = (a: AbaOrcamento) => { abaLembrada = a; setAba(a); };
  const [titulo, lead] = TITULOS.orcamento!;
  return (
    <>
      <CabecalhoVista titulo={titulo} lead={lead}>
        <div className="cdf:mt-4 cdf:flex cdf:flex-wrap cdf:items-center cdf:gap-2.5">
          <span className="cdf:text-sm cdf:text-fraco">Cenário</span>
          <Segmentado rotulo="Cenário" opcoes={CENARIOS} valor={base.pagina.simulador.cenario} aoMudar={(cenario) => alterarSimulador({ cenario })} />
        </div>
      </CabecalhoVista>
      <Abas
        abas={[
          { id: "painel", nome: "Painel" },
          { id: "simulador", nome: "Simulador" },
          { id: "detalhamento", nome: "Detalhamento", n: Object.keys(base.orcamento_itens).length },
        ]}
        ativa={aba} aoMudar={mudar}
      />
      {aba === "painel" ? <PainelOrcamento base={base} /> : aba === "simulador" ? <Simulador base={base} /> : <Detalhamento base={base} />}
    </>
  );
}
