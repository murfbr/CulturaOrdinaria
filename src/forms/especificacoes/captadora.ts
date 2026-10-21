/* Formulário de Captadora (Captação): parceira de fora que capta com comissão.
   A comissão é combinada por projeto, no cartão do portfólio. */
import type { EntidadeSpec } from "../tipos";

export const captadora: EntidadeSpec = {
  titulo: "Captadora", colecao: "captadoras", prefixoId: "k",
  padrao: { contato: "", area: "", obs: "" },
  campos: [
    { chave: "nome", rotulo: "Nome" },
    { chave: "contato", rotulo: "Telefone ou e-mail" },
    { chave: "area", rotulo: "Área de atuação (ex.: bebidas, bancos, varejo)" },
    { chave: "obs", rotulo: "Observações", tipo: "textarea" },
  ],
};
