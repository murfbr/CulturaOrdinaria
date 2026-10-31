/* Contas do Mailing, todas no navegador: junta as partes de cada evento, monta
   as pessoas (uma por e-mail, com os eventos em que esteve) e responde as três
   perguntas do doc 12: quem volta, de onde veio (UTM) e quem retirou e não
   fez check-in. Funções puras, testadas sem o site. */
import {
  EVENTOS_SYMPLA, type DescadastroMailing, type EventoMailing, type EventoSympla, type ParticipanteMailing, type TotaisEventoMailing,
} from "../../../types";
import { temUtm } from "./listaSympla";

/** Um evento com as partes juntas. */
export interface EventoCompleto {
  symplaId: string;
  titulo: string;
  data: string;
  local: string;
  organizador: string;
  plano: string;
  ciclo: string;
  totais: TotaisEventoMailing;
  arquivo: string;
  descartadas: number;
  importadoEm: string;
  importadoPor: string;
  participantes: ParticipanteMailing[];
  /** Faltam partes no banco (gravação no meio, ou apagada pela metade). */
  incompleto: boolean;
}

/** Documentos do banco → eventos, em ordem de data. */
export function juntarEventos(docs: EventoMailing[]): EventoCompleto[] {
  const porEvento = new Map<string, EventoMailing[]>();
  for (const d of docs) {
    if (!d?.symplaId) continue;
    porEvento.set(d.symplaId, [...(porEvento.get(d.symplaId) || []), d]);
  }
  const saida: EventoCompleto[] = [];
  for (const [symplaId, partes] of porEvento) {
    // Uma importação nova pode conviver um instante com partes da anterior: vale a mais recente.
    const recente = partes.reduce((a, b) => (String(b.importadoEm) > String(a.importadoEm) ? b : a));
    const daVez = partes.filter((p) => p.importadoEm === recente.importadoEm).sort((a, b) => a.parte - b.parte);
    saida.push({
      symplaId, titulo: recente.titulo, data: recente.data, local: recente.local || "", organizador: recente.organizador || "",
      plano: recente.plano || "", ciclo: recente.ciclo || "", totais: recente.totais, arquivo: recente.arquivo || "",
      descartadas: recente.descartadas || 0, importadoEm: recente.importadoEm, importadoPor: recente.importadoPor || "",
      participantes: daVez.flatMap((p) => p.participantes || []),
      incompleto: daVez.length < (recente.partes || 1),
    });
  }
  return saida.sort((a, b) => a.data.localeCompare(b.data) || a.titulo.localeCompare(b.titulo));
}

/** Participação de uma pessoa num evento. */
export interface Participacao {
  symplaId: string;
  data: string;
  titulo: string;
  plano: string;
  ingressos: number;
  checkin: boolean;
  /** utm_content (ou utm_source) de algum ingresso dela neste evento. */
  origem: string;
}

export interface Pessoa {
  email: string;
  nome: string;
  eventos: Participacao[];
  checkins: number;
  primeiro: string;
  ultimo: string;
  descadastrado: boolean;
}

const origemDe = (p: ParticipanteMailing) =>
  [p.utmMedium, p.utmContent || p.utmSource].filter(Boolean).join(" · ");

/** Uma pessoa por e-mail, com os eventos em ordem de data. */
export function pessoasDe(eventos: EventoCompleto[], descadastros: DescadastroMailing[]): Pessoa[] {
  const fora = new Set(descadastros.map((d) => d.email.toLowerCase()));
  const mapa = new Map<string, Pessoa>();
  for (const ev of eventos) {
    const porEmail = new Map<string, ParticipanteMailing[]>();
    for (const p of ev.participantes) porEmail.set(p.email, [...(porEmail.get(p.email) || []), p]);
    for (const [email, linhas] of porEmail) {
      let pessoa = mapa.get(email);
      if (!pessoa) {
        pessoa = { email, nome: "", eventos: [], checkins: 0, primeiro: ev.data, ultimo: ev.data, descadastrado: fora.has(email) };
        mapa.set(email, pessoa);
      }
      const nome = linhas.find((l) => l.nome)?.nome || "";
      if (nome) pessoa.nome = nome; // fica o do evento mais recente
      const checkin = linhas.some((l) => l.checkin);
      pessoa.eventos.push({
        symplaId: ev.symplaId, data: ev.data, titulo: ev.titulo, plano: ev.plano, ingressos: linhas.length, checkin,
        origem: origemDe(linhas.find(temUtm) || ({} as ParticipanteMailing)),
      });
      if (checkin) pessoa.checkins++;
      pessoa.ultimo = ev.data;
    }
  }
  return [...mapa.values()];
}

/** Quantas pessoas estiveram em 1, 2, 3 e 4 ou mais eventos. */
export function distribuicaoRetorno(pessoas: Pessoa[]): { rotulo: string; n: number }[] {
  const n = [0, 0, 0, 0];
  for (const p of pessoas) n[Math.min(p.eventos.length, 4) - 1]++;
  return [{ rotulo: "1 evento", n: n[0] }, { rotulo: "2 eventos", n: n[1] }, { rotulo: "3 eventos", n: n[2] }, { rotulo: "4 ou mais", n: n[3] }];
}

export interface FatiaContagem { rotulo: string; ingressos: number; emails: number }

/** Agrupa os ingressos de um evento por uma chave (tipo, origem), do maior pro menor. */
export function agrupar(participantes: ParticipanteMailing[], chave: (p: ParticipanteMailing) => string): FatiaContagem[] {
  const mapa = new Map<string, { ingressos: number; emails: Set<string> }>();
  for (const p of participantes) {
    const k = chave(p);
    const g = mapa.get(k) || { ingressos: 0, emails: new Set<string>() };
    g.ingressos++;
    g.emails.add(p.email);
    mapa.set(k, g);
  }
  return [...mapa.entries()].map(([rotulo, g]) => ({ rotulo, ingressos: g.ingressos, emails: g.emails.size }))
    .sort((a, b) => b.ingressos - a.ingressos || a.rotulo.localeCompare(b.rotulo));
}

/** Rótulo de origem de um ingresso: "instagram / agenda / rionoforro", ou "sem UTM". */
export const rotuloOrigem = (p: ParticipanteMailing) =>
  temUtm(p) ? [p.utmSource || "?", p.utmMedium || "?", p.utmContent || p.utmCampaign || ""].filter(Boolean).join(" / ") : "sem UTM";

export interface LinhaEvento {
  evento: EventoCompleto;
  emails: number;
  /** E-mails que já tinham vindo a algum evento anterior (importado). */
  jaVieram: number;
  /** E-mails que voltaram em algum evento posterior (importado). */
  voltaramDepois: number;
  /** Ingressos sem check-in, quando o evento teve check-in na porta. */
  semCheckin: number | null;
}

/** Uma linha por evento, com retorno pra trás e pra frente. */
export function linhasDeEvento(eventos: EventoCompleto[]): LinhaEvento[] {
  const vistos = new Set<string>();
  const antes: Set<string>[] = [];
  for (const ev of eventos) {
    antes.push(new Set(vistos));
    for (const p of ev.participantes) vistos.add(p.email);
  }
  const depois: Set<string>[] = new Array(eventos.length);
  const futuros = new Set<string>();
  for (let i = eventos.length - 1; i >= 0; i--) {
    depois[i] = new Set(futuros);
    for (const p of eventos[i].participantes) futuros.add(p.email);
  }
  return eventos.map((evento, i) => {
    const emails = new Set(evento.participantes.map((p) => p.email));
    let jaVieram = 0, voltaramDepois = 0;
    for (const e of emails) {
      if (antes[i].has(e)) jaVieram++;
      if (depois[i].has(e)) voltaramDepois++;
    }
    const teveCheckin = evento.participantes.some((p) => p.checkin);
    return {
      evento, emails: emails.size, jaVieram, voltaramDepois,
      semCheckin: teveCheckin ? evento.participantes.filter((p) => !p.checkin).length : null,
    };
  });
}

/** Ingressos e e-mails por utm_content (minúsculo), num evento ou em todos. Alimenta os Divulgadores. */
export function retiradasPorConteudo(eventos: EventoCompleto[], symplaId?: string): Map<string, { ingressos: number; emails: number }> {
  const mapa = new Map<string, { ingressos: number; emails: Set<string> }>();
  for (const ev of eventos) {
    if (symplaId && ev.symplaId !== symplaId) continue;
    for (const p of ev.participantes) {
      const k = (p.utmContent || "").trim().toLowerCase();
      if (!k) continue;
      const g = mapa.get(k) || { ingressos: 0, emails: new Set<string>() };
      g.ingressos++;
      g.emails.add(p.email);
      mapa.set(k, g);
    }
  }
  return new Map([...mapa.entries()].map(([k, g]) => [k, { ingressos: g.ingressos, emails: g.emails.size }]));
}

/** Os eventos do catálogo e os importados fora dele, juntos, em ordem de data (pra lista do que falta importar). */
export function catalogoComImportados(eventos: EventoCompleto[]): (EventoSympla & { importado?: EventoCompleto })[] {
  const porId = new Map(eventos.map((e) => [e.symplaId, e]));
  const lista: (EventoSympla & { importado?: EventoCompleto })[] = EVENTOS_SYMPLA.map((c) => ({ ...c, importado: porId.get(c.symplaId) }));
  for (const e of eventos) {
    if (!EVENTOS_SYMPLA.some((c) => c.symplaId === e.symplaId)) {
      lista.push({ symplaId: e.symplaId, titulo: e.titulo, data: e.data, local: e.local, organizador: e.organizador,
        plano: e.plano, ciclo: e.ciclo, retiradas: null, importado: e });
    }
  }
  return lista.sort((a, b) => a.data.localeCompare(b.data));
}

/** Pessoas → CSV (e-mail, nome, eventos), sem descadastrados. */
export function linhasCsvPessoas(pessoas: Pessoa[]): (string | number)[][] {
  return [
    ["email", "nome", "eventos", "ultimo_evento", "checkins"],
    ...pessoas.filter((p) => !p.descadastrado).map((p) => [p.email, p.nome, p.eventos.length, p.ultimo, p.checkins]),
  ];
}
