/* Formulário de Colaborador de elenco (músicos e técnicos dos editais).
   RG e CPF não entram (regra r24): ficam nas fichas técnicas do Drive e só
   vão para o formulário oficial de cada edital. */
import type { EntidadeSpec } from "../tipos";

export const elenco: EntidadeSpec = {
  titulo: "Colaborador", colecao: "elenco", prefixoId: "el",
  campos: [
    { chave: "nome", rotulo: "Nome artístico" },
    { chave: "nomeCompleto", rotulo: "Nome completo" },
    { chave: "funcao", rotulo: "Função" },
    { chave: "email", rotulo: "E-mail" },
    { chave: "nascimento", rotulo: "Data de nascimento", tipo: "date" },
    { chave: "bio", rotulo: "Minibio", tipo: "textarea" },
    { chave: "docsStatus", rotulo: "Documentos (RG, CPF e dados bancários ficam no Drive)", tipo: "opts", fonte: [["ok", "ok"], ["pend", "pendente"]] },
  ],
};
