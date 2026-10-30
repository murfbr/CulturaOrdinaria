/* Lê o JSON do espelho que o artefato vivo da Biblioteca gera (formato
   biblioteca-referencias/1) e devolve os documentos prontos para gravar, mais a
   conferência: contagens, avisos e erros (com erro não grava). Puro: recebe o
   objeto e as referências que já existem; quem grava é a tela.

   Regras:
   - ids do arquivo ficam (importar de novo grava por cima, não duplica); sem id,
     sai o mesmo que o gerador faria (FNV-1a do usuário e da data);
   - a referência que já existe é mesclada: os campos do arquivo vencem, os que
     o arquivo não traz ficam (ex.: `planos`, gravado pela frente dos planos);
   - `grupo`, `papel` e `planos` entram quando o arquivo traz (o gerador grava do
     cadastro); `nivelLeitura` nunca rebaixa: grade v5 > rápida > consulta, então
     uma rodada rápida não apaga que o perfil já teve a leitura completa;
   - o histórico junta as rodadas (uma linha por leitura) e `ultimaLeitura` é a
     mais recente, mesmo quando se reimporta uma rodada antiga;
   - a análise (o que os planos leem da rodada) é documento à parte: vem na lista
     `analises` do arquivo; num arquivo do formato antigo, a síntese da rodada
     (`rodada.abertura` e `rodada.secoes`) vira uma análise, com os planos das
     referências; o arquivo pode trazer só `analises`, apontando pra rodadas que
     já estão na Central (é assim que as rodadas de outubro foram separadas);
   - nada indefinido sai daqui (o banco recusa): vazio é "" ou null. */
import {
  FORMATOS_POST, FORMATO_ESPELHO_REFERENCIAS,
  type AmostraReferencia, type AnaliseReferencias, type DestaqueReferencia, type FormatoPost, type LeituraReferencia, type LinhaGrade,
  type PostReferencia, type Referencia, type ResumoLeitura, type RodadaReferencias, type SecaoSintese,
} from "../../../types";
import { resumoDaLeitura } from "./calculo";

type Bruto = Record<string, unknown>;

export interface EspelhoConvertido {
  /** null quando o arquivo traz só análises. */
  rodada: RodadaReferencias | null;
  analises: AnaliseReferencias[];
  referencias: Referencia[];
  leituras: LeituraReferencia[];
  /** Referências que ainda não existiam na Central. */
  novas: string[];
  avisos: string[];
  /** Com erro, a tela não grava. */
  erros: string[];
  /** Tamanho de cada leitura em KB (o banco aceita até ~1 MB por documento). */
  tamanhos: Record<string, number>;
}

/* ── ids estáveis: os mesmos do gerador do espelho ── */
export function hash6(chave: string): string {
  let h = 0x811c9dc5;
  for (const c of chave) { h ^= c.codePointAt(0) as number; h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36).padStart(6, "0").slice(-6);
}
export const idReferencia = (usuario: string) => "rf-" + hash6("ref|" + usuario.toLowerCase());
export const idLeitura = (usuario: string, data: string) => "lr-" + hash6("leitura|" + usuario.toLowerCase() + "|" + data);
export const idRodada = (data: string) => "rr-" + hash6("rodada|" + data);
/** Análise: os planos (em minúsculas, em ordem, juntos por +) e a data. */
export const idAnalise = (planos: string[], data: string) =>
  "an-" + hash6("analise|" + (planos.length ? planos : ["sem plano"]).map((p) => p.toLowerCase()).sort().join("+") + "|" + data);

/* ── leitores tolerantes ── */
const obj = (v: unknown): Bruto => (v && typeof v === "object" && !Array.isArray(v) ? (v as Bruto) : {});
const lista = (v: unknown): Bruto[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object") as Bruto[] : []);
const txt = (v: unknown) => (v == null ? "" : String(v)).trim();
const textos = (v: unknown) => (Array.isArray(v) ? v.map(txt).filter(Boolean) : []);
const numOuNulo = (v: unknown): number | null => {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const num = (v: unknown) => numOuNulo(v) ?? 0;
const bool = (v: unknown) => v === true || v === "sim" || v === "true" || v === 1;
const ehData = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

function post(p: Bruto, avisos: string[]): PostReferencia {
  const formato = txt(p.formato) as FormatoPost;
  if (!FORMATOS_POST.includes(formato)) avisos.push(`Post ${txt(p.n)}: formato "${formato}" fora de Reels, Carrossel e Foto (fica fora das medianas por formato).`);
  return {
    n: txt(p.n), data: txt(p.data), formato, fixado: bool(p.fixado), naGrade: bool(p.naGrade), autor: txt(p.autor),
    collab: bool(p.collab), editoria: txt(p.editoria), serie: txt(p.serie), evento: txt(p.evento), dia: numOuNulo(p.dia),
    chamada: bool(p.chamada), curtidas: numOuNulo(p.curtidas), comentarios: numOuNulo(p.comentarios), views: numOuNulo(p.views),
    maduro: bool(p.maduro), link: txt(p.link), resumo: txt(p.resumo),
  };
}

const destaque = (d: Bruto): DestaqueReferencia => ({ ordem: num(d.ordem), nome: txt(d.nome), guarda: txt(d.guarda), tipo: txt(d.tipo), comoSei: txt(d.comoSei) });
const amostra = (a: Bruto): AmostraReferencia => ({
  n: txt(a.n), gancho: txt(a.gancho), textoNaTela: txt(a.textoNaTela), quemAparece: txt(a.quemAparece), audio: txt(a.audio),
  captacao: txt(a.captacao), desempenho: numOuNulo(a.desempenho),
});
const secao = (s: Bruto): SecaoSintese => {
  const saida: SecaoSintese = { id: txt(s.id), titulo: txt(s.titulo), blocos: lista(s.blocos).map((b) => ({ titulo: txt(b.titulo), itens: textos(b.itens) })) };
  if (txt(s.nota)) saida.nota = txt(s.nota);
  return saida;
};

/** Junta as linhas de histórico pela leitura; a do arquivo vence. Mais antiga primeiro. */
/** Do mais completo ao mais leve; nível fora da lista fica abaixo de todos. */
const ORDEM_NIVEL = ["grade v5", "rápida", "consulta"];
const pesoNivel = (n: string | undefined) => { const i = ORDEM_NIVEL.indexOf(n || ""); return i < 0 ? ORDEM_NIVEL.length : i; };
export const melhorNivel = (a: string | undefined, b: string | undefined) => (pesoNivel(a) <= pesoNivel(b) ? a : b) || "consulta";

function juntarHistorico(antigo: ResumoLeitura[] | undefined, novo: ResumoLeitura): ResumoLeitura[] {
  const mapa = new Map((antigo || []).map((h) => [h.leituraId, h]));
  mapa.set(novo.leituraId, novo);
  return [...mapa.values()].sort((a, b) => a.data.localeCompare(b.data));
}

/** Lê as análises do arquivo. `padrao` completa o que a análise não traz (rodada e referências do próprio arquivo). */
function lerAnalises(
  brutas: Bruto[], padrao: { data: string; rodadaIds: string[]; refIds: string[]; origem: { artefato: string; geradoEm: string } },
  rodadasConhecidas: Set<string>, refsConhecidas: Set<string>, agora: string, avisos: string[], erros: string[],
): AnaliseReferencias[] {
  const ids = new Set<string>();
  return brutas.map((a) => {
    const planos = textos(a.planos).length ? textos(a.planos) : textos([a.plano]);
    const data = txt(a.data) || padrao.data;
    const titulo = txt(a.titulo) || "Análise de " + data;
    if (!ehData(data)) erros.push(`A análise "${titulo}" não tem data no formato AAAA-MM-DD.`);
    if (!planos.length) erros.push(`A análise "${titulo}" veio sem plano (campo planos).`);
    const rodadaIds = textos(a.rodadaIds).length ? textos(a.rodadaIds) : padrao.rodadaIds;
    if (!rodadaIds.length) erros.push(`A análise "${titulo}" não diz que rodada lê (campo rodadaIds).`);
    for (const id of rodadaIds) if (!rodadasConhecidas.has(id)) erros.push(`A análise "${titulo}" lê a rodada ${id}, que não está na Central nem no arquivo.`);
    const refIds = textos(a.refIds).length ? textos(a.refIds) : padrao.refIds;
    const soltas = refIds.filter((id) => !refsConhecidas.has(id));
    if (soltas.length) avisos.push(`A análise "${titulo}" cita referência(s) que não estão na Central: ${soltas.join(", ")}.`);
    const origem = obj(a.origem);
    const analise: AnaliseReferencias = {
      id: txt(a.id) || idAnalise(planos, data), planos, data, titulo, rodadaIds, refIds,
      abertura: txt(a.abertura), secoes: lista(a.secoes).map(secao),
      origem: { artefato: txt(origem.artefato) || padrao.origem.artefato, geradoEm: txt(origem.geradoEm) || padrao.origem.geradoEm || agora },
      atualizado: agora,
    };
    if (ids.has(analise.id)) erros.push(`Duas análises com o mesmo id (${analise.id}): mesmos planos na mesma data.`);
    ids.add(analise.id);
    return analise;
  });
}

export function converterEspelho(
  bruto: unknown, existentes: Record<string, Referencia>, agora = new Date().toISOString(),
  rodadasNaCentral: Record<string, RodadaReferencias> = {},
): EspelhoConvertido {
  const d = obj(bruto);
  const avisos: string[] = [];
  const erros: string[] = [];
  if (txt(d.formato) !== FORMATO_ESPELHO_REFERENCIAS) {
    erros.push(`O arquivo não é um espelho da Biblioteca (formato "${txt(d.formato) || "sem formato"}"; esperado "${FORMATO_ESPELHO_REFERENCIAS}").`);
  }
  // Arquivo só com análises: aponta pra rodadas que já estão na Central.
  if (!d.rodada && Array.isArray(d.analises)) {
    const analises = lerAnalises(lista(d.analises), { data: "", rodadaIds: [], refIds: [], origem: { artefato: "", geradoEm: "" } },
      new Set(Object.keys(rodadasNaCentral)), new Set(Object.keys(existentes)), agora, avisos, erros);
    if (!analises.length) erros.push("O arquivo não traz nenhuma análise.");
    return { rodada: null, analises, referencias: [], leituras: [], novas: [], avisos, erros, tamanhos: {} };
  }
  const r = obj(d.rodada);
  const data = txt(r.data);
  if (!ehData(data)) erros.push(`A rodada não tem data no formato AAAA-MM-DD (veio "${data}").`);
  const rodadaId = txt(r.id) || idRodada(data);

  // Referências (o catálogo), pelo usuário do Instagram.
  const refsBrutas = lista(d.referencias);
  const porUsuario: Record<string, string> = {};
  const referencias: Referencia[] = refsBrutas.map((x) => {
    const instagram = txt(x.instagram).replace(/^@/, "");
    if (!instagram) erros.push(`Uma referência veio sem usuário do Instagram (${txt(x.nome) || "sem nome"}).`);
    const id = txt(x.id) || idReferencia(instagram);
    porUsuario[instagram.toLowerCase()] = id;
    const nova: Referencia = {
      id, instagram, nome: txt(x.nome) || instagram, logica: txt(x.logica), marcacoes: textos(x.marcacoes),
      nivelLeitura: txt(x.nivelLeitura) || "consulta",
    };
    if (txt(x.obs)) nova.obs = txt(x.obs);
    if (txt(x.grupo)) nova.grupo = txt(x.grupo);
    if (txt(x.papel)) nova.papel = txt(x.papel);
    if (textos(x.planos).length) nova.planos = textos(x.planos);
    const antiga = existentes[id];
    if (antiga && antiga.instagram && antiga.instagram.toLowerCase() !== instagram.toLowerCase()) {
      avisos.push(`${nova.nome}: o id ${id} era de @${antiga.instagram} e agora vem como @${instagram}.`);
    }
    return nova;
  });

  // Leituras: uma por referência nesta rodada.
  const vistos = new Set<string>();
  const tamanhos: Record<string, number> = {};
  const leituras: LeituraReferencia[] = lista(d.leituras).map((x) => {
    const refId = txt(x.refId);
    const ref = referencias.find((y) => y.id === refId);
    if (!ref) erros.push(`A leitura ${txt(x.id) || txt(x.nome)} aponta para uma referência que não está no arquivo (${refId || "sem refId"}).`);
    if (txt(x.rodadaId) && txt(x.rodadaId) !== rodadaId) erros.push(`A leitura de ${txt(x.nome)} é de outra rodada (${txt(x.rodadaId)}).`);
    const pf = obj(x.perfil);
    const notas = obj(x.notas);
    const posts = lista(x.posts).map((p) => post(p, avisos));
    for (const p of posts) {
      if (!p.n) erros.push(`Um post de ${txt(x.nome)} veio sem código (n).`);
      else if (vistos.has(p.n)) erros.push(`O código de post ${p.n} se repete: cada post precisa de um código único na rodada.`);
      vistos.add(p.n);
      if (!ehData(p.data)) erros.push(`Post ${p.n}: data fora do formato AAAA-MM-DD ("${p.data}").`);
    }
    const ocultas = posts.filter((p) => p.curtidas == null).length;
    if (ocultas) avisos.push(`${txt(x.nome)}: ${ocultas} post(s) sem curtidas visíveis (ficam fora das medianas).`);
    const leitura: LeituraReferencia = {
      id: txt(x.id) || idLeitura(ref?.instagram || refId, data),
      refId, rodadaId, data: txt(x.data) || data, nome: txt(x.nome) || ref?.nome || refId, sigla: txt(x.sigla),
      perfil: {
        seguidores: num(pf.seguidores), seguindo: num(pf.seguindo), postsTotal: num(pf.postsTotal),
        destaques: num(pf.destaques), fixados: num(pf.fixados), bio: txt(pf.bio),
      },
      notas: { pagina: textos(notas.pagina), ciclos: textos(notas.ciclos), linguagem: textos(notas.linguagem), amostra: textos(notas.amostra) },
      destaques: lista(x.destaques).map(destaque),
      posts,
      amostra: lista(x.amostra).map(amostra),
      atualizado: agora,
    };
    if (!posts.length) avisos.push(`${leitura.nome}: leitura sem posts.`);
    const faltam = leitura.amostra.filter((a) => !posts.some((p) => p.n === a.n)).map((a) => a.n);
    if (faltam.length) avisos.push(`${leitura.nome}: amostra cita post que não está na leitura (${faltam.join(", ")}).`);
    tamanhos[leitura.id] = Math.round(JSON.stringify(leitura).length / 1024);
    if (tamanhos[leitura.id] > 900) erros.push(`A leitura de ${leitura.nome} passa de 900 KB (${tamanhos[leitura.id]} KB): o banco não aceita.`);
    return leitura;
  });
  for (const ref of referencias) {
    if (!leituras.some((l) => l.refId === ref.id)) avisos.push(`${ref.nome} está no catálogo do arquivo mas sem leitura nesta rodada.`);
  }

  // Referências mescladas com o que existe, com o histórico e a última leitura.
  const mescladas = referencias.map((ref) => {
    const antiga = existentes[ref.id];
    const leitura = leituras.find((l) => l.refId === ref.id);
    const saida: Referencia = { ...(antiga || {}), ...ref, atualizado: agora };
    if (antiga) saida.nivelLeitura = melhorNivel(antiga.nivelLeitura, ref.nivelLeitura);
    if (leitura) {
      const historico = juntarHistorico(antiga?.historico, resumoDaLeitura(leitura));
      saida.historico = historico;
      saida.ultimaLeitura = historico[historico.length - 1];
    }
    return saida;
  });

  const origem = { artefato: txt(obj(r.origem).artefato), geradoEm: txt(obj(r.origem).geradoEm) || agora };
  const rodada: RodadaReferencias = {
    id: rodadaId, data, titulo: txt(r.titulo) || "Rodada de " + data, grade: txt(r.grade),
    refIds: referencias.map((x) => x.id),
    leituraIds: leituras.map((l) => l.id),
    gradeCampos: lista(r.gradeCampos).map((g): LinhaGrade => ({ campo: txt(g.campo), situacao: txt(g.situacao), nota: txt(g.nota) })),
    metodo: textos(r.metodo),
    origem,
    atualizado: agora,
  };
  // Análises: as do arquivo; no formato antigo, a síntese da rodada vira uma, com os planos das referências.
  const brutas = lista(d.analises);
  if (!brutas.length && (txt(r.abertura) || lista(r.secoes).length)) {
    const planos = textos(r.planos).length ? textos(r.planos)
      : [...new Set(mescladas.flatMap((x) => x.planos || []))];
    if (!planos.length) avisos.push("A síntese da rodada veio no formato antigo e as referências não dizem o plano: a análise fica sem plano marcado.");
    else avisos.push(`A síntese da rodada (formato antigo) vira uma análise de ${planos.join(", ")}.`);
    brutas.push({ planos: planos.length ? planos : ["sem plano"], titulo: txt(r.titulo), abertura: txt(r.abertura), secoes: r.secoes });
  }
  const analises = lerAnalises(brutas, { data, rodadaIds: [rodadaId], refIds: rodada.refIds, origem },
    new Set([...Object.keys(rodadasNaCentral), rodadaId]), new Set([...Object.keys(existentes), ...rodada.refIds]), agora, avisos, erros);
  if (!referencias.length) erros.push("O arquivo não traz nenhuma referência.");
  if (porUsuario && Object.keys(porUsuario).length !== referencias.length) erros.push("Há duas referências com o mesmo usuário do Instagram.");

  return {
    rodada, analises, referencias: mescladas, leituras, avisos, erros, tamanhos,
    novas: mescladas.filter((x) => !existentes[x.id]).map((x) => x.nome),
  };
}
