/* Captação · Resumo: as quatro cifras, o funil por etapa, o andamento por
   projeto, os próximos passos da semana e a tabela por captadora. Só os
   projetos abertos entram (captados e encerrados ficam no Portfólio e em
   Captadoras). Na visão de uma captadora, só as negociações dela. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { irParaAba } from "../../store/navegacao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { Grade } from "../../components/ui/Grade";
import { hojeIso } from "../../lib/prazos";
import type { Negociacao } from "../../types";
import { brl, dosAbertos, inventario, metaDosAbertos, noEscopo, projetosAbertos, totais } from "./calculo";
import { ModalNegociacao } from "./negociacoes/ModalNegociacao";
import { Funil } from "./resumo/Funil";
import { PorCaptadora } from "./resumo/PorCaptadora";
import { PorProjeto } from "./resumo/PorProjeto";
import { ProximosPassos } from "./resumo/ProximosPassos";
import { pedirEtapa, usarComo } from "./visao";

function Cifra({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="rounded-md border border-line bg-card px-4 py-3">
      <div className="font-mono text-3xs uppercase text-muted">{rotulo}</div>
      <div className="text-2xl font-semibold tabular-nums">{valor}</div>
      <div className="min-h-4 text-xs text-muted">{detalhe}</div>
    </div>
  );
}

export function ResumoCaptacao() {
  const { painel } = usarCentral();
  const como = usarComo();
  const [aberta, setAberta] = useState<Negociacao | null>(null);
  const hoje = hojeIso();
  const nomeComo = painel.captadoras.find((c) => c.id === como)?.nome;

  const dosProjetosAbertos = dosAbertos(painel.negociacoes, painel.portfolio);
  const doEscopo = dosProjetosAbertos.filter((n) => noEscopo(n, como));
  const t = totais(doEscopo, painel.portfolio);
  const abertos = projetosAbertos(painel.portfolio);
  const metas = metaDosAbertos(painel.portfolio);
  const notaComissao = t.estimada ? "estimativa: regra da comissão ainda a definir" : t.semPct ? t.semPct + " confirmada(s) sem percentual combinado" : undefined;

  return (
    <>
      <CabecalhoSecao
        titulo={nomeComo ? "Resumo de " + nomeComo : "Resumo da captação"}
        sub={nomeComo ? "só as negociações que estão com ela, nos projetos abertos" : "os projetos abertos e as negociações deles — captados e encerrados ficam no Portfólio e em Captadoras"}
      />
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Cifra rotulo="Confirmado" valor={brl(t.confirmado)} detalhe={metas ? Math.round((t.confirmado / metas) * 100) + "% da meta de " + brl(metas) : "meta ainda não definida"} />
        <Cifra rotulo="Em negociação" valor={brl(t.negociando)} detalhe={t.abertas + " abertas · " + brl(t.proposta) + " com proposta enviada"} />
        {como
          ? <Cifra rotulo="Comissão a receber" valor={brl(t.aPagar)} detalhe={notaComissao} />
          : <Cifra rotulo="Inventário de cotas" valor={brl(inventario(painel.cotas, painel.portfolio))} detalhe="valor × quantidade, projetos abertos" />}
        {como
          ? <Cifra rotulo="Comissão já paga" valor={brl(t.paga)} />
          : <Cifra rotulo="Comissões a pagar" valor={brl(t.aPagar)} detalhe={notaComissao} />}
      </div>

      <Funil negociacoes={doEscopo} como={como} aoEscolher={(e) => { pedirEtapa(e); irParaAba("negociacoes"); }} />

      <Grade colunas={2}>
        <PorProjeto abertos={abertos} negociacoes={dosProjetosAbertos} como={como} />
        <ProximosPassos negociacoes={doEscopo} hoje={hoje} aoAbrir={setAberta} />
      </Grade>

      {!como && <PorCaptadora captadoras={painel.captadoras} negociacoes={dosProjetosAbertos} projetos={painel.portfolio} />}

      {aberta && <ModalNegociacao registro={aberta} aoFechar={() => setAberta(null)} />}
    </>
  );
}
