/* Estado dos Divulgadores e do Mailing (Comunicação, desde 31/10/2026).

   Divulgadores: coleção pequena, lida inteira quando a aba abre, como a
   Biblioteca. Grava o módulo Comunicação.

   Mailing: a lista nominal do Sympla. Só liga para quem tem o módulo
   "mailing" (ou master), e só enquanto a aba Mailing (ou a contagem de
   retiradas dos Divulgadores) está aberta: ao fechar, as escutas param e os
   documentos saem da memória do site. Nunca entra no espelho local (banco.ts,
   SEM_ESPELHO_NA_NUVEM) nem no log de alterações; o cache do Firestore no
   navegador se apaga no logout. Cada abertura, importação, exportação,
   exclusão e descadastro deixa uma linha no registro (`mailingRegistro`), que
   as regras só deixam acrescentar, com o e-mail de quem está logado. */
import { useSyncExternalStore } from "react";
import { toast } from "../components/Toast";
import { Banco } from "../services/banco";
import { podeGravar, temModulo } from "../services/acesso";
import { emailSessao } from "../services/sessao";
import { hash6 } from "../pages/comunicacao/biblioteca/converterEspelho";
import {
  MODULO_MAILING, PARTICIPANTES_POR_PARTE,
  type AcaoRegistroMailing, type DescadastroMailing, type Divulgador, type EventoMailing, type ParticipanteMailing,
  type RegistroMailing, type TotaisEventoMailing,
} from "../types";

export interface EstadoDivulgacao {
  divulgadores: Record<string, Divulgador>;
  divulgadoresProntos: boolean;
  divulgadoresSemAcesso: boolean;
  /** Documentos de evento do Mailing (cada parte é um documento). */
  eventos: Record<string, EventoMailing>;
  descadastros: Record<string, DescadastroMailing>;
  registro: Record<string, RegistroMailing>;
  mailingPronto: boolean;
  mailingSemAcesso: boolean;
}

const VAZIO: EstadoDivulgacao = {
  divulgadores: {}, divulgadoresProntos: false, divulgadoresSemAcesso: false,
  eventos: {}, descadastros: {}, registro: {}, mailingPronto: false, mailingSemAcesso: false,
};
let estado: EstadoDivulgacao = { ...VAZIO };
const assinantes = new Set<() => void>();
function publicar() {
  estado = { ...estado };
  assinantes.forEach((f) => f());
}
export const obterDivulgacao = () => estado;
export function usarDivulgacao(): EstadoDivulgacao {
  return useSyncExternalStore(
    (cb) => { assinantes.add(cb); return () => assinantes.delete(cb); },
    obterDivulgacao,
  );
}

const agora = () => new Date().toISOString();
const quem = () => (emailSessao() || "").trim().toLowerCase();

/* ══════════ Divulgadores ══════════ */

let escutaDivulgadores: (() => void) | null = null;
let escutaStatus: (() => void) | null = null;

function ligarStatus() {
  if (escutaStatus) return;
  escutaStatus = Banco.aoMudarStatus((s) => {
    if (/^sem acesso a divulgadores\b/.test(s.texto) && !estado.divulgadoresSemAcesso) { estado.divulgadoresSemAcesso = true; publicar(); }
    if (/^sem acesso a mailing/.test(s.texto) && !estado.mailingSemAcesso) { estado.mailingSemAcesso = true; publicar(); }
  });
}

/** Liga a coleção dos divulgadores. Idempotente; a aba chama ao abrir. */
export function iniciarDivulgadores() {
  ligarStatus();
  if (escutaDivulgadores) return;
  escutaDivulgadores = Banco.assinar("divulgadores", (mapa, confirmado) => {
    estado.divulgadores = { ...mapa } as unknown as Record<string, Divulgador>; // cópia: o Banco muda o mesmo mapa no lugar
    if (confirmado || Object.keys(mapa).length) estado.divulgadoresProntos = true;
    publicar();
  });
}

/** Id do divulgador pelo usuário do Instagram: o mesmo perfil nunca entra duas vezes. */
export const idDivulgador = (instagram: string) => "dv-" + hash6("divulgador|" + limparArroba(instagram));
export const limparArroba = (s: string) =>
  s.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/[/?#].*$/, "").toLowerCase();

export function salvarDivulgador(d: Divulgador): boolean {
  if (!podeGravar("divulgadores", d.id)) { toast("Sem acesso para gravar: sua conta não tem o módulo Comunicação."); return false; }
  Banco.gravar("divulgadores", d.id, { ...d, atualizado: agora() } as unknown as Record<string, unknown> & { id: string }, true);
  return true;
}

export function excluirDivulgador(id: string) {
  void Banco.apagar("divulgadores", id);
}

/* ══════════ Mailing ══════════ */

let escutasMailing: (() => void)[] = [];
/** Motivos de abertura já registrados nesta visita (uma linha "abriu" por motivo, não uma por clique). */
const abriuNestaVisita = new Set<string>();

export const temMailing = () => temModulo(MODULO_MAILING);

/** Liga as três coleções do Mailing (só com o módulo). `motivo` vai pro registro de acesso. */
export function iniciarMailing(motivo = "aba Mailing") {
  ligarStatus();
  if (!temMailing() || escutasMailing.length) return;
  // Pronto só com as três confirmadas pelo servidor: sem os descadastros, uma exportação levaria quem pediu pra sair.
  const confirmadas = new Set<string>();
  const pronto = (colecao: string, confirmado: boolean) => {
    if (confirmado) confirmadas.add(colecao);
    if (confirmadas.size >= 3) estado.mailingPronto = true;
  };
  escutasMailing.push(Banco.assinar("mailingEventos", (mapa, confirmado) => {
    estado.eventos = { ...mapa } as unknown as Record<string, EventoMailing>;
    pronto("mailingEventos", confirmado);
    publicar();
  }));
  escutasMailing.push(Banco.assinar("mailingDescadastros", (mapa, confirmado) => {
    estado.descadastros = { ...mapa } as unknown as Record<string, DescadastroMailing>;
    pronto("mailingDescadastros", confirmado);
    publicar();
  }));
  escutasMailing.push(Banco.assinar("mailingRegistro", (mapa, confirmado) => {
    estado.registro = { ...mapa } as unknown as Record<string, RegistroMailing>;
    pronto("mailingRegistro", confirmado);
    publicar();
  }));
  if (!abriuNestaVisita.has(motivo)) {
    abriuNestaVisita.add(motivo);
    registrarMailing("abriu", motivo);
  }
}

/** Desliga o Mailing e tira a lista da memória do site. */
export function pararMailing() {
  escutasMailing.forEach((parar) => parar());
  escutasMailing = [];
  for (const c of ["mailingEventos", "mailingDescadastros", "mailingRegistro"]) Banco.esquecer(c);
  estado.eventos = {};
  estado.descadastros = {};
  estado.registro = {};
  estado.mailingPronto = false;
  publicar();
}

/** Uma linha no registro de acesso. Nunca lança; sem módulo, não faz nada. */
export function registrarMailing(acao: AcaoRegistroMailing, detalhe: string) {
  if (!temMailing()) return;
  const quando = agora();
  const id = "mr-" + quando.replace(/[-:.TZ]/g, "") + "-" + Math.random().toString(36).slice(2, 6);
  const linha: RegistroMailing = { id, quem: quem() || "modo local", quando, acao, detalhe };
  void Banco.acrescentar("mailingRegistro", id, linha as unknown as Record<string, unknown> & { id: string });
}

/** Id do documento de um evento: a parte 1 é me-<id do Sympla>; as outras, me-<id>-<n>. */
export const idEventoMailing = (symplaId: string, parte = 1) =>
  "me-" + symplaId.replace(/[^0-9a-zA-Z]/g, "") + (parte > 1 ? "-" + parte : "");

/** Divide as linhas em partes que cabem num documento (até PARTICIPANTES_POR_PARTE linhas e ~700 KB). */
export function dividirEmPartes(participantes: ParticipanteMailing[], limiteLinhas = PARTICIPANTES_POR_PARTE, limiteBytes = 700_000): ParticipanteMailing[][] {
  const partes: ParticipanteMailing[][] = [];
  let atual: ParticipanteMailing[] = [];
  let bytes = 0;
  for (const p of participantes) {
    const tamanho = JSON.stringify(p).length + 40; // + nomes de campo e o que o Firestore guarda por item
    if (atual.length && (atual.length >= limiteLinhas || bytes + tamanho > limiteBytes)) {
      partes.push(atual);
      atual = [];
      bytes = 0;
    }
    atual.push(p);
    bytes += tamanho;
  }
  if (atual.length || !partes.length) partes.push(atual);
  return partes;
}

export interface MetaEventoMailing {
  symplaId: string; titulo: string; data: string; local: string; organizador: string; plano: string; ciclo: string;
}

/** Grava (ou regrava) a lista de um evento, em partes; apaga partes que sobrarem de uma importação anterior maior. */
export function gravarEventoMailing(meta: MetaEventoMailing, participantes: ParticipanteMailing[], totais: TotaisEventoMailing,
  arquivo: string, descartadas: number): number {
  if (!podeGravar("mailingEventos", idEventoMailing(meta.symplaId))) {
    toast("Sem acesso para gravar no Mailing: sua conta não tem o módulo Mailing.");
    return 0;
  }
  const partes = dividirEmPartes(participantes);
  const anteriores = Object.values(estado.eventos).filter((e) => e.symplaId === meta.symplaId);
  const base = { ...meta, totais, arquivo, descartadas, importadoEm: agora(), importadoPor: quem() || "modo local", partes: partes.length };
  partes.forEach((lista, i) => {
    const id = idEventoMailing(meta.symplaId, i + 1);
    const documento: EventoMailing = { ...base, id, parte: i + 1, participantes: lista, atualizado: agora() };
    Banco.gravar("mailingEventos", id, documento as unknown as Record<string, unknown> & { id: string }, true);
  });
  for (const velho of anteriores) if (velho.parte > partes.length) void Banco.apagar("mailingEventos", velho.id);
  registrarMailing("importou", meta.titulo + " (" + meta.data + ", Sympla " + meta.symplaId + "): " + totais.ingressos + " ingressos, "
    + totais.emails + " e-mails" + (descartadas ? ", " + descartadas + " linha(s) sem e-mail fora" : "") + " · arquivo " + arquivo);
  return partes.length;
}

export function apagarEventoMailing(symplaId: string, titulo: string) {
  const docs = Object.values(estado.eventos).filter((e) => e.symplaId === symplaId);
  docs.forEach((d) => { void Banco.apagar("mailingEventos", d.id); });
  registrarMailing("apagou", titulo + " (Sympla " + symplaId + "), " + docs.length + " documento(s)");
}

export const idDescadastro = (email: string) => "md-" + hash6("descadastro|" + email.trim().toLowerCase());

export function descadastrar(email: string, motivo: string): boolean {
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { toast("E-mail inválido."); return false; }
  const id = idDescadastro(e);
  if (!podeGravar("mailingDescadastros", id)) { toast("Sem acesso: sua conta não tem o módulo Mailing."); return false; }
  const d: DescadastroMailing = { id, email: e, data: agora().slice(0, 10), motivo: motivo.trim(), quem: quem() || "modo local" };
  Banco.gravar("mailingDescadastros", id, d as unknown as Record<string, unknown> & { id: string }, true);
  registrarMailing("descadastrou", "1 e-mail" + (motivo.trim() ? " (" + motivo.trim() + ")" : ""));
  return true;
}

export function recadastrar(id: string) {
  void Banco.apagar("mailingDescadastros", id);
  registrarMailing("recadastrou", "1 e-mail");
}

/** Desliga tudo (logout). */
export function pararDivulgacao() {
  escutaDivulgadores?.();
  escutaDivulgadores = null;
  escutaStatus?.();
  escutaStatus = null;
  pararMailing();
  abriuNestaVisita.clear();
  estado = { ...VAZIO };
  publicar();
}
