/* Importação por tabela da aba Pessoas e organizações: as colunas do cadastro
   (as mesmas do modal), o cadastro novo a partir de uma linha e os avisos
   próprios. A leitura, a comparação, o guia, o modelo e a planilha baixada
   são genéricos (importar/tabela.ts). */
import { novoId } from "../dados";
import { escreverCampo, prepararTabela, type ColunaTabela, type PreparoTabela, type TabelaLida } from "../importar/tabela";
import { opcoes } from "../listas";
import type { Base, Cadastro } from "../tipos";

const nomes = (lista: [string, string][]) => lista.map(([, n]) => n).join(", ");

/** As colunas, na ordem da planilha; "ID" só vem na planilha baixada. */
export function colunasCadastro(base: Base): ColunaTabela[] {
  const p = base.pagina;
  const tipos = opcoes(p, "tiposCadastro");
  const status = opcoes(p, "statusContato");
  const nucleos = opcoes(p, "nucleos");
  const cartas = opcoes(p, "cartaAnuencia");
  return [
    { campo: "id", cabecalho: "ID", como: "id do registro aqui (vem na planilha baixada); sem ele, o registro é reconhecido pelo nome", exemplo: "" },
    { campo: "nome", cabecalho: "Nome", obrigatoria: true, como: "pessoa ou organização; nome igual ao de um cadastro que já existe atualiza esse cadastro", exemplo: "Banda de exemplo" },
    { campo: "tipos", cabecalho: "Tipo", lista: true, opcoes: tipos, aceita: (c) => c.startsWith("tipo"), como: "um ou mais, separados por | (" + nomes(tipos) + ")", exemplo: tipos[0]?.[1] || "" },
    { campo: "status", cabecalho: "Status", opcoes: status, aceita: (c) => c.startsWith("situac"), como: "um de: " + nomes(status), exemplo: status[0]?.[1] || "" },
    { campo: "nucleo", cabecalho: "Núcleo que cuida", opcoes: nucleos, aceita: (c) => c.startsWith("nucleo") || c === "gt" || c.startsWith("grupo de trabalho"), como: "nome do núcleo (" + (nomes(nucleos) || "nenhum ainda") + '); também aceita "GT"', exemplo: nucleos[0]?.[1] || "" },
    { campo: "contato.nome", cabecalho: "Pessoa de contato", aceita: (c) => c.startsWith("contato") || c.startsWith("pessoa de contato"), como: "texto", exemplo: "Fulana" },
    { campo: "contato.telefone", cabecalho: "Telefone", aceita: (c) => c.startsWith("tel") || c.includes("whats") || c.includes("celular"), como: 'texto; também aceita "WhatsApp" ou "Celular"', exemplo: "(21) 99999-0000" },
    { campo: "contato.email", cabecalho: "E-mail", aceita: (c) => c === "email" || c.startsWith("e-mail"), como: "texto", exemplo: "contato@exemplo.com" },
    { campo: "documento", cabecalho: "CPF ou CNPJ", aceita: (c) => c.startsWith("cpf") || c.startsWith("cnpj") || c === "documento", como: 'texto; também aceita "CNPJ", "CPF" ou "Documento"', exemplo: "" },
    { campo: "carta", cabecalho: "Carta de anuência", opcoes: cartas, aceita: (c) => c.startsWith("carta"), como: "um de: " + nomes(cartas), exemplo: "" },
    { campo: "anotacoes", cabecalho: "Anotações", aceita: (c) => c.startsWith("anotac") || c.startsWith("observac"), como: 'texto livre; também aceita "Observações"', exemplo: "linha de exemplo: apague antes de importar" },
    { campo: "revisar", cabecalho: "A revisar", booleano: true, aceita: (c) => c.startsWith("revisar"), como: "sim ou não", exemplo: "não" },
  ];
}

/** Um cadastro novo a partir dos valores da linha (os mesmos padrões do "Novo cadastro"). */
function novoCadastro(valores: Record<string, unknown>): Cadastro {
  const d: Cadastro = {
    id: novoId("cadastro"), nome: "", tipos: [], status: "a_contatar", nucleo: null,
    contato: { nome: "", telefone: "", email: "" }, documento: "", carta: null, cartaArquivo: null,
    historico: [], anotacoes: "", revisar: false,
  };
  for (const [campo, v] of Object.entries(valores)) if (campo !== "id") escreverCampo(d as unknown as Record<string, unknown>, campo, v);
  d.nome = d.nome.trim();
  return d;
}

/** Compara as linhas lidas com o cadastro, sem gravar; cadastro novo sem tipo vira aviso. */
export function prepararCadastros(base: Base, lida: TabelaLida): PreparoTabela<Cadastro> {
  const pr = prepararTabela(base.cadastro, lida, novoCadastro);
  const semTipo = pr.novos.filter((d) => !d.tipos.length);
  if (semTipo.length) pr.avisos.push("Sem tipo (marque depois na tela): " + semTipo.map((d) => d.nome).join(", ") + ".");
  return pr;
}
