/* Tipos das entidades do Painel (as nove coleções de gestão).
   Os nomes dos campos são exatamente os do artefato original — e são os nomes
   das propriedades dos documentos no Firestore. Onde o artefato usava tuplas
   (array de arrays), aqui são arrays de objetos: o Firestore não aceita array
   aninhado em array. */

/** Item de checklist simples usado em vários lugares (docs de candidatura etc.). */
export interface ItemChecklist {
  nome: string;
  ok: boolean;
  /** Observação livre (usada nos documentos editados pelo Simulador). */
  obs?: string;
}

/** Ficha detalhada do artista — alimentada pelo acervo (sub-abas do detalhe). */
export interface DetalheArtista {
  /** Pares rótulo → valor exibidos em "Geral" (ex.: "Local": "Pedra do Leme"). */
  geral?: Record<string, string>;
  /** Histórico e realizações por ano. */
  portfolio?: { ano: string; texto: string }[];
  /** Acervo de documentos do artista, com status "ok" ou "pend". */
  docs?: { nome: string; status: string }[];
  /** Quantidade de fotos no acervo (placeholder visual). */
  fotos?: number;
  /** Links externos (Instagram, pasta no Drive...). */
  links?: { rotulo: string; url: string }[];
  /** Manual de marca resumido (+ link do manual completo e da pasta de fotos). */
  marca?: { cores: string[]; logo: string; fonte: string; obs: string; manual?: string; pastaFotos?: string };
  /** Pendências e perguntas em aberto sobre o artista (aba Geral). */
  pendencias?: PendenciaArtista[];
  /** Correções que a pesquisa propôs e ainda precisam de confirmação. */
  propostas?: PropostaCorrecao[];
}

/** Uma pendência (algo a resolver) ou pergunta (algo a perguntar ao artista). */
export interface PendenciaArtista {
  texto: string;
  /** "pendencia" = a resolver pelo coletivo; "perguntar" = só o artista responde. */
  tipo: "pendencia" | "perguntar";
  /** "aberta" | "resolvida". */
  status: string;
  /** Resposta ou como foi resolvida. */
  resposta?: string;
  /** De onde veio (ex. "Fila da Revisão 1.6"). */
  fonte?: string;
}

/** Correção proposta para um campo da ficha (ainda não aplicada). */
export interface PropostaCorrecao {
  campo: string;
  de: string;
  para: string;
  motivo: string;
  /** "aberta" | "aplicada" | "descartada". */
  status: string;
}

/** Artista ou coletivo do portfólio (bloco, roda de samba, grupo...). */
export interface Artista {
  id: string;
  nome: string;
  /** Tipo livre: "Bloco de carnaval", "Grupo musical"... */
  tipo: string;
  /** Enquadramento antigo (v2). Substituído por `formalizacao` + `liga`; fica
      guardado para consulta e para o importador de pacotes antigos. */
  enq: string;
  /** Formalização própria: "Sem CNPJ nem MEI", "MEI", "CNPJ próprio"... */
  formalizacao?: string;
  /** Número do CNPJ/MEI quando houver (texto livre). */
  cnpj: string;
  /** Liga ou associação de carnaval a que o bloco pertence. */
  liga?: string;
  /** Sede (município). */
  mun: string;
  bio: string;
  tags: string[];
  det?: DetalheArtista;
  /** Posição na listagem (mantida pelo armazenamento). */
  _ord?: number;
  /** Carimbo ISO da última gravação (mantido pelo armazenamento). */
  atualizado?: string;
}

/** Status do projeto: as etapas do antigo pipeline de captação, agora no próprio projeto. */
export type StatusProjeto =
  | "prospeccao" | "preparacao" | "inscrito" | "aguardando" | "aprovado"
  | "captando" | "execucao" | "prestacao" | "concluido" | "nao_aprovado" | "desistencia";

/** Seção interna do projeto (nada disso vai para a plataforma). */
export interface InternoProjeto {
  /** Anotações gerais (até 3000 caracteres). */
  anot: string;
  agentes: { nome: string; tipo: string; vinc: string; papel: string }[];
  /** Cronograma interno de marcos. */
  crono: { data: string; m: string; ok: boolean }[];
}

/** Projeto = uma candidatura (v3). Nasce ligado a um edital e ao formulário
    dele, ou "Livre". Os artistas são uma lista; o status é o antigo pipeline. */
export interface Projeto {
  id: string;
  nome: string;
  /** Artistas envolvidos (lista; o primeiro é o principal). */
  artistaIds: string[];
  /** Edital ao qual concorre ("" = sem edital). */
  editalId: string;
  /** Formulário do projeto: id em `formularios` ou "livre". */
  formId: string;
  /** Rascunho com as respostas do formulário (coleção `rascunhos`). */
  rascunhoId?: string;
  status: StatusProjeto;
  arquivado: boolean;
  /** Responsável (id de pessoa da equipe). */
  respId: string;
  /** Pessoas da equipe alocadas. */
  equipeIds: string[];
  tipo: string;
  /** Janela / ano de realização. */
  ano: string;
  /** Iniciativa maior de que faz parte (ex. "Carnaval 2027 · Bloco Brasil"). */
  grupo: string;
  valorPedido: string;
  valorAprovado: string;
  valorCaptado: string;
  /** Quem assina a inscrição (texto; quando há cadastro, espelha o proponente escolhido). */
  proponente: { nome: string; perfil: string; obs: string };
  /** Proponente do cadastro (coleção `proponentes`), quando escolhido. */
  proponenteId?: string;
  /** Número de inscrição / protocolo na plataforma. */
  inscricao: string;
  /** Resultado: classificação, nota, o que o parecer disse. */
  resultado: string;
  /** Pasta da inscrição no Google Drive. */
  linkDrive: string;
  /** Checklist de documentos da inscrição. */
  docs: ItemChecklist[];
  /** Checklist de produção. Status: "fazer" | "and" | "feito". */
  producao: { texto: string; status: string }[];
  interno: InternoProjeto;
  /** Mudanças de status (data ISO, de, para). */
  historico: { data: string; de: string; para: string }[];
  obs: string;
  /** De onde veio na migração v2 → v3 (projeto e candidatura antigos). */
  origem?: { projeto?: string; candidatura?: string; rascunho?: string };
  _ord?: number;
  atualizado?: string;
}

/** Projeto no formato antigo (v2): iniciativa de um artista, sem edital. */
export interface ProjetoV2 {
  id: string;
  nome: string;
  artistaId: string;
  tipo: string;
  meta: string;
  ano: string;
  producao: { texto: string; status: string }[];
  equipeIds: string[];
  _ord?: number;
  atualizado?: string;
}

export type EsferaEdital = "fed" | "est" | "mun" | "priv" | "para";
/** Aberto, fluxo contínuo, previsto, encerrado, norma vigente. */
export type StatusEdital = "open" | "cont" | "prev" | "closed" | "norma";
/** Natureza da fonte: edital, lei de incentivo, canal de patrocínio, cadastro, norma, prospecção. */
export type CategoriaEdital = "edital" | "lei" | "canal" | "cadastro" | "norma" | "prospeccao";

/** Critério de avaliação do edital (Mapa dos Editais). */
export interface CriterioEdital {
  criterio: string;
  descricao: string;
  pontos: number | null;
  /** Conceito padronizado (merito, coerencia, trajetoria...). */
  conceito: string;
}

/** Alerta com data que muda decisão (vem do "O que muda decisão" do Mapa). */
export interface AlertaEdital {
  quando: string;
  titulo: string;
  texto: string;
  fazer: string;
  fonte: string;
  /** Outros editais citados no mesmo alerta. */
  ids?: string[];
  /** Até quando o alerta vale (AAAA-MM-DD). Sem ela, vale a última data escrita em `quando`. */
  ate?: string;
}

/** Campo de formulário como o Mapa dos Editais registrou. */
export interface CampoMapa {
  etapa: string;
  campo: string;
  instrucao: string;
  limite: number | null;
  unidade: string | null;
  obrigatorio: boolean | null;
  conceito: string;
}

/** Lacuna de informação do edital e quem resolve. */
export interface LacunaEdital {
  lacuna: string;
  achado: string;
  por_que: string;
  /** aberta | parcial | fechada. */
  status: string;
  /** Quem resolve: voce | orgao | login | chrome | proxima | nao_existe | fechada. */
  cat: string;
}

/** Edital ou fonte de captação (lei de incentivo, patrocínio, credenciamento...).
    Os campos a partir de `categoria` vêm do Mapa dos Editais (v3). */
export interface Edital {
  id: string;
  nome: string;
  /** Nome curto para cards e listas (ex. "Mosaico"). */
  curto?: string;
  /** Órgão ou promotor (SMC-Rio, SECEC, MinC, empresa...). */
  orgao?: string;
  esfera: EsferaEdital;
  /** Mecanismo: "Renúncia fiscal", "Fomento direto", "Patrocínio"... */
  mec: string;
  /** Área contemplada (texto livre). */
  area: string;
  /** Elegibilidade em chips (ex. ["PJ", "2 anos de atuação"]). */
  eleg: string[];
  /** Teto / valores (texto livre). */
  teto: string;
  /** Prazo em texto (ex. "13/10/2026" ou "previsto p/ nov"). */
  prazo: string;
  /** Prazo em data ISO (yyyy-mm-dd) — alimenta Agenda e Calendário. */
  prazoIso?: string;
  /** Formulário principal (id em `formularios`, ex. "dc-138"). */
  formId?: string;
  /** Todos os formulários do edital, quando há mais de um (ex. Mobilidades). */
  formIds?: string[];
  status: StatusEdital;
  /** O que financia. */
  objeto?: string;
  /** Quem pode se inscrever. */
  publico?: string;
  /** Como se inscrever. */
  comoInscrever?: string;
  contrapartidas?: string;
  /** Documentos exigidos (um por linha na edição). */
  docsExig?: string[];
  linkEdital?: string;
  linkDrive?: string;
  obs?: string;
  /** Data em que as infos foram verificadas. */
  verif?: string;

  categoria?: CategoriaEdital;
  /** anual | bienal | contínuo | único | incerto. */
  ciclo?: string;
  /** Links oficiais (página, regulamento, anexos, plataforma). */
  links?: { rotulo: string; url: string }[];
  /** O que o edital quer incentivar, em linguagem simples. */
  estimula?: string;
  /** Linhas / categorias com valor e vagas. */
  linhas?: { nome: string; valor: string; vagas: string; obs: string }[];
  aceitaPf?: boolean | null;
  aceitaMei?: boolean | null;
  aceitaColetivo?: boolean | null;
  criterios?: CriterioEdital[];
  criteriosTotal?: number | null;
  notaMinima?: string;
  desempate?: string;
  bonus?: string;
  criteriosFonte?: string;
  /** Obrigações relevantes (acessibilidade mínima, gratuidade, marca...). */
  exigencias?: string;
  /** O que foi lido para montar a ficha. */
  fontes?: string[];
  /** alta | media | baixa. */
  confianca?: string;
  /** O que não foi possível apurar (texto). */
  lacunasTexto?: string;
  lacunas?: LacunaEdital[];
  alertas?: AlertaEdital[];
  /** Tempo mínimo de CNPJ do proponente, em anos ("" = não exige). */
  cnpjMinAnos?: number | "";
  /** Máximo de propostas por proponente neste edital ("" = sem limite). */
  limitePorProponente?: number | "";
  /** Arquivos do edital no acervo do Drive. */
  arquivos?: { nome: string; onde: string; tipo: string; kb: number }[];
  /** Origem do formulário no Mapa (central, espelho_oficial, regulamento, web, nao_descrito). */
  formOrigem?: string;
  /** Campos do formulário como o Mapa leu (por conceito), inclusive dos editais sem réplica. */
  formCampos?: CampoMapa[];
  /** Plataforma de inscrição (texto do Mapa). */
  plataforma?: string;
  _ord?: number;
  atualizado?: string;
}

/** Candidatura = projeto × edital (formato v2, só para migração e pacotes
    antigos: no v3 cada projeto já é uma candidatura). */
export interface Candidatura {
  id: string;
  projetoId: string;
  editalId: string;
  /** Responsável (id de pessoa da equipe). */
  respId: string;
  /** Valor pleiteado (texto livre). */
  valor: string;
  /** Etapa no pipeline: índice 0–7 em ETAPAS_PIPELINE. */
  etapa: number;
  /** Resultado quando chega em "Aprovado / Reprovado": "ok" | "no". */
  result?: "ok" | "no";
  /** Checklist de documentos da inscrição. */
  docs?: ItemChecklist[];
  /** Pasta da inscrição no Google Drive. */
  linkDrive?: string;
  _ord?: number;
  atualizado?: string;
}

export type StatusTarefa = "fazer" | "and" | "feito";

/** Tarefa designada à equipe. Nasce solta ou vinculada (origem). */
export interface Tarefa {
  id: string;
  titulo: string;
  respId: string;
  /** Vínculo: "proj:c2" | "edital:ed7" | "reuniao:r1" | "" (sem vínculo).
      "cand:" é do formato v2 e a migração converte em "proj:". */
  origem: string;
  /** Prazo ISO (yyyy-mm-dd). */
  prazo: string;
  obs: string;
  status: StatusTarefa;
  _ord?: number;
  atualizado?: string;
}

/** Reunião do coletivo: pauta antes, ata depois, encaminhamentos viram tarefas. */
export interface Reuniao {
  id: string;
  titulo: string;
  /** Data ISO. */
  data: string;
  /** Hora (ex. "19:00"). */
  hora: string;
  recorrencia: string;
  /** Próxima ocorrência (data ISO), para recorrentes. */
  proxima?: string;
  local: string;
  participanteIds: string[];
  /** Convidados externos (e-mails). */
  emailsExtra: string[];
  pauta: string[];
  ata: string;
  status: "agendada" | "realizada";
  _ord?: number;
  atualizado?: string;
}

/** Pessoa da equipe do coletivo (quem recebe tarefas e convites de reunião). */
export interface PessoaEquipe {
  id: string;
  /** Nome artístico / como é chamado(a). */
  nome: string;
  nomeCompleto?: string;
  email?: string;
  rg?: string;
  cpf?: string;
  /** Data de nascimento ISO. */
  nascimento?: string;
  funcoes: string[];
  _ord?: number;
  atualizado?: string;
}

/** Colaborador de elenco (músicos e técnicos que entram nos editais). */
export interface Colaborador {
  id: string;
  nome: string;
  nomeCompleto?: string;
  funcao: string;
  email?: string;
  rg?: string;
  cpf?: string;
  nascimento?: string;
  bio: string;
  /** Situação dos documentos: "ok" | "pend". */
  docsStatus: string;
  _ord?: number;
  atualizado?: string;
}

/** Contato externo (patrocinador, órgão, responsável por edital). */
export interface Contato {
  id: string;
  nome: string;
  tipo: string;
  /** Referência (edital, empresa...). */
  ref: string;
  contato: string;
  _ord?: number;
  atualizado?: string;
}

/** Documento na lixeira: o registro original (de qualquer coleção) mais as
    etiquetas de onde veio, quando e quem excluiu. 30 dias para restaurar. */
export interface ItemLixeira {
  id: string;
  /** Coleção de origem ("editais", "rascunhos", "regras"...). */
  _de: string;
  _apagadoEm: string;
  _apagadoPor: string;
  /** Agrupa o que caiu junto numa exclusão em cascata (o Desfazer restaura o lote). */
  _lote: string;
  [campo: string]: unknown;
}

/** As oito coleções do Painel, na ordem de exibição (v3: sem candidaturas). */
/** Quem assina inscrições: empresa, MEI, pessoa física ou coletivo representado.
    Sem CPF, RG nem dados bancários (regra r24): esses ficam no Drive. */
export interface Proponente {
  id: string;
  nome: string;
  /** Um dos perfis jurídicos (PF, MEI, PJ com/sem fins, coletivo representado por PF). */
  perfil: string;
  /** Situação do cadastro: confirmado com a pessoa ou empresa, ou ainda a confirmar. */
  situacao: "confirmado" | "a_confirmar";
  /** Só de empresa ou MEI. */
  cnpj: string;
  /** Data de abertura do CNPJ (AAAA-MM-DD): vários editais exigem tempo mínimo. */
  abertura: string;
  cnae: string;
  municipio: string;
  /** Quem assina pela empresa ou representa o coletivo. */
  representante: string;
  /** E-mail ou telefone de contato para a inscrição. */
  contato: string;
  obs: string;
  _ord?: number;
  atualizado?: string;
}

export interface DadosPainel {
  artistas: Artista[];
  projetos: Projeto[];
  editais: Edital[];
  tarefas: Tarefa[];
  equipe: PessoaEquipe[];
  elenco: Colaborador[];
  contatos: Contato[];
  reunioes: Reuniao[];
  proponentes: Proponente[];
}

export type ColecaoPainel = keyof DadosPainel;
