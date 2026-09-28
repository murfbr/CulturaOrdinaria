/* Revisão dos artistas: tudo o que está em aberto nas fichas, num lugar só.
   Correções propostas pela pesquisa (marcar como aplicada ou descartar),
   perguntas que só o artista responde (com "copiar perguntas" para mandar de
   uma vez) e pendências do coletivo, com resposta e "resolver" em série. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { abrirDetalhe } from "../../store/navegacao";
import { abrirNovo } from "../../store/edicao";
import { salvarRegistro } from "../../store/mutacoes";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../components/Filtros";
import { toast } from "../../components/Toast";
import { clonar, comparar } from "../../utils";
import type { Artista, DetalheArtista } from "../../types";

type Vista = "propostas" | "perguntar" | "pendencia" | "resolvidas";

function alterarDet(a: Artista, mudar: (det: DetalheArtista) => void, rapido = true) {
  const copia = clonar(a);
  copia.det = copia.det || {};
  mudar(copia.det);
  salvarRegistro("artistas", copia, rapido);
}

async function copiar(texto: string, aviso: string) {
  try { await navigator.clipboard.writeText(texto); toast(aviso); }
  catch { toast("Não deu para copiar: selecione o texto e copie à mão"); }
}

export function RevisaoArtistas() {
  const { painel } = usarCentral();
  const [vista, setVista] = useState<Vista>("propostas");
  const [artistaId, setArtistaId] = useState("");
  const [busca, setBusca] = useState("");
  const termo = busca.toLowerCase();

  const artistas = [...painel.artistas].sort((a, b) => comparar(a.nome, b.nome));
  const conta = (a: Artista) => {
    const d = a.det || {};
    const pend = d.pendencias || [];
    return {
      propostas: (d.propostas || []).filter((x) => x.status === "aberta").length,
      perguntar: pend.filter((x) => x.tipo === "perguntar" && x.status !== "resolvida").length,
      pendencia: pend.filter((x) => x.tipo !== "perguntar" && x.status !== "resolvida").length,
      resolvidas: pend.filter((x) => x.status === "resolvida").length
        + (d.propostas || []).filter((x) => x.status !== "aberta").length,
    };
  };
  const total = artistas.reduce((t, a) => {
    const c = conta(a);
    return { propostas: t.propostas + c.propostas, perguntar: t.perguntar + c.perguntar, pendencia: t.pendencia + c.pendencia, resolvidas: t.resolvidas + c.resolvidas };
  }, { propostas: 0, perguntar: 0, pendencia: 0, resolvidas: 0 });

  const VISTAS: [Vista, string][] = [
    ["propostas", `Correções propostas (${total.propostas})`],
    ["perguntar", `Perguntas ao artista (${total.perguntar})`],
    ["pendencia", `Pendências do coletivo (${total.pendencia})`],
    ["resolvidas", `Já resolvidas (${total.resolvidas})`],
  ];

  const bate = (...t: (string | undefined)[]) => !termo || t.join(" ").toLowerCase().includes(termo);

  const blocos = artistas.filter((a) => !artistaId || a.id === artistaId).map((a) => {
    const d = a.det || {};
    let linhas: JSX.Element[] = [];

    if (vista === "propostas") {
      linhas = (d.propostas || []).map((x, i) => ({ ...x, i }))
        .filter((x) => x.status === "aberta" && bate(x.campo, x.de, x.para, x.motivo))
        .map((x) => (
          <div className="rev-item" key={"p" + x.i}>
            <div className="rev-campo">{x.campo}</div>
            <div className="rev-de"><span className="eyebrow">hoje</span>{x.de || "—"}</div>
            <div className="rev-para"><span className="eyebrow">passa a ser</span>{x.para}</div>
            {x.motivo && <div className="rev-motivo">{x.motivo}</div>}
            <div className="rev-acoes">
              <button className="btn sm ghost" onClick={() => copiar(x.para, "Texto novo copiado")}>copiar texto novo</button>
              <button className="btn sm ghost" onClick={() => abrirDetalhe("artista", a.id)}>abrir ficha</button>
              <span className="sp" />
              <button className="btn sm" title="depois de editar o campo na ficha (ou se já estava certo)"
                onClick={() => { alterarDet(a, (det) => { det.propostas![x.i].status = "aplicada"; }); toast("Marcada como aplicada"); }}>aplicada</button>
              <button className="btn sm ghost" onClick={() => { alterarDet(a, (det) => { det.propostas![x.i].status = "descartada"; }); toast("Descartada"); }}>descartar</button>
            </div>
          </div>
        ));
    } else if (vista === "resolvidas") {
      const pend = (d.pendencias || []).map((x, i) => ({ ...x, i })).filter((x) => x.status === "resolvida" && bate(x.texto, x.resposta));
      const props = (d.propostas || []).map((x, i) => ({ ...x, i })).filter((x) => x.status !== "aberta" && bate(x.campo, x.para));
      linhas = [
        ...pend.map((x) => (
          <div className="rev-item feita" key={"r" + x.i}>
            <div>{x.tipo === "perguntar" ? "Pergunta: " : ""}{x.texto}</div>
            {x.resposta && <div className="rev-resp">→ {x.resposta}</div>}
            <div className="rev-acoes"><span className="sp" />
              <button className="btn sm ghost" onClick={() => alterarDet(a, (det) => { det.pendencias![x.i].status = "aberta"; })}>reabrir</button>
            </div>
          </div>
        )),
        ...props.map((x) => (
          <div className="rev-item feita" key={"rp" + x.i}>
            <div><b>{x.campo}</b> <span className="muted">· {x.status}</span></div>
            <div className="rev-resp">{x.para}</div>
            <div className="rev-acoes"><span className="sp" />
              <button className="btn sm ghost" onClick={() => alterarDet(a, (det) => { det.propostas![x.i].status = "aberta"; })}>reabrir</button>
            </div>
          </div>
        )),
      ];
    } else {
      linhas = (d.pendencias || []).map((x, i) => ({ ...x, i }))
        .filter((x) => (vista === "perguntar" ? x.tipo === "perguntar" : x.tipo !== "perguntar") && x.status !== "resolvida" && bate(x.texto, x.resposta, x.fonte))
        .map((x) => (
          <div className="rev-item" key={"q" + x.i}>
            <div className="rev-texto">{x.texto}{x.fonte && <span className="muted"> · {x.fonte}</span>}</div>
            <textarea className="rev-resposta" rows={1} placeholder={vista === "perguntar" ? "resposta do artista" : "como foi resolvido"}
              value={x.resposta || ""} onChange={(e) => alterarDet(a, (det) => { det.pendencias![x.i].resposta = e.target.value; }, false)} />
            <div className="rev-acoes">
              <button className="btn sm ghost" onClick={() => abrirNovo("tarefa", { titulo: a.nome + ": " + x.texto.slice(0, 90) })}>+ tarefa</button>
              <span className="sp" />
              <button className="btn sm" onClick={() => { alterarDet(a, (det) => { det.pendencias![x.i].status = "resolvida"; }); toast("Resolvida"); }}>resolver</button>
            </div>
          </div>
        ));
    }
    if (!linhas.length) return null;
    const perguntas = (d.pendencias || []).filter((x) => x.tipo === "perguntar" && x.status !== "resolvida");
    return (
      <div className="panel rev-bloco" key={a.id}>
        <h4>
          <a className="lnk" onClick={() => abrirDetalhe("artista", a.id)}>{a.nome}</a>
          <span className="n muted"> · {linhas.length}</span>
          {vista === "perguntar" && perguntas.length > 0 && (
            <span className="act">
              <button className="btn sm ghost" onClick={() => copiar(
                "Oi! Para os editais, precisamos confirmar algumas coisas sobre " + a.nome + ":\n\n"
                + perguntas.map((x, k) => (k + 1) + ". " + x.texto).join("\n"),
                "Perguntas copiadas: é só colar na conversa com o artista",
              )}>copiar perguntas para mandar</button>
            </span>
          )}
        </h4>
        {linhas}
      </div>
    );
  }).filter(Boolean);

  return (
    <>
      <CabecalhoSecao titulo="Revisão dos artistas" sub="tudo o que está em aberto nas fichas, num lugar só: responda, resolva ou descarte em série" />
      <div className="pilulas">
        {VISTAS.map(([k, rotulo]) => (
          <button key={k} className={vista === k ? "on" : ""} onClick={() => setVista(k)}>{rotulo}</button>
        ))}
      </div>
      <BarraFiltros mostrando={blocos.length} total={artistas.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar no texto…" />
        <SeletorFiltro valor={artistaId} aoMudar={setArtistaId} rotuloTodos="todos os artistas"
          opcoes={artistas.map((a) => ({ valor: a.id, rotulo: a.nome }))} />
      </BarraFiltros>
      {blocos}
      {!blocos.length && <p className="muted">✓ Nada em aberto nesta vista.</p>}
    </>
  );
}
