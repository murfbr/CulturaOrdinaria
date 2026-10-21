/* Acesso de quem está logado: a marca master e a lista de módulos, lidas uma vez
   do documento `usuarios/<e-mail>` assim que o login muda. Daqui saem as
   perguntas que o site faz o tempo todo: "abre este módulo?", "tem algum
   módulo da Central?", "pode gravar nesta coleção?". A última vira a guarda do
   Banco: uma gravação que a lista não permite é recusada aqui, com aviso,
   antes de ir ao banco (que recusaria também, pelas regras).

   Leitura do documento: uma vez só, com `carregarDocumento`. Se o banco recusar
   (regras novas e conta sem linha), a resposta é "sem acesso", não um laço de
   religar; mudança de papel vale na próxima entrada.

   Transição (22/10/2026): conta logada sem documento entra como se fosse
   master (TOLERANCIA_SEM_DOCUMENTO), mas só enquanto a lista de contas não
   tem nenhuma master ativa: é a janela em que a primeira linha master nasce,
   pela tela Acessos (com as regras antigas qualquer login já gravava tudo,
   então a janela não abre nada que não estivesse aberto). A partir da
   primeira linha master, conta sem documento vê "Sem acesso", com as regras
   antigas ou novas. As regras novas só podem ser publicadas depois dessa
   linha (a tela Acessos diz quando dá): em 22/10/2026 elas entraram com a
   coleção vazia e trancaram o banco para todo mundo. Tirar a tolerância quando
   as regras novas forem publicadas.

   Modo local (sem Firebase): a conta é master. Para testar as cascas, grave no
   localStorage a chave `central-acesso-teste`, por exemplo
   {"master":false,"modulos":["agenda","pagina:caminhosdoforro"]}. */
import { useSyncExternalStore } from "react";
import { Banco } from "./banco";
import { firebaseAtivo } from "./firebase";
import { toast } from "../components/Toast";
import { MODULOS_CENTRAL, MODULOS_DA_COLECAO, moduloDaPagina, type Acesso } from "../types/acesso";

export const TOLERANCIA_SEM_DOCUMENTO = true;

export interface EstadoAcesso {
  /** Ainda esperando o banco dizer se a conta tem documento. */
  carregando: boolean;
  /** null = sem documento (e sem tolerância): a conta não abre nada. */
  acesso: Acesso | null;
  /** Entrou pela tolerância da transição (sem documento). */
  tolerado: boolean;
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
  ? { carregando: true, acesso: null, tolerado: false }
  : { carregando: false, acesso: acessoLocal(), tolerado: false };
let chaveAtual = "";
const assinantes = new Set<() => void>();
const publicar = () => assinantes.forEach((f) => f());

/** Chamado pela sessão quando o login muda (e-mail, ou null ao sair). */
export function ligarAcesso(email: string | null) {
  if (!email) { chaveAtual = ""; estado = { carregando: false, acesso: null, tolerado: false }; publicar(); return; }
  const chave = email.trim().toLowerCase();
  chaveAtual = chave;
  estado = { carregando: true, acesso: null, tolerado: false };
  publicar();
  void lerAcesso(chave);
}

async function lerAcesso(chave: string) {
  let documento: Record<string, unknown> | undefined;
  let recusado = false;
  try {
    documento = await Banco.carregarDocumento("usuarios", chave);
  } catch {
    recusado = true; // regras novas e conta sem linha: o banco não deixa nem ler o próprio documento
  }
  // Sem documento: a tolerância só vale enquanto a lista não tem nenhuma master ativa (a janela da transição).
  const janelaAberta = !documento && !recusado && TOLERANCIA_SEM_DOCUMENTO && await semMasterNaLista();
  if (chave !== chaveAtual) return; // o login mudou no meio da leitura
  if (documento) estado = { carregando: false, acesso: documento as unknown as Acesso, tolerado: false };
  else if (janelaAberta) estado = { carregando: false, acesso: { email: chave, nome: "", ativo: true, master: false, modulos: [...MODULOS_CENTRAL] }, tolerado: true };
  else estado = { carregando: false, acesso: null, tolerado: false };
  publicar();
}

/** A lista de contas ainda não tem nenhuma master ativa? Com as regras novas, conta sem linha nem lê a lista: não. */
async function semMasterNaLista(): Promise<boolean> {
  try {
    const contas = await Banco.carregarColecao("usuarios");
    return !Object.values(contas).some((c) => c.master === true && c.ativo !== false);
  } catch {
    return false;
  }
}

export function usarAcesso(): EstadoAcesso {
  return useSyncExternalStore(
    (cb) => { assinantes.add(cb); return () => assinantes.delete(cb); },
    () => estado,
  );
}

export const acessoAtual = (): EstadoAcesso => estado;

/** A conta abre este módulo? Master abre tudo; conta tolerada (transição) também. */
export function temModulo(modulo: string): boolean {
  const a = estado.acesso;
  if (!a || !a.ativo) return false;
  if (a.master || estado.tolerado) return true;
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
  if (colecao === "presets") return estado.tolerado || a.modulos.length > 0;
  if (colecao === "lixeira" || colecao === "log_alteracoes") return estado.tolerado || a.modulos.length > 0;
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
