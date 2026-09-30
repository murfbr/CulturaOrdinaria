/* Semente: converte o JSON do artefato "Ponta de Lança" (semente.json) nos
   documentos do banco. Roda uma vez, quando o banco confirma que a página
   não existe. Função pura: recebe o JSON e o que já existe em `equipe` e
   `contatos`, devolve o que gravar em cada coleção.

   Regras de conversão (sem criar lixo):
   - status de tarefa vira o da Central: afazer→fazer, andamento→and, feito→feito;
   - responsável só vira `respId` quando o nome bate exatamente com alguém da
     Equipe; senão fica em `obs` como veio;
   - fornecedores da lista viram contatos do tipo Fornecedor ("Equipe fixa" não
     é fornecedor e fica de fora); contato com o mesmo nome já cadastrado é
     reaproveitado;
   - a linha de custo só ganha `contatoId` quando o nome bate exatamente;
   - data da comunicação (dd/mm) vira ISO com o ano da edição. */
import { uid } from "../../utils";
import type { Contato, PessoaEquipe, PresetFesta, PresetPaginas, StatusTarefa, Tarefa } from "../../types";
import { PRESET_FESTA_PADRAO } from "../../types";
import type { Custo, Edicao, PaginaFesta, Peca } from "./tipos";

export const SLUG = "sambadeponta";
export const PROJETO_ID = "p7";
export const TIPO = "festa";

/** O bloco `pdl-state` do artefato, como está em semente.json. */
export interface ArtefatoJson {
  meta: PaginaFesta["meta"];
  label: {
    nome: string; sub: string; local: string; modelo: string;
    socios: PaginaFesta["socios"];
    fases: PresetFesta["fases"];
    checklist: { id: string; fase: string; tarefa: string; dono: string; origem: string }[];
    fornecedores: { nome: string; servico: string; contato: string; ultimo: string; obs: string }[];
    aprendizados: PaginaFesta["aprendizados"];
  };
  edicoes: (Omit<Edicao, "paginaId" | "comunicacao"> & {
    tarefas: { id: string; fase: string; tarefa: string; dono: string; prazo: string; origem: string; status: string }[];
    comunicacao: Peca[];
  })[];
}

export interface Semeadura {
  presetFesta: PresetFesta;
  presetPaginas: PresetPaginas;
  pagina: PaginaFesta;
  edicoes: Edicao[];
  tarefas: Tarefa[];
  /** Só os contatos novos (os que já existiam são reaproveitados pelo id). */
  contatos: Contato[];
}

const STATUS: Record<string, StatusTarefa> = { afazer: "fazer", andamento: "and", feito: "feito" };

/** "24/09" → "2026-09-24" com o ano da edição; o que não for dd/mm fica como está. */
function dataIso(texto: string, ano: string): string {
  const m = /^(\d{1,2})\/(\d{1,2})$/.exec((texto || "").trim());
  if (!m || !ano) return texto || "";
  return ano + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0");
}

export function converterArtefato(json: ArtefatoJson, existentes: { equipe: PessoaEquipe[]; contatos: Contato[] }, agora: string): Semeadura {
  const respPorNome = (dono: string) => existentes.equipe.find((p) => p.nome === (dono || "").trim())?.id || "";
  /** Nota para `obs` quando o responsável não está na Equipe. */
  const notaDono = (dono: string, respId: string) => (dono && !respId ? "responsável no artefato: " + dono : "");
  const juntar = (...partes: string[]) => partes.filter(Boolean).join(" · ");

  // Contatos: lista de fornecedores do artefato, sem "Equipe fixa"; nome já cadastrado é reaproveitado.
  const contatos: Contato[] = [];
  const contatoPorNome = new Map<string, string>(existentes.contatos.map((c) => [c.nome, c.id]));
  for (const f of json.label.fornecedores) {
    if (/^equipe fixa$/i.test(f.nome) || contatoPorNome.has(f.nome)) continue;
    const c: Contato = {
      id: uid("k"), nome: f.nome, tipo: "Fornecedor", ref: f.servico, contato: f.contato || "",
      obs: juntar(f.obs, f.ultimo ? "último preço no artefato: " + f.ultimo : ""),
    };
    contatos.push(c);
    contatoPorNome.set(c.nome, c.id);
  }

  const pagina: PaginaFesta = {
    id: SLUG, projetoId: PROJETO_ID, tipo: TIPO,
    meta: { ...json.meta, atualizadoEm: agora.slice(0, 10) },
    sub: json.label.sub, local: json.label.local, modelo: json.label.modelo,
    socios: json.label.socios,
    checklist: json.label.checklist.map((m) => {
      const respId = respPorNome(m.dono);
      return { id: m.id, fase: m.fase, tarefa: m.tarefa, respId, obs: juntar(m.origem, notaDono(m.dono, respId)) };
    }),
    aprendizados: json.label.aprendizados,
    atualizado: agora,
  };

  const tarefas: Tarefa[] = [];
  const edicoes: Edicao[] = json.edicoes.map((e) => {
    const ano = (e.data || "").slice(0, 4);
    e.tarefas.forEach((t) => {
      const respId = respPorNome(t.dono);
      tarefas.push({
        id: uid("t"), titulo: t.tarefa, respId, origem: "proj:" + PROJETO_ID, prazo: t.prazo || "",
        obs: juntar(t.origem, notaDono(t.dono, respId)), status: STATUS[t.status] || "fazer",
        edicaoId: e.id, fase: t.fase, atualizado: agora,
      });
    });
    const { tarefas: _tarefas, ...resto } = e;
    void _tarefas;
    return {
      ...resto,
      paginaId: SLUG,
      custos: e.custos.map((c): Custo => {
        const contatoId = contatoPorNome.get((c.fornecedor || "").trim());
        return contatoId ? { ...c, contatoId } : c;
      }),
      comunicacao: e.comunicacao.map((p) => ({ ...p, data: dataIso(p.data, ano) })),
      atualizado: agora,
    };
  });

  return {
    presetFesta: { ...PRESET_FESTA_PADRAO, fases: json.label.fases },
    presetPaginas: { id: "paginas", paginas: [{ slug: SLUG, projetoId: PROJETO_ID, tipo: TIPO, titulo: json.label.nome }] },
    pagina, edicoes, tarefas, contatos,
  };
}
