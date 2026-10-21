/* Formulário de Empresa (Captação): os dados da empresa. As pessoas de contato
   e o histórico de contato se editam na ficha da empresa, não aqui. */
import type { EntidadeSpec } from "../tipos";

export const empresa: EntidadeSpec = {
  titulo: "Empresa", colecao: "empresas", prefixoId: "e",
  padrao: { cnpj: "", setor: "", site: "", pessoas: [], historico: [], obs: "" },
  campos: [
    { chave: "nome", rotulo: "Nome da empresa" },
    { chave: "cnpj", rotulo: "CNPJ", tipo: "cnpj" },
    { chave: "setor", rotulo: "Setor" },
    { chave: "site", rotulo: "Site ou Instagram" },
    { chave: "obs", rotulo: "Observações sobre a empresa", tipo: "textarea" },
  ],
};
