/* Etiqueta pequena e arredondada: tipo, status, esfera, urgência. O tom pode
   ser um nome daqui ou a `classe` que as tabelas de status já carregam
   (STATUS_PROJETO, STATUS_EDITAL, ESFERAS, CLASSE_URGENCIA): tudo resolve
   nesta tabela, que é o único lugar com as cores das etiquetas. */
import type { HTMLAttributes } from "react";
import { cx } from "../../utils/classes";

const TONS: Record<string, string> = {
  neutro: "bg-sand text-muted",
  tipo: "bg-sand text-[#6E5B44]",
  ok: "bg-ok-soft text-ok-ink",
  aviso: "bg-warn-soft text-warn-ink",
  erro: "bg-no-soft text-no-ink",
  info: "bg-rev-soft text-rev",
  marca: "bg-accent text-white",
  // esferas
  fed: "bg-fed text-white", est: "bg-est text-white", mun: "bg-mun text-white", priv: "bg-priv text-white",
  "e-fed": "bg-fed text-white", "e-est": "bg-est text-white", "e-mun": "bg-mun text-white", "e-priv": "bg-priv text-white",
  // status de edital e de pendência
  "st-open": "bg-ok-soft text-ok-ink", "st-prev": "bg-warn-soft text-warn-ink", "st-closed": "bg-sand text-muted",
  "st-ok": "bg-ok-soft text-ok-ink", "st-no": "bg-no-soft text-no-ink",
  "pill-ok": "bg-ok-soft text-ok-ink", "pill-pend": "bg-warn-soft text-warn-ink",
  // confiança do mapeamento de um formulário
  "conf-alta": "bg-ok-soft text-ok-ink", "conf-media": "bg-warn-soft text-warn-ink", "conf-baixa": "bg-no-soft text-no-ink",
  // urgência de prazos
  "ur-vencido": "bg-no text-white", "ur-hoje": "bg-accent text-white", "ur-d3": "bg-warn-soft text-warn-ink",
  "ur-d7": "bg-accent-soft text-accent-ink", "ur-futuro": "bg-transparent text-muted",
  // status de projeto
  "sp-prospeccao": "bg-sand text-[#6E5B44]", "sp-preparacao": "bg-warn-soft text-warn-ink",
  "sp-inscrito": "bg-inscrito-soft text-inscrito", "sp-aguardando": "bg-aguardando-soft text-aguardando",
  "sp-aprovado": "bg-ok-soft text-ok-ink", "sp-captando": "bg-captando-soft text-captando",
  "sp-execucao": "bg-dica-soft text-dica", "sp-prestacao": "bg-obrig-soft text-obrig",
  "sp-concluido": "bg-sand text-muted", "sp-nao": "bg-no-soft text-no-ink",
  // resultado do formulário e tipos de regra
  aprovado: "bg-dica-soft text-dica", reprovado: "bg-proib-soft text-proib", aguardando: "bg-warn-soft text-warn-ink", parcial: "bg-prior-soft text-prior",
  proibicao: "bg-proib-soft text-proib", obrigatorio: "bg-obrig-soft text-obrig", prioridade: "bg-prior-soft text-prior",
  estilo: "bg-estilo-soft text-estilo", dica: "bg-dica-soft text-dica",
  // status das respostas do formulário
  rasc: "bg-warn-soft text-gold", rev: "bg-rev-soft text-rev", col: "bg-ok-soft text-ok",
};

export type TomBadge = keyof typeof TONS | (string & {});

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tom?: TomBadge;
  mini?: boolean;
  /** Caixa alta e espaçada (tipos de regra, resultado). */
  caixaAlta?: boolean;
  /** Reage ao clique (muda o cursor e escurece no hover). */
  clicavel?: boolean;
  /** Apagada (opção não escolhida num grupo de etiquetas clicáveis). */
  apagada?: boolean;
}

export function Badge({ tom = "neutro", mini, caixaAlta, clicavel, apagada, className, ...resto }: Props) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-[3px] font-bold tracking-[.2px]",
        mini ? "text-3xs" : "text-2xs",
        caixaAlta && "uppercase tracking-[.04em]",
        clicavel && "cursor-pointer hover:brightness-95",
        apagada && "opacity-40 hover:opacity-75",
        TONS[tom] || TONS.neutro,
        className,
      )}
      {...resto}
    />
  );
}
