# Contrato entre uma página própria e a Central

O que uma página em `src/paginas/<slug>/` pode usar da camada compartilhada, com a assinatura real (conferida no código em 15/10/2026) e onde ver um uso. Tudo que está fora desta lista é mudança de escopo: parar e perguntar.

## `services/banco.ts`: o `Banco`
Tempo real, offline, autoria e log de graça. Tudo passa por ele; nenhuma página fala com o Firestore direto (a única exceção aceita no projeto é `lib/simulador/versoes.ts`, por decisão antiga).

| função | assinatura | uso |
|---|---|---|
| `Banco.modo` | `"nuvem" \| "local"` | saber se há Firebase (modo local = `localStorage` é o banco) |
| `Banco.assinar` | `(colecao: string, cb: (mapa: Record<string, Documento>, confirmado: boolean) => void) => () => void` | coleção inteira, inclusive subcoleção com barra: `Banco.assinar("paginas/" + SLUG + "/cotas", cb)`. `confirmado` = respondeu com dado do servidor (ou modo local). Devolve a função de desligar |
| `Banco.assinarDocumento` | `(colecao: string, id: string, cb: (doc: Documento \| undefined, confirmado: boolean) => void) => () => void` | o documento da página: `Banco.assinarDocumento("paginas", SLUG, cb)`. `undefined` + `confirmado` = a página não existe (hora da semente) |
| `Banco.ler` | `(colecao: string) => Record<string, Documento>` | leitura síncrona do espelho |
| `Banco.gravar` | `(colecao: string, id: string, documento: Documento, rapido = false) => void` | **documento inteiro**, com debounce (800 ms; 50 ms com `rapido`). Espelho e observadores atualizam na hora. Carimba `atualizadoPor` sozinho |
| `Banco.carregarDocumento` | `(colecao, id) => Promise<Documento \| undefined>` | leitura única, sem escuta |
| `Banco.carregarColecao` | `(colecao) => Promise<Record<string, Documento>>` | idem para coleção |
| `Banco.statusAtual` / `Banco.aoMudarStatus` | `() => StatusSalvamento` / `(cb) => () => void` | o indicador "salvo às..." do menu lateral (`useSyncExternalStore`) |
| `Banco.pendente` / `Banco.falhas` | `() => boolean` / `() => FalhaGravacao[]` | gravação em andamento; gravações recusadas |

`Documento = Record<string, unknown> & { id: string }`. Id de documento não aceita barra. Subcoleção: a chave do espelho é a mesma string com barras (`paginas/caminhosdoforro/cadastro`); no `localStorage` (`central-coletivo-local-v1`) tudo fica em `colls`.

Uso de referência: `src/paginas/caminhosdoforro/dados.ts` (página + 10 subcoleções, sem a Central) e `src/paginas/sambadeponta/dados.ts` (página + subcoleção `edicoes` + coleções da Central).

## `store/central.ts`: o estado da Central
| função | assinatura | uso |
|---|---|---|
| `iniciarDados` | `(colecoes?: ColecaoPainel[]) => void` | a página liga **só** as coleções da Central que usa: `iniciarDados(["tarefas", "equipe", "contatos", "projetos"])`. Idempotente. Com subconjunto, liga essas mais `presets` e nada de semente da Central, `pronto`, rascunhos ou Contexto |
| `usarCentral` | `() => EstadoCentral` | hook; `estado.painel.<colecao>` (listas ordenadas por `_ord`), `estado.presets` |
| `obterEstado` | `() => EstadoCentral` | leitura fora de componente (semente, sincronização de totais) |
| `assinarEstado` | `(cb: () => void) => () => void` | reagir a mudança do estado fora de componente |
| `colecaoConfirmada` | `(colecao: string) => boolean` | gate da semente: `["equipe", "contatos", "projetos", "presets"].every(colecaoConfirmada)` |
| `presetFesta` | `() => PresetFesta` | o preset de página tipo festa (padrão do código enquanto o banco não tem) |
| `paginaRegistrada` / `tituloDaPagina` | `(slug: string) => PaginaPropria \| undefined` / `(slug: string) => string` | o registro e o título de uma página anexo pelo slug |
| `paginaDoProjeto` | `(p: Projeto) => { slug, titulo } \| undefined` | a página anexo para a qual um projeto aponta (`Projeto.paginaSlug`) |

`ColecaoPainel = "artistas" | "projetos" | "editais" | "tarefas" | "equipe" | "elenco" | "contatos" | "reunioes" | "proponentes"`. `paginas` e `presets` ficam fora de `COLECOES_PAINEL`: não entram em `pronto`, export/import, CSV nem busca global (decisão de 30/09).

## `store/mutacoes.ts`: gravar nas coleções da Central
Nunca `Banco.gravar` direto numa coleção da Central; por aqui vêm `_ord`, `atualizado`, lixeira e Desfazer.

| função | assinatura |
|---|---|
| `salvarRegistro` | `(colecao: ColecaoPainel, registro: RegistroPainel, rapido = true) => void` |
| `excluirRegistro` | `(colecao: ColecaoPainel, id: string) => void` (vai para a lixeira; excluir projeto leva as tarefas `proj:` e o rascunho dele; uma página anexo nunca vai junto) |
| `porId` | `(colecao, id) => registro \| undefined` |

Uso de referência: `sambadeponta/dados.ts` (`salvarRegistro("tarefas", ...)`; os totais a página grava no próprio documento com `alterarPagina`).

## `services/sessao.ts`, `components/Toast.tsx`, `utils/index.ts`
- `usarSessao(): { carregando: boolean; usuario: User | null }`; `sair(): Promise<void>`; `emailSessao(): string`.
- `toast(texto: string, opcoes?: { acao?: { rotulo: string; fazer: () => void } })`; `copiarComAviso(texto, mensagem?)`; o componente `<Toast />` vai na casca da página.
- `uid(prefixo: string)` → `"t-k2x9pq"`; `clonar(x)`; `slug(s)`; `BRL(n)`; `num(v)`; `dinheiro(v)`; `formatarData(iso)`; `comparar` (collator pt-BR); `baixarArquivo(nome, conteudo, tipo?)`; `copiar(texto)`.

## Tipos (`src/types/`)
- `Tarefa { id, titulo, respId, origem, prazo, obs, status: "fazer" | "and" | "feito", edicaoId?, fase?, _ord?, atualizado? }`. `origem` = `"pagina:<slug>"` (a Central mostra "Página · <título>"). Constantes: `STATUS_TAREFA`, `ROTULO_TAREFA`.
- `Contato { id, nome, tipo, ref, contato, obs?, _ord?, atualizado? }`. Fornecedor = `tipo: "Fornecedor"`, `ref` = o serviço.
- `PessoaEquipe { id, nome, nomeCompleto?, email, funcoes[], ... }` (há `rg`/`cpf`: a página não os lê nem mostra).
- `ResumoEdicao { id, nome, data, status: "planejada" | "execucao" | "fechada", previsto, contratado, pago, realizado, receita, resultado }` (`types/paginas.ts`): os totais por unidade, que a página grava no próprio documento (`paginas/<slug>.resumo`). A Central não recebe nada da página; `Projeto.resumoEdicoes` é legado.
- `Projeto.paginaSlug?: string`: o projeto aponta para a página anexo a que pertence; a página lista esses projetos (`painel.projetos.filter((p) => p.paginaSlug === SLUG)`).
- `PaginaPropria { slug, tipo, titulo }` e `PresetPaginas { id: "paginas", paginas: PaginaPropria[] }` (`types/presets.ts`); `projetoId` é legado. `PresetFesta` é o exemplo de preset por tipo.
- Especificações de formulário (`src/forms/especificacoes/*.ts`, `EntidadeSpec`): a lista de campos de cada entidade da Central; o guia de importação (`store/modelosImportacao.ts`, `camposDe`) sai dela. É a fonte do vocabulário das diretrizes.

## Storage (só se a página tiver arquivos)
`services/firebase.ts` exporta `armazenamento` (null em modo local). Caminho `paginas/<slug>/...`; regra já publicada. Uso de referência: `caminhosdoforro/arquivos/armazenamento.ts` (`enviarArquivo`, `apagarArquivo`, `temStorage`).

## Tailwind
A Central: `tailwind.config.js` na raiz e `src/styles/central.css` com `@source not "../paginas"`. A página: `tailwind.config.js` e `estilos.css` próprios com `prefix(<xxx>)` e `@source "./"`; cores como tokens `var(--xxx-…)` com valor claro e escuro no CSS, então as classes não precisam de `dark:`. Um breakpoint só (`md`). A base da página entra na camada `legado` (declarada em `central.css` para isso). Uso de referência: `caminhosdoforro/estilos.css` e `caminhosdoforro/tailwind.config.js`.

## O que nunca se toca a partir de uma página
`firestore.rules`, `storage.rules`, `.env`, `services/banco.ts`, `store/central.ts`, `store/mutacoes.ts`, `App.tsx`, `styles/central.css`, qualquer tela em `src/pages/` (exceto a linha de registro em `paginasProprias.ts`). Mecanismos de correção (lixeira, migração) idem.
