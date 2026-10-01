/* Os três números da captação: confirmado (contra a meta, quando há),
   em negociação (com quanto já tem proposta enviada) e o inventário de cotas. */
import { brl, totaisPatrocinio } from "../calculo";
import type { Base } from "../tipos";
import { LINK } from "../ui/classes";
import { Barra, Resumo } from "../ui/Resumo";
import type { IrPara } from "../vista";

export function ResumoCaptacao({ base, irPara }: { base: Base; irPara: IrPara }) {
  const t = totaisPatrocinio(base);
  const meta = Number(base.pagina.parametros.metaCaptacao) || 0;
  const pct = meta ? Math.min(100, Math.round((t.confirmado / meta) * 100)) : 0;
  return (
    <Resumo
      itens={[
        {
          titulo: "Confirmado", valor: brl(t.confirmado),
          extra: meta ? <Barra pct={pct} /> : undefined,
          sub: meta
            ? `${pct}% da meta de ${brl(meta)}`
            : <>Meta de captação não definida. <button type="button" className={LINK} onClick={() => irPara("config")}>Definir meta</button></>,
        },
        { titulo: "Em negociação", valor: brl(t.emNegociacao), sub: brl(t.comProposta) + " com proposta já enviada" },
        { titulo: "Inventário de cotas", valor: brl(t.inventario), sub: "Soma de valor vezes quantidade" },
      ]}
    />
  );
}
