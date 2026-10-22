/* Aba Design do núcleo de comunicação: as peças em produção (lista editável,
   guardada na configuração da página, no molde dos canais), os arquivos de
   identidade e apresentações (cartões de arquivo) e as regras de uso da
   identidade. As tarefas e o orçamento ficam nas abas Tarefas e Orçamento. */
import { useState } from "react";
import { dataBr, hojeIso, nomeCadastro } from "../calculo";
import { classeStatus } from "../listas";
import { STATUS_PECA, type ArquivoBase, type Base, type Nucleo, type Peca } from "../tipos";
import { Botao } from "../ui/Botao";
import { SECAO, TEXTO_LONGO } from "../ui/classes";
import { Segmentado } from "../ui/Segmentado";
import { Tabela, Td, Th } from "../ui/Tabela";
import { Pilula } from "../ui/Tag";
import type { IrPara } from "../vista";
import { ModalPeca } from "./ModalPeca";

interface Props { base: Base; nucleo: Nucleo; irPara: IrPara }

const ehPeca = (a: ArquivoBase) => a.secao === "apresentacao" || /identidade|marca|manual|logo|design|pe[çc]a/i.test(a.nome + " " + a.descricao);
const curto = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "").slice(0, 40);
const FEITA = (p: Peca) => p.status === "pronta" || p.status === "publicada";
const porPrazo = (a: Peca, b: Peca) => String(a.prazo || "9999").localeCompare(String(b.prazo || "9999")) || a.ordem - b.ordem;

export function AbaDesign({ base, irPara }: Props) {
  const p = base.pagina;
  const [modal, setModal] = useState<{ id: string | null } | null>(null);
  const [so, setSo] = useState<"abertas" | "todas">("abertas");
  const pecas = [...(p.pecas || [])].sort(porPrazo);
  const abertas = pecas.filter((x) => !FEITA(x));
  const visiveis = so === "abertas" ? abertas : pecas;
  const hoje = hojeIso();
  const canal = (id: string | null) => (id && (p.canais || []).find((c) => c.id === id)?.nome) || null;
  const arquivos = Object.values(base.arquivos).filter(ehPeca).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

  return (
    <>
      <h2 className={SECAO}>Peças em produção<Botao mini variante="primario" className="cdf:ml-auto cdf:font-sans" onClick={() => setModal({ id: null })}>Nova peça</Botao></h2>
      <p className="cdf:m-0 cdf:mb-2.5 cdf:text-sm cdf:text-fraco">
        {pecas.length ? abertas.length + " em aberto de " + pecas.length + ". " : ""}Cada peça com o canal por onde sai, quem faz, prazo, status e o link do arquivo.
      </p>
      {pecas.length > 0 && <div className="cdf:mb-2.5"><Segmentado valor={so} aoMudar={setSo} opcoes={[["abertas", "Em aberto"], ["todas", "Todas"]]} rotulo="Quais peças" /></div>}
      {!pecas.length ? (
        <p className="cdf:m-0 cdf:text-sm cdf:text-fraco">Nenhuma peça ainda. As primeiras do plano: anúncio do line-up (COM-003), kit da chamada aberta (COM-004), release e mailing (COM-007), guia de serviço (COM-008), kit interestadual e multilíngue (COM-017 e COM-018).</p>
      ) : !visiveis.length ? <p className="cdf:m-0 cdf:text-sm cdf:text-fraco">Tudo pronto ou publicado.</p> : (
        <Tabela>
          <thead><tr><Th>Peça</Th><Th>Canal</Th><Th>Quem faz</Th><Th>Prazo</Th><Th>Status</Th><Th>Arquivo</Th><Th><span className="cdf:sr-only">Ações</span></Th></tr></thead>
          <tbody>
            {visiveis.map((x) => {
              const atrasada = !!x.prazo && x.prazo < hoje && !FEITA(x);
              return (
                <tr key={x.id}>
                  <Td><strong>{x.nome}</strong>{x.anotacoes && <span className="cdf:block cdf:max-w-[40ch] cdf:whitespace-pre-line cdf:text-[13px] cdf:text-fraco">{x.anotacoes}</span>}</Td>
                  <Td>{canal(x.canal) || <span className="cdf:text-fraco">—</span>}</Td>
                  <Td>{x.responsavel ? nomeCadastro(base, x.responsavel) : <span className="cdf:text-fraco">—</span>}</Td>
                  <Td className={atrasada ? "cdf:whitespace-nowrap cdf:font-bold cdf:text-erro" : "cdf:whitespace-nowrap"}>{x.prazo ? dataBr(x.prazo) : "—"}{atrasada && " (venceu)"}</Td>
                  <Td><Pilula classe={classeStatus(x.status)}>{STATUS_PECA.find(([id]) => id === x.status)?.[1] || x.status}</Pilula></Td>
                  <Td>{x.url ? <a href={x.url} target="_blank" rel="noopener" className="cdf:text-link">{curto(x.url)}</a> : <span className="cdf:text-fraco">—</span>}</Td>
                  <Td className="cdf:w-[1%] cdf:whitespace-nowrap cdf:text-right"><Botao mini aria-label={"Editar " + x.nome} onClick={() => setModal({ id: x.id })}>Editar</Botao></Td>
                </tr>
              );
            })}
          </tbody>
        </Tabela>
      )}

      <h2 className={SECAO}>Identidade e apresentações<Botao mini className="cdf:ml-auto cdf:font-sans" onClick={() => irPara("apresentacoes")}>Apresentações</Botao><Botao mini className="cdf:font-sans" onClick={() => irPara("contexto")}>Contexto</Botao></h2>
      <p className="cdf:m-0 cdf:mb-2.5 cdf:text-sm cdf:text-fraco">{arquivos.filter((a) => a.versoes?.length).length} de {arquivos.length} com arquivo guardado. São cartões de arquivo: a versão nova entra pela aba Apresentações ou pelo Contexto.</p>
      {!arquivos.length ? <p className="cdf:m-0 cdf:text-sm cdf:text-fraco">Nenhum cartão de arquivo de design ainda.</p> : (
        <Tabela>
          <thead><tr><Th>Arquivo</Th><Th>Versão atual</Th><Th>Data</Th><Th>Onde</Th></tr></thead>
          <tbody>{arquivos.map((a) => <LinhaArquivo key={a.id} a={a} />)}</tbody>
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

      {modal && <ModalPeca base={base} id={modal.id} aoFechar={() => setModal(null)} />}
    </>
  );
}

function LinhaArquivo({ a }: { a: ArquivoBase }) {
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
