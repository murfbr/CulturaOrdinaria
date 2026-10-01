/* Novo ou editar núcleo: nome, membros (pessoas da equipe) e responsável
   (um dos membros). Os núcleos ficam no documento da página. Excluir só
   quando nenhum cadastro, item de orçamento ou tarefa usa o núcleo. */
import { useState } from "react";
import { toast } from "../../../components/Toast";
import { cadastrosDoTipo, nomeCadastro, nucleo, nucleosDe } from "../calculo";
import { alterarPagina } from "../dados";
import { idDeItem, usos } from "../listas";
import type { Base } from "../tipos";
import { Campo, Entrada, Grupo, Selecao } from "../ui/Campo";
import { LISTA_MARCAR } from "../ui/classes";
import { LINHA_INTEIRA, Modal } from "../ui/Modal";

interface Props { base: Base; id: string | null; aoFechar: () => void }

export function ModalNucleo({ base, id, aoFechar }: Props) {
  const existente = id ? nucleo(base, id) : null;
  const [nome, setNome] = useState(existente?.nome || "");
  const [membros, setMembros] = useState<string[]>(() => (existente?.membros || []).filter((m) => base.cadastro[m]));
  const [resp, setResp] = useState(existente?.responsavel || "");
  const equipe = cadastrosDoTipo(base, "equipe");
  const respValido = resp && membros.includes(resp) ? resp : "";

  function salvar() {
    const n = nome.trim();
    if (!n) { toast("Dê um nome ao núcleo."); return; }
    const lista = base.pagina.nucleos.map((x) => ({ ...x }));
    let nid = id;
    if (nid) {
      const i = lista.findIndex((x) => x.id === nid);
      lista[i] = { ...lista[i], nome: n, membros, responsavel: respValido || null };
    } else {
      nid = idDeItem(n, new Set(lista.map((x) => x.id)));
      lista.push({ id: nid, nome: n, membros, responsavel: respValido || null });
    }
    const saiu = Object.values(base.tarefas).filter((t) => t.nucleo === nid && t.responsavel && !membros.includes(t.responsavel)).length;
    alterarPagina((p) => { p.nucleos = lista; });
    aoFechar();
    toast(saiu ? "Núcleo salvo. " + saiu + " tarefa(s) ficaram com responsável fora do núcleo." : "Núcleo salvo.");
  }

  function excluir() {
    const u = usos(base, "nucleos", id!);
    if (u) { toast("Não dá para excluir: o núcleo é usado em " + u + " registros (tarefas, orçamento ou cadastro)."); return; }
    alterarPagina((p) => { p.nucleos = p.nucleos.filter((x) => x.id !== id); });
    aoFechar();
    toast("Núcleo excluído.");
  }

  return (
    <Modal titulo={id ? "Editar núcleo" : "Novo núcleo"} aoFechar={aoFechar} aoSalvar={salvar} aoExcluir={id ? excluir : undefined}>
      <Campo rotulo="Nome do núcleo" className={LINHA_INTEIRA}><Entrada autoFocus required value={nome} onChange={(e) => setNome(e.target.value)} /></Campo>
      <Grupo rotulo="Membros" className={LINHA_INTEIRA}>
        <div className={LISTA_MARCAR}>
          {equipe.length ? equipe.map((e) => {
            const outros = nucleosDe(base, e.id).filter((x) => x.id !== id);
            return (
              <label key={e.id} className="cdf:flex cdf:cursor-pointer cdf:items-center cdf:gap-2 cdf:rounded-md cdf:px-2 cdf:py-1.5 cdf:text-base cdf:hover:bg-superficie-2">
                <input
                  type="checkbox" checked={membros.includes(e.id)} className="cdf:h-[17px] cdf:w-[17px] cdf:shrink-0 cdf:accent-primaria"
                  onChange={(ev) => setMembros(ev.target.checked ? [...membros, e.id] : membros.filter((m) => m !== e.id))}
                />
                <span>{e.nome}</span>
                {outros.length > 0 && <span className="cdf:ml-auto cdf:text-[12.5px] cdf:text-fraco">também em {outros.map((x) => x.nome).join(", ")}</span>}
              </label>
            );
          }) : <p className="cdf:m-0 cdf:p-2 cdf:text-fraco">Cadastre as pessoas da equipe primeiro.</p>}
        </div>
        <p className="cdf:m-0 cdf:mt-1.5 cdf:text-sm cdf:text-fraco">Uma pessoa pode estar em vários núcleos. As tarefas do núcleo só podem ir para os membros dele.</p>
      </Grupo>
      <Campo rotulo="Responsável" className={LINHA_INTEIRA}>
        <Selecao value={respValido} onChange={(e) => setResp(e.target.value)}>
          <option value="">Sem responsável</option>
          {membros.filter((m) => base.cadastro[m]).map((m) => <option key={m} value={m}>{nomeCadastro(base, m)}</option>)}
        </Selecao>
      </Campo>
    </Modal>
  );
}
