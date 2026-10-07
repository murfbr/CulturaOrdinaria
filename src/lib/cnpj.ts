/* Consulta pública de CNPJ (dados abertos da Receita, via BrasilAPI) para
   completar o cadastro de Proponentes: data de abertura, CNAE, sede, perfil
   (MEI ou empresa, com ou sem fins lucrativos) e situação cadastral.
   Só dados de empresa: sem sócios, endereço, telefone ou e-mail. A consulta
   parte do navegador de quem clica; nada é gravado sem a prévia. */
import type { Proponente } from "../types";

export interface CnaeInfo { codigo: string; descricao: string }

export interface DadosCnpj {
  cnpj: string;
  razao: string;
  fantasia: string;
  /** AAAA-MM-DD */
  abertura: string;
  situacao: string;
  natureza: string;
  codigoNatureza: string;
  mei: boolean;
  porte: string;
  /** "Rio de Janeiro/RJ" */
  municipio: string;
  principal: CnaeInfo;
  secundarios: CnaeInfo[];
}

export const soDigitos = (s: string) => (s || "").replace(/\D/g, "");

/** 9001902 → "9001-9/02" */
export function formatarCnae(n: number | string): string {
  const d = soDigitos(String(n)).padStart(7, "0");
  return `${d.slice(0, 4)}-${d.slice(4, 5)}/${d.slice(5, 7)}`;
}

const tituloCidade = (s: string) => (s || "").toLowerCase()
  .replace(/(^|[\s-])(\p{L})/gu, (_m, a: string, b: string) => a + b.toUpperCase())
  .replace(/\b(De|Da|Do|Das|Dos|E)\b/g, (x) => x.toLowerCase());

/** A razão social de MEI traz o CPF do titular no fim ("NOME 12345678901"):
    tira qualquer número com cara de CPF antes de levar para a Central (r24). */
export const semCpf = (s: string) => (s || "")
  .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "")
  .replace(/\s+/g, " ").trim();

/** Converte a resposta da BrasilAPI (campos da base aberta da Receita). */
export function mapearBrasilApi(j: Record<string, unknown>): DadosCnpj {
  const txt = (k: string) => String(j[k] ?? "").trim();
  const secs = Array.isArray(j.cnaes_secundarios) ? (j.cnaes_secundarios as Record<string, unknown>[]) : [];
  return {
    cnpj: txt("cnpj"),
    razao: semCpf(txt("razao_social")),
    fantasia: semCpf(txt("nome_fantasia")),
    abertura: txt("data_inicio_atividade").slice(0, 10),
    situacao: txt("descricao_situacao_cadastral"),
    natureza: txt("natureza_juridica"),
    codigoNatureza: soDigitos(txt("codigo_natureza_juridica")),
    mei: j.opcao_pelo_mei === true,
    porte: txt("porte"),
    municipio: txt("municipio") ? tituloCidade(txt("municipio")) + (txt("uf") ? "/" + txt("uf") : "") : "",
    principal: { codigo: j.cnae_fiscal ? formatarCnae(j.cnae_fiscal as number) : "", descricao: txt("cnae_fiscal_descricao") },
    secundarios: secs
      .filter((c) => Number(c.codigo) > 0)
      .map((c) => ({ codigo: formatarCnae(c.codigo as number), descricao: String(c.descricao || "").trim() })),
  };
}

/** Consulta o CNPJ. `buscar` pode ser trocado nos testes. */
export async function consultarCnpj(cnpj: string, buscar: typeof fetch = fetch): Promise<DadosCnpj> {
  const d = soDigitos(cnpj);
  if (d.length !== 14) throw new Error("o CNPJ precisa ter 14 dígitos");
  let r: Response;
  try {
    r = await buscar(`https://brasilapi.com.br/api/cnpj/v1/${d}`);
  } catch {
    throw new Error("a consulta não respondeu (sem internet ou serviço fora do ar)");
  }
  if (r.status === 404) throw new Error("CNPJ não encontrado na base da Receita");
  if (r.status === 429) throw new Error("muitas consultas seguidas; tente de novo em um minuto");
  if (!r.ok) throw new Error(`consulta indisponível agora (erro ${r.status})`);
  return mapearBrasilApi(await r.json());
}

/* ── CNAE ligado a cultura ──
   Referência para o cadastro, NÃO a lista oficial de nenhum edital (cada edital
   diz quais aceita): artes, espetáculos e patrimônio (90, 91), audiovisual e
   música gravada (59), fotografia (7420), eventos (8230), ensino de arte e
   cultura (8592) e agenciamento de artistas (7490-1/05). */
const PREFIXOS_CULTURAIS = ["90", "91", "5911", "5912", "5913", "5914", "5920", "7420", "8230", "8592", "7490105"];

export const cnaeEhCultural = (codigo: string) => {
  const d = soDigitos(codigo);
  return d.length >= 4 && PREFIXOS_CULTURAIS.some((p) => d.startsWith(p));
};

/** Códigos de CNAE escritos num texto livre ("9001-9/02 Produção musical; ..."). */
export const cnaesDoTexto = (texto: string) => (texto || "").match(/\d{4}-\d\/\d{2}/g) || [];

/** Perfil jurídico pela natureza jurídica da Receita. */
export function perfilPelaReceita(d: DadosCnpj): string {
  if (d.mei) return "MEI";
  // Naturezas 3xx: entidades sem fins lucrativos (associação, fundação, organização religiosa...).
  if (d.codigoNatureza.startsWith("3")) return "PJ sem fins lucrativos";
  if (d.codigoNatureza.startsWith("2")) return "PJ com fins lucrativos";
  return "";
}

/** Texto do campo CNAE: principal e até 6 secundários, os culturais primeiro. */
export function textoCnae(d: DadosCnpj): string {
  if (!d.principal.codigo) return "";
  const secs = [...d.secundarios].sort((a, b) => Number(cnaeEhCultural(b.codigo)) - Number(cnaeEhCultural(a.codigo)));
  const partes = [`${d.principal.codigo} ${d.principal.descricao} (principal)`];
  secs.slice(0, 6).forEach((c) => partes.push(`${c.codigo} ${c.descricao}`));
  if (secs.length > 6) partes.push(`e mais ${secs.length - 6} secundário(s)`);
  return partes.join("; ");
}

const MARCA_OBS = "Receita (consulta de ";

/** Linha de observação com o que a Receita diz (substitui a de uma consulta anterior). */
export function obsComReceita(obs: string, d: DadosCnpj, hoje = new Date()): string {
  const data = hoje.toLocaleDateString("pt-BR");
  const extras = [
    `situação ${d.situacao || "não informada"}`,
    d.razao && `razão social ${d.razao}`,
    d.fantasia && `nome fantasia ${d.fantasia}`,
    d.natureza && `natureza ${d.natureza}`,
    d.porte && `porte ${d.porte.toLowerCase()}`,
  ].filter(Boolean).join("; ");
  const linha = `${MARCA_OBS}${data}): ${extras}.`;
  const resto = (obs || "").split("\n").filter((l) => !l.startsWith(MARCA_OBS)).join("\n").trim();
  return resto ? resto + "\n" + linha : linha;
}

export interface MudancaCampo { campo: keyof Proponente; rotulo: string; antes: string; depois: string }

/** O que mudaria no cadastro com os dados da Receita (só campos com diferença). */
export function mudancasPelaReceita(pr: Proponente, d: DadosCnpj, hoje = new Date()): MudancaCampo[] {
  const alvo: [keyof Proponente, string, string][] = [
    ["abertura", "Abertura do CNPJ", d.abertura],
    ["cnae", "CNAE", textoCnae(d)],
    ["municipio", "Sede", d.municipio],
    ["perfil", "Perfil jurídico", perfilPelaReceita(d)],
    ["obs", "Observações", obsComReceita(pr.obs, d, hoje)],
  ];
  return alvo
    .filter(([campo, , depois]) => depois && String(pr[campo] || "") !== depois)
    .map(([campo, rotulo, depois]) => ({ campo, rotulo, antes: String(pr[campo] || ""), depois }));
}
