/* As poucas classes nomeadas que um elemento solto precisa quando não vale
   um bloco: link de texto, trecho em monoespaçado, texto auxiliar. Tudo o
   mais que se repete é componente nesta pasta. */

/** Link de ação em texto (abre ficha, "ver", "editar"). */
export const ESTILO_LINK = "cursor-pointer font-semibold text-accent hover:underline";

/** Identificador técnico (id, chave de campo) em monoespaçado. */
export const ESTILO_MONO = "rounded bg-code-soft px-[5px] py-px font-mono text-xs text-code select-all";

/** Texto auxiliar: a segunda linha, o detalhe, o "quando". */
export const ESTILO_AUXILIAR = "text-sm text-muted";

/** Texto de apoio apagado, menor que o auxiliar. */
export const ESTILO_APAGADO = "text-xs text-faint";

/** Número alinhado em coluna (tabelas, totais). */
export const ESTILO_NUMERO = "text-right tabular-nums";
