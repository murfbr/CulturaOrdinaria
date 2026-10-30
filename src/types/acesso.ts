/* Controle de acesso por módulos (decisão de 22/10/2026). Cada conta tem um
   documento em `usuarios/<e-mail>` com a marca `master` e a lista de módulos
   que abre. Módulo é um item do menu: os ambientes da Central, o Núcleo e
   cada página anexo ("pagina:<slug>"). Tem o módulo, abre e edita; não tem,
   não aparece. Master passa por cima de tudo: vê e grava em todo módulo,
   inclusive os criados depois. Perfil é só o preenchimento inicial da lista.
   A tabela módulo → coleções daqui é a mesma das regras do Firestore
   (firestore.rules): quem pode gravar numa coleção é quem tem o módulo dono. */

export interface Acesso {
  email: string;
  /** Como a pessoa aparece no site. */
  nome: string;
  /** Desligada, a conta existe no Firebase mas não abre nada. */
  ativo: boolean;
  /** Passa por cima da lista: tudo, inclusive o Núcleo e os módulos que vierem. */
  master: boolean;
  /** Ids de módulo: "painel", "cadastros", "projetos", "agenda", "gestao", "captacao", "comunicacao", "contexto", "nucleo", "pagina:<slug>". */
  modulos: string[];
  /** Perfil que preencheu a lista (só rótulo). */
  perfil?: string;
  obs?: string;
  atualizado?: string;
}

/** Documento `usuarios/<e-mail>`: o id é o e-mail em minúsculas. A primeira linha master
    nasce pela tela Acessos antes de as regras novas serem publicadas (enquanto as antigas
    valem, qualquer login grava); depois, só quem tem o módulo Núcleo cria e muda linhas. */
export interface ContaUsuario extends Acesso { id: string }

/** Anotação do Núcleo (coleção `nucleo`). */
export interface Anotacao {
  id: string;
  /** Sem tipo (ou "anotacao") é anotação; os outros tipos da coleção `nucleo` são o caderno Melhorias (types/caderno.ts). */
  tipo?: "anotacao";
  texto: string;
  /** E-mail de quem anotou. */
  quem: string;
  criadoEm: string;
  editadoEm?: string;
  atualizado?: string;
}

/** Os ambientes da Central que são módulos (Páginas anexo não é: abre para quem tem qualquer um destes). */
export const MODULOS_CENTRAL = ["painel", "cadastros", "projetos", "agenda", "gestao", "captacao", "comunicacao", "contexto"] as const;
export const MODULO_NUCLEO = "nucleo";
export const moduloDaPagina = (slug: string) => "pagina:" + slug;
export const ehModuloDePagina = (m: string) => m.startsWith("pagina:");
export const slugDoModulo = (m: string) => (ehModuloDePagina(m) ? m.slice("pagina:".length) : "");

export const ROTULO_MODULO: Record<string, string> = {
  painel: "Painel", cadastros: "Cadastros", projetos: "Projetos", agenda: "Agenda", gestao: "Gestão", captacao: "Captação",
  comunicacao: "Comunicação", contexto: "Contexto", nucleo: "Núcleo do Coletivo",
};

/** Perfis: preenchem a lista no "+ Conta"; depois se ajusta caixa a caixa. */
export interface Perfil { id: string; rotulo: string; master: boolean; modulos: string[]; descricao: string }
export const PERFIS: Perfil[] = [
  { id: "master", rotulo: "Master", master: true, modulos: [], descricao: "tudo, inclusive o Núcleo e os módulos que vierem" },
  { id: "coordenador", rotulo: "Coordenador", master: false, modulos: [...MODULOS_CENTRAL], descricao: "a Central inteira; as páginas anexo se marcam depois" },
  { id: "captador", rotulo: "Captador", master: false, modulos: ["captacao"], descricao: "a Captação (empresas, portfólio, negociações e captadoras); como todo módulo da Central, lê o banco inteiro" },
  { id: "cliente", rotulo: "Cliente", master: false, modulos: [], descricao: "só as páginas anexo marcadas" },
];

/** Módulos donos de cada coleção da Central: quem pode gravar nela. As páginas
    integradas (hoje o Ponta de Lança) entram nas coleções que gravam. */
export const MODULOS_DA_COLECAO: Record<string, string[]> = {
  artistas: ["cadastros"], proponentes: ["cadastros"], editais: ["cadastros"], formularios: ["cadastros"],
  equipe: ["cadastros"], elenco: ["cadastros"], contatos: ["cadastros", "pagina:pontadelanca"],
  projetos: ["projetos"], rascunhos: ["projetos"], versoes: ["projetos"], candidaturas: ["projetos"],
  tarefas: ["agenda", "gestao", "projetos", "pagina:pontadelanca"], reunioes: ["agenda", "gestao"], semanas: ["agenda", "gestao"],
  fichas: ["contexto"], regras: ["contexto"], julgamentos: ["contexto"],
  empresas: ["captacao"], captadoras: ["captacao"], portfolio: ["captacao"], cotas: ["captacao"], negociacoes: ["captacao"],
  referencias: ["comunicacao"], leiturasReferencias: ["comunicacao"], rodadasReferencias: ["comunicacao"], analisesReferencias: ["comunicacao"],
  nucleo: ["nucleo"], usuarios: ["nucleo"],
};
