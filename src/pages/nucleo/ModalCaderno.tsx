/* Modal de anotação ou tarefa do caderno Melhorias: texto, aba da seção,
   quem (com a lista de pessoas do caderno, mas texto livre), origem e, na
   tarefa, prazo e "precisa de código". Serve para criar e para editar. */
import { useState } from "react";
import { salvarNotaCaderno, salvarTarefaCaderno } from "../../store/nucleo";
import { AcoesModal, Modal, RodapeModal } from "../../components/Modal";
import { toast } from "../../components/Toast";
import { Botao } from "../../components/ui/Botao";
import { AreaTexto, CaixaMarcar, Campo, Entrada, Linhas, Selecao } from "../../components/ui/Campo";
import type { ItemLista, NotaCaderno, SecaoCaderno, TarefaCaderno } from "../../types";

interface Props {
  secao: SecaoCaderno;
  tipo: "nota" | "tarefa";
  item?: NotaCaderno | TarefaCaderno;
  pessoas: ItemLista[];
  aoFechar: () => void;
}

export function ModalCaderno({ secao, tipo, item, pessoas, aoFechar }: Props) {
  const tarefa = tipo === "tarefa" ? (item as TarefaCaderno | undefined) : undefined;
  const [texto, setTexto] = useState(item?.texto || "");
  const [aba, setAba] = useState(item?.aba || "");
  const [quem, setQuem] = useState(item?.quem || "");
  const [origem, setOrigem] = useState(item?.origem || "Central");
  const [prazo, setPrazo] = useState(tarefa?.prazo || "");
  const [codigo, setCodigo] = useState(Boolean(tarefa?.codigo));

  function salvar() {
    const t = texto.trim();
    if (!t) { toast("Escreva o texto."); return; }
    const comum = { id: item?.id, criadoEm: item?.criadoEm, secao: secao.id, aba, texto: t, quem: quem.trim(), origem: origem.trim() };
    if (tipo === "nota") salvarNotaCaderno(comum);
    else salvarTarefaCaderno({ ...comum, prazo, codigo, feito: tarefa?.feito || false, feitoEm: tarefa?.feitoEm || "", criadoPor: tarefa?.criadoPor || quem.trim() });
    toast(item ? "Salvo" : tipo === "nota" ? "Anotação criada" : "Tarefa criada");
    aoFechar();
  }

  return (
    <Modal titulo={(item ? "Editar: " : "Nova ") + (tipo === "nota" ? "anotação" : "tarefa")} aoFechar={aoFechar}>
      <div className="flex flex-col gap-3">
        <Campo rotulo="Texto"><AreaTexto rows={4} value={texto} onChange={(e) => setTexto(e.target.value)} autoFocus /></Campo>
        <Linhas colunas={2}>
          <Campo rotulo="Aba">
            <Selecao value={aba} onChange={(e) => setAba(e.target.value)}>
              <option value="">(sem aba)</option>
              {secao.abas.map((a) => <option key={a} value={a}>{a}</option>)}
            </Selecao>
          </Campo>
          <Campo rotulo="Quem">
            <Entrada list="caderno-pessoas" value={quem} placeholder="nome" onChange={(e) => setQuem(e.target.value)} />
            <datalist id="caderno-pessoas">{pessoas.map((p) => <option key={p.id} value={p.nome} />)}</datalist>
          </Campo>
          {tipo === "tarefa" && <Campo rotulo="Prazo"><Entrada type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} /></Campo>}
          <Campo rotulo="Origem"><Entrada value={origem} placeholder="reunião 05/10, backlog…" onChange={(e) => setOrigem(e.target.value)} /></Campo>
        </Linhas>
        {tipo === "tarefa" && (
          <span className="flex items-center gap-2 text-sm"><CaixaMarcar marcado={codigo} aoMudar={() => setCodigo((v) => !v)} /> precisa de código (entra em "Levar ao Gustavo")</span>
        )}
      </div>
      <RodapeModal>
        <AcoesModal>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao onClick={salvar}>Salvar</Botao>
        </AcoesModal>
      </RodapeModal>
    </Modal>
  );
}
