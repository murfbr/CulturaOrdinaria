---
name: pagina-propria
description: Transforma o protótipo de página de evento que uma pessoa montou no Claude dela (link do artefato + JSON exportado + ficha de entrega, feitos com docs/diretrizes-pagina-de-evento.md) numa página própria da Central em src/paginas/<slug>/, ligada ao banco. Use sempre que chegar um pacote desses, quando pedirem para "montar a página do evento X", "trazer o artefato para a Central", "nova página própria", ou para verificar se um protótipo encaixa no banco, mesmo que a pessoa não use essas palavras.
---

# Página própria de evento: receber, verificar, montar

Uma página própria é uma pasta fechada em `src/paginas/<slug>/`, servida em `/<slug>/`, com casca e identidade visual próprias, mesmo login e mesmo `Banco` da Central. As duas que existem são a referência: `src/paginas/caminhosdoforro/` (a melhor para copiar: Tailwind desde o início, `ui/` próprio, `importar/` genérico, Storage) e `src/paginas/sambadeponta/` (a mais integrada com a Central: tarefas, contatos, totais no projeto).

O trabalho tem duas partes com donos diferentes: **verificar** é a palavra final do Gustavo ou do Antonio sobre o que a pessoa montou; **montar** é código, feito aqui, em sequência, sem subagente e sem paralelismo, com commit só por eles e só com autorização.

Leia `references/contrato-central.md` antes de escrever `dados.ts`; use `references/checklist.md` para não pular nada.

## Passo 0: receber o pacote e verificar

O pacote tem três partes: o link do artefato publicado (mostra as telas), o JSON exportado (os dados, no formato de `docs/diretrizes-pagina-de-evento.md`) e a ficha de entrega (o resumo que o Claude da pessoa escreveu). O banco interno do artefato fica na conta de quem fez; os dados que valem são os do JSON.

Conferir, nesta ordem, e sem escrever código:
1. **O JSON está no formato:** `config` com `listas` (`{ id, nome }`) e `parametros`; cada lista de registros é `id → registro`; todo registro tem `id` e `atualizado`; datas ISO; dinheiro em número; ids de lista em minúsculas sem acento. Se não estiver, ajuste ao ler (a semente é o lugar certo) e anote.
2. **Cada lista do JSON é nova ou é da Central.** Tarefas, contatos (fornecedores, patrocinadores...), equipe e projeto são da Central: os campos têm que bater com `src/forms/especificacoes/*.ts` e `src/types/painel.ts` (`Tarefa`, `Contato`, `PessoaEquipe`, `Projeto.resumoEdicoes`). Responsável e fornecedor chegam como nome em texto: a semente vincula pelo nome exato, o resto fica em `obs`. O que é novo do evento vira subcoleção de `paginas/<slug>/`.
3. **O slug está livre:** não existe em `presets/paginas` nem em `src/pages/paginasProprias.ts`, e não colide com uma aba da Central.
4. **O projeto existe** em `projetos` (ou precisa ser criado pelo "Novo projeto" da Central antes da semente). O registro em `presets/paginas` liga a página ao projeto.
5. **O que vai para presets** (lista que só preenche select e vale para mais de uma página: `presets/<tipo>`) e o que fica no documento da página (listas do evento). Enum que o código interpreta fica no código.
6. **Os três números da ficha** batem com as fórmulas do protótipo, recalculados do JSON. Se não baterem, a fórmula da ficha está errada ou o JSON está incompleto: volta para a pessoa.
7. **A Central recebe só totais** (`Projeto.resumoEdicoes` ou equivalente), nunca o detalhe. Se a ficha pede que a Central mostre linhas da página, é uma tela que abre o detalhe puxando da página, não dado copiado.
8. **Sensível:** RG, dados bancários e senha não entram; se vier, sai antes da semente. CPF e CNPJ podem ficar na página, mas a semente não leva CPF: o repositório é público, então CPF entra no banco pela tela ou pela importação, nunca pelo arquivo de semente.

Entregue ao Gustavo ou ao Antonio uma lista em três blocos: **entra como está**, **entra com ajuste** (qual), **volta para a pessoa** (o quê e por quê). Pare aí. Montar começa com o "pode fazer" deles.

## Passos 1 a 8: montar

### 1. Antes do código
- Levante as regras implícitas que a ficha conta ou deixa de contar: o que cada status faz de verdade (ex.: pagar é o dinheiro sair, então marcar pago preenche o realizado com o orçado). Confirme com eles em uma mensagem curta. O artefato não implementa essas regras; a página tem que implementar.
- Pontos de integração, e só eles. Três perguntas por conceito: a Central já modela isso? (usa a coleção dela). A Central precisa saber disso? (recebe totais, gravados pela página no projeto). O resto é lógica da página e fica nela.
- Reproduza os três números de aceite com funções puras em `calculo.ts` antes de qualquer tela.

### 2. Estrutura no banco
```
presets/paginas              registro { slug, projetoId, tipo, titulo } (a semente acrescenta o seu)
presets/<tipo>               listas compartilhadas entre páginas do mesmo tipo, se houver
paginas/<slug>               um documento: listas, parâmetros, o que vale para a página inteira
paginas/<slug>/<lista>/*     um documento por registro (as listas novas do evento)
tarefas/*                    tarefas da página: origem "proj:<id>", edicaoId e fase quando houver, status fazer/and/feito, respId da Equipe
contatos/*                   fornecedores e parceiros, com tipo
projetos/<id>.resumo*        totais por unidade, gravados pela página a cada mudança
```
Regras do Firestore (`{document=**}`) e do Storage (`paginas/**`) já cobrem tudo isso; não se tocam. Arquivos no Storage em `paginas/<slug>/...`.

### 3. A pasta `src/paginas/<slug>/`, fazendo igual o forró
Copie a estrutura, não o conteúdo. Para cada arquivo do forró, o que vira na página nova:

| no forró | na página nova |
|---|---|
| `PaginaCaminhosDoForro.tsx` | `Pagina<Nome>.tsx`: casca (grade lateral + main), fontes por `<link>` injetado, título da aba, URL sem hash, vista no `localStorage` |
| `MenuLateral.tsx` | menu com a marca, as seções, "← Central", estado do banco, sair |
| `dados.ts` | escutas (`assinarDocumento` da página, `assinar` das subcoleções e de `presets`), base em memória, `gravar`, `novoId`, semente, hook `usar<Nome>()` |
| `tipos.ts` | `SLUG`, `TIPO`, `TITULO`, `COLECOES`, nomes das listas, interfaces dos registros |
| `listas.ts` | meta das listas: título, onde é usada, ids protegidos |
| `calculo.ts` | fórmulas puras (dinheiro, datas, os três números) |
| `vista.ts` | vistas do menu, títulos |
| `semente.ts` + `semente.json` | o JSON do pacote e o conversor puro |
| `tailwind.config.js` + `estilos.css` | branding da página: prefixo próprio de três letras, cores como `var(--xxx-…)` com valor claro e escuro, `@source "./"` |
| `ui/` | só os blocos que a página usa (Botao, Campo, Tabela, Modal, Abas, Tag, Bloco, CabecalhoVista...). Não importe `components/ui` da Central: o Tailwind dela não cobre `src/paginas` |
| `importar/` | quando alguma tela importa planilha ou texto colado: `tabela.ts`, `GuiaColunas`, `EntradaTabela`, `Previa`; a tela declara as colunas (`ColunaTabela`) |
| `configuracao/` | parâmetros, listas editáveis, "Dados na base" com "Baixar a base em JSON" |
| as outras subpastas | uma por seção da ficha, um arquivo por tela, nada acima de 250 linhas |

Tudo da página vive na pasta. Identidade visual é a do evento (um config de Tailwind por branding, decisão vigente).

### 4. Fora da pasta, exatamente cinco toques
1. Uma linha em `src/pages/paginasProprias.ts` (slug → componente).
2. `<slug>/index.html` na raiz do repositório: copie `caminhosdoforro/index.html` e troque título, descrição, cor, ícone e as metas Open Graph. É o que o robô de prévia de link lê.
3. A entrada em `vite.config.ts` (`build.rollupOptions.input`).
4. A regra em `vercel.json` (`/<slug>/:caminho*` → `/<slug>/index.html`), antes da regra geral.
5. `public/<slug>/compartilhar.png` (1200×630).

O que **não** se toca: `firestore.rules`, `storage.rules`, `.env`, `services/banco.ts`, `store/central.ts`, `store/mutacoes.ts`, `App.tsx` (já abre `/<slug>/` pelo registro), `styles/central.css` (já exclui `src/paginas`). Se a página parecer precisar de algo na camada compartilhada, é mudança de escopo: pare e pergunte.

### 5. Semente
Função pura em `semente.ts`: recebe o JSON e o que já existe nas coleções de referência (`equipe`, `contatos`, `projetos`), devolve os documentos por coleção. Regras: vínculo só por nome exato (responsável → `respId`, fornecedor → `contatoId`); o que não bate fica em texto em `obs`; nunca criar cadastro a partir de texto solto; o carimbo do artefato (`atualizadoPor`, uid do Claude) fica de fora; cada registro ganha `id` e `atualizado`. Roda uma vez, quando `Banco.assinarDocumento("paginas", SLUG)` confirma que a página não existe **e** `presets` (e as coleções de referência usadas) já confirmaram (`colecaoConfirmada`). Em produção também grava nas coleções do coletivo (tarefas, contatos): avisar antes do primeiro acesso logado, que é deles.

### 6. Integração com a Central: etapa 2, um fato por vez, decisão deles
Tarefas da página em `tarefas` (aparecem no quadro, no Resumo e na ficha do projeto); fornecedores em `contatos`; totais no documento do projeto com `sincronizarResumo` que compara antes de gravar (sem laço, sem gravação à toa); presets compartilhados. A Central recebe totais; o detalhe fica na página ou numa tela que puxa sob demanda. Mutações nas coleções da Central só por `store/mutacoes.ts` (`salvarRegistro`, `excluirRegistro`): `_ord`, `atualizado`, lixeira e Desfazer vêm de graça.

### 7. Teste
Modo local: perfil `central-modo-local` de `.claude/launch.json` (`npm run dev -- --mode teste`), abrir `/<slug>/`. Conferir: os três números; um fluxo de ponta a ponta (mudar um status e ver o que mexe na linha, nos cards, no documento, na Central); 375 px sem rolagem lateral; console sem erro; o espelho `localStorage` (`central-coletivo-local-v1`, chave `colls`) para contar documentos e checar campos; a Central continua abrindo. `npm run build` (roda `tsc` antes) limpo. Para reseed em modo local: apagar `paginas`, `paginas/<slug>/*` e o item da página em `presets.paginas` dentro de `colls`. Em produção, depois do deploy: `curl` 200 no caminho, bundle com a página; o primeiro acesso logado roda a semente e é deles; as regras deste projeto são publicadas pelo console, nunca por `npm run regras`.

### 8. Fechamento
README: seção da página em "Páginas próprias de projeto". Cofre (Segundo Cérebro, `projetos/Cultura Ordinária/`): decisão com as regras do domínio, nota de módulo, Mapa, plano versionado, aprendizado. Commit só com autorização explícita, mensagem em português minúscula e curta, commit e push juntos, nunca PR. Sem subagente nem paralelismo em nenhum passo.
