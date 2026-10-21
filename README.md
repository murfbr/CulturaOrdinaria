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
| `paginas`      | páginas anexo, uma por slug. `paginas/pontadelanca` tem a subcoleção `edicoes` (até 21/10/2026 a chave era `sambadeponta`; a página copiou os dados e o documento antigo ficou marcado com `migradoPara`); `paginas/caminhosdoforro` tem `cadastro`, `espacos`, `cotas`, `patrocinios`, `parceiros`, `orcamento_itens`, `slots`, `tarefas`, `arquivos` e `comentarios`. Só a página lê |

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

### Páginas anexo

Página anexo é um projeto ou braço contínuo do coletivo, sem prazo para acabar,
com página de gestão própria em `/<slug>/` (a seção Projetos é para o que tem
início, meio e fim). Mesmo login e mesmo banco, casca própria, tudo em
`src/paginas/<slug>/` (com `tailwind.config.js` e `estilos.css` próprios); o
slug entra em `src/pages/paginasProprias.ts` e o registro (slug, tipo, título)
em `presets/paginas`. Na Central, o ambiente **Páginas anexo** tem as abas
Geral (um cartão por página), Modelo (como montar uma página nova) e uma aba
por página, que abre a página. A página não pertence a projeto; um projeto da
Central pode apontar para a página anexo a que pertence (ficha → Dados do
projeto → Página anexo, campo `paginaSlug`), e excluir o projeto não toca a
página. As tarefas de uma página são documentos de `tarefas` com o vínculo
`pagina:<slug>`, que a Central mostra como "Página · <título>".

- **Ponta de Lança** (`/pontadelanca/`, pasta `src/paginas/pontadelanca/`, dados em
  `paginas/pontadelanca`; o antigo `/sambadeponta/` redireciona em definitivo pelo
  `vercel.json` em produção e pelo `App.tsx` no servidor de desenvolvimento; as classes
  de estilo seguem com o prefixo `sdp`, a marca do Samba de Ponta): edições da
  festa, orçamento e fases. Veste o design system da festa (Verde Bandeira,
  Marfim, Marrom Terra, Pistache, Turquesa; títulos na Better Faster, com a
  Permanent Marker até a licença web; assinatura e listras em
  `public/pontadelanca/`). Cada edição abre em abas (Resumo, Decisões,
  Financeiro, Operação, Tarefas, Comunicação, Fechamento) e cada aba tem
  endereço próprio para mandar o link (`/pontadelanca/#e02/financeiro`); o
  `index.html` da página guarda esse hash antes do script da Central, que
  reescreve a URL ao carregar.
  O que a Central já tem, a página usa e não repete: as tarefas de cada edição
  são documentos de `tarefas` (origem `pagina:pontadelanca`, campos `edicaoId` e
  `fase`) e aparecem no quadro, no Resumo e na agenda como "Página · Ponta de
  Lança" (as gravadas antes com `proj:p7` são regravadas na primeira abertura
  da página); os fornecedores são `contatos` do tipo Fornecedor, e a linha de
  custo aponta `contatoId`; o nome da festa é o título do registro. Os totais
  por edição a página grava no próprio documento (`paginas/pontadelanca`, campo
  `resumo`) a cada mudança; a Central não lê. O detalhe fica em
  `paginas/pontadelanca` e na subcoleção `edicoes`. A primeira abertura semeia
  esses documentos a partir do JSON do artefato original; se a chave antiga
  (`paginas/sambadeponta`) existir, a página copia dela em vez de semear, e o
  documento antigo fica, marcado com `migradoPara`. Cada edição tem a seção **Decisões e
  urgências**, logo depois do Resumo: as decisões (`decisoes`, com opções,
  prós e contras) e quem avisar (`avisos`) ficam no documento da edição; as
  urgências não são uma lista à parte, são tarefas da Central fixadas pelo id
  (`urgentes`), criadas ali, marcadas com a estrela na seção Tarefas ou escolhidas
  em "Fixar tarefa da Central" (vale qualquer tarefa aberta da Central, também as da
  agenda da semana, que seguem sem fase nem edição). O dia
  da semana sai da data (o campo `diaSemana` dos documentos antigos é ignorado).
- **Caminhos do Forró** (`/caminhosdoforro/`): página independente do festival
  (cadastro geral, patrocínios e cotas, orçamento com simulador, programação,
  tarefas por GT, arquivos, configuração). Todos os dados ficam nas
  subcoleções de `paginas/caminhosdoforro`; nada entra nas coleções da Central.

As regras do Firestore usam o coringa recursivo `{document=**}` para alcançar as
subcoleções.

**Como nasce uma página nova.** Quem vai cuidar da frente (um evento, uma
captação, um caderno) monta um protótipo no Claude da própria conta, seguindo
[docs/diretrizes-pagina-anexo.md](docs/diretrizes-pagina-anexo.md), que a aba
Modelo de Páginas anexo entrega junto com o prompt: a pessoa anexa o arquivo no
chat e vai construindo aos poucos, e o roteiro faz o protótipo nascer com os
campos da Central e com dois botões, "Baixar a base em JSON" e "Ficha de
entrega". Ela envia o link do artefato, o JSON e a ficha; a equipe técnica
verifica e transforma em página com a skill `pagina-propria`
(`.claude/skills/pagina-propria/`, carregada pelo Claude Code ao abrir o
repositório: passo 0 de verificação, estrutura no banco, pasta fazendo igual o
forró, os cinco toques fora da pasta, semente, teste e fechamento).

**Backup das páginas.** A aba Backup de Páginas anexo baixa, na hora, a base de
cada página em JSON (o documento da página em `config` e cada subcoleção como
id → registro, as subcoleções declaradas no registro em código), no mesmo
formato das diretrizes; serve de cópia e de semente. O Exportar da Central
continua cobrindo só as coleções do coletivo; os arquivos do Storage ficam fora.

### Acessos: módulos por conta, master acima de tudo

O login continua sendo criado no console do Firebase (Authentication → Users), mas
o que cada login abre está no banco: a coleção `usuarios`, um documento por conta
com o id igual ao e-mail em minúsculas, a marca `master` e a lista `modulos`.
Módulo é um item do menu: `painel`, `cadastros`, `projetos`, `agenda`, `gestao`,
`contexto`, `nucleo` e `pagina:<slug>` para cada página anexo. Tem o módulo, abre e
edita; não tem, não aparece. Master passa por cima da lista: abre e grava em tudo,
inclusive nos módulos criados depois. A tela **Acessos** (ambiente Núcleo do
Coletivo, módulo `nucleo`) é uma linha por conta com uma caixa por módulo; o
"+ Conta" preenche as caixas por um perfil (master, coordenador, captador,
cliente). Contas não se apagam: desativam. A última master ativa não se rebaixa.

Como o site e o banco aplicam a lista (`src/types/acesso.ts`, `src/services/acesso.ts`,
`firestore.rules`, `storage.rules`):

- O site lê `usuarios/<e-mail>` assim que o login muda e escolhe a casca: a
  Central (quem tem algum módulo dela), **Suas páginas** (quem só tem páginas
  anexo: cliente, captador) ou **sem acesso** (conta sem documento ou desativada).
  Menu, abas, a seção Páginas anexo e a busca só mostram o que a conta tem; um
  endereço de ambiente que a conta não tem volta para o primeiro permitido.
- Gravar numa coleção pede o módulo dono dela (tabela `MODULOS_DA_COLECAO`, a mesma
  das regras): Cadastros grava artistas, proponentes, editais, formulários, equipe,
  elenco e contatos; Projetos grava projetos, respostas e versões; Agenda e Gestão
  gravam tarefas, reuniões e semanas; Contexto grava fichas, regras e julgamentos;
  cada página grava os próprios dados (e o Ponta de Lança, tarefas e contatos). O
  `Banco` recusa na hora, com aviso, o que a lista não permite; as regras recusam
  também. Exportar pede o módulo Gestão; Importar é só de master.
- Quem tem qualquer módulo da Central lê o banco do coletivo inteiro, porque as
  telas cruzam os nomes o tempo todo. `nucleo` e `usuarios` são as únicas coleções
  de leitura restrita (módulo Núcleo); ficam fora da lixeira comum, do log, do
  Exportar, da busca e da cópia local do navegador.
- Quem não tem módulo da Central não lê nada do coletivo: só `presets` e as páginas
  marcadas. Página que lê a Central (hoje o Ponta de Lança, registro `leACentral`)
  não abre para essas contas; a tela Acessos avisa.
- Modo local (sem Firebase): a conta é master; para simular outra lista, grave no
  `localStorage` a chave `central-acesso-teste`, por exemplo
  `{"master":false,"modulos":["agenda","pagina:caminhosdoforro"]}`.

**Primeira linha e recuperação.** As regras exigem a linha em `usuarios` até para
criar linhas (módulo Núcleo ou master), então conta sem linha vê "Sem acesso" e
só quem tem o Núcleo a cria. Num banco novo, ou se a coleção ficar sem nenhuma
conta master ativa, a primeira linha master se cria à mão no console: documento
`usuarios/<e-mail em minúsculas>` com `ativo: true`, `master: true` e
`modulos: []`. A transição de 22/10/2026 (tolerância para conta sem linha
enquanto não existia linha master, com a tela Acessos dizendo quando publicar as
regras) acabou quando as regras entraram. Naquele dia elas tinham sido publicadas
antes das linhas e trancaram o banco para todo mundo até as antigas voltarem, por
isso regras novas só entram com o site que as entende no ar e as linhas criadas.

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
    pontadelanca/          ← página da festa: casca, menu, edição/, festa/, calculo, dados, semente
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
