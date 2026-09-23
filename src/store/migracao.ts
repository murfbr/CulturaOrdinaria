/* Migração v2 → v3 no banco ao vivo (e aplicação do pacote de enriquecimento).
   A conversão em si é pura (lib/migracao/v3.ts); aqui ela lê o estado atual,
   mostra a prévia e grava. Nada some sem cópia: projetos e candidaturas
   antigos, e fichas que mudam de id, vão antes para a coleção `backup_v2`. */
import { Banco } from "../services/banco";
import { obterEstado } from "./central";
import {
  aplicarEnriquecimento, converterV2, type DadosV3, type Enriquecimento, type PainelV2, type RelatorioMigracao,
} from "../lib/migracao/v3";
import { COLECOES_PAINEL, type Candidatura, type Rascunho } from "../types";
import { clonar } from "../utils";

type Documento = Record<string, unknown> & { id: string };

/** Documentos crus de uma coleção, na ordem da lista (sem a normalização da leitura). */
const crus = <T,>(colecao: string): T[] =>
  (Object.values(Banco.ler(colecao)) as (Documento & { _ord?: number })[])
    .sort((a, b) => (a._ord || 0) - (b._ord || 0))
    .map((d) => clonar(d) as unknown as T);

/** Converte o que está no banco agora (e aplica o enriquecimento, se houver). Não grava. */
export function planejarMigracao(enr?: Enriquecimento | null): { dados: DadosV3; relatorio: RelatorioMigracao } {
  const e = obterEstado();
  const painel: PainelV2 = {};
  for (const c of COLECOES_PAINEL) (painel as Record<string, unknown>)[c] = crus(c);
  painel.candidaturas = crus<Candidatura>("candidaturas");
  const { dados, relatorio } = converterV2(
    painel,
    clonar(e.rascunhos) as Record<string, Rascunho>,
    { fichas: clonar(e.fichas), regras: clonar(e.regras), julg: clonar(e.julgamentos) },
  );
  // Os formulários do banco entram na conta: o pacote só completa os metadados
  // deles (origem, fonte, editais) e acrescenta os que faltam.
  dados.formularios = clonar(e.formularios);
  if (enr) aplicarEnriquecimento(dados, enr, relatorio);
  return { dados, relatorio };
}

/** Grava o resultado da conversão. Devolve quantos documentos foram gravados. */
export function aplicarMigracao(dados: DadosV3, relatorio: RelatorioMigracao): number {
  const agora = new Date().toISOString();
  let n = 0;
  const gravar = (colecao: string, doc: Documento) => { Banco.gravar(colecao, doc.id, doc, true); n++; };

  // 1. Cópia de segurança do que vai sair ou mudar de id.
  for (const { colecao, id } of relatorio.substituidos) {
    const original = Banco.ler(colecao)[id];
    if (original) gravar("backup_v2", { ...clonar(original), id: colecao + "__" + id, _de: colecao, _idOriginal: id, _em: agora });
  }
  for (const c of crus<Documento>("candidaturas")) {
    if (!relatorio.substituidos.some((s) => s.colecao === "candidaturas" && s.id === c.id)) {
      gravar("backup_v2", { ...c, id: "candidaturas__" + c.id, _de: "candidaturas", _idOriginal: c.id, _em: agora });
    }
  }

  // 2. Painel: grava tudo o que a conversão devolveu; em projetos, sai o que não existe mais.
  for (const c of COLECOES_PAINEL) {
    const lista = dados.painel[c] as unknown as Documento[];
    lista.forEach((registro, i) => gravar(c, { ...clonar(registro), _ord: i, atualizado: agora }));
    if (c === "projetos") {
      const ficam = new Set(lista.map((x) => x.id));
      Object.keys(Banco.ler("projetos")).forEach((id) => { if (!ficam.has(id)) void Banco.apagar("projetos", id); });
    }
  }

  // 3. Respostas dos formulários, definições e contexto.
  Object.values(dados.rascunhos).forEach((r) => gravar("rascunhos", r as unknown as Documento));
  Object.values(dados.formularios).forEach((f) => gravar("formularios", { ...(clonar(f) as unknown as Documento), atualizado: agora }));
  Object.values(dados.contexto.fichas).forEach((f) => gravar("fichas", f as unknown as Documento));
  Object.values(dados.contexto.regras).forEach((r) => gravar("regras", r as unknown as Documento));
  Object.values(dados.contexto.julg).forEach((j) => gravar("julgamentos", j as unknown as Documento));
  const fichasFicam = new Set(Object.keys(dados.contexto.fichas));
  relatorio.substituidos.filter((s) => s.colecao === "fichas" && !fichasFicam.has(s.id))
    .forEach((s) => void Banco.apagar("fichas", s.id));

  // 4. Candidaturas: com cópia no backup_v2 e já viradas projeto, saem da coleção antiga.
  Object.keys(Banco.ler("candidaturas")).forEach((id) => void Banco.apagar("candidaturas", id));

  return n;
}
