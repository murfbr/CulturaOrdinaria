/* Cartão de um projeto do portfólio: dados, cifras (meta, confirmado,
   inventário, comissão) e a tabela de cotas, criadas ali mesmo. Editar e
   criar usam o formulário padrão da Central (specs projetoCaptacao e cota);
   na visão de uma captadora não se edita nada. */
import { usarCentral } from "../../../store/central";
import { abrirEdicao, abrirNovo } from "../../../store/edicao";
import { Badge } from "../../../components/ui/Badge";
import { Botao } from "../../../components/ui/Botao";
import { Painel } from "../../../components/ui/Painel";
import { Tabela, Th, Td, Tr } from "../../../components/ui/Tabela";
import { Vazio } from "../../../components/ui/Vazio";
import { ESTILO_LINK } from "../../../components/ui/estilos";
import { SITUACAO_ABERTO, type ProjetoCaptacao } from "../../../types";
import { url } from "../../../utils";
import { dataBr, nomeItem } from "../apoio";
import { brl, cotasDoProjeto, inventarioDoProjeto, noEscopo, numero, totais, vendidas } from "../calculo";

export function CartaoProjeto({ projeto: p, como }: { projeto: ProjetoCaptacao; como: string }) {
  const { painel } = usarCentral();
  const t = totais(painel.negociacoes.filter((n) => n.projetoId === p.id && noEscopo(n, como)), [p]);
  const cotas = cotasDoProjeto(painel.cotas, p.id);
  const edita = !como;
  const datas = p.inicio ? dataBr(p.inicio) + (p.fim && p.fim !== p.inicio ? " a " + dataBr(p.fim) : "") : "próxima data a definir";

  return (
    <Painel
      titulo={<span className="font-display text-2xl font-normal normal-case tracking-normal text-ink">{p.nome}</span>}
      sub={<Badge tom={p.situacao === SITUACAO_ABERTO ? "ok" : "neutro"} className="not-italic">{nomeItem("situacaoProjeto", p.situacao)}</Badge>}
      acoes={edita && <Botao variante="fantasma" tamanho="pequeno" onClick={() => abrirEdicao("projetoCaptacao", p.id)}>Editar projeto</Botao>}
    >
      <div className="mb-2 text-sm text-muted">{datas}{p.local && " · " + p.local} · {nomeItem("mecanismos", p.mecanismo)}</div>
      {p.resumo && <p className="m-0 mb-2 max-w-[70ch]">{p.resumo}</p>}
      {p.link && <a href={url(p.link)} target="_blank" rel="noopener" className={ESTILO_LINK}>Abrir a página do projeto ↗</a>}

      <div className="my-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        {([
          ["Meta", numero(p.meta) != null ? brl(p.meta) : "a definir"],
          ["Confirmado", brl(t.confirmado)],
          ["Inventário de cotas", brl(inventarioDoProjeto(painel.cotas, p.id))],
          ["Comissão", numero(p.comissaoPct) != null ? String(p.comissaoPct).replace(".", ",") + "% · " + nomeItem("baseComissao", p.comissaoBase) : "a definir"],
        ] as [string, string][]).map(([rot, val]) => (
          <div key={rot} className="rounded-md bg-bg-sunk px-3 py-2">
            <div className="font-mono text-3xs uppercase text-muted">{rot}</div>
            <div className="font-semibold tabular-nums">{val}</div>
          </div>
        ))}
      </div>

      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-3xs uppercase text-muted">Cotas</span>
        {edita && <Botao variante="quieto" tamanho="mini" onClick={() => abrirNovo("cota", { projetoId: p.id, ordem: cotas.length })}>+ Cota</Botao>}
      </div>
      {cotas.length ? (
        <Tabela simples>
          <thead><tr><Th>Cota</Th><Th numerico>Valor</Th><Th numerico>Vendidas</Th><Th>Contrapartidas</Th></tr></thead>
          <tbody>
            {cotas.map((c) => (
              <Tr key={c.id} aoClicar={edita ? () => abrirEdicao("cota", c.id) : undefined}>
                <Td><b>{c.nome}</b></Td>
                <Td numerico>{numero(c.valor) != null ? brl(c.valor) : "variável"}</Td>
                <Td numerico>{vendidas(c.id, painel.negociacoes)}{numero(c.quantidade) != null ? " de " + c.quantidade : ""}</Td>
                <Td className="text-sm text-muted">{c.contrapartidas}</Td>
              </Tr>
            ))}
          </tbody>
        </Tabela>
      ) : (
        <Vazio emLinha>Este projeto ainda não tem cotas.{edita && " Crie a primeira em “+ Cota”."}</Vazio>
      )}
    </Painel>
  );
}
