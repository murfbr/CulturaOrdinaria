/* Migração do modelo v2 (projeto × edital = candidatura) para o v3 (cada
   projeto É uma candidatura). Funções puras: recebem os dados e devolvem os
   dados convertidos, sem tocar no banco — a gravação fica em store/migracao.ts.

   Regras da conversão (as mesmas para o banco ao vivo, para pacotes .json
   antigos e para a semente do modo local):
   - cada candidatura vira um projeto com o MESMO id (c1, c2...), herdando do
     projeto antigo artista, tipo, janela, equipe e produção;
   - projeto antigo sem candidatura continua com o próprio id (p7, p8...);
   - o rascunho ligado à candidatura vira o formulário do projeto (e a seção
     interna dele passa para o projeto); rascunho solto vira projeto próprio;
   - tarefas, fichas, regras e julgamentos que apontavam para o projeto ou
     para a candidatura antigos passam a apontar para o projeto novo.
   Depois, um pacote de enriquecimento opcional (editais do Mapa, formulários,
   pendências dos artistas, fichas...) é aplicado por cima. */
import type {
  Artista, Candidatura, Colaborador, Contato, DadosPainel, DetalheArtista, Edital,
  Ficha, Formulario, Julgamento, Projeto, ProjetoV2, Rascunho, Regra, StatusProjeto, Tarefa,
} from "../../types";

type Solto = Record<string, unknown>;

/** Painel como vem de um pacote v2 (ou do banco antes da migração). */
export interface PainelV2 {
  artistas?: Artista[];
  projetos?: (ProjetoV2 | Projeto)[];
  editais?: Edital[];
  candidaturas?: Candidatura[];
  tarefas?: Tarefa[];
  equipe?: DadosPainel["equipe"];
  elenco?: Colaborador[];
  contatos?: Contato[];
  reunioes?: DadosPainel["reunioes"];
}

export interface ContextoPacote {
  fichas: Record<string, Ficha>;
  regras: Record<string, Regra>;
  julg: Record<string, Julgamento>;
}

/** O resultado da conversão: tudo o que o banco v3 deve ter. */
export interface DadosV3 {
  painel: DadosPainel;
  rascunhos: Record<string, Rascunho>;
  contexto: ContextoPacote;
  formularios: Record<string, Formulario>;
}

export interface RelatorioMigracao {
  /** O que foi feito, uma linha por ação relevante. */
  feito: string[];
  /** O que não foi aplicado (conflito, dado ausente) e precisa de olho humano. */
  avisos: string[];
  /** id antigo → id novo, para projetos e candidaturas. */
  ids: Record<string, string>;
  /** Registros antigos substituídos (vão para o backup antes de sair). */
  substituidos: { colecao: string; id: string }[];
}

/** Pacote de enriquecimento (gerado fora do site, a partir do Mapa e da Fila). */
export interface Enriquecimento {
  tipo: "central-enriquecimento";
  versao: 3;
  gerado: string;
  descricao?: string;
  /** Upsert por id. Campos vazios no pacote não apagam linkDrive/formId já preenchidos. */
  editais?: Record<string, Partial<Edital>>;
  artistas?: Record<string, {
    /** Só aplica quando o valor atual é igual a `de` (ou quando `de` não vem).
        A chave aceita caminho com ponto ("det.geral"). */
    campos?: Record<string, { de?: unknown; para: unknown }>;
    det?: Partial<DetalheArtista>;
  }>;
  /** Ajustes pontuais em qualquer coleção do Painel, com a mesma checagem de `de`. */
  ajustes?: { colecao: keyof DadosPainel; id: string; campo: string; de?: unknown; para: unknown; motivo?: string }[];
  projetos?: { novos?: Partial<Projeto>[]; ajustes?: Record<string, Partial<Projeto>> };
  formularios?: Record<string, Formulario>;
  /** Cria as que não existem; `substituir: true` na ficha sobrescreve. */
  fichas?: Record<string, Ficha & { substituir?: boolean }>;
  regras?: Record<string, Regra>;
  julgamentos?: Record<string, Julgamento>;
  /** Troca de texto em todo o banco (ex. "Sambótica" → "Sambotica"). */
  substituicoes?: { de: string; para: string }[];
  /** Só entram os ids que ainda não existem. */
  tarefas?: Tarefa[];
  elenco?: Colaborador[];
  contatos?: Contato[];
}

/* ══════════ normalização (usada também na leitura do banco) ══════════ */

const vazioOuTraco = (v: unknown) => {
  const t = String(v ?? "").trim();
  return !t || t === "—" || t === "-" || /^a definir$/i.test(t);
};

const STATUS_VALIDOS: StatusProjeto[] = [
  "prospeccao", "preparacao", "inscrito", "aguardando", "aprovado",
  "captando", "execucao", "prestacao", "concluido", "nao_aprovado", "desistencia",
];

/** Projeto com todos os campos do v3 (aceita um projeto v2 e completa). */
export function normalizarProjeto(bruto: Partial<Projeto> & Partial<ProjetoV2>): Projeto {
  const b = bruto as Solto & Partial<Projeto> & Partial<ProjetoV2>;
  const artistaIds = Array.isArray(b.artistaIds)
    ? b.artistaIds.filter(Boolean)
    : (b.artistaId ? [b.artistaId] : []);
  const interno = (b.interno || {}) as Partial<Projeto["interno"]>;
  const prop = (b.proponente || {}) as Partial<Projeto["proponente"]>;
  return {
    ...(b as Solto),
    id: String(b.id || ""),
    nome: String(b.nome || ""),
    artistaIds,
    editalId: String(b.editalId || ""),
    formId: String(b.formId || "livre"),
    rascunhoId: b.rascunhoId || undefined,
    status: STATUS_VALIDOS.includes(b.status as StatusProjeto) ? (b.status as StatusProjeto) : "prospeccao",
    arquivado: Boolean(b.arquivado),
    respId: String(b.respId || ""),
    equipeIds: Array.isArray(b.equipeIds) ? b.equipeIds : [],
    tipo: String(b.tipo || ""),
    ano: String(b.ano || ""),
    grupo: String(b.grupo || ""),
    valorPedido: String(b.valorPedido ?? (vazioOuTraco(b.meta) ? "" : b.meta) ?? ""),
    valorAprovado: String(b.valorAprovado || ""),
    valorCaptado: String(b.valorCaptado || ""),
    proponente: { nome: String(prop.nome || ""), perfil: String(prop.perfil || ""), obs: String(prop.obs || "") },
    inscricao: String(b.inscricao || ""),
    resultado: String(b.resultado || ""),
    linkDrive: String(b.linkDrive || ""),
    docs: Array.isArray(b.docs) ? b.docs : [],
    producao: Array.isArray(b.producao) ? b.producao : [],
    interno: {
      anot: String(interno.anot || ""),
      agentes: Array.isArray(interno.agentes) ? interno.agentes : [],
      crono: Array.isArray(interno.crono) ? interno.crono : [],
    },
    historico: Array.isArray(b.historico) ? b.historico : [],
    obs: String(b.obs || ""),
  } as Projeto;
}

/** O projeto está no formato antigo (v2)? */
export const projetoEhV2 = (p: Solto) => !Array.isArray(p.artistaIds) || !p.status;

/** Rascunho vazio de um formulário (mesmo formato do motor, sem depender dele). */
export function rascunhoVazio(id: string, form: string, nome: string, ref: string, agora: string): Rascunho {
  return {
    id, form, nome, ref, arquivado: false, criado: agora, atualizado: agora,
    valores: {}, anexos: {}, status: {}, notas: {},
    interno: { anot: "", prop: { nome: "", perfil: "", obs: "" }, agentes: [], crono: [], docs: [] },
  };
}

/** Todo projeto com formulário precisa do seu rascunho (as respostas). */
function garantirRascunhos(projetos: Projeto[], rascunhos: Record<string, Rascunho>, agora: string) {
  for (const p of projetos) {
    if (p.formId === "livre" || (p.rascunhoId && rascunhos[p.rascunhoId])) continue;
    const id = "r-" + p.id;
    rascunhos[id] = rascunhos[id] || rascunhoVazio(id, p.formId, p.nome, p.id, agora);
    p.rascunhoId = id;
  }
}

/* ══════════ conversão v2 → v3 ══════════ */

/** Etapa v2 (0–7) + resultado → status v3. "Elegível" (1) entra em Prospecção. */
export function statusDaEtapa(etapa: number, result?: string): StatusProjeto {
  switch (etapa) {
    case 0: case 1: return "prospeccao";
    case 2: return "preparacao";
    case 3: return "inscrito";
    case 4: return "aguardando";
    case 5: return result === "ok" ? "aprovado" : result === "no" ? "nao_aprovado" : "aguardando";
    case 6: return "execucao";
    case 7: return "prestacao";
    default: return "prospeccao";
  }
}

/** Nome curto de um edital para compor nome de projeto ("Mosaico Rio 2026/27"). */
export function nomeCurtoEdital(e?: Edital): string {
  if (!e) return "";
  if (e.curto) return e.curto;
  return e.nome.split(/\s[—–(·]\s?|\s\(/)[0].trim().slice(0, 48);
}

const semAcento = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const palavras = (s: string) => new Set(semAcento(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 5));

/**
 * Converte um painel v2 (e os rascunhos e o contexto) para o modelo v3.
 * Não muda os objetos de entrada.
 */
export function converterV2(
  painelEntrada: PainelV2,
  rascunhosEntrada: Record<string, Rascunho>,
  contextoEntrada: Partial<ContextoPacote>,
  agora = new Date().toISOString(),
): { dados: DadosV3; relatorio: RelatorioMigracao } {
  const P = JSON.parse(JSON.stringify(painelEntrada)) as PainelV2;
  const R = JSON.parse(JSON.stringify(rascunhosEntrada || {})) as Record<string, Rascunho>;
  const C = JSON.parse(JSON.stringify({ fichas: {}, regras: {}, julg: {}, ...contextoEntrada })) as ContextoPacote;
  const rel: RelatorioMigracao = { feito: [], avisos: [], ids: {}, substituidos: [] };

  const editais = (P.editais || []).map((e) => ({ ...e, categoria: e.categoria || "edital" }) as Edital);
  const edital = (id: string) => editais.find((e) => e.id === id);
  const artistaNome = (id: string) => (P.artistas || []).find((a) => a.id === id)?.nome || "";
  const candidaturas = P.candidaturas || [];
  const projetosEntrada = P.projetos || [];

  // Projetos que já estão no v3 passam direto (pacote misto ou migração repetida).
  const jaV3 = projetosEntrada.filter((p) => !projetoEhV2(p as unknown as Solto)).map((p) => normalizarProjeto(p as Projeto));
  const antigos = projetosEntrada.filter((p) => projetoEhV2(p as unknown as Solto)) as ProjetoV2[];

  const novos: Projeto[] = [...jaV3];
  const idsUsados = new Set(novos.map((p) => p.id));
  const usarId = (id: string) => {
    let final = id, n = 2;
    while (idsUsados.has(final)) final = id + "-" + n++;
    idsUsados.add(final);
    return final;
  };

  const rascunhosDe = (ref: string) => Object.values(R)
    .filter((r) => r.ref === ref)
    .sort((a, b) => Number(a.arquivado) - Number(b.arquivado) || String(b.atualizado).localeCompare(String(a.atualizado)));

  /** Traz o rascunho para dentro do projeto (formulário, seção interna, proponente). */
  function ligarRascunho(p: Projeto, r: Rascunho) {
    p.rascunhoId = r.id;
    p.formId = r.form;
    const i = r.interno || ({} as Rascunho["interno"]);
    if (i.anot) p.interno.anot = i.anot;
    if (i.agentes?.length) p.interno.agentes = i.agentes;
    if (i.crono?.length) p.interno.crono = i.crono;
    if (i.prop && (i.prop.nome || i.prop.perfil || i.prop.obs)) p.proponente = { ...p.proponente, ...i.prop };
    if (i.docs?.length) p.docs = [...p.docs, ...i.docs.map((d) => ({ ...d, obs: d.obs || "do rascunho" }))];
    r.ref = p.id;
  }

  const docsMapa = new Map<string, string>(); // candidatura antiga → projeto novo

  for (const antigo of antigos) {
    const cands = candidaturas
      .filter((c) => c.projetoId === antigo.id)
      .sort((a, b) => (a._ord ?? 0) - (b._ord ?? 0));
    const base = normalizarProjeto({
      ...(antigo as unknown as Partial<Projeto>),
      artistaIds: antigo.artistaId ? [antigo.artistaId] : [],
      valorPedido: vazioOuTraco(antigo.meta) ? "" : antigo.meta,
    });
    delete (base as unknown as Solto).artistaId;
    delete (base as unknown as Solto).meta;

    if (!cands.length) {
      // Sem candidatura: o projeto continua, com o mesmo id, como projeto livre.
      const p: Projeto = { ...base, id: usarId(antigo.id), origem: { projeto: antigo.id } };
      const r = rascunhosDe(antigo.id)[0];
      if (r) ligarRascunho(p, r);
      novos.push(p);
      rel.ids[antigo.id] = p.id;
      rel.feito.push(`Projeto ${antigo.id} (${antigo.nome}) continua como projeto, sem edital.`);
      continue;
    }

    // Principal: o que chegou mais longe no pipeline (empate: o primeiro).
    const principal = [...cands].sort((a, b) => (b.etapa ?? 0) - (a.etapa ?? 0))[0];
    const varias = cands.length > 1;
    const grupo = varias ? antigo.nome + (artistaNome(antigo.artistaId) ? " · " + artistaNome(antigo.artistaId) : "") : "";

    // Produção: cada item vai para a candidatura cujo edital ele cita; o resto, para a principal.
    const producaoDe: Record<string, Projeto["producao"]> = {};
    for (const item of antigo.producao || []) {
      let alvo = principal.id;
      if (varias) {
        const doItem = palavras(item.texto);
        let melhor = 0;
        for (const c of cands) {
          const e = edital(c.editalId);
          const n = e ? [...palavras(e.nome + " " + (e.orgao || ""))].filter((w) => doItem.has(w)).length : 0;
          if (n > melhor) { melhor = n; alvo = c.id; }
        }
      }
      (producaoDe[alvo] = producaoDe[alvo] || []).push(item);
    }

    for (const c of cands) {
      const e = edital(c.editalId);
      const p: Projeto = {
        ...base,
        id: usarId(c.id),
        nome: varias ? `${antigo.nome} · ${nomeCurtoEdital(e) || "sem edital"}` : antigo.nome,
        editalId: c.editalId || "",
        formId: e?.formId || "livre",
        rascunhoId: undefined,
        status: statusDaEtapa(c.etapa ?? 0, c.result),
        respId: c.respId || "",
        grupo,
        valorPedido: vazioOuTraco(c.valor) ? base.valorPedido : c.valor,
        linkDrive: c.linkDrive || "",
        docs: (c.docs || []).map((d) => ({ nome: d.nome, ok: Boolean(d.ok), ...(d.obs ? { obs: d.obs } : {}) })),
        producao: producaoDe[c.id] || [],
        historico: [],
        origem: { projeto: antigo.id, candidatura: c.id },
      };
      const seus = rascunhosDe(c.id);
      if (seus[0]) ligarRascunho(p, seus[0]);
      novos.push(p);
      docsMapa.set(c.id, p.id);
      rel.ids[c.id] = p.id;
      // Rascunhos a mais da mesma candidatura viram projetos irmãos.
      for (const extra of seus.slice(1)) {
        const irmao: Projeto = {
          ...p, id: usarId("p-" + extra.id.replace(/^r-/, "")), nome: extra.nome || p.nome + " (variação)",
          grupo: grupo || antigo.nome, docs: [], producao: [], interno: { anot: "", agentes: [], crono: [] },
          origem: { projeto: antigo.id, candidatura: c.id, rascunho: extra.id },
        };
        ligarRascunho(irmao, extra);
        novos.push(irmao);
        rel.feito.push(`Rascunho "${extra.nome}" da candidatura ${c.id} virou o projeto ${irmao.id}.`);
      }
    }
    rel.ids[antigo.id] = docsMapa.get(principal.id) || principal.id;
    rel.substituidos.push({ colecao: "projetos", id: antigo.id });
    rel.feito.push(`Projeto ${antigo.id} (${antigo.nome}) virou ${cands.length} projeto(s): ${cands.map((c) => docsMapa.get(c.id)).join(", ")}.`);
  }

  // Candidaturas de projeto que não existe mais (órfãs) também viram projeto.
  for (const c of candidaturas) {
    if (docsMapa.has(c.id)) continue;
    const e = edital(c.editalId);
    const p = normalizarProjeto({
      id: usarId(c.id), nome: nomeCurtoEdital(e) || "Candidatura " + c.id, editalId: c.editalId,
      formId: e?.formId || "livre", status: statusDaEtapa(c.etapa ?? 0, c.result), respId: c.respId,
      valorPedido: vazioOuTraco(c.valor) ? "" : c.valor, linkDrive: c.linkDrive || "",
      docs: c.docs || [], origem: { candidatura: c.id },
    });
    const seus = rascunhosDe(c.id);
    if (seus[0]) ligarRascunho(p, seus[0]);
    novos.push(p);
    docsMapa.set(c.id, p.id);
    rel.ids[c.id] = p.id;
    rel.avisos.push(`Candidatura ${c.id} apontava para um projeto que não existe; virou o projeto ${p.id} sem artista.`);
  }
  candidaturas.forEach((c) => rel.substituidos.push({ colecao: "candidaturas", id: c.id }));

  // Rascunhos soltos (sem candidatura nem projeto) viram projetos próprios.
  const idsProjeto = new Set(novos.map((p) => p.id));
  for (const r of Object.values(R)) {
    if (r.ref && idsProjeto.has(r.ref) && novos.some((p) => p.rascunhoId === r.id)) continue;
    const e = editais.find((x) => x.formId === r.form || (x.formIds || []).includes(r.form));
    const p = normalizarProjeto({
      id: usarId("p-" + r.id.replace(/^r-/, "")), nome: r.nome || "Rascunho sem nome",
      editalId: e?.id || "", formId: r.form, arquivado: r.arquivado, origem: { rascunho: r.id },
    });
    ligarRascunho(p, r);
    novos.push(p);
    rel.feito.push(`Rascunho solto "${r.nome}" virou o projeto ${p.id}${r.arquivado ? " (arquivado)" : ""}.`);
  }

  // Tarefas: "cand:X" → "proj:<novo>"; "proj:pN" substituído → principal.
  const tarefas = (P.tarefas || []).map((t) => {
    const [tipo, id] = String(t.origem || "").split(":");
    if (tipo === "cand") return { ...t, origem: docsMapa.has(id) ? "proj:" + docsMapa.get(id) : "" };
    if (tipo === "proj" && rel.ids[id] && rel.ids[id] !== id) return { ...t, origem: "proj:" + rel.ids[id] };
    return t;
  });

  // Contexto: fichas, regras e julgamentos de projeto seguem o id novo.
  const remap = (id: string) => rel.ids[id] || id;
  for (const [id, f] of Object.entries({ ...C.fichas })) {
    if (f.tipo !== "projeto" || remap(id) === id) continue;
    const novo = remap(id);
    if (!C.fichas[novo]) C.fichas[novo] = { ...f, id: novo };
    delete C.fichas[id];
    rel.substituidos.push({ colecao: "fichas", id });
    rel.feito.push(`Ficha de contexto ${id} passou a ser ${novo}.`);
  }
  for (const r of Object.values(C.regras)) {
    if (r.escopo?.tipo === "projeto" && r.escopo.id && remap(r.escopo.id) !== r.escopo.id) {
      r.escopo = { ...r.escopo, id: remap(r.escopo.id) };
    }
  }
  for (const j of Object.values(C.julg)) {
    if (!j.projeto) continue;
    // Prefere a candidatura do mesmo edital dentro do projeto antigo.
    const doEdital = candidaturas.find((c) => c.projetoId === j.projeto && c.editalId === j.edital);
    const novo = doEdital ? docsMapa.get(doEdital.id) : remap(j.projeto);
    if (novo && novo !== j.projeto) j.projeto = novo;
  }

  const artistas = (P.artistas || []).map((a) => ({
    ...a, formalizacao: a.formalizacao ?? "", liga: a.liga ?? "",
  }));

  // Ordem: a de antes (projetos antigos na ordem deles, candidaturas na ordem delas).
  novos.forEach((p, i) => { p._ord = i; });
  garantirRascunhos(novos, R, agora);

  return {
    dados: {
      painel: {
        artistas, projetos: novos, editais, tarefas,
        equipe: P.equipe || [], elenco: P.elenco || [], contatos: P.contatos || [], reunioes: P.reunioes || [],
        proponentes: (P as { proponentes?: DadosPainel["proponentes"] }).proponentes || [],
      },
      rascunhos: R,
      contexto: C,
      formularios: {},
    },
    relatorio: rel,
  };
}

/* ══════════ enriquecimento ══════════ */

const igual = (a: unknown, b: unknown) => JSON.stringify(a ?? "") === JSON.stringify(b ?? "");

/** Lê e grava por caminho com ponto ("det.geral"), criando os objetos do meio. */
const lerCaminho = (o: Solto, caminho: string): unknown =>
  caminho.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Solto)[k] : undefined), o);
function gravarCaminho(o: Solto, caminho: string, valor: unknown) {
  const partes = caminho.split(".");
  let alvo = o;
  partes.slice(0, -1).forEach((k) => {
    if (!alvo[k] || typeof alvo[k] !== "object") alvo[k] = {};
    alvo = alvo[k] as Solto;
  });
  alvo[partes[partes.length - 1]] = valor;
}

/** Aplica o pacote de enriquecimento sobre dados já no v3 (muda `dados`). */
export function aplicarEnriquecimento(
  dados: DadosV3, enr: Enriquecimento, rel: RelatorioMigracao, agora = new Date().toISOString(),
) {
  const { painel } = dados;
  const hoje = enr.gerado || agora.slice(0, 10);

  // Editais: upsert. Sem sobrescrever linkDrive/formId já preenchidos com vazio.
  let edNovos = 0, edAtual = 0;
  for (const [id, campos] of Object.entries(enr.editais || {})) {
    const i = painel.editais.findIndex((e) => e.id === id);
    const limpo = Object.fromEntries(Object.entries(campos).filter(([, v]) => v !== undefined)) as Partial<Edital>;
    if (i < 0) {
      painel.editais.push({ eleg: [], teto: "", prazo: "", mec: "", area: "", esfera: "mun", status: "prev", ...limpo, id, nome: limpo.nome || id } as Edital);
      edNovos++;
    } else {
      const atual = painel.editais[i];
      const final = { ...atual, ...limpo } as Edital;
      if (atual.linkDrive && !limpo.linkDrive) final.linkDrive = atual.linkDrive;
      if (atual.formId && !limpo.formId) final.formId = atual.formId;
      painel.editais[i] = final;
      edAtual++;
    }
  }
  if (edNovos || edAtual) rel.feito.push(`Editais do Mapa: ${edNovos} novo(s), ${edAtual} atualizado(s).`);

  // Formulário que já está no banco: só os metadados (a estrutura pode ter sido
  // reimportada no site). Formulário novo: entra inteiro.
  let fNovos = 0, fMeta = 0;
  for (const [id, f] of Object.entries(enr.formularios || {})) {
    const atual = dados.formularios[id];
    if (atual) {
      const { origem, fonteTipo, fonte, confianca, editais, divergencias } = f;
      dados.formularios[id] = { ...atual, ...Object.fromEntries(Object.entries({ origem, fonteTipo, fonte, confianca, editais, divergencias }).filter(([, v]) => v !== undefined)) };
      fMeta++;
    } else {
      dados.formularios[id] = f;
      fNovos++;
    }
  }
  if (enr.formularios) rel.feito.push(`Formulários: ${fNovos} novo(s), ${fMeta} com origem e fonte registradas.`);


  // Artistas: campos com checagem do valor antigo; det somando sem duplicar.
  for (const [id, mud] of Object.entries(enr.artistas || {})) {
    const a = painel.artistas.find((x) => x.id === id);
    if (!a) { rel.avisos.push(`Artista ${id} do pacote não existe no banco; ignorado.`); continue; }
    const reg = a as unknown as Solto;
    for (const [campo, { de, para }] of Object.entries(mud.campos || {})) {
      if (de !== undefined && !igual(lerCaminho(reg, campo), de)) {
        rel.avisos.push(`${a.nome}: "${campo}" mudou no site depois do levantamento; mantive o valor do site.`);
        continue;
      }
      gravarCaminho(reg, campo, para);
    }
    if (mud.det) {
      const det: DetalheArtista = a.det = a.det || {};
      const { pendencias, propostas, marca, ...resto } = mud.det;
      if (pendencias?.length) {
        const ja = new Set((det.pendencias || []).map((x) => x.texto));
        det.pendencias = [...(det.pendencias || []), ...pendencias.filter((x) => !ja.has(x.texto))];
      }
      if (propostas?.length) {
        const ja = new Set((det.propostas || []).map((x) => x.campo + "|" + x.para));
        det.propostas = [...(det.propostas || []), ...propostas.filter((x) => !ja.has(x.campo + "|" + x.para))];
      }
      if (marca) det.marca = Object.assign({ cores: [], logo: "", fonte: "", obs: "" }, marca, det.marca || {});
      for (const [k, v] of Object.entries(resto)) {
        if ((det as Solto)[k] == null || igual((det as Solto)[k], [])) (det as Solto)[k] = v;
      }
    }
  }
  if (enr.artistas) rel.feito.push(`Artistas: ${Object.keys(enr.artistas).length} ficha(s) com pendências, perguntas ou correções.`);

  // Ajustes pontuais (tarefa reescrita, campo corrigido...), com checagem do valor antigo.
  let aj = 0;
  for (const x of enr.ajustes || []) {
    const lista = painel[x.colecao] as unknown as Solto[];
    const reg = lista?.find((r) => r.id === x.id);
    if (!reg) { rel.avisos.push(`Ajuste em ${x.colecao}/${x.id}: registro não encontrado.`); continue; }
    if (x.de !== undefined && !igual(lerCaminho(reg, x.campo), x.de)) {
      rel.avisos.push(`${x.colecao}/${x.id}: "${x.campo}" mudou no site depois do levantamento; mantive o valor do site.`);
      continue;
    }
    gravarCaminho(reg, x.campo, x.para);
    aj++;
  }
  if (aj) rel.feito.push(`Ajustes pontuais: ${aj} campo(s) corrigido(s).`);

  // Projetos: ajustes (status, valores, edital...) e novos.
  for (const [id, aj] of Object.entries(enr.projetos?.ajustes || {})) {
    const i = painel.projetos.findIndex((p) => p.id === id);
    if (i < 0) { rel.avisos.push(`Ajuste do projeto ${id}: projeto não encontrado.`); continue; }
    const atual = painel.projetos[i];
    const final = normalizarProjeto({
      ...atual, ...aj,
      proponente: { ...atual.proponente, ...(aj.proponente || {}) },
      interno: { ...atual.interno, ...(aj.interno || {}) },
    });
    if (aj.status && aj.status !== atual.status) {
      final.historico = [...atual.historico, { data: hoje, de: atual.status, para: aj.status }];
    }
    painel.projetos[i] = final;
  }
  let pn = 0;
  for (const novo of enr.projetos?.novos || []) {
    if (!novo.id || painel.projetos.some((p) => p.id === novo.id)) continue;
    painel.projetos.push({ ...normalizarProjeto(novo), _ord: painel.projetos.length });
    pn++;
  }
  if (enr.projetos) rel.feito.push(`Projetos: ${Object.keys(enr.projetos.ajustes || {}).length} ajuste(s) de status e dados, ${pn} novo(s).`);

  // Projeto migrado (veio de candidatura) e ainda sem respostas: passa a usar o
  // formulário do edital dele, quando o edital agora tem um (Mapa dos Editais).
  for (const p of painel.projetos) {
    if (!p.origem?.candidatura || p.formId !== "livre" || p.rascunhoId) continue;
    const e = painel.editais.find((x) => x.id === p.editalId);
    const f = e && (e.formId || (e.formIds || [])[0]);
    if (f && dados.formularios[f]) p.formId = f;
  }

  garantirRascunhos(painel.projetos, dados.rascunhos, agora);

  // Formulários, contexto e registros que faltavam.
  let fx = 0;
  for (const [id, f] of Object.entries(enr.fichas || {})) {
    if (dados.contexto.fichas[id] && !f.substituir) continue;
    const { substituir: _s, ...ficha } = f;
    dados.contexto.fichas[id] = ficha as Ficha;
    fx++;
  }
  if (fx) rel.feito.push(`Fichas de contexto: ${fx} nova(s) ou revisada(s).`);
  const somar = <T extends { id: string }>(lista: T[], extra: T[] | undefined, rotulo: string) => {
    const ja = new Set(lista.map((x) => x.id));
    const entram = (extra || []).filter((x) => !ja.has(x.id));
    lista.push(...entram);
    if (entram.length) rel.feito.push(`${rotulo}: ${entram.length} que só existiam no artefato.`);
  };
  // Tarefas que vêm de fora apontam para candidaturas e projetos antigos: seguem os ids novos.
  const origemNova = (o: string) => {
    const [tipo, id] = String(o || "").split(":");
    if (tipo === "cand") return "proj:" + (rel.ids[id] || id);
    if (tipo === "proj") return "proj:" + (rel.ids[id] || id);
    return o;
  };
  somar(painel.tarefas, (enr.tarefas || []).map((t) => ({ ...t, origem: origemNova(t.origem) })), "Tarefas");
  somar(painel.elenco, enr.elenco, "Elenco");
  somar(painel.contatos, enr.contatos, "Contatos");
  let rg = 0;
  for (const [id, r] of Object.entries(enr.regras || {})) if (!dados.contexto.regras[id]) { dados.contexto.regras[id] = r; rg++; }
  let jg = 0;
  for (const [id, j] of Object.entries(enr.julgamentos || {})) if (!dados.contexto.julg[id]) { dados.contexto.julg[id] = j; jg++; }
  if (rg) rel.feito.push(`Regras: ${rg} nova(s).`);
  if (jg) rel.feito.push(`Julgamentos: ${jg} novo(s).`);

  // Trocas de texto em tudo (painel, respostas dos formulários e contexto).
  for (const { de, para } of enr.substituicoes || []) {
    let n = 0;
    const trocar = (v: unknown): unknown => {
      if (typeof v === "string") { if (v.includes(de)) { n++; return v.split(de).join(para); } return v; }
      if (Array.isArray(v)) return v.map(trocar);
      if (v && typeof v === "object") return Object.fromEntries(Object.entries(v as Solto).map(([k, x]) => [k, trocar(x)]));
      return v;
    };
    (Object.keys(painel) as (keyof DadosPainel)[]).forEach((c) => { (painel as unknown as Solto)[c] = trocar(painel[c]); });
    dados.rascunhos = trocar(dados.rascunhos) as DadosV3["rascunhos"];
    dados.contexto = trocar(dados.contexto) as ContextoPacote;
    if (n) rel.feito.push(`Texto "${de}" trocado por "${para}" em ${n} campo(s).`);
  }
}
