/* Selo: etiqueta retangular em mono e caixa alta (tipo, status, esfera,
   urgência). O tom pode ser um nome daqui ou a `classe` que as tabelas de
   status já carregam (STATUS_PROJETO, STATUS_EDITAL, ESFERAS,
   CLASSE_URGENCIA): tudo resolve nesta tabela, o único lugar com as cores
   dos selos. Regra da identidade: vermelho só para "estou aqui", ligação e
   reprovado; prazo é âmbar; esferas são cheias com texto claro. */
import type { HTMLAttributes } from "react";
import { cx } from "../../utils/classes";

const TONS: Record<string, string> = {
  neutro: "bg-bg-sunk text-muted",
  tipo: "bg-bg-sunk text-ink",
  ok: "bg-ok-soft text-ok",
  aviso: "bg-warn-soft text-warn",
  erro: "bg-accent-soft text-accent",
  info: "bg-est-soft text-est",
  marca: "bg-accent text-on-fill",
  // esferas
  fed: "bg-fed text-on-fill", est: "bg-est text-on-fill", mun: "bg-mun text-on-fill", priv: "bg-priv text-on-fill",
  "e-fed": "bg-fed text-on-fill", "e-est": "bg-est text-on-fill", "e-mun": "bg-mun text-on-fill", "e-priv": "bg-priv text-on-fill",
  // status de edital e de pendência
  "st-open": "bg-ok-soft text-ok", "st-prev": "bg-warn-soft text-warn", "st-closed": "bg-bg-sunk text-muted",
  "st-ok": "bg-ok-soft text-ok", "st-no": "bg-accent-soft text-accent",
  "pill-ok": "bg-ok-soft text-ok", "pill-pend": "bg-warn-soft text-warn",
  // confiança do mapeamento de um formulário
  "conf-alta": "bg-ok-soft text-ok", "conf-media": "bg-warn-soft text-warn", "conf-baixa": "bg-accent-soft text-accent",
  // urgência de prazos: âmbar, não vermelho
  "ur-vencido": "bg-warn text-on-fill", "ur-hoje": "bg-warn text-on-fill", "ur-d3": "bg-warn-soft text-warn",
  "ur-d7": "bg-warn-soft text-warn", "ur-futuro": "bg-ok-soft text-ok",
  // status de projeto
  "sp-prospeccao": "bg-bg-sunk text-ink", "sp-preparacao": "bg-warn-soft text-warn",
  "sp-inscrito": "bg-est-soft text-est", "sp-aguardando": "bg-fed-soft text-fed",
  "sp-aprovado": "bg-ok-soft text-ok", "sp-captando": "bg-ok-soft text-ok",
  "sp-execucao": "bg-ok-soft text-ok", "sp-prestacao": "bg-priv-soft text-priv",
  "sp-concluido": "bg-bg-sunk text-muted", "sp-nao": "bg-accent-soft text-accent",
  // resultado do formulário e tipos de regra
  aprovado: "bg-ok-soft text-ok", reprovado: "bg-accent-soft text-accent", aguardando: "bg-warn-soft text-warn", parcial: "bg-est-soft text-est",
  proibicao: "bg-accent-soft text-accent", obrigatorio: "bg-priv-soft text-priv", prioridade: "bg-est-soft text-est",
  estilo: "bg-fed-soft text-fed", dica: "bg-ok-soft text-ok",
  // status das respostas do formulário: rascunho âmbar, revisado violeta, colado verde
  rasc: "bg-warn-soft text-warn", rev: "bg-fed-soft text-fed", col: "bg-ok-soft text-ok",
};

export type TomBadge = keyof typeof TONS | (string & {});

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tom?: TomBadge;
  mini?: boolean;
  /** Sem efeito desde a identidade de 07/10 (todo selo é caixa alta); fica para quem já passa. */
  caixaAlta?: boolean;
  /** Reage ao clique (muda o cursor e escurece no hover). */
  clicavel?: boolean;
  /** Apagada (opção não escolhida num grupo de selos clicáveis). */
  apagada?: boolean;
}

export function Badge({ tom = "neutro", mini, caixaAlta: _caixaAlta, clicavel, apagada, className, ...resto }: Props) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-sm font-mono font-medium uppercase",
        mini ? "px-1 py-0 text-3xs" : "px-1.5 py-px text-2xs",
        clicavel && "cursor-pointer hover:brightness-95",
        apagada && "opacity-40 hover:opacity-75",
        TONS[tom] || TONS.neutro,
        className,
      )}
      {...resto}
    />
  );
}
