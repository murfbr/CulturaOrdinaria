/* Camada de armazenamento: a mesma API para os dois modos.
   - MODO NUVEM (Firebase configurado): cada coleção é uma coleção do Firestore,
     cada registro um documento. Mudanças chegam em tempo real via onSnapshot.
   - MODO LOCAL (sem Firebase): tudo num espelho em localStorage, com sincronização
     entre abas pelo evento "storage".
   As gravações são adiadas (debounce) por documento, como no artefato original,
   para digitação fluida sem uma gravação por tecla. */
import {
  Timestamp, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc,
} from "firebase/firestore";
import { db, firebaseAtivo } from "./firebase";
import { clonar, hora } from "../utils";

type Documento = Record<string, unknown> & { id: string };
type Mapa = Record<string, Documento>;
/** `confirmado` = o dado veio do servidor (ou é modo local): seguro para decidir semeadura. */
type Observador = (m: Mapa, confirmado: boolean) => void;
/** Observador de um documento só (páginas próprias): recebe o documento, ou undefined se não existe. */
type ObservadorDoc = (d: Documento | undefined, confirmado: boolean) => void;

const CHAVE_LOCAL = "central-coletivo-local-v1";

/** Coleções pesadas que, no MODO NUVEM, ficam fora do espelho localStorage:
    o cache offline do próprio Firestore (IndexedDB) já as guarda, e mantê-las
    fora evita inchar (e reserializar a cada tecla) o espelho. No modo local o
    localStorage É o banco, então elas entram normalmente. */
const SEM_ESPELHO_NA_NUVEM = new Set(["formularios", "lixeira", "backup_v2"]);

/** Texto e cor do indicador "salvo às..." no topo do site. */
export type StatusSalvamento = { texto: string; classe: "" | "ok" | "sv" | "er" };

/* ══════════ Autoria e log de alterações ══════════
   Todo documento gravado recebe `atualizadoPor` (e-mail de quem está logado; a
   sessão informa via `Banco.definirAutor`). Além disso, cada gravação que chega
   ao Firestore deixa uma linha na coleção `log_alteracoes`: coleção, id, ação
   (novo, edicao, exclusao), quem, quando e quais campos mudaram. É esse log que
   permite saber, depois, quem mexeu no quê — o `atualizadoPor` sozinho só guarda
   o último. Coleções de controle (lixeira, backup_v2, o próprio log) não entram.
   O log só existe no modo nuvem. Para não crescer sem limite, cada linha leva
   `expiraEm` (90 dias): basta ligar uma política de TTL nesse campo no console
   do Firestore (Firestore Database → TTL) e o próprio banco apaga as antigas. */
const COLECAO_LOG = "log_alteracoes";
const SEM_LOG = new Set([COLECAO_LOG, "lixeira", "backup_v2"]);
const CAMPOS_IGNORADOS_NO_DIFF = new Set(["_novo", "atualizado", "atualizadoPor"]);
const DIAS_DE_LOG = 90;
let autorAtual = "";
/** Versão do documento antes da primeira gravação de cada janela de debounce. */
const anteriores: Record<string, Documento | undefined> = {};

function camposAlterados(antes: Documento | undefined, depois: Documento): string[] {
  if (!antes) return [];
  const chaves = new Set([...Object.keys(antes), ...Object.keys(depois)]);
  const mudaram: string[] = [];
  for (const k of chaves) {
    if (CAMPOS_IGNORADOS_NO_DIFF.has(k)) continue;
    if (JSON.stringify(antes[k]) !== JSON.stringify(depois[k])) mudaram.push(k);
  }
  return mudaram.sort();
}

/** Grava uma linha de log. Nunca lança: falha no log não pode travar a gravação real. */
function registrarAlteracao(colecao: string, id: string, acao: "novo" | "edicao" | "exclusao", antes: Documento | undefined, depois: Documento | undefined) {
  if (!firebaseAtivo || !db || SEM_LOG.has(colecao)) return;
  const campos = acao === "edicao" ? camposAlterados(antes, depois as Documento) : [];
  if (acao === "edicao" && campos.length === 0) return; // regravação sem mudança real
  const agora = new Date();
  const ref = depois || antes;
  const rotulo = ref ? String(ref.titulo || ref.nome || ref.id || id) : id;
  const linha = {
    colecao, docId: id, acao, campos,
    quem: autorAtual || "",
    quando: agora.toISOString(),
    rotulo,
    expiraEm: Timestamp.fromMillis(agora.getTime() + DIAS_DE_LOG * 86400000),
  };
  // Id de documento não aceita barra: caminho de subcoleção ("paginas/x/edicoes") vira ponto.
  const idLog = agora.toISOString().replace(/[:.]/g, "-") + "_" + colecao.replace(/\//g, ".") + "_" + id;
  setDoc(doc(db, COLECAO_LOG, idLog), linha).catch(() => { /* log é melhor esforço */ });
}

const espelho: Record<string, Mapa> = carregarEspelho();
const observadores: Record<string, Set<Observador>> = {};
/** Observadores de documento, pela chave colecao/id. */
const observadoresDoc: Record<string, Set<ObservadorDoc>> = {};
const timers: Record<string, ReturnType<typeof setTimeout>> = {};
const aoStatus: Set<(s: StatusSalvamento) => void> = new Set();
let statusAtual: StatusSalvamento = { texto: "carregando…", classe: "" };
/** Coleções cuja última resposta ainda veio só do cache local (sem confirmação do servidor). */
const emCache = new Set<string>();

function carregarEspelho(): Record<string, Mapa> {
  try { return JSON.parse(localStorage.getItem(CHAVE_LOCAL) || "{}").colls || {}; }
  catch { return {}; }
}
function salvarEspelho() {
  try {
    let colls = espelho;
    if (firebaseAtivo) {
      colls = {};
      for (const [colecao, mapa] of Object.entries(espelho)) {
        if (!SEM_ESPELHO_NA_NUVEM.has(colecao)) colls[colecao] = mapa;
      }
    }
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify({ colls }));
  } catch { /* sem espaço: segue só em memória */ }
}

function avisar(colecao: string, confirmado = !firebaseAtivo) {
  for (const cb of observadores[colecao] || []) cb(espelho[colecao] || {}, confirmado);
  // Quem escuta um documento desta coleção também é avisado (gravação local, reconciliação).
  for (const [chave, cbs] of Object.entries(observadoresDoc)) {
    if (chave.lastIndexOf("/") !== colecao.length || !chave.startsWith(colecao + "/")) continue;
    const id = chave.slice(colecao.length + 1);
    for (const cb of cbs) cb((espelho[colecao] || {})[id], confirmado);
  }
}

function mudarStatus(s: StatusSalvamento) {
  statusAtual = s;
  for (const cb of aoStatus) cb(s);
}

/** Estado de sincronização vindo das escutas. Não passa por cima de um estado de
    gravação ("salvando…", "salvo HH:MM", "sem conexão"): esses já dizem mais. */
function statusDaSincronizacao() {
  const t = statusAtual.texto;
  const deGravacao = t.startsWith("salv") || t.startsWith("sem conexão");
  if (deGravacao) return;
  mudarStatus(emCache.size
    ? { texto: "sincronizando…", classe: "sv" }
    : { texto: "sincronizado", classe: "ok" });
}

/* No modo local, outras abas avisam via evento "storage". */
if (!firebaseAtivo) {
  window.addEventListener("storage", (e) => {
    if (e.key !== CHAVE_LOCAL) return;
    const novo = carregarEspelho();
    for (const colecao of new Set([...Object.keys(espelho), ...Object.keys(novo)])) {
      if (JSON.stringify(espelho[colecao]) !== JSON.stringify(novo[colecao])) {
        espelho[colecao] = novo[colecao] || {};
        avisar(colecao);
      }
    }
  });
}

export const Banco = {
  /** "nuvem" com Firebase; "local" sem. */
  modo: (firebaseAtivo ? "nuvem" : "local") as "nuvem" | "local",

  statusAtual: () => statusAtual,

  /** E-mail de quem está logado, para carimbar `atualizadoPor` e o log. A sessão chama ao entrar e ao sair. */
  definirAutor(email: string) {
    autorAtual = email || "";
  },

  aoMudarStatus(cb: (s: StatusSalvamento) => void) {
    aoStatus.add(cb);
    return () => { aoStatus.delete(cb); };
  },

  /**
   * Conecta uma coleção: devolve o estado atual e chama `cb` a cada mudança
   * (inclusive a primeira carga, no modo nuvem). Devolve função para desligar.
   */
  assinar(colecao: string, cb: Observador): () => void {
    (observadores[colecao] = observadores[colecao] || new Set()).add(cb);
    espelho[colecao] = espelho[colecao] || {};

    if (!firebaseAtivo || !db) {
      // Modo local: o espelho já É o banco.
      cb(espelho[colecao], true);
      mudarStatus({ texto: "salvo só neste navegador", classe: "" });
      return () => observadores[colecao].delete(cb);
    }

    // Escuta em tempo real com religamento: um listener do Firestore que
    // recebe erro (corte de permissão, token vencido…) morre em definitivo —
    // é assim que o SDK funciona. Em erro, esperamos e assinamos de novo,
    // dobrando a espera a cada falha seguida (máximo 30 s).
    let parar = () => {};
    let desligado = false;
    let falhas = 0;
    let religar: ReturnType<typeof setTimeout> | undefined;

    const ligar = () => {
      if (desligado || !db) return;
      let jaRecebeu = false;
      let confirmou = false;
      parar = onSnapshot(
        collection(db, colecao),
        // Com os metadados, o SDK também avisa quando o servidor confirma o que
        // veio do cache (sem mudança de dado). Sem isso o "sincronizando…" ficava
        // preso para sempre em quem já tinha tudo em cache.
        { includeMetadataChanges: true },
        (snap) => {
          falhas = 0;
          if (snap.metadata.fromCache) emCache.add(colecao); else emCache.delete(colecao);
          if (jaRecebeu && snap.docChanges().length === 0) {
            // Só metadados mudaram (confirmação do servidor, gravação aceita):
            // nada a reconciliar. Se é a confirmação, avisa quem espera por ela.
            if (!snap.metadata.fromCache && !confirmou) { confirmou = true; avisar(colecao, true); }
            statusDaSincronizacao();
            return;
          }
          jaRecebeu = true;
          if (!snap.metadata.fromCache) confirmou = true;
          const remoto: Mapa = {};
          snap.forEach((d) => { remoto[d.id] = clonar(d.data()) as Documento; });

          // Reconciliação servidor ⇄ espelho local (mesma semântica do artefato):
          // - gravação em andamento (timer) nunca é sobrescrita;
          // - documento marcado _novo que não existe no servidor é dele que o
          //   servidor ainda não sabe → sobe agora (é assim que o que foi criado
          //   offline, sem permissão ou em modo local chega ao banco);
          // - existindo dos dois lados, fica o mais recente pelo `atualizado`
          //   (empate → servidor); local mais novo sobe;
          // - sem _novo e sumido do servidor = excluído por alguém → cai daqui também.
          const local = espelho[colecao] || {};
          const mapa: Mapa = { ...remoto };
          const subir: string[] = [];
          for (const [id, docLocal] of Object.entries(local)) {
            if (timers[colecao + "/" + id]) { mapa[id] = docLocal; continue; }
            const docRemoto = remoto[id];
            const nuncaSubiu = Boolean(docLocal._novo);
            if (!docRemoto) {
              if (nuncaSubiu) { mapa[id] = docLocal; subir.push(id); }
              continue;
            }
            if (String(docLocal.atualizado || "") > String(docRemoto.atualizado || "")) {
              mapa[id] = docLocal;
              subir.push(id);
            }
          }

          espelho[colecao] = mapa;
          salvarEspelho();
          statusDaSincronizacao();
          avisar(colecao, !snap.metadata.fromCache);
          subir.forEach((id) => { void this.descarregar(colecao, id); });
        },
        () => {
          emCache.add(colecao);
          mudarStatus({ texto: "banco indisponível — tentando reconectar…", classe: "er" });
          religar = setTimeout(ligar, Math.min(30000, 1000 * 2 ** falhas++));
        },
      );
    };
    ligar();

    // Entrega o que já existe no espelho enquanto o primeiro snapshot não chega.
    cb(espelho[colecao], false);
    return () => {
      desligado = true;
      clearTimeout(religar);
      observadores[colecao].delete(cb);
      emCache.delete(colecao);
      parar();
    };
  },

  /**
   * Conecta um documento só (ex.: a ficha de uma página própria em `paginas/<slug>`),
   * sem trazer a coleção inteira. Mesmo espelho e mesma reconciliação de `assinar`:
   * gravação em andamento fica; local marcado _novo sobe; o mais recente pelo
   * `atualizado` vence; sumido do servidor sem _novo = excluído.
   */
  assinarDocumento(colecao: string, id: string, cb: ObservadorDoc): () => void {
    const chave = colecao + "/" + id;
    (observadoresDoc[chave] = observadoresDoc[chave] || new Set()).add(cb);
    espelho[colecao] = espelho[colecao] || {};

    if (!firebaseAtivo || !db) {
      cb(espelho[colecao][id], true);
      mudarStatus({ texto: "salvo só neste navegador", classe: "" });
      return () => observadoresDoc[chave].delete(cb);
    }

    let parar = () => {};
    let desligado = false;
    let falhas = 0;
    let religar: ReturnType<typeof setTimeout> | undefined;

    const ligar = () => {
      if (desligado || !db) return;
      parar = onSnapshot(
        doc(db, colecao, id),
        { includeMetadataChanges: true },
        (snap) => {
          falhas = 0;
          if (snap.metadata.fromCache) emCache.add(chave); else emCache.delete(chave);
          const local = (espelho[colecao] || {})[id];
          const remoto = snap.exists() ? (clonar(snap.data()) as Documento) : undefined;
          let atual = remoto;
          let subir = false;
          if (local && timers[chave]) atual = local;
          else if (local && !remoto && local._novo) { atual = local; subir = true; }
          else if (local && remoto && String(local.atualizado || "") > String(remoto.atualizado || "")) { atual = local; subir = true; }
          if (atual) espelho[colecao][id] = atual; else delete espelho[colecao][id];
          salvarEspelho();
          statusDaSincronizacao();
          for (const f of observadoresDoc[chave] || []) f(atual, !snap.metadata.fromCache);
          if (subir) void this.descarregar(colecao, id);
        },
        () => {
          emCache.add(chave);
          mudarStatus({ texto: "banco indisponível — tentando reconectar…", classe: "er" });
          religar = setTimeout(ligar, Math.min(30000, 1000 * 2 ** falhas++));
        },
      );
    };
    ligar();

    cb(espelho[colecao][id], false);
    return () => {
      desligado = true;
      clearTimeout(religar);
      observadoresDoc[chave].delete(cb);
      emCache.delete(chave);
      parar();
    };
  },

  /** Lê um documento de uma vez, sem escuta (ações pontuais, como a cascata de exclusão). Alimenta o espelho. */
  async carregarDocumento(colecao: string, id: string): Promise<Documento | undefined> {
    if (firebaseAtivo && db) {
      const snap = await getDoc(doc(db, colecao, id));
      espelho[colecao] = espelho[colecao] || {};
      if (snap.exists()) espelho[colecao][id] = clonar(snap.data()) as Documento;
    }
    return (espelho[colecao] || {})[id];
  },

  /** Lê uma coleção (ou subcoleção) de uma vez, sem escuta. Alimenta o espelho. */
  async carregarColecao(colecao: string): Promise<Mapa> {
    if (firebaseAtivo && db) {
      const snap = await getDocs(collection(db, colecao));
      const mapa: Mapa = {};
      snap.forEach((d) => { mapa[d.id] = clonar(d.data()) as Documento; });
      espelho[colecao] = { ...(espelho[colecao] || {}), ...mapa };
    }
    return espelho[colecao] || {};
  },

  /** Estado atual de uma coleção (mapa id → documento). */
  ler(colecao: string): Mapa {
    return espelho[colecao] || {};
  },

  /**
   * Grava um documento com debounce (800 ms; 50 ms quando `rapido`).
   * O espelho e os observadores são atualizados na hora — a rede vem depois.
   */
  gravar(colecao: string, id: string, documento: Documento, rapido = false) {
    const copia = clonar(documento);
    // Sem Firebase, tudo nasce _novo: se este navegador um dia entrar no modo
    // nuvem, a reconciliação do onSnapshot sobe esses documentos sozinha.
    if (!firebaseAtivo) copia._novo = true;
    // Autoria: quem está logado assina o documento (coleções de controle ficam de fora).
    if (autorAtual && !SEM_LOG.has(colecao)) copia.atualizadoPor = autorAtual;
    const chave = colecao + "/" + id;
    // Guarda a versão anterior na primeira gravação da janela de debounce, para o
    // log saber quais campos mudaram quando o documento subir de fato.
    if (!timers[chave] && !(chave in anteriores)) {
      const antes = (espelho[colecao] || {})[id];
      anteriores[chave] = antes ? clonar(antes) : undefined;
    }
    (espelho[colecao] = espelho[colecao] || {})[id] = copia;
    salvarEspelho();
    avisar(colecao);
    clearTimeout(timers[chave]);
    mudarStatus({ texto: "salvando…", classe: "sv" });
    timers[chave] = setTimeout(() => this.descarregar(colecao, id), rapido ? 50 : 800);
  },

  /** Envia de fato um documento pendente (chamado pelo debounce ou pela reconciliação). */
  async descarregar(colecao: string, id: string) {
    const chave = colecao + "/" + id;
    delete timers[chave];
    const documento = (espelho[colecao] || {})[id];
    if (!documento) return;
    if (!firebaseAtivo || !db) {
      mudarStatus({ texto: "salvo neste navegador " + hora(), classe: "" });
      return;
    }
    // A marca _novo é controle interno do espelho — não vai para o Firestore.
    const paraEnviar = clonar(documento);
    delete paraEnviar._novo;
    try {
      await setDoc(doc(db, colecao, id), paraEnviar);
      const atual = (espelho[colecao] || {})[id];
      if (atual && atual._novo) { delete atual._novo; salvarEspelho(); }
      mudarStatus({ texto: "salvo " + hora(), classe: "ok" });
      // Log: só depois de o servidor confirmar, uma linha por janela de debounce.
      const tinhaAnterior = chave in anteriores;
      const antes = anteriores[chave];
      delete anteriores[chave];
      registrarAlteracao(colecao, id, tinhaAnterior && !antes ? "novo" : "edicao", antes, paraEnviar);
    } catch {
      // Não subiu (sem permissão, por exemplo): marca _novo para sobreviver a
      // recarregamentos e tentar de novo na próxima reconciliação.
      const atual = (espelho[colecao] || {})[id];
      if (atual) { atual._novo = true; salvarEspelho(); }
      mudarStatus({ texto: "sem conexão — salvo na fila local", classe: "er" });
    }
  },

  /**
   * Sobe agora tudo o que espera no debounce (usado no logout, antes do signOut,
   * enquanto ainda há permissão). Cada pendente é marcado _novo no espelho antes
   * da tentativa: se a subida não completar (sem rede, página recarregando),
   * a reconciliação do próximo login sobe o documento em vez de descartá-lo.
   */
  async despejar() {
    const pendentes = Object.keys(timers);
    for (const chave of pendentes) {
      clearTimeout(timers[chave]);
      const corte = chave.lastIndexOf("/"); // a coleção pode ser um caminho com barras
      const documento = (espelho[chave.slice(0, corte)] || {})[chave.slice(corte + 1)];
      if (documento) documento._novo = true;
    }
    if (pendentes.length) salvarEspelho();
    await Promise.all(pendentes.map((chave) => {
      const corte = chave.lastIndexOf("/");
      return this.descarregar(chave.slice(0, corte), chave.slice(corte + 1));
    }));
  },

  async apagar(colecao: string, id: string) {
    const chave = colecao + "/" + id;
    clearTimeout(timers[chave]);
    delete timers[chave];
    delete anteriores[chave];
    const antes = (espelho[colecao] || {})[id];
    if (espelho[colecao]) delete espelho[colecao][id];
    salvarEspelho();
    avisar(colecao);
    if (firebaseAtivo && db) {
      try {
        await deleteDoc(doc(db, colecao, id));
        registrarAlteracao(colecao, id, "exclusao", antes, undefined);
      } catch { /* offline: o cache do Firestore enfileira */ }
    }
  },

  /** Há gravações na fila? (usado no aviso de sair da página) */
  pendente(): boolean {
    return Object.keys(timers).length > 0;
  },
};

/* Aviso ao fechar a aba com gravações pendentes. */
window.addEventListener("beforeunload", (e) => {
  if (Banco.pendente()) { e.preventDefault(); }
});
