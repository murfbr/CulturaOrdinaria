/* Modal da empresa (criar e editar os dados): nome, CNPJ, setor, site e
   observações, com o aviso de duplicidade enquanto digita (CNPJ igual ou nome
   parecido) e a conferência dos dígitos do CNPJ. Pessoas de contato e
   histórico se editam na ficha. */
import { useState } from "react";
import { usarCentral } from "../../../store/central";
import { salvarRegistro } from "../../../store/mutacoes";
import { AcoesModal, Modal, RodapeModal } from "../../../components/Modal";
import { toast } from "../../../components/Toast";
import { Botao } from "../../../components/ui/Botao";
import { AreaTexto, Campo, Entrada, Linhas } from "../../../components/ui/Campo";
import { Dica } from "../../../components/ui/Dica";
import { avisoDocumento } from "../../../lib/cpfCnpj";
import type { Empresa } from "../../../types";
import { uid } from "../../../utils";
import { duplicidadeEmpresa } from "../calculo";

interface Props { registro?: Empresa; aoFechar: () => void; aoSalvar?: (id: string) => void }

export function ModalEmpresa({ registro, aoFechar, aoSalvar }: Props) {
  const { painel } = usarCentral();
  const [r, setR] = useState<Empresa>(registro
    ? { ...registro }
    : { id: uid("e"), nome: "", cnpj: "", setor: "", site: "", pessoas: [], historico: [], obs: "" });
  const muda = <K extends keyof Empresa>(k: K, v: Empresa[K]) => setR((x) => ({ ...x, [k]: v }));

  const dup = duplicidadeEmpresa(r, painel.empresas);
  const avisoCnpj = avisoDocumento(r.cnpj, "cnpj");

  function salvar() {
    if (!r.nome.trim()) { toast("Escreva o nome da empresa."); return; }
    if (!salvarRegistro("empresas", { ...r, nome: r.nome.trim() })) return;
    toast(registro ? "Salvo" : "Empresa cadastrada");
    aoSalvar?.(r.id);
    aoFechar();
  }

  return (
    <Modal titulo={registro ? "Editar empresa" : "Nova empresa"} aoFechar={aoFechar}>
      {dup && (
        <div className="mb-3 rounded-md border border-gold bg-warn-soft p-2.5 text-sm">
          Parece que esta empresa já está cadastrada: <b>{dup.nome}</b>{dup.cnpj ? " (CNPJ " + dup.cnpj + ")" : ""}.
        </div>
      )}
      <Campo rotulo="Nome da empresa"><Entrada value={r.nome} autoFocus onChange={(e) => muda("nome", e.target.value)} /></Campo>
      <Linhas colunas={2}>
        <Campo rotulo="CNPJ">
          <Entrada value={r.cnpj} onChange={(e) => muda("cnpj", e.target.value)} />
          {avisoCnpj && <Dica emModal className="mt-1 text-warn">{avisoCnpj}</Dica>}
        </Campo>
        <Campo rotulo="Setor"><Entrada value={r.setor} placeholder="bebidas, bancos, varejo…" onChange={(e) => muda("setor", e.target.value)} /></Campo>
      </Linhas>
      <Campo rotulo="Site ou Instagram"><Entrada value={r.site} onChange={(e) => muda("site", e.target.value)} /></Campo>
      <Campo rotulo="Observações sobre a empresa"><AreaTexto rows={3} value={r.obs} onChange={(e) => muda("obs", e.target.value)} /></Campo>
      <RodapeModal>
        <AcoesModal>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao onClick={salvar}>{registro ? "Salvar" : "Cadastrar"}</Botao>
        </AcoesModal>
      </RodapeModal>
    </Modal>
  );
}
