# Autoria e log de alterações

*Adicionado em 26/09/2026. Duas mudanças pequenas na camada `Banco` para saber quem mexeu no quê.*

## 1. `atualizadoPor` em todo documento

Toda gravação feita com uma conta logada carimba `atualizadoPor` com o e-mail da sessão (a sessão avisa o Banco em `onAuthStateChanged`, via `Banco.definirAutor`). Vale para todas as coleções, exceto as de controle (`lixeira`, `backup_v2`, `log_alteracoes`). O campo guarda só o último autor; o histórico completo está no log abaixo.

No modo local (sem Firebase) não há login e o campo não é gravado.

## 2. Coleção `log_alteracoes`

Cada gravação que chega ao Firestore deixa uma linha, depois da confirmação do servidor e uma por janela de debounce (não uma por tecla):

| Campo | O que é |
|---|---|
| `colecao` | coleção do documento (`projetos`, `editais`, `fichas`...) |
| `docId` | id do documento |
| `acao` | `novo`, `edicao` ou `exclusao` |
| `campos` | nos casos de `edicao`, os campos de primeiro nível que mudaram (ignora `atualizado`, `atualizadoPor`, `_novo`) |
| `quem` | e-mail de quem gravou (vazio se não houver sessão) |
| `quando` | ISO 8601 |
| `rotulo` | `titulo`, `nome` ou `id` do documento, para leitura humana |
| `expiraEm` | Timestamp de 90 dias depois |

Id do documento de log: `<quando>_<colecao>_<docId>`, com `:` e `.` trocados por `-`.

Regras:
- Regravação sem mudança real (nenhum campo diferente) não gera linha.
- Exclusão registra `acao: exclusao` na coleção de origem. A cópia que vai para a `lixeira` não gera linha própria.
- Falha ao gravar o log nunca impede a gravação real (melhor esforço, sem `await`).
- Documento que sobe pela reconciliação (edição feita offline e enviada depois) não tem versão anterior conhecida e não gera linha. Limitação aceita.

## Retenção

Cada linha leva `expiraEm` (90 dias). A política de TTL do Firestore (console do Google Cloud → Firestore → Time to live) apagaria as vencidas sozinha, mas **exige faturamento ativo no projeto**: no plano gratuito o console responde "403: billing disabled" (testado em 28/09/2026). Por isso o próprio site faz a faxina: `Banco.limparLogVencido()` roda uma vez por dia por navegador, 20 s depois do login, e apaga até 200 linhas com `expiraEm` no passado (consulta por intervalo num campo só, que usa o índice automático). Se um dia o projeto ativar faturamento, basta criar a política (`log_alteracoes`, campo `expiraEm`, adiamento 0) e a faxina do site continua inofensiva.

## Regras de segurança

As regras atuais (`firestore.rules`) liberam leitura e escrita em qualquer coleção para conta logada, então a nova coleção funciona sem mudança nas regras.

## Para que serve

Exportações e ferramentas externas (por exemplo, o segundo cérebro do Antonio) passam a conseguir separar o que cada pessoa alterou, em vez de ver só o estado final. Na interface, projetos, artistas e editais têm a aba **Histórico** (componente `Historico`), que lê esta coleção por `docId` (o projeto e as respostas do formulário dele; o artista e a ficha de contexto, que têm o mesmo id) e mostra quem, quando e quais campos. O nome aparece quando o e-mail do login está na Equipe; senão, aparece o e-mail.
