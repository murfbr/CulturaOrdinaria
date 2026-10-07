/* Guia de importação: para a coleção escolhida, a tabela de campos (a mesma
   lista que desenha o modal de edição) e o modelo pronto para copiar ou
   baixar, em JSON (com o envelope do pacote) e em CSV. Só mostra; não grava.
   `BlocoModelo` é o pedaço reaproveitado pelo Importar formulário. */
import { useMemo, useState, type ReactNode } from "react";
import { copiarComAviso } from "../Toast";
import { Botao } from "../ui/Botao";
import { Dica } from "../ui/Dica";
import { Rotulo } from "../ui/Rotulo";
import { Tabela, Td, Th } from "../ui/Tabela";
import { ESTILO_MONO } from "../ui/estilos";
import { baixarArquivo } from "../../utils";
import { camposDe, modeloCsv, modeloJson, type Escolha } from "../../store/modelosImportacao";
import { ROTULO_COLECAO } from "../../types";

/** Um modelo para copiar ou baixar: título, botões e o texto num bloco mono com rolagem. */
export function BlocoModelo({ titulo, texto, arquivo, acoes }: { titulo: string; texto: string; arquivo: string; acoes?: ReactNode }) {
  const extensao = arquivo.slice(arquivo.lastIndexOf("."));
  return (
    <div className="mt-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Rotulo>{titulo}</Rotulo>
        <Botao variante="fantasma" tamanho="pequeno" onClick={() => void copiarComAviso(texto, "Modelo copiado")}>Copiar</Botao>
        <Botao variante="fantasma" tamanho="pequeno"
          onClick={() => baixarArquivo(arquivo, texto, extensao === ".csv" ? "text/csv" : "application/json")}>
          Baixar {extensao}
        </Botao>
        {acoes}
      </div>
      <pre className="m-0 mt-2 max-h-[260px] overflow-auto rounded-md border border-line bg-card px-3 py-2.5 font-mono text-xs leading-relaxed">{texto}</pre>
    </div>
  );
}

export function GuiaImportacao({ escolha }: { escolha: Escolha }) {
  const [aberto, setAberto] = useState(false);
  const json = useMemo(() => (aberto ? modeloJson(escolha) : ""), [escolha, aberto]);
  const campos = escolha === "pacote" ? [] : camposDe(escolha);
  const titulo = escolha === "pacote" ? "do pacote completo" : "de " + ROTULO_COLECAO[escolha];

  return (
    <div className="mb-3 rounded-md border border-line bg-bg px-3.5 py-2.5">
      <button type="button" aria-expanded={aberto} onClick={() => setAberto(!aberto)}
        className="flex w-full cursor-pointer items-center justify-between gap-2 border-0 bg-transparent p-0 text-left text-sm font-semibold text-ink">
        <span>Campos e modelo {titulo}</span>
        <span className="font-normal text-muted">{aberto ? "fechar ▴" : "abrir ▾"}</span>
      </button>

      {aberto && escolha === "pacote" && (
        <Dica emModal className="mt-2">
          O pacote completo é o arquivo do Exportar: <span className={ESTILO_MONO}>central</span>,{" "}
          <span className={ESTILO_MONO}>versao</span> e <span className={ESTILO_MONO}>painel</span> com as nove coleções
          (o backup traz ainda <span className={ESTILO_MONO}>rascunhos</span>, <span className={ESTILO_MONO}>formularios</span> e{" "}
          <span className={ESTILO_MONO}>contexto</span>). O modelo abaixo tem um registro de exemplo por coleção; apague o que
          não for usar. Para ver os campos de uma coleção, escolha ela acima.
        </Dica>
      )}

      {aberto && escolha !== "pacote" && (
        <>
          <Dica emModal className="mt-2">
            Só <span className={ESTILO_MONO}>{campos[1].chave}</span> é preciso; o resto pode ficar vazio ou nem aparecer.
            No JSON os campos vão com estes nomes; no CSV, com os rótulos do formulário.
          </Dica>
          <Tabela simples className="mt-2 max-h-[220px] overflow-y-auto">
            <thead>
              <tr><Th>Campo</Th><Th>No formulário</Th><Th quebra>Como preencher</Th></tr>
            </thead>
            <tbody>
              {campos.map((c) => (
                <tr key={c.chave}>
                  <Td><span className={ESTILO_MONO}>{c.chave}</span></Td>
                  <Td className="text-muted">{c.rotulo}</Td>
                  <Td className="text-muted">{c.como}</Td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        </>
      )}

      {aberto && (
        <BlocoModelo titulo="Modelo JSON" texto={json} arquivo={`modelo-${escolha}.json`}
          acoes={escolha !== "pacote" && (
            <Botao variante="fantasma" tamanho="pequeno"
              onClick={() => baixarArquivo(`modelo-${escolha}.csv`, modeloCsv(escolha), "text/csv")}>
              Baixar .csv
            </Botao>
          )} />
      )}
    </div>
  );
}
