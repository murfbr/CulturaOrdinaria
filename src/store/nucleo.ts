/* Estado do Núcleo do Coletivo: as contas (`usuarios`, a marca master e a
   lista de módulos de cada uma) e as anotações (`nucleo`). Só liga quando a
   conta tem o módulo Núcleo ou é master: sem permissão, a escuta seria
   recusada e o Banco ficaria religando. Grava direto pelo Banco, porque não
   são coleções do Painel: sem lixeira (apagar anotação é direto), sem log,
   sem cópia local do navegador (ver banco.ts). */
import { useSyncExternalStore } from "react";
import { Banco } from "../services/banco";
import { emailSessao } from "../services/sessao";
import { uid } from "../utils";
import type { Anotacao, ContaUsuario } from "../types";

type Documento = Record<string, unknown> & { id: string };

interface EstadoNucleo { contas: ContaUsuario[]; anotacoes: Anotacao[] }

let estado: EstadoNucleo = { contas: [], anotacoes: [] };
let ligado = false;
const assinantes = new Set<() => void>();
const publicar = () => assinantes.forEach((f) => f());

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
    const anotacoes = Object.values(mapa).map((d) => d as unknown as Anotacao);
    estado = { ...estado, anotacoes: anotacoes.sort((a, b) => (b.criadoEm || "").localeCompare(a.criadoEm || "")) };
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
  Banco.gravar("usuarios", id, { ...conta, id, email: id, atualizado: new Date().toISOString() } as unknown as Documento, true);
}

export function anotar(texto: string) {
  const agora = new Date().toISOString();
  const a: Anotacao = { id: uid("n"), texto, quem: emailSessao(), criadoEm: agora, atualizado: agora };
  Banco.gravar("nucleo", a.id, a as unknown as Documento, true);
}

export function editarAnotacao(a: Anotacao, texto: string) {
  const agora = new Date().toISOString();
  Banco.gravar("nucleo", a.id, { ...a, texto, editadoEm: agora, atualizado: agora } as unknown as Documento, true);
}

/** Apaga de vez (o Núcleo não passa pela lixeira comum). */
export const apagarAnotacao = (id: string) => { void Banco.apagar("nucleo", id); };
