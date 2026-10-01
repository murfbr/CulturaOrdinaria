/* Menu lateral do artefato: marca, links da festa, as edições com o status
   e as seções da edição aberta, "+ Nova edição", indicador de salvamento
   (o mesmo do cabeçalho da Central), sair e a volta para a Central. */
import { Fragment, useEffect, useState, useSyncExternalStore } from "react";
import { Banco, type StatusSalvamento } from "../../services/banco";
import { sair, usarSessao } from "../../services/sessao";
import { toast } from "../../components/Toast";
import { ROTULO_STATUS_EDICAO, br, brCompleta } from "./calculo";
import { novaEdicao } from "./dados";
import type { Painel } from "./tipos";
import type { IrPara, Visao } from "./visao";

/** [âncora, rótulo, é sub-item]. */
const LINKS_FESTA: [string, string, boolean][] = [
  ["l-visao", "Visão geral", false], ["l-comparativo", "Comparativo", true], ["l-aprendizados", "Aprendizados", true],
  ["l-checklist", "Checklist-mestre", true], ["l-fornecedores", "Fornecedores", true], ["l-ajuda", "Como usar", true],
];

const secoesEdicao = (fechada: boolean): [string, string][] => [
  ["e-resumo", "Resumo"], ["e-orcamento", "Orçamento"],
  ...(fechada ? [] : [["e-simulacao", "Simulação"] as [string, string]]),
  ["e-tarefas", "Tarefas"], ["e-cronograma", "Cronograma"], ["e-maquinas", "Máquinas"],
  ["e-comunicacao", "Comunicação"], ["e-fechamento", "Fechamento"],
];

function usarStatusBanco(): StatusSalvamento {
  return useSyncExternalStore((cb) => Banco.aoMudarStatus(cb), () => Banco.statusAtual());
}

/** Âncora da seção visível (a última cujo topo já passou), como o scroll spy do artefato. */
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
  const ancoras = edicaoAberta ? secoesEdicao(edicaoAberta.status === "fechada").map(([a]) => a) : LINKS_FESTA.map(([a]) => a);
  const ativa = usarAncoraAtiva(ancoras);
  const edicoes = [...painel.edicoes].reverse();

  function criar() {
    const nova = novaEdicao(painel);
    if (nova) { toast("Edição criada"); irPara({ sec: "edicao", id: nova.id }); }
  }

  return (
    <nav className={"sdp-side" + (aberto ? " open" : "")}>
      <div className="sdp-brand">
        <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path d="M20 3 L27 15 L22 15 L22 30 L18 30 L18 15 L13 15 Z" fill="#97C230" />
          <path d="M20 3 L23 8 L17 8 Z" fill="#FFFFCB" />
        </svg>
        <b>Samba<br />de Ponta</b>
      </div>

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
            <a href="#e-resumo" className={atual && ativa === "e-resumo" ? "active" : ""}
              onClick={(ev) => { ev.preventDefault(); irPara({ sec: "edicao", id: e.id }, "e-resumo"); }}>
              <span className="ed-head">
                <span>{e.nome} · {br(e.data) || "sem data"}</span>
                <span className={"pill " + (e.status === "execucao" ? "exec" : e.status === "planejada" ? "plan" : "")}>{ROTULO_STATUS_EDICAO[e.status]}</span>
              </span>
            </a>
            {atual && secoesEdicao(e.status === "fechada").map(([ancora, rotulo]) => (
              <a key={ancora} href={"#" + ancora} className={"sub" + (ativa === ancora ? " active" : "")}
                onClick={(ev) => { ev.preventDefault(); irPara({ sec: "edicao", id: e.id }, ancora); }}>
                {rotulo}
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
