/* Formulário de Proponente: quem assina as inscrições (empresa, MEI, pessoa
   física ou coletivo representado). Sem CPF, RG nem dados bancários (r24). */
import { PERFIS_JURIDICOS } from "../../data";
import { SITUACAO_PROPONENTE } from "../../types";
import type { EntidadeSpec } from "../tipos";

export const proponente: EntidadeSpec = {
  titulo: "Proponente", colecao: "proponentes", prefixoId: "pr",
  padrao: { situacao: "a_confirmar", perfil: "", cnpj: "", abertura: "", cnae: "", municipio: "", representante: "", contato: "", obs: "" },
  campos: [
    { chave: "nome", rotulo: "Nome (pessoa, empresa ou coletivo)" },
    { chave: "perfil", rotulo: "Perfil jurídico", tipo: "select", fonte: PERFIS_JURIDICOS.filter(Boolean) },
    { chave: "situacao", rotulo: "Situação", tipo: "opts", fonte: SITUACAO_PROPONENTE },
    { chave: "cnpj", rotulo: "CNPJ (só de empresa ou MEI)" },
    { chave: "abertura", rotulo: "Data de abertura do CNPJ", tipo: "date" },
    { chave: "cnae", rotulo: "CNAE principal (e secundários que importam)" },
    { chave: "municipio", rotulo: "Município da sede" },
    { chave: "representante", rotulo: "Quem assina / representa" },
    { chave: "contato", rotulo: "Contato para a inscrição (e-mail ou telefone)" },
    { chave: "obs", rotulo: "Observações (sem CPF, RG ou dados bancários)", tipo: "textarea" },
  ],
};
