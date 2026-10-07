/* Resumo do orçamento (tipo "orcresumo"): por etapa como o Salic mostra,
   por bloco (o corte de gestão do coletivo, com barra proporcional) e o
   checklist de antes de enviar. */
import { SALIC_DADOS } from "../../../data";
import {
  calcularLinha, custosVinculados, orcamentoDe, subtotalEtapa,
} from "../../../lib/simulador/orcamento";
import { BarraTotais } from "./BarraTotais";
import { Barra } from "../../../components/ui/Barra";
import { GradeKpis, Kpi } from "../../../components/ui/Kpi";
import { Linha } from "../../../components/ui/Linha";
import { Rotulo } from "../../../components/ui/Rotulo";
import { Vazio } from "../../../components/ui/Vazio";
import { ESTILO_CAIXA, ESTILO_DOCUMENTO } from "../formulario/campos/estilos";
import { BRL } from "../../../utils";
import { cx } from "../../../utils/classes";
import type { Rascunho } from "../../../types";
import type { Alterar } from "../formulario/tipos";

const SD = SALIC_DADOS;

const PASSOS_ANTES_DE_ENVIAR = [
  "Cadastrar os itens no Salic, etapa por etapa, dentro de cada produto e local",
  "Definir os percentuais em Custos vinculados e salvar, para a planilha recalcular",
  "Preencher o detalhamento do plano de distribuição",
  "Anexar os documentos exigidos",
  "Gerar o PDF e conferir",
  "Enviar a proposta ao MinC",
];

const ESTILO_VALOR = "w-[130px] whitespace-nowrap text-right font-mono tabular-nums";
const ESTILO_PCT = "w-11 text-right font-mono text-xs text-faint";

/** Uma linha do corte por bloco: nome, barra proporcional, valor e percentual. */
function LinhaPeso({ nome, pct, valor, cor = "accent", total }: {
  nome: string; pct: number; valor: number; cor?: "accent" | "gold"; total?: boolean;
}) {
  return (
    <Linha compacta className={cx("px-3", total && "bg-bg-sunk font-semibold")}
      direita={<>
        {total
          ? <span className="hidden w-[120px] md:inline-block" />
          : <Barra trechos={[{ pct, cor }]} className="hidden w-[120px] md:flex" />}
        <span className={ESTILO_VALOR}>{BRL(valor)}</span>
        <span className={ESTILO_PCT}>{pct}%</span>
      </>}>
      <span className="block truncate">{nome}</span>
    </Linha>
  );
}

export function ResumoOrcamento({ r, alterar }: { r: Rascunho; alterar: Alterar }) {
  const o = orcamentoDe(r);
  const v = custosVinculados(r);
  const total = v.vp + v.total;
  const pctDe = (valor: number) => (total ? Math.round((valor / total) * 100) : 0);

  // Soma por bloco (o corte de gestão do coletivo).
  const porBloco: Record<string, number> = {};
  const ordem: string[] = [];
  o.linhas.forEach((l) => {
    const chave = (l.bloco || "").trim() || "(sem bloco)";
    if (!(chave in porBloco)) { porBloco[chave] = 0; ordem.push(chave); }
    porBloco[chave] += calcularLinha(l);
  });

  return (
    <>
      <BarraTotais r={r} />
      <Rotulo className="mb-2 mt-4">Por etapa, como o Salic mostra</Rotulo>
      <GradeKpis>
        {(SD.etapas || []).map((e) => (
          <Kpi key={e[0]} n={<span className="font-mono">{BRL(subtotalEtapa(o, e[0]))}</span>} rotulo={e[1]} />
        ))}
        <Kpi n={<span className="font-mono">{BRL(v.acess)}</span>} rotulo="Acessibilidade" />
        <Kpi n={<span className="font-mono">{BRL(v.adm)}</span>} rotulo="Administração" />
        <Kpi n={<span className="font-mono">{BRL(v.capt)}</span>} rotulo="Captação" />
      </GradeKpis>

      <Rotulo className="mb-2 mt-4">Por bloco, o seu corte de gestão</Rotulo>
      {!ordem.length && !v.total ? (
        <Vazio emLinha>Nada lançado ainda.</Vazio>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-card">
          {ordem.map((chave) => <LinhaPeso key={chave} nome={chave} pct={pctDe(porBloco[chave])} valor={porBloco[chave]} />)}
          {v.total > 0 && <LinhaPeso nome="Custos vinculados" pct={pctDe(v.total)} valor={v.total} cor="gold" />}
          <LinhaPeso nome="Custo total" pct={100} valor={total} total />
        </div>
      )}

      <Rotulo className="mb-2 mt-4">Antes de enviar, na plataforma</Rotulo>
      <div>
        {PASSOS_ANTES_DE_ENVIAR.map((passo, i) => (
          <label className={ESTILO_DOCUMENTO} key={i}>
            <input type="checkbox" className={ESTILO_CAIXA} checked={Boolean(o.check[i])}
              onChange={(e) => alterar((copia) => { orcamentoDe(copia).check[i] = e.target.checked; }, true)} />
            <span className={cx(o.check[i] && "text-muted")}>{passo}</span>
          </label>
        ))}
      </div>
    </>
  );
}
