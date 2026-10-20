/* Menu lateral: assinatura da Ponta de Lança, links da festa, as edições com
   o status e as abas da edição aberta, "+ Nova edição", indicador de
   salvamento (o mesmo do cabeçalho da Central), sair e a volta para a Central. */
import { Fragment, useEffect, useState, useSyncExternalStore } from "react";
import { Banco, type StatusSalvamento } from "../../services/banco";
import { sair, usarSessao } from "../../services/sessao";
import { toast } from "../../components/Toast";
import { ROTULO_STATUS_EDICAO, br, brCompleta } from "./calculo";
import { novaEdicao } from "./dados";
import { abaValida, abasDaEdicao } from "./edicao/abas";
import type { Painel } from "./tipos";
import type { IrPara, Visao } from "./visao";

/** Assinatura horizontal em Marfim, do design system (vetorizada do original). */
export const ASSINATURA_MARFIM = "/pontadelanca/assinatura-horizontal-marfim.svg";

/** [âncora, rótulo, é sub-item]. */
const LINKS_FESTA: [string, string, boolean][] = [
  ["l-visao", "Visão geral", false], ["l-comparativo", "Comparativo", true], ["l-aprendizados", "Aprendizados", true],
  ["l-checklist", "Checklist-mestre", true], ["l-fornecedores", "Fornecedores", true], ["l-ajuda", "Como usar", true],
];

function usarStatusBanco(): StatusSalvamento {
  return useSyncExternalStore((cb) => Banco.aoMudarStatus(cb), () => Banco.statusAtual());
}

/** Âncora da seção visível da festa (a última cujo topo já passou), como o scroll spy do artefato. */
function usarAncoraAtiva(ancoras: string[]): string {
  const [ativa, setAtiva] = useState(ancoras[0] || "");
  const chave = ancoras.join("|");
  useEffect(() => {
    const medir = () => {
      const secoes = ancoras.map((id) => document.getElementById(id));
      let i = secoes.length;
      while (--i > 0 && (!secoes[i] || window.scrollY + 140 < secoes[i]!.offsetTop));
      setAtiva(ancoras[Math.max(0, i)] || "");
    };
    medir();
    window.addEventListener("scroll", medir, { passive: true });
    return () => window.removeEventListener("scroll", medir);
  }, [chave]); // eslint-disable-line react-hooks/exhaustive-deps
  return ativa;
}

interface Props { painel: Painel; visao: Visao; aberto: boolean; irPara: IrPara }

export function MenuLateral({ painel, visao, aberto, irPara }: Props) {
  const status = usarStatusBanco();
  const sessao = usarSessao();
  const edicaoAberta = visao.sec === "edicao" ? painel.edicoes.find((e) => e.id === visao.id) : undefined;
  const ativa = usarAncoraAtiva(edicaoAberta ? [] : LINKS_FESTA.map(([a]) => a));
  const abaAberta = edicaoAberta && visao.sec === "edicao" ? abaValida(edicaoAberta, visao.aba) : undefined;
  const edicoes = [...painel.edicoes].reverse();

  function criar() {
    const nova = novaEdicao(painel);
    if (nova) { toast("Edição criada"); irPara({ sec: "edicao", id: nova.id }); }
  }

  return (
    <nav className={"sdp-side" + (aberto ? " open" : "")}>
      <a className="sdp-brand" href="#" onClick={(ev) => { ev.preventDefault(); irPara({ sec: "festa" }, "l-visao"); }}>
        <img src={ASSINATURA_MARFIM} alt={painel.titulo} />
      </a>

      <div className="group">A festa</div>
      {LINKS_FESTA.map(([ancora, rotulo, sub]) => (
        <a key={ancora} href={"#" + ancora}
          className={(sub ? "sub" : "") + (visao.sec === "festa" && ativa === ancora ? " active" : "")}
          onClick={(ev) => { ev.preventDefault(); irPara({ sec: "festa" }, ancora); }}>
          {rotulo}
        </a>
      ))}

      <div className="group">Edições</div>
      {edicoes.map((e) => {
        const atual = edicaoAberta?.id === e.id;
        return (
          <Fragment key={e.id}>
            <a href={"#" + e.id + "/resumo"} className={"ed" + (atual ? " aberta" : "")}
              onClick={(ev) => { ev.preventDefault(); irPara({ sec: "edicao", id: e.id, aba: "resumo" }); }}>
              <span className="ed-head">
                <span>{e.nome} · {br(e.data) || "sem data"}</span>
                <span className={"pill " + (e.status === "execucao" ? "exec" : e.status === "planejada" ? "plan" : "")}>{ROTULO_STATUS_EDICAO[e.status]}</span>
              </span>
            </a>
            {atual && abasDaEdicao(e).map((a) => (
              <a key={a.id} href={"#" + e.id + "/" + a.id} className={"sub" + (abaAberta === a.id ? " active" : "")}
                onClick={(ev) => { ev.preventDefault(); irPara({ sec: "edicao", id: e.id, aba: a.id }); }}>
                {a.id === "decisoes" ? "Decisões e urgências" : a.rotulo}
              </a>
            ))}
          </Fragment>
        );
      })}

      <div className="navfoot">
        <button className="sdp-btn ghost small" onClick={criar}>+ Nova edição</button>
        <a className="sdp-btn ghost small" href="/">← Central</a>
        <div className="estado">
          <span><span className={"ponto " + status.classe} />{status.texto}</span>
          <span>atualizado em {brCompleta(painel.pagina.meta?.atualizadoEm)}</span>
          {sessao.usuario && <button onClick={() => void sair()}>sair ({sessao.usuario.email})</button>}
        </div>
      </div>
    </nav>
  );
}
