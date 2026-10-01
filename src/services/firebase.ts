/* Conexão com o Firebase, lida das variáveis de ambiente (.env / Vercel).
   Sem as variáveis, `firebaseAtivo` fica false e o site roda em MODO LOCAL:
   tudo salvo em localStorage, sem login — bom para desenvolver e testar.
   Com as variáveis, entra o Firestore (com cache offline), o login por e-mail/senha e o
   Storage (arquivos das páginas próprias; as regras estão em storage.rules). */
import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  clearIndexedDbPersistence, initializeFirestore, persistentLocalCache,
  persistentMultipleTabManager, terminate, type Firestore,
} from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported as analyticsSuportado } from "firebase/analytics";

const env = import.meta.env;

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
};

/** true quando as credenciais do Firebase estão configuradas. */
export const firebaseAtivo = Boolean(config.apiKey && config.projectId);

let app: FirebaseApp | null = null;
let bancoFirestore: Firestore | null = null;
let autenticacao: Auth | null = null;
let armazenamentoStorage: FirebaseStorage | null = null;

if (firebaseAtivo) {
  app = initializeApp(config as Record<string, string>);
  // Cache local persistente: o site abre e funciona offline; sincroniza quando voltar a rede.
  bancoFirestore = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  autenticacao = getAuth(app);
  armazenamentoStorage = getStorage(app);
  // Google Analytics (opcional): só liga se houver measurementId e o navegador suportar.
  if (config.measurementId) {
    analyticsSuportado().then((ok) => { if (ok && app) getAnalytics(app); }).catch(() => { /* sem analytics, sem drama */ });
  }
}

export const db = bancoFirestore;
export const auth = autenticacao;
/** Storage dos arquivos das páginas próprias; null no modo local (aí só vale link). */
export const armazenamento = armazenamentoStorage;

/**
 * Encerra o Firestore e apaga o cache persistente dele (IndexedDB).
 * Chamado no logout: um cache que atravessa a troca de sessão pode ficar num
 * estado ruim (snapshots eternamente "do cache", conexão presa) — era o que
 * prendia o site em "carregando…" até a pessoa apagar os dados do navegador.
 * Depois desta chamada o `db` não serve mais; quem chama recarrega a página.
 */
export async function limparCacheFirestore() {
  if (!bancoFirestore) return;
  try {
    await terminate(bancoFirestore);
    await clearIndexedDbPersistence(bancoFirestore);
  } catch { /* outra aba aberta segura o cache — tudo bem, ela continua dona dele */ }
}
