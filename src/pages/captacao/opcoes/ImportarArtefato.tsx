/* "Trazer do artefato (JSON)": lê o arquivo que o botão "Baixar a base em JSON"
   do artefato gera, mostra a conferência (contagens e avisos) e grava nas
   cinco coleções e no preset. Mesmo id grava por cima: repetir não duplica. */
import { useState } from "react";
import { Banco } from "../../../services/banco";
import { presetCaptacao } from "../../../store/central";
import { salvarRegistro } from "../../../store/mutacoes";
import { toast } from "../../../components/Toast";
import { Botao } from "../../../components/ui/Botao";
import { AreaTexto } from "../../../components/ui/Campo";
import { Dica } from "../../../components/ui/Dica";
import { Painel } from "../../../components/ui/Painel";
import { converterArtefato, type Convertido } from "./converterArtefato";

export function ImportarArtefato() {
  const [texto, setTexto] = useState("");
  const [conferencia, setConferencia] = useState<Convertido | null>(null);
  const [erro, setErro] = useState("");

  function lerArquivo(arquivo?: File) {
    if (!arquivo) return;
    arquivo.text().then((t) => { setTexto(t); setConferencia(null); setErro(""); });
  }

  function conferir() {
    try {
      setConferencia(converterArtefato(JSON.parse(texto)));
      setErro("");
    } catch {
      setConferencia(null);
      setErro("Não deu para ler: o texto não é um JSON válido.");
    }
  }

  function gravar() {
    if (!conferencia) return;
    const c = conferencia;
    Banco.gravar("presets", "captacao", { ...presetCaptacao(), id: "captacao", listas: c.listas }, true);
    let n = 0;
    c.empresas.forEach((r) => { if (salvarRegistro("empresas", r)) n++; });
    c.captadoras.forEach((r) => { if (salvarRegistro("captadoras", r)) n++; });
    c.portfolio.forEach((r) => { if (salvarRegistro("portfolio", r)) n++; });
    c.cotas.forEach((r) => { if (salvarRegistro("cotas", r)) n++; });
    c.negociacoes.forEach((r) => { if (salvarRegistro("negociacoes", r)) n++; });
    toast(n + " registro(s) gravado(s) e as listas atualizadas");
    setTexto(""); setConferencia(null);
  }

  return (
    <Painel titulo="Trazer do artefato (JSON)" sub="o arquivo que o botão “Baixar a base em JSON” do artefato gera">
      <div className="flex flex-col gap-2">
        <input type="file" accept=".json,application/json" className="text-sm" onChange={(e) => lerArquivo(e.target.files?.[0])} />
        <AreaTexto rows={3} value={texto} placeholder="…ou cole o JSON aqui" onChange={(e) => { setTexto(e.target.value); setConferencia(null); }} />
        {erro && <Dica emModal className="text-no">{erro}</Dica>}
        {conferencia && (
          <div className="rounded-md border border-line bg-bg-sunk p-3 text-sm">
            <b>No arquivo:</b> {conferencia.empresas.length} empresas, {conferencia.captadoras.length} captadoras, {conferencia.portfolio.length} projetos,{" "}
            {conferencia.cotas.length} cotas, {conferencia.negociacoes.length} negociações.
            {conferencia.avisos.map((a) => <div key={a} className="mt-1 text-warn">{a}</div>)}
            <Dica className="mt-2">Registros com o mesmo id são gravados por cima; as quatro listas de escolha passam a ser as do arquivo.</Dica>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Botao variante="fantasma" onClick={conferir} disabled={!texto.trim()}>Conferir</Botao>
          <Botao onClick={gravar} disabled={!conferencia}>Gravar na Central</Botao>
        </div>
      </div>
    </Painel>
  );
}
