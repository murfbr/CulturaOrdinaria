/* Ficha completa do artista (Cadastros), com o acervo `det` editável:
   Geral (pendências e perguntas em aberto, correções propostas, dados gerais),
   Portfólio cultural, Documentos, Marca (manual, fotos e links juntos),
   Contexto (a ficha de escrita, a mesma do ambiente Contexto) e Projetos. */
import { useState } from "react";
import { usarCentral } from "../../../store/central";
import { porId, salvarRegistro } from "../../../store/mutacoes";
import { abrirProjeto, fecharDetalhe, mudarSubAba } from "../../../store/navegacao";
import { abrirEdicao } from "../../../store/edicao";
import { BlocoEditavel } from "../../../components/BlocoEditavel";
import { PainelFicha } from "../../contexto/Fichas";
import { ModalRegra, type PedidoModalRegra } from "../../contexto/ModalRegra";
import { ModalNovoProjeto } from "../../projetos/ModalNovoProjeto";
import { nomeEditalDoProjeto } from "../../../lib/nomes";
import { ROTULO_STATUS_PROJETO, type DetalheArtista, type PendenciaArtista } from "../../../types";
import { clonar, url } from "../../../utils";

const SUB_ABAS: [string, string][] = [
  ["geral", "Geral"], ["portfolio", "Portfólio cultural"], ["docs", "Documentos"],
  ["marca", "Marca"], ["contexto", "Contexto"], ["projetos", "Projetos"],
];

/** Quebra "a | b | c" nos pedaços, sem perder os do meio vazios. */
const partes = (linha: string) => linha.split("|").map((x) => x.trim());
const linhasDe = (texto: string) => texto.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

export function FichaArtista({ id, sub }: { id: string; sub: string }) {
  const { painel } = usarCentral();
  const a = porId("artistas", id)!;
  const d: DetalheArtista = a.det || {};
  const [novoDoc, setNovoDoc] = useState("");
  const [novaPend, setNovaPend] = useState<{ texto: string; tipo: PendenciaArtista["tipo"] }>({ texto: "", tipo: "pendencia" });
  const [verResolvidas, setVerResolvidas] = useState(false);
  const [modalRegra, setModalRegra] = useState<PedidoModalRegra | null>(null);
  const [novoProjeto, setNovoProjeto] = useState(false);
  const aba = SUB_ABAS.some(([k]) => k === sub) ? sub : sub === "fotos" || sub === "links" ? "marca" : "geral";

  /** Toda edição do acervo passa por aqui: clona o artista, mexe no det, salva. */
  function alterarDet(mudar: (det: DetalheArtista) => void, rapido = true) {
    const copia = clonar(a);
    copia.det = copia.det || {};
    mudar(copia.det);
    salvarRegistro("artistas", copia, rapido);
  }

  function adicionarDoc() {
    const nome = novoDoc.trim();
    if (!nome) return;
    alterarDet((det) => { det.docs = [...(det.docs || []), { nome, status: "pend" }]; });
    setNovoDoc("");
  }

  function adicionarPendencia() {
    const texto = novaPend.texto.trim();
    if (!texto) return;
    alterarDet((det) => { det.pendencias = [...(det.pendencias || []), { texto, tipo: novaPend.tipo, status: "aberta" }]; });
    setNovaPend({ ...novaPend, texto: "" });
  }

  const vazio = <p className="muted" style={{ margin: 0 }}>nada registrado ainda — use o "editar" do bloco</p>;
  const projetos = painel.projetos.filter((p) => p.artistaIds.includes(a.id));

  /** Lista de pendências de um tipo (pendência ou pergunta). */
  const listaPendencias = (tipo: PendenciaArtista["tipo"]) => {
    const todas = (d.pendencias || []).map((x, i) => ({ ...x, i })).filter((x) => x.tipo === tipo);
    const visiveis = todas.filter((x) => verResolvidas || x.status !== "resolvida");
    if (!visiveis.length) return <p className="muted" style={{ margin: "4px 0 0" }}>{todas.length ? "tudo resolvido" : "nada em aberto"}</p>;
    return visiveis.map((x) => (
      <div className={"pend" + (x.status === "resolvida" ? " feita" : "")} key={x.i}>
        <span className={"ck" + (x.status === "resolvida" ? " on" : "")} title={x.status === "resolvida" ? "reabrir" : "marcar como resolvida"}
          onClick={() => alterarDet((det) => { det.pendencias![x.i].status = x.status === "resolvida" ? "aberta" : "resolvida"; })}>
          {x.status === "resolvida" ? "✓" : ""}
        </span>
        <div className="pend-t">
          <div>{x.texto}</div>
          {(x.resposta != null || x.status === "resolvida") && (
            <input className="pend-r" value={x.resposta || ""} placeholder={tipo === "perguntar" ? "resposta do artista" : "como foi resolvido"}
              onChange={(e) => alterarDet((det) => { det.pendencias![x.i].resposta = e.target.value; }, false)} />
          )}
          {x.resposta == null && x.status !== "resolvida" && (
            <button className="lnk-mini" onClick={() => alterarDet((det) => { det.pendencias![x.i].resposta = ""; })}>
              + {tipo === "perguntar" ? "resposta" : "anotar"}
            </button>
          )}
          {x.fonte && <div className="pend-f">{x.fonte}</div>}
        </div>
        <button className="rm" title="remover" onClick={() => alterarDet((det) => { det.pendencias!.splice(x.i, 1); })}>×</button>
      </div>
    ));
  };

  let corpo;
  if (aba === "geral") {
    const propostas = (d.propostas || []).map((x, i) => ({ ...x, i })).filter((x) => x.status === "aberta");
    corpo = (
      <>
        <div className="dashgrid">
          <div className="panel">
            <h4>Pendências <span className="act hint" style={{ margin: "0 0 0 auto" }}>o que o coletivo precisa resolver</span></h4>
            {listaPendencias("pendencia")}
          </div>
          <div className="panel">
            <h4>Perguntar <span className="act hint" style={{ margin: "0 0 0 auto" }}>só o artista responde</span></h4>
            {listaPendencias("perguntar")}
          </div>
        </div>
        <div className="add-linha" style={{ marginTop: -4, marginBottom: 14 }}>
          <select value={novaPend.tipo} onChange={(e) => setNovaPend({ ...novaPend, tipo: e.target.value as PendenciaArtista["tipo"] })}
            style={{ flex: "0 0 auto", border: "1px solid var(--line)", borderRadius: 7, padding: "7px 8px", font: "inherit", fontSize: 13 }}>
            <option value="pendencia">pendência</option>
            <option value="perguntar">pergunta</option>
          </select>
          <input value={novaPend.texto} placeholder="o que falta resolver ou perguntar"
            onChange={(e) => setNovaPend({ ...novaPend, texto: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") adicionarPendencia(); }} />
          <button className="btn sm" onClick={adicionarPendencia}>+ adicionar</button>
          <label className="chk-mini"><input type="checkbox" checked={verResolvidas} onChange={(e) => setVerResolvidas(e.target.checked)} /> ver resolvidas</label>
        </div>

        {propostas.length > 0 && (
          <div className="panel">
            <h4>Correções propostas pela pesquisa <span className="act hint" style={{ margin: "0 0 0 auto" }}>confirme antes de aplicar no cadastro</span></h4>
            <div className="tbl-wrap"><table>
              <thead><tr><th>Campo</th><th>Hoje</th><th>Passa a ser</th><th>Por quê</th><th /></tr></thead>
              <tbody>
                {propostas.map((x) => (
                  <tr key={x.i}>
                    <td><b>{x.campo}</b></td>
                    <td className="muted">{x.de}</td>
                    <td>{x.para}</td>
                    <td className="muted" style={{ fontSize: 11.5 }}>{x.motivo}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="btn ghost sm" title="marca como aplicada (edite o campo no cadastro)"
                        onClick={() => alterarDet((det) => { det.propostas![x.i].status = "aplicada"; })}>aplicada</button>{" "}
                      <button className="btn ghost sm" onClick={() => alterarDet((det) => { det.propostas![x.i].status = "descartada"; })}>descartar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        )}

        <BlocoEditavel titulo="Dados gerais" dica='por linha: rótulo | valor (ex.: "Local | Pedra do Leme")'
          valor={Object.entries(d.geral || {}).map(([k, v]) => k + " | " + v).join("\n")}
          aoSalvar={(t) => alterarDet((det) => {
            det.geral = Object.fromEntries(linhasDe(t).map((l) => {
              const p = partes(l);
              return [p[0] || "—", p.slice(1).join(" | ")];
            }));
          })}>
          {Object.keys(d.geral || {}).length ? Object.entries(d.geral || {}).map(([k, v]) => (
            <div className="row-line" key={k}>
              <span className="yr" style={{ flexBasis: 120, color: "var(--muted)" }}>{k}</span><b>{v}</b>
            </div>
          )) : vazio}
        </BlocoEditavel>
        <div className="panel">
          <h4>Sobre</h4>
          <p style={{ margin: 0 }}>{a.bio}</p>
          <div style={{ marginTop: 8 }}>{(a.tags || []).map((t) => <span className="chip" key={t}>{t}</span>)}</div>
          <div className="row-line" style={{ marginTop: 8 }}><span className="yr" style={{ flexBasis: 120, color: "var(--muted)" }}>Formalização</span><b>{a.formalizacao || "—"}{a.cnpj ? " · " + a.cnpj : ""}</b></div>
          <div className="row-line"><span className="yr" style={{ flexBasis: 120, color: "var(--muted)" }}>Liga</span><b>{a.liga || "—"}</b></div>
          {a.enq && <div className="row-line"><span className="yr" style={{ flexBasis: 120, color: "var(--muted)" }}>Enquadramento (antigo)</span><span className="muted">{a.enq}</span></div>}
          <p className="hint" style={{ marginTop: 10 }}>Bio, tags, formalização e liga são do cadastro: botão Editar lá em cima. Quem assina cada inscrição fica no projeto (proponente).</p>
        </div>
      </>
    );
  } else if (aba === "portfolio") {
    corpo = (
      <BlocoEditavel titulo="Histórico & realizações" dica='por linha: ano | texto (ex.: "2025 | 40 rodas na Pedra do Leme")'
        valor={(d.portfolio || []).map((x) => x.ano + " | " + x.texto).join("\n")}
        aoSalvar={(t) => alterarDet((det) => {
          det.portfolio = linhasDe(t).map((l) => {
            const p = partes(l);
            return { ano: p[0] || "", texto: p.slice(1).join(" | ") };
          });
        })}>
        {(d.portfolio || []).length ? (d.portfolio || []).map((item, i) => (
          <div className="row-line" key={i}><span className="yr">{item.ano}</span><span>{item.texto}</span></div>
        )) : vazio}
      </BlocoEditavel>
    );
  } else if (aba === "docs") {
    corpo = (
      <div className="panel">
        <h4>Documentos <span className="act hint" style={{ margin: "0 0 0 auto" }}>clique no status para alternar</span></h4>
        {(d.docs || []).map((doc, i) => (
          <div className="docitem" key={i}>
            <span style={{ flex: 1 }}>{doc.nome}</span>
            <span className={"badge clicavel " + (doc.status === "ok" ? "pill-ok" : "pill-pend")}
              title="alternar anexado / pendente"
              onClick={() => alterarDet((det) => { det.docs![i].status = det.docs![i].status === "ok" ? "pend" : "ok"; })}>
              {doc.status === "ok" ? "anexado" : "pendente"}
            </span>
            <button className="rm" title="remover"
              onClick={() => alterarDet((det) => { det.docs!.splice(i, 1); })}>×</button>
          </div>
        ))}
        {!(d.docs || []).length && vazio}
        <div className="add-linha">
          <input value={novoDoc} placeholder="novo documento (ex.: Portfólio em PDF)"
            onChange={(e) => setNovoDoc(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") adicionarDoc(); }} />
          <button className="btn sm" onClick={adicionarDoc}>+ adicionar</button>
        </div>
        <p className="hint" style={{ marginTop: 12 }}>Esse acervo aparece nos documentos de cada projeto deste artista e nas Pendências.</p>
      </div>
    );
  } else if (aba === "marca") {
    const m = d.marca;
    corpo = (
      <>
        <BlocoEditavel titulo="Manual de marca"
          dica='linhas "cores:" (vírgula), "logo:", "fonte:", "obs:" e "manual:" (link do manual completo)'
          valor={[
            "cores: " + (m?.cores || []).join(", "),
            "logo: " + (m?.logo || ""),
            "fonte: " + (m?.fonte || ""),
            "obs: " + (m?.obs || ""),
            "manual: " + (m?.manual || ""),
          ].join("\n")}
          aoSalvar={(t) => alterarDet((det) => {
            const marca = { cores: [] as string[], logo: "", fonte: "", obs: "", ...(det.marca || {}) };
            linhasDe(t).forEach((l) => {
              const dois = l.indexOf(":");
              if (dois < 0) return;
              const chave = l.slice(0, dois).trim().toLowerCase();
              const valor = l.slice(dois + 1).trim();
              if (chave === "cores") marca.cores = valor.split(",").map((x) => x.trim()).filter(Boolean);
              else if (chave === "logo") marca.logo = valor;
              else if (chave === "fonte") marca.fonte = valor;
              else if (chave === "obs") marca.obs = valor;
              else if (chave === "manual") marca.manual = valor;
            });
            det.marca = marca;
          })}>
          {m ? (
            <>
              <div style={{ marginBottom: 14 }}>
                {(m.cores || []).map((c) => (
                  <span className="swatch" key={c}><span className="sw" style={{ background: c }} /><span className="lb">{c}</span></span>
                ))}
              </div>
              <div className="row-line"><span className="yr" style={{ flexBasis: 110, color: "var(--muted)" }}>Logo</span><b>{m.logo}</b></div>
              <div className="row-line"><span className="yr" style={{ flexBasis: 110, color: "var(--muted)" }}>Tipografia</span><b>{m.fonte}</b></div>
              <div className="row-line"><span className="yr" style={{ flexBasis: 110, color: "var(--muted)" }}>Observações</span><span>{m.obs}</span></div>
              {m.manual && <div className="row-line"><span className="yr" style={{ flexBasis: 110, color: "var(--muted)" }}>Manual</span><a href={url(m.manual)} target="_blank" rel="noopener noreferrer">abrir ↗</a></div>}
            </>
          ) : vazio}
        </BlocoEditavel>

        <div className="panel">
          <h4>Fotos</h4>
          <div className="add-linha" style={{ margin: "0 0 12px" }}>
            <span className="hint" style={{ margin: 0 }}>quantidade no acervo:</span>
            <input type="number" min={0} style={{ flex: "0 0 90px" }} value={d.fotos || 0}
              onChange={(e) => alterarDet((det) => { det.fotos = Math.max(0, Number(e.target.value) || 0); }, false)} />
            <input value={m?.pastaFotos || ""} placeholder="link da pasta de fotos no Drive"
              onChange={(e) => alterarDet((det) => {
                det.marca = { cores: [], logo: "", fonte: "", obs: "", ...(det.marca || {}), pastaFotos: e.target.value };
              }, false)} />
            {m?.pastaFotos && <a className="btn ghost sm" href={url(m.pastaFotos)} target="_blank" rel="noopener noreferrer">abrir ↗</a>}
          </div>
          <div className="photos">
            {Array.from({ length: Math.min(d.fotos || 0, 12) }).map((_, i) => <div className="photo" key={i}>Foto {i + 1}</div>)}
          </div>
          <p className="hint" style={{ marginTop: 10 }}>Contagem de referência: as fotos em si vivem na pasta do Drive.</p>
        </div>

        <BlocoEditavel titulo="Links" dica='por linha: rótulo | url (ex.: "Instagram | instagram.com/bloco")'
          valor={(d.links || []).map((l) => l.rotulo + " | " + l.url).join("\n")}
          aoSalvar={(t) => alterarDet((det) => {
            det.links = linhasDe(t).map((l) => {
              const p = partes(l);
              return { rotulo: p[0] || "link", url: p.slice(1).join(" | ") };
            });
          })}>
          {(d.links || []).length ? (d.links || []).map((l, i) => (
            <div className="row-line" key={i}>
              <span className="yr" style={{ flexBasis: "auto", color: "var(--accent)" }}>↗</span>
              <span><b>{l.rotulo}</b> <a className="muted" href={url(l.url)} target="_blank" rel="noopener noreferrer">{l.url}</a></span>
            </div>
          )) : vazio}
        </BlocoEditavel>
      </>
    );
  } else if (aba === "contexto") {
    corpo = (
      <div id="ctx" className="ctx-embutido">
        <PainelFicha id={a.id} aoAbrirRegra={setModalRegra} semCabecalho />
      </div>
    );
  } else if (aba === "projetos") {
    corpo = (
      <div className="panel">
        <h4>Projetos com {a.nome}
          <span className="act"><button className="btn sm" onClick={() => setNovoProjeto(true)}>+ Novo projeto</button></span>
        </h4>
        {projetos.map((p) => (
          <div className="row-line" style={{ cursor: "pointer" }} key={p.id} onClick={() => abrirProjeto(p.id)}>
            <span style={{ flex: 1 }}>
              <b>{p.nome}</b>{p.arquivado && <span className="muted"> (arquivado)</span>}
              <div className="muted">{nomeEditalDoProjeto(p)}{p.artistaIds.length > 1 ? " · com mais " + (p.artistaIds.length - 1) + " artista(s)" : ""}</div>
            </span>
            <span className="badge b-type">{ROTULO_STATUS_PROJETO[p.status]}</span>
            <span className="arrow">→</span>
          </div>
        ))}
        {!projetos.length && <p className="muted" style={{ margin: 0 }}>Nenhum projeto com este artista ainda.</p>}
      </div>
    );
  }

  const nAbertas = (d.pendencias || []).filter((x) => x.status !== "resolvida").length;

  return (
    <>
      <button className="back" onClick={fecharDetalhe}>← Voltar para Artistas</button>
      <div className="dhead">
        <div className="avatar">{a.nome[0]}</div>
        <div>
          <h2>{a.nome}</h2>
          <span className="badge b-type">{a.tipo}</span>{" "}
          <span className="muted" style={{ fontSize: 12.5 }}>· {a.formalizacao || a.enq || "formalização a registrar"}{a.liga ? " · " + a.liga : ""} · {a.mun}</span>
        </div>
        <span className="act"><button className="btn ghost sm" onClick={() => abrirEdicao("artista", a.id)}>Editar</button></span>
      </div>
      <div className="subtabs">
        {SUB_ABAS.map(([k, rotulo]) => (
          <button key={k} className={aba === k ? "on" : ""} onClick={() => mudarSubAba(k)}>
            {rotulo}
            {k === "geral" && nAbertas > 0 && <span className="aba-n">{nAbertas}</span>}
            {k === "projetos" && projetos.length > 0 && <span className="aba-n cinza">{projetos.length}</span>}
          </button>
        ))}
      </div>
      {corpo}
      {modalRegra && <div id="ctx"><ModalRegra pedido={modalRegra} aoFechar={() => setModalRegra(null)} /></div>}
      {novoProjeto && <ModalNovoProjeto artistaId={a.id} aoFechar={() => setNovoProjeto(false)} />}
    </>
  );
}
