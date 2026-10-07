/* Aba Contexto do projeto: primeiro o resumo para escrever (regras gerais e o
   essencial das fichas do edital, do projeto e dos artistas); depois, cada
   ficha inteira, editável — é a mesma do ambiente Contexto, pelo mesmo id. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { idsDoProjeto } from "../../store/mutacoes";
import { entidadePorId } from "../../lib/contexto/consultas";
import { nomeCurto } from "../../lib/nomes";
import { porId } from "../../store/mutacoes";
import { montarBloco } from "../../lib/contexto/bloco";
import { copiarComAviso } from "../../components/Toast";
import { Botao } from "../../components/ui/Botao";
import { Painel } from "../../components/ui/Painel";
import { Pilulas } from "../../components/ui/Pilulas";
import { RegrasParaRascunho } from "../contexto/RegrasParaRascunho";
import { PainelFicha } from "../contexto/Fichas";
import { ModalRegra, type PedidoModalRegra } from "../contexto/ModalRegra";
import type { Projeto } from "../../types";

export function ContextoProjeto({ p }: { p: Projeto }) {
  usarCentral();
  const [aberta, setAberta] = useState<string>("resumo");
  const [modalRegra, setModalRegra] = useState<PedidoModalRegra | null>(null);
  const ids = idsDoProjeto(p);
  const rotulo = (id: string) => {
    const e = entidadePorId(id);
    if (!e) return id;
    const nome = e.tipo === "edital" ? nomeCurto(porId("editais", id)) || e.nome : e.nome;
    return { artista: "Artista", projeto: "Projeto", edital: "Edital" }[e.tipo] + " · " + nome;
  };

  return (
    <>
      <Pilulas ativa={aberta} aoEscolher={setAberta}
        opcoes={[{ id: "resumo", rotulo: "Resumo para escrever" }, ...ids.map((id) => ({ id, rotulo: rotulo(id) }))]}>
        <Botao variante="fantasma" tamanho="pequeno" className="ml-auto"
          onClick={() => void copiarComAviso(montarBloco(ids, true), "Contexto do projeto copiado para colar numa conversa")}>
          Copiar tudo para o Claude
        </Botao>
      </Pilulas>

      {aberta === "resumo" ? (
        <Painel><RegrasParaRascunho ids={ids} /></Painel>
      ) : (
        <PainelFicha key={aberta} id={aberta} aoAbrirRegra={setModalRegra} semCabecalho />
      )}

      {modalRegra && <ModalRegra pedido={modalRegra} aoFechar={() => setModalRegra(null)} />}
    </>
  );
}
