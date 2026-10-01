/* Novo ou editar espaço: nome, tipo, capacidade, quem pode ocupar (tipos de
   cadastro), anotações, a revisar. Excluir só sem horários na grade. */
import { useState } from "react";
import { toast } from "../../../components/Toast";
import { clonar } from "../../../utils";
import { auditoria } from "../calculo";
import { apagar, gravar, novoId } from "../dados";
import { opcoes } from "../listas";
import type { Base, Espaco } from "../tipos";
import { AreaTexto, Campo, Check, Chips, Entrada, Grupo, Opcoes, Selecao } from "../ui/Campo";
import { LINHA_INTEIRA, Modal } from "../ui/Modal";

interface Props { base: Base; id: string | null; aoFechar: () => void }

export function ModalEspaco({ base, id, aoFechar }: Props) {
  const existente = id ? base.espacos[id] : undefined;
  const [d, setD] = useState<Espaco>(() => existente ? clonar(existente) : {
    id: novoId("espacos"), nome: "", tipo: "", capacidade: null, aceita: [], anotacoes: "", revisar: false,
  });
  const [capacidade, setCapacidade] = useState(d.capacidade == null ? "" : String(d.capacidade));
  const p = base.pagina;
  const mudar = (parte: Partial<Espaco>) => setD((a) => ({ ...a, ...parte }));

  function salvar() {
    const nome = d.nome.trim();
    if (!nome) { toast("Preencha o nome."); return; }
    if (!d.tipo) { toast("Escolha o tipo de espaço."); return; }
    gravar("espacos", { ...d, nome, capacidade: capacidade === "" ? null : Number(capacidade), anotacoes: d.anotacoes.trim() });
    aoFechar();
    toast(id ? "Espaço salvo." : "Espaço criado.");
  }

  function excluir() {
    const n = Object.values(base.slots).filter((s) => s.espaco === id).length;
    if (n) { toast("Não dá para excluir: o espaço tem " + n + " horários na grade."); return; }
    apagar("espacos", id!);
    aoFechar();
    toast("Espaço excluído.");
  }

  return (
    <Modal titulo={id ? "Editar espaço" : "Novo espaço"} auditoria={auditoria(existente as (Espaco & { atualizadoPor?: string }) | undefined)} aoFechar={aoFechar} aoSalvar={salvar} aoExcluir={id ? excluir : undefined}>
      <Campo rotulo="Nome" className={LINHA_INTEIRA}><Entrada autoFocus required value={d.nome} onChange={(e) => mudar({ nome: e.target.value })} /></Campo>
      <Campo rotulo="Tipo"><Selecao value={d.tipo} onChange={(e) => mudar({ tipo: e.target.value })}><Opcoes lista={opcoes(p, "tiposEspaco", "Escolha")} /></Selecao></Campo>
      <Campo rotulo="Capacidade"><Entrada type="number" min={0} step={1} value={capacidade} onChange={(e) => setCapacidade(e.target.value)} placeholder="A definir" /></Campo>
      <Grupo rotulo="Quem pode ocupar este espaço" className={LINHA_INTEIRA}>
        <Chips nome="aceita" opcoes={opcoes(p, "tiposCadastro")} marcados={d.aceita} aoMudar={(aceita) => mudar({ aceita })} />
      </Grupo>
      <Campo rotulo="Anotações" className={LINHA_INTEIRA}><AreaTexto rows={3} value={d.anotacoes} onChange={(e) => mudar({ anotacoes: e.target.value })} /></Campo>
      <Check rotulo="A revisar" className={LINHA_INTEIRA} checked={d.revisar} onChange={(e) => mudar({ revisar: e.target.checked })} />
    </Modal>
  );
}
