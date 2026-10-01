/* Campos dos modais da edição (custo, tarefa, cronograma, máquina, peça de
   comunicação, arquivo, dados da edição, fechamento, percentuais). Listas
   (categorias, naturezas, formatos, fases) vêm do preset de festa; pessoas
   e fornecedores, das coleções da Central. */
import type { CampoModal, PedidoModal } from "../ModalCampos";
import { ROTULO_STATUS_CUSTO, ROTULO_STATUS_EDICAO, type Calculo } from "../calculo";
import { alterarEdicao } from "../dados";
import { opcoesEquipe } from "../festa/pedidos";
import { ROTULO_TAREFA, STATUS_TAREFA, type Contato, type PessoaEquipe, type PresetFesta } from "../../../types";
import type { Edicao, Socio } from "../tipos";

export const camposCusto = (socios: Socio[], categorias: string[], fornecedores: Contato[]): CampoModal[] => [
  { k: "item", label: "Item", full: true },
  { k: "cat", label: "Categoria", type: "select", opts: categorias },
  { k: "contatoId", label: "Fornecedor (do cadastro de contatos)", type: "select", opts: [["", "— sem cadastro (use o texto ao lado)"], ...fornecedores.map((c) => [c.id, c.nome] as [string, string])] },
  { k: "fornecedor", label: "Fornecedor em texto (quando não está no cadastro)" },
  { k: "qtd", label: "Quantidade prevista", type: "numero" },
  { k: "unit", label: "Valor unitário previsto (R$)", type: "numero" },
  { k: "realizado", label: "Realizado (R$ total)", type: "numero", ph: "vazio = ainda não realizado" },
  { k: "status", label: "Status", type: "select", opts: Object.entries(ROTULO_STATUS_CUSTO) },
  { k: "adiantadoPor", label: "Pago adiantado por", type: "select", opts: [["", "Ninguém (sai do caixa do evento)"], ...socios.map((s) => [s.id, s.nome] as [string, string])] },
  { k: "venc", label: "Vencimento", type: "data" },
  { k: "obs", label: "Observação", type: "textarea", full: true },
];

/** Tarefa da edição = tarefa da Central (título, responsável da Equipe, prazo, status fazer/and/feito) mais a fase. */
export const camposTarefa = (fases: PresetFesta["fases"], equipe: PessoaEquipe[]): CampoModal[] => [
  { k: "titulo", label: "Tarefa", type: "textarea", full: true },
  { k: "fase", label: "Fase", type: "select", opts: fases.map((f) => [f.id, f.label + " · " + f.desc] as [string, string]) },
  { k: "respId", label: "Responsável", type: "select", opts: opcoesEquipe(equipe) },
  { k: "prazo", label: "Prazo", type: "data" },
  { k: "status", label: "Status", type: "select", opts: STATUS_TAREFA.map((s) => [s, ROTULO_TAREFA[s]] as [string, string]) },
  { k: "obs", label: "Origem / observação" },
];

export const CAMPOS_CRONOGRAMA: CampoModal[] = [
  { k: "hora", label: "Hora" },
  { k: "atracao", label: "Atração no palco" },
  { k: "montagem", label: "Montagem / técnica" },
  { k: "equipe", label: "Equipe (chegada / saída)" },
];

export const camposMaquina = (naturezas: string[]): CampoModal[] => [
  { k: "n", label: "Nº", type: "numero" },
  { k: "resp", label: "Responsável" },
  { k: "nat", label: "Natureza", type: "select", opts: naturezas },
  { k: "estacao", label: "ID da estação" },
  { k: "vendas", label: "Vendas (R$)", type: "numero" },
  { k: "fontes", label: "Fontes conferidas" },
];

export const camposComunicacao = (formatos: string[]): CampoModal[] => [
  { k: "data", label: "Data", type: "data" },
  { k: "peca", label: "Peça" },
  { k: "formato", label: "Formato", type: "select", opts: formatos },
  { k: "perfis", label: "Perfis" },
  { k: "obs", label: "Observação", full: true },
];

export const CAMPOS_ARQUIVO: CampoModal[] = [
  { k: "nome", label: "Nome" },
  { k: "url", label: "Link (Drive)" },
  { k: "desc", label: "Descrição", full: true },
];

export const CAMPOS_DADOS_EDICAO: CampoModal[] = [
  { k: "nome", label: "Nome" },
  { k: "status", label: "Status", type: "select", opts: Object.entries(ROTULO_STATUS_EDICAO) },
  { k: "data", label: "Data", type: "data" },
  { k: "diaSemana", label: "Dia da semana" },
  { k: "horario", label: "Horário" },
  { k: "local", label: "Local" },
  { k: "lineup", label: "Lineup", full: true },
  { k: "notas", label: "Notas gerais", type: "textarea", full: true },
];

export const CAMPOS_FECHAMENTO: CampoModal[] = [
  { k: "bar", label: "Receita bar", type: "numero" },
  { k: "porta", label: "Receita porta", type: "numero" },
  { k: "comida", label: "Receita comida", type: "numero" },
  { k: "sympla", label: "Receita Sympla", type: "numero" },
  { k: "bebida", label: "Custo bebida (líquido)", type: "numero" },
  { k: "bebidaObs", label: "Obs. bebida" },
  { k: "comissaoPct", label: "Comissão garçons (%)", type: "numero" },
  { k: "comissaoBase", label: "Base da comissão (vendas garçons)", type: "numero", ph: "vazio = receita de bar" },
  { k: "taxaPct", label: "Taxa do sistema (%)", type: "numero" },
  { k: "publico", label: "Público real (estimado)", type: "numero" },
  { k: "retiradas", label: "Retiradas Sympla", type: "numero" },
  { k: "visitas", label: "Visitas à página", type: "numero" },
  { k: "checkin", label: "Check-ins Sympla", type: "numero" },
  { k: "emails", label: "E-mails capturados", type: "numero" },
  { k: "ads", label: "Investimento em ADS", type: "numero" },
  { k: "instagram", label: "Impacto Instagram (alcance, seguidores, engajamento)", type: "textarea", full: true },
  { k: "acertoObs", label: "Acerto entre sócios / observações", type: "textarea", full: true },
];

const camposVariaveis = (pctBase: number): CampoModal[] => [
  { k: "comissaoPct", label: "Comissão garçons (% do bar)", type: "numero" },
  { k: "taxaPct", label: "Taxa do sistema (% da receita)", type: "numero" },
  { k: "bebidaPct", label: "Bebida (% do bar)", type: "numero", ph: "vazio = proporção da última edição (" + pctBase.toFixed(1) + "%)" },
  { k: "ads", label: "Investimento em ADS previsto", type: "numero" },
  { k: "obs", label: "Premissas da simulação", type: "textarea", full: true },
];

/** Modal dos percentuais da simulação; usado pelo Orçamento e pela Simulação. */
export function pedidoVariaveis(e: Edicao, k: Calculo): PedidoModal {
  const v = e.variaveis;
  return {
    titulo: "Percentuais dos custos variáveis",
    campos: camposVariaveis(k.bebidaPct || 0),
    valores: { comissaoPct: v?.comissaoPct, taxaPct: v?.taxaPct, bebidaPct: v?.bebidaPct, ads: e.kpis?.ads, obs: e.sim?.obs || "" },
    aoAplicar: (o) => alterarEdicao(e.id, (ed) => {
      ed.variaveis = {
        ...ed.variaveis,
        comissaoPct: o.comissaoPct as number | null,
        taxaPct: o.taxaPct as number | null,
        bebidaPct: o.bebidaPct as number | null,
      };
      ed.kpis = { ...ed.kpis, ads: o.ads as number | null };
      ed.sim = { publico: null, ticketBar: null, ticketPorta: null, ...(ed.sim || {}), obs: String(o.obs || "") };
    }),
  };
}
