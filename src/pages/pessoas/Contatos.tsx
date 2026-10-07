/* Contatos externos: patrocinadores, órgãos e responsáveis por editais —
   com busca, filtro por tipo e colunas ordenáveis. A linha inteira abre a
   edição; o botão "editar" da última coluna faz o mesmo. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import {
  BarraFiltros, CampoBusca, SeletorFiltro, ThOrdenavel, ordenarLinhas, type OrdemTabela,
} from "../../components/Filtros";
import { Botao } from "../../components/ui/Botao";
import { Tabela, Th, Td, Tr } from "../../components/ui/Tabela";
import { Vazio } from "../../components/ui/Vazio";
import { comparar } from "../../utils";

export function Contatos() {
  const { painel } = usarCentral();
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [ordem, setOrdem] = useState<OrdemTabela>({ campo: "", desc: false });

  const tipos = [...new Set(painel.contatos.map((c) => c.tipo).filter(Boolean))].sort(comparar);
  const contatos = ordenarLinhas(
    painel.contatos.filter((c) =>
      (!filtroTipo || c.tipo === filtroTipo) &&
      (!busca || [c.nome, c.tipo, c.ref, c.contato].join(" ").toLowerCase().includes(busca.toLowerCase()))),
    ordem);

  return (
    <>
      <CabecalhoSecao titulo="Contatos externos" sub="patrocinadores, órgãos e responsáveis por editais — clique no título da coluna pra ordenar">
        <Botao onClick={() => abrirNovo("contato")}>+ Contato</Botao>
      </CabecalhoSecao>

      <BarraFiltros mostrando={contatos.length} total={painel.contatos.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar nome, referência…" />
        <SeletorFiltro valor={filtroTipo} aoMudar={setFiltroTipo} rotuloTodos="todos os tipos" opcoes={tipos} />
      </BarraFiltros>

      <Tabela>
        <thead>
          <tr>
            <ThOrdenavel campo="nome" ordem={ordem} aoOrdenar={setOrdem}>Nome</ThOrdenavel>
            <ThOrdenavel campo="tipo" ordem={ordem} aoOrdenar={setOrdem}>Tipo</ThOrdenavel>
            <ThOrdenavel campo="ref" ordem={ordem} aoOrdenar={setOrdem}>Referência</ThOrdenavel>
            <ThOrdenavel campo="contato" ordem={ordem} aoOrdenar={setOrdem}>Contato</ThOrdenavel>
            <Th />
          </tr>
        </thead>
        <tbody>
          {contatos.map((c) => (
            <Tr key={c.id} aoClicar={() => abrirEdicao("contato", c.id)}>
              <Td><b>{c.nome}</b></Td>
              <Td>{c.tipo}</Td>
              <Td>{c.ref}</Td>
              <Td className="text-muted">{c.contato}</Td>
              <Td className="text-right">
                <Botao variante="quieto" tamanho="mini" onClick={(e) => { e.stopPropagation(); abrirEdicao("contato", c.id); }}>editar</Botao>
              </Td>
            </Tr>
          ))}
          {!contatos.length && <tr><Td colSpan={5}><Vazio emLinha>Nenhum contato com esses filtros.</Vazio></Td></tr>}
        </tbody>
      </Tabela>
    </>
  );
}
