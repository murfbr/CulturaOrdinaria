/* Proponentes: quem assina as inscrições. Funções puras sobre o Painel para
   (1) checar o proponente de um projeto contra as regras do edital (perfil
   aceito, tempo mínimo de CNPJ, limite de propostas) e (2) montar o cadastro
   a partir dos nomes que já estavam escritos nos projetos. */
import type { DadosPainel, Edital, Projeto, Proponente } from "../types";
import { hojeIso } from "./prazos";

/** Anos (com fração) entre a abertura do CNPJ e a data de referência. */
export function anosDeCnpj(abertura: string, referencia = hojeIso()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(abertura || "")) return null;
  const a = new Date(abertura + "T12:00:00").getTime();
  const r = new Date(referencia + "T12:00:00").getTime();
  return (r - a) / (365.25 * 86400000);
}

/** "3 anos e 2 meses" / "8 meses": para mostrar a idade do CNPJ. */
export function idadeLegivel(anos: number | null): string {
  if (anos == null) return "";
  if (anos < 0) return "abre depois da data";
  const meses = Math.floor(anos * 12 + 1e-6);
  const a = Math.floor(meses / 12), m = meses % 12;
  const pa = a ? a + (a === 1 ? " ano" : " anos") : "";
  const pm = m ? m + (m === 1 ? " mês" : " meses") : "";
  return [pa, pm].filter(Boolean).join(" e ") || "menos de 1 mês";
}

export const proponenteDoProjeto = (p: Projeto, painel: DadosPainel): Proponente | undefined =>
  p.proponenteId ? painel.proponentes.find((x) => x.id === p.proponenteId) : undefined;

const numero = (v: unknown): number => (typeof v === "number" ? v : Number(v || 0)) || 0;
const dataCurta = (iso: string) => iso.slice(8, 10) + "/" + iso.slice(5, 7) + "/" + iso.slice(0, 4);

/** Projetos que contam para o limite por proponente (em aberto, não desistidos). */
const contaNoLimite = (p: Projeto) => !p.arquivado && p.status !== "desistencia";

/**
 * Avisos sobre o proponente de um projeto, à luz do edital: perfil que o
 * edital não aceita, CNPJ mais novo que o exigido (na data do prazo) e mais
 * propostas do que o limite por proponente.
 */
export function avisosProponente(p: Projeto, painel: DadosPainel): string[] {
  const e: Edital | undefined = painel.editais.find((x) => x.id === p.editalId);
  const pr = proponenteDoProjeto(p, painel);
  const nome = pr?.nome || p.proponente?.nome || "";
  const perfil = pr?.perfil || p.proponente?.perfil || "";
  const avisos: string[] = [];
  if (!e) return avisos;
  if (!nome.trim()) {
    avisos.push("Ainda sem proponente definido.");
    return avisos;
  }
  if (e.aceitaPf === false && perfil === "PF") avisos.push("Este edital não aceita pessoa física como proponente.");
  if (e.aceitaMei === false && perfil === "MEI") avisos.push("Este edital não aceita MEI como proponente.");
  if (e.aceitaColetivo === false && perfil.startsWith("Coletivo")) avisos.push("Este edital não aceita coletivo sem CNPJ.");

  const minimo = numero(e.cnpjMinAnos);
  if (minimo > 0) {
    const referencia = e.prazoIso || hojeIso();
    if (perfil === "PF" || perfil.startsWith("Coletivo")) {
      avisos.push(`O edital exige CNPJ com ${minimo} ano(s); o proponente está como "${perfil}".`);
    } else if (!pr) {
      avisos.push(`O edital exige CNPJ com ${minimo} ano(s): escolha o proponente do cadastro para conferir a data de abertura.`);
    } else if (!pr.abertura) {
      avisos.push(`O edital exige CNPJ com ${minimo} ano(s): falta a data de abertura no cadastro de ${pr.nome}.`);
    } else {
      const anos = anosDeCnpj(pr.abertura, referencia);
      if (anos != null && anos < minimo) {
        avisos.push(`CNPJ com ${idadeLegivel(anos)} em ${dataCurta(referencia)}; o edital exige ${minimo} ano(s).`);
      }
    }
  }

  const limite = numero(e.limitePorProponente);
  if (limite > 0 && pr) {
    const mesmos = painel.projetos.filter((x) => x.editalId === e.id && x.proponenteId === pr.id && contaNoLimite(x));
    if (mesmos.length > limite) {
      avisos.push(`${pr.nome} assina ${mesmos.length} propostas neste edital; o limite é ${limite}.`);
    }
  }
  return avisos;
}

/* ══════════ cadastro a partir dos projetos ══════════ */

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
/** Chave de comparação de nomes: minúsculas, sem acento, pontuação e "ltda/me/eireli". */
export const chaveNome = (s: string) => semAcento(s).toLowerCase()
  .replace(/\b(ltda|me|eireli|epp|s\/?a)\b/g, " ")
  .replace(/[^a-z0-9]+/g, " ").trim();

const A_CONFIRMAR = /\(\s*a confirmar\s*\)|\ba confirmar\b/i;
const CNPJ = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/;

/** Nome limpo, situação e apelidos (o que vem entre parênteses costuma ser o nome fantasia). */
function lerNome(bruto: string): { nome: string; aConfirmar: boolean; chaves: string[] } {
  const aConfirmar = A_CONFIRMAR.test(bruto);
  const nome = bruto.replace(A_CONFIRMAR, "").replace(/\s+/g, " ").trim();
  const entre = [...nome.matchAll(/\(([^)]+)\)/g)].map((m) => m[1]);
  const fora = nome.replace(/\([^)]*\)/g, " ").trim();
  const chaves = [chaveNome(nome), chaveNome(fora), ...entre.map(chaveNome)].filter((k) => k.length > 2);
  return { nome, aConfirmar, chaves: [...new Set(chaves)] };
}

export interface PlanoProponentes {
  novos: Proponente[];
  /** `aConfirmar`: o nome no projeto dizia "(a confirmar)": a dúvida é deste projeto, não do cadastro. */
  vinculos: { projetoId: string; proponenteId: string; aConfirmar?: boolean }[];
}

/** Entre duas grafias do mesmo proponente, fica a mais completa (razão social com nome fantasia). */
const maisCompleto = (a: string, b: string) =>
  (b.includes("(") && !a.includes("(")) || (b.includes("(") === a.includes("(") && b.length > a.length) ? b : a;

/**
 * Lê o proponente escrito em cada projeto (sem vínculo com o cadastro) e
 * propõe: cadastros novos (um por nome, juntando variações e nome fantasia
 * entre parênteses) e o vínculo de cada projeto. Não grava nada.
 */
export function planoDosProjetos(painel: DadosPainel, novoId: () => string): PlanoProponentes {
  const plano: PlanoProponentes = { novos: [], vinculos: [] };
  const porChave = new Map<string, Proponente>();
  for (const pr of painel.proponentes) for (const k of lerNome(pr.nome).chaves) porChave.set(k, pr);

  for (const p of painel.projetos) {
    const bruto = (p.proponente?.nome || "").trim();
    if (!bruto || p.proponenteId) continue;
    const { nome, aConfirmar, chaves } = lerNome(bruto);
    const obs = p.proponente?.obs || "";
    const cnpj = (obs.match(CNPJ) || [""])[0];
    let alvo = chaves.map((k) => porChave.get(k)).find(Boolean);
    const ehNovo = alvo ? plano.novos.includes(alvo) : true;
    if (!alvo) {
      alvo = {
        id: novoId(), nome, perfil: p.proponente?.perfil || "",
        // Só fica "a confirmar" se em nenhum projeto o nome apareceu sem a ressalva.
        situacao: aConfirmar ? "a_confirmar" : "confirmado",
        cnpj, abertura: "", cnae: "", municipio: "",
        representante: "", contato: "", obs,
      };
      plano.novos.push(alvo);
    } else if (ehNovo) {
      // Mesmo proponente escrito de outro jeito: completa o que faltava.
      alvo.nome = maisCompleto(alvo.nome, nome);
      if (!alvo.perfil && p.proponente?.perfil) alvo.perfil = p.proponente.perfil;
      if (!alvo.cnpj && cnpj) alvo.cnpj = cnpj;
      if (!alvo.obs && obs) alvo.obs = obs;
      if (!aConfirmar) alvo.situacao = "confirmado";
    }
    for (const k of chaves) porChave.set(k, alvo);
    plano.vinculos.push({ projetoId: p.id, proponenteId: alvo.id, aConfirmar });
  }
  return plano;
}
