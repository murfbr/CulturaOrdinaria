/* Painel do orçamento: os quatro números (despesas, receitas previstas,
   sobra ou falta, despesa já confirmada) e as três roscas (despesas por
   categoria, receitas por fonte, despesas por núcleo). */
import { COR_CONTINGENCIA, COR_SEM, CORES, brl, calcularOrcamento, pctTexto, rotuloCenario } from "../calculo";
import type { Base } from "../tipos";
import { Resumo } from "../ui/Resumo";
import { Rosca, type Fatia } from "./Rosca";

export function PainelOrcamento({ base }: { base: Base }) {
  const c = calcularOrcamento(base);
  const p = base.pagina;

  const categorias: Fatia[] = p.listas.categoriasOrcamento.map((k, i) => ({ nome: k.nome, valor: c.porCategoria[k.id] || 0, cor: CORES[i % CORES.length] }));
  if (c.porCategoria._sem) categorias.push({ nome: "Sem categoria", valor: c.porCategoria._sem, cor: COR_SEM });
  if (c.contingencia) categorias.push({ nome: "Contingência (" + c.p.contingencia + "%)", valor: c.contingencia, cor: COR_CONTINGENCIA });

  const nucleos: Fatia[] = p.nucleos.map((k, i) => ({ nome: k.nome, valor: c.porNucleo[k.id] || 0, cor: CORES[(i * 2 + 1) % CORES.length] }));
  if (c.porNucleo._sem) nucleos.push({ nome: "Sem núcleo", valor: c.porNucleo._sem, cor: COR_SEM });
  if (c.contingencia) nucleos.push({ nome: "Contingência", valor: c.contingencia, cor: COR_CONTINGENCIA });

  const receitas: Fatia[] = [
    { nome: c.p.cotasModo === "manual" ? "Patrocínio (simulado)" : "Patrocínio confirmado", valor: c.cotas, cor: CORES[0] },
    { nome: c.p.bar === "concessao" ? "Bar em concessão" : "Bar próprio", valor: c.bar, cor: CORES[1] },
    { nome: "Colaboração do público", valor: c.colaboracao, cor: CORES[2] },
    { nome: "Gastronomia", valor: c.gastronomia, cor: CORES[3] },
  ];

  return (
    <>
      <Resumo
        itens={[
          { titulo: "Despesas", valor: brl(c.despesas), sub: "cenário " + rotuloCenario(c.cenario) + ", com " + c.p.contingencia + "% de contingência" },
          { titulo: "Receitas previstas", valor: brl(c.receitas), sub: "pelos parâmetros do simulador" },
          { titulo: c.saldo >= 0 ? "Sobra" : "Falta", valor: brl(Math.abs(c.saldo)), classeValor: c.saldo >= 0 ? "cdf:text-conf" : "cdf:text-erro", sub: "receitas menos despesas" },
          { titulo: "Despesa já confirmada", valor: brl(c.confirmado), sub: pctTexto(c.confirmado, c.subtotal) + " dos itens, sem a contingência" },
        ]}
      />
      <div className="cdf:mt-1 cdf:grid cdf:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] cdf:gap-3.5">
        <Rosca titulo="Despesas por categoria" fatias={categorias} />
        <Rosca titulo="Receitas por fonte" fatias={receitas} />
        <Rosca titulo="Despesas por núcleo" fatias={nucleos} />
      </div>
      <p className="cdf:mt-3 cdf:text-sm cdf:text-fraco">Passe o mouse nas fatias para ver valor e percentual. As receitas mudam no Simulador; as despesas, no Detalhamento.</p>
    </>
  );
}
