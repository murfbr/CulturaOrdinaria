/* Navegação interna da página: a festa ou uma edição aberta, mais a âncora
   da seção para rolar até ela. Fica em estado local e no localStorage, como
   no artefato; não passa pela navegação da Central. */

export type Visao = { sec: "festa" } | { sec: "edicao"; id: string };

export type IrPara = (visao: Visao, ancora?: string) => void;
