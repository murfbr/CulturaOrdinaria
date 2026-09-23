/* Impacto de excluir um registro do Painel: o que está ligado a ele e a
   exclusão em duas formas — LEVANDO os vínculos junto (apaga o que depende
   dele) ou DESVINCULANDO (mantém os registros, só limpando a ligação).
   O rascunho de um projeto vai sempre junto com ele (é o formulário do
   projeto); os docs do Contexto apontam pelo mesmo id e ficam como estão. */
import { obterEstado } from "./central";
import { excluirRegistro, salvarRegistro } from "./mutacoes";
import { ENTIDADES, type ChaveEntidade } from "../forms/especificacoes";
import type { Projeto, Tarefa } from "../types";

export type DestinoVinculos = "junto" | "desvincular";

export interface ImpactoExclusao {
  /** O que está ligado — some no "levar junto", fica solto no "desvincular". */
  vinculos: string[];
  /** Avisos informativos (o que acontece de qualquer jeito). */
  notas: string[];
  /** Executa a exclusão com o destino escolhido para os vínculos. */
  excluir: (destino: DestinoVinculos) => void;
}

const n = (qtd: number, singular: string, plural: string) =>
  qtd + " " + (qtd === 1 ? singular : plural);

const tarefasDe = (origem: string): Tarefa[] =>
  obterEstado().painel.tarefas.filter((t) => t.origem === origem);


const desvincularTarefas = (origem: string) =>
  tarefasDe(origem).forEach((t) => salvarRegistro("tarefas", { ...t, origem: "" }));

const excluirTarefas = (origem: string) =>
  tarefasDe(origem).forEach((t) => excluirRegistro("tarefas", t.id));

/** Exclui um projeto; as tarefas ligadas vão junto ou ficam soltas. */
function excluirProjeto(p: Projeto, destino: DestinoVinculos) {
  if (destino === "desvincular") desvincularTarefas("proj:" + p.id);
  excluirRegistro("projetos", p.id); // leva as tarefas "proj:" que sobraram e o rascunho
}

/** Nota sobre docs do Contexto que apontam os ids (ficam como estão). */
function notaContexto(ids: string[]): string[] {
  const { fichas, regras, julgamentos } = obterEstado();
  const partes: string[] = [];
  const nF = ids.filter((id) => fichas[id]).length;
  const nR = Object.values(regras).filter((r) => ids.includes(r.escopo.id)).length;
  const nJ = Object.values(julgamentos).filter((j) => ids.includes(j.edital) || ids.includes(j.projeto)).length;
  if (nF) partes.push(n(nF, "ficha", "fichas"));
  if (nR) partes.push(n(nR, "regra", "regras"));
  if (nJ) partes.push(n(nJ, "julgamento", "julgamentos"));
  return partes.length
    ? ["No Contexto, " + partes.join(", ") + " apontam para o que será excluído — ficam registrados como estão."]
    : [];
}

/** Calcula o impacto de excluir um registro e devolve as formas de executar. */
export function impactoExclusao(chave: ChaveEntidade, id: string): ImpactoExclusao {
  const { painel } = obterEstado();

  if (chave === "artista") {
    const projetos = painel.projetos.filter((p) => (p.artistaIds || []).includes(id));
    // Levar junto só apaga projeto em que este é o único artista.
    const soDele = projetos.filter((p) => p.artistaIds.length === 1);
    const tarefas = soDele.flatMap((p) => tarefasDe("proj:" + p.id));
    const vinculos = [
      ...(soDele.length ? [n(soDele.length, "projeto só dele", "projetos só dele")] : []),
      ...(tarefas.length ? [n(tarefas.length, "tarefa ligada", "tarefas ligadas")] : []),
    ];
    const notas = projetos.length > soDele.length
      ? [n(projetos.length - soDele.length, "projeto com outros artistas só perde", "projetos com outros artistas só perdem") + " este nome da lista."]
      : [];
    return {
      vinculos,
      notas: [...notas, ...notaContexto([id, ...projetos.map((p) => p.id)])],
      excluir(destino) {
        for (const p of projetos) {
          if (destino === "junto" && p.artistaIds.length === 1) excluirProjeto(p, "junto");
          else salvarRegistro("projetos", { ...p, artistaIds: p.artistaIds.filter((x) => x !== id) });
        }
        excluirRegistro("artistas", id);
      },
    };
  }

  if (chave === "projeto") {
    const p = painel.projetos.find((x) => x.id === id);
    const tarefas = tarefasDe("proj:" + id);
    const temRascunho = Boolean(p?.rascunhoId && obterEstado().rascunhos[p.rascunhoId]);
    return {
      vinculos: tarefas.length ? [n(tarefas.length, "tarefa ligada", "tarefas ligadas")] : [],
      notas: [
        ...(temRascunho ? ["As respostas do formulário vão junto para a lixeira (dá para restaurar em 30 dias)."] : []),
        ...notaContexto([id]),
      ],
      excluir(destino) { if (p) excluirProjeto(p, destino); },
    };
  }

  if (chave === "edital") {
    const projetos = painel.projetos.filter((p) => p.editalId === id);
    const tarefas = [...tarefasDe("edital:" + id), ...projetos.flatMap((p) => tarefasDe("proj:" + p.id))];
    const vinculos = [
      ...(projetos.length ? [n(projetos.length, "projeto neste edital", "projetos neste edital")] : []),
      ...(tarefas.length ? [n(tarefas.length, "tarefa ligada", "tarefas ligadas")] : []),
    ];
    return {
      vinculos,
      notas: notaContexto([id]),
      excluir(destino) {
        if (destino === "junto") {
          projetos.forEach((p) => excluirProjeto(p, "junto"));
          excluirTarefas("edital:" + id);
        } else {
          projetos.forEach((p) => salvarRegistro("projetos", { ...p, editalId: "" }));
          desvincularTarefas("edital:" + id);
        }
        excluirRegistro("editais", id);
      },
    };
  }

  if (chave === "reuniao") {
    const tarefas = tarefasDe("reuniao:" + id);
    return {
      vinculos: tarefas.length ? [n(tarefas.length, "encaminhamento (tarefa)", "encaminhamentos (tarefas)")] : [],
      notas: [],
      excluir(destino) {
        if (destino === "junto") excluirTarefas("reuniao:" + id);
        else desvincularTarefas("reuniao:" + id);
        excluirRegistro("reunioes", id);
      },
    };
  }

  if (chave === "equipe") {
    const tarefas = painel.tarefas.filter((t) => t.respId === id);
    const projetos = painel.projetos.filter((p) => p.respId === id || (p.equipeIds || []).includes(id));
    const reunioes = painel.reunioes.filter((r) => (r.participanteIds || []).includes(id));
    const notas: string[] = [];
    if (tarefas.length) notas.push(n(tarefas.length, "tarefa fica", "tarefas ficam") + " sem responsável.");
    if (projetos.length) notas.push("Sai de " + n(projetos.length, "projeto", "projetos") + " (responsável ou equipe).");
    if (reunioes.length) notas.push("Sai de " + n(reunioes.length, "reunião", "reuniões") + ".");
    return {
      vinculos: [],
      notas,
      excluir() {
        tarefas.forEach((t) => salvarRegistro("tarefas", { ...t, respId: "" }));
        projetos.forEach((p) => salvarRegistro("projetos", {
          ...p, respId: p.respId === id ? "" : p.respId, equipeIds: (p.equipeIds || []).filter((x) => x !== id),
        }));
        reunioes.forEach((r) => salvarRegistro("reunioes", {
          ...r, participanteIds: (r.participanteIds || []).filter((p) => p !== id),
        }));
        excluirRegistro("equipe", id);
      },
    };
  }

  // Tarefa, elenco e contato: nada aponta para eles.
  return { vinculos: [], notas: [], excluir: () => excluirRegistro(ENTIDADES[chave].colecao, id) };
}
