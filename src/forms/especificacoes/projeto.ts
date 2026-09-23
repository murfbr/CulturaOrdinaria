/* Formulário de dados do Projeto (v3: cada projeto é uma candidatura).
   Nasce pelo "Novo projeto" (que escolhe edital e formulário); aqui se editam
   os dados do dia a dia. O formulário do edital se troca na aba Geral. */
import { STATUS_PROJETO } from "../../types";
import type { EntidadeSpec } from "../tipos";

export const projeto: EntidadeSpec = {
  titulo: "Projeto", colecao: "projetos", prefixoId: "p",
  padrao: {
    artistaIds: [], editalId: "", formId: "livre", status: "prospeccao", arquivado: false,
    equipeIds: [], producao: [], docs: [], historico: [], grupo: "",
    proponente: { nome: "", perfil: "", obs: "" }, interno: { anot: "", agentes: [], crono: [] },
  },
  campos: [
    { chave: "nome", rotulo: "Nome do projeto" },
    { chave: "artistaIds", rotulo: "Artistas", tipo: "multi", fonte: "artistas" },
    { chave: "editalId", rotulo: "Edital", tipo: "ref", fonte: "editais", vazio: "— sem edital (Livre)" },
    { chave: "status", rotulo: "Status", tipo: "opts", fonte: STATUS_PROJETO.map((s) => [s.id, s.rotulo] as [string, string]) },
    { chave: "respId", rotulo: "Responsável", tipo: "ref", fonte: "equipe", vazio: "— ninguém ainda" },
    { chave: "equipeIds", rotulo: "Equipe alocada", tipo: "multi", fonte: "equipe" },
    { chave: "tipo", rotulo: "Tipo", tipo: "select", fonte: ["", "Carnaval", "Álbum", "Single", "Videoclipe", "Turnê", "Circulação", "Show", "Evento", "Formação", "Prêmio", "Desenvolvimento", "Outro"] },
    { chave: "ano", rotulo: "Janela / ano" },
    { chave: "grupo", rotulo: "Faz parte de (iniciativa maior)" },
    { chave: "valorPedido", rotulo: "Valor pedido" },
    { chave: "valorAprovado", rotulo: "Valor aprovado" },
    { chave: "valorCaptado", rotulo: "Valor captado" },
    { chave: "inscricao", rotulo: "Nº de inscrição / protocolo" },
    { chave: "resultado", rotulo: "Resultado (classificação, nota, parecer)", tipo: "textarea" },
    { chave: "linkDrive", rotulo: "Pasta da inscrição no Drive" },
    { chave: "obs", rotulo: "Observações", tipo: "textarea" },
  ],
};
