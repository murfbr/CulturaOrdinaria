/* Entrada de uma importação por tabela: o arquivo (.xlsx ou .csv) ou o texto
   colado do Excel ou do Sheets (com tabulação, vírgula ou ponto e vírgula).
   Devolve as abas lidas para quem chama interpretar; qualquer erro, da
   leitura ou da interpretação, volta como texto por `aoFalhar`. */
import { useState } from "react";
import { decodificarTexto, lerCsv } from "../../../lib/csv";
import { Botao } from "../ui/Botao";
import { AreaTexto, Entrada, Grupo } from "../ui/Campo";
import { NOTA } from "../ui/classes";
import { LINHA_INTEIRA } from "../ui/Modal";
import { lerXlsx, type Aba } from "../tarefas/xlsx";

interface Props {
  /** Recebe as abas e o nome do que foi lido; pode lançar erro com texto para a tela. */
  aoLer: (abas: Aba[], nome: string) => void;
  aoFalhar: (mensagem: string) => void;
}

const mensagem = (e: unknown, padrao: string) => (e instanceof Error && e.message ? e.message : padrao);

export function EntradaTabela({ aoLer, aoFalhar }: Props) {
  const [colado, setColado] = useState("");
  const [lendo, setLendo] = useState(false);

  async function escolher(f: File | undefined) {
    if (!f) return;
    setLendo(true);
    try {
      const buf = await f.arrayBuffer();
      const abas: Aba[] = /\.csv$/i.test(f.name) ? [{ nome: f.name, linhas: lerCsv(decodificarTexto(buf)) }] : await lerXlsx(buf);
      aoLer(abas, f.name);
    } catch (e) {
      aoFalhar(mensagem(e, "Não consegui ler a planilha."));
    } finally {
      setLendo(false);
    }
  }

  function lerColado() {
    try { aoLer([{ nome: "texto colado", linhas: lerCsv(colado) }], "texto colado"); }
    catch (e) { aoFalhar(mensagem(e, "Não consegui ler o texto colado.")); }
  }

  return (
    <>
      <Grupo rotulo="Planilha (.xlsx ou .csv)" className={LINHA_INTEIRA}>
        <Entrada
          type="file" accept=".xlsx,.csv" aria-label="Planilha" className="cdf:cursor-pointer cdf:py-1.5"
          // Limpar antes de abrir faz o navegador avisar mesmo quando se escolhe de novo o mesmo arquivo (já corrigido).
          onClick={(e) => { e.currentTarget.value = ""; }}
          onChange={(e) => { void escolher(e.target.files?.[0]); }}
        />
        {lendo && <p className={NOTA + " cdf:mt-1.5"}>Lendo…</p>}
      </Grupo>
      <Grupo rotulo="ou cole a tabela aqui, copiada do Excel ou do Sheets com a linha de cabeçalho" className={LINHA_INTEIRA}>
        <AreaTexto rows={4} value={colado} onChange={(e) => setColado(e.target.value)} placeholder={"Nome\tTipo\tStatus"} />
        <Botao mini className="cdf:mt-1.5" disabled={!colado.trim()} onClick={lerColado}>Ler o texto colado</Botao>
      </Grupo>
    </>
  );
}
