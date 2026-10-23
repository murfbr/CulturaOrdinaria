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
| `empresas`     | Captação: empresa com CNPJ, setor, site, `pessoas[]` (nome, cargo, telefone, e-mail) e `historico[]` (data, quem, texto) dentro do documento. Separada de `contatos` de propósito: é registro de relacionamento, não agenda |
| `captadoras`   | Captação: parceiras de fora que captam com comissão (nome, contato, área) |
| `portfolio`    | Captação: os projetos que o coletivo oferece às empresas (datas, local, mecanismo, situação, meta, comissão e base). Não é o projeto da Central; a ligação entre os dois é etapa futura |
| `cotas`        | Captação: cotas de patrocínio de um projeto do portfólio (→ `projetoId`; valor e quantidade em branco = variável / sem limite) |
| `referencias`  | Comunicação, Biblioteca: perfil de referência (`rf-`), com o catálogo (Instagram, lógica, marcações), `ultimaLeitura` e `historico[]` (uma linha por rodada) |
| `leiturasReferencias` | Comunicação, Biblioteca: o retrato de um perfil numa rodada (`lr-`): posts da janela, destaques, amostra assistida e notas. Lida um documento por vez; fora do espelho local no modo nuvem |
| `rodadasReferencias` | Comunicação, Biblioteca: a rodada de leitura (`rr-`): síntese que cruza os perfis, grade de campos, método e de onde veio |
| `negociacoes`  | Captação: empresa × projeto × quem capta (→ `empresaId`, `projetoId`, `cotaId`, `captadoraId`; vazio = a equipe), etapa, valor, datas, próximo passo, reserva, motivo, comissão, recebido, paga |
| `rascunhos`    | respostas de cada projeto no formulário dele (`valores`, `status`, `notas`; `ref` = id do projeto) |
| `formularios`  | definições dos formulários, com `origem` ("chrome" = extraído da plataforma; "documento" = reconstruído do espelho/regulamento), importáveis em Cadastros → Formulários sem deploy |
| `backup_v2`    | cópia dos projetos e candidaturas do formato antigo, gravada pela migração v3 |
| `lixeira`      | excluídos com 30 dias para restaurar (chave `colecao__id`, com `_de`/`_apagadoEm`/`_apagadoPor`/`_lote`) |
| `log_alteracoes` | quem mudou o quê, uma linha por gravação, 90 dias; alimenta a aba Histórico de cada registro (ver [docs/AUTORIA-E-LOG.md](docs/AUTORIA-E-LOG.md)) |
| `versoes`      | fotografias automáticas dos rascunhos (fora do espelho; lidas sob demanda no modal Versões) |
| `fichas`       | Contexto: conhecimento de escrita (id = id do Painel) |
| `regras`       | Contexto: regras com fonte obrigatória            |
| `julgamentos`  | Contexto: pareceres e lições                      |
| `presets`      | presets do sistema, lidos por todo mundo no login: `festa` (fases, categorias de custo, naturezas de máquina, formatos de peça), `paginas` (registro das páginas próprias: slug, projeto, tipo, título) e `captacao` (as quatro listas de escolha da Captação: etapas, mecanismos, situação do projeto, base da comissão) |
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

O Ponta de Lança tem o mesmo botão no próprio menu ("Baixar a base em JSON", o
mesmo arquivo que a aba Backup gera; `src/lib/basePagina.ts`); o Caminhos do Forró
tem o dele em Configuração → Dados na base. Na busca Ctrl+K, as páginas anexo que a
conta abre entram como atalho ("Página anexo · Ponta de Lança" abre /pontadelanca/).

O login continua sendo criado no console do Firebase (Authentication → Users), mas
o que cada login abre está no banco: a coleção `usuarios`, um documento por conta
com o id igual ao e-mail em minúsculas, a marca `master` e a lista `modulos`.
Módulo é um item do menu: `painel`, `cadastros`, `projetos`, `agenda`, `gestao`,
`captacao`, `contexto`, `nucleo` e `pagina:<slug>` para cada página anexo. Tem o módulo, abre e
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
  Captação grava empresas, captadoras, portfólio, cotas e negociações;
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
  `{"master":false,"modulos":["agenda","pagina:caminhosdoforro"]}`; para simular o e-mail
  do login (quadro de tarefas e a caixa Minhas tarefas do Resumo), a chave
  `central-email-teste` com o e-mail de alguém da Equipe.

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

### Captação: empresas, portfólio, negociações e captadoras

O ambiente Captação (módulo `captacao`, entrada no menu em Trabalho) é a frente
de patrocínio do coletivo, nascida em 21/10/2026 do artefato "Captação do
Coletivo". Seis abas: **Resumo** (confirmado contra a meta, em negociação,
inventário de cotas e comissões; funil por etapa, andamento por projeto,
próximos passos de 7 dias e a tabela por captadora), **Portfólio** (um cartão
por projeto com as cotas, criadas ali), **Empresas** (cadastro único, com busca
e aviso de duplicidade; a ficha tem dados, pessoas de contato, histórico de
contato e as negociações), **Negociações** (empresa × projeto × quem capta; a
etapa se troca na tabela, e "perdido" pede o motivo), **Captadoras** (carteira,
confirmado e comissão de cada uma) e **Opções** (as listas de escolha, o que há
na base e o botão **Trazer do artefato (JSON)**, que lê o arquivo do botão
"Baixar a base em JSON" do artefato, mostra a conferência e grava; mesmo id grava
por cima). As contas ficam em `src/pages/captacao/calculo.ts` (funções puras):
"confirmado" soma na receita e gera comissão, "perdido" sai das contas, só
projetos "aberto" entram no resumo e no inventário, comissão por projeto com
ajuste por negociação e base a definir (estimativa), sobre o fechado ou sobre o
recebido.

A faixa **Ver como** simula a visão de uma captadora: o que é dela e da equipe
aparece inteiro; de outra captadora, só "em conversa com X". É um filtro do
navegador, não controle de acesso: quem tem o módulo lê o banco inteiro, como
todo módulo da Central. Captadoras de fora com leitura restrita são etapa futura.

Os dados são cinco coleções planas da Central (`empresas`, `captadoras`,
`portfolio`, `cotas`, `negociacoes`) e o preset `presets/captacao`; por isso
Lixeira, histórico por registro, Exportar, Importar por planilha e a busca
Ctrl+K funcionam como para o resto. Projeto do portfólio, cota e captadora usam
o formulário padrão (specs em `src/forms/especificacoes/`); empresa e negociação
têm modais próprios. Excluir passa pelo impacto nos vínculos
(`src/store/vinculos.ts`): empresa leva ou solta as negociações; projeto leva
as cotas e leva ou solta as negociações; cota e captadora só soltam.

**Regras:** as cinco coleções têm bloco próprio em `firestore.rules`
(leitura por módulo da Central, gravação por `captacao`). Publicar as regras
**antes** do deploy do site que as lê: o site antigo ignora coleções que não
conhece; o site novo sem as regras trava em "carregando os dados do coletivo"
porque as escutas são recusadas.

### Comunicação: a Biblioteca de referências

O ambiente Comunicação (módulo `comunicacao`, entrada no menu em Trabalho)
começa pela **Biblioteca**, parte Referências (doc 02 da metodologia de
comunicação, seção 7a): os perfis que o coletivo acompanha pra aprender, lidos
por rodada. Planos, Mailing e Como funciona entram depois, como abas e partes
do mesmo ambiente.

**De onde vêm os dados.** A leitura nasce no artefato vivo "Benchmarking ·
perfis de referência", na conta do Antonio: lá ficam os dados brutos (CSV), as
contas e os textos. Ao fim de cada rodada, a rotina gera o **espelho** (JSON no
formato `biblioteca-referencias/1`) e grava pela vista **Importar** da
Biblioteca (só master), com conferência: rodada, referências novas, posts por
perfil, janela, tamanho de cada leitura, avisos e erros (com erro não grava).
Mesmo id grava por cima; a referência que já existe guarda o que o arquivo não
traz (ex.: `planos`) e o histórico ganha a linha da rodada. A Central não edita
a Biblioteca: corrigir é corrigir no artefato e espelhar de novo.

**O que a tela mostra.** Visão geral (abertura da rodada, um cartão por
referência, "Lado a lado", desempenho por editoria, comentários a cada 100
curtidas, Reels views × curtidas e "Devorar e devolver"), ficha de cada
referência (`#/comunicacao/biblioteca/rf-…`: números da janela, página e
destaques, ciclos de evento numa linha do tempo, o que rende ali, linguagem,
amostra, posts e histórico), todos os posts com filtro e ordem, a amostra
assistida e a grade com o método. Os gráficos são SVG próprios, sem biblioteca.

**As contas** ficam em `src/pages/comunicacao/biblioteca/calculo.ts` (puras) e
são as mesmas do artefato: janela do primeiro post não fixado ao mais recente
da grade; desempenho = curtidas ÷ mediana do mesmo formato no perfil (formato
com menos de 5 posts usa a mediana geral; post com menos de 3 dias fica fora);
curtidas por view só em Reels com views. Mudou lá, muda aqui. Dia relativo ao
evento é D (D-5, Dia, D+1), como no resto da metodologia.

**Carregamento.** As coleções da Biblioteca ficam fora do "carregando os dados
do coletivo": ligam só quando o ambiente abre (`src/store/comunicacao.ts`), e
as leituras vêm uma a uma pelo id. Sem as regras publicadas, só a Biblioteca
avisa "sem acesso"; o resto da Central abre normal. Mesmo assim, publicar as
regras (`firestore.rules`: `central()` com `comunicacao` e os três blocos novos)
antes do deploy. Contas master abrem o ambiente na hora; para as outras, marcar
o módulo Comunicação em Núcleo › Acessos.

### Núcleo do Coletivo: Anotações e ideias, Melhorias, Acessos

O ambiente Núcleo do Coletivo abre só para quem tem o módulo `nucleo` (ou é
master). Tem três abas: **Anotações e ideias** (anotações soltas do Núcleo),
**Melhorias** (o caderno "Melhorias da Central") e **Acessos** (as contas).

A aba Melhorias tem o layout do caderno que nasceu como artefato, agrupado: à
esquerda, Início, Levar ao Gustavo e três seções (Central do Coletivo, Páginas
anexo, Núcleo do Coletivo); as abas-filtro de cada seção são o que existe no
site hoje (os ambientes da Central mais "Transversal"; as páginas anexo do
registro em código; as abas do Núcleo), montadas na tela a partir de
`store/navegacao.ts` e `pages/paginasProprias.ts`; à direita, a seção
escolhida.
Uma melhoria é uma **tarefa** da seção ("+ Tarefa": texto, aba, quem, prazo,
origem e a marca "precisa de código"); a caixa à esquerda marca feita; "só
abertas" e "só código" filtram. Anotações ("+ Anotação") são as notas da seção.
"Início" mostra os números, as próximas tarefas e as últimas anotações; "Levar ao Gustavo" lista
as tarefas abertas que precisam de código, por seção. A estrutura (seções, abas,
status) vive no código (`src/types/caderno.ts`); os itens vivem na coleção
`nucleo`, junto com as anotações, separados pelo campo `tipo`, e ficam fora do
Exportar, do log, da lixeira e da cópia local, como o resto do Núcleo (apagar é
de vez). "Baixar o caderno em JSON" devolve o formato do artefato; "trazer do
artefato (JSON)" importa esse arquivo (as 20 seções antigas viram as abas de hoje,
e o que não tem mais tela vai para a origem do item; registro com o mesmo id é
regravado; status de página, plano da semana e semanas do piloto ficam de fora). As tarefas do caderno não entram nas
Tarefas da Central: é backlog de melhoria, não trabalho da equipe.

**Minhas tarefas no Resumo:** a primeira caixa do Painel → Resumo lista as cinco
primeiras tarefas em aberto da pessoa logada (a da Equipe cujo e-mail de cadastro
é o do login), vencidas primeiro; cada linha abre a tarefa, ✓ conclui, +7d adia,
e "ver todas" leva a Gestão → Tarefas, já na coluna da pessoa. Login fora da
Equipe: a caixa diz o que cadastrar.

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
    comunicacao/           ← Comunicacao (roteador); biblioteca/: Biblioteca, VisaoGeral, FichaReferencia,
                             TabelaPosts, Amostra, Metodo, ImportarBiblioteca, converterEspelho, calculo.ts,
                             dados.ts, graficos/ (PontosEditoria, DispersaoReels, LinhaCiclos)
    captacao/              ← RoteadorCaptacao, FaixaVerComo, Resumo (+ resumo/), Portfolio (+ portfolio/),
                             Empresas, FichaEmpresa (+ empresa/), Negociacoes (+ negociacoes/), Captadoras,
                             Opcoes (+ opcoes/: Listas, ImportarArtefato), calculo.ts (contas puras), visao.ts, apoio.ts
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
    comunicacao.ts         ← coleções da Biblioteca (ligadas ao abrir o ambiente) e a gravação do espelho
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
  types/                   ← entidades documentadas (painel, presets, paginas, simulador, contexto, acesso, caderno, captacao, comunicacao)
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
