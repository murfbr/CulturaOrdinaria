# Central do Coletivo

Site de gestão do coletivo cultural. Seis ambientes: **Painel** (resumo,
pendências e revisão das fichas dos artistas), **Cadastros** (artistas,
proponentes, editais do Mapa dos Editais, os formulários mapeados e a aba
Pessoas com elenco, equipe e contatos externos), **Agenda** (cronograma e
calendário),
**Gestão** (reuniões, tarefas, lixeira e migração), **Projetos**
(o lugar de trabalho: cada projeto é uma candidatura, com o formulário do
edital, a transferência para a plataforma oficial, o pipeline por status e o
banco de textos) e **Contexto** de escrita (fichas, regras e julgamentos)
para redigir propostas com IA. Fora da Central, no mesmo login e no mesmo
banco, ficam as **páginas próprias** de projeto: `/pontadelanca/` (a festa
Ponta de Lança) e `/caminhosdoforro/` (o festival).

> **Versão 3 (set/2026).** O conceito de candidatura saiu: cada projeto já é
> uma candidatura, nasce ligado a um formulário mapeado (e ao edital dele) ou
> Livre, e o status do projeto é o antigo pipeline de captação. O Simulador
> virou a aba Formulário de cada projeto. Para migrar um banco antigo, veja
> [docs/MIGRACAO-V3.md](docs/MIGRACAO-V3.md).

Nasceu como versão site do artefato "Central do Coletivo", com os mesmos dados
e os mesmos nomes de campos, em **React + TypeScript + Firebase**. Desde
out/2026 o visual é próprio, em Tailwind (barra lateral, um `tailwind.config.js`
por identidade: o da Central na raiz, o de cada página própria na pasta dela).

## Rodar localmente

```bash
npm install
npm run dev
```

Sem Firebase configurado o site roda em **modo local**: tudo fica salvo no
navegador (localStorage), sem login — bom para desenvolver. Na primeira abertura
o banco é semeado com os dados extraídos do artefato (16 artistas,
17 editais, 17 candidaturas convertidas em projetos, 28 formulários...).
A semente não traz CPF, RG nem data de nascimento de ninguém.

## Ligar o Firebase (modo nuvem)

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com).
2. **Firestore Database** → Create database (production mode).
3. **Rules**: cole o conteúdo de [firestore.rules](firestore.rules) e publique.
4. **Authentication** → Sign-in method → habilite **Email/Password**.
5. **Authentication** → Users → **Add user** para cada pessoa do coletivo
   (não há auto-cadastro de propósito: só entra quem for cadastrado ali).
6. **Configurações do projeto** → Seus apps → Web (`</>`): copie as credenciais.
7. Copie `.env.exemplo` para `.env` e preencha as variáveis `VITE_FIREBASE_*`.

Com o `.env` preenchido, `npm run dev` já abre com tela de login, dados
sincronizados em tempo real entre todo mundo e cache offline (o site funciona
sem internet e sincroniza quando ela volta).

## Publicar na Vercel

1. Suba o repositório para o GitHub e importe na Vercel (framework: **Vite**).
2. Em **Settings → Environment Variables**, cadastre as mesmas `VITE_FIREBASE_*` do `.env`.
3. Deploy. (Build: `npm run build`, output: `dist` — a Vercel detecta sozinha.)

Cada página própria tem um `index.html` na raiz do repositório
(`pontadelanca/`, `caminhosdoforro/`) só para a prévia de link (Open Graph);
o site em si é o mesmo bundle.

## Estrutura de dados (Firestore)

Coleções planas, uma por entidade — cada registro é um documento cujo campos
usam **os mesmos nomes do artefato**:

| Coleção        | O que é                                           |
| -------------- | ------------------------------------------------- |
| `artistas`     | blocos, rodas e grupos do portfólio               |
| `proponentes`  | quem assina a inscrição (PF, MEI, PJ, coletivo representado): perfil, CNPJ, abertura, situação. O projeto aponta `proponenteId`; "Consultar CNPJs" busca os dados na Receita |
| `projetos`     | cada projeto é uma candidatura (→ `artistaIds[]`, `editalId`, `formId`, `rascunhoId`, `proponenteId`, `status`) |
| `editais`      | editais e fontes, com os campos do Mapa dos Editais (critérios, linhas, lacunas, alertas, campos do formulário) |
| `candidaturas` | só no formato antigo (v2): a migração v3 converte em projetos e esvazia |
| `tarefas`      | tarefas da equipe (→ `respId`, `origem`; `edicaoId` e `fase` quando é de uma edição de página própria) |
| `equipe`       | pessoas do coletivo (contém CPF/RG — ver LGPD)    |
| `elenco`       | músicos e técnicos que entram nos editais (contém CPF/RG — ver LGPD) |
| `contatos`     | contatos externos (tipo Fornecedor: quem a festa contrata) |
| `reunioes`     | reuniões, pauta e ata                             |
| `rascunhos`    | respostas de cada projeto no formulário dele (`valores`, `status`, `notas`; `ref` = id do projeto) |
| `formularios`  | definições dos formulários, com `origem` ("chrome" = extraído da plataforma; "documento" = reconstruído do espelho/regulamento), importáveis em Cadastros → Formulários sem deploy |
| `backup_v2`    | cópia dos projetos e candidaturas do formato antigo, gravada pela migração v3 |
| `lixeira`      | excluídos com 30 dias para restaurar (chave `colecao__id`, com `_de`/`_apagadoEm`/`_apagadoPor`/`_lote`) |
| `log_alteracoes` | quem mudou o quê, uma linha por gravação, 90 dias; alimenta a aba Histórico de cada registro (ver [docs/AUTORIA-E-LOG.md](docs/AUTORIA-E-LOG.md)) |
| `versoes`      | fotografias automáticas dos rascunhos (fora do espelho; lidas sob demanda no modal Versões) |
| `fichas`       | Contexto: conhecimento de escrita (id = id do Painel) |
| `regras`       | Contexto: regras com fonte obrigatória            |
| `julgamentos`  | Contexto: pareceres e lições                      |
| `presets`      | presets do sistema, lidos por todo mundo no login: `festa` (fases, categorias de custo, naturezas de máquina, formatos de peça) e `paginas` (registro das páginas próprias: slug, projeto, tipo, título) |
| `paginas`      | páginas próprias de projeto, uma por slug. `paginas/sambadeponta` tem a subcoleção `edicoes`; `paginas/caminhosdoforro` tem `cadastro`, `espacos`, `cotas`, `patrocinios`, `parceiros`, `orcamento_itens`, `slots`, `tarefas`, `arquivos` e `comentarios`. Só a página lê |

Detalhes que diferem do artefato (por limitação do Firestore, que não aceita
array dentro de array): as tuplas viraram arrays de objetos —
`producao: [{texto, status}]`, `det.portfolio: [{ano, texto}]`,
`det.docs: [{nome, status}]`, `det.links: [{rotulo, url}]`,
`vocabulario: [{usar, evitar}]`, `usados: [{texto, onde, quando}]`,
`licoes: [{texto, regra}]`. O importador converte os dois sentidos: o `.json`
exportado do artefato entra direto pelo botão **Importar**.

Campos de manutenção: `_ord` (posição na listagem), `atualizado` (ISO da última
gravação, usado no último-ganha da sincronização) e `atualizadoPor` (e-mail de
quem gravou por último).

### Importar, exportar e histórico

**Exportar** baixa um `.json` com as coleções da Central (as páginas próprias
ainda ficam fora; o forró tem o botão próprio em Configuração → Dados na base).
**Importar** aceita o pacote completo, o formato antigo (v2 e o do artefato) e
também um JSON sem envelope com uma coleção só; antes de gravar mostra a
conferência (o que entra, o que muda) e a prévia por portal. O **Guia de
importação** mostra, por coleção, os campos aceitos (a mesma lista do modal de
edição) e um modelo para copiar, em JSON e CSV. Gravações recusadas pelo banco
ficam visíveis no menu da conta, e cada registro tem a aba **Histórico**, lida
de `log_alteracoes`.

### Páginas próprias de projeto

Um projeto pode ter uma página de gestão própria, em `/<slug>/`. Mesmo login e
mesmo banco, casca própria, tudo em `src/paginas/<slug>/` (com `tailwind.config.js`
e `estilos.css` próprios); o slug entra em `src/pages/paginasProprias.ts` e o
registro em `presets/paginas`.

- **Ponta de Lança** (`/pontadelanca/`; o antigo `/sambadeponta/` redireciona pelo
  `vercel.json`, e a chave dos dados no banco continua `sambadeponta`; não trocar o
  slug em `presets/paginas`, que é o caminho dos dados e da exclusão do projeto): edições da
  festa, orçamento e fases. Veste o design system da festa (Verde Bandeira,
  Marfim, Marrom Terra, Pistache, Turquesa; títulos na Better Faster, com a
  Permanent Marker até a licença web; assinatura e listras em
  `public/pontadelanca/`). Cada edição abre em abas (Resumo, Decisões,
  Financeiro, Operação, Tarefas, Comunicação, Fechamento) e cada aba tem
  endereço próprio para mandar o link (`/pontadelanca/#e02/financeiro`); o
  `index.html` da página guarda esse hash antes do script da Central, que
  reescreve a URL ao carregar.
  O que a Central já tem, a página usa e não repete: as tarefas de cada edição
  são documentos de `tarefas` (origem `proj:<id>`, campos `edicaoId` e `fase`)
  e aparecem no quadro, no Resumo e na ficha do projeto; os fornecedores são
  `contatos` do tipo Fornecedor, e a linha de custo aponta `contatoId`; o nome
  da festa é o nome do projeto. Os totais por edição a página grava no projeto
  (`resumoEdicoes`) a cada mudança: a ficha do projeto mostra o bloco Edições
  e o cartão, a próxima edição. O detalhe fica em `paginas/sambadeponta` e na
  subcoleção `edicoes`. A primeira abertura semeia esses documentos a partir
  do JSON do artefato original. Cada edição tem a seção **Decisões e
  urgências**, logo depois do Resumo: as decisões (`decisoes`, com opções,
  prós e contras) e quem avisar (`avisos`) ficam no documento da edição; as
  urgências não são uma lista à parte, são tarefas da Central fixadas pelo id
  (`urgentes`), criadas ali ou marcadas com a estrela na seção Tarefas. O dia
  da semana sai da data (o campo `diaSemana` dos documentos antigos é ignorado).
- **Caminhos do Forró** (`/caminhosdoforro/`): página independente do festival
  (cadastro geral, patrocínios e cotas, orçamento com simulador, programação,
  tarefas por GT, arquivos, configuração). Todos os dados ficam nas
  subcoleções de `paginas/caminhosdoforro`; nada entra nas coleções da Central.

As regras do Firestore usam o coringa recursivo `{document=**}` para alcançar as
subcoleções.

**Como nasce uma página nova.** Quem vai gerir o evento monta um protótipo no
Claude da própria conta, seguindo [docs/diretrizes-pagina-de-evento.md](docs/diretrizes-pagina-de-evento.md):
a pessoa anexa o arquivo no chat e vai construindo aos poucos, e o roteiro faz o
protótipo nascer com os campos da Central e com dois botões, "Baixar a base em
JSON" e "Ficha de entrega". Ela envia o link do artefato, o JSON e a ficha; a
equipe técnica verifica e transforma em página com a skill `pagina-propria`
(`.claude/skills/pagina-propria/`, carregada pelo Claude Code ao abrir o
repositório: passo 0 de verificação, estrutura no banco, pasta fazendo igual o
forró, os cinco toques fora da pasta, semente, teste e fechamento).

### Caminhos do Forró: tarefas e o plano de ação por GTs

Na página do festival, a aba Tarefas é o plano de ação da
equipe. Cada tarefa (documento de `paginas/caminhosdoforro/tarefas`) tem, além
de título, núcleo, responsável, prazo, status e anotações, os campos do plano:
`codigo` (o ID, "ART-001"), `frente`, `prioridade` (crítica, alta, média ou
baixa; `urgente` segue gravado por compatibilidade), `dependencia` e `entrega`.
O núcleo é o Grupo de Trabalho e guarda o `escopo`.

**Importar plano** lê a planilha da equipe (.xlsx ou .csv) no navegador, sem
biblioteca, achando a tabela pelo cabeçalho (ID e Tarefa são obrigatórias).
Antes de gravar, mostra a prévia: tarefas novas, atualizadas, sem mudança e as
que estão na Central e não na planilha (só são apagadas se a pessoa marcar).
Reimportar não duplica nem atropela a equipe: cada tarefa guarda dois retratos
da última importação (`planilha`, o texto das células, e `importado`, o que foi
gravado a partir dele), então só entra o que mudou na planilha, coluna que não
veio não mexe em nada, e o que mudou dos dois lados aparece como conflito (vale
a Central, a não ser que se escolha a planilha). **Baixar planilha** devolve as
tarefas no mesmo formato. O cadastro geral tem o mesmo importar por tela, com
as colunas da própria lista.
O código está em `src/paginas/caminhosdoforro/tarefas/` (`xlsx.ts` lê o arquivo,
`plano.ts` compara, `ModalImportarPlano.tsx` mostra e grava) e em
`src/paginas/caminhosdoforro/importar/`.

## Mapa do código

Estrutura padrão de projeto React: `components` (UI compartilhada), `pages`
(uma tela por arquivo, as telas da Central), `paginas` (as páginas próprias,
uma pasta por slug), `forms` (especificações de formulário por entidade),
`services` (integrações), `store` (estado global), `lib` (regras de negócio
puras), `types`, `utils`, `data` e `styles`.

```
src/
  main.tsx / App.tsx       ← entrada e casca (login, aviso, layout, roteadores, limite de erro)
  components/
    ui/                    ← blocos visuais em Tailwind (Botao, Painel, Badge, Tabela, Modal...)
    layout/                ← BarraLateral, CabecalhoPagina, ModalGravacoes
    ferramentas/           ← ModalExportar, ModalImportar, GuiaImportacao
    Modal.tsx, BotaoExcluir.tsx, ModalExclusao.tsx, BlocoEditavel.tsx, Filtros.tsx
    BuscaGlobal.tsx        ← paleta de busca em tudo (Ctrl+K)
    Historico.tsx          ← aba Histórico (log de alterações) de um registro
    LimiteDeErro.tsx       ← um erro de tela derruba só a tela, não a casca
    CabecalhoSecao.tsx, Toast.tsx
  forms/
    especificacoes/        ← um arquivo por entidade (artista.ts, edital.ts, proponente.ts...)
    FormularioRegistro.tsx ← o modal Novo/Editar que desenha qualquer entidade
    CampoDoFormulario.tsx  ← render de um campo da especificação
  pages/
    Login.tsx, RoteadorPainel.tsx, paginasProprias.ts
    painel/                ← Resumo, Pendencias, RevisaoArtistas
    cadastros/
      artistas/            ← ListaArtistas, FichaArtista (Geral com pendências, Marca, Contexto, Projetos)
      proponentes/         ← ListaProponentes, ModalConsultaCnpj
      editais/             ← ListaEditais, Panoramas (o que pontua, campos, lacunas, alertas), FichaEdital
      formularios/         ← ListaFormularios (com as plataformas), FichaFormulario, ModalImportarFormulario
      pessoas/             ← Pessoas (sub-abas), Elenco, Equipe, Contatos (eram o ambiente Pessoas até 15/10/2026)
    agenda/                ← Cronograma, Calendario
    gestao/                ← Reunioes, FichaReuniao, QuadroTarefas, Lixeira, Migracao
    projetos/              ← Projetos (roteador), VisaoGeral, Pipeline, BancoTextos, FichaProjeto,
                             GeralProjeto (+ Dados, Documentos, Interno, Tarefas), EdicoesDoProjeto,
                             ContextoProjeto, ModalNovoProjeto, Transferencia
      formulario/          ← Formulario, LateralEtapas, Campo, Contador, ModalVersoes, ModalReaproveitar
        campos/            ← um componente por tipo de campo (texto, rádio, docs...)
      orcamento/           ← PlanilhaOrcamento, LinhaPlanilha, ResumoOrcamento, BarraTotais
    contexto/              ← Contexto, Geral, Fichas, Regras, ModalRegra,
                             Julgamentos, ModalJulgamento, Trocar, RegrasParaRascunho
  paginas/
    sambadeponta/          ← página da festa: casca, menu, edição/, festa/, calculo, dados, semente
    caminhosdoforro/       ← página do festival: casca, cadastro/, patrocinios/, orcamento/,
                             programacao/, tarefas/, arquivos/, importar/, configuracao/, ui/ próprio
  services/
    firebase.ts            ← conexão (env) — sem env = modo local
    banco.ts               ← camada de armazenamento (Firestore ⇄ localStorage), autor e log
    sessao.ts              ← login e-mail/senha
  store/
    central.ts             ← estado global (usarCentral) + semeadura
    mutacoes.ts            ← salvar/excluir registros, rascunhos e docs do Contexto
    importarExportar.ts    ← pacote .json (v3; v2 e o do artefato são convertidos na hora)
    modelosImportacao.ts   ← campos e modelo por coleção (guia de importação, JSON sem envelope)
    planilha.ts            ← exportação em CSV
    migracao.ts            ← migração v2 → v3 no banco ao vivo, com backup
    vinculos.ts            ← impacto de excluir (o que vai junto)
    navegacao.ts           ← navegação + endereço na URL (#/ambiente/aba/tipo/id)
    edicao.ts
  lib/
    migracao/v3.ts         ← conversão pura v2 → v3 e o pacote de enriquecimento
    simulador/motor.ts     ← motor dos formulários replicados (campos, condições, status)
    simulador/orcamento.ts ← cálculos da planilha Salic
    simulador/validarFormulario.ts ← validação do "Importar formulário"
    simulador/versoes.ts   ← fotografias automáticas dos rascunhos (coleção versoes)
    contexto/              ← consultas de fichas/regras + bloco "Trocar com o Claude"
    busca.ts               ← índice e filtro da busca global
    prazos.ts              ← urgência de prazos (editais, tarefas, reuniões)
    proponentes.ts         ← ler o proponente escrito nos projetos e propor cadastros
    cnpj.ts                ← consulta de CNPJ na Receita
    textos.ts              ← índice do banco de textos
    nomes.ts, agenda.ts, documentos.ts, csv.ts, arrastar.ts
  types/                   ← entidades documentadas (painel, presets, paginas, simulador, contexto)
  data/                    ← catálogos estáticos (Salic, plataformas) + sementes de migração;
                             as definições de formulário vivem no banco (coleção formularios)
  utils/                   ← ids, datas, dinheiro, clipboard, download, classes
  styles/central.css       ← entrada do Tailwind da Central (tokens em tailwind.config.js)
```

## LGPD

A regra do coletivo (r24 no Contexto) diz que CPF, RG e dados bancários ficam
fora da Central: vivem no Drive e só entram no formulário oficial do edital.
Desde out/2026 os formulários de Elenco e Equipe voltaram a ter `rg` e `cpf`,
porque são a base das fichas técnicas dos editais; esses campos entram na
exportação `.json` e na planilha CSV, e as regras do Firestore liberam a leitura
para qualquer conta logada. A redação nova da r24 ainda está pendente. A semente
do repositório não traz esses dados. Se o repositório for público, lembre que o
histórico do Git guarda as versões antigas da semente.
