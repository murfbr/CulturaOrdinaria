/* Constantes de domínio: status dos projetos, rótulos e classes de badge. */
import type {
  CategoriaEdital, ColecaoPainel, EsferaEdital, StatusEdital, StatusProjeto, StatusTarefa,
} from "./painel";
import type { ResultadoJulgamento, TipoFonte, TipoRegra } from "./contexto";
import type { StatusCampo } from "./simulador";

/** As oito coleções do Painel, na ordem de exibição. */
export const COLECOES_PAINEL: ColecaoPainel[] = [
  "artistas", "projetos", "editais", "tarefas",
  "equipe", "elenco", "contatos", "reunioes",
];

/** Nomes das coleções do Painel, para o exportar/importar e afins. */
export const ROTULO_COLECAO: Record<ColecaoPainel, string> = {
  artistas: "Artistas", projetos: "Projetos", editais: "Editais & fontes",
  tarefas: "Tarefas", equipe: "Equipe do coletivo",
  elenco: "Elenco / colaboradores", contatos: "Contatos externos", reunioes: "Reuniões",
};

/** Status do projeto, na ordem do pipeline. `fim` = encerra o ciclo (vai para o fim do quadro). */
export const STATUS_PROJETO: { id: StatusProjeto; rotulo: string; classe: string; fim?: boolean }[] = [
  { id: "prospeccao", rotulo: "Prospecção", classe: "sp-prospeccao" },
  { id: "preparacao", rotulo: "Em preparação", classe: "sp-preparacao" },
  { id: "inscrito", rotulo: "Inscrito", classe: "sp-inscrito" },
  { id: "aguardando", rotulo: "Aguardando resultado", classe: "sp-aguardando" },
  { id: "aprovado", rotulo: "Aprovado", classe: "sp-aprovado" },
  { id: "captando", rotulo: "Captando", classe: "sp-captando" },
  { id: "execucao", rotulo: "Em execução", classe: "sp-execucao" },
  { id: "prestacao", rotulo: "Prestação de contas", classe: "sp-prestacao" },
  { id: "concluido", rotulo: "Concluído", classe: "sp-concluido", fim: true },
  { id: "nao_aprovado", rotulo: "Não aprovado", classe: "sp-nao", fim: true },
  { id: "desistencia", rotulo: "Desistência", classe: "sp-nao", fim: true },
];

export const ROTULO_STATUS_PROJETO = Object.fromEntries(
  STATUS_PROJETO.map((s) => [s.id, s.rotulo]),
) as Record<StatusProjeto, string>;

export const statusProjetoDe = (id?: string) =>
  STATUS_PROJETO.find((s) => s.id === id) || STATUS_PROJETO[0];

/** Status que contam como "em andamento" (antes de ter resultado). */
export const STATUS_ATIVOS: StatusProjeto[] = ["prospeccao", "preparacao", "inscrito", "aguardando"];

/** Etapas do pipeline no formato antigo (v2), só para ler pacotes antigos. */
export const ETAPAS_PIPELINE_V2 = [
  "Prospecção", "Elegível", "Montando documentação", "Inscrito",
  "Aguardando resultado", "Aprovado / Reprovado", "Em execução", "Prestação de contas",
] as const;

export const ESFERAS: Record<EsferaEdital, { rotulo: string; classe: string }> = {
  fed: { rotulo: "Federal", classe: "e-fed" },
  est: { rotulo: "Estadual", classe: "e-est" },
  mun: { rotulo: "Municipal", classe: "e-mun" },
  priv: { rotulo: "Privado", classe: "e-priv" },
  para: { rotulo: "Paraestatal", classe: "e-priv" },
};

export const STATUS_EDITAL: Record<StatusEdital, { rotulo: string; classe: string; ordem: number }> = {
  open: { rotulo: "Aberto", classe: "st-open", ordem: 0 },
  cont: { rotulo: "Fluxo contínuo", classe: "st-open", ordem: 1 },
  prev: { rotulo: "Previsto", classe: "st-prev", ordem: 2 },
  closed: { rotulo: "Encerrado", classe: "st-closed", ordem: 3 },
  norma: { rotulo: "Norma vigente", classe: "st-closed", ordem: 4 },
};

export const CATEGORIAS_EDITAL: Record<CategoriaEdital, { rotulo: string; dica: string }> = {
  edital: { rotulo: "Edital", dica: "chamada com prazo e seleção" },
  lei: { rotulo: "Lei de incentivo", dica: "aprova o projeto para captar com empresas" },
  canal: { rotulo: "Canal de patrocínio", dica: "empresa que recebe propostas, sem edital fechado" },
  cadastro: { rotulo: "Cadastro", dica: "cadastro ou credenciamento, sem disputa por nota" },
  norma: { rotulo: "Norma", dica: "regra que vale para todos, não se concorre" },
  prospeccao: { rotulo: "Prospecção", dica: "caminho ainda em estudo" },
};

export const STATUS_TAREFA: StatusTarefa[] = ["fazer", "and", "feito"];
export const ROTULO_TAREFA: Record<StatusTarefa, string> = {
  fazer: "A fazer", and: "Em andamento", feito: "Concluído",
};

export const ROTULO_TIPO_REGRA: Record<TipoRegra, string> = {
  proibicao: "proibição", obrigatorio: "obrigatório", prioridade: "prioridade do julgador",
  estilo: "estilo de texto", dica: "dica",
};

export const ROTULO_FONTE: Record<TipoFonte, string> = {
  edital: "edital", norma: "norma", julgamento: "julgamento", experiencia: "experiência",
};

export const ROTULO_RESULTADO: Record<ResultadoJulgamento, string> = {
  aprovado: "aprovado", reprovado: "reprovado", aguardando: "aguardando", parcial: "parcial",
};

/** Rótulos dos status de campo do formulário (vazio é derivado, não gravado). */
export const ROTULO_STATUS_CAMPO: Record<StatusCampo | "vazio", string> = {
  vazio: "vazio", rasc: "rascunho", rev: "revisado", col: "colado",
};

/** Conceitos dos campos de formulário (Mapa dos Editais), na ordem de exibição. */
export const CONCEITOS_CAMPO: [string, string][] = [
  ["titulo", "Título"], ["resumo", "Resumo"], ["apresentacao", "Apresentação / descrição"],
  ["objetivos", "Objetivos"], ["justificativa", "Justificativa"], ["metas", "Metas e resultados"],
  ["publico", "Público"], ["acessibilidade", "Acessibilidade"], ["democratizacao", "Democratização do acesso"],
  ["contrapartida", "Contrapartida"], ["metodologia", "Metodologia e etapas"], ["cronograma", "Cronograma"],
  ["orcamento", "Orçamento"], ["equipe", "Equipe e ficha técnica"], ["trajetoria", "Trajetória e portfólio"],
  ["comunicacao", "Comunicação"], ["territorio", "Território e local"], ["impacto", "Impacto e continuidade"],
  ["parcerias", "Parcerias"], ["produto", "Produto cultural"], ["especifico", "Pergunta própria do edital"],
  ["diversidade", "Diversidade e perfil"], ["cadastro", "Cadastro"], ["enquadramento", "Enquadramento"],
  ["declaracao", "Declarações"], ["anexo", "Anexos"], ["outro", "Outros"],
];

/** Conceitos dos critérios de avaliação (Mapa dos Editais). */
export const CONCEITOS_CRITERIO: [string, string][] = [
  ["coerencia", "Coerência e viabilidade"], ["merito", "Mérito artístico"], ["trajetoria", "Trajetória"],
  ["impacto", "Impacto e alcance"], ["diversidade", "Diversidade"], ["democratizacao", "Democratização"],
  ["alinhamento", "Alinhamento ao edital"], ["territorio", "Território"], ["inovacao", "Inovação"],
  ["acessibilidade", "Acessibilidade"], ["continuidade", "Continuidade"], ["tradicao", "Tradição e saberes"],
  ["economia", "Economia e renda"], ["visibilidade", "Visibilidade de marca"], ["outro", "Outros"],
];

/** Quem resolve uma lacuna de edital. */
export const QUEM_RESOLVE: Record<string, string> = {
  voce: "Só vocês", orgao: "Perguntar ao órgão", login: "Precisa de login", chrome: "Pelo navegador",
  proxima: "Próxima rodada", nao_existe: "Ainda não existe", fechada: "Fechada",
};
