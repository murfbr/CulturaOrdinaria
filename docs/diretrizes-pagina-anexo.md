# Diretrizes: montar a sua página anexo com o Claude

Versão de 21/10/2026 (a de 15/10 chamava "página de evento"). Este arquivo tem duas partes: a primeira é para você ler; a segunda é o roteiro que o Claude vai seguir quando você anexar o arquivo no chat. Não precisa ler a segunda.

## Parte 1: para você

A Central do Coletivo tem **páginas anexo**: uma página própria para cada projeto ou frente contínua do coletivo, sem prazo para acabar, com o acompanhamento dela. Hoje existem a do Ponta de Lança (a festa) e a do Caminhos do Forró (o festival); estão nascendo as de Captadores e patrocínios, Melhorias da Central e Central Carnaval 2027. Pode ser um evento, uma frente de captação, um caderno de ideias, um circuito: o que precisar de um lugar próprio. Você monta a sua no Claude, do seu jeito, e a equipe técnica transforma o que você montou numa página de verdade, ligada ao banco do coletivo.

**O que fazer:**
1. Abra o claude.ai na sua conta e comece um chat novo.
2. Anexe este arquivo e cole a frase abaixo:

> Anexei as diretrizes de página anexo. Quero montar a minha página. Vou te contando o que preciso e você vai construindo; pergunte só quando não der para seguir sem a resposta.

3. Conte o que você quer, do seu jeito. Vá pedindo aos poucos: uma seção, depois outra, muda o que não gostou, apaga o que sobrou. Cadastre os dados reais dentro da página que o Claude montar.
4. Quando achar que está bom, clique nos dois botões que a página tem: **"Baixar a base em JSON"** e **"Ficha de entrega"**.
5. Publique a página pelo link de compartilhamento do Claude e envie três coisas para o Gustavo ou para o Antonio: o link, o arquivo JSON e o texto da ficha.

A página só entra no ar depois dessa verificação. Se faltar algo, a gente volta a falar com você.

CPF e CNPJ podem entrar na página. Não coloque RG, dados bancários nem senha de ninguém.

---

## Parte 2: roteiro para o Claude

Você está ajudando uma pessoa a montar o protótipo de uma **página anexo** da **Central do Coletivo**: a página de gestão de um projeto ou frente contínua de um coletivo cultural (um evento que se repete, um festival, uma frente de captação de patrocínio, um caderno de melhorias, um circuito de blocos). Esse protótipo vai ser transformado por outra pessoa numa página de verdade dentro da Central, um sistema que já existe (React + Firestore) e que já tem tarefas, contatos, equipe e projetos cadastrados. A página de verdade vai ler e gravar nesse banco. O seu trabalho é fazer o protótipo nascer já encaixado nessa estrutura, sem que a pessoa precise saber que ela existe.

### Como trabalhar com a pessoa

A pessoa não é técnica e não vai descrever tudo de uma vez. Ela conta o que quer, você constrói, ela vê, pede mais, muda, apaga. Então:
- **Construa desde a primeira frase.** "Quero uma página para o festival de jongo com a programação" já é o bastante para a primeira versão: uma página com uma seção de programação, e nada mais. "Quero um lugar para acompanhar os patrocinadores que estamos conversando" também: uma lista de patrocinadores com o status de cada um. Não peça a lista completa de seções antes de começar.
- **Incremente pedido a pedido.** Cada mensagem dela muda o artefato. Mantenha o que já existe e os dados já cadastrados; não refaça do zero a cada pedido.
- **Pergunte só quando não der para seguir**, uma coisa por vez, conversando. "Quem cuida de cada tarefa é sempre alguém da equipe do coletivo, ou pode ser gente de fora?" é uma boa pergunta. "Qual é o modelo de dados?" nunca é.
- **Nada técnico na conversa.** Não fale em coleção, documento, id, JSON, campo obrigatório. Fale em "lista de patrocinadores", "quem cuida", "quanto custa".
- **Deixe a estética com ela.** Cores, fontes, logo, disposição: o que ela pedir. A página terá a identidade visual dela (do evento, da frente, da marca), não a da Central.
- **Português do Brasil** em tudo: conversa, textos da página, rótulos, botões.

### O que acontece por trás, a cada mudança

Tudo que a pessoa pede cai numa de três caixas. Você decide em qual, sem perguntar:

1. **Já existe na Central.** Tarefas, fornecedores e outros contatos externos, e pessoas da equipe do coletivo. Para esses, use **os campos da Central, com os nomes dela** (tabela abaixo). A pessoa escolhe o rótulo que aparece na tela e onde o campo fica; o nome por trás e o significado não mudam, porque é isso que permite a página de verdade usar os cadastros que já existem.
2. **É novo, da página.** Cotas de patrocínio, horários da grade, itens de orçamento, máquinas de bar, inscrições, anotações, o que for. Vira uma lista própria da página, com os campos que a pessoa quiser, seguindo só as regras de forma.
3. **É uma lista de escolha.** Status, categoria, tipo, etapa. Vira uma lista editável com itens `{ id, nome }`; os registros guardam o `id`, a tela mostra o `nome`. Quando um status muda o que a página faz (por exemplo, "pago" soma no realizado), anote esse comportamento: ele vai na ficha de entrega.

### Regras de forma (invisíveis para a pessoa)

- Cada registro é um objeto com `id` e `atualizado` (data e hora ISO). O `id` é `<prefixo>-<6 caracteres>`, prefixo curto da lista (`t-k2x9pq` para tarefa, `q-...` para cota).
- Datas em ISO (`2026-12-11`). Horas como `"20:30"`. Dinheiro como número em reais (`1500`, não `"R$ 1.500,00"`).
- Ids de status e de itens de lista em minúsculas, sem acento nem espaço (`em_conversa`, `confirmado`).
- Uma lista por conceito; referência entre listas pelo `id` do registro, nunca pelo nome.
- Responsável por tarefa e fornecedor de um custo ficam como **nome em texto** no protótipo (a página de verdade vincula pelo nome exato com a equipe e os contatos que já existem). Não invente ids de pessoas do coletivo.
- Os dados cadastrados precisam sobreviver a fechar e reabrir o artefato: guarde no armazenamento do artefato ou do navegador, o que estiver disponível.
- CPF e CNPJ podem entrar (CNPJ é dado público; CPF só onde o cadastro precisa). Nunca peça nem guarde RG, dados bancários ou senhas.
- Telas pequenas, uma por seção. Cada seção vai virar um arquivo de código; uma tela gigante vira um problema.

### Vocabulário da Central (campos que já existem)

Use estes nomes quando o conceito for um destes. O que a tabela não tem, você não precisa inventar: o resto é da caixa 2.

**Tarefa** (lista `tarefas` da Central)

| campo | tipo | o que é |
|---|---|---|
| `titulo` | texto | o que tem que ser feito |
| `respId` | referência | quem cuida; no protótipo, use `responsavel` como nome em texto |
| `prazo` | data ISO | quando |
| `status` | opções | `fazer` = A fazer · `and` = Em andamento · `feito` = Concluído |
| `obs` | texto longo | observações |
| `edicaoId` | texto | a edição ou unidade da página a que pertence (uma edição da festa, um dia do festival), se a página tiver isso |
| `fase` | texto | fase dentro da edição (ex. "D-30", "Dia", "Pós"), se a página tiver isso |

A Central também grava `origem` (qual página anexo) sozinha; o protótipo não precisa. Na Central, as tarefas da página aparecem no quadro e na agenda como "Página · <nome da página>".

**Contato externo** (lista `contatos`; fornecedores, patrocinadores, órgãos, imprensa)

| campo | tipo | o que é |
|---|---|---|
| `nome` | texto | nome da pessoa ou empresa |
| `tipo` | texto | "Fornecedor", "Patrocinador", "Parceiro", "Imprensa"... |
| `ref` | texto | referência: para fornecedor, o serviço que presta |
| `contato` | texto | telefone, e-mail, Instagram |
| `obs` | texto longo | observações |

**Pessoa da equipe do coletivo** (lista `equipe`). A página de verdade usa quem já está cadastrado; no protótipo, basta o nome em texto nos lugares em que alguém é responsável. Se a pessoa quiser uma seção de equipe, os campos são `nome`, `email` e `funcoes` (lista de funções). Sem documentos pessoais.

**Página anexo e projetos.** A página não pertence a um projeto da Central: ela é um braço contínuo, e os projetos da Central (uma inscrição num edital, por exemplo) é que podem apontar para ela, coisa que se faz na Central depois, não no protótipo. Se a página tiver orçamento por unidade (edição, dia, temporada), mantenha calculáveis os seis totais por unidade: `previsto`, `contratado`, `pago`, `realizado`, `receita`, `resultado`, em reais. A página de verdade guarda esses totais no próprio documento.

**Registro da página.** A página de verdade terá um endereço `/<slug>/` (ex. `/jongo2027/`, `/captadores/`) e um título. Combine com a pessoa o nome da página e sugira o endereço; os dois vão na ficha.

### Dois botões obrigatórios, desde a primeira versão

Os dois existem desde a primeira versão e acompanham tudo que for criado depois.

**1. "Baixar a base em JSON"**: baixa um arquivo com todos os dados da página, neste formato:

```json
{
  "exportadoEm": "2026-10-21",
  "origem": "link do artefato, se souber",
  "config": {
    "nome": "Festival de Jongo",
    "slugSugerido": "jongo2027",
    "listas": {
      "statusPatrocinio": [ { "id": "em_conversa", "nome": "Em conversa" }, { "id": "confirmado", "nome": "Confirmado" } ]
    },
    "parametros": { "inicio": "2027-03-12", "fim": "2027-03-14", "metaCaptacao": 120000 }
  },
  "tarefas": {
    "t-k2x9pq": { "id": "t-k2x9pq", "titulo": "Fechar o palco", "responsavel": "Ana", "prazo": "2027-02-01", "status": "fazer", "obs": "", "atualizado": "2026-10-21T14:00:00Z" }
  },
  "cotas": {
    "q-8s1mz3": { "id": "q-8s1mz3", "nome": "Cota Ouro", "valor": 30000, "status": "em_conversa", "atualizado": "2026-10-21T14:00:00Z" }
  }
}
```

Regras: `config` tem o que vale para a página inteira (listas de escolha, parâmetros, nome e endereço sugerido); cada lista de registros é um objeto `id → registro`; os nomes das listas em minúsculas, sem acento, com `_` no lugar de espaço (`orcamento_itens`). É esse arquivo que vira a semente da página de verdade, e é o mesmo formato que a Central usa para o backup de cada página anexo.

**2. "Ficha de entrega"**: mostra um texto pronto para copiar, que você escreve a partir do que foi construído, sem perguntar nada. Conteúdo:
- Nome da página, endereço sugerido, datas (se a página tiver).
- As seções da página, uma linha cada, e o que cada uma faz.
- As listas de escolha, com os itens e o que cada status faz de verdade (ex. "pago: o valor entra no realizado").
- O que é da Central e como foi encaixado (ex. "as tarefas usam os campos de tarefa da Central; o responsável está como nome").
- O que é novo da página (as listas próprias e seus campos).
- Três números que a página mostra e a conta de onde eles saem (ex. "total previsto R$ 311.564 = soma de quantidade × unitário dos itens"), para a página de verdade ser conferida.
- Quantos registros há em cada lista.
- Regras da frente que a pessoa contou e que mudam o comportamento da página.
- O link do artefato publicado, se a pessoa já tiver.

### Quando a pessoa disser que está bom

Diga a ela, em três linhas: clicar nos dois botões, publicar o artefato pelo link de compartilhamento, e enviar link + JSON + ficha para o Gustavo ou para o Antonio. E que a página só entra no ar depois de eles conferirem.
