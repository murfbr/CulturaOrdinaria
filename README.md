# Central do Coletivo

Site de gestão do coletivo cultural. Sete ambientes: **Painel** (resumo e
pendências), **Cadastros** (artistas, editais do Mapa dos Editais e os
formulários mapeados), **Agenda**, **Pessoas**, **Gestão** (reuniões, tarefas,
lixeira), **Projetos** (o lugar de trabalho: cada projeto é uma candidatura,
com o formulário do edital, a transferência para a plataforma oficial e o
pipeline por status) e **Contexto** de escrita (fichas, regras e julgamentos)
para redigir propostas com IA.

> **Versão 3 (set/2026).** O conceito de candidatura saiu: cada projeto já é
> uma candidatura, nasce ligado a um formulário mapeado (e ao edital dele) ou
> Livre, e o status do projeto é o antigo pipeline de captação. O Simulador
> virou a aba Formulário de cada projeto. Para migrar um banco antigo, veja
> [docs/MIGRACAO-V3.md](docs/MIGRACAO-V3.md).

É a versão site do artefato "Central do Coletivo", com os mesmos dados, o mesmo
visual e os mesmos nomes de campos — agora com **React + TypeScript + Firebase**.

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

## Estrutura de dados (Firestore)

Coleções planas, uma por entidade — cada registro é um documento cujo campos
usam **os mesmos nomes do artefato**:

| Coleção        | O que é                                           |
| -------------- | ------------------------------------------------- |
| `artistas`     | blocos, rodas e grupos do portfólio               |
| `projetos`     | cada projeto é uma candidatura (→ `artistaIds[]`, `editalId`, `formId`, `rascunhoId`, `status`) |
| `editais`      | editais e fontes, com os campos do Mapa dos Editais (critérios, linhas, lacunas, alertas, campos do formulário) |
| `candidaturas` | só no formato antigo (v2): a migração v3 converte em projetos e esvazia |
| `tarefas`      | tarefas da equipe (→ `respId`, `origem`)          |
| `equipe`       | pessoas do coletivo (contém CPF/RG — ver LGPD)    |
| `elenco`       | músicos e técnicos que entram nos editais         |
| `contatos`     | contatos externos                                 |
| `reunioes`     | reuniões, pauta e ata                             |
| `rascunhos`    | respostas de cada projeto no formulário dele (`valores`, `status`, `notas`; `ref` = id do projeto) |
| `formularios`  | definições dos formulários, com `origem` ("chrome" = extraído da plataforma; "documento" = reconstruído do espelho/regulamento), importáveis em Cadastros → Formulários sem deploy |
| `backup_v2`    | cópia dos projetos e candidaturas do formato antigo, gravada pela migração v3 |
| `lixeira`      | excluídos com 30 dias para restaurar (chave `colecao__id`, com `_de`/`_apagadoEm`/`_apagadoPor`/`_lote`) |
| `versoes`      | fotografias automáticas dos rascunhos (fora do espelho; lidas sob demanda no modal Versões) |
| `fichas`       | Contexto: conhecimento de escrita (id = id do Painel) |
| `regras`       | Contexto: regras com fonte obrigatória            |
| `julgamentos`  | Contexto: pareceres e lições                      |

Detalhes que diferem do artefato (por limitação do Firestore, que não aceita
array dentro de array): as tuplas viraram arrays de objetos —
`producao: [{texto, status}]`, `det.portfolio: [{ano, texto}]`,
`det.docs: [{nome, status}]`, `det.links: [{rotulo, url}]`,
`vocabulario: [{usar, evitar}]`, `usados: [{texto, onde, quando}]`,
`licoes: [{texto, regra}]`. O importador converte os dois sentidos: o `.json`
exportado do artefato entra direto pelo botão **Importar**.

Campos de manutenção: `_ord` (posição na listagem) e `atualizado` (ISO da última
gravação, usado no último-ganha da sincronização).

## Mapa do código

Estrutura padrão de projeto React: `components` (UI compartilhada), `pages`
(uma tela por arquivo), `forms` (especificações de formulário por entidade),
`services` (integrações), `store` (estado global), `lib` (regras de negócio
puras), `types`, `utils`, `data` e `styles`.

```
src/
  main.tsx / App.tsx       ← entrada e casca (login, aviso, layout, roteadores)
  components/
    Modal.tsx              ← modal padrão (usado por todos os modais do site)
    BotaoExcluir.tsx       ← exclusão com confirmação em dois cliques
    BuscaGlobal.tsx        ← paleta de busca em tudo (Ctrl+K)
    CabecalhoSecao.tsx, Toast.tsx
    layout/                ← Cabecalho, BarraAbas, BarraFerramentas
  forms/
    especificacoes/        ← um arquivo por entidade (artista.ts, edital.ts...)
    FormularioRegistro.tsx ← o modal Novo/Editar que desenha qualquer entidade
    CampoDoFormulario.tsx  ← render de um campo da especificação
  pages/
    Login.tsx, RoteadorPainel.tsx
    painel/                ← Resumo, Pendencias
    cadastros/
      artistas/            ← ListaArtistas, FichaArtista (Geral com pendências, Marca, Contexto, Projetos)
      editais/             ← ListaEditais, Panoramas (o que pontua, campos, lacunas, alertas), FichaEdital
      formularios/         ← ListaFormularios (com as plataformas), FichaFormulario, ModalImportarFormulario
    agenda/                ← Cronograma, Calendario
    pessoas/               ← Elenco, Equipe, Contatos
    gestao/                ← Reunioes, FichaReuniao, QuadroTarefas, Lixeira, Migracao
    projetos/              ← Projetos (roteador), VisaoGeral, Pipeline, FichaProjeto, GeralProjeto,
                             ContextoProjeto, ModalNovoProjeto, Transferencia
      formulario/          ← Formulario, LateralEtapas, Campo
        campos/            ← um componente por tipo de campo (texto, rádio, docs...)
      orcamento/           ← PlanilhaOrcamento, ResumoOrcamento, BarraTotais
    contexto/              ← Contexto, Geral, Fichas, Regras, ModalRegra,
                             Julgamentos, ModalJulgamento, Trocar, RegrasParaRascunho
  services/
    firebase.ts            ← conexão (env) — sem env = modo local
    banco.ts               ← camada de armazenamento (Firestore ⇄ localStorage)
    sessao.ts              ← login e-mail/senha
  store/
    central.ts             ← estado global (usarCentral) + semeadura
    mutacoes.ts            ← salvar/excluir registros, rascunhos e docs do Contexto
    importarExportar.ts    ← pacote .json (v3; v2 e o do artefato são convertidos na hora)
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
    nomes.ts, agenda.ts, documentos.ts
  types/                   ← entidades documentadas (painel, simulador, contexto)
  data/                    ← catálogos estáticos (Salic, plataformas) + sementes de migração;
                             as definições de formulário vivem no banco (coleção formularios)
  utils/                   ← ids, datas, dinheiro, clipboard, download
  styles/estilos.css       ← CSS portado 1:1 do artefato
```

## LGPD

A regra do coletivo (r24 no Contexto) é que CPF, RG e dados bancários ficam
fora da Central: vivem no Drive e só entram no formulário oficial do edital.
Os campos `rg`, `cpf` e `nascimento` ainda existem em `equipe` e `elenco` por
compatibilidade, mas saíram das Pendências e da exportação em planilha, e a
semente do repositório não traz esses dados. Se o repositório for público,
lembre que o histórico do Git guarda as versões antigas da semente.
