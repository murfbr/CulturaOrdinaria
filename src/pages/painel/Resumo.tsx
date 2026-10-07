/* Resumo: a visão de chegada — KPIs, prazos com urgência, projetos por status,
   tarefas em aberto e alertas. Tudo derivado, nada editável aqui. Montado só
   com os blocos de ui/ (Kpi, Painel, Linha, Badge, Barra, Avatar). */
import { usarCentral } from "../../store/central";
import { abrirDetalhe, irParaAmbiente } from "../../store/navegacao";
import { abrirEdicao } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { GradeKpis, Kpi } from "../../components/ui/Kpi";
import { Grade } from "../../components/ui/Grade";
import { Painel } from "../../components/ui/Painel";
import { Linha } from "../../components/ui/Linha";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { Barra } from "../../components/ui/Barra";
import { Avatar } from "../../components/ui/Avatar";
import { Vazio } from "../../components/ui/Vazio";
import { ESTILO_AUXILIAR } from "../../components/ui/estilos";
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
      <GradeKpis>
        {kpis.map(([rotulo, n]) => <Kpi key={rotulo} n={n} rotulo={rotulo} />)}
      </GradeKpis>
      <Grade colunas={2}>
        <Painel
          titulo="Próximos prazos"
          acoes={vencidos.length > 0 ? <Badge tom="ur-vencido">{vencidos.length} vencido(s)</Badge> : undefined}
        >
          {linhasPrazo.map((p) => (
            <Linha
              key={p.tipo + p.id} compacta title="abrir" aoClicar={() => abrirPrazo(p)}
              direita={
                <>
                  {p.urgencia !== "futuro" && <Badge tom={CLASSE_URGENCIA[p.urgencia]}>{ROTULO_URGENCIA[p.urgencia]}</Badge>}
                  <b className="tabular-nums">{p.iso.slice(8)}/{p.iso.slice(5, 7)}</b>
                </>
              }
            >
              <div className="truncate">
                {ICONE_PRAZO[p.tipo]} {tituloCurto(p.titulo)}
                {p.detalhe && <span className="text-muted"> · {p.detalhe}</span>}
              </div>
            </Linha>
          ))}
          {!linhasPrazo.length && <Vazio emLinha>sem prazos com data</Vazio>}
        </Painel>

        <Painel
          titulo="Projetos por status"
          acoes={<Botao variante="fantasma" tamanho="pequeno" onClick={() => irParaAmbiente("projetos", "pipeline")}>pipeline →</Botao>}
        >
          {colunas.map((s) => {
            const n = projetos.filter((p) => p.status === s.id).length;
            return (
              <div key={s.id}>
                <div className="mb-0.5 mt-2 flex justify-between text-xs text-muted"><span>{s.rotulo}</span><b className="tabular-nums">{n}</b></div>
                <Barra pct={(n / maiorColuna) * 100} />
              </div>
            );
          })}
        </Painel>

        <Painel titulo="Tarefas da equipe">
          {tarefasOrdenadas.slice(0, 6).map((t) => {
            const vencida = Boolean(t.prazo) && (t.prazo as string) < hoje;
            return (
              <Linha
                key={t.id} compacta
                direita={
                  <>
                    {t.prazo && (vencida
                      ? <Badge tom="ur-vencido">{formatarData(t.prazo)}</Badge>
                      : <span className={ESTILO_AUXILIAR}>{formatarData(t.prazo)}</span>)}
                    <Botao variante="quieto" tamanho="mini" title="marcar como concluída"
                      onClick={() => { alternarTarefaConcluida(t); toast("Tarefa concluída"); }}>✓</Botao>
                    {vencida && (
                      <Botao variante="quieto" tamanho="mini" title="adiar 7 dias a partir de hoje"
                        onClick={() => { adiarTarefa(t, 7); toast("Prazo adiado 7 dias"); }}>+7d</Botao>
                    )}
                  </>
                }
              >
                <span className="flex cursor-pointer items-center gap-1.5" title="abrir a tarefa" onClick={() => abrirEdicao("tarefa", t.id)}>
                  <Avatar pequeno iniciais={nomeEquipe(t.respId)[0] || "?"} />
                  {t.titulo}
                </span>
              </Linha>
            );
          })}
          {tarefasOrdenadas.length > 6 && (
            <Linha compacta className="text-muted" aoClicar={() => irParaAmbiente("gestao", "quadro")}>
              + {tarefasOrdenadas.length - 6} tarefa(s) no quadro →
            </Linha>
          )}
        </Painel>

        <Painel titulo="Alertas">
          {vencidos.length > 0 && (
            <Linha compacta direita={<Badge tom="ur-vencido">venceu</Badge>}>
              ⚠️ <b>{vencidos.length} prazo(s) vencido(s)</b> sem resolução
            </Linha>
          )}
          {alertasEditais.slice(0, 8).map(({ e, a }) => (
            <Linha key={"al" + e.id + a.titulo} compacta aoClicar={() => abrirDetalhe("edital", e.id)}
              direita={<Badge tom="ur-d7">{a.quando || "alerta"}</Badge>}>
              ⚑ {e.curto || e.nome}: {a.titulo}
            </Linha>
          ))}
          {alertasEditais.length > 8 && (
            <Linha compacta className="text-muted" aoClicar={() => irParaAmbiente("cadastros", "editais")}>
              + {alertasEditais.length - 8} alerta(s) em Cadastros → Editais → Alertas
            </Linha>
          )}
          {artistasComPendencia.length > 0 && (
            <Linha compacta aoClicar={() => irParaAmbiente("painel", "pendencias")} direita={<Badge tom="st-prev">ver</Badge>}>
              ❓ {artistasComPendencia.length} artista(s) com pendências ou perguntas em aberto
            </Linha>
          )}
          {artistasComDocPendente.map((a) => (
            <Linha key={a.id} compacta aoClicar={() => abrirDetalhe("artista", a.id, "docs")} direita={<Badge tom="st-prev">pend.</Badge>}>
              📄 {a.nome}: documentos pendentes
            </Linha>
          ))}
          {!vencidos.length && !artistasComDocPendente.length && !alertasEditais.length && !artistasComPendencia.length && (
            <Vazio emLinha>✓ nada urgente por aqui</Vazio>
          )}
        </Painel>
      </Grade>
    </>
  );
}
