/* Painel geral: o festival num olhar. Contagem regressiva, captação contra
   a meta, line-up confirmado e um card por núcleo. Só leitura: tudo é conta
   sobre o que as outras abas guardam, com links para elas. */
import { dataBr, textoContagem } from "../calculo";
import { ResumoCaptacao } from "../patrocinios/ResumoCaptacao";
import type { Base } from "../tipos";
import { Botao } from "../ui/Botao";
import { CabecalhoVista } from "../ui/CabecalhoVista";
import { SECAO } from "../ui/classes";
import { TITULOS, type IrPara } from "../vista";
import { Lineup } from "./Lineup";
import { Nucleos } from "./Nucleos";

export function TelaPainel({ base, irPara }: { base: Base; irPara: IrPara }) {
  const [titulo, lead] = TITULOS.painel!;
  const { inicio, fim } = base.pagina.parametros;
  const contagem = textoContagem(inicio);
  return (
    <>
      <CabecalhoVista titulo={titulo} lead={lead} />

      <section className="cdf:mb-6 cdf:flex cdf:flex-wrap cdf:items-end cdf:gap-x-6 cdf:gap-y-2 cdf:rounded-xl cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie cdf:px-5 cdf:py-4">
        {contagem ? (
          <p className="cdf:m-0 cdf:flex cdf:items-baseline cdf:gap-3">
            {contagem.numero && <strong className="cdf:font-display cdf:text-giant cdf:font-black cdf:leading-none cdf:text-primaria">{contagem.numero}</strong>}
            <span className="cdf:text-lg cdf:text-tinta-2">{contagem.texto}</span>
          </p>
        ) : (
          <p className="cdf:m-0 cdf:text-tinta-2">Sem data do festival. <button type="button" className="cdf:cursor-pointer cdf:border-0 cdf:bg-transparent cdf:p-0 cdf:font-bold cdf:text-link cdf:underline" onClick={() => irPara("config")}>Definir em Configuração</button></p>
        )}
        <p className="cdf:m-0 cdf:text-sm cdf:text-fraco">{inicio && fim ? "De " + dataBr(inicio) + " a " + dataBr(fim) : inicio ? dataBr(inicio) : ""}</p>
      </section>

      <h2 className={SECAO}>Captação<Botao mini className="cdf:ml-auto cdf:font-sans" onClick={() => irPara("patrocinios")}>Patrocínios e apoios</Botao></h2>
      <ResumoCaptacao base={base} irPara={irPara} />

      <Lineup base={base} irPara={irPara} />
      <Nucleos base={base} irPara={irPara} />
    </>
  );
}
