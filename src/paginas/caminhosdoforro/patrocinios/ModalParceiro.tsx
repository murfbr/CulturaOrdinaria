/* Novo ou editar parceiro institucional: parceiro (do cadastro, ou cadastrar
   um novo de dentro do modal), categoria, o que oferece, o que recebe, a
   revisar. Excluir tira da lista; o cadastro continua. */
import { useState } from "react";
import { toast } from "../../../components/Toast";
import { clonar } from "../../../utils";
import { auditoria, nucleo } from "../calculo";
import { apagar, criarCadastroRapido, gravar, novoId } from "../dados";
import { opcoes } from "../listas";
import type { Base, Parceiro } from "../tipos";
import { AreaTexto, Campo, Check, Entrada, Opcoes, Selecao } from "../ui/Campo";
import { LINHA_INTEIRA, Modal } from "../ui/Modal";
import { NOVO, SelecaoCadastro } from "../ui/SelecaoCadastro";

interface Props { base: Base; id: string | null; aoFechar: () => void }

export function ModalParceiro({ base, id, aoFechar }: Props) {
  const existente = id ? base.parceiros[id] : undefined;
  const p = base.pagina;
  const [d, setD] = useState<Parceiro>(() => existente ? clonar(existente) : {
    id: novoId("parceiros"), parceiro: "", categoria: "", oferece: "", recebe: "", revisar: false,
  });
  const [novoNome, setNovoNome] = useState("");
  const mudar = (parte: Partial<Parceiro>) => setD((a) => ({ ...a, ...parte }));

  function salvar() {
    let parceiro = d.parceiro;
    if (!parceiro) { toast("Escolha o parceiro."); return; }
    if (!d.categoria) { toast("Escolha a categoria."); return; }
    if (parceiro === NOVO) {
      const nome = novoNome.trim();
      if (!nome) { toast("Escreva o nome do novo parceiro."); return; }
      parceiro = criarCadastroRapido(nome, "parceiro_institucional", nucleo(base, "captacao") ? "captacao" : null);
    }
    gravar("parceiros", { ...d, parceiro, oferece: d.oferece.trim(), recebe: d.recebe.trim() });
    aoFechar();
    toast(id ? "Parceiro salvo." : "Parceiro registrado.");
  }

  function excluir() {
    apagar("parceiros", id!);
    aoFechar();
    toast("Parceiro removido desta lista. O cadastro continua.");
  }

  return (
    <Modal titulo={id ? "Editar parceiro institucional" : "Novo parceiro institucional"} auditoria={auditoria(existente as (Parceiro & { atualizadoPor?: string }) | undefined)} aoFechar={aoFechar} aoSalvar={salvar} aoExcluir={id ? excluir : undefined}>
      <Campo rotulo="Parceiro" className={LINHA_INTEIRA}>
        <SelecaoCadastro autoFocus base={base} tipo="parceiro_institucional" value={d.parceiro} aoMudar={(parceiro) => mudar({ parceiro })} rotuloVazio="Escolha no cadastro" rotuloNovo="Cadastrar novo parceiro…" />
      </Campo>
      {d.parceiro === NOVO && (
        <Campo rotulo="Nome do novo parceiro" className={LINHA_INTEIRA}><Entrada autoFocus value={novoNome} onChange={(e) => setNovoNome(e.target.value)} /></Campo>
      )}
      <Campo rotulo="Categoria" className={LINHA_INTEIRA}>
        <Selecao value={d.categoria} onChange={(e) => mudar({ categoria: e.target.value })}><Opcoes lista={opcoes(p, "categoriasParceiro", "Escolha")} /></Selecao>
      </Campo>
      <Campo rotulo="O que oferece ao festival" className={LINHA_INTEIRA}><AreaTexto rows={3} value={d.oferece} onChange={(e) => mudar({ oferece: e.target.value })} /></Campo>
      <Campo rotulo="O que recebe em troca" className={LINHA_INTEIRA}><AreaTexto rows={3} value={d.recebe} onChange={(e) => mudar({ recebe: e.target.value })} /></Campo>
      <Check rotulo="A revisar" className={LINHA_INTEIRA} checked={d.revisar} onChange={(e) => mudar({ revisar: e.target.checked })} />
    </Modal>
  );
}
