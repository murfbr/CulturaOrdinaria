/* Edições de um projeto com página própria: os totais que a página grava no
   projeto (resumoEdicoes). Um bloco para a ficha (Geral) e uma linha para o
   cartão da visão geral. O detalhe abre na página. */
import { paginaDoProjeto } from "../../store/central";
import { ROTULO_STATUS_EDICAO, type Projeto, type ResumoEdicao } from "../../types";
import { formatarData } from "../../utils";

/** Dinheiro inteiro, como na página: "R$ 39.914" ("−R$ 4.250" quando negativo). */
const R = (n: number) => (n < 0 ? "−" : "") + "R$ " + Math.round(Math.abs(n)).toLocaleString("pt-BR");

const proximaOuUltima = (lista: ResumoEdicao[]): ResumoEdicao | undefined =>
  lista.find((e) => e.status !== "fechada") || lista[lista.length - 1];

export function EdicoesDoProjeto({ p }: { p: Projeto }) {
  const pagina = paginaDoProjeto(p.id);
  const lista = p.resumoEdicoes || [];
  if (!lista.length && !pagina) return null;
  return (
    <div className="bloco">
      <div className="bloco-h">
        <h4>Edições</h4>
        <span className="cont">
          {pagina && <a className="btn sm" href={"/" + pagina.slug + "/"}>abrir a página ↗</a>}
        </span>
      </div>
      {lista.length ? (
        <table>
          <thead>
            <tr>
              <th>Edição</th><th>Data</th><th>Status</th>
              <th className="num">Previsto</th><th className="num">Contratado</th><th className="num">Pago</th>
              <th className="num">Realizado</th><th className="num">Receita</th><th className="num">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((e) => (
              <tr key={e.id}>
                <td><b>{e.nome}</b></td>
                <td>{e.data ? formatarData(e.data) : "—"}</td>
                <td>{ROTULO_STATUS_EDICAO[e.status] || e.status}</td>
                <td className="num">{R(e.previsto)}</td>
                <td className="num">{R(e.contratado)}</td>
                <td className="num">{R(e.pago)}</td>
                <td className="num">{e.realizado ? R(e.realizado) : "—"}</td>
                <td className="num">{R(e.receita)}</td>
                <td className="num" style={{ fontWeight: 700, color: e.resultado < 0 ? "var(--no)" : "var(--ok)" }}>{R(e.resultado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="vazio">a página ainda não gravou totais</p>
      )}
      <p className="hint" style={{ marginTop: 8 }}>Totais gravados pela página própria a cada mudança; o detalhe (linhas de custo, máquinas, cronograma) fica lá.</p>
    </div>
  );
}

/** Uma linha para o cartão do projeto: a próxima edição (ou a última fechada) e o resultado. */
export function ResumoEdicoesCartao({ p }: { p: Projeto }) {
  const e = proximaOuUltima(p.resumoEdicoes || []);
  if (!e) return null;
  return (
    <div className="ref">
      {e.nome}{e.data ? " · " + formatarData(e.data) : ""} · {e.status === "fechada" ? "resultado " : "projeção "}{R(e.resultado)}
    </div>
  );
}
