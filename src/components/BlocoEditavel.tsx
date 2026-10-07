/* Painel com edição em linha: mostra o conteúdo e, no "editar", vira um
   textarea de texto simples (um item por linha; pares separados por " | ").
   Usado no acervo do artista — mesmo jeitão dos blocos das fichas do Contexto. */
import { useState, type ReactNode } from "react";
import { Botao } from "./ui/Botao";
import { Dica } from "./ui/Dica";
import { Painel } from "./ui/Painel";

interface Props {
  titulo: ReactNode;
  /** Dica do formato ("por linha: ano | texto"). */
  dica: string;
  /** Conteúdo atual já em texto editável. */
  valor: string;
  aoSalvar: (texto: string) => void;
  /** Como o bloco aparece fora da edição. */
  children: ReactNode;
}

export function BlocoEditavel({ titulo, dica, valor, aoSalvar, children }: Props) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState("");

  return (
    <Painel
      titulo={titulo}
      acoes={!editando && (
        <Botao variante="fantasma" tamanho="pequeno" onClick={() => { setTexto(valor); setEditando(true); }}>editar</Botao>
      )}
    >
      {editando ? (
        <>
          <textarea
            className="w-full resize-y rounded-md border border-line-strong bg-field px-3 py-2 text-base text-ink outline-none focus:border-ink"
            autoFocus value={texto}
            rows={Math.max(4, valor.split("\n").length + 2)}
            onChange={(e) => setTexto(e.target.value)} />
          <div className="mt-2 flex items-center gap-2">
            <Dica className="mr-auto">{dica}</Dica>
            <Botao tamanho="pequeno" onClick={() => { aoSalvar(texto); setEditando(false); }}>Salvar</Botao>
            <Botao variante="fantasma" tamanho="pequeno" onClick={() => setEditando(false)}>Cancelar</Botao>
          </div>
        </>
      ) : children}
    </Painel>
  );
}
