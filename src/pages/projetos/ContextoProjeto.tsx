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
    <div className="ctx-embutido">
      <div className="pilulas">
        <button className={aberta === "resumo" ? "on" : ""} onClick={() => setAberta("resumo")}>Resumo para escrever</button>
        {ids.map((id) => (
          <button key={id} className={aberta === id ? "on" : ""} onClick={() => setAberta(id)}>{rotulo(id)}</button>
        ))}
        <button className="btn sm" style={{ marginLeft: "auto" }}
          onClick={() => void copiarComAviso(montarBloco(ids, true), "Contexto do projeto copiado para colar numa conversa")}>
          Copiar tudo para o Claude
        </button>
      </div>

      {aberta === "resumo" ? (
        <div className="drawer" style={{ borderColor: "var(--line)" }}>
          <RegrasParaRascunho ids={ids} />
        </div>
      ) : (
        <div id="ctx"><PainelFicha key={aberta} id={aberta} aoAbrirRegra={setModalRegra} semCabecalho /></div>
      )}

      {modalRegra && <div id="ctx"><ModalRegra pedido={modalRegra} aoFechar={() => setModalRegra(null)} /></div>}
    </div>
  );
}
