/* As frentes do núcleo de comunicação, que são as abas da página do núcleo:
   Redes, Design, Audiovisual e Contrapartidas. Cada tarefa e cada item de
   orçamento do núcleo cai numa frente pela frente do plano (ou pelo nome),
   para que cada aba mostre o que é seu. Nada aqui grava dado: é só a
   classificação do que já está nas abas Tarefas e Orçamento. */
import { normalizar } from "../listas";
import type { Base, ItemOrcamento, TarefaFestival } from "../tipos";

export type Frente = "redes" | "design" | "audiovisual" | "contrapartidas";

export const FRENTES: { id: Frente; nome: string; descricao: string }[] = [
  { id: "redes", nome: "Redes", descricao: "Instagram e as outras redes de quem está no festival, os canais do festival, imprensa, conteúdo e serviço ao público." },
  { id: "design", nome: "Design", descricao: "Identidade visual, apresentações, peças e materiais impressos." },
  { id: "audiovisual", nome: "Audiovisual", descricao: "Foto, vídeo e cobertura do festival, antes, durante e depois." },
  { id: "contrapartidas", nome: "Contrapartidas", descricao: "O que as cotas prometem em comunicação e o que cada patrocínio confirmado tem a receber." },
];

/** Palavras da frente do plano (ou do nome) que puxam a tarefa ou o item para cada aba; o resto é Redes. */
const MARCAS: [Frente, RegExp][] = [
  ["contrapartidas", /patrocin|contrapartida|aplica[cç][aã]o de marca|visibilidade/],
  ["audiovisual", /cobertura|foto|v[ií]deo|audiovisual|aftermovie/],
  ["design", /identidade|design|apresenta[cç][aã]o|narrativa|impress|sinaliza|layout|logo|fonte|hex|key visual/],
];

const classificar = (texto: string): Frente => MARCAS.find(([, re]) => re.test(normalizar(texto)))?.[0] || "redes";

/** A frente de uma tarefa: pela frente do plano; sem frente, pelo título. */
export const frenteDaTarefa = (t: TarefaFestival): Frente => classificar(t.frente || t.titulo || "");

/** A frente de um item de orçamento: Foto e vídeo é audiovisual; o resto, pelo nome. */
export const frenteDoItem = (it: ItemOrcamento): Frente => (it.categoria === "foto_video" ? "audiovisual" : classificar(it.nome || ""));

export const tarefasDaFrente = (base: Base, nucleoId: string, f: Frente) =>
  Object.values(base.tarefas).filter((t) => t.nucleo === nucleoId && frenteDaTarefa(t) === f);

export const itensDaFrente = (base: Base, nucleoId: string, f: Frente) =>
  Object.values(base.orcamento_itens).filter((it) => it.nucleo === nucleoId && frenteDoItem(it) === f).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
