/* Orçamento da edição: custos fixos previsto × realizado item a item e por
   categoria (do preset de festa), com a comparação contra a última edição
   fechada enquanto a edição está em produção; e os custos variáveis
   (bebida, comissão, taxa). O fornecedor de cada linha é um contato da
   Central quando vinculado; senão, texto. */
import { Fragment } from "react";
import {
  N, ORDEM_STATUS_CUSTO, R, R2, ROTULO_STATUS_CUSTO, aplicarStatusCusto, br, casarItem, comSinal, fornecedores, nomeFornecedor,
  pct, previsto, soma, totaisPorStatus, valor, type Calculo,
} from "../calculo";
import { uid } from "../../../utils";
import { alterarEdicao } from "../dados";
import { usarModalCampos } from "../ModalCampos";
import { Barras } from "./Barras";
import { camposCusto, pedidoVariaveis } from "./pedidos";
import type { Custo, Edicao, Painel } from "../tipos";

const classeDif = (d: number | null) => (d == null ? "" : d > 0 ? "diffpos" : d < 0 ? "diffneg" : "");
const textoDif = (d: number | null) => (d == null ? "—" : d === 0 ? "=" : comSinal(d));
const pctTexto = (a: number, b: number) => ((pct(a, b) ?? 0) >= 0 ? "+" : "") + (pct(a, b) || 0).toFixed(1) + "%";

export function Orcamento({ painel, e, k }: { painel: Painel; e: Edicao; k: Calculo }) {
  const modal = usarModalCampos();
  const fechada = k.fechada;
  const anterior = k.anterior;
  const comparar = !fechada && anterior !== null;
  const categorias = painel.presets.categoriasCusto;

  // Itens por categoria, na ordem do preset (categorias fora da lista vão para o fim).
  const porCat = new Map<string, Custo[]>();
  categorias.forEach((c) => porCat.set(c, []));
  e.custos.forEach((c) => { if (!porCat.has(c.cat)) porCat.set(c.cat, []); porCat.get(c.cat)!.push(c); });
  const cats = [...porCat.keys()].filter((c) => porCat.get(c)!.length);

  const totP = soma(e.custos, previsto);
  const totR = soma(e.custos, (c) => c.realizado);
  const temRealizado = e.custos.some((c) => c.realizado != null);
  const t = totaisPorStatus(e);
  const totAnterior = anterior ? soma(anterior.custos, (c) => c.realizado) : 0;
  const usados = new Set(comparar ? e.custos.map((x) => casarItem(x, anterior)).filter((m): m is Custo => Boolean(m)).map((m) => m.id) : []);

  function editarCusto(c: Custo | null) {
    const atual: Custo = c || { id: uid("c"), ref: "", cat: categorias[1] || categorias[0] || "", item: "", qtd: 1, unit: null, realizado: null, fornecedor: "", contatoId: "", adiantadoPor: "", status: "previsto", venc: "", obs: "" };
    modal.abrir({
      titulo: c ? "Editar custo (previsto = quantidade × unitário)" : "Novo item de custo",
      campos: camposCusto(painel.pagina.socios, categorias, fornecedores(painel)),
      valores: atual as unknown as Record<string, unknown>,
      aoAplicar: (s) => {
        if (!s.item) return;
        alterarEdicao(e.id, (ed) => {
          const i = ed.custos.findIndex((x) => x.id === atual.id);
          const antes = i >= 0 ? ed.custos[i] : atual;
          const editado = { ...antes, ...s } as Custo;
          // Regra do pago: realizado em branco com status pago vira o orçado; exceção digitada fica.
          const final = aplicarStatusCusto({ ...editado, status: antes.status }, editado.status);
          if (i >= 0) ed.custos[i] = final;
          else ed.custos.push(final);
        });
      },
      aoExcluir: c ? () => {
        if (window.confirm(`Excluir "${c.item}"?`)) alterarEdicao(e.id, (ed) => { ed.custos = ed.custos.filter((x) => x.id !== c.id); });
      } : undefined,
    });
  }

  /** previsto → contratado → pago → previsto; pago preenche o realizado com o orçado (ver aplicarStatusCusto). */
  function girarStatus(c: Custo) {
    alterarEdicao(e.id, (ed) => {
      const i = ed.custos.findIndex((x) => x.id === c.id);
      if (i < 0) return;
      const proximo = ORDEM_STATUS_CUSTO[(ORDEM_STATUS_CUSTO.indexOf(ed.custos[i].status) + 1) % 3];
      ed.custos[i] = aplicarStatusCusto(ed.custos[i], proximo);
    });
  }

  const nColunas = (fechada ? 6 : comparar ? 8 : 6) + 1;

  return (
    <section id="e-orcamento">
      <div className="sechead">
        <div><div className="sdp-eyebrow">{e.nome} · custos fixos</div><h2>Orçamento</h2></div>
        <div className="actions"><button className="sdp-btn small" onClick={() => editarCusto(null)}>+ Item</button></div>
      </div>
      {fechada ? (
        <p className="lead">Previsto (quantidade × unitário da previsão original) contra realizado, item a item.</p>
      ) : (
        <p className="lead">
          Previsto = quantidade × valor unitário.{" "}
          {anterior ? `A coluna "${anterior.nome}" traz o realizado da última edição: o que já sabemos que fica mais caro aparece em vermelho, o que fica mais barato em verde. ` : ""}
          Troque o status (previsto → contratado → pago) e lance o realizado conforme fecha cada item.
        </p>
      )}

      {fechada ? (
        <div className="sdp-grid sdp-g4">
          <div className="sdp-card"><div className="k">Previsto</div><div className="v">{R(totP)}</div><div className="foot">orçamento original</div></div>
          <div className="sdp-card"><div className="k">Realizado</div><div className={"v " + (totR > totP ? "red" : "green")}>{R(totR)}</div><div className="foot">{comSinal(totR - totP)} ({(pct(totR, totP) || 0).toFixed(0)}%)</div></div>
          <div className="sdp-card"><div className="k">Itens não previstos</div><div className="v">{R(soma(e.custos.filter((c) => previsto(c) === 0), (c) => c.realizado))}</div><div className="foot">{e.custos.filter((c) => previsto(c) === 0 && c.realizado).length} itens</div></div>
          <div className="sdp-card hl"><div className="k">Resultado</div><div className="v">{R(k.resultado)}</div><div className="foot">receita {R(k.receita)} − despesa {R(k.despesa)}</div></div>
        </div>
      ) : (
        <div className="sdp-grid sdp-g4">
          <div className="sdp-card"><div className="k">Custos fixos previstos</div><div className="v">{R(totP)}</div><div className="foot">{e.custos.length} itens{temRealizado ? " · realizado até agora " + R(totR) : ""}</div></div>
          {anterior ? (
            <>
              <div className="sdp-card"><div className="k">{anterior.nome} (realizado)</div><div className="v">{R(totAnterior)}</div><div className="foot">{anterior.custos.length} itens</div></div>
              <div className="sdp-card"><div className="k">Diferença</div><div className={"v " + (totP > totAnterior ? "red" : "green")}>{comSinal(totP - totAnterior)}</div><div className="foot">{pctTexto(totP, totAnterior)} vs. {anterior.nome}</div></div>
            </>
          ) : (
            <div className="sdp-card"><div className="k">Contratado</div><div className="v">{R(t.contratado)}</div><div className="foot">inclui os pagos</div></div>
          )}
          <div className="sdp-card hl"><div className="k">Resultado projetado</div><div className="v">{R(k.resultado)}</div><div className="foot">com a simulação: {N(e.sim?.publico)} pessoas · bar {R2(e.sim?.ticketBar)}/presente</div></div>
        </div>
      )}

      <div className="ksub">Pagamentos</div>
      <div className="sdp-grid sdp-g4">
        <div className="sdp-card"><div className="k">Contratado</div><div className="v">{R(t.contratado)}</div><div className="foot">{t.itens.contratado + t.itens.pago} itens, inclui os pagos</div></div>
        <div className="sdp-card"><div className="k">Pago</div><div className="v green">{R(t.pago)}</div><div className="foot">{t.itens.pago} itens</div></div>
        <div className={"sdp-card" + (t.aPagar > 0 ? " hl" : "")}><div className="k">A pagar</div><div className="v">{R(t.aPagar)}</div><div className="foot">contratado − pago</div></div>
        <div className="sdp-card"><div className="k">Ainda previsto</div><div className="v">{R(t.emAberto)}</div><div className="foot">{t.itens.previsto} itens sem contrato</div></div>
      </div>

      {comparar ? (() => {
        const catAnterior = new Map<string, number>();
        anterior!.custos.forEach((c) => catAnterior.set(c.cat, (catAnterior.get(c.cat) || 0) + (c.realizado || 0)));
        const todas = [...new Set([...categorias, ...porCat.keys(), ...catAnterior.keys()])]
          .filter((c) => (porCat.get(c) || []).length || catAnterior.get(c));
        return (
          <>
            <div className="ksub">Por categoria: previsto vs. {anterior!.nome}</div>
            <div className="tw">
              <table>
                <thead><tr><th>Categoria</th><th className="num">Previsto</th><th className="num">{anterior!.nome}</th><th className="num">Diferença</th><th className="num">%</th></tr></thead>
                <tbody>
                  {todas.map((c) => {
                    const a = soma(porCat.get(c) || [], valor);
                    const b = catAnterior.get(c) || 0;
                    const d = a - b;
                    return (
                      <tr key={c}>
                        <td>{c}</td><td className="num">{R(a)}</td><td className="num">{R(b)}</td>
                        <td className={"num " + classeDif(d)}>{comSinal(d)}</td>
                        <td className="num">{b ? ((d / b) * 100 >= 0 ? "+" : "") + ((d / b) * 100).toFixed(0) + "%" : "novo"}</td>
                      </tr>
                    );
                  })}
                  <tr className="total">
                    <td>Total custos fixos</td><td className="num">{R(totP)}</td><td className="num">{R(totAnterior)}</td>
                    <td className="num">{comSinal(totP - totAnterior)}</td><td className="num">{pctTexto(totP, totAnterior)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        );
      })() : (
        <>
          <div className="ksub">Por categoria</div>
          <Barras linhas={cats.map((c) => [c, soma(porCat.get(c)!, valor)])} max={Math.max(1, ...cats.map((c) => soma(porCat.get(c)!, valor)))} classe="dk" />
        </>
      )}

      <div className="ksub">Item a item</div>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Item</th><th>Fornecedor</th><th className="num">Previsto</th>
              {comparar && <><th className="num">{anterior!.nome}</th><th className="num">Dif.</th></>}
              <th className="num">Realizado</th>
              {fechada && <th className="num">Dif.</th>}
              <th>Status</th><th />
            </tr>
          </thead>
          <tbody>
            {cats.map((cat) => {
              const itens = porCat.get(cat)!;
              const sp = soma(itens, previsto);
              const sr = soma(itens, (c) => c.realizado);
              const ar = itens.some((x) => x.realizado != null);
              const spe = comparar ? soma(itens.map((x) => casarItem(x, anterior)).filter((m): m is Custo => Boolean(m)), (m) => m.realizado) : 0;
              return (
                <Fragment key={cat}>
                  <tr className="cat"><td colSpan={nColunas}>{cat}</td></tr>
                  {itens.map((x) => {
                    const p = previsto(x);
                    const socio = painel.pagina.socios.find((s) => s.id === x.adiantadoPor);
                    const m = comparar ? casarItem(x, anterior) : null;
                    const dp = m ? p - (m.realizado || 0) : null;
                    const dr = x.realizado != null ? x.realizado - p : null;
                    return (
                      <tr key={x.id}>
                        <td>
                          {x.item}
                          <span className="m">
                            {x.qtd} × {R2(x.unit)}
                            {fechada && x.qtdReal != null && (x.qtdReal !== x.qtd || x.unitReal !== x.unit) ? ` · realizado ${x.qtdReal} × ${R2(x.unitReal)}` : ""}
                          </span>
                          {x.obs && <span className="m">{x.obs}</span>}
                          {socio && <span className="tag neutral" title="pago adiantado, entra no acerto">adiantado por {socio.nome}</span>}
                        </td>
                        <td>{nomeFornecedor(painel, x) || "—"}{x.contatoId ? "" : x.fornecedor ? <span className="m">sem cadastro</span> : null}</td>
                        <td className="num">{R(p)}</td>
                        {comparar && (
                          <>
                            <td className="num">{m ? R(m.realizado) : <span className="tag warn">novo</span>}</td>
                            <td className={"num " + classeDif(dp)}>{textoDif(dp)}</td>
                          </>
                        )}
                        <td className="num">{x.realizado != null ? R(x.realizado) : "—"}</td>
                        {fechada && <td className={"num " + classeDif(dr)}>{textoDif(dr)}</td>}
                        <td>
                          <span className={"tag click " + (x.status === "pago" ? "ok" : x.status === "contratado" ? "warn" : "neutral")}
                            title="clique para mudar" onClick={() => girarStatus(x)}>
                            {ROTULO_STATUS_CUSTO[x.status] || x.status}
                          </span>
                          {x.venc && <span className="m">venc. {br(x.venc)}</span>}
                        </td>
                        <td className="rowact"><button className="sdp-btn small" onClick={() => editarCusto(x)}>editar</button></td>
                      </tr>
                    );
                  })}
                  <tr className="subtot">
                    <td colSpan={2}>Subtotal {cat}</td><td className="num">{R(sp)}</td>
                    {comparar && <><td className="num">{R(spe)}</td><td className="num">{comSinal(sp - spe)}</td></>}
                    <td className="num">{ar ? R(sr) : "—"}</td>
                    {fechada && <td className="num">{ar ? comSinal(sr - sp) : "—"}</td>}
                    <td colSpan={2} />
                  </tr>
                </Fragment>
              );
            })}
            <tr className="total">
              <td colSpan={2}>Total custos fixos</td><td className="num">{R(totP)}</td>
              {comparar && <><td className="num">{R(totAnterior)}</td><td className="num">{comSinal(totP - totAnterior)}</td></>}
              <td className="num">{temRealizado ? R(totR) : "—"}</td>
              {fechada && <td className="num">{temRealizado ? comSinal(totR - totP) : "—"}</td>}
              <td colSpan={2} />
            </tr>
          </tbody>
        </table>
      </div>

      {comparar && (() => {
        const removidos = anterior!.custos.filter((c) => !usados.has(c.id) && c.realizado);
        return (
          <>
            {removidos.length > 0 && (
              <div className="note">
                <b>Itens de {anterior!.nome} que não estão neste orçamento</b> (já descontados na diferença):{" "}
                {removidos.map((c) => `${c.item} (${R(c.realizado)})`).join(" · ")}.
              </div>
            )}
            <div className="note">
              A diferença total de {comSinal(totP - totAnterior)} já inclui os itens novos e os que saíram. Itens novos com
              valor zero (a cotar) não estão contando ainda.
            </div>
          </>
        );
      })()}

      <div className="sechead" style={{ marginTop: 28 }}>
        <div className="ksub" style={{ margin: 0 }}>Custos variáveis{fechada ? "" : " (percentuais aplicados sobre a simulação)"}</div>
        <div className="actions">{!fechada && <button className="sdp-btn small" onClick={() => modal.abrir(pedidoVariaveis(e, k))}>Percentuais</button>}</div>
      </div>
      <div className="sdp-grid sdp-g3" style={{ marginTop: 10 }}>
        <div className="sdp-card">
          <div className="k">Bebida{fechada ? " (líquida)" : ` · ${(k.bebidaPct || 0).toFixed(1)}% do bar`}</div>
          <div className="v">{R(k.bebida)}</div>
          <div className="foot">
            {fechada ? (e.variaveis?.bebidaObs || "") : e.variaveis?.bebidaPct != null ? "percentual definido à mão" : anterior ? `proporção bebida ÷ bar de ${anterior.nome}` : "sem edição anterior para basear"}
          </div>
        </div>
        <div className="sdp-card">
          <div className="k">Comissão garçons {e.variaveis?.comissaoPct || 0}%</div>
          <div className="v">{R(k.comissao)}</div>
          <div className="foot">{fechada && e.variaveis?.comissaoBase ? `sobre ${R(e.variaveis.comissaoBase)} de vendas dos garçons` : "sobre a receita de bar"}</div>
        </div>
        <div className="sdp-card">
          <div className="k">Taxa do sistema {e.variaveis?.taxaPct || 0}%</div>
          <div className="v">{R(k.taxa)}</div>
          <div className="foot">sobre a receita total</div>
        </div>
      </div>
      {modal.elemento}
    </section>
  );
}
