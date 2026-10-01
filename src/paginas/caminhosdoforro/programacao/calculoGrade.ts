/* Contas da grade, puras: horas em minutos (com a madrugada contando como o
   mesmo dia), faixas, duração, as opções de hora e duração, quem cabe em cada
   espaço, sobreposição no mesmo espaço, choque de agenda das pessoas e a
   análise de pendências de cada horário. */
import { nomeCadastro, temTipo } from "../calculo";
import { rotulo } from "../listas";
import type { Base, Horario } from "../tipos";

/** Grade de 15 em 15 minutos, das 06:00 às 05:45 do dia seguinte. */
export const PASSO = 15;
export const INICIO_DIA = 6 * 60;
export const FIM_DIA = 30 * 60;

/** Atividades que não precisam de ninguém escalado. */
export const SEM_PARTICIPANTE = ["transicao"];

/** "HH:MM" → minutos. Antes das 06:00 conta como madrugada do mesmo dia (sábado 00:30 vem depois de 23:30). */
export function minutos(hhmm: string | null | undefined): number | null {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return (h < 6 ? h + 24 : h) * 60 + m;
}

export type Faixa = [number, number];

export const faixa = (s: { inicio: string; fim: string }): Faixa | null => {
  const a = minutos(s.inicio), b = minutos(s.fim);
  return a == null || b == null ? null : [a, b];
};

export const textoFaixa = (s: { inicio: string; fim: string }) => (s.inicio || "--:--") + " às " + (s.fim || "--:--");

/** Minutos → "HH:MM" (volta ao relógio normal depois da meia-noite). */
export const doMinuto = (m: number) => {
  const x = ((m % 1440) + 1440) % 1440;
  return String(Math.floor(x / 60)).padStart(2, "0") + ":" + String(x % 60).padStart(2, "0");
};

/** 45 → "45 min"; 90 → "1h30"; 120 → "2h". */
export const textoDuracao = (m: number | null | undefined) => {
  if (m == null || isNaN(m) || m <= 0) return "—";
  const h = Math.floor(m / 60), r = m % 60;
  return h ? h + "h" + (r ? String(r).padStart(2, "0") : "") : r + " min";
};

export const duracao = (s: { inicio: string; fim: string }): number | null => {
  const f = faixa(s);
  return f && f[1] > f[0] ? f[1] - f[0] : null;
};

/** As horas da grade (mais a atual, se estiver fora do passo). */
export function opcoesHora(atual?: string): string[] {
  const v: string[] = [];
  for (let m = INICIO_DIA; m < FIM_DIA; m += PASSO) v.push(doMinuto(m));
  if (atual && !v.includes(atual) && minutos(atual) != null) v.push(atual);
  return v.sort((a, b) => (minutos(a) || 0) - (minutos(b) || 0));
}

/** Durações de 15 min a 6 h (mais a atual, se estiver fora do passo). */
export function opcoesDuracao(atual?: number | null): number[] {
  const v: number[] = [];
  for (let m = PASSO; m <= 6 * 60; m += PASSO) v.push(m);
  if (atual && !v.includes(atual)) v.push(atual);
  return v.sort((a, b) => a - b);
}

/** Duração sugerida por atividade: transição 15, DJ e baile 30, o resto 45. */
export const duracaoPadrao = (atividade: string) => (atividade === "transicao" ? 15 : atividade === "dj" || atividade === "baile" ? 30 : 45);

export const sobrepoe = (a: Faixa, b: Faixa) => a[0] < b[1] && b[0] < a[1];

export const nomeEspaco = (base: Base, id: string) => base.espacos[id]?.nome || (id ? "(espaço removido)" : "—");

/** Participantes que não são do tipo que o espaço recebe (espaço sem lista aceita qualquer um). */
export function foraDoEspaco(base: Base, s: Horario): string[] {
  const e = base.espacos[s.espaco];
  const aceita = e?.aceita?.length ? e.aceita : null;
  if (!aceita) return [];
  return (s.participantes || []).filter((id) => base.cadastro[id] && !aceita.some((t) => temTipo(base.cadastro[id], t)));
}

/** Cadastro cabe no espaço? (equipe nunca entra na grade). */
export function cabeNoEspaco(base: Base, espacoId: string, cadastroId: string): boolean {
  const e = base.espacos[espacoId];
  const aceita = e?.aceita?.length ? e.aceita : null;
  const d = base.cadastro[cadastroId];
  return !!d && (!aceita || aceita.some((t) => temTipo(d, t)));
}

/** Primeiro horário do mesmo dia e espaço que se sobrepõe ao intervalo (ignora o próprio). */
export function ocupado(base: Base, dia: string, espaco: string, fx: Faixa | null, ignorar?: string): Horario | null {
  if (!fx || !espaco) return null;
  for (const s of Object.values(base.slots)) {
    if (s.id === ignorar || s.dia !== dia || s.espaco !== espaco) continue;
    const g = faixa(s);
    if (g && sobrepoe(fx, g)) return s;
  }
  return null;
}

export const mensagemOcupado = (base: Base, s: Horario) =>
  nomeEspaco(base, s.espaco) + " já está ocupado das " + textoFaixa(s) + " (" + rotulo(base.pagina, "atividades", s.atividade) + ").";

/** Participantes do horário que já estão em outro horário no mesmo período (ignora o próprio). */
export function pessoasEmChoque(base: Base, d: Horario, fx: Faixa, ignorar?: string): string[] {
  const r = new Set<string>();
  for (const s of Object.values(base.slots)) {
    if (s.id === ignorar || s.dia !== d.dia) continue;
    const g = faixa(s);
    if (!g || !sobrepoe(fx, g)) continue;
    for (const p of s.participantes || []) if ((d.participantes || []).includes(p)) r.add(p);
  }
  return [...r];
}

export const nomes = (base: Base, ids: string[]) => ids.map((id) => nomeCadastro(base, id)).join(", ");

export type Pendencia = "horario" | "vazio" | "aguardando" | "fora" | "conflito";

export interface Analise {
  /** Por horário: com quem se sobrepõe no mesmo espaço e quem tem choque de agenda. */
  conflitos: Record<string, { espaco: string[]; pessoas: string[] }>;
  pendencias: Record<string, Pendencia[]>;
}

/** Olha a grade inteira: sobreposições no mesmo espaço, choques de agenda e as pendências de cada horário. */
export function analisarGrade(base: Base): Analise {
  const lista = Object.values(base.slots).map((s) => ({ s, f: faixa(s) }));
  const conflitos: Analise["conflitos"] = {};
  const marcar = (id: string, tipo: "espaco" | "pessoas", texto: string) => {
    const c = (conflitos[id] = conflitos[id] || { espaco: [], pessoas: [] });
    c[tipo].push(texto);
  };
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      const a = lista[i], b = lista[j];
      if (!a.f || !b.f || a.s.dia !== b.s.dia || !sobrepoe(a.f, b.f)) continue;
      if (a.s.espaco && a.s.espaco === b.s.espaco) { marcar(a.s.id, "espaco", textoFaixa(b.s)); marcar(b.s.id, "espaco", textoFaixa(a.s)); }
      for (const p of a.s.participantes || []) {
        if (!(b.s.participantes || []).includes(p)) continue;
        marcar(a.s.id, "pessoas", nomeCadastro(base, p) + ": " + nomeEspaco(base, b.s.espaco) + ", " + textoFaixa(b.s));
        marcar(b.s.id, "pessoas", nomeCadastro(base, p) + ": " + nomeEspaco(base, a.s.espaco) + ", " + textoFaixa(a.s));
      }
    }
  }
  const pendencias: Analise["pendencias"] = {};
  for (const { s, f } of lista) {
    const p: Pendencia[] = [];
    if (!f || f[1] <= f[0]) p.push("horario");
    if (!SEM_PARTICIPANTE.includes(s.atividade) && !(s.participantes || []).length) p.push("vazio");
    if ((s.participantes || []).some((x) => !base.cadastro[x] || base.cadastro[x].status !== "confirmado")) p.push("aguardando");
    if (foraDoEspaco(base, s).length) p.push("fora");
    if (conflitos[s.id]) p.push("conflito");
    pendencias[s.id] = p;
  }
  return { conflitos, pendencias };
}

/** Cor da bolinha de status de contato de um participante. */
const PONTO: Record<string, string> = { confirmado: "cdf:bg-conf", em_conversa: "cdf:bg-[#C9B400]", a_contatar: "cdf:bg-fraco", recusou: "cdf:bg-erro" };
export const classePonto = (status: string | undefined) => PONTO[status || ""] || "cdf:bg-fraco";
