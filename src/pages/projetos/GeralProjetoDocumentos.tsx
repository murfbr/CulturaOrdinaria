/* Aba Geral do projeto, parte 3: a checklist de documentos da inscrição (com
   os exigidos pelo edital e os que estão na ficha dos artistas) e os itens
   de produção, com o status que gira ao clicar na etiqueta. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { editalDoProjeto } from "../../lib/nomes";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { CaixaMarcar, Entrada } from "../../components/ui/Campo";
import { Linha } from "../../components/ui/Linha";
import { Painel } from "../../components/ui/Painel";
import { Rotulo } from "../../components/ui/Rotulo";
import type { Projeto } from "../../types";
import { cx } from "../../utils/classes";
import { alterarProjeto, BotaoRemover, ESTILO_LINHA_EDITAVEL } from "./GeralProjetoComum";

export function GeralProjetoDocumentos({ p }: { p: Projeto }) {
  const { painel } = usarCentral();
  const [novoDoc, setNovoDoc] = useState("");
  const edital = editalDoProjeto(p);
  const artistas = p.artistaIds.map((id) => painel.artistas.find((a) => a.id === id)).filter(Boolean);
  const alterar = (fn: (c: Projeto) => void, rapido = true) => alterarProjeto(p, fn, rapido);
  const acrescentar = () => {
    if (!novoDoc.trim()) return;
    alterar((c) => { c.docs.push({ nome: novoDoc.trim(), ok: false }); });
    setNovoDoc("");
  };

  return (
    <Painel titulo="Documentos da inscrição" sub={`${p.docs.filter((d) => d.ok).length} de ${p.docs.length} prontos`}>
      <div>
        {p.docs.map((d, k) => (
          <div className={cx(ESTILO_LINHA_EDITAVEL, "md:grid-cols-[20px_2fr_2fr_28px]")} key={k}>
            <CaixaMarcar marcado={d.ok} title="marcar pronto" aoMudar={() => alterar((c) => { c.docs[k].ok = !c.docs[k].ok; })} />
            <Entrada className={d.ok ? "opacity-60" : undefined} value={d.nome} placeholder="documento"
              onChange={(e) => alterar((c) => { c.docs[k].nome = e.target.value; }, false)} />
            <Entrada className={d.ok ? "opacity-60" : undefined} value={d.obs || ""} placeholder="observação"
              onChange={(e) => alterar((c) => { c.docs[k].obs = e.target.value; }, false)} />
            <BotaoRemover onClick={() => alterar((c) => { c.docs.splice(k, 1); })} />
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Entrada className="min-w-0 flex-1" value={novoDoc} placeholder="novo documento (declaração, certidão, portfólio…)"
          onChange={(e) => setNovoDoc(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") acrescentar(); }} />
        <Botao variante="fantasma" tamanho="pequeno" onClick={acrescentar}>+ documento</Botao>
        {edital?.docsExig?.length ? (
          <Botao variante="quieto" tamanho="pequeno" title="acrescenta os documentos exigidos pelo edital que ainda não estão na lista"
            onClick={() => alterar((c) => {
              const ja = new Set(c.docs.map((d) => d.nome));
              (edital.docsExig || []).forEach((nome) => { if (!ja.has(nome)) c.docs.push({ nome, ok: false }); });
            })}>puxar do edital</Botao>
        ) : null}
      </div>
      {artistas.some((a) => a!.det?.docs?.length) && (
        <div className="mt-3 border-t border-dashed border-line-strong pt-2">
          <Rotulo className="mb-1">na ficha dos artistas</Rotulo>
          <div>
            {artistas.map((a) => (a!.det?.docs || []).map((d, i) => (
              <Linha key={a!.id + i} compacta
                direita={<Badge tom={d.status === "ok" ? "ok" : "aviso"}>{d.status === "ok" ? "na ficha" : "pendente"}</Badge>}>
                {d.nome} <span className="text-muted">· {a!.nome}</span>
              </Linha>
            )))}
          </div>
        </div>
      )}
    </Painel>
  );
}

/** Itens de produção: a etiqueta gira a fazer → em andamento → feito. */
export function GeralProjetoProducao({ p }: { p: Projeto }) {
  const [novoItem, setNovoItem] = useState("");
  const alterar = (fn: (c: Projeto) => void, rapido = true) => alterarProjeto(p, fn, rapido);
  const acrescentar = () => {
    if (!novoItem.trim()) return;
    alterar((c) => { c.producao.push({ texto: novoItem.trim(), status: "fazer" }); });
    setNovoItem("");
  };

  return (
    <Painel titulo="Produção" sub={`${p.producao.filter((x) => x.status === "feito").length} de ${p.producao.length} feitos`}>
      <div>
        {p.producao.map((item, i) => (
          <Linha key={i} compacta
            direita={
              <>
                <Badge clicavel tom={item.status === "feito" ? "ok" : item.status === "and" ? "aviso" : "neutro"} title="clique para mudar o status"
                  onClick={() => alterar((c) => {
                    const ordem = ["fazer", "and", "feito"];
                    c.producao[i].status = ordem[(ordem.indexOf(c.producao[i].status) + 1) % 3];
                  })}>
                  {item.status === "feito" ? "feito" : item.status === "and" ? "em andamento" : "a fazer"}
                </Badge>
                <BotaoRemover title="remover item" onClick={() => alterar((c) => { c.producao.splice(i, 1); })} />
              </>
            }>
            {item.texto}
          </Linha>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Entrada className="min-w-0 flex-1" value={novoItem} placeholder="novo item (ex.: fechar orçamento de som)"
          onChange={(e) => setNovoItem(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") acrescentar(); }} />
        <Botao variante="fantasma" tamanho="pequeno" onClick={acrescentar}>+ item</Botao>
      </div>
    </Painel>
  );
}
