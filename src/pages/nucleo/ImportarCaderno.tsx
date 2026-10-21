/* Trazer para o caderno o que já estava no artefato: o JSON exportado por
   ele (ou por esta própria aba), por arquivo ou colado. Opcional: a aba já
   funciona sem isso. Registro com o mesmo id é regravado; o plano da semana
   do piloto fica de fora. Abre pelo botão do cabeçalho. */
import { useState } from "react";
import { importarCaderno } from "../../store/nucleo";
import { toast } from "../../components/Toast";
import { Botao } from "../../components/ui/Botao";
import { AreaTexto } from "../../components/ui/Campo";
import { Dica } from "../../components/ui/Dica";
import { Painel } from "../../components/ui/Painel";

export function ImportarCaderno({ aoTerminar }: { aoTerminar: () => void }) {
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");

  function lerArquivo(arquivo: File | undefined) {
    if (!arquivo) return;
    arquivo.text().then((t) => { setTexto(t); setErro(""); }).catch(() => setErro("Não deu para ler o arquivo."));
  }

  function importar() {
    try {
      const n = importarCaderno(JSON.parse(texto));
      toast("Caderno importado: " + n.notas + " anotações, " + n.tarefas + " tarefas");
      setTexto("");
      setErro("");
      aoTerminar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "O texto não é um JSON válido.");
    }
  }

  return (
    <Painel titulo="Trazer do artefato (JSON)" sub="o arquivo que o botão 'Baixar a base em JSON' do artefato gera (ou o que esta aba baixa); registro com o mesmo id é regravado, os outros ficam">
      <div className="flex flex-col gap-2">
        <input type="file" accept=".json,application/json" className="text-sm" onChange={(e) => lerArquivo(e.target.files?.[0])} />
        <AreaTexto rows={4} value={texto} placeholder="…ou cole o JSON aqui" onChange={(e) => setTexto(e.target.value)} />
        {erro && <Dica className="text-accent">{erro}</Dica>}
        <div className="flex justify-end gap-2">
          <Botao variante="fantasma" onClick={aoTerminar}>Cancelar</Botao>
          <Botao onClick={importar} disabled={!texto.trim()}>Importar</Botao>
        </div>
      </div>
      <Dica className="mt-2">O plano da semana e as semanas do piloto não entram (a Agenda já tem a programação semanal). Nada vai para as Tarefas da Central: o caderno é backlog de melhoria.</Dica>
    </Painel>
  );
}
