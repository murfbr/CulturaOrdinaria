/* As listas de seleção da página (documento da página, `listas`): o que cada
   uma é, onde é usada e quais ids o código interpreta (protegidos: podem ser
   renomeados, não removidos). "fixa" = nem adicionar nem remover. */
import type { Base, Colecao, ItemLista, NomeLista, PaginaFestival } from "./tipos";

export interface MetaLista {
  nome: NomeLista;
  titulo: string;
  descricao: string;
  protegidos: string[] | "fixa";
}

export const LISTAS_META: MetaLista[] = [
  { nome: "tiposCadastro", titulo: "Tipos de cadastro", descricao: "Um registro pode ter mais de um tipo.", protegidos: ["equipe", "patrocinador", "parceiro_institucional", "fornecedor"] },
  { nome: "statusContato", titulo: "Status de contato", descricao: "Andamento da conversa com cada pessoa ou organização.", protegidos: ["a_contatar", "em_conversa", "confirmado", "recusou"] },
  { nome: "cartaAnuencia", titulo: "Carta de anuência", descricao: "Situação da carta de ciência e interesse.", protegidos: [] },
  { nome: "tiposEspaco", titulo: "Tipos de espaço", descricao: "", protegidos: [] },
  { nome: "etapasFunil", titulo: "Etapas do patrocínio", descricao: "Na ordem do funil. Proposta enviada, confirmado e perdido alimentam os totais.", protegidos: ["proposta_enviada", "confirmado", "perdido"] },
  { nome: "categoriasParceiro", titulo: "Categorias de parceiro institucional", descricao: "", protegidos: [] },
  { nome: "categoriasOrcamento", titulo: "Categorias do orçamento", descricao: "Usadas na tela de orçamento.", protegidos: [] },
  { nome: "momentos", titulo: "Momentos do orçamento", descricao: "Só renomear: a distribuição dos itens depende deles.", protegidos: "fixa" },
  { nome: "statusOrcamento", titulo: "Status do item de orçamento", descricao: "Só renomear.", protegidos: "fixa" },
  { nome: "dias", titulo: "Dias do festival", descricao: "Só renomear: a grade depende deles.", protegidos: "fixa" },
  { nome: "atividades", titulo: "Tipos de atividade da grade", descricao: "Usados na programação.", protegidos: ["show", "dj", "baile", "transicao"] },
  { nome: "statusTarefa", titulo: "Status de tarefa", descricao: "Usados nas tarefas.", protegidos: ["concluido"] },
];

/** Onde cada lista é usada: [coleção, campo]. Serve para contar "em uso" e barrar a remoção. */
export const USO: Partial<Record<NomeLista | "nucleos", [Colecao, string][]>> = {
  tiposCadastro: [["cadastro", "tipos"], ["espacos", "aceita"]],
  statusContato: [["cadastro", "status"]],
  cartaAnuencia: [["cadastro", "carta"]],
  nucleos: [["cadastro", "nucleo"], ["orcamento_itens", "nucleo"], ["tarefas", "nucleo"]],
  statusTarefa: [["tarefas", "status"]],
  tiposEspaco: [["espacos", "tipo"]],
  etapasFunil: [["patrocinios", "etapa"]],
  categoriasParceiro: [["parceiros", "categoria"]],
  categoriasOrcamento: [["orcamento_itens", "categoria"]],
  statusOrcamento: [["orcamento_itens", "status"]],
  atividades: [["slots", "atividade"]],
  dias: [["slots", "dia"]],
};

/** Os itens de uma lista (ou os núcleos). */
export const itens = (p: PaginaFestival, nome: NomeLista | "nucleos"): ItemLista[] =>
  nome === "nucleos" ? p.nucleos : (p.listas[nome] || []);

/** Nome do item pelo id; id sem item mostra o próprio id; vazio mostra "—". */
export function rotulo(p: PaginaFestival, nome: NomeLista | "nucleos", id: string | null | undefined): string {
  if (id == null || id === "") return "—";
  const it = itens(p, nome).find((x) => x.id === id);
  return it ? it.nome : id;
}

/** Em quantos registros o item aparece. */
export function usos(base: Base, nome: NomeLista | "nucleos", id: string): number {
  let n = 0;
  for (const [colecao, campo] of USO[nome] || []) {
    for (const d of Object.values(base[colecao]) as Record<string, unknown>[]) {
      const v = d[campo];
      if (Array.isArray(v) ? v.includes(id) : v === id) n++;
    }
  }
  return n;
}

/** Texto sem acento e em minúsculas, para buscar e comparar. */
export const normalizar = (v: unknown) =>
  String(v == null ? "" : v).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Id de item novo a partir do nome, como o artefato: "Casa de apoio" → "casa_de_apoio"; sufixo _2, _3… se já existir. */
export function idDeItem(nome: string, usados: Set<string>): string {
  const base = normalizar(nome).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "item";
  let id = base;
  let k = 2;
  while (usados.has(id)) id = base + "_" + k++;
  usados.add(id);
  return id;
}

/** Opções para um <select>: [id, nome][], com a opção vazia na frente quando pedida. */
export const opcoes = (p: PaginaFestival, nome: NomeLista | "nucleos", vazio?: string): [string, string][] => [
  ...(vazio != null ? [["", vazio] as [string, string]] : []),
  ...itens(p, nome).map((x) => [x.id, x.nome] as [string, string]),
];

/** Classes de cor dos status de contato e das etapas do funil (ids que o código conhece; o resto fica neutro). */
const CLASSE_STATUS: Record<string, string> = {
  a_contatar: "cdf:bg-contatar-bg cdf:text-contatar",
  em_conversa: "cdf:bg-conversa-bg cdf:text-conversa",
  confirmado: "cdf:bg-conf-bg cdf:text-conf",
  recusou: "cdf:bg-rec-bg cdf:text-rec",
  prospeccao: "cdf:bg-contatar-bg cdf:text-contatar",
  contato_feito: "cdf:bg-conversa-bg cdf:text-conversa",
  proposta_enviada: "cdf:bg-conversa-bg cdf:text-conversa",
  negociacao: "cdf:bg-conversa-bg cdf:text-conversa",
  perdido: "cdf:bg-rec-bg cdf:text-rec",
};
export const classeStatus = (id: string | null | undefined) =>
  CLASSE_STATUS[id || ""] || "cdf:bg-superficie-2 cdf:text-tinta-2";
