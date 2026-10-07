/* As poucas classes nomeadas que um elemento solto precisa quando não vale
   um bloco: ligação de texto, trecho em monoespaçado, texto auxiliar. Tudo o
   mais que se repete é componente nesta pasta. */

/** Ligação de ação em texto (abre ficha, "ver", "editar"): vermelho, negrito. */
export const ESTILO_LINK = "cursor-pointer font-semibold text-accent hover:underline";

/** Identificador técnico (id, chave de campo) em mono, numa etiqueta neutra. */
export const ESTILO_MONO = "rounded-sm bg-bg-sunk px-1.5 py-px font-mono text-xs text-ink select-all";

/** Texto auxiliar: a segunda linha, o detalhe, o "quando". */
export const ESTILO_AUXILIAR = "text-sm text-muted";

/** Texto de apoio apagado, menor que o auxiliar. */
export const ESTILO_APAGADO = "text-xs text-faint";

/** Número alinhado em coluna (tabelas, totais). */
export const ESTILO_NUMERO = "text-right tabular-nums";
