/* Resumo: a visão de chegada — KPIs, prazos com urgência, projetos por status,
   tarefas em aberto e alertas. Tudo derivado, nada editável aqui. */
import { usarCentral } from "../../store/central";
import { abrirDetalhe, irParaAmbiente } from "../../store/navegacao";
import { abrirEdicao } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { tituloCurto } from "../../lib/agenda";
import { nomeEquipe } from "../../lib/nomes";
import { CLASSE_URGENCIA, ROTULO_URGENCIA, itensDePrazo, type ItemPrazo } from "../../lib/prazos";
import { STATUS_ATIVOS, STATUS_PROJETO } from "../../types";
import { formatarData } from "../../utils";

const ICONE_PRAZO: Record<ItemPrazo["tipo"], string> = { edital: "⏱", tarefa: "☑", reuniao: "📅" };

/** Abre o registro dono do prazo (ficha ou modal de edição). */
function abrirPrazo(p: ItemPrazo) {
  if (p.tipo === "edital") abrirDetalhe("edital", p.id);
  else if (p.tipo === "reuniao") abrirDetalhe("reuniao", p.id);
  else abrirEdicao("tarefa", p.id);
}

export function Resumo() {
  const { painel } = usarCentral();
  const projetos = painel.projetos.filter((p) => !p.arquivado);
  const ativos = projetos.filter((p) => STATUS_ATIVOS.includes(p.status)).length;
  const ganhos = projetos.filter((p) => ["aprovado", "captando", "execucao", "prestacao"].includes(p.status)).length;
  const abertos = painel.editais.filter((e) => e.status === "open" || e.status === "cont").length;
  const tarefasAbertas = painel.tarefas.filter((t) => t.status !== "feito").length;

  const prazos = itensDePrazo(painel);
  const vencidos = prazos.filter((p) => p.urgencia === "vencido");
  const proximos = prazos.filter((p) => p.urgencia !== "vencido");
  // Os até 3 vencidos mais recentes + o que vem pela frente, num teto de 7 linhas.
  const linhasPrazo = [...vencidos.slice(-3), ...proximos].slice(0, 7);

  const kpis: [string, number][] = [
    ["Projetos em andamento", ativos],
    ["Aprovados ou captando", ganhos],
    ["Editais abertos", abertos],
    ["Tarefas em aberto", tarefasAbertas],
  ];
  const colunas = STATUS_PROJETO.filter((s) => !s.fim);
  const maiorColuna = Math.max(1, ...colunas.map((s) => projetos.filter((p) => p.status === s.id).length));
  const artistasComDocPendente = painel.artistas.filter((a) => a.det?.docs?.some((d) => d.status !== "ok"));
  const artistasComPendencia = painel.artistas.filter((a) => (a.det?.pendencias || []).some((x) => x.status !== "resolvida"));
  const alertasEditais = painel.editais.filter((e) => (e.status === "open" || e.status === "cont" || e.status === "prev") && (e.alertas || []).length);

  return (
    <>
      <CabecalhoSecao titulo="Resumo" sub="visão de chegada — tudo se atualiza sozinho conforme você edita" />
      <div className="kpis">
        {kpis.map(([rotulo, n]) => (
          <div className="kpi" key={rotulo}><div className="n">{n}</div><div className="l">{rotulo}</div></div>
        ))}
      </div>
      <div className="dashgrid">
        <div className="panel">
          <h4>
            Próximos prazos
            {vencidos.length > 0 && <span className="act"><span className="badge ur-vencido">{vencidos.length} vencido(s)</span></span>}
          </h4>
          {linhasPrazo.map((p) => (
            <div className="mini pz" key={p.tipo + p.id} onClick={() => abrirPrazo(p)} title="abrir">
              <span className="pz-t">
                {ICONE_PRAZO[p.tipo]} {tituloCurto(p.titulo)}
                {p.detalhe && <span className="muted"> · {p.detalhe}</span>}
              </span>
              <span className="pz-d">
                {p.urgencia !== "futuro" && (
                  <span className={"badge " + CLASSE_URGENCIA[p.urgencia]}>{ROTULO_URGENCIA[p.urgencia]}</span>
                )}
                <b>{p.iso.slice(8)}/{p.iso.slice(5, 7)}</b>
              </span>
            </div>
          ))}
          {!linhasPrazo.length && <div className="mini muted">sem prazos com data</div>}
        </div>
        <div className="panel">
          <h4>Projetos por status<span className="act"><button className="btn ghost sm" onClick={() => irParaAmbiente("projetos", "pipeline")}>pipeline →</button></span></h4>
          {colunas.map((s) => {
            const n = projetos.filter((p) => p.status === s.id).length;
            return (
              <div key={s.id}>
                <div className="stagerow"><span>{s.rotulo}</span><b>{n}</b></div>
                <div className="bar"><span style={{ width: `${(n / maiorColuna) * 100}%` }} /></div>
              </div>
            );
          })}
        </div>
        <div className="panel">
          <h4>Tarefas da equipe</h4>
          {painel.tarefas.filter((t) => t.status !== "feito").slice(0, 5).map((t) => (
            <div className="mini" key={t.id}>
              <span>
                <span className="dot" style={{ width: 18, height: 18, fontSize: 9, marginRight: 6 }}>{nomeEquipe(t.respId)[0] || "?"}</span>
                {t.titulo}
              </span>
              <span className="muted">{t.prazo ? formatarData(t.prazo) : ""}</span>
            </div>
          ))}
        </div>
        <div className="panel">
          <h4>Alertas</h4>
          {vencidos.length > 0 && (
            <div className="mini">
              <span>⚠️ <b>{vencidos.length} prazo(s) vencido(s)</b> sem resolução</span>
              <span className="badge ur-vencido">venceu</span>
            </div>
          )}
          {alertasEditais.map((e) => (
            <div className="mini pz" key={"al" + e.id} onClick={() => abrirDetalhe("edital", e.id)}>
              <span>⚑ {e.curto || e.nome}: {(e.alertas || [])[0].titulo}</span>
              <span className="badge ur-d7">{(e.alertas || [])[0].quando || "alerta"}</span>
            </div>
          ))}
          {artistasComPendencia.length > 0 && (
            <div className="mini pz" onClick={() => irParaAmbiente("painel", "pendencias")}>
              <span>❓ {artistasComPendencia.length} artista(s) com pendências ou perguntas em aberto</span>
              <span className="badge st-prev">ver</span>
            </div>
          )}
          {artistasComDocPendente.map((a) => (
            <div className="mini pz" key={a.id} onClick={() => abrirDetalhe("artista", a.id, "docs")}>
              <span>📄 {a.nome}: documentos pendentes</span>
              <span className="badge st-prev">pend.</span>
            </div>
          ))}
          {!vencidos.length && !artistasComDocPendente.length && !alertasEditais.length && !artistasComPendencia.length && (
            <div className="mini muted">✓ nada urgente por aqui</div>
          )}
        </div>
      </div>
    </>
  );
}
