/* Classes repetidas entre as telas, com nome: a barra de filtros, a nota
   cinza, o link em texto, o título de seção dentro de uma vista, a célula de
   ações e o texto longo de tabela. Trocar o visual é aqui. */

/** Linha de filtros e botões no topo de uma aba (quebra linha no celular). */
export const BARRA = "cdf:mb-2.5 cdf:flex cdf:flex-wrap cdf:items-center cdf:gap-2.5";

/** Texto explicativo pequeno e cinza. */
export const NOTA = "cdf:m-0 cdf:text-sm cdf:text-fraco";

/** Botão que parece link (cor de link, sublinhado). */
export const LINK = "cdf:cursor-pointer cdf:border-0 cdf:bg-transparent cdf:p-0 cdf:font-bold cdf:text-link cdf:underline";

/** Título de seção dentro de uma vista (Londrina), com espaço para um botão à direita. */
export const SECAO = "cdf:mb-2.5 cdf:mt-[26px] cdf:flex cdf:flex-wrap cdf:items-baseline cdf:gap-3 cdf:font-display cdf:text-[26px] cdf:font-black cdf:leading-tight cdf:text-primaria";

/** Título pequeno dentro de um detalhe. */
export const H3 = "cdf:my-3 cdf:mt-3 cdf:text-sm cdf:font-bold cdf:text-tinta-2";

/** Célula de ações: estreita e à direita. */
export const ACOES = "cdf:w-[1%] cdf:whitespace-nowrap cdf:text-right";

/** Texto longo numa célula (anotações, contrapartidas). */
export const TEXTO_LONGO = "cdf:max-w-[42ch] cdf:whitespace-pre-line cdf:text-sm cdf:text-tinta-2";

/** Linha secundária numa célula (telefone sob o nome, e-mail sob o telefone). */
export const SUB = "cdf:block cdf:text-[13px] cdf:text-fraco";

/** Lista rolável de checkboxes (membros de um núcleo, participantes de um horário). */
export const LISTA_MARCAR = "cdf:mt-1.5 cdf:max-h-[260px] cdf:overflow-y-auto cdf:rounded-lg cdf:border-[1.5px] cdf:border-solid cdf:border-linha cdf:bg-superficie cdf:p-1";
