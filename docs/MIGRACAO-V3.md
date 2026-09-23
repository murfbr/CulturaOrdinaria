# Migração da Central para o modelo v3

O que muda, como subir e como migrar o banco que está no ar. Escrito em 23/09/2026.

## O que muda para quem usa

| Antes (v2) | Agora (v3) |
| --- | --- |
| Portfólio (Artistas, Projetos) | **Cadastros**: Artistas, Editais e Formulários |
| Captação (Pipeline, Editais) | Editais vão para Cadastros; o Pipeline vai para Projetos |
| Simulador (Mesa, Plataformas, Formulário, Transferência) | **Projetos**: Visão geral, Pipeline e a ficha de cada projeto (Geral, Formulário, Transferência, Contexto) |
| Candidatura = projeto × edital | **Cada projeto é uma candidatura**, com lista de artistas, um edital e o formulário dele (ou Livre) |
| Etapa 0 a 7 da candidatura | **Status do projeto**: Prospecção, Em preparação, Inscrito, Aguardando resultado, Aprovado, Captando, Em execução, Prestação de contas, Concluído, Não aprovado, Desistência |
| Aba Plataformas | Dentro de Cadastros → Formulários (vista Plataformas) |

Artista ganhou: pendências e perguntas em aberto (na aba Geral), correções
propostas pela pesquisa, formalização própria e liga (no lugar do
enquadramento), aba Marca (manual, fotos e links juntos), aba Contexto (a
mesma ficha do ambiente Contexto) e aba Projetos.

Edital ganhou os campos do Mapa dos Editais: o que quer incentivar, linhas,
quem pode (PF, MEI, coletivo sem CNPJ), critérios com pontos e conceito,
campos do formulário, alertas que mudam decisão, lacunas por quem resolve,
fontes e confiança, e a aba Contexto.

Projeto ganhou: proponente (quem assina), nº de inscrição, resultado, valores
pedido/aprovado/captado, histórico de status e a seção interna que era do
rascunho (anotações, agentes, cronograma, documentos).

Links antigos (`#/portfolio/...`, `#/captacao/...`, `#/simulador/...`) caem na tela nova equivalente.

## Como subir

1. Revisar a branch `central-v3` (ou o pull request) e testar localmente:
   `npm install && npm run dev` abre em modo local, com a semente já convertida.
2. **Atenção à prévia da Vercel:** se as variáveis do Firebase estiverem
   configuradas também para Preview, a prévia usa **o mesmo banco do site no ar**.
   Pode navegar à vontade, mas **não rode a migração pela prévia**: o site no ar
   (código v2) ainda depende das candidaturas.
3. Juntar a branch na `main`. A Vercel publica o site novo.
4. Logo em seguida, com o site novo no ar, fazer a migração (abaixo).

Entre o passo 3 e o 4, o site novo já abre: projetos antigos aparecem
completados na leitura (sem gravar nada), mas as candidaturas só viram
projetos depois da migração. Por isso os dois passos vão juntos.

## Como migrar o banco

Em **Gestão → Migração v3** (a aba aparece com um "!" enquanto houver dado antigo):

1. **Baixar backup**: gera o .json com tudo o que está no banco. É o caminho de volta.
2. **Pacote de enriquecimento**: escolher `central-v3-enriquecimento.json`
   (fica no Drive, na pasta do pacote da Central; **não** vai para o
   repositório, porque tem anotações internas). Traz os 36 editais do Mapa,
   os 28 formulários (6 da plataforma, só metadados; 22 dos documentos,
   inteiros), as pendências e perguntas dos 16 artistas, os status decididos
   na Fila da Revisão, as fichas de contexto novas, e o que só existia no
   artefato de 17/09 (12 regras, o julgamento j4, 9 tarefas, 2 pessoas do elenco).
3. **Ver o que vai mudar**: prévia com contagens, o que foi feito e os avisos.
   Aviso é o que **não** foi aplicado porque o campo mudou no site depois do
   levantamento: o valor do site fica, e vale conferir à mão.
4. **Migrar agora**.

O que a migração faz no banco:

- cada candidatura vira um projeto com o **mesmo id** (c1, c2...); projeto
  antigo sem candidatura continua com o dele (p7, p8, p10);
- o rascunho do Simulador ligado à candidatura vira o formulário do projeto;
  rascunho solto vira projeto próprio (arquivado, no caso dos dois de teste);
- tarefas, fichas, regras e julgamentos passam a apontar para o projeto novo
  (ex.: ficha p13 → c1);
- projetos antigos substituídos e todas as candidaturas vão antes para a
  coleção `backup_v2`; depois a coleção `candidaturas` fica vazia;
- "Sambótica" vira "Sambotica" em todo o banco.

A mesma tela serve depois para aplicar outro pacote de enriquecimento.

## Para quem mexe no código

- Conversão pura: `src/lib/migracao/v3.ts` (`converterV2`, `aplicarEnriquecimento`, `normalizarProjeto`).
- Gravação com backup: `src/store/migracao.ts`.
- O importador (`src/store/importarExportar.ts`) aceita pacote v3 e converte v2/v1 na hora.
- A leitura do banco normaliza projeto v2 sem gravar (`src/store/central.ts`).
- Formulário mapeado dos documentos tem campos `doc__<edital>__<n>`: o editor
  esconde o código e a Transferência orienta pelo nome do campo.
