/* Aba Design do núcleo de comunicação: a identidade visual e as peças
   (os cartões de arquivo das apresentações e os do contexto que falam de
   identidade, marca ou manual), as regras de uso que já se conhecem e, no
   fim, as tarefas e o orçamento desta frente. */
import { dataBr } from "../calculo";
import type { ArquivoBase, Base, Nucleo } from "../tipos";
import { Botao } from "../ui/Botao";
import { SECAO, TEXTO_LONGO } from "../ui/classes";
import { Resumo } from "../ui/Resumo";
import { Tabela, Td, Th } from "../ui/Tabela";
import type { AbaNucleo, IrPara } from "../vista";
import { BlocoFrente } from "./BlocoFrente";

interface Props { base: Base; nucleo: Nucleo; irPara: IrPara; abrirAba: (a: AbaNucleo) => void }

const ehPeca = (a: ArquivoBase) => a.secao === "apresentacao" || /identidade|marca|manual|logo|design|pe[çc]a/i.test(a.nome + " " + a.descricao);

export function AbaDesign({ base, nucleo, irPara, abrirAba }: Props) {
  const pecas = Object.values(base.arquivos).filter(ehPeca).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  const guardadas = pecas.filter((a) => a.versoes?.length);
  const identidade = pecas.find((a) => /identidade/i.test(a.nome));

  return (
    <>
      <Resumo
        itens={[
          { titulo: "Peças guardadas", valor: guardadas.length + " de " + pecas.length, sub: "apresentações e identidade visual" },
          { titulo: "Identidade visual", valor: identidade?.versoes?.length ? identidade.versoes[identidade.versoes.length - 1].versao : "—", sub: identidade?.versoes?.length ? "versão atual, de " + dataBr(identidade.versoes[identidade.versoes.length - 1].data) : "ainda sem arquivo guardado", classeValor: identidade?.versoes?.length ? undefined : "cdf:text-conversa" },
        ]}
      />

      <h2 className={SECAO}>Peças e identidade<Botao mini className="cdf:ml-auto cdf:font-sans" onClick={() => irPara("apresentacoes")}>Apresentações</Botao><Botao mini className="cdf:font-sans" onClick={() => irPara("contexto")}>Contexto</Botao></h2>
      {!pecas.length ? <p className="cdf:m-0 cdf:text-sm cdf:text-fraco">Nenhum cartão de arquivo de design ainda.</p> : (
        <Tabela>
          <thead><tr><Th>Peça</Th><Th>Versão atual</Th><Th>Data</Th><Th>Onde</Th></tr></thead>
          <tbody>{pecas.map((a) => <LinhaPeca key={a.id} a={a} />)}</tbody>
        </Tabela>
      )}

      <h2 className={SECAO}>Regras de uso</h2>
      <div className={TEXTO_LONGO + " cdf:max-w-[820px]"}>
        <p className="cdf:m-0 cdf:mb-2">O que se sabe da identidade, feita pela Ana Colier, até ter o manual completo:</p>
        <ul className="cdf:m-0 cdf:list-disc cdf:pl-5">
          <li><strong>Marca e assinatura.</strong> Logo em PNG ou SVG com fundo transparente e os hex oficiais: pedidos ao Lucas e à Ana (tarefa do núcleo). Até lá, as apresentações usam a marca tipográfica provisória.</li>
          <li><strong>Fontes.</strong> Confirmar se a fonte de títulos é Better Faster ou Londrina Solid; Garet ainda sem arquivos (WOFF2).</li>
          <li><strong>Fotos.</strong> As imagens da pesquisa de identidade precisam de crédito; na 1ª edição, fotos e artes saem dessa pesquisa.</li>
          <li><strong>Aplicações.</strong> O kit oficial de identidade e aplicações é a tarefa COM-002; a narrativa Ouvir · Dançar · Aprender · Conhecer organiza as peças (COM-016).</li>
        </ul>
        <p className="cdf:m-0 cdf:mt-2">O manual, quando existir, entra como versão do cartão "Identidade visual" no Contexto, com as regras resumidas na descrição.</p>
      </div>

      <BlocoFrente base={base} nucleo={nucleo} frente="design" abrirAba={abrirAba} />
    </>
  );
}

function LinhaPeca({ a }: { a: ArquivoBase }) {
  const versoes = a.versoes || [];
  const atual = versoes[versoes.length - 1];
  return (
    <tr>
      <Td><strong>{a.nome}</strong>{a.descricao && <span className="cdf:block cdf:text-[13px] cdf:text-fraco">{a.descricao}</span>}</Td>
      <Td>{atual ? <a href={atual.arquivo.url} target="_blank" rel="noopener" className="cdf:font-bold cdf:text-link">{atual.versao}</a> : <span className="cdf:text-rec">faltante</span>}</Td>
      <Td>{atual ? dataBr(atual.data) : "—"}</Td>
      <Td>{a.secao === "apresentacao" ? "Apresentações" : "Contexto"}</Td>
    </tr>
  );
}
