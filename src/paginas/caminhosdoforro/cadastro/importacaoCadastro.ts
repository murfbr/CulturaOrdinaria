/* Importação por tabela da aba Pessoas e organizações: as colunas do cadastro
   (as mesmas do modal), o cadastro novo a partir de uma linha e os avisos
   próprios. A leitura, a comparação, o guia, o modelo e a planilha baixada
   são genéricos (importar/tabela.ts). */
import { novoId } from "../dados";
import { escreverCampo, prepararTabela, type ColunaTabela, type PreparoTabela, type TabelaLida } from "../importar/tabela";
import { normalizar, opcoes } from "../listas";
import { REDES, type Base, type Cadastro } from "../tipos";
import { lerSeguidores, perfilInstagram } from "./redes";

const nomes = (lista: [string, string][]) => lista.map(([, n]) => n).join(", ");

/** "21/10/2026" ou "2026-10-21" → "2026-10-21"; undefined quando não é data. */
function lerData(t: string): string | undefined {
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  const br = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return br ? br[3] + "-" + br[2].padStart(2, "0") + "-" + br[1].padStart(2, "0") : undefined;
}
const link = (t: string) => (/^https?:\/\//i.test(t) ? t : undefined);

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
    { campo: "instagram", cabecalho: "Instagram", converter: (t) => perfilInstagram(t) || undefined, aceita: (c) => c.startsWith("instagram") || c === "ig", como: "o perfil, com ou sem @, ou o link do perfil", exemplo: "caminhosdoforro" },
    { campo: "seguidores", cabecalho: "Seguidores", converter: (t) => lerSeguidores(t) ?? undefined, aceita: (c) => c === "seguidores" || c.startsWith("seguidores no"), como: "número (9369, 9.369 ou 9,4 mil)", exemplo: "" },
    { campo: "seguidoresEm", cabecalho: "Seguidores contados em", converter: lerData, aceita: (c) => c.startsWith("contad") || c.startsWith("data da contagem"), como: "data da contagem (dd/mm/aaaa)", exemplo: "" },
    ...REDES.map(([rede, nome]) => ({
      campo: "redes." + rede, cabecalho: nome, converter: link, aceita: (c: string) => c === normalizar(nome),
      como: "link completo (https://…)", exemplo: "",
    })),
    { campo: "midiaKit", cabecalho: "Mídia-kit", converter: link, aceita: (c) => c.startsWith("midia") || c.startsWith("mídia") || c.startsWith("media kit") || c === "midiakit", como: "link completo (só para atrações)", exemplo: "" },
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
