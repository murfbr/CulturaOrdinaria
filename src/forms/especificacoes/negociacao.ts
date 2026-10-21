/* Especificação de Negociação (Captação): empresa × projeto × quem capta. A tela
   usa um modal próprio (a cota depende do projeto, há avisos de conflito e de
   reserva); esta tabela serve ao guia de Importar e ao conferidor. */
import type { EntidadeSpec } from "../tipos";
import { numerosOuNulo, opcoesDaLista } from "./captacaoAuxiliar";

export const negociacao: EntidadeSpec = {
  titulo: "Negociação", colecao: "negociacoes", prefixoId: "n",
  padrao: {
    cotaId: "", captadoraId: "", valor: null, etapa: "prospeccao", ultimoContato: "", proximoPasso: "", dataProximo: "",
    reservaAte: "", motivoPerda: "", comissaoPct: null, valorRecebido: null, comissaoPaga: false, obs: "",
  },
  campos: [
    { chave: "empresaId", rotulo: "Empresa", tipo: "ref", fonte: "empresas" },
    { chave: "projetoId", rotulo: "Projeto", tipo: "ref", fonte: "portfolio" },
    { chave: "cotaId", rotulo: "Cota", tipo: "ref", fonte: "cotas", vazio: "— sem cota definida" },
    { chave: "captadoraId", rotulo: "Quem capta", tipo: "ref", fonte: "captadoras", vazio: "Equipe do coletivo" },
    { chave: "valor", rotulo: "Valor (R$)", tipo: "numero" },
    { chave: "etapa", rotulo: "Etapa", tipo: "opts", fonte: opcoesDaLista("etapas") },
    { chave: "ultimoContato", rotulo: "Último contato", tipo: "date" },
    { chave: "dataProximo", rotulo: "Data do próximo passo", tipo: "date" },
    { chave: "proximoPasso", rotulo: "Próximo passo", tipo: "textarea" },
    { chave: "reservaAte", rotulo: "Reservado para quem capta até", tipo: "date" },
    { chave: "motivoPerda", rotulo: "Motivo, se perdido" },
    { chave: "comissaoPct", rotulo: "Comissão desta negociação (%); em branco = a do projeto", tipo: "numero" },
    { chave: "valorRecebido", rotulo: "Valor recebido (R$)", tipo: "numero" },
    { chave: "obs", rotulo: "Observações", tipo: "textarea" },
  ],
  depois: numerosOuNulo(["valor", "comissaoPct", "valorRecebido"]),
};
