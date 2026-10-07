/* Ficha completa do artista (Cadastros), com o acervo `det` editável:
   Geral (pendências e perguntas em aberto, correções propostas, dados gerais),
   Portfólio cultural, Documentos, Marca (manual, fotos e links juntos),
   Contexto (a ficha de escrita, a mesma do ambiente Contexto), Projetos e
   Histórico. Este arquivo é a casca: o cabeçalho com as sub-abas, a função
   que altera o acervo e os modais; o corpo de cada sub-aba está no arquivo
   irmão FichaArtista<Aba>.tsx. */
import { useState } from "react";
import { usarCentral } from "../../../store/central";
import { porId, salvarRegistro } from "../../../store/mutacoes";
import { fecharDetalhe, mudarSubAba } from "../../../store/navegacao";
import { abrirEdicao } from "../../../store/edicao";
import { Historico } from "../../../components/Historico";
import { Badge } from "../../../components/ui/Badge";
import { Botao } from "../../../components/ui/Botao";
import { CabecalhoFicha } from "../../../components/ui/CabecalhoFicha";
import { PainelFicha } from "../../contexto/Fichas";
import { ModalRegra, type PedidoModalRegra } from "../../contexto/ModalRegra";
import { ModalNovoProjeto } from "../../projetos/ModalNovoProjeto";
import type { DetalheArtista } from "../../../types";
import { clonar } from "../../../utils";
import { FichaArtistaDocumentos } from "./FichaArtistaDocumentos";
import { FichaArtistaGeral, type NovaPendencia } from "./FichaArtistaGeral";
import { FichaArtistaMarca } from "./FichaArtistaMarca";
import { FichaArtistaPortfolio } from "./FichaArtistaPortfolio";
import { FichaArtistaProjetos } from "./FichaArtistaProjetos";

const SUB_ABAS: [string, string][] = [
  ["geral", "Geral"], ["portfolio", "Portfólio cultural"], ["docs", "Documentos"],
  ["marca", "Marca"], ["contexto", "Contexto"], ["projetos", "Projetos"], ["historico", "Histórico"],
];

export function FichaArtista({ id, sub }: { id: string; sub: string }) {
  const { painel } = usarCentral();
  const a = porId("artistas", id)!;
  const d: DetalheArtista = a.det || {};
  // O que está sendo digitado nos "adicionar" fica aqui para não se perder ao trocar de sub-aba.
  const [novoDoc, setNovoDoc] = useState("");
  const [novaPend, setNovaPend] = useState<NovaPendencia>({ texto: "", tipo: "pendencia" });
  const [verResolvidas, setVerResolvidas] = useState(false);
  const [modalRegra, setModalRegra] = useState<PedidoModalRegra | null>(null);
  const [novoProjeto, setNovoProjeto] = useState(false);
  const aba = SUB_ABAS.some(([k]) => k === sub) ? sub : sub === "fotos" || sub === "links" ? "marca" : "geral";

  /** Toda edição do acervo passa por aqui: clona o artista, mexe no det, salva. */
  function alterarDet(mudar: (det: DetalheArtista) => void, rapido = true) {
    const copia = clonar(a);
    copia.det = copia.det || {};
    mudar(copia.det);
    salvarRegistro("artistas", copia, rapido);
  }

  const projetos = painel.projetos.filter((p) => p.artistaIds.includes(a.id));
  const nAbertas = (d.pendencias || []).filter((x) => x.status !== "resolvida").length;
  const acervo = { a, d, alterarDet };

  let corpo;
  if (aba === "geral") {
    corpo = <FichaArtistaGeral {...acervo} novaPend={novaPend} setNovaPend={setNovaPend} verResolvidas={verResolvidas} setVerResolvidas={setVerResolvidas} />;
  } else if (aba === "portfolio") {
    corpo = <FichaArtistaPortfolio {...acervo} />;
  } else if (aba === "docs") {
    corpo = <FichaArtistaDocumentos {...acervo} novoDoc={novoDoc} setNovoDoc={setNovoDoc} />;
  } else if (aba === "marca") {
    corpo = <FichaArtistaMarca {...acervo} />;
  } else if (aba === "contexto") {
    corpo = <PainelFicha id={a.id} aoAbrirRegra={setModalRegra} semCabecalho />;
  } else if (aba === "projetos") {
    corpo = <FichaArtistaProjetos nome={a.nome} projetos={projetos} aoNovoProjeto={() => setNovoProjeto(true)} />;
  } else if (aba === "historico") {
    corpo = <Historico ids={[a.id]} />;
  }

  return (
    <>
      <CabecalhoFicha
        rotuloVoltar="Voltar para Artistas"
        aoVoltar={fecharDetalhe}
        avatar={a.nome[0]}
        titulo={a.nome}
        sub={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <Badge tom="tipo">{a.tipo}</Badge>
            <span>· {a.formalizacao || a.enq || "formalização a registrar"}{a.liga ? " · " + a.liga : ""} · {a.mun}</span>
          </span>
        }
        acoes={<Botao variante="fantasma" tamanho="pequeno" onClick={() => abrirEdicao("artista", a.id)}>Editar</Botao>}
        abas={SUB_ABAS.map(([id, rotulo]) => ({
          id, rotulo, n: id === "geral" ? nAbertas : id === "projetos" ? projetos.length : undefined,
        }))}
        abaAtiva={aba}
        aoTrocarAba={mudarSubAba}
      />
      {corpo}
      {modalRegra && <ModalRegra pedido={modalRegra} aoFechar={() => setModalRegra(null)} />}
      {novoProjeto && <ModalNovoProjeto artistaId={a.id} aoFechar={() => setNovoProjeto(false)} />}
    </>
  );
}
