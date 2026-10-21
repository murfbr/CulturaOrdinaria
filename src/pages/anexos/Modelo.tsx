/* Páginas anexo, aba Modelo: a primeira etapa para quem vai montar uma
   página anexo. Não gera nada na hora: explica o processo em três passos,
   entrega as diretrizes (o próprio docs/diretrizes-pagina-anexo.md,
   importado como texto, uma fonte só) e o prompt pronto para colar no Claude.
   O resto acontece no Claude da pessoa e, depois, na skill pagina-propria.
   Até 21/10/2026 era a aba "Páginas Extras" de Gestão, com as diretrizes de
   "página de evento". */
import { useState } from "react";
import diretrizes from "../../../docs/diretrizes-pagina-anexo.md?raw";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { BlocoModelo } from "../../components/ferramentas/GuiaImportacao";
import { copiarComAviso } from "../../components/Toast";
import { Botao } from "../../components/ui/Botao";
import { Dica } from "../../components/ui/Dica";
import { Painel } from "../../components/ui/Painel";
import { baixarArquivo } from "../../utils";

const ARQUIVO = "diretrizes-pagina-anexo.md";

/** A frase que a pessoa cola no chat depois de anexar as diretrizes. */
export const PROMPT = "Anexei as diretrizes de página anexo. Quero montar a minha página. Vou te contando o que preciso e você vai construindo; pergunte só quando não der para seguir sem a resposta.";

const PASSOS: [string, string][] = [
  ["Baixe as diretrizes", "É um arquivo de texto com o roteiro que o Claude vai seguir. Você não precisa ler; só anexar."],
  ["Abra um chat novo no Claude, anexe o arquivo e cole o prompt", "Depois conte o que você quer, do seu jeito, aos poucos: uma seção, depois outra, muda o que não gostou. Cadastre os dados reais na página que ele montar."],
  ["Quando estiver bom, envie para a equipe técnica", "Clique nos dois botões que a página tem, \"Baixar a base em JSON\" e \"Ficha de entrega\", publique a página pelo link de compartilhamento e mande o link, o JSON e a ficha para o Gustavo ou para o Antonio. A página só entra no ar depois dessa verificação."],
];

export function ModeloAnexo() {
  const [verDiretrizes, setVerDiretrizes] = useState(false);

  return (
    <>
      <CabecalhoSecao titulo="Modelo" sub="Monte a página anexo no Claude; a equipe técnica transforma numa página da Central, ligada ao banco. Serve para evento, frente de captação, caderno, circuito: o que precisar de um lugar próprio." />

      <Painel titulo="Como funciona">
        <ol className="m-0 flex list-none flex-col gap-4 p-0">
          {PASSOS.map(([titulo, texto], i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-ink font-mono text-sm">{i + 1}</span>
              <div>
                <div className="font-medium">{titulo}</div>
                <Dica className="mt-1 text-sm">{texto}</Dica>
                {i === 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Botao onClick={() => baixarArquivo(ARQUIVO, diretrizes, "text/markdown")}>Baixar as diretrizes</Botao>
                    <Botao variante="fantasma" tamanho="pequeno" onClick={() => setVerDiretrizes((v) => !v)}>
                      {verDiretrizes ? "Esconder o conteúdo" : "Ver o conteúdo"}
                    </Botao>
                  </div>
                )}
                {i === 1 && (
                  <div className="mt-2">
                    <Botao onClick={() => void copiarComAviso(PROMPT, "Prompt copiado")}>Copiar o prompt</Botao>
                    <pre className="m-0 mt-2 max-w-texto whitespace-pre-wrap rounded-md border border-line bg-card px-3 py-2.5 font-mono text-xs leading-relaxed">{PROMPT}</pre>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Painel>

      {verDiretrizes && (
        <Painel titulo="As diretrizes" sub="o mesmo arquivo que o botão baixa">
          <BlocoModelo titulo={ARQUIVO} texto={diretrizes} arquivo={ARQUIVO} />
        </Painel>
      )}

      <Dica>CPF e CNPJ podem entrar na página. Não coloque RG, dados bancários nem senha de ninguém.</Dica>
    </>
  );
}
