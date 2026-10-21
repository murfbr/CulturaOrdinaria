/* Formulário de Cota (Captação): uma cota de patrocínio de um projeto do portfólio. */
import type { EntidadeSpec } from "../tipos";
import { numerosOuNulo } from "./captacaoAuxiliar";

export const cota: EntidadeSpec = {
  titulo: "Cota", colecao: "cotas", prefixoId: "q",
  padrao: { projetoId: "", valor: null, quantidade: null, contrapartidas: "", ordem: 0 },
  campos: [
    { chave: "projetoId", rotulo: "Projeto", tipo: "ref", fonte: "portfolio" },
    { chave: "nome", rotulo: "Nome da cota" },
    { chave: "valor", rotulo: "Valor (R$); em branco = variável ou a negociar", tipo: "numero" },
    { chave: "quantidade", rotulo: "Quantidade disponível; em branco = sem limite", tipo: "numero" },
    { chave: "contrapartidas", rotulo: "Contrapartidas para a marca", tipo: "textarea" },
  ],
  depois: numerosOuNulo(["valor", "quantidade"]),
};
