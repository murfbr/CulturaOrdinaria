/* Barra com os três totais do orçamento: valor do projeto, custos vinculados
   e custo total (em destaque; em alerta quando a captação estoura o teto
   legal). */
import { custosVinculados } from "../../../lib/simulador/orcamento";
import { GradeKpis, Kpi } from "../../../components/ui/Kpi";
import { BRL } from "../../../utils";
import { cx } from "../../../utils/classes";
import type { Rascunho } from "../../../types";

export function BarraTotais({ r }: { r: Rascunho }) {
  const v = custosVinculados(r);
  return (
    <GradeKpis>
      <Kpi n={<span className="font-mono">{BRL(v.vp)}</span>} rotulo="Valor do projeto" />
      <Kpi n={<span className="font-mono">{BRL(v.total)}</span>} rotulo="Custos vinculados" />
      <Kpi n={<span className={cx("font-mono", v.estourou ? "text-no" : "text-accent-ink")}>{BRL(v.vp + v.total)}</span>} rotulo="Custo total" />
    </GradeKpis>
  );
}
