/* O cartão de um arquivo: nome e descrição, a versão atual (ou "faltante"),
   abrir, nova versão, as versões anteriores (com remover em dois cliques) e
   os comentários. Serve às abas Apresentações e Contexto. */
import { useState } from "react";
import { toast } from "../../../components/Toast";
import { clonar } from "../../../utils";
import { dataBr } from "../calculo";
import { gravar } from "../dados";
import type { ArquivoBase, Base } from "../tipos";
import { Botao } from "../ui/Botao";
import { BotaoArmado } from "../ui/BotaoArmado";
import { Pilula } from "../ui/Tag";
import { apagarArquivo, tamanhoLegivel } from "./armazenamento";
import { Comentarios } from "./Comentarios";
import { ModalVersao } from "./ModalVersao";

interface Props { base: Base; cartao: ArquivoBase; aoEditar?: () => void }

export function CartaoArquivo({ base, cartao, aoEditar }: Props) {
  const [modal, setModal] = useState(false);
  const [anteriores, setAnteriores] = useState(false);
  const versoes = cartao.versoes || [];
  const atual = versoes[versoes.length - 1];

  function removerVersao(indice: number) {
    const v = versoes[indice];
    void apagarArquivo(v.arquivo);
    gravar("arquivos", { ...clonar(cartao), versoes: versoes.filter((_, i) => i !== indice) });
    toast("Versão " + v.versao + " removida.");
  }

  const linha = (v: ArquivoBase["versoes"][number]) =>
    v.versao + " · " + dataBr(v.data) + (v.por ? " · " + v.por : "") + (v.arquivo.tamanho ? " · " + tamanhoLegivel(v.arquivo.tamanho) : "")
    + (v.arquivo.tipo === "link" ? " · link" : "");

  return (
    <article className="cdf:flex cdf:flex-col cdf:rounded-xl cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie cdf:p-4">
      <div className="cdf:flex cdf:flex-wrap cdf:items-start cdf:gap-2">
        <div className="cdf:min-w-0 cdf:flex-1">
          <h3 className="cdf:m-0 cdf:font-display cdf:text-[22px] cdf:font-black cdf:leading-[1.1]">{cartao.nome}</h3>
          {cartao.descricao && <p className="cdf:m-0 cdf:mt-1 cdf:text-sm cdf:text-tinta-2">{cartao.descricao}</p>}
        </div>
        {atual
          ? <Pilula classe="cdf:bg-conf-bg cdf:text-conf">{atual.versao}</Pilula>
          : <Pilula classe="cdf:bg-rec-bg cdf:text-rec">Faltante</Pilula>}
      </div>

      {atual ? (
        <p className="cdf:m-0 cdf:mt-3 cdf:text-sm cdf:text-fraco">
          {atual.arquivo.nomeOriginal ? <span className="cdf:text-tinta">{atual.arquivo.nomeOriginal}</span> : null}
          {atual.arquivo.nomeOriginal ? <br /> : null}
          {linha(atual)}
        </p>
      ) : (
        <p className="cdf:m-0 cdf:mt-3 cdf:text-sm cdf:text-fraco">Ainda não foi feito. Quando existir, envie a primeira versão.</p>
      )}

      <div className="cdf:mt-3 cdf:flex cdf:flex-wrap cdf:gap-1.5">
        {atual && <a className="cdf:inline-flex cdf:items-center cdf:rounded-lg cdf:border-[1.5px] cdf:border-solid cdf:border-primaria cdf:bg-primaria cdf:px-3.5 cdf:py-2 cdf:text-sm cdf:font-bold cdf:text-primaria-texto cdf:no-underline" href={atual.arquivo.url} target="_blank" rel="noopener">Abrir</a>}
        <Botao onClick={() => setModal(true)}>{atual ? "Nova versão" : "Enviar a primeira versão"}</Botao>
        {versoes.length > 1 && <Botao variante="fraco" onClick={() => setAnteriores(!anteriores)}>{anteriores ? "Esconder anteriores" : "Versões anteriores (" + (versoes.length - 1) + ")"}</Botao>}
        {aoEditar && <Botao variante="fraco" onClick={aoEditar}>Editar</Botao>}
      </div>

      {anteriores && versoes.length > 1 && (
        <ul className="cdf:m-0 cdf:mt-3 cdf:flex cdf:list-none cdf:flex-col cdf:gap-1.5 cdf:p-0 cdf:text-sm">
          {versoes.slice(0, -1).map((v, i) => (
            <li key={i} className="cdf:flex cdf:flex-wrap cdf:items-center cdf:gap-2 cdf:rounded-lg cdf:bg-superficie-2 cdf:px-3 cdf:py-1.5">
              <span className="cdf:text-tinta-2">{linha(v)}</span>
              <a className="cdf:font-bold" href={v.arquivo.url} target="_blank" rel="noopener">Abrir</a>
              <BotaoArmado variante="fraco" mini confirmar="Confirmar" className="cdf:ml-auto" onClick={() => removerVersao(i)}>Remover</BotaoArmado>
            </li>
          ))}
        </ul>
      )}
      {atual && versoes.length >= 1 && (
        <div className="cdf:mt-2 cdf:text-right">
          <BotaoArmado variante="fraco" mini confirmar="Confirmar remoção" onClick={() => removerVersao(versoes.length - 1)}>Remover a versão atual</BotaoArmado>
        </div>
      )}

      <Comentarios base={base} sobre={"arquivo:" + cartao.id} />
      {modal && <ModalVersao cartao={cartao} aoFechar={() => setModal(false)} />}
    </article>
  );
}
