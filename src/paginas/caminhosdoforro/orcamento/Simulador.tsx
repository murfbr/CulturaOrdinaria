/* Simulador de receitas: operação do bar, público, gasto no bar,
   colaboração, gastronomia, contingência e o patrocínio (confirmado ou
   simulado). Cada faixa grava no documento da página (com debounce), então
   os parâmetros valem para toda a equipe e alimentam o Painel. */
import { BAR_FIXO, brl, calcularOrcamento, rotuloCenario } from "../calculo";
import { alterarSimulador } from "../dados";
import type { Base, Simulador as ParametrosSimulador } from "../tipos";
import { Grupo } from "../ui/Campo";
import { NOTA } from "../ui/classes";
import { Resumo } from "../ui/Resumo";
import { Segmentado } from "../ui/Segmentado";

interface PropsFaixa {
  id: string; rotulo: string; valor: number; min: number; max: number; passo: number;
  texto: string; dica?: string; aoMudar: (v: number) => void;
}

function Faixa({ id, rotulo, valor, min, max, passo, texto, dica, aoMudar }: PropsFaixa) {
  const htmlId = "cdf-sim-" + id;
  return (
    <div>
      <label htmlFor={htmlId} className="cdf:flex cdf:justify-between cdf:gap-2.5 cdf:text-sm cdf:font-semibold cdf:text-tinta-2">
        {rotulo}<output className="cdf:font-bold cdf:tabular-nums cdf:text-tinta">{texto}</output>
      </label>
      <input id={htmlId} type="range" min={min} max={max} step={passo} value={valor} onChange={(e) => aoMudar(Number(e.target.value))} className="cdf:mt-1.5 cdf:w-full cdf:accent-primaria" />
      {dica && <small className="cdf:block cdf:text-[13px] cdf:text-fraco">{dica}</small>}
    </div>
  );
}

export function Simulador({ base }: { base: Base }) {
  const c = calcularOrcamento(base);
  const p = c.p;
  const num = (v: number) => v.toLocaleString("pt-BR");
  const mudar = (parte: Partial<ParametrosSimulador>) => alterarSimulador(parte, false);

  let veredito = num(c.pessoas) + " pessoas nos três dias. ";
  if (p.bar === "proprio") veredito += "Bar próprio: " + brl(c.receitaBar) + " de venda bruta e " + brl(c.bar) + " líquidos, com compra antecipada de bebida de cerca de " + brl(c.receitaBar * 0.33) + ". ";
  else if (p.bar === "concessao") veredito += "Bar em concessão: " + brl(c.bar) + ". ";
  else veredito += "Sem receita de bar. ";
  veredito += c.saldo >= 0 ? "A conta fecha nesta combinação." : "Faltam " + brl(-c.saldo) + " para fechar a conta.";

  return (
    <div className="cdf:grid cdf:grid-cols-1 cdf:items-start cdf:gap-[18px] cdf:md:grid-cols-2">
      <div className="cdf:flex cdf:flex-col cdf:gap-4 cdf:rounded-xl cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie cdf:p-[18px]">
        <Grupo rotulo="Operação do bar">
          <Segmentado rotulo="Operação do bar" opcoes={[["proprio", "Próprio"], ["concessao", "Concessão"], ["sem", "Sem bar"]]} valor={p.bar} aoMudar={(bar) => alterarSimulador({ bar })} />
        </Grupo>
        <Faixa id="publico" rotulo="Público por dia" valor={p.publico} min={300} max={3000} passo={50} texto={num(p.publico)} aoMudar={(publico) => mudar({ publico })} />
        <Faixa id="ticket" rotulo="Gasto médio no bar por pessoa" valor={p.ticket} min={0} max={60} passo={5} texto={brl(p.ticket)} aoMudar={(ticket) => mudar({ ticket })} />
        <Faixa id="colab" rotulo="Colaboração voluntária por pessoa" valor={p.colab} min={0} max={30} passo={1} texto={brl(p.colab)} dica="Considera que 70% do público contribui." aoMudar={(colab) => mudar({ colab })} />
        <Faixa id="gastro" rotulo="Receita da gastronomia" valor={p.gastro} min={0} max={60000} passo={1000} texto={brl(p.gastro)} dica="Taxa ou percentual das barracas, somado nos três dias." aoMudar={(gastro) => mudar({ gastro })} />
        <Faixa id="contingencia" rotulo="Contingência sobre as despesas" valor={p.contingencia} min={0} max={20} passo={1} texto={p.contingencia + "%"} aoMudar={(contingencia) => mudar({ contingencia })} />
        <Grupo rotulo="Patrocínio">
          <Segmentado rotulo="Patrocínio" opcoes={[["confirmado", "Usar o confirmado"], ["manual", "Simular outro valor"]]} valor={p.cotasModo} aoMudar={(cotasModo) => alterarSimulador({ cotasModo })} />
          {p.cotasModo === "manual"
            ? <div className="cdf:mt-3"><Faixa id="cotasManual" rotulo="Patrocínio simulado" valor={p.cotasManual} min={0} max={500000} passo={5000} texto={brl(p.cotasManual)} aoMudar={(cotasManual) => mudar({ cotasManual })} /></div>
            : <small className="cdf:mt-1.5 cdf:block cdf:text-sm cdf:text-fraco">Confirmado em Patrocínios e apoios: {brl(c.cotasConfirmadas)}.</small>}
        </Grupo>
      </div>
      <div className="cdf:flex cdf:flex-col cdf:gap-3.5">
        <Resumo
          className="cdf:mb-0"
          itens={[
            { titulo: "Despesas", valor: brl(c.despesas), sub: "cenário " + rotuloCenario(c.cenario) },
            { titulo: "Receitas", valor: brl(c.receitas), sub: "patrocínio " + brl(c.cotas) },
            { titulo: c.saldo >= 0 ? "Sobra" : "Falta", valor: brl(Math.abs(c.saldo)), classeValor: c.saldo >= 0 ? "cdf:text-conf" : "cdf:text-erro" },
          ]}
        />
        <p className="cdf:m-0 cdf:rounded-xl cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie cdf:px-[18px] cdf:py-3.5 cdf:text-base">{veredito}</p>
        <p className={NOTA}>Bar próprio: custo fixo de {brl(BAR_FIXO)} mais 39% da venda. Concessão: 22% da venda bruta. Os parâmetros ficam salvos para toda a equipe e alimentam o Painel.</p>
      </div>
    </div>
  );
}
