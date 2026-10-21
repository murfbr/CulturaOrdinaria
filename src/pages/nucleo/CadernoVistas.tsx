/* As duas telas calculadas do caderno Melhorias: o Início (números, próximas
   tarefas, últimas anotações) e "Levar ao Gustavo" (as tarefas abertas
   marcadas "precisa de código", por seção). Nenhuma lista própria: tudo
   deriva das seções. */
import { useState } from "react";
import type { Caderno } from "../../store/nucleo";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { Badge } from "../../components/ui/Badge";
import { CaixaMarcar } from "../../components/ui/Campo";
import { GradeKpis, Kpi } from "../../components/ui/Kpi";
import { Linha } from "../../components/ui/Linha";
import { Painel } from "../../components/ui/Painel";
import { Vazio } from "../../components/ui/Vazio";
import { ESTILO_APAGADO, ESTILO_AUXILIAR } from "../../components/ui/estilos";
import type { SecaoCaderno } from "../../types";
import { formatarData, relativo } from "../../utils";
import { ordemTarefa } from "./CadernoItens";

interface Props { caderno: Caderno; secoes: SecaoCaderno[]; irPara: (secaoId: string, aba?: string) => void }

const nomeSecao = (secoes: SecaoCaderno[], id: string) => secoes.find((s) => s.id === id)?.nome || id;
/** "Agenda · Central do Coletivo": a aba e a seção de um item. */
const onde = (secoes: SecaoCaderno[], secao: string, aba: string) => [aba, nomeSecao(secoes, secao)].filter(Boolean).join(" · ");

export function InicioDoCaderno({ caderno, secoes, irPara }: Props) {
  const abertas = caderno.tarefas.filter((t) => !t.feito);
  const codigo = abertas.filter((t) => t.codigo);
  const feitas = caderno.tarefas.length - abertas.length;
  const proximas = abertas.filter((t) => t.prazo).sort(ordemTarefa).slice(0, 6);
  const ultimas = caderno.notas.slice(0, 5);

  return (
    <>
      <CabecalhoSecao titulo="Início" sub="o caderno num olhar" />
      <GradeKpis>
        <Kpi n={abertas.length} rotulo="Tarefas abertas" />
        <Kpi n={codigo.length} rotulo="Precisam de código" />
        <Kpi n={feitas} rotulo="Feitas" />
        <Kpi n={caderno.notas.length} rotulo="Anotações" />
      </GradeKpis>

      <Painel titulo="Próximas tarefas" sub="abertas, com prazo; clique para abrir onde ela está">
        {proximas.map((t) => (
          <Linha key={t.id} compacta title="abrir onde ela está" aoClicar={() => irPara(t.secao, t.aba)}
            direita={<>{t.codigo && <Badge tom="tipo" mini>código</Badge>}<span className={ESTILO_AUXILIAR}>{formatarData(t.prazo)}</span></>}>
            <div className="truncate">{t.texto}<span className="text-muted"> · {onde(secoes, t.secao, t.aba)}</span></div>
          </Linha>
        ))}
        {!proximas.length && <Vazio emLinha>nenhuma tarefa aberta com prazo</Vazio>}
      </Painel>

      <Painel titulo="Últimas anotações">
        {ultimas.map((n) => (
          <Linha key={n.id} topo title="abrir onde ela está" aoClicar={() => irPara(n.secao, n.aba)}>
            <div className="line-clamp-2">{n.texto}</div>
            <div className={ESTILO_APAGADO}>{[onde(secoes, n.secao, n.aba), n.quem, relativo(n.criadoEm)].filter(Boolean).join(" · ")}</div>
          </Linha>
        ))}
        {!ultimas.length && <Vazio emLinha>nenhuma anotação</Vazio>}
      </Painel>
    </>
  );
}

export function LevarAoGustavo({ caderno, secoes, irPara }: Props) {
  const [soMinhas, setSoMinhas] = useState(false);
  const abertas = caderno.tarefas.filter((t) => !t.feito && t.codigo && (!soMinhas || /gustavo/i.test(t.quem)));
  const grupos = secoes.map((s) => ({ s, tarefas: abertas.filter((t) => t.secao === s.id).sort(ordemTarefa) })).filter((g) => g.tarefas.length);

  return (
    <>
      <CabecalhoSecao titulo="Levar ao Gustavo" sub={abertas.length + " tarefas abertas que precisam de código"}>
        <span className="flex items-center gap-1.5 text-sm text-muted"><CaixaMarcar marcado={soMinhas} aoMudar={() => setSoMinhas((v) => !v)} /> só as do Gustavo</span>
      </CabecalhoSecao>
      {grupos.map(({ s, tarefas }) => (
        <Painel key={s.id} titulo={s.nome} acoes={<button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-accent hover:underline" onClick={() => irPara(s.id, "")}>abrir a seção →</button>}>
          {tarefas.map((t) => (
            <Linha key={t.id} topo title="abrir onde ela está" aoClicar={() => irPara(t.secao, t.aba)}
              direita={<>{t.quem && <Badge mini>{t.quem}</Badge>}{t.prazo && <span className={ESTILO_AUXILIAR}>{formatarData(t.prazo)}</span>}</>}>
              <div className="whitespace-pre-wrap">{t.texto}</div>
              <div className={ESTILO_APAGADO}>{[t.aba, t.origem].filter(Boolean).join(" · ")}</div>
            </Linha>
          ))}
        </Painel>
      ))}
      {!grupos.length && <Vazio>Nada aberto que precise de código. Uma tarefa entra aqui quando tem a marca "precisa de código".</Vazio>}
    </>
  );
}
