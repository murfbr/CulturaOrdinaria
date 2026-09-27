/* Textos-mestres: tudo o que já foi escrito nos formulários dos projetos,
   indexado por conceito (apresentação, justificativa, trajetória...). Serve
   para reaproveitar um texto num formulário novo: o mesmo artista primeiro,
   o que já foi colado na plataforma antes do rascunho. Os formulários
   reconstruídos dos documentos trazem o conceito de cada campo; nos mapeados
   na plataforma, o conceito é deduzido do rótulo do campo. */
import type { DadosPainel, Formulario, Projeto, Rascunho, StatusCampo } from "../types";
import type { CampoAchatado } from "./simulador/motor";

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Palavras do rótulo → conceito. A ordem importa: o primeiro que casar vale. */
const REGRAS_ROTULO: [RegExp, string][] = [
  [/democratiza/, "democratizacao"],
  [/acessibilidade/, "acessibilidade"],
  [/comunica|divulga|mobiliza/, "comunicacao"],
  [/contrapartida/, "contrapartida"],
  [/justificativa/, "justificativa"],
  [/objetivo/, "objetivos"],
  [/resultados esperados|\bmetas?\b|indicadores/, "metas"],
  [/resumo|sinopse/, "resumo"],
  [/ficha tecnica|minibio|mini bio|curriculo|\bequipe\b/, "equipe"],
  [/trajetoria|portfolio|historico|atividades culturais|ja circulou/, "trajetoria"],
  [/perfil do publico|publico/, "publico"],
  [/impacto|sustentabilidade|continuidade/, "impacto"],
  [/parceri/, "parcerias"],
  [/etapas? de trabalho|estrategia|metodologia|pre[- ]?producao|pos[- ]?producao|producao \/ execucao|execucao/, "metodologia"],
  [/cronograma/, "cronograma"],
  [/produto|especificac|descricao da atividade/, "produto"],
  [/locais|local de realiza|territorio|espaco|cidades/, "territorio"],
  [/apresentacao|descricao|outras informacoes/, "apresentacao"],
  [/titulo|nome do projeto/, "titulo"],
];

/** Conceito de um campo: o marcado no formulário ou o deduzido do rótulo. */
export function conceitoDoCampo(c: { conceito?: string; l?: string; t?: string }): string {
  if (c.conceito) return c.conceito;
  if (c.t !== "ta" && c.t !== "txt") return "";
  const r = semAcento(c.l || "");
  return REGRAS_ROTULO.find(([re]) => re.test(r))?.[1] || "";
}

export interface TextoMestre {
  conceito: string;
  texto: string;
  rascunhoId: string;
  campo: string;
  campoRotulo: string;
  /** Limite de caracteres do campo de origem. */
  limite?: number;
  status: StatusCampo;
  projeto?: Projeto;
  formNome: string;
  atualizado: string;
}

/** Achata os campos de texto de um formulário (sem depender do cache do motor). */
function camposDeTexto(f: Formulario): CampoAchatado[] {
  const saida: CampoAchatado[] = [];
  f.etapas.forEach((e, ei) => e.blocos.forEach((b) => b.campos.forEach((c) => {
    if (c.n && (c.t === "ta" || c.t === "txt")) saida.push({ ...c, n: c.n, etapa: e, ei, bloco: b });
  })));
  return saida;
}

/** Tamanho mínimo para contar como texto reaproveitável (nome e número não entram). */
const MINIMO = 40;

/** Todos os textos escritos nos formulários, com o conceito de cada um. */
export function indiceDeTextos(painel: DadosPainel, rascunhos: Record<string, Rascunho>, formularios: Record<string, Formulario>): TextoMestre[] {
  const saida: TextoMestre[] = [];
  const projetoDe = (r: Rascunho) => painel.projetos.find((p) => p.id === r.ref || p.rascunhoId === r.id);
  for (const r of Object.values(rascunhos)) {
    const f = formularios[r.form];
    if (!f) continue;
    const projeto = projetoDe(r);
    if (projeto?.arquivado) continue;
    for (const c of camposDeTexto(f)) {
      const v = r.valores?.[c.n];
      if (typeof v !== "string" || v.trim().length < MINIMO) continue;
      const conceito = conceitoDoCampo(c);
      if (!conceito) continue;
      saida.push({
        conceito, texto: v, rascunhoId: r.id, campo: c.n, campoRotulo: c.l || c.n,
        limite: c.max, status: r.status?.[c.n] || "rasc", projeto, formNome: f.nome, atualizado: r.atualizado || "",
      });
    }
  }
  return saida;
}

const PESO_STATUS: Record<StatusCampo, number> = { col: 0, rev: 1, rasc: 2 };

/**
 * Textos para reaproveitar num campo: mesmo conceito, fora do próprio campo,
 * do mesmo artista primeiro, depois colado → revisado → rascunho, depois o
 * mais recente.
 */
export function sugestoesPara(indice: TextoMestre[], conceito: string, rascunhoId: string, campo: string, artistaIds: string[]): TextoMestre[] {
  const doArtista = (t: TextoMestre) => (t.projeto?.artistaIds || []).some((a) => artistaIds.includes(a));
  return indice
    .filter((t) => t.conceito === conceito && !(t.rascunhoId === rascunhoId && t.campo === campo))
    .sort((a, b) => Number(doArtista(b)) - Number(doArtista(a))
      || PESO_STATUS[a.status] - PESO_STATUS[b.status]
      || b.atualizado.localeCompare(a.atualizado));
}

/* O índice é recalculado só quando rascunhos, formulários ou projetos mudam
   (por referência): todos os campos de uma tela compartilham o mesmo. */
let cache: { r: unknown; f: unknown; p: unknown; indice: TextoMestre[] } | null = null;
export function indiceMemo(painel: DadosPainel, rascunhos: Record<string, Rascunho>, formularios: Record<string, Formulario>): TextoMestre[] {
  if (cache && cache.r === rascunhos && cache.f === formularios && cache.p === painel.projetos) return cache.indice;
  const indice = indiceDeTextos(painel, rascunhos, formularios);
  cache = { r: rascunhos, f: formularios, p: painel.projetos, indice };
  return indice;
}
