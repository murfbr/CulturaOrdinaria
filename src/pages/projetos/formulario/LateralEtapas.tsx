/* Lateral do formulário: as etapas com o percentual preenchido e os
   agrupadores do menu (Salic). A seção interna agora é a aba Geral do projeto. */
import { formularioDe } from "../../../data";
import { mudarSubAba } from "../../../store/navegacao";
import { pctEtapa } from "../../../lib/simulador/motor";
import type { Rascunho } from "../../../types";

interface Props {
  r: Rascunho;
  etapaAberta: number;
  aoMudarEtapa: (ei: number) => void;
}

export function LateralEtapas({ r, etapaAberta, aoMudarEtapa }: Props) {
  const f = formularioDe(r.form);
  if (!f) return null; // o pai (FormularioRascunho) já mostra o aviso

  return (
    <>
      <div className="eyebrow">interno</div>
      <button className="int" onClick={() => mudarSubAba("geral")}>
        <span className="k">◐</span>Geral do projeto
      </button>
      <div className="eyebrow sep">{f.nav === "lateral" ? "menu da proposta" : "etapas"}</div>
      {f.etapas.map((e, k) => (
        <span key={e.id}>
          {e.grupo && (k === 0 || f.etapas[k - 1].grupo !== e.grupo) && <div className="eyebrow grp">{e.grupo}</div>}
          <button
            className={(etapaAberta === k ? "on " : "") + (e.grupo ? "sub" : "")}
            onClick={() => aoMudarEtapa(k)}>
            <span className="k">{f.nav === "lateral" ? "" : e.cod || k + 1}</span>
            {e.nome}
            <span className="pct">{pctEtapa(r, k)}%</span>
          </button>
        </span>
      ))}
      <div className="obs">{f.obs || ""}</div>
    </>
  );
}
