/* Edições de um projeto com página própria: os totais que a página grava no
   projeto (resumoEdicoes). Um painel com tabela para a ficha (Geral) e uma
   linha para o cartão da visão geral. O detalhe abre na página. */
import { paginaDoProjeto } from "../../store/central";
import { Dica } from "../../components/ui/Dica";
import { Painel } from "../../components/ui/Painel";
import { Tabela, Td, Th } from "../../components/ui/Tabela";
import { Vazio } from "../../components/ui/Vazio";
import { ESTILO_LINK } from "../../components/ui/estilos";
import { ROTULO_STATUS_EDICAO, type Projeto, type ResumoEdicao } from "../../types";
import { formatarData } from "../../utils";
import { cx } from "../../utils/classes";

/** Dinheiro inteiro, como na página: "R$ 39.914" ("−R$ 4.250" quando negativo). */
const R = (n: number) => (n < 0 ? "−" : "") + "R$ " + Math.round(Math.abs(n)).toLocaleString("pt-BR");

const proximaOuUltima = (lista: ResumoEdicao[]): ResumoEdicao | undefined =>
  lista.find((e) => e.status !== "fechada") || lista[lista.length - 1];

export function EdicoesDoProjeto({ p }: { p: Projeto }) {
  const pagina = paginaDoProjeto(p.id);
  const lista = p.resumoEdicoes || [];
  if (!lista.length && !pagina) return null;
  return (
    <Painel titulo="Edições" acoes={pagina && <a className={ESTILO_LINK} href={"/" + pagina.slug + "/"}>abrir a página ↗</a>}>
      {lista.length ? (
        <Tabela simples minima="min-w-[640px]">
          <thead>
            <tr>
              <Th>Edição</Th><Th>Data</Th><Th>Status</Th>
              <Th className="text-right">Previsto</Th><Th className="text-right">Contratado</Th><Th className="text-right">Pago</Th>
              <Th className="text-right">Realizado</Th><Th className="text-right">Receita</Th><Th className="text-right">Resultado</Th>
            </tr>
          </thead>
          <tbody>
            {lista.map((e) => (
              <tr key={e.id}>
                <Td><b>{e.nome}</b></Td>
                <Td>{e.data ? formatarData(e.data) : "—"}</Td>
                <Td>{ROTULO_STATUS_EDICAO[e.status] || e.status}</Td>
                <Td numerico>{R(e.previsto)}</Td>
                <Td numerico>{R(e.contratado)}</Td>
                <Td numerico>{R(e.pago)}</Td>
                <Td numerico>{e.realizado ? R(e.realizado) : "—"}</Td>
                <Td numerico>{R(e.receita)}</Td>
                <Td numerico className={cx("font-bold", e.resultado < 0 ? "text-no" : "text-ok")}>{R(e.resultado)}</Td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      ) : (
        <Vazio emLinha>a página ainda não gravou totais</Vazio>
      )}
      <Dica className="mt-2">Totais gravados pela página própria a cada mudança; o detalhe (linhas de custo, máquinas, cronograma) fica lá.</Dica>
    </Painel>
  );
}

/** Uma linha para o cartão do projeto: a próxima edição (ou a última fechada) e o resultado. */
export function ResumoEdicoesCartao({ p }: { p: Projeto }) {
  const e = proximaOuUltima(p.resumoEdicoes || []);
  if (!e) return null;
  return (
    <div className="mt-1.5 text-xs text-muted">
      {e.nome}{e.data ? " · " + formatarData(e.data) : ""} · {e.status === "fechada" ? "resultado " : "projeção "}{R(e.resultado)}
    </div>
  );
}
