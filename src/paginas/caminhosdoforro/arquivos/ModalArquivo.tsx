/* Novo ou editar cartão de arquivo: nome, descrição e, no Contexto, o grupo.
   Excluir (só no Contexto) apaga as versões no Storage e os comentários do
   cartão. Os três cartões das Apresentações são fixos: só nome e descrição. */
import { useState } from "react";
import { toast } from "../../../components/Toast";
import { clonar } from "../../../utils";
import { auditoria } from "../calculo";
import { apagar, gravar, novoId } from "../dados";
import { GRUPOS_CONTEXTO, type ArquivoBase, type Base } from "../tipos";
import { AreaTexto, Campo, Entrada, Opcoes, Selecao } from "../ui/Campo";
import { LINHA_INTEIRA, Modal } from "../ui/Modal";
import { apagarArquivo } from "./armazenamento";

interface Props { base: Base; id: string | null; grupo?: string; aoFechar: () => void }

export function ModalArquivo({ base, id, grupo, aoFechar }: Props) {
  const existente = id ? base.arquivos[id] : undefined;
  const [d, setD] = useState<ArquivoBase>(() => existente ? clonar(existente) : {
    id: novoId("arquivos"), secao: "contexto", grupo: grupo || GRUPOS_CONTEXTO[0][0], nome: "", descricao: "", versoes: [],
    ordem: Object.values(base.arquivos).reduce((m, x) => Math.max(m, x.ordem || 0), 0) + 1,
  });
  const mudar = (parte: Partial<ArquivoBase>) => setD((a) => ({ ...a, ...parte }));

  function salvar() {
    const nome = d.nome.trim();
    if (!nome) { toast("Dê um nome ao arquivo."); return; }
    gravar("arquivos", { ...d, nome, descricao: d.descricao.trim() });
    aoFechar();
    toast(id ? "Arquivo salvo." : "Cartão criado. Agora envie a primeira versão.");
  }

  function excluir() {
    existente?.versoes.forEach((v) => { void apagarArquivo(v.arquivo); });
    Object.values(base.comentarios).filter((c) => c.sobre === "arquivo:" + id).forEach((c) => apagar("comentarios", c.id));
    apagar("arquivos", id!);
    aoFechar();
    toast("Arquivo excluído, com as versões e os comentários.");
  }

  return (
    <Modal titulo={id ? "Editar arquivo" : "Novo arquivo"} auditoria={auditoria(existente as (ArquivoBase & { atualizadoPor?: string }) | undefined)} aoFechar={aoFechar} aoSalvar={salvar} aoExcluir={id && d.secao === "contexto" ? excluir : undefined}>
      <Campo rotulo="Nome" className={LINHA_INTEIRA}><Entrada autoFocus required value={d.nome} onChange={(e) => mudar({ nome: e.target.value })} /></Campo>
      {d.secao === "contexto" && (
        <Campo rotulo="Grupo" className={LINHA_INTEIRA}><Selecao value={d.grupo} onChange={(e) => mudar({ grupo: e.target.value })}><Opcoes lista={GRUPOS_CONTEXTO} /></Selecao></Campo>
      )}
      <Campo rotulo="Descrição" className={LINHA_INTEIRA}><AreaTexto rows={2} value={d.descricao} onChange={(e) => mudar({ descricao: e.target.value })} /></Campo>
    </Modal>
  );
}
