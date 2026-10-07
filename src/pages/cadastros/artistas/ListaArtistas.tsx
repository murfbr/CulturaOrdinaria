/* Lista de artistas (Cadastros): um cartão por artista (é o portfólio), com
   atalho de edição, busca, filtro por tipo, ordenação e o que ainda está em
   aberto. O cartão abre a ficha; "editar" abre o formulário. */
import { useState } from "react";
import { usarCentral } from "../../../store/central";
import { abrirDetalhe } from "../../../store/navegacao";
import { abrirEdicao, abrirNovo } from "../../../store/edicao";
import { CabecalhoSecao } from "../../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../../components/Filtros";
import { Badge } from "../../../components/ui/Badge";
import { Botao } from "../../../components/ui/Botao";
import { CartaoLista } from "../../../components/ui/CartaoLista";
import { Dado, Dados } from "../../../components/ui/Dados";
import { Grade } from "../../../components/ui/Grade";
import { Vazio } from "../../../components/ui/Vazio";
import { comparar } from "../../../utils";
import type { Artista } from "../../../types";

/** Pendências e perguntas ainda abertas na ficha do artista. */
const abertas = (a: Artista) => (a.det?.pendencias || []).filter((x) => x.status !== "resolvida").length;

export function ListaArtistas() {
  const { painel } = usarCentral();
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [ordem, setOrdem] = useState("");

  const tipos = [...new Set(painel.artistas.map((a) => a.tipo).filter(Boolean))].sort(comparar);
  const artistas = painel.artistas.filter((a) =>
    (!filtroTipo || a.tipo === filtroTipo) &&
    (!busca || [a.nome, a.tipo, a.mun, a.bio, a.liga || "", ...(a.tags || [])].join(" ").toLowerCase().includes(busca.toLowerCase())));
  if (ordem === "nome") artistas.sort((a, b) => comparar(a.nome, b.nome));
  if (ordem === "recentes") artistas.sort((a, b) => (b.atualizado || "").localeCompare(a.atualizado || ""));

  return (
    <>
      <CabecalhoSecao titulo="Artistas" sub="clique numa ficha pra abrir o ambiente completo">
        <Botao onClick={() => abrirNovo("artista")}>+ Novo artista</Botao>
      </CabecalhoSecao>

      <BarraFiltros mostrando={artistas.length} total={painel.artistas.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar nome, cidade, tag…" />
        <SeletorFiltro valor={filtroTipo} aoMudar={setFiltroTipo} rotuloTodos="todos os tipos" opcoes={tipos} />
        <SeletorFiltro valor={ordem} aoMudar={setOrdem} rotuloTodos="ordem do quadro"
          opcoes={[{ valor: "nome", rotulo: "nome A→Z" }, { valor: "recentes", rotulo: "editados por último" }]} />
      </BarraFiltros>

      {artistas.length ? (
        <Grade colunas="auto">
          {artistas.map((a) => {
            const projetos = painel.projetos.filter((p) => p.artistaIds.includes(a.id) && !p.arquivado).length;
            return (
              <CartaoLista
                key={a.id}
                aoAbrir={() => abrirDetalhe("artista", a.id)}
                aoEditar={() => abrirEdicao("artista", a.id)}
                etiquetas={a.tipo && <Badge tom="tipo">{a.tipo}</Badge>}
                titulo={a.nome}
                sub={a.bio}
                rodape={
                  <>
                    {projetos} projeto(s)
                    {abertas(a) > 0 && <Badge tom="st-prev" title="pendências e perguntas em aberto">{abertas(a)} em aberto</Badge>}
                  </>
                }
              >
                <Dados compacto>
                  <Dado compacto rotulo="Formalização">{a.formalizacao || a.enq || "—"}</Dado>
                  {a.liga && <Dado compacto rotulo="Liga">{a.liga}</Dado>}
                  <Dado compacto rotulo="Sede">{a.mun}</Dado>
                </Dados>
              </CartaoLista>
            );
          })}
        </Grade>
      ) : (
        <Vazio>Nenhum artista com esses filtros.</Vazio>
      )}
    </>
  );
}
