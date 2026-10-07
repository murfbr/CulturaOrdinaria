/* Guia dobrável de uma importação por tabela: as colunas (obrigatória ou
   não, como preencher) e o modelo para copiar ou baixar. Copiar põe a tabela
   com tabulação, que cola direto no Excel e no Sheets; Baixar dá o .csv. */
import { useState } from "react";
import { copiarComAviso } from "../../../components/Toast";
import { gerarCsv } from "../../../lib/csv";
import { baixarArquivo } from "../../../utils";
import { Botao } from "../ui/Botao";
import { NOTA } from "../ui/classes";
import { LINHA_INTEIRA } from "../ui/Modal";
import { Tabela, Td, Th } from "../ui/Tabela";
import type { LinhaGuia } from "./tabela";

interface Props {
  colunas: LinhaGuia[];
  /** Cabeçalho e linha(s) de exemplo. */
  modelo: string[][];
  /** Nome do .csv baixado. */
  arquivo: string;
  nota?: string;
}

export function GuiaColunas({ colunas, modelo, arquivo, nota }: Props) {
  const [aberto, setAberto] = useState(false);
  const texto = modelo.map((l) => l.join("\t")).join("\n");
  return (
    <div className={LINHA_INTEIRA + " cdf:rounded-[10px] cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie-2 cdf:px-3 cdf:py-2.5"}>
      <button
        type="button" aria-expanded={aberto} onClick={() => setAberto(!aberto)}
        className="cdf:flex cdf:w-full cdf:cursor-pointer cdf:items-center cdf:justify-between cdf:gap-2 cdf:border-0 cdf:bg-transparent cdf:p-0 cdf:text-left cdf:text-sm cdf:font-bold cdf:text-tinta-2"
      >
        <span>Colunas e modelo da planilha</span>
        <span className="cdf:font-normal cdf:text-fraco">{aberto ? "fechar ▴" : "abrir ▾"}</span>
      </button>
      {aberto && (
        <>
          {nota && <p className={NOTA + " cdf:mt-2"}>{nota}</p>}
          <Tabela className="cdf:mt-2 cdf:max-h-[240px] cdf:overflow-y-auto">
            <thead>
              <tr><Th>Coluna</Th><Th>Obrigatória</Th><Th>Como preencher</Th></tr>
            </thead>
            <tbody>
              {colunas.map((c) => (
                <tr key={c.cabecalho}>
                  <Td className="cdf:whitespace-nowrap cdf:font-bold">{c.cabecalho}</Td>
                  <Td>{c.obrigatoria ? "sim" : "não"}</Td>
                  <Td className="cdf:text-sm cdf:text-tinta-2">{c.como}</Td>
                </tr>
              ))}
            </tbody>
          </Tabela>
          <div className="cdf:mt-2.5 cdf:flex cdf:flex-wrap cdf:items-center cdf:gap-2">
            <span className="cdf:text-sm cdf:font-bold cdf:text-tinta-2">Modelo</span>
            <Botao mini onClick={() => void copiarComAviso(texto, "Modelo copiado: cole numa planilha")}>Copiar</Botao>
            <Botao mini onClick={() => baixarArquivo(arquivo, gerarCsv(modelo), "text/csv")}>Baixar .csv</Botao>
          </div>
          <pre className="cdf:m-0 cdf:mt-2 cdf:max-h-[120px] cdf:overflow-auto cdf:rounded-lg cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie cdf:px-3 cdf:py-2 cdf:font-mono cdf:text-xs">{texto}</pre>
        </>
      )}
    </div>
  );
}
