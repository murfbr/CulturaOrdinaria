/* O rodapé de cada aba de frente da comunicação: as tarefas da frente (as
   abertas, atrasadas primeiro) e os itens de orçamento da frente no cenário
   em vigor, com os botões para as abas Tarefas e Orçamento do núcleo. */
import { brl, calcularOrcamento, dataBr, nomeCadastro, respEfetivo, rotuloCenario, tarefaAtrasada, valorItem } from "../calculo";
import { rotulo } from "../listas";
import { PilulaPrioridade, classeStatusTarefa } from "../tarefas/etiquetas";
import type { Base, Nucleo } from "../tipos";
import { Botao } from "../ui/Botao";
import { SECAO } from "../ui/classes";
import { NUM, Tabela, Td, Th } from "../ui/Tabela";
import { Pilula } from "../ui/Tag";
import type { AbaNucleo } from "../vista";
import { itensDaFrente, tarefasDaFrente, type Frente } from "./frentes";

interface Props { base: Base; nucleo: Nucleo; frente: Frente; abrirAba: (a: AbaNucleo) => void }

export function BlocoFrente({ base, nucleo, frente, abrirAba }: Props) {
  const p = base.pagina;
  const tarefas = tarefasDaFrente(base, nucleo.id, frente);
  const abertas = tarefas.filter((t) => t.status !== "concluido").sort((a, b) => Number(tarefaAtrasada(b)) - Number(tarefaAtrasada(a)) || String(a.prazo || "9999").localeCompare(String(b.prazo || "9999")));
  const feitas = tarefas.length - abertas.length;
  const conta = calcularOrcamento(base);
  const itens = itensDaFrente(base, nucleo.id, frente);
  const total = itens.reduce((t, it) => t + valorItem(it, conta.cenario), 0);

  return (
    <>
      <h2 className={SECAO}>Tarefas da frente<Botao mini className="cdf:ml-auto cdf:font-sans" onClick={() => abrirAba("tarefas")}>Todas as tarefas do núcleo</Botao></h2>
      {!abertas.length ? <p className="cdf:m-0 cdf:text-sm cdf:text-fraco">{tarefas.length ? "Tudo concluído nesta frente." : "Nenhuma tarefa do núcleo cai nesta frente. As tarefas se classificam pela frente do plano (a palavra em maiúsculas no título)."}</p> : (
        <Tabela>
          <thead><tr><Th>Tarefa</Th><Th>Responsável</Th><Th>Prazo</Th><Th>Prioridade</Th><Th>Status</Th></tr></thead>
          <tbody>
            {abertas.map((t) => {
              const atrasada = tarefaAtrasada(t);
              const resp = respEfetivo(base, t);
              return (
                <tr key={t.id}>
                  <Td>{t.codigo && <span className="cdf:mr-1.5 cdf:text-[12.5px] cdf:text-fraco">{t.codigo}</span>}<strong>{t.titulo}</strong>{t.frente && <span className="cdf:block cdf:text-[13px] cdf:text-fraco">{t.frente}</span>}</Td>
                  <Td>{resp ? nomeCadastro(base, resp) : <span className="cdf:text-fraco">—</span>}</Td>
                  <Td className={atrasada ? "cdf:font-bold cdf:text-erro" : undefined}>{dataBr(t.prazo)}{atrasada && " (venceu)"}</Td>
                  <Td><PilulaPrioridade t={t} vazio="—" /></Td>
                  <Td><Pilula classe={classeStatusTarefa(t.status)}>{rotulo(p, "statusTarefa", t.status)}</Pilula></Td>
                </tr>
              );
            })}
          </tbody>
        </Tabela>
      )}
      {feitas > 0 && <p className="cdf:m-0 cdf:mt-2 cdf:text-sm cdf:text-fraco">{feitas} concluída{feitas > 1 ? "s" : ""} nesta frente.</p>}

      <h2 className={SECAO}>Orçamento da frente<Botao mini className="cdf:ml-auto cdf:font-sans" onClick={() => abrirAba("orcamento")}>Orçamento do núcleo</Botao></h2>
      {!itens.length ? <p className="cdf:m-0 cdf:text-sm cdf:text-fraco">Nenhum item de orçamento do núcleo nesta frente.</p> : (
        <Tabela>
          <thead><tr><Th>Item</Th><Th>Categoria</Th><Th>Status</Th><Th className={NUM}>Cenário {rotuloCenario(conta.cenario)}</Th></tr></thead>
          <tbody>
            {itens.map((it) => (
              <tr key={it.id}>
                <Td><strong>{it.nome}</strong>{it.anotacoes && <span className="cdf:block cdf:text-[13px] cdf:text-fraco">{it.anotacoes}</span>}</Td>
                <Td>{rotulo(p, "categoriasOrcamento", it.categoria)}</Td>
                <Td>{rotulo(p, "statusOrcamento", it.status)}</Td>
                <Td className={NUM}>{brl(valorItem(it, conta.cenario))}</Td>
              </tr>
            ))}
            <tr className="cdf:font-bold"><Td colSpan={3}>Total da frente</Td><Td className={NUM}>{brl(total)}</Td></tr>
          </tbody>
        </Tabela>
      )}
    </>
  );
}
