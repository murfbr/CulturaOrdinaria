/* O painel de um núcleo: os números (tarefas, orçamento no cenário atual,
   cadastros que ele cuida), as próximas tarefas e as atrasadas, o orçamento
   e, na captação, os números da captação; na comunicação, o alcance e um
   cartão por frente (Redes, Design, Audiovisual, Contrapartidas) com o que
   cada aba tem. Só leitura: tudo é conta sobre o que as outras abas guardam. */
import { brl, calcularOrcamento, contarTarefas, dataBr, nomeCadastro, nucleoCaptacao, nucleoComunicacao, pctTexto, respEfetivo, rotuloCenario, tarefaAtrasada, valorItem } from "../calculo";
import { alcance } from "../comunicacao/alcance";
import { FRENTES, itensDaFrente, tarefasDaFrente } from "../comunicacao/frentes";
import { ResumoCaptacao } from "../patrocinios/ResumoCaptacao";
import { rotulo } from "../listas";
import { PilulaPrioridade, classeStatusTarefa } from "../tarefas/etiquetas";
import type { Base, Nucleo, TarefaFestival } from "../tipos";
import { Botao } from "../ui/Botao";
import { LINK, SECAO } from "../ui/classes";
import { Resumo } from "../ui/Resumo";
import { Tabela, Td, Th } from "../ui/Tabela";
import { Pilula } from "../ui/Tag";
import type { AbaNucleo, IrPara } from "../vista";

interface Props { base: Base; nucleo: Nucleo; irPara: IrPara; abrirAba: (a: AbaNucleo) => void }

export function PainelNucleo({ base, nucleo: n, irPara, abrirAba }: Props) {
  const p = base.pagina;
  const tarefas = Object.values(base.tarefas).filter((t) => t.nucleo === n.id);
  const c = contarTarefas(tarefas);
  const conta = calcularOrcamento(base);
  const itens = Object.values(base.orcamento_itens).filter((it) => it.nucleo === n.id);
  const orcamento = conta.porNucleo[n.id] || 0;
  const cuida = Object.values(base.cadastro).filter((d) => d.nucleo === n.id);
  const porStatus: Record<string, number> = {};
  cuida.forEach((d) => { porStatus[d.status] = (porStatus[d.status] || 0) + 1; });

  const abertas = tarefas.filter((t) => t.status !== "concluido");
  const atrasadas = abertas.filter(tarefaAtrasada).sort((a, b) => String(a.prazo).localeCompare(String(b.prazo)));
  // Seis no máximo: as atrasadas primeiro, depois as próximas por prazo.
  const foco = [...atrasadas, ...abertas.filter((t) => !tarefaAtrasada(t) && t.prazo).sort((a, b) => String(a.prazo).localeCompare(String(b.prazo)))].slice(0, 6);
  const ehComunicacao = nucleoComunicacao(base)?.id === n.id;
  const al = ehComunicacao ? alcance(base) : null;
  const num = (v: number) => v.toLocaleString("pt-BR");

  return (
    <>
      <Resumo
        itens={[
          { titulo: "Tarefas abertas", valor: c.abertas, sub: c.atrasadas ? <span className="cdf:font-bold cdf:text-erro">{c.atrasadas} atrasadas</span> : c.total ? c.feitas + " concluídas de " + c.total : "nenhuma tarefa ainda", classeValor: c.atrasadas ? "cdf:text-erro" : undefined },
          { titulo: "Críticas em aberto", valor: c.criticas, sub: c.total ? pctTexto(c.feitas, c.total) + " do núcleo concluído" : "" },
          { titulo: "Orçamento do núcleo", valor: brl(orcamento), sub: (itens.length ? itens.length + (itens.length === 1 ? " item, " : " itens, ") : "") + pctTexto(orcamento, conta.subtotal) + " do total (cenário " + rotuloCenario(conta.cenario) + ")" },
          { titulo: "Cadastros que cuida", valor: cuida.length, sub: cuida.length ? p.listas.statusContato.filter((s) => porStatus[s.id]).map((s) => porStatus[s.id] + " " + s.nome.toLowerCase()).join(", ") : "nenhum cadastro aponta para este núcleo" },
        ]}
      />

      {nucleoCaptacao(base)?.id === n.id && (
        <>
          <h2 className={SECAO}>Captação<Botao mini className="cdf:ml-auto cdf:font-sans" onClick={() => abrirAba("patrocinios")}>Patrocínios e apoios</Botao></h2>
          <ResumoCaptacao base={base} irPara={irPara} />
        </>
      )}

      {al && (
        <>
          <h2 className={SECAO}>Alcance nas redes<Botao mini className="cdf:ml-auto cdf:font-sans" onClick={() => abrirAba("redes")}>Redes</Botao></h2>
          <Resumo
            itens={[
              { titulo: "Alcance dos confirmados", valor: al.confirmados ? num(al.confirmados) : "—", sub: al.confirmados ? al.perfisConfirmados + " perfis de atrações e parceiros confirmados" : "Informe seguidores no cadastro de cada atração" },
              { titulo: "Ainda não confirmados", valor: al.possivel ? "+" + num(al.possivel) : "—", sub: al.perfisPossiveis + " perfis de atrações e parceiros em conversa ou a contatar" },
              { titulo: "Confirmados sem Instagram", valor: al.semInstagram.length, sub: al.semInstagram.length ? al.semInstagram.slice(0, 4).map((d) => d.nome).join(", ") + (al.semInstagram.length > 4 ? "…" : "") : "atrações e parceiros", classeValor: al.semInstagram.length ? "cdf:text-conversa" : undefined },
            ]}
          />
          <h2 className={SECAO}>Frentes da comunicação</h2>
          <div className="cdf:mb-2 cdf:grid cdf:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] cdf:gap-3">
            {FRENTES.map((f) => {
              const ts = tarefasDaFrente(base, n.id, f.id);
              const abertasF = ts.filter((t) => t.status !== "concluido");
              const atrasadasF = abertasF.filter(tarefaAtrasada).length;
              const valor = itensDaFrente(base, n.id, f.id).reduce((t, it) => t + valorItem(it, conta.cenario), 0);
              return (
                <div key={f.id} className="cdf:flex cdf:flex-col cdf:gap-1.5 cdf:rounded-xl cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie cdf:px-4 cdf:py-3.5">
                  <button type="button" onClick={() => abrirAba(f.id)} className="cdf:cursor-pointer cdf:self-start cdf:border-0 cdf:bg-transparent cdf:p-0 cdf:text-left cdf:font-display cdf:text-[20px] cdf:font-black cdf:leading-tight cdf:text-primaria cdf:underline cdf:decoration-2 cdf:underline-offset-4 cdf:hover:text-destaque">{f.nome}</button>
                  <span className="cdf:text-[13px] cdf:text-tinta-2">{f.descricao}</span>
                  <span className="cdf:mt-1 cdf:text-sm cdf:text-fraco">
                    {abertasF.length ? abertasF.length + (abertasF.length === 1 ? " tarefa aberta" : " tarefas abertas") : ts.length ? "tudo concluído" : "sem tarefas"}
                    {atrasadasF > 0 && <span className="cdf:font-bold cdf:text-erro">, {atrasadasF} atrasada{atrasadasF > 1 ? "s" : ""}</span>}
                    {valor > 0 && <> · {brl(valor)}</>}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      <h2 className={SECAO}>Tarefas em foco<Botao mini className="cdf:ml-auto cdf:font-sans" onClick={() => abrirAba("tarefas")}>Todas as tarefas do núcleo</Botao></h2>
      {!abertas.length ? (
        <p className="cdf:m-0 cdf:text-sm cdf:text-fraco">{tarefas.length ? "Tudo concluído." : "Nenhuma tarefa classificada neste núcleo."}</p>
      ) : (
        <Tabela>
          <thead><tr><Th>Tarefa</Th><Th>Responsável</Th><Th>Prazo</Th><Th>Prioridade</Th><Th>Status</Th></tr></thead>
          <tbody>
            {foco.map((t) => <LinhaTarefa key={t.id} base={base} t={t} />)}
            {!foco.length && <tr><Td colSpan={5}><span className="cdf:text-fraco">As tarefas abertas não têm prazo.</span></Td></tr>}
          </tbody>
        </Tabela>
      )}
      {foco.length > 0 && <p className="cdf:m-0 cdf:mt-2 cdf:text-sm cdf:text-fraco">Até seis: {atrasadas.length > 6 ? "só as " + 6 + " atrasadas mais antigas (são " + atrasadas.length + ")" : atrasadas.length ? "as atrasadas primeiro, depois as próximas por prazo" : "as próximas por prazo"}.</p>}

      {cuida.length > 0 && (
        <p className="cdf:m-0 cdf:mt-6 cdf:text-sm cdf:text-fraco">
          Os {cuida.length} cadastros que este núcleo cuida estão no{" "}
          <button type="button" className={LINK} onClick={() => irPara("cadastro")}>Cadastro</button>, filtrando pelo núcleo.
        </p>
      )}
    </>
  );
}

function LinhaTarefa({ base, t }: { base: Base; t: TarefaFestival }) {
  const p = base.pagina;
  const atrasada = tarefaAtrasada(t);
  const resp = respEfetivo(base, t);
  return (
    <tr>
      <Td>{t.codigo && <span className="cdf:mr-1.5 cdf:text-[12.5px] cdf:text-fraco">{t.codigo}</span>}<strong>{t.titulo}</strong>{t.frente && <span className="cdf:block cdf:text-[13px] cdf:text-fraco">{t.frente}</span>}</Td>
      <Td>{resp ? nomeCadastro(base, resp) : <span className="cdf:text-fraco">—</span>}</Td>
      <Td className={atrasada ? "cdf:font-bold cdf:text-erro" : undefined}>{dataBr(t.prazo)}{atrasada && " (venceu)"}</Td>
      <Td><PilulaPrioridade t={t} vazio="—" /></Td>
      <Td><Pilula classe={classeStatusTarefa(t.status)}>{rotulo(p, "statusTarefa", t.status)}</Pilula></Td>
    </tr>
  );
}
