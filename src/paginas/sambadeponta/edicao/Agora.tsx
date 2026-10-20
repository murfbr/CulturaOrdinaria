/* "Agora", no Resumo da edição: o que pede atenção, puxado das outras abas
   (decisões sem decisão final, urgências abertas, quem falta avisar, tarefas
   atrasadas). Compensa o que as abas escondem; cada cartão leva à aba dele. */
import { br, hojeIso, tarefasDaEdicao, urgentesDaEdicao } from "../calculo";
import { ROTULO_STATUS_DECISAO } from "./pedidos";
import type { Edicao, Painel } from "../tipos";
import type { Aba, IrPara } from "../visao";

interface Cartao { aba: Aba; rotulo: string; n: number; legenda: string; itens: string[]; vazio: string }

const MAX_ITENS = 4;

export function Agora({ painel, e, irPara }: { painel: Painel; e: Edicao; irPara: IrPara }) {
  if (e.status === "fechada") return null;
  const hoje = hojeIso();
  const decisoes = (e.decisoes || []).filter((d) => d.status !== "decidida");
  const urgentes = urgentesDaEdicao(painel, e).filter((t) => t.status !== "feito");
  const avisos = e.avisos || [];
  const faltaAvisar = avisos.filter((a) => !a.avisado);
  const atrasadas = tarefasDaEdicao(painel, e)
    .filter((t) => t.status !== "feito" && t.prazo && t.prazo < hoje)
    .sort((a, b) => a.prazo.localeCompare(b.prazo));

  const cartoes: Cartao[] = [
    { aba: "decisoes", rotulo: "Decisões", n: decisoes.length, legenda: "sem decisão final",
      itens: decisoes.map((d) => d.tema + " · " + ROTULO_STATUS_DECISAO[d.status]), vazio: "Nada em aberto." },
    { aba: "decisoes", rotulo: "Urgências", n: urgentes.length, legenda: "em aberto",
      itens: urgentes.map((t) => t.titulo + (t.prazo ? " · até " + br(t.prazo) : "")), vazio: "Nenhuma urgência fixada." },
    { aba: "decisoes", rotulo: "Quem avisar", n: faltaAvisar.length, legenda: avisos.length ? `de ${avisos.length} por avisar` : "por avisar",
      itens: faltaAvisar.map((a) => a.nome), vazio: avisos.length ? "Todo mundo avisado." : "Lista vazia." },
    { aba: "tarefas", rotulo: "Tarefas atrasadas", n: atrasadas.length, legenda: "com prazo vencido",
      itens: atrasadas.map((t) => t.titulo + " · " + br(t.prazo)), vazio: "Nada atrasado." },
  ];

  return (
    <section id="e-agora">
      <div className="sechead"><div><div className="sdp-eyebrow">Agora</div><h2>O que pede atenção</h2></div></div>
      <div className="sdp-grid sdp-g4 agora">
        {cartoes.map((c) => (
          <button className={"sdp-card agora-cartao" + (c.n ? " alerta" : "")} key={c.rotulo} onClick={() => irPara({ sec: "edicao", id: e.id, aba: c.aba })}>
            <div className="k">{c.rotulo}</div>
            <div className="v">{c.n}</div>
            <div className="foot">{c.legenda}</div>
            {c.itens.length > 0
              ? (
                <ul>
                  {c.itens.slice(0, MAX_ITENS).map((t, i) => <li key={i}>{t}</li>)}
                  {c.itens.length > MAX_ITENS && <li className="mais">+ {c.itens.length - MAX_ITENS}</li>}
                </ul>
              )
              : <p className="vazio">{c.vazio}</p>}
            <span className="ir">abrir {c.aba === "tarefas" ? "Tarefas" : "Decisões"} →</span>
          </button>
        ))}
      </div>
    </section>
  );
}
