/* Capa da festa: nome (o do projeto), subtítulo, local e modelo de negócio;
   faixa com a próxima edição e o resultado da última fechada; editar os
   dados da festa (o nome se edita no projeto, em Projetos). */
import { N, R, ROTULO_STATUS_EDICAO, br, brCompleta, calcular, diasAte } from "../calculo";
import { alterarPagina } from "../dados";
import { usarModalCampos } from "../ModalCampos";
import { CAMPOS_FESTA } from "./pedidos";
import type { Painel } from "../tipos";

export function Capa({ painel }: { painel: Painel }) {
  const modal = usarModalCampos();
  const festa = painel.pagina;
  const proxima = painel.edicoes.find((e) => e.status !== "fechada");
  const ultima = painel.edicoes.filter((e) => e.status === "fechada").slice(-1)[0];
  const dias = proxima ? diasAte(proxima.data) : null;
  const k = ultima ? calcular(painel, ultima) : null;

  function editar() {
    modal.abrir({
      titulo: "Dados da festa", campos: CAMPOS_FESTA, valores: festa as unknown as Record<string, unknown>,
      aoAplicar: (s) => alterarPagina((p) => { Object.assign(p, s); }),
    });
  }

  return (
    <div className="sdp-hero" id="l-visao">
      <div className="sdp-eyebrow">Festa · {painel.edicoes.length} edições</div>
      <h1>{painel.titulo}</h1>
      <div className="sub">{festa.sub} · <b>{festa.local}</b><br />{festa.modelo}</div>
      <div className="band">
        {proxima && (
          <div className="sdp-cell">
            <div className="k">Próxima edição</div>
            <div className="v">{br(proxima.data) || "—"}</div>
            <div className="foot">
              {proxima.nome} · {dias == null ? "sem data" : dias >= 0 ? `faltam ${dias} dias` : `há ${-dias} dias`} · {ROTULO_STATUS_EDICAO[proxima.status]}
            </div>
          </div>
        )}
        {ultima && k && (
          <>
            <div className="sdp-cell">
              <div className="k">Última fechada</div>
              <div className="v">{ultima.nome.replace("Edição ", "#")}</div>
              <div className="foot">{brCompleta(ultima.data)}</div>
            </div>
            <div className="sdp-cell">
              <div className="k">Receita</div>
              <div className="v">{R(k.receita)}</div>
              <div className="foot">{N(ultima.kpis?.publico)} presentes</div>
            </div>
            <div className="sdp-cell">
              <div className="k">Resultado</div>
              <div className={"v " + (k.resultado < 0 ? "neg" : "pos")}>{R(k.resultado)}</div>
              <div className="foot">{R(k.porSocio)} por sócio</div>
            </div>
          </>
        )}
      </div>
      <div className="sdp-toolbar">
        <button className="sdp-btn ghost small" onClick={editar}>Editar dados da festa</button>
        {painel.projeto && <a className="sdp-btn ghost small" href={"/#/projetos/visao/projeto/" + painel.projeto.id}>Projeto na Central ↗</a>}
      </div>
      {modal.elemento}
    </div>
  );
}
