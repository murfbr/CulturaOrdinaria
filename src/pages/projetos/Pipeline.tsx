/* Pipeline: os projetos em aberto num quadro, uma coluna por status. Arraste
   o cartão para outra coluna (soltar sobre um cartão insere antes dele); ◀▶
   segue funcionando para teclado e toque. Os status de fim (concluído, não
   aprovado, desistência) aparecem quando pedidos. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { moverProjeto, soltarProjeto } from "../../store/mutacoes";
import { abrirProjeto } from "../../store/navegacao";
import { usarArrasto } from "../../lib/arrastar";
import { editalDoProjeto, nomeCurto, nomeEquipe, nomesArtistas, prazoCurto } from "../../lib/nomes";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../components/Filtros";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { Marcacao } from "../../components/ui/Campo";
import { CartaoQuadro, Coluna, Quadro } from "../../components/ui/Quadro";
import { STATUS_PROJETO } from "../../types";
import { ModalNovoProjeto } from "./ModalNovoProjeto";

export function Pipeline() {
  const { painel } = usarCentral();
  const [busca, setBusca] = useState("");
  const [resp, setResp] = useState("");
  const [comFim, setComFim] = useState(false);
  const [novo, setNovo] = useState(false);
  const arrasto = usarArrasto<string>(soltarProjeto);

  const termo = busca.trim().toLowerCase();
  const abertos = painel.projetos.filter((p) => !p.arquivado);
  const visiveis = abertos.filter((p) =>
    (!resp || p.respId === resp)
    && (!termo || [p.nome, nomesArtistas(p), nomeCurto(editalDoProjeto(p))].join(" ").toLowerCase().includes(termo)));
  const colunas = STATUS_PROJETO.filter((s) => comFim || !s.fim || s.id === "concluido");

  return (
    <>
      <CabecalhoSecao grande titulo="Pipeline"
        sub="Os projetos em aberto por status. Arraste entre as colunas ou use ◀▶. Arquivados ficam fora.">
        <Botao onClick={() => setNovo(true)}>+ Novo projeto</Botao>
      </CabecalhoSecao>

      <BarraFiltros mostrando={visiveis.length} total={abertos.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar projeto, artista ou edital…" />
        <SeletorFiltro valor={resp} aoMudar={setResp} rotuloTodos="qualquer responsável"
          opcoes={painel.equipe.map((p) => ({ valor: p.id, rotulo: p.nome }))} />
        <Marcacao marcado={comFim} aoMudar={setComFim}>mostrar não aprovados e desistências</Marcacao>
      </BarraFiltros>

      <Quadro>
        {colunas.map((s) => {
          const cards = visiveis.filter((p) => p.status === s.id);
          return (
            <Coluna key={s.id} titulo={<Badge tom={s.classe}>{s.rotulo}</Badge>} n={cards.length} alvo={arrasto.alvo === s.id}
              vazia={cards.length ? undefined : arrasto.arrastando ? "solte aqui" : "—"}
              {...arrasto.propsColuna(s.id)}>
              {cards.map((p) => {
                const e = editalDoProjeto(p);
                return (
                  <CartaoQuadro key={p.id}
                    arrastando={arrasto.arrastando === p.id}
                    antesDaqui={arrasto.antesDe === p.id && arrasto.arrastando !== p.id}
                    onClick={() => abrirProjeto(p.id)}
                    {...arrasto.propsCartao(p.id, s.id)}>
                    <p className="m-0 mb-1 text-sm font-bold leading-tight">{p.nome}</p>
                    <p className="m-0 mb-2 text-xs text-muted">{nomesArtistas(p)} · {e ? nomeCurto(e) : "Livre"}</p>
                    <div className="flex flex-wrap items-center gap-1.5 text-2xs text-faint">
                      <Avatar iniciais={nomeEquipe(p.respId)[0] || "?"} />
                      {e?.prazo && e.status !== "closed" && <span className="font-semibold text-warn" title={e.prazo}>⏱ {prazoCurto(e)}</span>}
                      {p.valorAprovado && <Badge tom="st-ok">{p.valorAprovado}</Badge>}
                      <span className="ml-auto flex gap-[3px]">
                        <Botao variante="fantasma" tamanho="mini" title="status anterior"
                          onClick={(ev) => { ev.stopPropagation(); moverProjeto(p, -1); }}>◀</Botao>
                        <Botao variante="fantasma" tamanho="mini" title="próximo status"
                          onClick={(ev) => { ev.stopPropagation(); moverProjeto(p, 1); }}>▶</Botao>
                      </span>
                    </div>
                  </CartaoQuadro>
                );
              })}
            </Coluna>
          );
        })}
      </Quadro>

      {novo && <ModalNovoProjeto aoFechar={() => setNovo(false)} />}
    </>
  );
}
