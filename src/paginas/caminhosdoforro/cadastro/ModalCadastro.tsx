/* Novo ou editar cadastro: nome, tipos (um ou mais), status, núcleo que
   cuida, contato, documento, carta de anuência e o link do arquivo,
   anotações, a revisar. Excluir só quando nada aponta para o registro. */
import { useState } from "react";
import { toast } from "../../../components/Toast";
import { clonar } from "../../../utils";
import { auditoria, referenciasDoCadastro } from "../calculo";
import { apagar, gravar, novoId } from "../dados";
import { opcoes } from "../listas";
import type { Base, Cadastro } from "../tipos";
import { arquivoDoLink, linkValido } from "../ui/Arquivo";
import { AreaTexto, Campo, Check, Chips, Entrada, Grupo, Opcoes, Selecao } from "../ui/Campo";
import { LINHA_INTEIRA, Modal } from "../ui/Modal";

interface Props {
  base: Base;
  /** null = novo. */
  id: string | null;
  /** Valores iniciais de um cadastro novo (ex.: tipo equipe, já confirmado). */
  preset?: Partial<Cadastro>;
  aoFechar: () => void;
}

export function ModalCadastro({ base, id, preset, aoFechar }: Props) {
  const existente = id ? base.cadastro[id] : undefined;
  const [d, setD] = useState<Cadastro>(() => existente ? clonar(existente) : {
    id: novoId("cadastro"), nome: "", tipos: [], status: "a_contatar", nucleo: null,
    contato: { nome: "", telefone: "", email: "" }, documento: "", carta: null, cartaArquivo: null,
    historico: [], anotacoes: "", revisar: false, ...preset,
  });
  const [arquivo, setArquivo] = useState(d.cartaArquivo?.tipo === "link" ? d.cartaArquivo.url || "" : "");
  const p = base.pagina;
  const mudar = (parte: Partial<Cadastro>) => setD((a) => ({ ...a, ...parte }));
  const mudarContato = (parte: Partial<Cadastro["contato"]>) => setD((a) => ({ ...a, contato: { ...a.contato, ...parte } }));

  function salvar() {
    const nome = d.nome.trim();
    if (!nome) { toast("Preencha o nome."); return; }
    if (!d.tipos.length) { toast("Marque pelo menos um tipo."); return; }
    if (!linkValido(arquivo)) { toast("O link precisa começar com http:// ou https://"); return; }
    gravar("cadastro", {
      ...d, nome,
      contato: { nome: d.contato.nome.trim(), telefone: d.contato.telefone.trim(), email: d.contato.email.trim() },
      documento: d.documento.trim(), anotacoes: d.anotacoes.trim(),
      cartaArquivo: arquivo.trim() ? arquivoDoLink(arquivo) : (d.cartaArquivo?.tipo === "asset" ? d.cartaArquivo : null),
    });
    aoFechar();
    toast(id ? "Cadastro salvo." : "Cadastro criado.");
  }

  function excluir() {
    const r = referenciasDoCadastro(base, id!);
    if (r.length) { toast("Não dá para excluir: este registro é usado em " + r.join(", ") + "."); return; }
    apagar("cadastro", id!);
    aoFechar();
    toast("Cadastro excluído.");
  }

  return (
    <Modal titulo={id ? "Editar cadastro" : "Novo cadastro"} auditoria={auditoria(existente as (Cadastro & { atualizadoPor?: string }) | undefined)} aoFechar={aoFechar} aoSalvar={salvar} aoExcluir={id ? excluir : undefined}>
      <Campo rotulo="Nome" className={LINHA_INTEIRA}><Entrada autoFocus required value={d.nome} onChange={(e) => mudar({ nome: e.target.value })} /></Campo>
      <Grupo rotulo="Tipo" className={LINHA_INTEIRA}><Chips nome="tipos" opcoes={opcoes(p, "tiposCadastro")} marcados={d.tipos} aoMudar={(tipos) => mudar({ tipos })} /></Grupo>
      <Campo rotulo="Status"><Selecao value={d.status} onChange={(e) => mudar({ status: e.target.value })}><Opcoes lista={opcoes(p, "statusContato")} /></Selecao></Campo>
      <Campo rotulo="Núcleo que cuida"><Selecao value={d.nucleo || ""} onChange={(e) => mudar({ nucleo: e.target.value || null })}><Opcoes lista={opcoes(p, "nucleos", "Nenhum")} /></Selecao></Campo>
      <Campo rotulo="Pessoa de contato"><Entrada value={d.contato.nome} onChange={(e) => mudarContato({ nome: e.target.value })} /></Campo>
      <Campo rotulo="Telefone"><Entrada type="tel" value={d.contato.telefone} onChange={(e) => mudarContato({ telefone: e.target.value })} /></Campo>
      <Campo rotulo="E-mail"><Entrada type="email" value={d.contato.email} onChange={(e) => mudarContato({ email: e.target.value })} /></Campo>
      <Campo rotulo="CPF ou CNPJ"><Entrada value={d.documento} onChange={(e) => mudar({ documento: e.target.value })} /></Campo>
      <Campo rotulo="Carta de anuência" className={LINHA_INTEIRA}>
        <Selecao value={d.carta || ""} onChange={(e) => mudar({ carta: e.target.value || null })}><Opcoes lista={opcoes(p, "cartaAnuencia", "Sem informação")} /></Selecao>
      </Campo>
      <Campo rotulo="Arquivo da carta (cole o link, do Drive por exemplo)" className={LINHA_INTEIRA}>
        <Entrada type="url" value={arquivo} onChange={(e) => setArquivo(e.target.value)} placeholder="https://…" />
      </Campo>
      <Campo rotulo="Anotações" className={LINHA_INTEIRA}><AreaTexto rows={4} value={d.anotacoes} onChange={(e) => mudar({ anotacoes: e.target.value })} /></Campo>
      <Check rotulo="A revisar" className={LINHA_INTEIRA} checked={d.revisar} onChange={(e) => mudar({ revisar: e.target.checked })} />
    </Modal>
  );
}
