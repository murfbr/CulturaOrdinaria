/* Captação · Captadoras: parceiras de fora que recebem comissão. Um cartão por
   captadora com a carteira, o confirmado, a comissão a pagar e as confirmadas.
   A comissão é combinada por projeto, no cartão do portfólio. */
import { usarCentral } from "../../store/central";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { Linha } from "../../components/ui/Linha";
import { Painel } from "../../components/ui/Painel";
import { Vazio } from "../../components/ui/Vazio";
import { comparar } from "../../utils";
import { nomeEmpresa, nomeProjeto } from "./apoio";
import { brl, comissao, confirmada, totais } from "./calculo";
import { usarComo } from "./visao";

export function Captadoras() {
  const { painel } = usarCentral();
  const como = usarComo();
  const lista = painel.captadoras.filter((c) => !como || c.id === como).sort((a, b) => comparar(a.nome, b.nome));
  const projetoDe = (id: string) => painel.portfolio.find((p) => p.id === id);

  return (
    <>
      <CabecalhoSecao titulo="Captadoras" sub="parceiras de fora que recebem comissão — o percentual é combinado por projeto, no cartão do portfólio">
        {!como && <Botao onClick={() => abrirNovo("captadora")}>+ Captadora</Botao>}
      </CabecalhoSecao>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {lista.map((c) => {
          const t = totais(painel.negociacoes.filter((n) => n.captadoraId === c.id), painel.portfolio);
          const conf = painel.negociacoes.filter((n) => n.captadoraId === c.id && confirmada(n));
          return (
            <Painel
              key={c.id} className="mb-0"
              titulo={<span className="font-display text-2xl font-normal normal-case tracking-normal text-ink">{c.nome}</span>}
              acoes={!como && <Botao variante="fantasma" tamanho="pequeno" onClick={() => abrirEdicao("captadora", c.id)}>Editar</Botao>}
            >
              <div className="mb-2 text-sm text-muted">{[c.area, c.contato].filter(Boolean).join(" · ") || "sem contato cadastrado"}</div>
              <div className="mb-2 grid grid-cols-3 gap-2">
                {([["Abertas", String(t.abertas)], ["Confirmado", brl(t.confirmado)], ["Comissão a pagar", brl(t.aPagar) + (t.estimada ? "*" : "")]] as [string, string][]).map(([rot, val]) => (
                  <div key={rot} className="rounded-md bg-bg-sunk px-3 py-2">
                    <div className="font-mono text-3xs uppercase text-muted">{rot}</div>
                    <div className="font-semibold tabular-nums">{val}</div>
                  </div>
                ))}
              </div>
              {conf.map((n) => {
                const cm = comissao(n, projetoDe(n.projetoId));
                return (
                  <Linha key={n.id} direita={<Badge tom={n.comissaoPaga ? "ok" : "aviso"}>{n.comissaoPaga ? "paga" : "a pagar"}</Badge>}>
                    <b>{nomeEmpresa(n.empresaId)}</b> <span className="text-muted">· {nomeProjeto(n.projetoId)} · {brl(n.valor)}</span>
                    <div className="text-sm text-muted">{cm && cm.valor != null ? "comissão " + brl(cm.valor) + (cm.estimada ? " (estimativa)" : "") : "comissão sem percentual combinado"}</div>
                  </Linha>
                );
              })}
              {!conf.length && <Vazio emLinha>Nenhuma negociação confirmada ainda.</Vazio>}
              {c.obs && <p className="m-0 mt-2 text-sm">{c.obs}</p>}
              {t.estimada && <div className="mt-2 text-xs text-faint">* estimativa sobre o valor fechado, enquanto a regra da comissão está a definir.</div>}
            </Painel>
          );
        })}
        {!lista.length && <Vazio>Nenhuma captadora cadastrada.</Vazio>}
      </div>
    </>
  );
}
