/* Modal de exportar o formulário do projeto: escolhe as etapas (todas
   marcadas por padrão) e o formato, PDF (pela impressão do navegador) ou .doc
   (download). O conteúdo vem de lib/exportarProjeto. */
import { useState } from "react";
import { AcoesModal, Modal, RodapeModal } from "../../components/Modal";
import { toast } from "../../components/Toast";
import { Botao } from "../../components/ui/Botao";
import { Marcacao } from "../../components/ui/Campo";
import { Dica } from "../../components/ui/Dica";
import { Pilulas } from "../../components/ui/Pilulas";
import { ESTILO_MONO } from "../../components/ui/estilos";
import { baixarDoc, htmlDoProjeto, imprimirPdf, type FormatoExportacao } from "../../lib/exportarProjeto";
import { pctEtapa } from "../../lib/simulador/motor";
import type { Formulario, Projeto, Rascunho } from "../../types";

interface Props {
  projeto: Projeto;
  rascunho: Rascunho;
  formulario: Formulario;
  aoFechar: () => void;
}

export function ModalExportarProjeto({ projeto, rascunho, formulario: f, aoFechar }: Props) {
  const [escolhidas, setEscolhidas] = useState<number[]>(() => f.etapas.map((_, i) => i));
  const [formato, setFormato] = useState<FormatoExportacao>("pdf");
  const todas = escolhidas.length === f.etapas.length;

  const alternar = (i: number, on: boolean) =>
    setEscolhidas((atual) => (on ? [...atual, i].sort((a, b) => a - b) : atual.filter((k) => k !== i)));

  function exportar() {
    const html = htmlDoProjeto(projeto, rascunho, escolhidas);
    if (formato === "doc") {
      baixarDoc(projeto, html);
      toast("Documento .doc gerado");
    } else if (imprimirPdf(html)) {
      toast("Na janela de impressão, escolha \"Salvar como PDF\"");
    } else {
      toast("O navegador bloqueou a janela. Permita pop-ups para este site e tente de novo.");
    }
    aoFechar();
  }

  return (
    <Modal titulo="Exportar formulário" aoFechar={aoFechar}>
      <Dica emModal className="mb-3">
        {projeto.nome} · {f.nome}. Entram só os campos preenchidos, na ordem do formulário.
      </Dica>

      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-semibold">Etapas</span>
        <Botao variante="link" tamanho="pequeno" onClick={() => setEscolhidas(todas ? [] : f.etapas.map((_, i) => i))}>
          {todas ? "desmarcar todas" : "marcar todas"}
        </Botao>
      </div>
      <div className="mb-4 flex flex-col gap-1 rounded-md border border-line bg-bg px-3 py-2">
        {f.etapas.map((e, i) => (
          <Marcacao key={e.id} marcado={escolhidas.includes(i)} aoMudar={(on) => alternar(i, on)}>
            <span className={ESTILO_MONO}>{e.cod || i + 1}</span> {e.nome}
            <span className="ml-auto text-2xs text-faint tabular-nums">{pctEtapa(rascunho, i)}%</span>
          </Marcacao>
        ))}
      </div>

      <span className="mb-1 block text-sm font-semibold">Formato</span>
      <Pilulas
        opcoes={[{ id: "pdf", rotulo: "PDF" }, { id: "doc", rotulo: "Word (.doc)" }]}
        ativa={formato}
        aoEscolher={(id) => setFormato(id as FormatoExportacao)}
      />
      <Dica emModal>
        {formato === "pdf"
          ? "Abre a janela de impressão do navegador: escolha \"Salvar como PDF\" como impressora."
          : "Baixa um arquivo .doc que abre no Word, no LibreOffice e no Google Docs, editável."}
      </Dica>

      <RodapeModal>
        <AcoesModal>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao disabled={!escolhidas.length} onClick={exportar}>
            {formato === "pdf" ? "Gerar PDF" : "Baixar .doc"}
          </Botao>
        </AcoesModal>
      </RodapeModal>
    </Modal>
  );
}
