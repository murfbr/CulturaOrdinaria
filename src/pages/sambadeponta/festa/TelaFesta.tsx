/* A festa: capa, linha do tempo das edições, comparativo, aprendizados,
   checklist-mestre, fornecedores e ajuda. Uma seção por arquivo. */
import { Capa } from "./Capa";
import { LinhaDoTempo } from "./LinhaDoTempo";
import { Comparativo } from "./Comparativo";
import { Aprendizados } from "./Aprendizados";
import { ChecklistMestre } from "./ChecklistMestre";
import { Fornecedores } from "./Fornecedores";
import { ComoUsar } from "./ComoUsar";
import type { Painel } from "../tipos";
import type { IrPara } from "../visao";

export function TelaFesta({ painel, irPara }: { painel: Painel; irPara: IrPara }) {
  return (
    <>
      <Capa painel={painel} />
      <LinhaDoTempo painel={painel} irPara={irPara} />
      <Comparativo painel={painel} />
      <Aprendizados painel={painel} />
      <ChecklistMestre painel={painel} />
      <Fornecedores painel={painel} />
      <ComoUsar />
    </>
  );
}
