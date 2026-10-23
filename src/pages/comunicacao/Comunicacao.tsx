/* Ambiente Comunicação: por enquanto só a Biblioteca de referências. Planos e
   Como funciona (doc 02 da metodologia, seção 1) entram como abas depois. */
import { usarNavegacao } from "../../store/navegacao";
import { Biblioteca } from "./biblioteca/Biblioteca";

export function Comunicacao() {
  const nav = usarNavegacao();
  switch (nav.aba) {
    case "biblioteca":
    default:
      return <Biblioteca />;
  }
}
