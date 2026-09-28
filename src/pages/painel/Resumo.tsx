/* Resumo: a visão de chegada — KPIs, prazos com urgência, projetos por status,
   tarefas em aberto e alertas. Tudo derivado, nada editável aqui. */
import { usarCentral } from "../../store/central";
import { abrirDetalhe, irParaAmbiente } from "../../store/navegacao";
import { abrirEdicao } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { tituloCurto } from "../../lib/agenda";
import { nomeEquipe } from "../../lib/nomes";
import { CLASSE_URGENCIA, ROTULO_URGENCIA, alertasVigentes, dataDoAlerta, hojeIso, itensDePrazo, statusEfetivo, type ItemPrazo } from "../../lib/prazos";
import { adiarTarefa, alternarTarefaConcluida } from "../../store/mutacoes";
import { toast } from "../../components/Toast";
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
  const hoje = hojeIso();
  const abertos = painel.editais.filter((e) => ["open", "cont"].includes(statusEfetivo(e, hoje))).length;
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
  // Alertas ainda valendo, de editais que não estão encerrados (nem pelo prazo), do mais próximo ao mais distante.
  const alertasEditais = painel.editais
    .filter((e) => ["open", "cont", "prev"].includes(statusEfetivo(e, hoje)))
    .flatMap((e) => alertasVigentes(e, hoje).map((a) => ({ e, a, data: dataDoAlerta(a, e) || "9999" })))
    .sort((x, y) => x.data.localeCompare(y.data))
    .filter((x, i, todos) => todos.findIndex((y) => y.a.titulo === x.a.titulo) === i);
  // Tarefas em aberto: vencidas primeiro, depois pelo prazo; sem prazo no fim.
  const tarefasOrdenadas = painel.tarefas
    .filter((t) => t.status !== "feito")
    .sort((a, b) => (a.prazo || "9999").localeCompare(b.prazo || "9999"));

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
          {tarefasOrdenadas.slice(0, 6).map((t) => {
            const vencida = Boolean(t.prazo) && (t.prazo as string) < hoje;
            return (
              <div className="mini tarefa-rapida" key={t.id}>
                <span className="pz" onClick={() => abrirEdicao("tarefa", t.id)} title="abrir a tarefa">
                  <span className="dot" style={{ width: 18, height: 18, fontSize: 9, marginRight: 6 }}>{nomeEquipe(t.respId)[0] || "?"}</span>
                  {t.titulo}
                </span>
                <span className="acoes-rapidas">
                  {t.prazo && <span className={vencida ? "badge ur-vencido" : "muted"}>{formatarData(t.prazo)}</span>}
                  <button className="btn sm quiet" title="marcar como concluída" onClick={() => { alternarTarefaConcluida(t); toast("Tarefa concluída"); }}>✓</button>
                  {vencida && <button className="btn sm quiet" title="adiar 7 dias a partir de hoje" onClick={() => { adiarTarefa(t, 7); toast("Prazo adiado 7 dias"); }}>+7d</button>}
                </span>
              </div>
            );
          })}
          {tarefasOrdenadas.length > 6 && (
            <div className="mini pz muted" onClick={() => irParaAmbiente("gestao", "quadro")}>+ {tarefasOrdenadas.length - 6} tarefa(s) no quadro →</div>
          )}
        </div>
        <div className="panel">
          <h4>Alertas</h4>
          {vencidos.length > 0 && (
            <div className="mini">
              <span>⚠️ <b>{vencidos.length} prazo(s) vencido(s)</b> sem resolução</span>
              <span className="badge ur-vencido">venceu</span>
            </div>
          )}
          {alertasEditais.slice(0, 8).map(({ e, a }) => (
            <div className="mini pz" key={"al" + e.id + a.titulo} onClick={() => abrirDetalhe("edital", e.id)}>
              <span>⚑ {e.curto || e.nome}: {a.titulo}</span>
              <span className="badge ur-d7">{a.quando || "alerta"}</span>
            </div>
          ))}
          {alertasEditais.length > 8 && (
            <div className="mini pz muted" onClick={() => irParaAmbiente("cadastros", "editais")}>+ {alertasEditais.length - 8} alerta(s) em Cadastros → Editais → Alertas</div>
          )}
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
