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
  const visiveis = painel.projetos.filter((p) => !p.arquivado
    && (!resp || p.respId === resp)
    && (!termo || [p.nome, nomesArtistas(p), nomeCurto(editalDoProjeto(p))].join(" ").toLowerCase().includes(termo)));
  const colunas = STATUS_PROJETO.filter((s) => comFim || !s.fim || s.id === "concluido");

  return (
    <>
      <div className="shead">
        <div>
          <h2>Pipeline</h2>
          <p className="sub">Os projetos em aberto por status. Arraste entre as colunas ou use ◀▶. Arquivados ficam fora.</p>
        </div>
        <div className="acts">
          <button className="btn primary" onClick={() => setNovo(true)}>+ Novo projeto</button>
        </div>
      </div>

      <div className="filtros-sim">
        <input type="search" value={busca} placeholder="buscar projeto, artista ou edital…" onChange={(e) => setBusca(e.target.value)} />
        <select value={resp} onChange={(e) => setResp(e.target.value)}>
          <option value="">qualquer responsável</option>
          {painel.equipe.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <label className="chk"><input type="checkbox" checked={comFim} onChange={(e) => setComFim(e.target.checked)} /> mostrar não aprovados e desistências</label>
        <span className="n">{visiveis.length} projeto(s)</span>
      </div>

      <div className="kanban">
        {colunas.map((s) => {
          const cards = visiveis.filter((p) => p.status === s.id);
          return (
            <div className={"col" + (arrasto.alvo === s.id ? " col-alvo" : "")} key={s.id} {...arrasto.propsColuna(s.id)}>
              <div className="col-h"><span className={"badge " + s.classe}>{s.rotulo}</span><span className="cnt">{cards.length}</span></div>
              {cards.map((p) => {
                const e = editalDoProjeto(p);
                return (
                  <div key={p.id}
                    className={"kcard"
                      + (arrasto.arrastando === p.id ? " arrastando" : "")
                      + (arrasto.antesDe === p.id && arrasto.arrastando !== p.id ? " antes-daqui" : "")}
                    onClick={() => abrirProjeto(p.id)}
                    {...arrasto.propsCartao(p.id, s.id)}>
                    <p className="edt">{p.nome}</p>
                    <p className="prj">{nomesArtistas(p)} · {e ? nomeCurto(e) : "Livre"}</p>
                    <div className="meta">
                      <span className="dot">{nomeEquipe(p.respId)[0] || "?"}</span>
                      {e?.prazo && e.status !== "closed" && <span className="prazo" title={e.prazo}>⏱ {prazoCurto(e)}</span>}
                      {p.valorAprovado && <span className="badge st-ok">{p.valorAprovado}</span>}
                      <span className="navb">
                        <button title="status anterior" onClick={(ev) => { ev.stopPropagation(); moverProjeto(p, -1); }}>◀</button>
                        <button title="próximo status" onClick={(ev) => { ev.stopPropagation(); moverProjeto(p, 1); }}>▶</button>
                      </span>
                    </div>
                  </div>
                );
              })}
              {!cards.length && <div className="col-vazia">{arrasto.arrastando ? "solte aqui" : "—"}</div>}
            </div>
          );
        })}
      </div>

      {novo && <ModalNovoProjeto aoFechar={() => setNovo(false)} />}
    </>
  );
}
