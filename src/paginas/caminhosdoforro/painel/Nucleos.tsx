/* Um card por núcleo: responsável, membros, tarefas abertas e atrasadas,
   orçamento do núcleo no cenário atual e quantos cadastros ele cuida. */
import { brl, calcularOrcamento, contasNucleo, nomeCadastro, pctTexto, rotuloCenario } from "../calculo";
import type { Base } from "../tipos";
import { Botao } from "../ui/Botao";
import { SECAO } from "../ui/classes";
import { Tag } from "../ui/Tag";
import { pedirFiltroTarefas, type IrPara } from "../vista";

export function Nucleos({ base, irPara }: { base: Base; irPara: IrPara }) {
  const conta = calcularOrcamento(base);
  const cadastros = Object.values(base.cadastro);
  const verTarefas = (nucleo: string) => { pedirFiltroTarefas({ nucleo }); irPara("tarefas"); };
  return (
    <>
      <h2 className={SECAO}>Núcleos<Botao mini className="cdf:ml-auto cdf:font-sans" onClick={() => irPara("tarefas")}>Tarefas</Botao></h2>
      <p className="cdf:m-0 cdf:mb-3 cdf:text-sm cdf:text-fraco">Orçamento no cenário {rotuloCenario(conta.cenario)}, sem contingência; o percentual é sobre o total dos itens.</p>
      <div className="cdf:grid cdf:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] cdf:gap-3">
        {base.pagina.nucleos.map((n) => {
          const c = contasNucleo(base, n.id);
          const membros = (n.membros || []).filter((id) => base.cadastro[id]);
          const orcamento = conta.porNucleo[n.id] || 0;
          const cuida = cadastros.filter((d) => d.nucleo === n.id).length;
          return (
            <article key={n.id} className="cdf:flex cdf:flex-col cdf:gap-2 cdf:rounded-xl cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie cdf:p-4">
              <h3 className="cdf:m-0 cdf:font-display cdf:text-[22px] cdf:font-black cdf:leading-[1.1]">{n.nome}</h3>
              <p className="cdf:m-0 cdf:text-sm cdf:text-tinta-2">
                {n.responsavel ? <>Responsável: <strong>{nomeCadastro(base, n.responsavel)}</strong></> : <span className="cdf:text-fraco">Sem responsável</span>}
              </p>
              <div>{membros.length ? membros.map((id) => <Tag key={id}>{nomeCadastro(base, id)}</Tag>) : <span className="cdf:text-sm cdf:text-fraco">Nenhum membro ainda</span>}</div>
              <dl className="cdf:m-0 cdf:grid cdf:grid-cols-[auto_1fr] cdf:gap-x-3 cdf:gap-y-1 cdf:text-sm">
                <dt className="cdf:text-fraco">Tarefas</dt>
                <dd className="cdf:m-0"><b>{c.abertas}</b> abertas{c.atrasadas ? <>, <span className="cdf:font-bold cdf:text-erro">{c.atrasadas} atrasadas</span></> : null}, {c.feitas} concluídas</dd>
                <dt className="cdf:text-fraco">Orçamento</dt>
                <dd className="cdf:m-0 cdf:tabular-nums"><b>{brl(orcamento)}</b> <span className="cdf:text-fraco">({pctTexto(orcamento, conta.subtotal)})</span></dd>
                <dt className="cdf:text-fraco">Cuida de</dt>
                <dd className="cdf:m-0">{cuida ? cuida + (cuida === 1 ? " cadastro" : " cadastros") : <span className="cdf:text-fraco">nenhum cadastro</span>}</dd>
              </dl>
              <div className="cdf:mt-auto cdf:pt-1"><Botao mini variante="fraco" onClick={() => verTarefas(n.id)}>Ver tarefas</Botao></div>
            </article>
          );
        })}
      </div>
    </>
  );
}
