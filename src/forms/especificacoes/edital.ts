/* Formulário de Edital / fonte de captação. Os blocos do Mapa (critérios,
   linhas, lacunas, alertas) chegam pelo pacote de migração e ficam só leitura
   por enquanto; aqui se editam os dados do dia a dia. */
import { registroCompleto } from "../../data";
import type { EntidadeSpec } from "../tipos";

export const edital: EntidadeSpec = {
  titulo: "Edital", colecao: "editais", prefixoId: "ed",
  campos: [
    { chave: "nome", rotulo: "Nome" },
    { chave: "orgao", rotulo: "Órgão / promotor" },
    { chave: "curto", rotulo: "Nome curto (cards)" },
    { chave: "categoria", rotulo: "Categoria", tipo: "opts", fonte: [["edital", "Edital"], ["lei", "Lei de incentivo"], ["canal", "Canal de patrocínio"], ["cadastro", "Cadastro / credenciamento"], ["norma", "Norma"], ["prospeccao", "Prospecção"]] },
    { chave: "esfera", rotulo: "Esfera", tipo: "opts", fonte: [["fed", "Federal"], ["est", "Estadual"], ["mun", "Municipal"], ["priv", "Privado"], ["para", "Paraestatal (Sesc, Firjan...)"]] },
    { chave: "mec", rotulo: "Mecanismo", tipo: "select", fonte: ["Renúncia fiscal", "Fomento direto", "Patrocínio", "Incentivo público", "Renúncia + direto", "Credenciamento", "Fomento / intercâmbio"] },
    { chave: "area", rotulo: "Área" },
    { chave: "eleg", rotulo: "Elegibilidade (separe por vírgula)", tipo: "csv" },
    { chave: "teto", rotulo: "Teto" },
    { chave: "prazo", rotulo: "Prazo (texto)" },
    { chave: "prazoIso", rotulo: "Prazo (data)", tipo: "date" },
    {
      chave: "formId", rotulo: "Formulário principal", tipo: "opts",
      // Função: a lista sai do banco na hora de desenhar (formulário importado já aparece).
      fonte: () => ([["", "— nenhum (projetos nascem Livres)"]] as [string, string][])
        .concat(registroCompleto().filter((x) => x.migrado).map((x) => [x.id, x.nome] as [string, string])),
    },
    { chave: "status", rotulo: "Status", tipo: "opts", fonte: [["open", "Aberto"], ["cont", "Fluxo contínuo"], ["prev", "Previsto"], ["closed", "Encerrado"], ["norma", "Norma vigente"]] },
    { chave: "ciclo", rotulo: "Ciclo (anual, bienal, contínuo...)" },
    { chave: "estimula", rotulo: "O que quer incentivar (em linguagem simples)", tipo: "textarea" },
    { chave: "objeto", rotulo: "Objeto (texto do edital)", tipo: "textarea" },
    { chave: "publico", rotulo: "Quem pode se inscrever", tipo: "textarea" },
    { chave: "comoInscrever", rotulo: "Como se inscrever", tipo: "textarea" },
    { chave: "contrapartidas", rotulo: "Contrapartidas", tipo: "textarea" },
    { chave: "docsExig", rotulo: "Documentos exigidos (um por linha)", tipo: "lines" },
    { chave: "linkEdital", rotulo: "Link do edital (site oficial)" },
    { chave: "linkDrive", rotulo: "Link da pasta no Google Drive" },
    { chave: "obs", rotulo: "Observações", tipo: "textarea" },
  ],
};
