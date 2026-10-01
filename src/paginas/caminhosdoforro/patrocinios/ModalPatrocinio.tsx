/* Novo ou editar patrocínio: empresa (do cadastro, ou cadastrar uma nova de
   dentro do modal), cota (escolher uma preenche o valor quando ele está
   vazio ou igual ao da cota anterior), valor, etapa, último contato, próximo
   passo, proposta por link, anotações, a revisar. */
import { useRef, useState } from "react";
import { toast } from "../../../components/Toast";
import { clonar } from "../../../utils";
import { auditoria, brl, cotasOrdenadas, nucleo } from "../calculo";
import { apagar, criarCadastroRapido, gravar, novoId } from "../dados";
import { opcoes } from "../listas";
import type { Base, Patrocinio } from "../tipos";
import { arquivoDoLink, linkValido } from "../ui/Arquivo";
import { AreaTexto, Campo, Check, Entrada, Opcoes, Selecao } from "../ui/Campo";
import { LINHA_INTEIRA, Modal } from "../ui/Modal";
import { NOVO, SelecaoCadastro } from "../ui/SelecaoCadastro";

interface Props { base: Base; id: string | null; aoFechar: () => void }

export function ModalPatrocinio({ base, id, aoFechar }: Props) {
  const existente = id ? base.patrocinios[id] : undefined;
  const p = base.pagina;
  const [d, setD] = useState<Patrocinio>(() => existente ? clonar(existente) : {
    id: novoId("patrocinios"), empresa: "", cota: null, valor: null, etapa: p.listas.etapasFunil[0]?.id || "",
    ultimoContato: null, proximoPasso: "", proposta: null, anotacoes: "", revisar: false,
  });
  const [valor, setValor] = useState(d.valor == null ? "" : String(d.valor));
  const [novoNome, setNovoNome] = useState("");
  const [proposta, setProposta] = useState(d.proposta?.tipo === "link" ? d.proposta.url || "" : "");
  const cotaAnterior = useRef<string | null>(d.cota);
  const mudar = (parte: Partial<Patrocinio>) => setD((a) => ({ ...a, ...parte }));

  function mudarCota(cid: string) {
    const nova = cid ? base.cotas[cid] : undefined;
    const antiga = cotaAnterior.current ? base.cotas[cotaAnterior.current] : undefined;
    if (nova && nova.valor && (valor === "" || (antiga && Number(valor) === Number(antiga.valor)))) setValor(String(nova.valor));
    cotaAnterior.current = cid || null;
    mudar({ cota: cid || null });
  }

  function salvar() {
    let empresa = d.empresa;
    if (!empresa) { toast("Escolha a empresa."); return; }
    if (!linkValido(proposta)) { toast("O link precisa começar com http:// ou https://"); return; }
    if (empresa === NOVO) {
      const nome = novoNome.trim();
      if (!nome) { toast("Escreva o nome da nova empresa."); return; }
      empresa = criarCadastroRapido(nome, "patrocinador", nucleo(base, "captacao") ? "captacao" : null);
    }
    gravar("patrocinios", {
      ...d, empresa, valor: valor === "" ? null : Number(valor), ultimoContato: d.ultimoContato || null,
      proximoPasso: d.proximoPasso.trim(), anotacoes: d.anotacoes.trim(),
      proposta: proposta.trim() ? arquivoDoLink(proposta) : (d.proposta?.tipo === "asset" ? d.proposta : null),
    });
    aoFechar();
    toast(id ? "Patrocínio salvo." : "Patrocínio registrado.");
  }

  function excluir() {
    apagar("patrocinios", id!);
    aoFechar();
    toast("Patrocínio excluído.");
  }

  return (
    <Modal titulo={id ? "Editar patrocínio" : "Novo patrocínio"} auditoria={auditoria(existente as (Patrocinio & { atualizadoPor?: string }) | undefined)} aoFechar={aoFechar} aoSalvar={salvar} aoExcluir={id ? excluir : undefined}>
      <Campo rotulo="Empresa" className={LINHA_INTEIRA}>
        <SelecaoCadastro autoFocus base={base} tipo="patrocinador" value={d.empresa} aoMudar={(empresa) => mudar({ empresa })} rotuloVazio="Escolha a empresa" rotuloNovo="Cadastrar nova empresa…" />
      </Campo>
      {d.empresa === NOVO && (
        <Campo rotulo="Nome da nova empresa" className={LINHA_INTEIRA}><Entrada autoFocus value={novoNome} onChange={(e) => setNovoNome(e.target.value)} /></Campo>
      )}
      <Campo rotulo="Cota">
        <Selecao value={d.cota || ""} onChange={(e) => mudarCota(e.target.value)}>
          <option value="">Sem cota definida</option>
          {cotasOrdenadas(base).map((c) => <option key={c.id} value={c.id}>{c.nome}{c.valor ? " (" + brl(c.valor) + ")" : ""}</option>)}
        </Selecao>
      </Campo>
      <Campo rotulo="Valor (R$)"><Entrada type="number" min={0} step={1000} value={valor} onChange={(e) => setValor(e.target.value)} /></Campo>
      <Campo rotulo="Etapa"><Selecao value={d.etapa} onChange={(e) => mudar({ etapa: e.target.value })}><Opcoes lista={opcoes(p, "etapasFunil")} /></Selecao></Campo>
      <Campo rotulo="Último contato"><Entrada type="date" value={d.ultimoContato || ""} onChange={(e) => mudar({ ultimoContato: e.target.value || null })} /></Campo>
      <Campo rotulo="Próximo passo" className={LINHA_INTEIRA}><AreaTexto rows={2} value={d.proximoPasso} onChange={(e) => mudar({ proximoPasso: e.target.value })} /></Campo>
      <Campo rotulo="Proposta enviada (cole o link, do Drive por exemplo)" className={LINHA_INTEIRA}>
        <Entrada type="url" value={proposta} onChange={(e) => setProposta(e.target.value)} placeholder="https://…" />
      </Campo>
      <Campo rotulo="Anotações" className={LINHA_INTEIRA}><AreaTexto rows={3} value={d.anotacoes} onChange={(e) => mudar({ anotacoes: e.target.value })} /></Campo>
      <Check rotulo="A revisar" className={LINHA_INTEIRA} checked={d.revisar} onChange={(e) => mudar({ revisar: e.target.checked })} />
    </Modal>
  );
}
