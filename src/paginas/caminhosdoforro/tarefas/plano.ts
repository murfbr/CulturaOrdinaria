/* O plano de ação por GTs (a planilha da equipe) como fonte das tarefas.
   Três passos; os dois primeiros são funções puras:
   1. `lerPlano`: as abas da planilha viram linhas de tarefa e GTs, achando o
      cabeçalho pelo nome das colunas (a ordem e a linha em que ele está não
      importam);
   2. `prepararImportacao`: compara o plano com a base e diz o que entra, o
      que muda e o que sobra, sem gravar nada (é a prévia do modal);
   3. `aplicarImportacao` (em ModalImportarPlano): grava o que a prévia mostrou.

   Reimportar é seguro. A tarefa é reconhecida pelo ID do plano e guarda dois
   retratos da última importação: `planilha` (o texto das células) e
   `importado` (o que foi gravado aqui a partir dele). Campo a campo:
   - a planilha não mudou → fica como está aqui (o que a equipe editou na
     Central não se perde, e renomear um núcleo ou um status aqui não desfaz
     nada);
   - só a planilha mudou → atualiza;
   - os dois mudaram → conflito: vale a Central, a não ser que se peça a
     planilha;
   - a coluna não veio na planilha → não mexe.
   Tarefa criada aqui com um ID e que a planilha encontra pela primeira vez
   só recebe o que estava vazio; onde os dois têm valor diferente é conflito. */
import { cadastrosDoTipo } from "../calculo";
import { idDeItem, normalizar } from "../listas";
import {
  CAMPOS_DO_PLANO, PRIORIDADES,
  type Base, type CampoDoPlano, type ItemLista, type Nucleo, type TarefaFestival,
} from "../tipos";
import type { Aba } from "./xlsx";

/* ══════════ 1. ler ══════════ */

type Retrato = Partial<Record<CampoDoPlano, string | null>>;

/** Uma linha do plano: o ID e o texto de cada célula (o prazo já em ISO; vazio = null). */
export interface LinhaPlano { codigo: string; cru: Record<CampoDoPlano, string | null>; respGt: string }
export interface GtPlano { nome: string; responsavel: string; escopo: string }
export interface Plano {
  aba: string;
  linhas: LinhaPlano[];
  gts: GtPlano[];
  /** Os campos cuja coluna existe na planilha (só esses a importação compara). */
  campos: Set<CampoDoPlano>;
  avisos: string[];
}

type Coluna = CampoDoPlano | "codigo" | "respGt";

/** Como reconhecer cada coluna pelo cabeçalho (já sem acento e em minúsculas). A ordem importa: a primeira que serve fica com a coluna. */
const COLUNAS: [Coluna, (c: string) => boolean][] = [
  ["codigo", (c) => c === "id" || c === "codigo" || c === "cod"],
  ["respGt", (c) => c.includes("responsavel") && (c.includes("gt") || c.includes("nucleo") || c.includes("grupo"))],
  ["nucleo", (c) => c.startsWith("grupo de trabalho") || c === "gt" || c.startsWith("nucleo")],
  ["frente", (c) => c.startsWith("frente") || c.includes("subtema")],
  ["titulo", (c) => c === "tarefa" || c === "titulo" || c === "acao"],
  ["responsavel", (c) => c.startsWith("responsavel")],
  ["prazo", (c) => c.startsWith("prazo") || c === "data"],
  ["prioridade", (c) => c.startsWith("prioridade")],
  ["status", (c) => c.startsWith("status") || c.startsWith("situacao")],
  ["dependencia", (c) => c.startsWith("dependencia") || c.includes("aguardando de")],
  ["entrega", (c) => c.startsWith("entrega") || c.includes("evidencia")],
  ["anotacoes", (c) => c.startsWith("observac") || c.startsWith("anotac")],
];

/** Cabeçalho → em que coluna está cada campo. */
function mapearColunas(cabecalho: string[]): Partial<Record<Coluna, number>> {
  const mapa: Partial<Record<Coluna, number>> = {};
  cabecalho.forEach((celula, i) => {
    const c = normalizar(celula).trim();
    if (!c) return;
    const achou = COLUNAS.find(([campo, serve]) => mapa[campo] == null && serve(c));
    if (achou) mapa[achou[0]] = i;
  });
  return mapa;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Ano, mês e dia → ISO, ou null se a data não existe (31/02, mês 25). */
function iso(a: number, m: number, d: number): string | null {
  const dt = new Date(Date.UTC(a, m - 1, d));
  return dt.getUTCFullYear() === a && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? a + "-" + pad(m) + "-" + pad(d) : null;
}

/** Data de uma célula → ISO: aceita "2026-10-09", "09/10/2026" (dia primeiro) e o número de série do Excel. Vazio ou ilegível → null. */
export function dataDaCelula(valor: string): string | null {
  const v = valor.trim();
  if (!v) return null;
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/);
  if (m) return iso(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
  // Número de série: dias desde 30/12/1899 (o Excel guarda a data assim).
  if (/^\d+(\.\d+)?$/.test(v) && +v > 20000 && +v < 80000) {
    return new Date(Date.UTC(1899, 11, 30) + Math.floor(+v) * 86400000).toISOString().slice(0, 10);
  }
  return null;
}

/** As abas da planilha → o plano. Lança erro (com texto para a tela) se não achar a tabela de tarefas. */
export function lerPlano(abas: Aba[]): Plano {
  // A aba das tarefas é a primeira com um cabeçalho que tenha ID e Tarefa.
  let achada: { aba: Aba; linha: number; colunas: Partial<Record<Coluna, number>> } | null = null;
  for (const aba of abas) {
    for (let i = 0; i < Math.min(aba.linhas.length, 30) && !achada; i++) {
      const colunas = mapearColunas(aba.linhas[i]);
      if (colunas.codigo != null && colunas.titulo != null) achada = { aba, linha: i, colunas };
    }
    if (achada) break;
  }
  if (!achada) throw new Error("Não encontrei a tabela de tarefas: a planilha precisa de uma linha de cabeçalho com as colunas ID e Tarefa.");
  const { aba, linha: linhaCabecalho, colunas } = achada;
  const campos = new Set(CAMPOS_DO_PLANO.filter((c) => colunas[c] != null));
  const avisos: string[] = [];
  if (!campos.has("nucleo")) avisos.push("A planilha não tem a coluna do Grupo de Trabalho: as tarefas novas entram sem núcleo.");

  const linhas: LinhaPlano[] = [];
  const vistos = new Set<string>();
  const semId: number[] = [], repetidos: string[] = [], prazosRuins: string[] = [];
  aba.linhas.slice(linhaCabecalho + 1).forEach((celulas, i) => {
    const pegar = (campo: Coluna) => String(colunas[campo] == null ? "" : celulas[colunas[campo]!] ?? "").trim();
    const titulo = pegar("titulo");
    const codigo = pegar("codigo");
    if (!titulo && !codigo) return;
    if (!codigo || !titulo) { semId.push(linhaCabecalho + 2 + i); return; }
    const chave = codigo.toUpperCase();
    if (vistos.has(chave)) { repetidos.push(codigo); return; }
    vistos.add(chave);
    const prazoCru = pegar("prazo");
    const prazo = dataDaCelula(prazoCru);
    if (prazoCru && !prazo) prazosRuins.push(codigo);
    const cru = Object.fromEntries(CAMPOS_DO_PLANO.map((c) => [c, c === "prazo" ? prazo : pegar(c) || null])) as Record<CampoDoPlano, string | null>;
    linhas.push({ codigo, cru, respGt: pegar("respGt") });
  });
  if (semId.length) avisos.push(semId.length + " linha(s) sem ID ou sem tarefa ficaram de fora (linha " + semId.slice(0, 8).join(", ") + (semId.length > 8 ? "…" : "") + ").");
  if (repetidos.length) avisos.push("ID repetido na planilha, só a primeira linha entra: " + repetidos.join(", ") + ".");
  if (prazosRuins.length) avisos.push("Prazo que não consegui ler (fica sem prazo): " + prazosRuins.join(", ") + ".");
  if (!linhas.length) throw new Error("A tabela de tarefas da aba “" + aba.nome + "” está vazia.");

  return { aba: aba.nome, linhas, gts: lerGts(abas, linhas), campos, avisos };
}

/** Os GTs: da aba de estrutura (a que tem GT e Escopo no cabeçalho), completados com o responsável que vier na tabela de tarefas. */
function lerGts(abas: Aba[], linhas: LinhaPlano[]): GtPlano[] {
  const gts = new Map<string, GtPlano>();
  const anotar = (nome: string, responsavel: string, escopo: string) => {
    if (!nome) return;
    const chave = normalizar(nome);
    const g = gts.get(chave) || { nome, responsavel: "", escopo: "" };
    gts.set(chave, { nome: g.nome, responsavel: g.responsavel || responsavel, escopo: g.escopo || escopo });
  };
  for (const aba of abas) {
    for (let i = 0; i < Math.min(aba.linhas.length, 30); i++) {
      const cab = aba.linhas[i].map((c) => normalizar(c).trim());
      const iGt = cab.findIndex((c) => c.startsWith("grupo de trabalho") || c === "gt" || c.startsWith("nucleo"));
      const iEscopo = cab.findIndex((c) => c.startsWith("escopo"));
      if (iGt < 0 || iEscopo < 0) continue;
      const iResp = cab.findIndex((c) => c.startsWith("responsavel"));
      aba.linhas.slice(i + 1).forEach((l) => anotar(String(l[iGt] ?? "").trim(), iResp < 0 ? "" : String(l[iResp] ?? "").trim(), String(l[iEscopo] ?? "").trim()));
      break;
    }
  }
  linhas.forEach((l) => anotar(l.cru.nucleo || "", l.respGt, ""));
  return [...gts.values()];
}

/* ══════════ 2. preparar ══════════ */

/** Nomes de status que a planilha costuma usar → id que a página já tem. */
const SINONIMOS_STATUS: Record<string, string> = {
  "nao iniciado": "backlog", "nao iniciada": "backlog", "a fazer": "backlog", pendente: "backlog", backlog: "backlog",
  "em andamento": "andamento", "em curso": "andamento", fazendo: "andamento",
  "aguardando terceiro": "aguardando", "aguardando terceiros": "aguardando", aguardando: "aguardando",
  concluido: "concluido", concluida: "concluido", feito: "concluido", feita: "concluido", finalizado: "concluido",
};

const SINONIMOS_PRIORIDADE: Record<string, string> = { urgente: "critica", normal: "media" };

/** Campos em que a planilha traz um nome e a tarefa guarda um id (a comparação do texto ignora acento e caixa). */
const COM_NOME: CampoDoPlano[] = ["nucleo", "responsavel", "prioridade", "status"];

export interface OpcoesImportacao {
  /** No conflito (a planilha e a Central mudaram o mesmo campo desde a última importação), vale a planilha. */
  planilhaVenceConflito: boolean;
}

export interface Mudanca { tarefa: TarefaFestival; campos: CampoDoPlano[] }
export interface Conflito { codigo: string; campo: CampoDoPlano; /** Valor de hoje na tarefa (id, quando o campo guarda id). */ naCentral: string; /** Texto da célula. */ naPlanilha: string }
export interface MudancaNucleo { id: string; nome: string; escopo?: string; escopoDoPlano?: string; responsavel?: string; /** Os que entram. */ membros?: string[] }

export interface Preparo {
  /** Tarefas a gravar: novas e as que mudam (já com os retratos novos). */
  novas: TarefaFestival[];
  atualizadas: Mudanca[];
  /** Nada visível muda, só os retratos ou a ordem: grava para a próxima comparação. */
  carimbos: TarefaFestival[];
  iguais: number;
  /** Na base e fora da planilha (com e sem ID). */
  fora: TarefaFestival[];
  conflitos: Conflito[];
  /** Mudanças no documento da página. */
  nucleosNovos: Nucleo[];
  nucleosAtualizados: MudancaNucleo[];
  statusNovos: ItemLista[];
  statusRenomeados: { id: string; de: string; para: string }[];
  avisos: string[];
}

export const ROTULO_CAMPO: Record<CampoDoPlano, string> = {
  titulo: "tarefa", nucleo: "núcleo", frente: "frente", responsavel: "responsável", prazo: "prazo", prioridade: "prioridade",
  status: "status", dependencia: "dependência", entrega: "entrega", anotacoes: "anotações",
};

const valorDe = (t: Retrato | TarefaFestival, campo: CampoDoPlano): string | null => {
  const v = (t as Retrato)[campo];
  return v == null || v === "" ? null : String(v);
};
const mesmoTexto = (campo: CampoDoPlano, a: string | null, b: string | null) =>
  COM_NOME.includes(campo) ? normalizar(a).trim() === normalizar(b).trim() : (a ?? "") === (b ?? "");
const mesmoRetrato = (a: Retrato | undefined, b: Retrato) => !!a && CAMPOS_DO_PLANO.every((c) => (a[c] ?? null) === (b[c] ?? null));

/** Id estável para a tarefa nova, a partir do ID do plano: "ART-001" → "t-art-001". */
const idDaTarefa = (codigo: string) => "t-" + (normalizar(codigo).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "plano");

/** Compara o plano com a base. Não grava nada. */
export function prepararImportacao(base: Base, plano: Plano, opcoes: OpcoesImportacao): Preparo {
  const p = base.pagina;
  const avisos = [...plano.avisos];
  const existentes = Object.values(base.tarefas);

  /* Memória das importações anteriores: o nome que a planilha usou → o id que ele virou aqui. É o que faz um
     núcleo ou um status renomeado na Central continuar sendo o mesmo para a planilha. */
  const memoria: Record<"nucleo" | "status" | "responsavel", Map<string, string>> = { nucleo: new Map(), status: new Map(), responsavel: new Map() };
  const lista = p.listas.statusTarefa || [];
  const vale = {
    nucleo: (id: string) => p.nucleos.some((n) => n.id === id),
    status: (id: string) => lista.some((s) => s.id === id),
    responsavel: (id: string) => !!base.cadastro[id],
  };
  for (const t of existentes) {
    for (const campo of ["nucleo", "status", "responsavel"] as const) {
      const nome = normalizar(t.planilha?.[campo]).trim();
      const id = t.importado?.[campo];
      if (nome && id && vale[campo](id) && !memoria[campo].has(nome)) memoria[campo].set(nome, id);
    }
  }

  /* Núcleos: o GT da planilha é o núcleo de mesmo nome; o que não existe só é criado se alguma tarefa precisar dele. */
  const idsNucleo = new Set(p.nucleos.map((n) => n.id));
  const nucleoPorNome = new Map(p.nucleos.map((n) => [normalizar(n.nome).trim(), n.id]));
  const nucleosNovos: Nucleo[] = [];
  const acharNucleo = (nome: string | null): string | null => {
    const n = normalizar(nome).trim();
    return n ? memoria.nucleo.get(n) || nucleoPorNome.get(n) || null : null;
  };
  const nucleoDe = (nome: string | null): string | null => {
    if (!normalizar(nome).trim()) return null;
    const achado = acharNucleo(nome);
    if (achado) return achado;
    const id = idDeItem(nome!, idsNucleo);
    nucleoPorNome.set(normalizar(nome).trim(), id);
    nucleosNovos.push({ id, nome: nome!.trim(), responsavel: null, membros: [] });
    return id;
  };

  /* Pessoas da equipe pelo nome: o que já valeu antes; senão igual; senão a única cujo nome começa com o que veio ("William" → William Faria). */
  const equipe = cadastrosDoTipo(base, "equipe");
  const naoAchados = new Set<string>();
  const pessoa = (nome: string | null): string | null => {
    const n = normalizar(nome).trim();
    if (!n) return null;
    const antes = memoria.responsavel.get(n);
    if (antes) return antes;
    const igual = equipe.find((e) => normalizar(e.nome).trim() === n);
    if (igual) return igual.id;
    const parecidos = equipe.filter((e) => normalizar(e.nome).startsWith(n + " ") || n.startsWith(normalizar(e.nome).trim() + " "));
    if (parecidos.length === 1) return parecidos[0].id;
    naoAchados.add(nome!.trim());
    return null;
  };

  /* Status: o que já valeu antes; senão o nome igual; senão o sinônimo (e o item passa a ter o nome da planilha); senão entra na lista. */
  const idsStatus = new Set(lista.map((s) => s.id));
  const statusPorNome = new Map(lista.map((s) => [normalizar(s.nome).trim(), s.id]));
  const statusNovos: ItemLista[] = [];
  const statusRenomeados: Preparo["statusRenomeados"] = [];
  const primeiroStatus = lista[0]?.id || "";
  const statusDe = (nome: string | null): string => {
    const n = normalizar(nome).trim();
    if (!n) return primeiroStatus;
    const conhecido = memoria.status.get(n) || statusPorNome.get(n);
    if (conhecido) return conhecido;
    const item = SINONIMOS_STATUS[n] ? lista.find((s) => s.id === SINONIMOS_STATUS[n]) : undefined;
    if (item) {
      statusPorNome.set(n, item.id);
      // Só renomeia se a própria planilha não usa o nome atual do item.
      if (!plano.linhas.some((l) => normalizar(l.cru.status).trim() === normalizar(item.nome).trim()) && !statusRenomeados.some((r) => r.id === item.id)) {
        statusRenomeados.push({ id: item.id, de: item.nome, para: nome!.trim() });
      }
      return item.id;
    }
    const id = idDeItem(nome!, idsStatus);
    statusPorNome.set(n, id);
    statusNovos.push({ id, nome: nome!.trim() });
    return id;
  };

  const prioridadesDesconhecidas = new Set<string>();
  const prioridadeDaCelula = (nome: string | null): string | null => {
    const n = normalizar(nome).trim();
    if (!n) return null;
    const id = PRIORIDADES.find(([v, r]) => v === n || normalizar(r) === n)?.[0] || SINONIMOS_PRIORIDADE[n];
    if (!id) prioridadesDesconhecidas.add(nome!.trim());
    return id || null;
  };

  /** O texto da célula → o valor que a tarefa guarda. */
  const resolver = (campo: CampoDoPlano, texto: string | null): string | null =>
    campo === "nucleo" ? nucleoDe(texto)
      : campo === "responsavel" ? pessoa(texto)
        : campo === "status" ? statusDe(texto) || null
          : campo === "prioridade" ? prioridadeDaCelula(texto)
            : texto;

  /** Quem o plano põe como responsável, por núcleo: essas pessoas entram como membros (a página só deixa a tarefa com membro do núcleo). */
  const indicados = new Map<string, Set<string>>();
  const indicar = (nucleoId: string | null | undefined, pessoaId: string | null | undefined) => {
    if (nucleoId && pessoaId) indicados.set(nucleoId, (indicados.get(nucleoId) || new Set()).add(pessoaId));
  };

  /* Tarefas. */
  const porCodigo = new Map<string, TarefaFestival>();
  existentes.forEach((t) => { if (t.codigo?.trim()) porCodigo.set(t.codigo.trim().toUpperCase(), t); });
  const noPlano = new Set<string>();
  const novas: TarefaFestival[] = [];
  const atualizadas: Mudanca[] = [];
  const carimbos: TarefaFestival[] = [];
  const conflitos: Conflito[] = [];
  let iguais = 0;

  plano.linhas.forEach((l, i) => {
    const chave = l.codigo.toUpperCase();
    noPlano.add(chave);
    const atual = porCodigo.get(chave);

    if (!atual) {
      const v = Object.fromEntries(CAMPOS_DO_PLANO.map((c) => [c, resolver(c, l.cru[c])])) as Record<CampoDoPlano, string | null>;
      let id = idDaTarefa(l.codigo);
      if (base.tarefas[id] || novas.some((n) => n.id === id)) id = id + "-" + (i + 1);
      novas.push({
        id, codigo: l.codigo, titulo: v.titulo || "", nucleo: v.nucleo || "", responsavel: v.responsavel, prazo: v.prazo,
        status: v.status || primeiroStatus, urgente: v.prioridade === "critica", prioridade: v.prioridade || "",
        frente: v.frente || "", dependencia: v.dependencia || "", entrega: v.entrega || "", anotacoes: v.anotacoes || "",
        ordem: i + 1, planilha: l.cru, importado: v,
      });
      indicar(v.nucleo, v.responsavel);
      return;
    }

    // Tarefa que já existe: junta campo a campo com os retratos da última importação.
    const planilhaAntes = atual.planilha, importadoAntes = atual.importado;
    const planilha: Retrato = { ...(planilhaAntes || {}) };
    const importado: Retrato = { ...(importadoAntes || {}) };
    const nova: TarefaFestival = { ...atual };
    const mudou: CampoDoPlano[] = [];
    for (const campo of CAMPOS_DO_PLANO) {
      if (!plano.campos.has(campo)) continue;
      const texto = l.cru[campo];
      const conhecia = !!planilhaAntes && campo in planilhaAntes;
      // Nome que a importação anterior não reconheceu (pessoa que ainda não estava no Cadastro): tenta de novo.
      const pendente = conhecia && texto != null && COM_NOME.includes(campo) && (importadoAntes?.[campo] ?? null) == null;
      // Primeiro encontro com a planilha: célula vazia não apaga o que a tarefa já tem.
      const planilhaMudou = conhecia ? pendente || !mesmoTexto(campo, planilhaAntes![campo] ?? null, texto) : texto != null;
      planilha[campo] = texto;
      if (!planilhaMudou) continue;
      const valor = resolver(campo, texto);
      importado[campo] = valor;
      // Nome que continua sem reconhecer: a tarefa fica como está (o aviso já foi dado).
      if (valor == null && texto != null) continue;
      const daqui = valorDe(atual, campo);
      if (daqui === valor) continue;
      const centralMudou = conhecia && importadoAntes && campo in importadoAntes ? (importadoAntes[campo] ?? null) !== daqui : daqui != null;
      if (centralMudou) {
        conflitos.push({ codigo: l.codigo, campo, naCentral: daqui ?? "", naPlanilha: texto ?? "" });
        if (!opcoes.planilhaVenceConflito) continue;
      }
      (nova as unknown as Record<string, unknown>)[campo] = campo === "responsavel" || campo === "prazo" ? valor : valor ?? "";
      mudou.push(campo);
    }
    nova.planilha = planilha;
    nova.importado = importado;
    nova.urgente = (nova.prioridade || (nova.urgente ? "critica" : "")) === "critica";
    nova.ordem = i + 1;
    if (mudou.includes("responsavel") || mudou.includes("nucleo")) indicar(nova.nucleo, importado.responsavel === nova.responsavel ? nova.responsavel : null);
    if (mudou.length) atualizadas.push({ tarefa: nova, campos: mudou });
    else {
      iguais++;
      if (!mesmoRetrato(planilhaAntes, planilha) || !mesmoRetrato(importadoAntes, importado) || atual.ordem !== nova.ordem) carimbos.push(nova);
    }
  });

  /* Núcleos: os novos recebem escopo, responsável e membros. Nos que já existem, o escopo segue a planilha
     enquanto ninguém o editou aqui, o responsável só entra se ainda não houver um, e quem o plano indica vira membro. */
  const nucleosAtualizados: MudancaNucleo[] = [];
  const mudancaDe = (n: Nucleo) => {
    let m = nucleosAtualizados.find((x) => x.id === n.id);
    if (!m) { m = { id: n.id, nome: n.nome }; nucleosAtualizados.push(m); }
    return m;
  };
  for (const gt of plano.gts) {
    const id = acharNucleo(gt.nome);
    if (!id) continue;
    const responsavel = pessoa(gt.responsavel || null);
    indicar(id, responsavel);
    const novo = nucleosNovos.find((n) => n.id === id);
    if (novo) {
      novo.responsavel = responsavel;
      if (gt.escopo) { novo.escopo = gt.escopo; novo.escopoDoPlano = gt.escopo; }
      continue;
    }
    const n = p.nucleos.find((x) => x.id === id)!;
    if (gt.escopo && gt.escopo !== (n.escopoDoPlano || "")) {
      const m = mudancaDe(n);
      m.escopoDoPlano = gt.escopo;
      if ((!n.escopo || n.escopo === n.escopoDoPlano) && n.escopo !== gt.escopo) m.escopo = gt.escopo;
    }
    if (responsavel && !n.responsavel) mudancaDe(n).responsavel = responsavel;
  }
  nucleosNovos.forEach((n) => { n.membros = [...(indicados.get(n.id) || [])]; });
  for (const n of p.nucleos) {
    const entram = [...(indicados.get(n.id) || [])].filter((m) => !(n.membros || []).includes(m));
    if (entram.length) mudancaDe(n).membros = entram;
  }

  const fora = existentes
    .filter((t) => !t.codigo?.trim() || !noPlano.has(t.codigo.trim().toUpperCase()))
    .sort((a, b) => (a.ordem || 999) - (b.ordem || 999));

  if (naoAchados.size) avisos.push("Responsável que não está na equipe do Cadastro geral (a tarefa entra sem responsável): " + [...naoAchados].join(", ") + ".");
  if (prioridadesDesconhecidas.size) avisos.push("Prioridade que não reconheci (a tarefa entra sem prioridade): " + [...prioridadesDesconhecidas].join(", ") + ".");
  const semNucleo = novas.filter((t) => !t.nucleo).length;
  if (semNucleo && plano.campos.has("nucleo")) avisos.push(semNucleo + " tarefa(s) sem Grupo de Trabalho na planilha entram sem núcleo.");

  return { novas, atualizadas, carimbos, iguais, fora, conflitos, nucleosNovos, nucleosAtualizados, statusNovos, statusRenomeados, avisos };
}

/** Texto de um valor guardado na tarefa para a tela (ids viram nomes). */
export function mostrarValor(base: Base, campo: CampoDoPlano, valor: string): string {
  if (!valor) return "vazio";
  if (campo === "nucleo") return base.pagina.nucleos.find((n) => n.id === valor)?.nome || valor;
  if (campo === "status") return base.pagina.listas.statusTarefa.find((s) => s.id === valor)?.nome || valor;
  if (campo === "prioridade") return PRIORIDADES.find(([v]) => v === valor)?.[1] || valor;
  if (campo === "responsavel") return base.cadastro[valor]?.nome || valor;
  if (campo === "prazo") return valor.split("-").reverse().join("/");
  return valor;
}

/** Texto de uma célula da planilha para a tela. */
export const mostrarCelula = (campo: CampoDoPlano, texto: string) =>
  !texto ? "vazio" : campo === "prazo" ? texto.split("-").reverse().join("/") : texto;

/* ══════════ exportar ══════════ */

/** Cabeçalho da planilha exportada: o mesmo do plano, para ela voltar pela importação. */
export const CABECALHO_PLANO = [
  "ID", "Grupo de Trabalho (GT)", "Responsável pelo GT", "Frente / Subtema", "Tarefa", "Responsável da tarefa",
  "Prazo", "Prioridade", "Status", "Dependência / Aguardando de", "Entrega / Evidência", "Observações",
];

/** As tarefas no formato do plano (uma linha por tarefa, na ordem recebida). */
export function linhasDoPlano(base: Base, tarefas: TarefaFestival[]): string[][] {
  const p = base.pagina;
  const nome = (id: string | null | undefined) => (id && base.cadastro[id]?.nome) || "";
  return tarefas.map((t) => {
    const n = p.nucleos.find((x) => x.id === t.nucleo);
    return [
      t.codigo || "", n?.nome || "", nome(n?.responsavel), t.frente || "", t.titulo, nome(t.responsavel),
      t.prazo ? t.prazo.split("-").reverse().join("/") : "",
      PRIORIDADES.find(([v]) => v === (t.prioridade || (t.urgente ? "critica" : "")))?.[1] || "",
      p.listas.statusTarefa.find((s) => s.id === t.status)?.nome || t.status || "",
      t.dependencia || "", t.entrega || "", t.anotacoes || "",
    ];
  });
}
