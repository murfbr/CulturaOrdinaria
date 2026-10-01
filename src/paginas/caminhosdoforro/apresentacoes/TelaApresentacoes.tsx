/* Apresentações: um cartão por versão do deck (institucional, comercial de
   primeiro contato, comercial de segundo contato), cada um com o arquivo
   (upload ou link), as versões e os comentários. A versão que ainda não
   existe aparece como faltante. Os três cartões vêm da semente; a descrição
   de cada um se edita, mas não se cria nem se apaga cartão aqui. */
import { useState } from "react";
import { CartaoArquivo } from "../arquivos/CartaoArquivo";
import { ModalArquivo } from "../arquivos/ModalArquivo";
import { VERSOES_APRESENTACAO, type Base } from "../tipos";
import { Vazio } from "../ui/Bloco";
import { CabecalhoVista } from "../ui/CabecalhoVista";
import { TITULOS } from "../vista";

export function TelaApresentacoes({ base }: { base: Base }) {
  const [modal, setModal] = useState<string | null>(null);
  const [titulo, lead] = TITULOS.apresentacoes!;
  const cartoes = Object.values(base.arquivos).filter((a) => a.secao === "apresentacao");
  const ordem = (grupo: string) => { const i = VERSOES_APRESENTACAO.findIndex(([g]) => g === grupo); return i < 0 ? 99 : i; };
  const lista = [...cartoes].sort((a, b) => ordem(a.grupo) - ordem(b.grupo) || (a.ordem || 99) - (b.ordem || 99));
  const faltantes = lista.filter((a) => !(a.versoes || []).length).length;
  return (
    <>
      <CabecalhoVista titulo={titulo} lead={lead}>
        {lista.length > 0 && (
          <p className="cdf:m-0 cdf:mt-2 cdf:text-sm cdf:text-fraco">
            {faltantes ? `${lista.length - faltantes} de ${lista.length} versões já guardadas; ${faltantes} ${faltantes === 1 ? "faltante" : "faltantes"}.` : "As três versões estão guardadas."}
          </p>
        )}
      </CabecalhoVista>
      {lista.length ? (
        <div className="cdf:grid cdf:grid-cols-1 cdf:gap-3 cdf:md:grid-cols-2 cdf:xl:grid-cols-3">
          {lista.map((a) => <CartaoArquivo key={a.id} base={base} cartao={a} aoEditar={() => setModal(a.id)} />)}
        </div>
      ) : (
        <Vazio>Os cartões das apresentações ainda não foram criados na base.</Vazio>
      )}
      {modal && <ModalArquivo base={base} id={modal} aoFechar={() => setModal(null)} />}
    </>
  );
}
