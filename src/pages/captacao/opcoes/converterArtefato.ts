/* Converte o JSON que o artefato "Captação do Coletivo" baixa (botão "Baixar a
   base em JSON") nos registros das cinco coleções e nas listas do preset. Puro:
   recebe o objeto, devolve registros e avisos; quem grava é a tela. Os ids do
   artefato são mantidos (importar de novo grava por cima, não duplica). */
import type {
  Captadora, CotaCaptacao, Empresa, ItemListaCaptacao, Negociacao, NomeListaCaptacao, PessoaContato, PresetCaptacao, ProjetoCaptacao,
} from "../../../types";
import { PRESET_CAPTACAO_PADRAO } from "../../../types";
import { uid } from "../../../utils";
import { numero } from "../calculo";

type Bruto = Record<string, unknown>;

export interface Convertido {
  listas: PresetCaptacao["listas"];
  empresas: Empresa[];
  captadoras: Captadora[];
  portfolio: ProjetoCaptacao[];
  cotas: CotaCaptacao[];
  negociacoes: Negociacao[];
  avisos: string[];
}

const texto = (v: unknown) => (v == null ? "" : String(v));
const registros = (v: unknown): Bruto[] => {
  if (Array.isArray(v)) return v.filter((x) => x && typeof x === "object") as Bruto[];
  if (v && typeof v === "object") return Object.values(v as Record<string, unknown>).filter((x) => x && typeof x === "object") as Bruto[];
  return [];
};
const idDe = (r: Bruto, prefixo: string) => texto(r.id) || uid(prefixo);

/** Lista do preset vinda do JSON, se estiver no formato; senão a padrão. */
function lista(nome: NomeListaCaptacao, listas: unknown): ItemListaCaptacao[] {
  const bruta = (listas as Record<string, unknown> | undefined)?.[nome];
  const itens = Array.isArray(bruta)
    ? (bruta as Bruto[]).filter((i) => i && texto(i.id) && texto(i.nome)).map((i) => ({ id: texto(i.id), nome: texto(i.nome) }))
    : [];
  return itens.length ? itens : PRESET_CAPTACAO_PADRAO.listas[nome];
}

export function converterArtefato(bruto: unknown): Convertido {
  const d = (bruto && typeof bruto === "object" ? bruto : {}) as Bruto;
  const config = (d.config && typeof d.config === "object" ? d.config : {}) as Bruto;
  const avisos: string[] = [];

  const listas: PresetCaptacao["listas"] = {
    etapas: lista("etapas", config.listas), mecanismos: lista("mecanismos", config.listas),
    situacaoProjeto: lista("situacaoProjeto", config.listas), baseComissao: lista("baseComissao", config.listas),
  };

  // Contatos do artefato: tipo "Captadora" vira captadora; o resto vira empresa.
  const contatos = registros(d.contatos);
  const captadoras: Captadora[] = contatos.filter((c) => texto(c.tipo) === "Captadora").map((c) => ({
    id: idDe(c, "k"), nome: texto(c.nome), contato: texto(c.contato), area: texto(c.ref), obs: texto(c.obs),
  }));
  const empresas: Empresa[] = contatos.filter((c) => texto(c.tipo) !== "Captadora").map((c) => {
    const pessoa = texto(c.ref), contato = texto(c.contato);
    const pessoas: PessoaContato[] = pessoa || contato
      ? [{ id: uid("pe"), nome: pessoa, cargo: "", telefone: contato.includes("@") ? "" : contato, email: contato.includes("@") ? contato : "" }]
      : [];
    return { id: idDe(c, "e"), nome: texto(c.nome), cnpj: texto(c.cnpj), setor: texto(c.setor), site: "", pessoas, historico: [], obs: texto(c.obs) };
  });

  const portfolio: ProjetoCaptacao[] = registros(d.portfolio).map((p) => ({
    id: idDe(p, "pc"), nome: texto(p.nome), resumo: texto(p.resumo),
    link: texto(p.link).replace("/sambadeponta/", "/pontadelanca/").replace(/\/sambadeponta$/, "/pontadelanca/"),
    inicio: texto(p.inicio), fim: texto(p.fim), local: texto(p.local),
    mecanismo: texto(p.mecanismo) || "a_definir", situacao: texto(p.situacao) || "aberto",
    meta: numero(p.meta), comissaoPct: numero(p.comissaoPct), comissaoBase: texto(p.comissaoBase) || "a_definir", obs: texto(p.obs),
  }));

  const cotas: CotaCaptacao[] = registros(d.cotas).map((c, i) => ({
    id: idDe(c, "q"), projetoId: texto(c.projetoId), nome: texto(c.nome), valor: numero(c.valor), quantidade: numero(c.quantidade),
    contrapartidas: texto(c.contrapartidas), ordem: numero(c.ordem) ?? i,
  }));

  const porNome = new Map(captadoras.map((k) => [k.nome.trim().toLowerCase(), k.id]));
  const semCaptadora = new Set<string>();
  const negociacoes: Negociacao[] = registros(d.negociacoes).map((n) => {
    const nomeCapt = texto(n.captadora).trim();
    let captadoraId = texto(n.captadoraId);
    if (!captadoraId && nomeCapt) {
      captadoraId = porNome.get(nomeCapt.toLowerCase()) || "";
      if (!captadoraId) semCaptadora.add(nomeCapt);
    }
    return {
      id: idDe(n, "n"), empresaId: texto(n.empresaId), projetoId: texto(n.projetoId), cotaId: texto(n.cotaId), captadoraId,
      valor: numero(n.valor), etapa: texto(n.etapa) || "prospeccao", ultimoContato: texto(n.ultimoContato), proximoPasso: texto(n.proximoPasso),
      dataProximo: texto(n.dataProximo), reservaAte: texto(n.reservaAte), motivoPerda: texto(n.motivoPerda),
      comissaoPct: numero(n.comissaoPct), valorRecebido: numero(n.valorRecebido), comissaoPaga: Boolean(n.comissaoPaga), obs: texto(n.obs),
    };
  });
  semCaptadora.forEach((nome) => avisos.push(`Captadora "${nome}" não está entre os contatos do arquivo: as negociações dela ficaram com a equipe.`));

  const idsEmpresa = new Set(empresas.map((e) => e.id)), idsProjeto = new Set(portfolio.map((p) => p.id));
  const soltas = negociacoes.filter((n) => !idsEmpresa.has(n.empresaId) || !idsProjeto.has(n.projetoId)).length;
  if (soltas) avisos.push(`${soltas} negociação(ões) apontam empresa ou projeto que não estão no arquivo.`);
  if (!contatos.length && !portfolio.length && !negociacoes.length) avisos.push("O arquivo não tem contatos, portfólio nem negociações: é o JSON do artefato de Captação?");

  return { listas, empresas, captadoras, portfolio, cotas, negociacoes, avisos };
}
