/* Acesso de quem está logado: a marca master e a lista de módulos, lidas uma vez
   do documento `usuarios/<e-mail>` assim que o login muda. Daqui saem as
   perguntas que o site faz o tempo todo: "abre este módulo?", "tem algum
   módulo da Central?", "pode gravar nesta coleção?". A última vira a guarda do
   Banco: uma gravação que a lista não permite é recusada aqui, com aviso,
   antes de ir ao banco (que recusaria também, pelas regras).

   Leitura do documento: uma vez só, com `carregarDocumento`. Conta sem
   documento, desativada ou leitura recusada pelo banco: "sem acesso", não um
   laço de religar; mudança de papel vale na próxima entrada. A primeira linha
   master de um banco novo se cria à mão no console (ver firestore.rules).

   Modo local (sem Firebase): a conta é master. Para testar as cascas, grave no
   localStorage a chave `central-acesso-teste`, por exemplo
   {"master":false,"modulos":["agenda","pagina:caminhosdoforro"]}. */
import { useSyncExternalStore } from "react";
import { Banco } from "./banco";
import { firebaseAtivo } from "./firebase";
import { toast } from "../components/Toast";
import { MODULOS_CENTRAL, MODULOS_DA_COLECAO, moduloDaPagina, type Acesso } from "../types/acesso";

export interface EstadoAcesso {
  /** Ainda esperando o banco dizer se a conta tem documento. */
  carregando: boolean;
  /** null = sem documento: a conta não abre nada. */
  acesso: Acesso | null;
}

const CHAVE_TESTE = "central-acesso-teste";

/** Modo local: master, ou a lista simulada em localStorage. */
function acessoLocal(): Acesso {
  const base: Acesso = { email: "", nome: "modo local", ativo: true, master: true, modulos: [] };
  try {
    const s = JSON.parse(localStorage.getItem(CHAVE_TESTE) || "null");
    if (s && typeof s === "object") return { ...base, master: Boolean(s.master), modulos: Array.isArray(s.modulos) ? s.modulos : [], ativo: s.ativo !== false };
  } catch { /* sem simulação */ }
  return base;
}

let estado: EstadoAcesso = firebaseAtivo
  ? { carregando: true, acesso: null }
  : { carregando: false, acesso: acessoLocal() };
let chaveAtual = "";
const assinantes = new Set<() => void>();
const publicar = () => assinantes.forEach((f) => f());

/** Chamado pela sessão quando o login muda (e-mail, ou null ao sair). */
export function ligarAcesso(email: string | null) {
  if (!email) { chaveAtual = ""; estado = { carregando: false, acesso: null }; publicar(); return; }
  const chave = email.trim().toLowerCase();
  chaveAtual = chave;
  estado = { carregando: true, acesso: null };
  publicar();
  void lerAcesso(chave);
}

async function lerAcesso(chave: string) {
  let documento: Record<string, unknown> | undefined;
  try {
    documento = await Banco.carregarDocumento("usuarios", chave);
  } catch {
    documento = undefined; // o banco recusou a leitura: sem acesso
  }
  if (chave !== chaveAtual) return; // o login mudou no meio da leitura
  estado = { carregando: false, acesso: documento ? (documento as unknown as Acesso) : null };
  publicar();
}

export function usarAcesso(): EstadoAcesso {
  return useSyncExternalStore(
    (cb) => { assinantes.add(cb); return () => assinantes.delete(cb); },
    () => estado,
  );
}

export const acessoAtual = (): EstadoAcesso => estado;

/** A conta abre este módulo? Master abre tudo. */
export function temModulo(modulo: string): boolean {
  const a = estado.acesso;
  if (!a || !a.ativo) return false;
  if (a.master) return true;
  return a.modulos.includes(modulo);
}

/** Tem algum módulo da Central (entra na Central, e lê o banco do coletivo)? */
export const temCentral = (): boolean => MODULOS_CENTRAL.some(temModulo);

/** O ambiente abre? Páginas anexo não é módulo: abre para quem tem qualquer módulo da Central. */
export const podeAbrirAmbiente = (id: string): boolean => (id === "anexos" ? temCentral() : temModulo(id));

/** Pode gravar nesta coleção (a mesma tabela das regras do Firestore)? */
export function podeGravar(colecao: string, id: string): boolean {
  const a = estado.acesso;
  if (!a || !a.ativo) return false;
  if (a.master) return true;
  if (colecao === "paginas") return temModulo(moduloDaPagina(id));
  if (colecao.startsWith("paginas/")) return temModulo(moduloDaPagina(colecao.split("/")[1]));
  if (colecao === "presets") return a.modulos.length > 0;
  if (colecao === "lixeira" || colecao === "log_alteracoes") return a.modulos.length > 0;
  if (colecao === "backup_v2") return false;
  const donos = MODULOS_DA_COLECAO[colecao];
  if (!donos) return true; // coleção que o site não conhece: o banco decide
  return donos.some(temModulo);
}

// A guarda do Banco: devolve o motivo da recusa, ou "" quando pode gravar.
Banco.definirGuarda((colecao, id) => {
  if (podeGravar(colecao, id)) return "";
  const motivo = "sua conta não tem acesso para gravar em " + colecao;
  toast("Não gravado: " + motivo + ".");
  return motivo;
});
