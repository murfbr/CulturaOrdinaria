/* Ficha de um formulário: de onde veio (plataforma ou documentos), confiança,
   editais que o usam, como a plataforma funciona e a estrutura inteira —
   etapas, blocos e campos, com limite, obrigatoriedade e conceito. */
import { useState } from "react";
import { usarCentral } from "../../../store/central";
import { abrirDetalhe, abrirProjeto, fecharDetalhe } from "../../../store/navegacao";
import { PLATAFORMAS, nomePlataforma } from "../../../data";
import { nomeCurto, prazoCurto } from "../../../lib/nomes";
import { ModalNovoProjeto } from "../../projetos/ModalNovoProjeto";
import { CONCEITOS_CAMPO, ROTULO_STATUS_PROJETO } from "../../../types";
import { url } from "../../../utils";
import { contarCampos } from "./ListaFormularios";

const TIPO_CAMPO: Record<string, string> = {
  txt: "texto curto", ta: "texto longo", sel: "lista", rad: "escolha única", chk: "múltipla escolha",
  date: "data", rep: "lista repetível", docs: "checklist de anexos", anexo: "anexo", orc: "planilha orçamentária",
  orcresumo: "resumo do orçamento", info: "informativo",
};

export function FichaFormulario({ id }: { id: string }) {
  const { painel, formularios } = usarCentral();
  const [novoProjeto, setNovoProjeto] = useState(false);
  const f = formularios[id];
  if (!f) {
    return (
      <>
        <button className="back" onClick={fecharDetalhe}>← Voltar para Formulários</button>
        <p className="muted">Formulário <span className="mono">{id}</span> não está no banco (ainda carregando, ou foi excluído).</p>
      </>
    );
  }
  const plat = PLATAFORMAS.find((p) => p.id === f.plataforma);
  const editais = painel.editais.filter((e) => e.formId === f.id || (e.formIds || []).includes(f.id) || (f.editais || []).includes(e.id));
  const projetos = painel.projetos.filter((p) => p.formId === f.id);
  const conceito = (k?: string) => (k ? CONCEITOS_CAMPO.find(([x]) => x === k)?.[1] || k : "");
  const doDocumento = f.origem === "documento";

  return (
    <>
      <button className="back" onClick={fecharDetalhe}>← Voltar para Formulários</button>
      <div className="dhead">
        <div className="avatar" style={{ background: doDocumento ? "linear-gradient(135deg,#8E5AA6,#D9A441)" : "linear-gradient(135deg,#2E9E5B,#5B6CB4)" }}>F</div>
        <div>
          <h2>{f.nome}</h2>
          <span className={"badge " + (doDocumento ? "st-prev" : "st-open")}>{doDocumento ? "mapeado dos documentos" : "mapeado na plataforma"}</span>{" "}
          <span className="muted" style={{ fontSize: 12.5 }}>· {nomePlataforma(f.plataforma)} · {f.etapas.length} etapa(s) · {contarCampos(f)} campos</span>
        </div>
        <span className="act"><button className="btn sm" onClick={() => setNovoProjeto(true)}>+ Novo projeto com este formulário</button></span>
      </div>

      <div className="dashgrid" style={{ marginTop: 14 }}>
        <div className="panel">
          <h4>Origem</h4>
          <div className="row-line"><span className="yr" style={{ flexBasis: 120, color: "var(--muted)" }}>Como foi mapeado</span>
            <span>{doDocumento
              ? "Reconstruído do documento do edital. A ordem e os nomes podem variar na plataforma, e não há os códigos dos campos."
              : "Extraído da plataforma real, campo a campo, com os códigos (name) de cada campo."}</span></div>
          <div className="row-line"><span className="yr" style={{ flexBasis: 120, color: "var(--muted)" }}>Fonte</span><span style={{ wordBreak: "break-word" }}>{f.fonte || (doDocumento ? "—" : "plataforma oficial")}</span></div>
          <div className="row-line"><span className="yr" style={{ flexBasis: 120, color: "var(--muted)" }}>Extraído em</span><span>{f.extraido || "—"}</span></div>
          {f.confianca && <div className="row-line"><span className="yr" style={{ flexBasis: 120, color: "var(--muted)" }}>Confiança</span><span className={"conf conf-" + f.confianca}>{f.confianca}</span></div>}
          {f.divergencias && <div className="row-line"><span className="yr" style={{ flexBasis: 120, color: "var(--muted)" }}>Divergências</span><span style={{ whiteSpace: "pre-wrap" }}>{f.divergencias}</span></div>}
          {f.obs && <div className="row-line"><span className="yr" style={{ flexBasis: 120, color: "var(--muted)" }}>Observação</span><span>{f.obs}</span></div>}
        </div>
        <div className="panel">
          <h4>Onde é usado</h4>
          {editais.map((e) => (
            <div className="row-line" key={e.id} style={{ cursor: "pointer" }} onClick={() => abrirDetalhe("edital", e.id)}>
              <span style={{ flex: 1 }}><b>{nomeCurto(e)}</b> <span className="muted">· {prazoCurto(e) || "sem prazo"}</span></span><span className="arrow">→</span>
            </div>
          ))}
          {!editais.length && <p className="muted" style={{ margin: 0 }}>Nenhum edital aponta para este formulário.</p>}
          {projetos.map((p) => (
            <div className="row-line" key={p.id} style={{ cursor: "pointer" }} onClick={() => abrirProjeto(p.id, "formulario")}>
              <span style={{ flex: 1 }}>{p.nome}{p.arquivado ? <span className="muted"> (arquivado)</span> : null}</span>
              <span className="badge b-type">{ROTULO_STATUS_PROJETO[p.status]}</span>
            </div>
          ))}
        </div>
      </div>

      {plat && (
        <div className="panel">
          <h4>Plataforma: {plat.nome}</h4>
          {plat.url && <div className="row-line"><span className="yr" style={{ flexBasis: 120, color: "var(--muted)" }}>Endereço</span><a className="lnk" href={url(plat.url)} target="_blank" rel="noopener noreferrer">{plat.url} ↗</a></div>}
          {([["Arquitetura", plat.arq], ["Porta de entrada", plat.porta], ["Códigos", plat.codigos], ["Limites", plat.limites], ["Anexos", plat.anexos], ["Armadilhas", plat.armadilhas]] as [string, string][])
            .filter(([, v]) => v).map(([k, v]) => (
              <div className="row-line" key={k}><span className="yr" style={{ flexBasis: 120, color: "var(--muted)" }}>{k}</span><span>{v}</span></div>
            ))}
        </div>
      )}

      {f.etapas.map((et, ei) => (
        <div className="panel" key={et.id}>
          <h4>{ei + 1}. {et.nome}{et.cod && <span className="mono-mini">{et.cod}</span>}</h4>
          {et.blocos.map((b, bi) => (
            <div key={bi} style={{ marginBottom: 10 }}>
              {b.t && b.t !== et.nome && <div className="sub-bloco">{b.t}</div>}
              <div className="tbl-wrap">
                <table>
                  <tbody>
                    {b.campos.map((c, ci) => (
                      <tr key={ci}>
                        <td style={{ width: "45%" }}>
                          <b>{c.l || (c.t === "info" ? "texto informativo" : "")}</b>{c.req ? <span className="muted"> *</span> : null}
                          {c.dica && <div className="muted" style={{ fontSize: 11.5 }}>{c.dica.length > 220 ? c.dica.slice(0, 220) + "…" : c.dica}</div>}
                        </td>
                        <td className="muted">{TIPO_CAMPO[c.t] || c.t}{c.opts?.length ? " (" + c.opts.length + " opções)" : ""}</td>
                        <td className="num">{c.max ? c.max.toLocaleString("pt-BR") + " car." : c.limiteTexto || ""}</td>
                        <td>{c.conceito && <span className="chip">{conceito(c.conceito)}</span>}</td>
                        <td className="muted" style={{ fontSize: 11 }}>{c.n && !c.n.startsWith("doc__") ? c.cod || c.n : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ))}

      {novoProjeto && <ModalNovoProjeto editalId={editais[0]?.id} aoFechar={() => setNovoProjeto(false)} />}
    </>
  );
}
