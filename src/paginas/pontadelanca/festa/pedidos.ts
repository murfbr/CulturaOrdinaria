/* Campos dos modais da festa (dados da festa, checklist-mestre, fornecedor,
   aprendizado). As telas montam o pedido com os valores atuais e o Aplicar. */
import type { CampoModal } from "../ModalCampos";
import type { FaseFesta, PessoaEquipe } from "../../../types";

/** O nome da festa é o do projeto: edita-se em Projetos. */
export const CAMPOS_FESTA: CampoModal[] = [
  { k: "local", label: "Local" },
  { k: "sub", label: "Subtítulo", full: true },
  { k: "modelo", label: "Modelo de negócio", type: "textarea", full: true },
];

/** Opções de responsável: ninguém, ou alguém da Equipe. */
export const opcoesEquipe = (equipe: PessoaEquipe[]): [string, string][] =>
  [["", "— ninguém"], ...equipe.map((p) => [p.id, p.nome] as [string, string])];

export const camposMestre = (fases: FaseFesta[], equipe: PessoaEquipe[]): CampoModal[] => [
  { k: "tarefa", label: "Tarefa", type: "textarea", full: true },
  { k: "fase", label: "Fase", type: "select", opts: fases.map((f) => [f.id, f.label + " · " + f.desc] as [string, string]) },
  { k: "respId", label: "Responsável padrão", type: "select", opts: opcoesEquipe(equipe) },
  { k: "obs", label: "Origem / observação" },
];

/** Fornecedor = contato do tipo Fornecedor (coleção `contatos` da Central). */
export const CAMPOS_FORNECEDOR: CampoModal[] = [
  { k: "nome", label: "Nome" },
  { k: "ref", label: "Serviço" },
  { k: "contato", label: "Contato" },
  { k: "obs", label: "Observação", full: true },
];

export const CAMPOS_APRENDIZADO: CampoModal[] = [
  { k: "texto", label: "Aprendizado", type: "textarea", full: true },
  { k: "ed", label: "Edição de origem", type: "numero" },
  { k: "tarefa", label: "Virou tarefa? (ids ou descrição)" },
];
