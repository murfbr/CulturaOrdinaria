/* Estado do Núcleo do Coletivo: as contas (`usuarios`, a marca master e a
   lista de módulos de cada uma), as anotações e o caderno Melhorias da
   Central (anotações e tarefas de melhoria; tudo na coleção `nucleo`,
   separado pelo campo `tipo`). Só
   liga quando a conta tem o módulo Núcleo ou é master: sem permissão, a
   escuta seria recusada. Grava direto pelo Banco, porque não são coleções do
   Painel: sem lixeira (apagar é direto), sem log, sem cópia local do
   navegador (ver banco.ts). */
import { useSyncExternalStore } from "react";
import { Banco } from "../services/banco";
import { emailSessao } from "../services/sessao";
import { uid } from "../utils";
import { SECOES_ANTIGAS, type Anotacao, type ContaUsuario, type NotaCaderno, type SecaoCaderno, type TarefaCaderno } from "../types";

type Documento = Record<string, unknown> & { id: string };

export interface Caderno { notas: NotaCaderno[]; tarefas: TarefaCaderno[] }
interface EstadoNucleo { contas: ContaUsuario[]; anotacoes: Anotacao[]; caderno: Caderno }

let estado: EstadoNucleo = { contas: [], anotacoes: [], caderno: { notas: [], tarefas: [] } };
let ligado = false;
const assinantes = new Set<() => void>();
const publicar = () => assinantes.forEach((f) => f());
const agora = () => new Date().toISOString();
const maisNova = (a: string, b: string) => (b || "").localeCompare(a || "");

/** Liga as escutas (idempotente). Chamar só de dentro do ambiente Núcleo. */
export function iniciarNucleo() {
  if (ligado) return;
  ligado = true;
  Banco.assinar("usuarios", (mapa) => {
    const contas = Object.values(mapa).map((d) => d as unknown as ContaUsuario);
    estado = { ...estado, contas: contas.sort((a, b) => a.email.localeCompare(b.email)) };
    publicar();
  });
  Banco.assinar("nucleo", (mapa) => {
    const docs = Object.values(mapa) as Documento[];
    const tipo = (d: Documento) => (d.tipo as string | undefined) || "anotacao";
    const anotacoes = docs.filter((d) => tipo(d) === "anotacao").map((d) => d as unknown as Anotacao);
    estado = {
      ...estado,
      anotacoes: anotacoes.sort((a, b) => maisNova(a.criadoEm, b.criadoEm)),
      caderno: {
        notas: docs.filter((d) => tipo(d) === "nota").map((d) => d as unknown as NotaCaderno).sort((a, b) => maisNova(a.criadoEm, b.criadoEm)),
        tarefas: docs.filter((d) => tipo(d) === "tarefa").map((d) => d as unknown as TarefaCaderno),
      },
    };
    publicar();
  });
}

export function usarNucleo(): EstadoNucleo {
  return useSyncExternalStore(
    (cb) => { assinantes.add(cb); return () => assinantes.delete(cb); },
    () => estado,
  );
}

/** O id do documento da conta: o e-mail em minúsculas, como as regras do banco leem. */
export const chaveDaConta = (email: string) => email.trim().toLowerCase();

/** Grava a conta inteira (novo ou alteração). Contas não se apagam: desativam. */
export function salvarConta(conta: ContaUsuario) {
  const id = chaveDaConta(conta.email);
  Banco.gravar("usuarios", id, { ...conta, id, email: id, atualizado: agora() } as unknown as Documento, true);
}

export function anotar(texto: string) {
  const a: Anotacao = { id: uid("n"), texto, quem: emailSessao(), criadoEm: agora(), atualizado: agora() };
  Banco.gravar("nucleo", a.id, a as unknown as Documento, true);
}

export function editarAnotacao(a: Anotacao, texto: string) {
  Banco.gravar("nucleo", a.id, { ...a, texto, editadoEm: agora(), atualizado: agora() } as unknown as Documento, true);
}

/** Apaga de vez (o Núcleo não passa pela lixeira comum). */
export const apagarAnotacao = (id: string) => { void Banco.apagar("nucleo", id); };

// ---- O caderno Melhorias da Central ----------------------------------------

const gravarNucleo = (d: Documento) => Banco.gravar("nucleo", d.id, d, true);

type NovaNota = Omit<NotaCaderno, "id" | "tipo" | "criadoEm" | "atualizado"> & { id?: string; criadoEm?: string };
type NovaTarefa = Omit<TarefaCaderno, "id" | "tipo" | "criadoEm" | "atualizado"> & { id?: string; criadoEm?: string };

export function salvarNotaCaderno(n: NovaNota) {
  const id = n.id || uid("cn");
  gravarNucleo({ ...n, id, tipo: "nota", criadoEm: n.criadoEm || agora(), atualizado: agora() });
}

export function salvarTarefaCaderno(t: NovaTarefa) {
  const id = t.id || uid("ct");
  gravarNucleo({ ...t, id, tipo: "tarefa", feitoEm: t.feitoEm || "", criadoEm: t.criadoEm || agora(), atualizado: agora() });
}

export function alternarFeitoCaderno(t: TarefaCaderno) {
  const feito = !t.feito;
  gravarNucleo({ ...t, feito, feitoEm: feito ? agora() : "", atualizado: agora() });
}

/** Apaga nota ou tarefa do caderno, de vez. */
export const apagarDoCaderno = (id: string) => { void Banco.apagar("nucleo", id); };

/** Item do JSON do artefato (seções antigas) → seção e aba de hoje. O que não tem mais tela (o nome da
    seção antiga, quando ela virou "sem aba", e a aba antiga) vai para a origem do item, para nada se perder. */
function traduzirSecao(r: Registro): Registro {
  const antiga = SECOES_ANTIGAS[String(r.secao || "")];
  if (!antiga) return r;
  const abaAntiga = String(r.aba || "");
  const rastro = [String(r.origem || ""), antiga.aba ? "" : antiga.nome, abaAntiga].filter(Boolean).join(" · ");
  return { ...r, secao: antiga.secao, aba: antiga.aba, origem: rastro };
}

type Registro = Record<string, unknown>;
interface JsonCaderno { notas?: Record<string, Registro>; tarefas?: Record<string, Registro> }

/** Lê o JSON exportado do artefato (ou desta própria aba) e grava os itens:
    um documento por anotação e por tarefa. A estrutura (seções, abas) é a
    do site: as 20 seções do artefato viram abas das três de hoje
    (`SECOES_ANTIGAS`); `config`, `paginas`, o plano da semana e as semanas
    do piloto ficam de fora. Registro com o mesmo id é regravado; os outros
    ficam. Devolve as contagens. */
export function importarCaderno(json: unknown): { notas: number; tarefas: number } {
  const j = (json || {}) as JsonCaderno;
  if (!j.notas && !j.tarefas) throw new Error("O arquivo não tem notas nem tarefas do caderno.");
  const semIndefinidos = (o: Registro): Documento => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Documento;
  const notas = Object.entries(j.notas || {});
  for (const [id, r] of notas) gravarNucleo(semIndefinidos({ ...traduzirSecao(r), id: String(r.id || id), tipo: "nota", atualizado: String(r.atualizado || agora()) }));
  const tarefas = Object.entries(j.tarefas || {});
  for (const [id, r] of tarefas) {
    gravarNucleo(semIndefinidos({ ...traduzirSecao(r), id: String(r.id || id), tipo: "tarefa", codigo: Boolean(r.codigo), feito: Boolean(r.feito), feitoEm: String(r.feitoEm || ""), atualizado: String(r.atualizado || agora()) }));
  }
  return { notas: notas.length, tarefas: tarefas.length };
}

/** O caderno no formato do artefato (config + listas id → registro), para baixar e reimportar. */
export function cadernoParaJson(c: Caderno, secoes: SecaoCaderno[]): Record<string, unknown> {
  const semTipo = (d: Record<string, unknown>) => { const { tipo: _tipo, ...resto } = d; return resto; };
  const porId = (xs: { id: string }[]) => Object.fromEntries(xs.map((x) => [x.id, semTipo(x as unknown as Record<string, unknown>)]));
  return {
    config: {
      nome: "Melhorias da Central",
      slug: "melhorias",
      listas: { secoes },
      parametros: { geradoEm: agora(), origem: "Central do Coletivo, aba Melhorias" },
    },
    notas: porId(c.notas),
    tarefas: porId(c.tarefas),
  };
}
