/* O painel de um núcleo: os números (tarefas, orçamento no cenário atual,
   cadastros que ele cuida), as próximas tarefas e as atrasadas, o orçamento
   por categoria e, na captação, os números da captação; na comunicação, um
   cartão por frente (Redes, Design, Audiovisual, Contrapartidas) com o que
   cada aba tem. Só leitura: tudo é conta sobre o que as outras abas guardam. */
import { brl, calcularOrcamento, contarTarefas, dataBr, nomeCadastro, nucleoCaptacao, nucleoComunicacao, pctTexto, respEfetivo, rotuloCenario, tarefaAtrasada, valorItem } from "../calculo";
import { FRENTES, itensDaFrente, tarefasDaFrente } from "../comunicacao/frentes";
import { ResumoCaptacao } from "../patrocinios/ResumoCaptacao";
import { rotulo } from "../listas";
import { PilulaPrioridade, classeStatusTarefa } from "../tarefas/etiquetas";
import type { Base, Nucleo, TarefaFestival } from "../tipos";
import { Botao } from "../ui/Botao";
import { LINK, SECAO } from "../ui/classes";
import { Resumo } from "../ui/Resumo";
import { NUM, Tabela, Td, Th } from "../ui/Tabela";
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
  const proximas = abertas.filter((t) => !tarefaAtrasada(t) && t.prazo).sort((a, b) => String(a.prazo).localeCompare(String(b.prazo))).slice(0, 6);

  const porCategoria: Record<string, number> = {};
  itens.forEach((it) => { const k = it.categoria || "_sem"; porCategoria[k] = (porCategoria[k] || 0) + valorItem(it, conta.cenario); });
  const categorias = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);

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

      {nucleoComunicacao(base)?.id === n.id && (
        <>
          <h2 className={SECAO}>Frentes da comunicação</h2>
          <div className="cdf:mb-2 cdf:grid cdf:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] cdf:gap-3">
            {FRENTES.map((f) => {
              const ts = tarefasDaFrente(base, n.id, f.id);
              const abertasF = ts.filter((t) => t.status !== "concluido");
              const atrasadasF = abertasF.filter(tarefaAtrasada).length;
              const valor = itensDaFrente(base, n.id, f.id).reduce((t, it) => t + valorItem(it, conta.cenario), 0);
              return (
                <div key={f.id} className="cdf:flex cdf:flex-col cdf:gap-1.5 cdf:rounded-xl cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie cdf:px-4 cdf:py-3.5">
                  <strong className="cdf:font-display cdf:text-[20px] cdf:font-black cdf:leading-tight cdf:text-primaria">{f.nome}</strong>
                  <span className="cdf:text-[13px] cdf:text-tinta-2">{f.descricao}</span>
                  <span className="cdf:mt-1 cdf:text-sm cdf:text-fraco">
                    {abertasF.length ? abertasF.length + (abertasF.length === 1 ? " tarefa aberta" : " tarefas abertas") : ts.length ? "tudo concluído" : "sem tarefas"}
                    {atrasadasF > 0 && <span className="cdf:font-bold cdf:text-erro">, {atrasadasF} atrasada{atrasadasF > 1 ? "s" : ""}</span>}
                    {valor > 0 && <> · {brl(valor)}</>}
                  </span>
                  <div><Botao mini className="cdf:font-sans" onClick={() => abrirAba(f.id)}>Abrir {f.nome}</Botao></div>
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
            {[...atrasadas, ...proximas].map((t) => <LinhaTarefa key={t.id} base={base} t={t} />)}
            {!atrasadas.length && !proximas.length && <tr><Td colSpan={5}><span className="cdf:text-fraco">As tarefas abertas não têm prazo.</span></Td></tr>}
          </tbody>
        </Tabela>
      )}
      {atrasadas.length > 0 && <p className="cdf:m-0 cdf:mt-2 cdf:text-sm cdf:text-fraco">As atrasadas vêm primeiro; depois, as seis próximas por prazo.</p>}

      <h2 className={SECAO}>Orçamento por categoria<Botao mini className="cdf:ml-auto cdf:font-sans" onClick={() => abrirAba("orcamento")}>Itens do núcleo</Botao></h2>
      {!categorias.length ? (
        <p className="cdf:m-0 cdf:text-sm cdf:text-fraco">Nenhum item de orçamento classificado neste núcleo. Ao editar um item no Orçamento, escolha o núcleo; ele passa a aparecer aqui.</p>
      ) : (
        <Tabela>
          <thead><tr><Th>Categoria</Th><Th className={NUM}>Valor</Th><Th className={NUM}>% do núcleo</Th></tr></thead>
          <tbody>
            {categorias.map(([cid, v]) => (
              <tr key={cid}>
                <Td>{cid === "_sem" ? "Sem categoria" : rotulo(p, "categoriasOrcamento", cid)}</Td>
                <Td className={NUM}>{brl(v)}</Td>
                <Td className={NUM}>{pctTexto(v, orcamento)}</Td>
              </tr>
            ))}
            <tr className="cdf:font-bold"><Td>Total do núcleo</Td><Td className={NUM}>{brl(orcamento)}</Td><Td className={NUM}>{pctTexto(orcamento, conta.subtotal)} do festival</Td></tr>
          </tbody>
        </Tabela>
      )}

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
