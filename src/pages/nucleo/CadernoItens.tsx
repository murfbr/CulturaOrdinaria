/* Uma seção do caderno Melhorias: as abas como filtro, as tarefas (caixa de
   feito, etiqueta "código", quem, prazo) e as anotações, com editar e apagar,
   mais "+ Tarefa" e "+ Anotação" pelo modal. A aba escolhida vem de cima,
   para o Início e o Levar ao Gustavo poderem abrir um item onde ele está. */
import { useEffect, useState } from "react";
import { alternarFeitoCaderno, apagarDoCaderno, type Caderno } from "../../store/nucleo";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { toast } from "../../components/Toast";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { CaixaMarcar } from "../../components/ui/Campo";
import { Linha } from "../../components/ui/Linha";
import { Painel } from "../../components/ui/Painel";
import { Pilulas } from "../../components/ui/Pilulas";
import { Vazio } from "../../components/ui/Vazio";
import { ESTILO_APAGADO, ESTILO_AUXILIAR } from "../../components/ui/estilos";
import { hojeIso } from "../../lib/prazos";
import type { ItemLista, NotaCaderno, SecaoCaderno, TarefaCaderno } from "../../types";
import { formatarData, relativo } from "../../utils";
import { cx } from "../../utils/classes";
import { ModalCaderno } from "./ModalCaderno";

/** Abertas primeiro, por prazo (sem prazo no fim); feitas depois, da mais recente. */
export function ordemTarefa(a: TarefaCaderno, b: TarefaCaderno): number {
  if (a.feito !== b.feito) return a.feito ? 1 : -1;
  if (a.feito) return (b.feitoEm || "").localeCompare(a.feitoEm || "");
  return (a.prazo || "9999").localeCompare(b.prazo || "9999") || (a.criadoEm || "").localeCompare(b.criadoEm || "");
}

interface ModalAberto { tipo: "nota" | "tarefa"; item?: NotaCaderno | TarefaCaderno }
interface Props { secao: SecaoCaderno; caderno: Caderno; pessoas: ItemLista[]; aba: string; aoMudarAba: (aba: string) => void }

export function ItensDaSecao({ secao, caderno, pessoas, aba, aoMudarAba }: Props) {
  const [soAbertas, setSoAbertas] = useState(true);
  const [soCodigo, setSoCodigo] = useState(false);
  const [modal, setModal] = useState<ModalAberto | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  useEffect(() => { setConfirmando(null); }, [secao.id]);
  const hoje = hojeIso();
  const todas = caderno.tarefas.filter((t) => t.secao === secao.id);
  const tarefas = todas
    .filter((t) => (!aba || t.aba === aba) && (!soAbertas || !t.feito) && (!soCodigo || t.codigo))
    .sort(ordemTarefa);
  const notas = caderno.notas.filter((n) => n.secao === secao.id && (!aba || n.aba === aba));

  const apagar = (id: string, rotulo: string) => {
    if (confirmando !== id) { setConfirmando(id); return; }
    apagarDoCaderno(id);
    setConfirmando(null);
    toast(rotulo + " apagada");
  };
  const botoesItem = (id: string, rotulo: string, editar: () => void) => (
    <>
      <Botao variante="quieto" tamanho="mini" onClick={editar}>editar</Botao>
      <Botao variante={confirmando === id ? "perigo" : "quieto"} tamanho="mini" onClick={() => apagar(id, rotulo)}>
        {confirmando === id ? "confirmar apagar" : "apagar"}
      </Botao>
    </>
  );

  return (
    <>
      <CabecalhoSecao titulo={secao.nome} sub={aba ? "aba " + aba : "todas as abas"}>
        <Botao tamanho="pequeno" onClick={() => setModal({ tipo: "tarefa" })}>+ Tarefa</Botao>
        <Botao variante="fantasma" tamanho="pequeno" onClick={() => setModal({ tipo: "nota" })}>+ Anotação</Botao>
      </CabecalhoSecao>

      {secao.abas.length > 0 && (
        <Pilulas opcoes={[{ id: "", rotulo: "Todas" }, ...secao.abas.map((a) => ({ id: a, rotulo: a }))]} ativa={aba} aoEscolher={aoMudarAba} />
      )}

      <Painel
        titulo="Tarefas"
        sub={todas.filter((t) => !t.feito).length + " abertas de " + todas.length}
        acoes={
          <>
            <span className="flex items-center gap-1.5 text-sm text-muted"><CaixaMarcar marcado={soAbertas} aoMudar={() => setSoAbertas((v) => !v)} /> só abertas</span>
            <span className="flex items-center gap-1.5 text-sm text-muted"><CaixaMarcar marcado={soCodigo} aoMudar={() => setSoCodigo((v) => !v)} /> só código</span>
          </>
        }
      >
        {tarefas.map((t) => {
          const vencida = Boolean(t.prazo) && !t.feito && t.prazo < hoje;
          return (
            <Linha
              key={t.id} topo
              direita={
                <>
                  {t.codigo && <Badge tom="tipo" mini>código</Badge>}
                  {t.aba && !aba && <Badge mini>{t.aba}</Badge>}
                  {t.prazo && <span className={cx(ESTILO_AUXILIAR, "whitespace-nowrap", vencida && "font-semibold text-accent")}>{formatarData(t.prazo)}</span>}
                  {botoesItem(t.id, "Tarefa", () => setModal({ tipo: "tarefa", item: t }))}
                </>
              }
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5"><CaixaMarcar marcado={t.feito} aoMudar={() => alternarFeitoCaderno(t)} title={t.feito ? "feita: desmarcar" : "marcar como feita"} /></span>
                <div className="min-w-0">
                  <div className={cx("whitespace-pre-wrap", t.feito && "text-faint line-through")}>{t.texto}</div>
                  <div className={ESTILO_APAGADO}>
                    {[t.quem, t.origem, t.feito && t.feitoEm ? "feita " + relativo(t.feitoEm) : ""].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
            </Linha>
          );
        })}
        {!tarefas.length && (
          <Vazio emLinha>
            {todas.length ? (soAbertas ? "nenhuma tarefa aberta aqui (as feitas estão escondidas)" : "nenhuma tarefa com esse filtro") : "nenhuma tarefa nesta seção: \"+ Tarefa\" cadastra uma melhoria; a caixa à esquerda marca feita"}
          </Vazio>
        )}
      </Painel>

      <Painel titulo="Anotações" sub={notas.length + (notas.length === 1 ? " anotação" : " anotações")}>
        {notas.map((n) => (
          <Linha key={n.id} topo direita={<>{n.aba && !aba && <Badge mini>{n.aba}</Badge>}{botoesItem(n.id, "Anotação", () => setModal({ tipo: "nota", item: n }))}</>}>
            <div className="whitespace-pre-wrap">{n.texto}</div>
            <div className={ESTILO_APAGADO}>{[n.quem, n.origem, relativo(n.criadoEm)].filter(Boolean).join(" · ")}</div>
          </Linha>
        ))}
        {!notas.length && <Vazio emLinha>nenhuma anotação aqui</Vazio>}
      </Painel>

      {modal && <ModalCaderno secao={secao} tipo={modal.tipo} item={modal.item} pessoas={pessoas} aoFechar={() => setModal(null)} />}
    </>
  );
}
