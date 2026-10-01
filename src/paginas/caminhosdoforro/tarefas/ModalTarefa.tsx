/* Nova ou editar tarefa: título, núcleo, responsável (só entre os membros
   do núcleo; vazio = o responsável do núcleo), prazo, status, urgente,
   anotações. */
import { useState } from "react";
import { toast } from "../../../components/Toast";
import { clonar } from "../../../utils";
import { auditoria, nomeCadastro, nucleo } from "../calculo";
import { apagar, gravar, novoId } from "../dados";
import { opcoes } from "../listas";
import type { Base, TarefaFestival } from "../tipos";
import { AreaTexto, Campo, Check, Entrada, Opcoes, Selecao } from "../ui/Campo";
import { LINHA_INTEIRA, Modal } from "../ui/Modal";

interface Props { base: Base; id: string | null; preset?: Partial<TarefaFestival>; aoFechar: () => void }

export function ModalTarefa({ base, id, preset, aoFechar }: Props) {
  const existente = id ? base.tarefas[id] : undefined;
  const p = base.pagina;
  const [d, setD] = useState<TarefaFestival>(() => existente ? clonar(existente) : {
    id: novoId("tarefas"), titulo: "", nucleo: "", responsavel: null, prazo: null, status: p.listas.statusTarefa[0]?.id || "",
    urgente: false, anotacoes: "", ordem: Object.values(base.tarefas).reduce((m, x) => Math.max(m, x.ordem || 0), 0) + 1,
    ...preset,
  });
  const mudar = (parte: Partial<TarefaFestival>) => setD((a) => ({ ...a, ...parte }));

  const n = nucleo(base, d.nucleo);
  const membros = (n?.membros || []).filter((m) => base.cadastro[m]);
  const padrao = n?.responsavel ? "Responsável do núcleo (" + nomeCadastro(base, n.responsavel) + ")" : "Responsável do núcleo";

  function salvar() {
    const titulo = d.titulo.trim();
    if (!titulo) { toast("Escreva a tarefa."); return; }
    if (!d.nucleo) { toast("Escolha o núcleo."); return; }
    if (d.responsavel && !membros.includes(d.responsavel)) { toast("O responsável precisa ser membro do núcleo."); return; }
    gravar("tarefas", { ...d, titulo, responsavel: d.responsavel || null, prazo: d.prazo || null, anotacoes: d.anotacoes.trim() });
    aoFechar();
    toast(id ? "Tarefa salva." : "Tarefa criada.");
  }

  function excluir() {
    apagar("tarefas", id!);
    aoFechar();
    toast("Tarefa excluída.");
  }

  return (
    <Modal titulo={id ? "Editar tarefa" : "Nova tarefa"} auditoria={auditoria(existente as (TarefaFestival & { atualizadoPor?: string }) | undefined)} aoFechar={aoFechar} aoSalvar={salvar} aoExcluir={id ? excluir : undefined}>
      <Campo rotulo="Tarefa" className={LINHA_INTEIRA}><Entrada autoFocus required value={d.titulo} onChange={(e) => mudar({ titulo: e.target.value })} /></Campo>
      <Campo rotulo="Núcleo">
        <Selecao value={d.nucleo} onChange={(e) => mudar({ nucleo: e.target.value, responsavel: null })}><Opcoes lista={opcoes(p, "nucleos", "Escolha")} /></Selecao>
      </Campo>
      <Campo rotulo="Responsável">
        <Selecao value={d.responsavel || ""} onChange={(e) => mudar({ responsavel: e.target.value || null })}>
          <option value="">{padrao}</option>
          {membros.map((m) => <option key={m} value={m}>{nomeCadastro(base, m)}</option>)}
          {d.responsavel && !membros.includes(d.responsavel) && <option value={d.responsavel}>{nomeCadastro(base, d.responsavel)} (fora do núcleo)</option>}
        </Selecao>
      </Campo>
      <Campo rotulo="Prazo"><Entrada type="date" value={d.prazo || ""} onChange={(e) => mudar({ prazo: e.target.value || null })} /></Campo>
      <Campo rotulo="Status"><Selecao value={d.status} onChange={(e) => mudar({ status: e.target.value })}><Opcoes lista={opcoes(p, "statusTarefa")} /></Selecao></Campo>
      <Check rotulo="Urgente" className={LINHA_INTEIRA} checked={d.urgente} onChange={(e) => mudar({ urgente: e.target.checked })} />
      <Campo rotulo="Anotações" className={LINHA_INTEIRA}><AreaTexto rows={4} value={d.anotacoes} onChange={(e) => mudar({ anotacoes: e.target.value })} /></Campo>
    </Modal>
  );
}
