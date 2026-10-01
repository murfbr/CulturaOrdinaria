/* Ajuda: como usar o painel e o que mora onde, agora que a página é parte da Central. */

export function ComoUsar() {
  return (
    <section id="l-ajuda">
      <div className="sdp-eyebrow">Festa · ferramenta</div>
      <h2>Como usar este painel</h2>
      <div className="help" style={{ marginTop: 18 }}>
        <p>
          <b>Uma página, todas as edições.</b> Os dados moram no banco da Central: quem tem conta vê e edita, e
          cada mudança grava na hora (o rodapé do menu diz "salvo"). Não existe botão Salvar.
        </p>
        <p>
          <b>O que é compartilhado com a Central.</b> As tarefas de cada edição são tarefas da Central, ligadas ao
          projeto da festa: aparecem em Gestão → Tarefas, no Resumo e na ficha do projeto, com o mesmo status.
          Os fornecedores são contatos do tipo Fornecedor (Pessoas → Contatos externos). O nome da festa é o nome
          do projeto. Fases, categorias de custo, naturezas de máquina e formatos de peça vêm do preset de festa.
        </p>
        <p>
          <b>Ciclo de uma edição:</b> <b>Nova edição</b> cria a próxima já com orçamento herdado do realizado da
          anterior, cronograma, máquinas, plano de comunicação e as tarefas do checklist-mestre. Durante a
          produção você marca tarefas, atualiza custos (previsto = quantidade × unitário; status previsto →
          contratado → pago; realizado quando fechar) e testa cenários na <b>Simulação</b> (público, ticket de
          bar, porta). Depois do evento, preenche o <b>Fechamento</b> (receitas, bebida, público), registra o
          balanço e passa o status para "Fechada": os KPIs entram no comparativo.
        </p>
        <p>
          <b>O que não mora aqui:</b> a reconciliação das máquinas (cupom × painel × PDV) e as notas dos
          fornecedores continuam nas planilhas e PDFs do Drive. O painel guarda o resumo e os links.
        </p>
      </div>
    </section>
  );
}
