/* Formulário de Projeto do portfólio (Captação): o que o coletivo oferece às
   empresas. Não é o projeto da Central (candidatura a edital); a ligação entre
   os dois é etapa futura. */
import type { EntidadeSpec } from "../tipos";
import { numerosOuNulo, opcoesDaLista } from "./captacaoAuxiliar";

export const projetoCaptacao: EntidadeSpec = {
  titulo: "Projeto do portfólio", colecao: "portfolio", prefixoId: "pc",
  padrao: {
    resumo: "", link: "", inicio: "", fim: "", local: "", mecanismo: "a_definir", situacao: "aberto",
    meta: null, comissaoPct: null, comissaoBase: "a_definir", obs: "",
  },
  campos: [
    { chave: "nome", rotulo: "Nome do projeto" },
    { chave: "situacao", rotulo: "Situação", tipo: "opts", fonte: opcoesDaLista("situacaoProjeto") },
    { chave: "resumo", rotulo: "Resumo para as empresas", tipo: "textarea" },
    { chave: "inicio", rotulo: "Início", tipo: "date" },
    { chave: "fim", rotulo: "Fim", tipo: "date" },
    { chave: "local", rotulo: "Local" },
    { chave: "link", rotulo: "Link da página do projeto" },
    { chave: "mecanismo", rotulo: "Mecanismo de captação", tipo: "opts", fonte: opcoesDaLista("mecanismos") },
    { chave: "meta", rotulo: "Meta de captação (R$); em branco = ainda não definida", tipo: "numero" },
    { chave: "comissaoPct", rotulo: "Comissão das captadoras (%); em branco = ainda não combinada", tipo: "numero" },
    { chave: "comissaoBase", rotulo: "Base da comissão", tipo: "opts", fonte: opcoesDaLista("baseComissao") },
    { chave: "obs", rotulo: "Observações", tipo: "textarea" },
  ],
  depois: numerosOuNulo(["meta", "comissaoPct"]),
};
