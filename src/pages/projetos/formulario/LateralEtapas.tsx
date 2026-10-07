/* Lateral do formulário: painel preso ao rolar com as etapas, o percentual
   preenchido de cada uma e os agrupadores do menu (Salic). No modo "stepper"
   cada etapa tem um traço à esquerda, laranja na etapa aberta. A seção
   interna agora é a aba Geral do projeto. */
import { Fragment, type ReactNode } from "react";
import { formularioDe } from "../../../data";
import { mudarSubAba } from "../../../store/navegacao";
import { pctEtapa } from "../../../lib/simulador/motor";
import { Painel } from "../../../components/ui/Painel";
import { Rotulo } from "../../../components/ui/Rotulo";
import { cx } from "../../../utils/classes";
import type { Rascunho } from "../../../types";

interface Props {
  r: Rascunho;
  etapaAberta: number;
  aoMudarEtapa: (ei: number) => void;
}

/** Número ou código da etapa, em monoespaçado, antes do nome. */
const ESTILO_CHAVE = "min-w-[22px] font-mono text-2xs";

/** Um item da lateral: etapa, etapa agrupada ou o atalho para a aba Geral. */
function ItemLateral({ ativo, stepper, interno, agrupada, onClick, children }: {
  ativo?: boolean; stepper: boolean; interno?: boolean; agrupada?: boolean; onClick: () => void; children: ReactNode;
}) {
  const traco = !stepper ? "rounded"
    : interno ? "rounded border-l-[3px] border-solid border-l-transparent"
      : ativo ? "rounded-none border-l-[3px] border-solid border-l-accent"
        : "rounded-none border-l-[3px] border-solid border-l-line";
  return (
    <button
      type="button" onClick={onClick}
      className={cx(
        "flex w-full cursor-pointer items-center gap-2 border-0 py-[7px] text-left text-sm",
        agrupada ? "pl-4 pr-2" : "px-2",
        ativo ? "bg-accent-soft font-semibold text-accent" : "bg-transparent text-muted hover:bg-bg-sunk hover:text-ink",
        traco,
      )}
    >
      {children}
    </button>
  );
}

export function LateralEtapas({ r, etapaAberta, aoMudarEtapa }: Props) {
  const f = formularioDe(r.form);
  if (!f) return null; // o pai (FormularioRascunho) já mostra o aviso
  const stepper = f.nav === "stepper";

  return (
    <Painel className="px-2.5 py-2.5 md:sticky md:top-[60px]">
      <Rotulo className="px-2 pb-2 pt-1">interno</Rotulo>
      <ItemLateral stepper={stepper} interno onClick={() => mudarSubAba("geral")}>
        <span className={cx(ESTILO_CHAVE, "text-accent")}>◐</span>Geral do projeto
      </ItemLateral>
      <Rotulo className="mt-2.5 border-t border-line px-2 pb-2 pt-2.5">{f.nav === "lateral" ? "menu da proposta" : "etapas"}</Rotulo>
      {f.etapas.map((e, k) => (
        <Fragment key={e.id}>
          {e.grupo && (k === 0 || f.etapas[k - 1].grupo !== e.grupo) && <Rotulo className="px-2 pb-1 pt-2.5">{e.grupo}</Rotulo>}
          <ItemLateral stepper={stepper} ativo={etapaAberta === k} agrupada={Boolean(e.grupo)} onClick={() => aoMudarEtapa(k)}>
            <span className={cx(ESTILO_CHAVE, "text-faint")}>{f.nav === "lateral" ? "" : e.cod || k + 1}</span>
            {e.nome}
            <span className="ml-auto text-2xs text-faint tabular-nums">{pctEtapa(r, k)}%</span>
          </ItemLateral>
        </Fragment>
      ))}
      <div className="mt-2 border-t border-line px-2 pb-0.5 pt-2 text-2xs text-faint">{f.obs || ""}</div>
    </Painel>
  );
}
