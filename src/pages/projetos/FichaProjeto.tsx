/* Ficha do projeto, em página: cabeçalho com status, artistas, edital e
   formulário; abas Geral (dados, proponente, anotações, documentos, produção,
   tarefas), Formulário (as respostas no formulário do edital), Transferência
   (copiar para a plataforma oficial) e Contexto (fichas e regras ligadas). */
import { useState, type ReactNode } from "react";
import { usarCentral } from "../../store/central";
import { arquivarProjeto, duplicarProjeto, moverProjeto, definirStatusProjeto, salvarRegistro } from "../../store/mutacoes";
import { abrirDetalhe, abrirProjeto, fecharDetalhe, mudarSubAba } from "../../store/navegacao";
import { abrirEdicao } from "../../store/edicao";
import { editalDoProjeto, nomeCurto } from "../../lib/nomes";
import { normalizarRascunho } from "../../lib/simulador/motor";
import { toast } from "../../components/Toast";
import { STATUS_PROJETO, type Projeto, type StatusProjeto } from "../../types";
import { clonar } from "../../utils";
import { GeralProjeto } from "./GeralProjeto";
import { FormularioRascunho } from "./formulario/Formulario";
import { Transferencia } from "./Transferencia";
import { ContextoProjeto } from "./ContextoProjeto";
import { usarExclusaoProjeto } from "./exclusao";

const CHAVE_ETAPA = "central-proj-etapa-v1";
const lerEtapas = (): Record<string, number> => {
  try { return JSON.parse(localStorage.getItem(CHAVE_ETAPA) || "{}"); } catch { return {}; }
};

export function FichaProjeto({ p, sub }: { p: Projeto; sub: string }) {
  const { painel, rascunhos, formularios } = usarCentral();
  const [etapas, setEtapas] = useState<Record<string, number>>(lerEtapas);
  const exclusao = usarExclusaoProjeto(() => fecharDetalhe());
  const edital = editalDoProjeto(p);
  const form = p.formId !== "livre" ? formularios[p.formId] : undefined;
  const rascunho = p.rascunhoId ? rascunhos[p.rascunhoId] : undefined;
  const temFormulario = p.formId !== "livre";
  const aba = !temFormulario && (sub === "formulario" || sub === "transferencia") ? "geral" : sub;

  function irEtapa(ei: number) {
    const novo = { ...etapas, [p.id]: ei };
    setEtapas(novo);
    try { localStorage.setItem(CHAVE_ETAPA, JSON.stringify(novo)); } catch { /* sem localStorage */ }
  }

  let corpo;
  if (aba === "formulario" || aba === "transferencia") {
    if (!rascunho) {
      corpo = <div className="vazio-msg">Este projeto ainda não tem as respostas do formulário. Abra a aba Geral e escolha o formulário de novo para criar.</div>;
    } else if (aba === "formulario") {
      corpo = <FormularioRascunho projeto={p} rascunho={normalizarRascunho(clonar(rascunho))} etapaAberta={etapas[p.id] || 0} aoMudarEtapa={irEtapa} />;
    } else {
      corpo = <Transferencia projeto={p} rascunho={normalizarRascunho(clonar(rascunho))} />;
    }
  } else if (aba === "contexto") {
    corpo = <ContextoProjeto p={p} />;
  } else {
    corpo = <GeralProjeto p={p} />;
  }

  const abas: [string, string, boolean][] = [
    ["geral", "Geral", true],
    ["formulario", "Formulário", temFormulario],
    ["transferencia", "Transferência", temFormulario],
    ["contexto", "Contexto", true],
  ];

  return (
    <>
      <button className="voltar" onClick={fecharDetalhe}>← Projetos</button>
      <div className="proj-h">
        <div className="proj-h-l">
          <input type="text" className="nome" value={p.nome} aria-label="nome do projeto"
            onChange={(e) => salvarRegistro("projetos", { ...clonar(p), nome: e.target.value }, false)} />
          <div className="proj-sub">
            {p.artistaIds.length
              ? p.artistaIds.map((id) => {
                const a = painel.artistas.find((x) => x.id === id);
                return a ? <a key={id} href="#" onClick={(e) => { e.preventDefault(); abrirDetalhe("artista", id); }}>{a.nome}</a> : null;
              }).reduce<ReactNode[]>((acc, el, i) => (i ? [...acc, ", ", el] : [el]), [])
              : <span className="muted">sem artista</span>}
            {" · "}
            {edital
              ? <a href="#" onClick={(e) => { e.preventDefault(); abrirDetalhe("edital", edital.id); }}>{nomeCurto(edital)}</a>
              : <span className="muted">sem edital</span>}
            {" · "}
            {temFormulario
              ? <a href="#" onClick={(e) => { e.preventDefault(); abrirDetalhe("formulario", p.formId); }}>
                formulário {form?.nome || p.formId}{form?.origem === "documento" ? " (dos documentos)" : ""}
              </a>
              : <span>Livre</span>}
            {p.grupo && <> · <span className="muted">parte de {p.grupo}</span></>}
            {p.arquivado && <> · <span className="badge st-closed">arquivado</span></>}
          </div>
        </div>
        <div className="proj-status">
          <button className="btn sm" title="status anterior" onClick={() => moverProjeto(p, -1)}>◀</button>
          <select className={"sel-status " + (STATUS_PROJETO.find((s) => s.id === p.status)?.classe || "")} value={p.status}
            onChange={(e) => definirStatusProjeto(p, e.target.value as StatusProjeto)}>
            {STATUS_PROJETO.map((s) => <option key={s.id} value={s.id}>{s.rotulo}</option>)}
          </select>
          <button className="btn sm" title="próximo status" onClick={() => moverProjeto(p, 1)}>▶</button>
        </div>
        <div className="acts">
          <button className="btn sm" onClick={() => abrirEdicao("projeto", p.id)}>Editar dados</button>
          <button className="btn sm" onClick={() => { const id = duplicarProjeto(p); toast("Projeto duplicado"); abrirProjeto(id); }}>Duplicar</button>
          <button className="btn sm" onClick={() => { arquivarProjeto(p, !p.arquivado); toast(p.arquivado ? "Projeto reaberto" : "Projeto arquivado"); }}>
            {p.arquivado ? "Reabrir" : "Arquivar"}
          </button>
          <button className="btn sm quiet danger" onClick={() => exclusao.pedir(p)}>Excluir</button>
        </div>
      </div>

      <div className="mesa-tabs">
        {abas.filter(([, , ok]) => ok).map(([k, rotulo]) => (
          <button key={k} className={aba === k ? "on" : ""} onClick={() => mudarSubAba(k)}>{rotulo}</button>
        ))}
      </div>

      {corpo}
      {exclusao.modal}
    </>
  );
}
