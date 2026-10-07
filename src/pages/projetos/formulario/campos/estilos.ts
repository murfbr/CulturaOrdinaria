/* Classes que os tipos de campo do formulário repetem entre si (e que o
   checklist do orçamento reaproveita): largura dos campos curtos, a opção de
   lista (rádio ou caixa), o item do checklist de documentos e a caixa
   tracejada. Nenhum bloco de ui/ cobre exatamente estes; se virarem bloco,
   saem daqui. */

/** Largura dos campos curtos, pela `cls` da definição do formulário. */
export const LARGURA_CAMPO: Record<string, string> = {
  curto: "max-w-[220px]",
  medio: "max-w-[360px]",
};

/** Uma opção de lista (rádio ou caixa). O display (flex/hidden), o padding
    horizontal e a cor de fundo entram em quem usa, porque dependem do estado. */
export const ESTILO_OPCAO = "cursor-pointer items-start gap-2 rounded-md py-[5px] text-sm";

/** A bolinha ou caixinha dentro da opção. */
export const ESTILO_CAIXA = "mt-[3px] accent-ink";

/** Item do checklist de documentos (marca o que já está pronto). */
export const ESTILO_DOCUMENTO = "mb-1 flex cursor-pointer items-start gap-2 rounded-md border border-line bg-bg px-2 py-[7px] text-sm";

/** Marca "obrigatório" no fim do item do checklist. */
export const ESTILO_OBRIGATORIO = "ml-auto flex-none rounded border border-gold px-1 font-mono text-3xs tracking-[.06em] text-gold";

/** Caixa tracejada: anexo avulso e item repetível. */
export const ESTILO_TRACEJADA = "rounded-md border border-dashed border-line-strong px-3 py-2.5";
