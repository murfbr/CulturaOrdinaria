/* Guia e modelo do "Importar plano": as colunas do plano de ação (o mesmo
   cabeçalho que "Baixar planilha" gera) com o que cada uma aceita, lido da
   base: núcleos, equipe, status do quadro, prioridades. O leitor fica em
   plano.ts; aqui é só o texto da tela e a linha de exemplo. */
import type { LinhaGuia } from "../importar/tabela";
import { PRIORIDADES, type Base } from "../tipos";
import { CABECALHO_PLANO } from "./plano";

const nomes = (lista: { nome: string }[]) => lista.map((x) => x.nome).join(", ");

/** Uma linha por coluna do plano, na ordem do cabeçalho. */
export function colunasDoPlano(base: Base): LinhaGuia[] {
  const p = base.pagina;
  const equipe = Object.values(base.cadastro).filter((d) => Array.isArray(d.tipos) && d.tipos.includes("equipe")).map((d) => d.nome);
  const como: Record<string, [boolean, string]> = {
    "ID": [true, 'código da tarefa no plano ("ART-001"); é por ele que reimportar atualiza em vez de duplicar. Também aceita "Código"'],
    "Grupo de Trabalho (GT)": [false, 'nome do núcleo; nome novo cria o núcleo. Também aceita "GT" ou "Núcleo". Hoje: ' + (nomes(p.nucleos) || "nenhum")],
    "Responsável pelo GT": [false, "nome de alguém da equipe; vira o responsável do núcleo quando ele ainda não tem"],
    "Frente / Subtema": [false, 'texto livre ("Line-up", "Licenças")'],
    "Tarefa": [true, 'o que fazer. Também aceita "Título" ou "Ação"'],
    "Responsável da tarefa": [false, "nome de alguém da equipe (" + (equipe.join(", ") || "ninguém cadastrado ainda") + "); vazio = o responsável do núcleo"],
    "Prazo": [false, "data: 09/10/2026 ou 2026-10-09 (a data como número do Excel também serve)"],
    "Prioridade": [false, PRIORIDADES.map(([, r]) => r).join(", ") + ' (também aceita "urgente" = crítica e "normal" = média)'],
    "Status": [false, nomes(p.listas.statusTarefa) + ' (também aceita "não iniciado", "a fazer", "pendente", "em curso", "feito", "finalizado"); status novo cria a coluna no quadro'],
    "Dependência / Aguardando de": [false, 'de quem ou do que a tarefa depende ("Bandas", "ART-018")'],
    "Entrega / Evidência": [false, 'o que comprova a tarefa feita ("Contratos assinados")'],
    "Observações": [false, 'texto livre; também aceita "Anotações"'],
  };
  return CABECALHO_PLANO.map((c) => ({ cabecalho: c, obrigatoria: como[c]?.[0] ?? false, como: como[c]?.[1] ?? "" }));
}

/** Cabeçalho e uma linha de exemplo, com um núcleo e uma pessoa reais quando existem. */
export function modeloPlano(base: Base): string[][] {
  const p = base.pagina;
  const n = p.nucleos[0];
  const resp = (n?.responsavel && base.cadastro[n.responsavel]?.nome) || "";
  const status = p.listas.statusTarefa[0]?.nome || "Backlog";
  return [
    [...CABECALHO_PLANO],
    ["EXE-001", n?.nome || "Produção", resp, "Exemplo", "Tarefa de exemplo", resp, "09/12/2026", "Alta", status, "", "", "linha de exemplo: apague antes de importar"],
  ];
}
