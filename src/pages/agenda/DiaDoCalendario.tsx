/* Painel do dia do Calendário: o que o dia selecionado tem, na ordem de
   importância. Prazos de edital em destaque (no molde do Cronograma: nome,
   projetos ligados, urgência e status), reuniões com hora e tarefas com
   responsável. Cada linha abre a ficha ou a edição sem sair da aba. */
import { Painel } from "../../components/ui/Painel";
import { Badge } from "../../components/ui/Badge";
import { Rotulo } from "../../components/ui/Rotulo";
import { Avatar } from "../../components/ui/Avatar";
import { ESTILO_AUXILIAR } from "../../components/ui/estilos";
import { abrirDetalhe } from "../../store/navegacao";
import { abrirEdicao } from "../../store/edicao";
import { CLASSE_URGENCIA, ROTULO_URGENCIA, urgenciaDe } from "../../lib/prazos";
import { nomeEquipe } from "../../lib/nomes";
import { diaVazio, type ItensDoDia } from "../../lib/agenda";
import { STATUS_EDITAL } from "../../types";
import { cx } from "../../utils/classes";

/** "quinta, 15 de outubro" a partir da data ISO. */
const tituloDoDia = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

const LINHA = "mb-2 flex cursor-pointer items-center gap-2.5 rounded-md border border-line bg-card px-3 py-2 hover:border-ink";

export function DiaDoCalendario({ iso, itens }: { iso: string; itens?: ItensDoDia }) {
  return (
    <Painel titulo={tituloDoDia(iso)} className="mb-0 self-start">
      {diaVazio(itens) && <p className={cx("m-0", ESTILO_AUXILIAR)}>Nada marcado neste dia.</p>}

      {itens?.editais.map((e) => {
        const st = STATUS_EDITAL[e.status] || STATUS_EDITAL.open;
        const urgencia = e.status !== "closed" ? urgenciaDe(e.iso) : "futuro";
        return (
          <div key={e.editalId} className={cx(LINHA, "border-l-stamp border-l-accent")}
            title="abrir a ficha do edital" onClick={() => abrirDetalhe("edital", e.editalId)}>
            <div className="min-w-0 flex-1">
              <Rotulo>Prazo do edital</Rotulo>
              <div className="font-semibold leading-tight">{e.titulo}</div>
              <div className={ESTILO_AUXILIAR}>{e.projetos.length ? e.projetos.map((p) => p.nome).join(" · ") : "sem projeto ainda"}</div>
            </div>
            <div className="flex flex-none flex-col items-end gap-1">
              {urgencia !== "futuro" && <Badge tom={CLASSE_URGENCIA[urgencia]}>{ROTULO_URGENCIA[urgencia]}</Badge>}
              <Badge tom={st.classe}>{st.rotulo}</Badge>
            </div>
          </div>
        );
      })}

      {itens?.reunioes.map((r) => (
        <div key={r.id} className={LINHA} title="abrir a ficha da reunião" onClick={() => abrirDetalhe("reuniao", r.id)}>
          <span className="font-mono text-xs text-muted">{r.hora || "—:—"}</span>
          <span className={cx("min-w-0 flex-1 truncate font-semibold", r.status === "realizada" && "text-faint line-through")}>
            {r.titulo || "Reunião"}
          </span>
          {r.local && <span className="truncate text-xs text-faint">{r.local}</span>}
        </div>
      ))}

      {itens?.tarefas.map((t) => (
        <div key={t.id} className={LINHA} title="editar a tarefa" onClick={() => abrirEdicao("tarefa", t.id)}>
          <span className="min-w-0 flex-1 text-sm font-semibold leading-tight">{t.titulo}</span>
          {t.respId && <Avatar pequeno iniciais={nomeEquipe(t.respId)[0] || "?"} title={nomeEquipe(t.respId)} />}
        </div>
      ))}
    </Painel>
  );
}
