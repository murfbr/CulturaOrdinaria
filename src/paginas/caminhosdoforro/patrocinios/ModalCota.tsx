/* Nova ou editar cota: nome, valor (vazio = variável), quantidade à venda
   (vazio = sem limite), contrapartidas, anotações, a revisar. Excluir só
   quando nenhum patrocínio usa a cota. */
import { useState } from "react";
import { toast } from "../../../components/Toast";
import { clonar } from "../../../utils";
import { auditoria } from "../calculo";
import { apagar, gravar, novoId } from "../dados";
import type { Base, Cota } from "../tipos";
import { AreaTexto, Campo, Check, Entrada } from "../ui/Campo";
import { LINHA_INTEIRA, Modal } from "../ui/Modal";

interface Props { base: Base; id: string | null; aoFechar: () => void }

export function ModalCota({ base, id, aoFechar }: Props) {
  const existente = id ? base.cotas[id] : undefined;
  const [d, setD] = useState<Cota>(() => existente ? clonar(existente) : {
    id: novoId("cotas"), nome: "", valor: null, quantidade: null, contrapartidas: "", anotacoes: "", revisar: false,
    ordem: Object.values(base.cotas).reduce((m, c) => Math.max(m, c.ordem || 0), 0) + 1,
  });
  const [valor, setValor] = useState(d.valor == null ? "" : String(d.valor));
  const [quantidade, setQuantidade] = useState(d.quantidade == null ? "" : String(d.quantidade));
  const mudar = (parte: Partial<Cota>) => setD((a) => ({ ...a, ...parte }));

  function salvar() {
    const nome = d.nome.trim();
    if (!nome) { toast("Preencha o nome da cota."); return; }
    gravar("cotas", {
      ...d, nome, valor: valor === "" ? 0 : Number(valor), quantidade: quantidade === "" ? null : Number(quantidade),
      contrapartidas: d.contrapartidas.trim(), anotacoes: d.anotacoes.trim(),
    });
    aoFechar();
    toast(id ? "Cota salva." : "Cota criada.");
  }

  function excluir() {
    const n = Object.values(base.patrocinios).filter((p) => p.cota === id).length;
    if (n) { toast("Não dá para excluir: " + n + " patrocínio(s) usam esta cota."); return; }
    apagar("cotas", id!);
    aoFechar();
    toast("Cota excluída.");
  }

  return (
    <Modal titulo={id ? "Editar cota" : "Nova cota"} auditoria={auditoria(existente as (Cota & { atualizadoPor?: string }) | undefined)} aoFechar={aoFechar} aoSalvar={salvar} aoExcluir={id ? excluir : undefined}>
      <Campo rotulo="Nome da cota" className={LINHA_INTEIRA}><Entrada autoFocus required value={d.nome} onChange={(e) => mudar({ nome: e.target.value })} /></Campo>
      <Campo rotulo="Valor (R$)"><Entrada type="number" min={0} step={1000} value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Variável" /></Campo>
      <Campo rotulo="Quantidade à venda"><Entrada type="number" min={0} step={1} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} placeholder="Sem limite" /></Campo>
      <Campo rotulo="Contrapartidas" className={LINHA_INTEIRA}><AreaTexto rows={5} value={d.contrapartidas} onChange={(e) => mudar({ contrapartidas: e.target.value })} /></Campo>
      <Campo rotulo="Anotações" className={LINHA_INTEIRA}><AreaTexto rows={2} value={d.anotacoes} onChange={(e) => mudar({ anotacoes: e.target.value })} /></Campo>
      <Check rotulo="A revisar" className={LINHA_INTEIRA} checked={d.revisar} onChange={(e) => mudar({ revisar: e.target.checked })} />
    </Modal>
  );
}
