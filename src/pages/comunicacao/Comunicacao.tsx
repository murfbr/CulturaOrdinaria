/* Ambiente Comunicação: Biblioteca (referências, análises, perfis próprios),
   Divulgadores (perfis de agenda que replicam nossos eventos, com o kit de
   links de UTM) e Mailing (a lista nominal do Sympla, só com o módulo
   "mailing"). Planos e Como funciona (doc 02 da metodologia, seção 1) entram
   como abas depois. */
import { usarNavegacao } from "../../store/navegacao";
import { Biblioteca } from "./biblioteca/Biblioteca";
import { Divulgadores } from "./divulgadores/Divulgadores";
import { Mailing } from "./mailing/Mailing";

export function Comunicacao() {
  const nav = usarNavegacao();
  switch (nav.aba) {
    case "divulgadores":
      return <Divulgadores />;
    case "mailing":
      return <Mailing />;
    case "biblioteca":
    default:
      return <Biblioteca />;
  }
}
