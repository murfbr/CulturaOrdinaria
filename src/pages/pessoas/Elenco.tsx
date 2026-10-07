/* Elenco / colaboradores: tabela de músicos e técnicos que entram nos editais —
   busca, filtros por função e documentos, colunas ordenáveis. A linha inteira
   abre a edição; o botão "editar" da última coluna faz o mesmo. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import {
  BarraFiltros, CampoBusca, SeletorFiltro, ThOrdenavel, ordenarLinhas, type OrdemTabela,
} from "../../components/Filtros";
import { Botao } from "../../components/ui/Botao";
import { Badge } from "../../components/ui/Badge";
import { Tabela, Th, Td, Tr } from "../../components/ui/Tabela";
import { Vazio } from "../../components/ui/Vazio";
import { ESTILO_APAGADO } from "../../components/ui/estilos";
import { comparar } from "../../utils";

export function Elenco() {
  const { painel } = usarCentral();
  const [busca, setBusca] = useState("");
  const [filtroFuncao, setFiltroFuncao] = useState("");
  const [filtroDocs, setFiltroDocs] = useState("");
  const [ordem, setOrdem] = useState<OrdemTabela>({ campo: "", desc: false });

  const funcoes = [...new Set(painel.elenco.map((p) => p.funcao).filter(Boolean))].sort(comparar);
  const elenco = ordenarLinhas(
    painel.elenco.filter((p) =>
      (!filtroFuncao || p.funcao === filtroFuncao) &&
      (!filtroDocs || p.docsStatus === filtroDocs) &&
      (!busca || [p.nome, p.nomeCompleto || "", p.funcao, p.bio, p.email || ""].join(" ").toLowerCase().includes(busca.toLowerCase()))),
    ordem);

  return (
    <>
      <CabecalhoSecao titulo="Elenco / Colaboradores" sub="músicos e técnicos que entram nos editais — bio e documentos">
        <Botao onClick={() => abrirNovo("elenco")}>+ Colaborador</Botao>
      </CabecalhoSecao>

      <BarraFiltros mostrando={elenco.length} total={painel.elenco.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar nome, função, bio…" />
        <SeletorFiltro valor={filtroFuncao} aoMudar={setFiltroFuncao} rotuloTodos="todas as funções" opcoes={funcoes} />
        <SeletorFiltro valor={filtroDocs} aoMudar={setFiltroDocs} rotuloTodos="docs: tanto faz"
          opcoes={[{ valor: "ok", rotulo: "docs ok" }, { valor: "pend", rotulo: "docs pendentes" }]} />
      </BarraFiltros>

      <Tabela>
        <thead>
          <tr>
            <ThOrdenavel campo="nome" ordem={ordem} aoOrdenar={setOrdem}>Nome</ThOrdenavel>
            <ThOrdenavel campo="funcao" ordem={ordem} aoOrdenar={setOrdem}>Função</ThOrdenavel>
            <Th>Minibiografia</Th>
            <ThOrdenavel campo="docsStatus" ordem={ordem} aoOrdenar={setOrdem}>Documentos</ThOrdenavel>
            <Th />
          </tr>
        </thead>
        <tbody>
          {elenco.map((p) => (
            <Tr key={p.id} aoClicar={() => abrirEdicao("elenco", p.id)}>
              <Td>
                <b>{p.nome}</b>
                {p.nomeCompleto && <div className={ESTILO_APAGADO}>{p.nomeCompleto}</div>}
                {p.email && <div className={ESTILO_APAGADO}>✉ {p.email}</div>}
              </Td>
              <Td>{p.funcao}</Td>
              <Td className="text-muted">{p.bio}</Td>
              <Td>
                <Badge tom={p.docsStatus === "ok" ? "ok" : "aviso"}>
                  {p.docsStatus === "ok" ? "docs ok" : "docs pend."}
                </Badge>
              </Td>
              <Td className="text-right">
                <Botao variante="quieto" tamanho="mini" onClick={(e) => { e.stopPropagation(); abrirEdicao("elenco", p.id); }}>editar</Botao>
              </Td>
            </Tr>
          ))}
          {!elenco.length && <tr><Td colSpan={5}><Vazio emLinha>Ninguém com esses filtros.</Vazio></Td></tr>}
        </tbody>
      </Tabela>
    </>
  );
}
