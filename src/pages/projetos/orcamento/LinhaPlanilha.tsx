/* Uma linha da planilha orçamentária: as células editáveis (controles
   discretos, sem borda até o mouse passar), o total calculado e os botões de
   duplicar e remover. As colunas do Salic só aparecem no modo completo. */
import type { TdHTMLAttributes } from "react";
import { SALIC_DADOS } from "../../../data";
import { calcularLinha } from "../../../lib/simulador/orcamento";
import { Botao } from "../../../components/ui/Botao";
import { ESTILO_CONTROLE_DISCRETO } from "../../../components/ui/Campo";
import { BRL } from "../../../utils";
import { cx } from "../../../utils/classes";
import type { LinhaOrcamento } from "../../../types";

const SD = SALIC_DADOS;

/** Célula da planilha: mais apertada e centrada na vertical que o Td padrão,
    porque abriga um controle (o Td do bloco é para texto). */
export function Celula({ className, ...resto }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cx("border-t border-line px-1 py-[3px] align-middle", className)} {...resto} />;
}

/** Total em dinheiro: monoespaçado, alinhado à direita. */
export const ESTILO_TOTAL = "whitespace-nowrap text-right font-mono font-semibold tabular-nums";

const TEXTO = "w-full " + ESTILO_CONTROLE_DISCRETO;
const NUMERO = "text-right font-mono tabular-nums " + ESTILO_CONTROLE_DISCRETO;

interface Props {
  l: LinhaOrcamento;
  /** Datalist com o catálogo do produto × etapa desta linha. */
  idLista?: string;
  colunasSalic: boolean;
  mudar: (campo: keyof LinhaOrcamento, valor: string) => void;
  duplicar: () => void;
  remover: () => void;
}

export function LinhaPlanilha({ l, idLista, colunasSalic, mudar, duplicar, remover }: Props) {
  const sc = colunasSalic ? undefined : "hidden";
  return (
    <tr>
      <Celula><input className={TEXTO} list="lista-blocos" value={l.bloco} placeholder="—" onChange={(e) => mudar("bloco", e.target.value)} /></Celula>
      <Celula className={sc}>
        <select className={cx(TEXTO, "min-w-[160px]")} value={l.produto} onChange={(e) => mudar("produto", e.target.value)}>
          <option value="">—</option>
          {(SD.produtos || []).map((p) => <option key={p}>{p}</option>)}
        </select>
      </Celula>
      <Celula className={sc}><input className={TEXTO} value={l.local} placeholder="Cidade - UF" onChange={(e) => mudar("local", e.target.value)} /></Celula>
      <Celula>
        <select className={cx(TEXTO, "min-w-[150px]")} value={l.etapa} onChange={(e) => mudar("etapa", e.target.value)}>
          {(SD.etapas || []).map((e2) => <option key={e2[0]} value={e2[0]}>{e2[1]}</option>)}
        </select>
      </Celula>
      <Celula><input className={TEXTO} list={idLista} value={l.item} placeholder="descrição do gasto" onChange={(e) => mudar("item", e.target.value)} /></Celula>
      <Celula className={sc}><input className={cx(NUMERO, "w-full")} value={l.cod} placeholder="—" onChange={(e) => mudar("cod", e.target.value)} /></Celula>
      <Celula>
        <select className={cx(TEXTO, "min-w-[104px]")} value={String(l.unidade)} onChange={(e) => mudar("unidade", e.target.value)}>
          {(SD.unidade || []).map((u) => <option key={u[1]} value={u[1]}>{u[0]}</option>)}
        </select>
      </Celula>
      <Celula><input className={cx(NUMERO, "w-[58px]")} inputMode="decimal" value={l.qtd} onChange={(e) => mudar("qtd", e.target.value)} /></Celula>
      <Celula><input className={cx(NUMERO, "w-[58px]")} inputMode="decimal" value={l.oco} onChange={(e) => mudar("oco", e.target.value)} /></Celula>
      <Celula><input className={cx(NUMERO, "w-[104px]")} inputMode="decimal" value={l.vu} placeholder="0,00" onChange={(e) => mudar("vu", e.target.value)} /></Celula>
      <Celula className={cx(ESTILO_TOTAL, "pr-2.5")}>{BRL(calcularLinha(l))}</Celula>
      <Celula className={sc}>
        <select className={cx(TEXTO, "min-w-[150px]")} value={String(l.fonte)} onChange={(e) => mudar("fonte", e.target.value)}>
          {(SD.fonte || []).map((f) => <option key={f[1]} value={f[1]}>{f[0]}</option>)}
        </select>
      </Celula>
      <Celula className={sc}><input className={TEXTO} value={l.obs} placeholder="justificativa do item" onChange={(e) => mudar("obs", e.target.value)} /></Celula>
      <Celula className="w-[60px] whitespace-nowrap">
        <Botao variante="quieto" tamanho="mini" title="Duplicar" onClick={duplicar}>⧉</Botao>
        <Botao variante="quieto" tamanho="mini" title="Remover" onClick={remover}>×</Botao>
      </Celula>
    </tr>
  );
}
