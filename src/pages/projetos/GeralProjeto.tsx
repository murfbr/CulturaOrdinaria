/* Aba Geral do projeto — a única de um projeto Livre e a seção interna de
   todos (nada daqui vai para a plataforma): dados e valores, proponente,
   anotações, agentes, cronograma interno, documentos da inscrição, produção,
   tarefas, alertas do edital e o histórico de status. */
import { useState, type ReactNode } from "react";
import { usarCentral } from "../../store/central";
import { salvarRegistro, trocarFormulario } from "../../store/mutacoes";
import { abrirDetalhe } from "../../store/navegacao";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { badgeTarefa, editalDoProjeto, nomeCurto, nomeEquipe, prazoCurto } from "../../lib/nomes";
import { temValor } from "../../lib/simulador/motor";
import { PERFIS_JURIDICOS } from "../../data";
import { ROTULO_STATUS_PROJETO, STATUS_EDITAL, type Projeto, type StatusProjeto } from "../../types";
import { clonar, formatarData, url } from "../../utils";

export function GeralProjeto({ p }: { p: Projeto }) {
  const { painel, rascunhos, formularios } = usarCentral();
  const [novoDoc, setNovoDoc] = useState("");
  const [novoItem, setNovoItem] = useState("");
  const edital = editalDoProjeto(p);
  const rascunho = p.rascunhoId ? rascunhos[p.rascunhoId] : undefined;
  const formularioVazio = !rascunho || !Object.values(rascunho.valores || {}).some(temValor);
  const tarefas = painel.tarefas.filter((t) => t.origem === "proj:" + p.id);
  const artistas = p.artistaIds.map((id) => painel.artistas.find((a) => a.id === id)).filter(Boolean);
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const dias = (s: string) => {
    if (!s) return "";
    const d = Math.round((new Date(s + "T00:00:00").getTime() - hoje.getTime()) / 864e5);
    return d === 0 ? "hoje" : d < 0 ? `${-d} d atrás` : `em ${d} d`;
  };

  /** Aplica uma mudança no projeto e grava (texto: com debounce). */
  const alterar = (fn: (c: Projeto) => void, rapido = true) => {
    const copia = clonar(p);
    fn(copia);
    salvarRegistro("projetos", copia, rapido);
  };

  const opcoesForm = Object.values(formularios)
    .filter((f) => !edital || !(edital.formIds?.length || edital.formId) || (edital.formIds || [edital.formId]).includes(f.id))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const linha = (rotulo: string, valor: ReactNode) => (
    <div className="g-lin"><span className="g-rot">{rotulo}</span><span className="g-val">{valor || <span className="muted">—</span>}</span></div>
  );

  return (
    <div className="geral-proj">
      <div className="bloco">
        <div className="bloco-h">
          <h4>Dados do projeto</h4>
          <span className="cont"><button className="btn sm" onClick={() => abrirEdicao("projeto", p.id)}>Editar dados</button></span>
        </div>
        {linha("Status", ROTULO_STATUS_PROJETO[p.status as StatusProjeto])}
        {linha("Artistas", artistas.length ? artistas.map((a, i) => (
          <span key={a!.id}>{i > 0 && ", "}<a href="#" onClick={(e) => { e.preventDefault(); abrirDetalhe("artista", a!.id); }}>{a!.nome}</a></span>
        )) : null)}
        {linha("Edital", edital ? (
          <>
            <a href="#" onClick={(e) => { e.preventDefault(); abrirDetalhe("edital", edital.id); }}>{edital.nome}</a>
            {" "}<span className={"badge " + (STATUS_EDITAL[edital.status]?.classe || "")}>{STATUS_EDITAL[edital.status]?.rotulo}</span>
            {edital.prazo && <span className="muted" title={edital.prazo}> · prazo {prazoCurto(edital)}</span>}
          </>
        ) : null)}
        {linha("Formulário", (
          <span className="g-form">
            {formularioVazio ? (
              <select value={p.formId} onChange={(e) => trocarFormulario(p, e.target.value)}>
                <option value="livre">Livre (sem formulário)</option>
                {opcoesForm.map((f) => <option key={f.id} value={f.id}>{f.nome}{f.origem === "documento" ? " (dos documentos)" : ""}</option>)}
                {p.formId !== "livre" && !formularios[p.formId] && <option value={p.formId}>{p.formId}</option>}
              </select>
            ) : (
              <>{formularios[p.formId]?.nome || p.formId} <span className="muted">(já tem respostas; para trocar, duplique o projeto)</span></>
            )}
          </span>
        ))}
        {linha("Responsável", p.respId ? nomeEquipe(p.respId) : "")}
        {linha("Equipe", (p.equipeIds || []).map(nomeEquipe).join(", "))}
        {linha("Tipo · janela", [p.tipo, p.ano].filter(Boolean).join(" · "))}
        {linha("Faz parte de", p.grupo)}
        {linha("Valores", [p.valorPedido && "pedido " + p.valorPedido, p.valorAprovado && "aprovado " + p.valorAprovado, p.valorCaptado && "captado " + p.valorCaptado].filter(Boolean).join(" · "))}
        {linha("Nº de inscrição", p.inscricao)}
        {linha("Resultado", p.resultado)}
        {linha("Pasta no Drive", p.linkDrive ? <a href={url(p.linkDrive)} target="_blank" rel="noopener noreferrer">📁 abrir ↗</a> : "")}
        {p.obs && linha("Observações", <span style={{ whiteSpace: "pre-wrap" }}>{p.obs}</span>)}
      </div>

      {edital?.alertas?.length ? (
        <div className="bloco alerta-bloco">
          <div className="bloco-h"><h4>Alertas do edital</h4><span className="cont">do Mapa dos Editais</span></div>
          {edital.alertas.map((a, i) => (
            <div className="alerta" key={i}>
              <div><b>{a.titulo}</b>{a.quando && <span className="muted"> · {a.quando}</span>}</div>
              <div className="alerta-t">{a.texto}</div>
              {a.fazer && <div className="alerta-f"><b>Fazer:</b> {a.fazer}</div>}
            </div>
          ))}
        </div>
      ) : null}

      <div className="bloco">
        <div className="bloco-h"><h4>Proponente</h4><span className="q">quem assina a inscrição (quase nunca é o artista)</span></div>
        <div className="prop">
          <div className="prop-l">
            <span className="eyebrow">nome</span>
            <input type="text" value={p.proponente.nome} placeholder="pessoa ou empresa que inscreve"
              onChange={(e) => alterar((c) => { c.proponente.nome = e.target.value; }, false)} />
          </div>
          <div className="prop-l">
            <span className="eyebrow">perfil jurídico</span>
            <select value={p.proponente.perfil} onChange={(e) => alterar((c) => { c.proponente.perfil = e.target.value; })}>
              {PERFIS_JURIDICOS.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div className="prop-l wide">
            <span className="eyebrow">observação</span>
            <input type="text" value={p.proponente.obs} placeholder="sem CPF, RG ou dados bancários aqui"
              onChange={(e) => alterar((c) => { c.proponente.obs = e.target.value; }, false)} />
          </div>
        </div>
      </div>

      <div className="bloco">
        <div className="bloco-h"><h4>Anotações gerais</h4><span className="cont">{p.interno.anot.length} / 3000</span></div>
        <textarea maxLength={3000} style={{ minHeight: 110 }} value={p.interno.anot}
          placeholder="ideias e pontos sobre o projeto, sem classificar"
          onChange={(e) => alterar((c) => { c.interno.anot = e.target.value; }, false)} />
      </div>

      <div className="bloco">
        <div className="bloco-h"><h4>Agentes envolvidos</h4></div>
        <div className="lista">
          {p.interno.agentes.map((a, k) => (
            <div className="lin ag" key={k}>
              <input type="text" value={a.nome} placeholder="nome"
                onChange={(e) => alterar((c) => { c.interno.agentes[k].nome = e.target.value; }, false)} />
              <select value={a.tipo} onChange={(e) => alterar((c) => { c.interno.agentes[k].tipo = e.target.value; })}>
                {["pessoa", "empresa", "coletivo"].map((t) => <option key={t}>{t}</option>)}
              </select>
              <select value={a.vinc} onChange={(e) => alterar((c) => { c.interno.agentes[k].vinc = e.target.value; })}>
                {["do coletivo", "do projeto cultural", "externo"].map((t) => <option key={t}>{t}</option>)}
              </select>
              <input type="text" value={a.papel} placeholder="papel neste projeto"
                onChange={(e) => alterar((c) => { c.interno.agentes[k].papel = e.target.value; }, false)} />
              <button type="button" className="x" aria-label="remover" onClick={() => alterar((c) => { c.interno.agentes.splice(k, 1); })}>×</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn sm" style={{ marginTop: 8 }}
          onClick={() => alterar((c) => { c.interno.agentes.push({ nome: "", tipo: "pessoa", vinc: "do coletivo", papel: "" }); })}>+ agente</button>
      </div>

      <div className="bloco">
        <div className="bloco-h">
          <h4>Cronograma interno</h4>
          <span className="cont">{p.interno.crono.filter((c) => c.ok).length} de {p.interno.crono.length} feitos</span>
        </div>
        <div className="lista">
          {p.interno.crono.map((marco, k) => (
            <div className={"lin cr" + (marco.ok ? " ok" : "")} key={k}>
              <button type="button" className={"ck" + (marco.ok ? " on" : "")} aria-label="marcar feito"
                onClick={() => alterar((c) => { c.interno.crono[k].ok = !c.interno.crono[k].ok; })}>{marco.ok ? "✓" : ""}</button>
              <input type="date" value={marco.data || ""} onChange={(e) => alterar((c) => { c.interno.crono[k].data = e.target.value; })} />
              <input type="text" value={marco.m} placeholder="o que fechar até essa data"
                onChange={(e) => alterar((c) => { c.interno.crono[k].m = e.target.value; }, false)} />
              <span className="dias">{marco.ok ? "feito" : dias(marco.data)}</span>
              <button type="button" className="x" aria-label="remover" onClick={() => alterar((c) => { c.interno.crono.splice(k, 1); })}>×</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn sm" style={{ marginTop: 8 }}
          onClick={() => alterar((c) => { c.interno.crono.push({ data: "", m: "", ok: false }); })}>+ marco</button>
      </div>

      <div className="bloco">
        <div className="bloco-h">
          <h4>Documentos da inscrição</h4>
          <span className="cont">{p.docs.filter((d) => d.ok).length} de {p.docs.length} prontos</span>
        </div>
        <div className="lista">
          {p.docs.map((d, k) => (
            <div className={"lin dc" + (d.ok ? " ok" : "")} key={k}>
              <button type="button" className={"ck" + (d.ok ? " on" : "")} aria-label="marcar pronto"
                onClick={() => alterar((c) => { c.docs[k].ok = !c.docs[k].ok; })}>{d.ok ? "✓" : ""}</button>
              <input type="text" value={d.nome} placeholder="documento"
                onChange={(e) => alterar((c) => { c.docs[k].nome = e.target.value; }, false)} />
              <input type="text" value={d.obs || ""} placeholder="observação"
                onChange={(e) => alterar((c) => { c.docs[k].obs = e.target.value; }, false)} />
              <button type="button" className="x" aria-label="remover" onClick={() => alterar((c) => { c.docs.splice(k, 1); })}>×</button>
            </div>
          ))}
        </div>
        <div className="add-linha">
          <input value={novoDoc} placeholder="novo documento (declaração, certidão, portfólio…)"
            onChange={(e) => setNovoDoc(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && novoDoc.trim()) { alterar((c) => { c.docs.push({ nome: novoDoc.trim(), ok: false }); }); setNovoDoc(""); } }} />
          <button className="btn sm" onClick={() => { if (novoDoc.trim()) { alterar((c) => { c.docs.push({ nome: novoDoc.trim(), ok: false }); }); setNovoDoc(""); } }}>+ documento</button>
          {edital?.docsExig?.length ? (
            <button className="btn sm quiet" title="acrescenta os documentos exigidos pelo edital que ainda não estão na lista"
              onClick={() => alterar((c) => {
                const ja = new Set(c.docs.map((d) => d.nome));
                (edital.docsExig || []).forEach((nome) => { if (!ja.has(nome)) c.docs.push({ nome, ok: false }); });
              })}>puxar do edital</button>
          ) : null}
        </div>
        {artistas.some((a) => a!.det?.docs?.length) && (
          <div className="docs-artista">
            <span className="eyebrow">na ficha dos artistas</span>
            {artistas.map((a) => (a!.det?.docs || []).map((d, i) => (
              <div className="docs-artista-l" key={a!.id + i}>
                <span>{d.nome} <span className="muted">· {a!.nome}</span></span>
                <span className={"badge " + (d.status === "ok" ? "pill-ok" : "pill-pend")}>{d.status === "ok" ? "na ficha" : "pendente"}</span>
              </div>
            )))}
          </div>
        )}
      </div>

      <div className="bloco">
        <div className="bloco-h">
          <h4>Produção</h4>
          <span className="cont">{p.producao.filter((x) => x.status === "feito").length} de {p.producao.length} feitos</span>
        </div>
        {p.producao.map((item, i) => (
          <div className="docs-artista-l" key={i}>
            <span style={{ flex: 1 }}>{item.texto}</span>
            <span className={"badge clicavel " + (item.status === "feito" ? "pill-ok" : item.status === "and" ? "st-prev" : "b-type")}
              title="clique para mudar o status"
              onClick={() => alterar((c) => {
                const ordem = ["fazer", "and", "feito"];
                c.producao[i].status = ordem[(ordem.indexOf(c.producao[i].status) + 1) % 3];
              })}>
              {item.status === "feito" ? "feito" : item.status === "and" ? "em andamento" : "a fazer"}
            </span>
            <button className="x-mini" title="remover item" onClick={() => alterar((c) => { c.producao.splice(i, 1); })}>×</button>
          </div>
        ))}
        <div className="add-linha">
          <input value={novoItem} placeholder="novo item (ex.: fechar orçamento de som)"
            onChange={(e) => setNovoItem(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && novoItem.trim()) { alterar((c) => { c.producao.push({ texto: novoItem.trim(), status: "fazer" }); }); setNovoItem(""); } }} />
          <button className="btn sm" onClick={() => { if (novoItem.trim()) { alterar((c) => { c.producao.push({ texto: novoItem.trim(), status: "fazer" }); }); setNovoItem(""); } }}>+ item</button>
        </div>
      </div>

      <div className="bloco">
        <div className="bloco-h">
          <h4>Tarefas</h4>
          <span className="cont"><button className="btn sm" onClick={() => abrirNovo("tarefa", { origem: "proj:" + p.id })}>+ tarefa</button></span>
        </div>
        {tarefas.map((t) => {
          const b = badgeTarefa(t);
          return (
            <div className="docs-artista-l" key={t.id} style={{ cursor: "pointer" }} onClick={() => abrirEdicao("tarefa", t.id)}>
              <span style={{ flex: 1 }}>{t.titulo} <span className="muted">· {nomeEquipe(t.respId)}{t.prazo ? " · " + formatarData(t.prazo) : ""}</span></span>
              <span className={"badge " + b.classe}>{b.rotulo}</span>
            </div>
          );
        })}
        {!tarefas.length && <p className="vazio">nenhuma tarefa ligada a este projeto</p>}
      </div>

      <div className="bloco">
        <div className="bloco-h"><h4>Histórico de status</h4></div>
        {p.historico.length ? [...p.historico].reverse().map((h, i) => (
          <div className="docs-artista-l" key={i}>
            <span className="muted" style={{ minWidth: 90 }}>{formatarData(h.data)}</span>
            <span style={{ flex: 1 }}>{h.de ? ROTULO_STATUS_PROJETO[h.de as StatusProjeto] || h.de : "criado"} → <b>{ROTULO_STATUS_PROJETO[h.para as StatusProjeto] || h.para}</b></span>
          </div>
        )) : <p className="vazio">sem mudanças registradas</p>}
        {p.origem && (p.origem.candidatura || p.origem.projeto) && (
          <p className="hint" style={{ marginTop: 8 }}>
            Veio da migração v3: {p.origem.projeto ? "projeto antigo " + p.origem.projeto : ""}
            {p.origem.candidatura ? (p.origem.projeto ? " × " : "") + "candidatura " + p.origem.candidatura : ""}
            {edital ? " · edital " + nomeCurto(edital) : ""}.
          </p>
        )}
      </div>
    </div>
  );
}
