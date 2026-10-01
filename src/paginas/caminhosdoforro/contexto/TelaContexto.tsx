/* Contexto: os arquivos do festival em três grupos (projeto escrito,
   pesquisa externa, arquivos base), cada um como cartão com versões e
   comentários. "Novo arquivo" em cada grupo. */
import { useState } from "react";
import { CartaoArquivo } from "../arquivos/CartaoArquivo";
import { ModalArquivo } from "../arquivos/ModalArquivo";
import { porNome } from "../calculo";
import { GRUPOS_CONTEXTO, type Base } from "../tipos";
import { Vazio } from "../ui/Bloco";
import { Botao } from "../ui/Botao";
import { CabecalhoVista } from "../ui/CabecalhoVista";
import { SECAO } from "../ui/classes";
import { TITULOS } from "../vista";

export function TelaContexto({ base }: { base: Base }) {
  const [modal, setModal] = useState<{ id: string | null; grupo?: string } | null>(null);
  const [titulo, lead] = TITULOS.contexto!;
  const cartoes = Object.values(base.arquivos).filter((a) => a.secao === "contexto");
  return (
    <>
      <CabecalhoVista titulo={titulo} lead={lead} />
      {GRUPOS_CONTEXTO.map(([gid, gnome]) => {
        const lista = cartoes.filter((a) => a.grupo === gid).sort((a, b) => (a.ordem || 99) - (b.ordem || 99) || porNome(a, b));
        return (
          <section key={gid}>
            <h2 className={SECAO}>{gnome}<Botao mini className="cdf:ml-auto cdf:font-sans" onClick={() => setModal({ id: null, grupo: gid })}>Novo arquivo</Botao></h2>
            {lista.length ? (
              <div className="cdf:grid cdf:grid-cols-1 cdf:gap-3 cdf:md:grid-cols-2">
                {lista.map((a) => <CartaoArquivo key={a.id} base={base} cartao={a} aoEditar={() => setModal({ id: a.id })} />)}
              </div>
            ) : (
              <Vazio>Nenhum arquivo neste grupo. Use “Novo arquivo”.</Vazio>
            )}
          </section>
        );
      })}
      {modal && <ModalArquivo base={base} id={modal.id} grupo={modal.grupo} aoFechar={() => setModal(null)} />}
    </>
  );
}
