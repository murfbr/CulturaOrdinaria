/* Núcleo do Coletivo, aba Anotações e ideias: a lista de anotações do Núcleo
   (texto, quem, quando), da mais recente para a mais antiga; anotar, editar
   e apagar com confirmação. Só quem tem o módulo Núcleo chega aqui, e o
   banco só entrega a coleção `nucleo` a quem tem. */
import { useEffect, useState } from "react";
import { anotar, apagarAnotacao, editarAnotacao, iniciarNucleo, usarNucleo } from "../../store/nucleo";
import { usarCentral } from "../../store/central";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { toast } from "../../components/Toast";
import { Botao } from "../../components/ui/Botao";
import { AreaTexto } from "../../components/ui/Campo";
import { Dica } from "../../components/ui/Dica";
import { Painel } from "../../components/ui/Painel";
import { Vazio } from "../../components/ui/Vazio";
import { relativo } from "../../utils";

export function AnotacoesNucleo() {
  useEffect(() => { iniciarNucleo(); }, []);
  const { anotacoes } = usarNucleo();
  const { painel } = usarCentral();
  const [texto, setTexto] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [textoEdicao, setTextoEdicao] = useState("");
  const [confirmando, setConfirmando] = useState<string | null>(null);

  /** Nome de quem anotou: o da Equipe pelo e-mail do cadastro, senão o e-mail. */
  const nome = (email: string) =>
    painel.equipe.find((p) => (p.email || "").trim().toLowerCase() === email.toLowerCase())?.nome || email || "modo local";

  function salvarNova() {
    const t = texto.trim();
    if (!t) return;
    anotar(t);
    setTexto("");
    toast("Anotado");
  }

  return (
    <>
      <CabecalhoSecao titulo="Anotações e ideias" sub="o caderno do Núcleo: o que vale guardar entre uma conversa e outra" />

      <Painel titulo="Nova anotação">
        <AreaTexto rows={3} value={texto} placeholder="Uma ideia, um problema, algo que incomoda…" onChange={(e) => setTexto(e.target.value)} />
        <div className="mt-2 flex justify-end">
          <Botao onClick={salvarNova}>Anotar</Botao>
        </div>
      </Painel>

      {!anotacoes.length && <Vazio>Nenhuma anotação ainda.</Vazio>}

      {anotacoes.map((a) => (
        <Painel key={a.id} sub={nome(a.quem) + " · " + relativo(a.criadoEm) + (a.editadoEm ? " · editada " + relativo(a.editadoEm) : "")}
          titulo=""
          acoes={editando === a.id ? undefined : (
            <>
              <Botao variante="quieto" tamanho="mini" onClick={() => { setEditando(a.id); setTextoEdicao(a.texto); setConfirmando(null); }}>editar</Botao>
              <Botao variante={confirmando === a.id ? "perigo" : "quieto"} tamanho="mini"
                onClick={() => { if (confirmando !== a.id) { setConfirmando(a.id); return; } apagarAnotacao(a.id); setConfirmando(null); toast("Anotação apagada"); }}>
                {confirmando === a.id ? "confirmar apagar" : "apagar"}
              </Botao>
            </>
          )}>
          {editando === a.id ? (
            <>
              <AreaTexto rows={3} value={textoEdicao} onChange={(e) => setTextoEdicao(e.target.value)} autoFocus />
              <div className="mt-2 flex justify-end gap-2">
                <Botao variante="fantasma" tamanho="pequeno" onClick={() => setEditando(null)}>Cancelar</Botao>
                <Botao tamanho="pequeno" onClick={() => { const t = textoEdicao.trim(); if (t && t !== a.texto) editarAnotacao(a, t); setEditando(null); }}>Salvar</Botao>
              </div>
            </>
          ) : (
            <p className="m-0 whitespace-pre-wrap text-lg">{a.texto}</p>
          )}
        </Painel>
      ))}

      <Dica>Nada daqui passa pela lixeira, pelo Exportar, pela busca nem pela cópia local do navegador: apagar é de vez.</Dica>
    </>
  );
}
