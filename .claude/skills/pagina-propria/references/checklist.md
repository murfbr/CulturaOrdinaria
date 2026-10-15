# Checklist: página própria de evento

Marque em ordem. Um item pulado no passo 0 volta como retrabalho no passo 5.

## Verificação do pacote (passo 0, antes de qualquer código)
- [ ] Link do artefato abre e mostra as telas; ficha de entrega lida inteira.
- [ ] JSON no formato: `config.listas` com `{ id, nome }`, `config.parametros`, listas `id → registro`, todo registro com `id` e `atualizado`, datas ISO, dinheiro em número, ids sem acento.
- [ ] Cada lista classificada: da Central (tarefas, contatos, equipe, projeto) com campos batendo com as especificações, ou nova do evento (subcoleção de `paginas/<slug>/`).
- [ ] Responsável e fornecedor como nome em texto; nenhum id inventado de pessoa do coletivo.
- [ ] Slug livre: não está em `presets/paginas`, em `src/pages/paginasProprias.ts` nem é aba da Central.
- [ ] Projeto existe em `projetos` (ou será criado pela Central antes da semente).
- [ ] Decidido o que vai para `presets/<tipo>` e o que fica em `paginas/<slug>`.
- [ ] Os três números da ficha recalculados do JSON e batendo.
- [ ] A Central recebe só totais; nenhum detalhe da página copiado para ela.
- [ ] Nada de RG, dados bancários ou senha. CPF fora da semente (CNPJ pode).
- [ ] Lista entregue em três blocos: entra como está / entra com ajuste / volta para a pessoa. **Parar e esperar o "pode fazer".**

## Antes do código (passo 1)
- [ ] Regras implícitas de status confirmadas em uma mensagem (o que "pago", "confirmado", "fechada" fazem).
- [ ] Pontos de integração listados, e só eles.
- [ ] Os três números reproduzidos por funções puras em `calculo.ts`.

## Pasta e toques (passos 3 e 4)
- [ ] `src/paginas/<slug>/` com casca, menu, `dados.ts`, `tipos.ts`, `calculo.ts`, `vista.ts`, `semente.ts` + `semente.json`, `tailwind.config.js` + `estilos.css` (prefixo próprio), `ui/`, uma subpasta por seção.
- [ ] Nenhum arquivo acima de 250 linhas; nenhum import de `components/ui` da Central.
- [ ] Os cinco toques fora da pasta: `paginasProprias.ts`, `<slug>/index.html`, `vite.config.ts`, `vercel.json`, `public/<slug>/compartilhar.png`.
- [ ] Nada tocado em regras, `.env`, `banco.ts`, `central.ts`, `mutacoes.ts`, `App.tsx`, `central.css`.

## Semente (passo 5)
- [ ] Função pura; vínculo só por nome exato; o que não bate vai para `obs`; nada criado de texto solto.
- [ ] Roda uma vez: página inexistente confirmada **e** `presets` (e coleções de referência) confirmados.
- [ ] Registro acrescentado em `presets/paginas` sem apagar os das outras páginas.
- [ ] Avisado que, em produção, a semente também grava nas coleções do coletivo.

## Teste (passo 7)
- [ ] Modo local, `/<slug>/`: os três números; um fluxo de ponta a ponta; 375 px sem rolagem lateral; console limpo.
- [ ] Espelho `localStorage` conferido: contagem de documentos por coleção e campos.
- [ ] A Central continua abrindo; o projeto mostra os totais, se a integração já entrou.
- [ ] `npm run build` limpo.
- [ ] Produção (depois do deploy): `curl` 200 em `/<slug>/`, bundle contém a página. Primeiro acesso logado é deles.

## Fechamento (passo 8)
- [ ] README: seção da página.
- [ ] Cofre: decisão, módulo, Mapa, plano versionado, aprendizado.
- [ ] Commit só com autorização; commit e push juntos; sem PR; sem subagente.
