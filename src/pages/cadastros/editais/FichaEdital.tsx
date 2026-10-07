/* Ficha do edital (Cadastros), no formato do Mapa dos Editais: Geral (o que
   quer, valores, linhas, quem pode, exigências, links e alertas), Critérios,
   Formulário (os mapeados e os campos lidos), Documentos, Contexto (a ficha de
   escrita), Projetos e Notas (lacunas, fontes, confiança). */
import { useState, type ReactNode } from "react";
import { usarCentral } from "../../../store/central";
import { porId } from "../../../store/mutacoes";
import { abrirDetalhe, abrirProjeto, fecharDetalhe, mudarSubAba } from "../../../store/navegacao";
import { abrirEdicao } from "../../../store/edicao";
import { nomeCurto, nomesArtistas, prazoCurto } from "../../../lib/nomes";
import { PainelFicha } from "../../contexto/Fichas";
import { ModalRegra, type PedidoModalRegra } from "../../contexto/ModalRegra";
import { ModalNovoProjeto } from "../../projetos/ModalNovoProjeto";
import {
  CATEGORIAS_EDITAL, CONCEITOS_CAMPO, CONCEITOS_CRITERIO, ESFERAS, QUEM_RESOLVE, ROTULO_STATUS_PROJETO, STATUS_EDITAL,
  type CategoriaEdital,
} from "../../../types";
import { url } from "../../../utils";
import { alertaVencido, prazoEncerrado } from "../../../lib/prazos";
import { Historico } from "../../../components/Historico";

const SUB_ABAS: [string, string][] = [
  ["geral", "Geral"], ["criterios", "Critérios"], ["formulario", "Formulário"], ["docs", "Documentos"],
  ["contexto", "Contexto"], ["projetos", "Projetos"], ["notas", "Notas e lacunas"], ["historico", "Histórico"],
];

const rotuloConceito = (lista: [string, string][], k: string) => lista.find(([x]) => x === k)?.[1] || k;
const simNao = (v: boolean | null | undefined) => (v == null ? "não diz" : v ? "sim" : "não");

export function FichaEdital({ id, sub }: { id: string; sub: string }) {
  const { painel, formularios } = usarCentral();
  const e = porId("editais", id)!;
  const [modalRegra, setModalRegra] = useState<PedidoModalRegra | null>(null);
  const [novoProjeto, setNovoProjeto] = useState(false);
  const esf = ESFERAS[e.esfera] || { rotulo: "—", classe: "" };
  const st = STATUS_EDITAL[e.status] || STATUS_EDITAL.open;
  const cat = CATEGORIAS_EDITAL[(e.categoria || "edital") as CategoriaEdital];
  const projetos = painel.projetos.filter((p) => p.editalId === e.id);
  const forms = [...new Set([...(e.formIds || []), ...(e.formId ? [e.formId] : [])])];
  const aba = SUB_ABAS.some(([k]) => k === sub) ? sub : sub === "financia" ? "geral" : sub === "cands" ? "projetos" : sub === "obs" ? "notas" : "geral";

  const Linha = ({ rotulo, children }: { rotulo: string; children?: ReactNode }) => (
    <div className="row-line">
      <span className="yr" style={{ flexBasis: 150, color: "var(--muted)" }}>{rotulo}</span>
      <span style={{ flex: 1 }}>{children || <span className="muted">—</span>}</span>
    </div>
  );
  const Texto = ({ t }: { t?: string }) => (t ? <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{t}</p> : <p className="muted" style={{ margin: 0 }}>—</p>);

  let corpo;
  if (aba === "geral") {
    corpo = (
      <>
        {(e.alertas || []).length > 0 && (
          <div className="panel alerta-panel">
            <h4>Muda decisão</h4>
            {(e.alertas || []).map((a, i) => (
              <div className={"alerta" + (alertaVencido(a, e) ? " alerta-passou" : "")} key={i}>
                <div>
                  <b>{a.titulo}</b>{a.quando && <span className="badge ur-d7" style={{ marginLeft: 6 }}>{a.quando}</span>}
                  {alertaVencido(a, e) && <span className="badge" style={{ marginLeft: 6 }}>data já passou</span>}
                </div>
                <div className="alerta-t">{a.texto}</div>
                {a.fazer && <div className="alerta-f"><b>Fazer:</b> {a.fazer}</div>}
              </div>
            ))}
          </div>
        )}
        <div className="panel">
          <h4>O que o edital quer</h4>
          <Texto t={e.estimula || e.objeto} />
          {e.estimula && e.objeto && <p className="citacao">{e.objeto}</p>}
        </div>
        <div className="dashgrid">
          <div className="panel">
            <h4>Dados</h4>
            <Linha rotulo="Órgão / promotor">{e.orgao}</Linha>
            <Linha rotulo="Categoria">{cat?.rotulo}{cat && <span className="muted"> · {cat.dica}</span>}</Linha>
            <Linha rotulo="Esfera">{esf.rotulo}</Linha>
            <Linha rotulo="Mecanismo">{e.mec}</Linha>
            <Linha rotulo="Prazo">{e.prazo}</Linha>
            <Linha rotulo="Ciclo">{e.ciclo}</Linha>
            <Linha rotulo="Área">{e.area}</Linha>
            <Linha rotulo="Verificado em">{e.verif}</Linha>
          </div>
          <div className="panel">
            <h4>Quem pode</h4>
            <Texto t={e.publico} />
            <div className="row-line" style={{ marginTop: 8 }}>
              <span className="chip">pessoa física: {simNao(e.aceitaPf)}</span>
              <span className="chip">MEI: {simNao(e.aceitaMei)}</span>
              <span className="chip">coletivo sem CNPJ: {simNao(e.aceitaColetivo)}</span>
            </div>
            {(e.eleg || []).length > 0 && <div style={{ marginTop: 6 }}>{(e.eleg || []).map((x) => <span className="chip" key={x}>{x}</span>)}</div>}
          </div>
        </div>
        <div className="panel">
          <h4>Valores</h4>
          <Texto t={e.teto} />
          {(e.linhas || []).length > 0 && (
            <div className="tbl-wrap" style={{ marginTop: 10 }}>
              <table>
                <thead><tr><th>Linha / categoria</th><th>Valor</th><th>Vagas</th><th>Obs.</th></tr></thead>
                <tbody>
                  {(e.linhas || []).map((l, i) => (
                    <tr key={i}><td><b>{l.nome}</b></td><td>{l.valor}</td><td>{l.vagas}</td><td className="muted">{l.obs}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="panel"><h4>Exigências e contrapartidas</h4><Texto t={[e.exigencias, e.contrapartidas].filter(Boolean).join("\n\n")} /></div>
        <div className="panel">
          <h4>Links oficiais</h4>
          {(e.links || []).length ? (e.links || []).map((l, i) => (
            <div className="row-line" key={i}>
              <span className="yr" style={{ flexBasis: "auto", color: "var(--accent)" }}>↗</span>
              <a href={url(l.url)} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", fontWeight: 600 }}>{l.rotulo}</a>
            </div>
          )) : e.linkEdital
            ? <a href={url(e.linkEdital)} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", fontWeight: 600 }}>↗ {e.linkEdital}</a>
            : <p className="muted" style={{ margin: 0 }}>—</p>}
        </div>
      </>
    );
  } else if (aba === "criterios") {
    const crit = e.criterios || [];
    corpo = (
      <div className="panel">
        <h4>Como avalia {e.criteriosTotal ? <span className="act"><span className="badge b-type">total {e.criteriosTotal} pontos</span></span> : null}</h4>
        {crit.length ? (
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Critério</th><th>Pontos</th><th>Conceito</th></tr></thead>
              <tbody>
                {crit.map((c, i) => (
                  <tr key={i}>
                    <td><b>{c.criterio}</b>{c.descricao && <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{c.descricao}</div>}</td>
                    <td className="num"><b>{c.pontos ?? "—"}</b></td>
                    <td><span className="chip">{rotuloConceito(CONCEITOS_CRITERIO, c.conceito)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="muted" style={{ margin: 0 }}>Sem critérios públicos (patrocínio por análise interna, cadastro ou norma). Veja as Notas.</p>}
        <div style={{ marginTop: 12 }}>
          <Linha rotulo="Nota mínima">{e.notaMinima}</Linha>
          <Linha rotulo="Desempate">{e.desempate}</Linha>
          <Linha rotulo="Bônus, cotas, induções">{e.bonus}</Linha>
          <Linha rotulo="Fonte">{e.criteriosFonte}</Linha>
        </div>
      </div>
    );
  } else if (aba === "formulario") {
    const campos = e.formCampos || [];
    corpo = (
      <>
        <div className="panel">
          <h4>Formulário
            <span className="act"><button className="btn sm" onClick={() => setNovoProjeto(true)}>+ Novo projeto neste edital</button></span>
          </h4>
          <Linha rotulo="Plataforma">{e.plataforma || e.comoInscrever}</Linha>
          <Linha rotulo="Como o Mapa leu">{({ central: "réplica da Central (mapeada na plataforma)", espelho_oficial: "espelho oficial do formulário", regulamento: "reconstruído do regulamento", web: "página do edital", nao_descrito: "nenhum documento descreve os campos" } as Record<string, string>)[e.formOrigem || ""] || e.formOrigem}</Linha>
          <Linha rotulo="Na Central">
            {forms.length ? forms.map((f) => (
              <span key={f} style={{ marginRight: 10 }}>
                <a className="lnk" onClick={() => abrirDetalhe("formulario", f)}>{formularios[f]?.nome || f}</a>
                {formularios[f] && <span className={"chip " + (formularios[f].origem === "chrome" ? "chip-sim" : "")}>{formularios[f].origem === "chrome" ? "mapeado na plataforma" : "mapeado dos documentos"}</span>}
              </span>
            )) : <span className="muted">sem formulário: projetos neste edital nascem Livres</span>}
          </Linha>
        </div>
        {campos.length > 0 && (
          <div className="panel">
            <h4>Campos que o formulário pede <span className="act hint" style={{ margin: "0 0 0 auto" }}>{campos.length} campos lidos pelo Mapa</span></h4>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Etapa</th><th>Campo</th><th>Limite</th><th>Conceito</th></tr></thead>
                <tbody>
                  {campos.map((c, i) => (
                    <tr key={i}>
                      <td className="muted">{c.etapa}</td>
                      <td><b>{c.campo}</b>{c.obrigatorio ? <span className="muted"> *</span> : null}{c.instrucao && <div className="muted" style={{ fontSize: 12 }}>{c.instrucao}</div>}</td>
                      <td className="num">{c.limite ? c.limite.toLocaleString("pt-BR") + " " + (c.unidade || "") : "—"}</td>
                      <td><span className="chip">{rotuloConceito(CONCEITOS_CAMPO, c.conceito)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>
    );
  } else if (aba === "docs") {
    corpo = (
      <>
        <div className="panel">
          <h4>Documentos exigidos</h4>
          {(e.docsExig || []).length
            ? (e.docsExig || []).map((d) => <div className="docitem" key={d}><span style={{ flex: 1 }}>{d}</span></div>)
            : <p className="muted" style={{ margin: 0 }}>Ainda não cadastrados: edite o edital para listar.</p>}
          <p className="hint" style={{ marginTop: 12 }}>Todo projeto novo neste edital já nasce com esta lista no checklist de documentos.</p>
        </div>
        <div className="panel"><h4>Como se inscrever</h4><Texto t={e.comoInscrever} /></div>
        <div className="panel">
          <h4>Acervo no Drive</h4>
          <Linha rotulo="Pasta do edital">{e.linkDrive ? <a href={url(e.linkDrive)} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", fontWeight: 600 }}>📁 abrir ↗</a> : null}</Linha>
          {(e.arquivos || []).map((a, i) => (
            <div className="docitem" key={i}>
              <span style={{ flex: 1 }}>{a.nome} <span className="muted">· {a.onde}</span></span>
              <span className="badge b-type">{a.tipo}</span>
              <span className="muted" style={{ fontSize: 11 }}>{a.kb} KB</span>
            </div>
          ))}
          {!(e.arquivos || []).length && <p className="muted" style={{ margin: 0 }}>Nenhum arquivo do acervo associado.</p>}
        </div>
      </>
    );
  } else if (aba === "contexto") {
    corpo = <div id="ctx" className="ctx-embutido"><PainelFicha id={e.id} aoAbrirRegra={setModalRegra} semCabecalho /></div>;
  } else if (aba === "projetos") {
    corpo = (
      <div className="panel">
        <h4>Projetos neste edital
          <span className="act"><button className="btn sm" onClick={() => setNovoProjeto(true)}>+ Novo projeto</button></span>
        </h4>
        {projetos.map((p) => (
          <div className="row-line" style={{ cursor: "pointer" }} key={p.id} onClick={() => abrirProjeto(p.id)}>
            <span style={{ flex: 1 }}>
              <b>{p.nome}</b>{p.arquivado && <span className="muted"> (arquivado)</span>}
              <div className="muted">{nomesArtistas(p)}{p.valorPedido ? " · " + p.valorPedido : ""}</div>
            </span>
            <span className="badge b-type">{ROTULO_STATUS_PROJETO[p.status]}</span>
            <span className="arrow">→</span>
          </div>
        ))}
        {!projetos.length && <p className="muted" style={{ margin: 0 }}>Nenhum projeto neste edital ainda.</p>}
      </div>
    );
  } else if (aba === "historico") {
    corpo = <Historico ids={[e.id]} />;
  } else {
    const lac = e.lacunas || [];
    corpo = (
      <>
        <div className="panel"><h4>Observações</h4><Texto t={e.obs} /></div>
        <div className="panel">
          <h4>O que ainda não se sabe</h4>
          {lac.map((l, i) => (
            <div className="lac" key={i}>
              <div><b>{l.lacuna}</b> <span className="chip">{QUEM_RESOLVE[l.cat] || l.cat}</span> <span className="muted">({l.status})</span></div>
              {l.achado && <div className="lac-t">{l.achado}</div>}
              {l.por_que && <div className="lac-p">{l.por_que}</div>}
            </div>
          ))}
          {e.lacunasTexto && <p style={{ margin: lac.length ? "10px 0 0" : 0, whiteSpace: "pre-wrap" }} className="muted">{e.lacunasTexto}</p>}
          {!lac.length && !e.lacunasTexto && <p className="muted" style={{ margin: 0 }}>—</p>}
        </div>
        <div className="panel">
          <h4>Fontes lidas <span className="act">{e.confianca && <span className={"conf conf-" + e.confianca}>confiança {e.confianca}</span>}</span></h4>
          {(e.fontes || []).length
            ? <ul className="fontes">{(e.fontes || []).map((f, i) => <li key={i}>{/^https?:/.test(f) ? <a href={f} target="_blank" rel="noopener noreferrer">{f}</a> : f}</li>)}</ul>
            : <p className="muted" style={{ margin: 0 }}>—</p>}
        </div>
      </>
    );
  }

  return (
    <>
      <button className="back" onClick={fecharDetalhe}>← Voltar para Editais</button>
      <div className="dhead">
        <div className="avatar" style={{ background: `linear-gradient(135deg, var(--${e.esfera === "para" ? "priv" : e.esfera || "accent"}), var(--gold))` }}>
          {nomeCurto(e)[0] || "E"}
        </div>
        <div>
          <h2>{nomeCurto(e)}</h2>
          <div className="muted" style={{ fontSize: 12.5, margin: "2px 0 4px" }}>{e.nome}</div>
          <span className={"badge esfera " + esf.classe}>{esf.rotulo}</span>{" "}
          <span className={"badge " + st.classe}>{st.rotulo}</span>{" "}
          {prazoEncerrado(e) && <><span className="badge ur-vencido" title="O edital está marcado como Aberto, mas o prazo já passou. Atualize o status em Editar.">prazo encerrado</span>{" "}</>}
          {cat && <span className="badge b-type">{cat.rotulo}</span>}{" "}
          <span className="muted" style={{ fontSize: 12.5 }} title={e.prazo}>· prazo {prazoCurto(e) || "—"}</span>
        </div>
        <span className="act"><button className="btn ghost sm" onClick={() => abrirEdicao("edital", e.id)}>Editar</button></span>
      </div>
      <div className="subtabs">
        {SUB_ABAS.map(([k, rotulo]) => (
          <button key={k} className={aba === k ? "on" : ""} onClick={() => mudarSubAba(k)}>
            {rotulo}
            {k === "projetos" && projetos.length > 0 && <span className="aba-n cinza">{projetos.length}</span>}
            {k === "geral" && (e.alertas || []).length > 0 && <span className="aba-n">{(e.alertas || []).length}</span>}
          </button>
        ))}
      </div>
      {corpo}
      {modalRegra && <div id="ctx"><ModalRegra pedido={modalRegra} aoFechar={() => setModalRegra(null)} /></div>}
      {novoProjeto && <ModalNovoProjeto editalId={e.id} aoFechar={() => setNovoProjeto(false)} />}
    </>
  );
}
