/* As seis abas da Captação, com a faixa "Ver como" em cima de todas. A ficha
   da empresa (detalhe) é desenhada pelo RoteadorPainel, como as outras fichas. */
import { FaixaVerComo } from "./FaixaVerComo";
import { ResumoCaptacao } from "./Resumo";
import { Portfolio } from "./Portfolio";
import { Empresas } from "./Empresas";
import { Negociacoes } from "./Negociacoes";
import { Captadoras } from "./Captadoras";
import { Opcoes } from "./Opcoes";

export function RoteadorCaptacao({ aba }: { aba: string }) {
  let tela;
  switch (aba) {
    case "portfolio": tela = <Portfolio />; break;
    case "empresas": tela = <Empresas />; break;
    case "negociacoes": tela = <Negociacoes />; break;
    case "captadoras": tela = <Captadoras />; break;
    case "opcoes": tela = <Opcoes />; break;
    default: tela = <ResumoCaptacao />;
  }
  return (
    <>
      <FaixaVerComo />
      {tela}
    </>
  );
}
