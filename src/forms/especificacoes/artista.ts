/* Formulário de Artista (bloco, roda, grupo...). O antigo "enquadramento"
   deu lugar a dois dados objetivos: formalização própria e liga. Quem assina
   cada inscrição é dado do projeto (proponente), não do artista. */
import type { EntidadeSpec } from "../tipos";

export const artista: EntidadeSpec = {
  titulo: "Artista", colecao: "artistas", prefixoId: "a",
  campos: [
    { chave: "nome", rotulo: "Nome" },
    { chave: "tipo", rotulo: "Tipo", tipo: "select", fonte: ["Bloco de carnaval", "Roda de samba", "Grupo musical", "Artista individual", "Coletivo", "Grupo / afoxé"] },
    { chave: "formalizacao", rotulo: "Formalização própria", tipo: "select", fonte: ["", "Sem CNPJ nem MEI", "MEI", "CNPJ próprio", "Associação (CNPJ)", "A confirmar"] },
    { chave: "cnpj", rotulo: "CNPJ / MEI (número, se houver)" },
    { chave: "liga", rotulo: "Liga ou associação de carnaval" },
    { chave: "mun", rotulo: "Sede (município)" },
    { chave: "bio", rotulo: "Bio", tipo: "textarea" },
    { chave: "tags", rotulo: "Tags (vírgula)", tipo: "csv" },
  ],
};
