/* Fechamento: resultado e divisão entre sócios, composição, receitas,
   público e digital, curva de retiradas, acerto, balanço, Instagram e os
   arquivos da edição. */
import { N, R, R2, acerto, type Calculo } from "../calculo";
import { alterarEdicao } from "../dados";
import { usarModalCampos } from "../ModalCampos";
import { Barras } from "./Barras";
import { CAMPOS_ARQUIVO, CAMPOS_FECHAMENTO } from "./pedidos";
import type { Arquivo, Edicao, Kpis, Painel } from "../tipos";

const RECEITAS: [string, keyof Calculo["rec"]][] = [["Bar", "bar"], ["Porta", "porta"], ["Comida", "comida"], ["Sympla", "sympla"]];

export function Fechamento({ painel, e, k }: { painel: Painel; e: Edicao; k: Calculo }) {
  const modal = usarModalCampos();
  const p: Kpis = e.kpis || { publico: null, retiradas: null, visitas: null, emails: null, checkin: null, ads: null };
  const fechada = k.fechada;
  const socios = painel.pagina.socios;
  const linhasAcerto = fechada || e.custos.some((c) => c.adiantadoPor) ? acerto(painel, e) : null;
  const maxCurva = Math.max(1, ...e.curva.map((c) => c.n));

  function editarFechamento() {
    const rec = e.receitas;
    const v = e.variaveis;
    modal.abrir({
      titulo: "Fechamento: receitas, variáveis e público",
      campos: CAMPOS_FECHAMENTO,
      valores: {
        bar: rec?.bar, porta: rec?.porta, comida: rec?.comida, sympla: rec?.sympla,
        bebida: v?.bebida, bebidaObs: v?.bebidaObs || "", comissaoPct: v?.comissaoPct, comissaoBase: v?.comissaoBase, taxaPct: v?.taxaPct,
        publico: p.publico, retiradas: p.retiradas, visitas: p.visitas, emails: p.emails, checkin: p.checkin, ads: p.ads,
        instagram: e.instagram || "", acertoObs: e.acertoObs || "",
      },
      aoAplicar: (o) => alterarEdicao(e.id, (ed) => {
        const n = (x: unknown) => x as number | null;
        ed.receitas = { bar: n(o.bar), porta: n(o.porta), comida: n(o.comida), sympla: n(o.sympla) };
        ed.variaveis = { ...ed.variaveis, bebida: n(o.bebida), bebidaObs: String(o.bebidaObs || ""), comissaoPct: n(o.comissaoPct), comissaoBase: n(o.comissaoBase), taxaPct: n(o.taxaPct) };
        ed.kpis = { publico: n(o.publico), retiradas: n(o.retiradas), visitas: n(o.visitas), emails: n(o.emails), checkin: n(o.checkin), ads: n(o.ads) };
        ed.instagram = String(o.instagram || "");
        ed.acertoObs = String(o.acertoObs || "");
      }),
    });
  }

  function adicionarPonto(lado: "certo" | "errado") {
    modal.abrir({
      titulo: lado === "certo" ? "O que funcionou" : "O que pesou",
      campos: [{ k: "texto", label: "Texto", type: "textarea", full: true }],
      valores: { texto: "" },
      aoAplicar: (o) => { if (o.texto) alterarEdicao(e.id, (ed) => { ed.balanco[lado].push(String(o.texto)); }); },
    });
  }
  const removerPonto = (lado: "certo" | "errado", i: number) => alterarEdicao(e.id, (ed) => { ed.balanco[lado].splice(i, 1); });

  /** i = índice na lista; null = novo arquivo. */
  function editarArquivo(i: number | null) {
    const atual: Arquivo = i == null ? { nome: "", desc: "", url: "" } : e.arquivos[i];
    modal.abrir({
      titulo: i == null ? "Novo arquivo" : "Editar arquivo",
      campos: CAMPOS_ARQUIVO,
      valores: atual as unknown as Record<string, unknown>,
      aoAplicar: (s) => {
        if (!s.nome) return;
        alterarEdicao(e.id, (ed) => {
          ed.arquivos = ed.arquivos || [];
          if (i == null) ed.arquivos.push({ ...atual, ...s } as Arquivo);
          else Object.assign(ed.arquivos[i], s);
        });
      },
      aoExcluir: i == null ? undefined : () => {
        if (window.confirm("Excluir este arquivo da lista?")) alterarEdicao(e.id, (ed) => { ed.arquivos.splice(i, 1); });
      },
    });
  }

  const pontos = (lado: "certo" | "errado") => {
    const itens = e.balanco[lado];
    return (
      <>
        <ul>
          {itens.length
            ? itens.map((t, i) => <li key={i}>{t} <button className="sdp-btn small sdp-rm" onClick={() => removerPonto(lado, i)}>×</button></li>)
            : <li style={{ color: "var(--muted)" }}>a preencher</li>}
        </ul>
        <button className="sdp-btn small" onClick={() => adicionarPonto(lado)}>+ ponto</button>
      </>
    );
  };

  return (
    <section id="e-fechamento">
      <div className="sechead">
        <div><div className="sdp-eyebrow">{e.nome} · resultado</div><h2>Fechamento</h2></div>
        <div className="actions"><button className="sdp-btn small" onClick={editarFechamento}>Receitas, bebida e público</button></div>
      </div>
      {fechada ? (
        <p className="lead">{k.resultado < 0 ? "A despesa (operação, bebida, comissão e taxa) superou a receita." : "A receita cobriu a despesa (operação, bebida, comissão e taxa)."}</p>
      ) : (
        <p className="lead">Preencher depois do evento: receitas por máquina, relatório MYX, público e Sympla. Enquanto isso, os números abaixo vêm da simulação.</p>
      )}

      <div className={"result " + (k.resultado >= 0 ? "pos" : "")}>
        <div className="big">{R2(k.resultado)}</div>
        <div className="txt">
          <b>{fechada ? (k.resultado < 0 ? "Prejuízo" : "Lucro") + " do evento" : "Resultado projetado"}</b>
          <p>Receita {R(k.receita)} − despesa {R2(k.despesa)}. Divisão {socios.map((s) => s.nome).join(" / ")}.</p>
        </div>
      </div>
      <div className="split">
        {socios.map((s) => (
          <div className="s" key={s.id}>
            <div className="k">{s.nome} ({Math.round(100 / (socios.length || 1))}%)</div>
            <div className={"v " + (k.porSocio < 0 ? "neg" : "pos")}>{R2(k.porSocio)}</div>
          </div>
        ))}
      </div>

      <div className="ksub">Composição</div>
      <Barras max={Math.max(1, k.receita)} linhas={[
        ["Receita total", k.receita, "lime"], ["Operação", -k.operacao, "dk"], ["Bebida", -k.bebida, "red"],
        [`Comissão ${e.variaveis?.comissaoPct || 0}%`, -k.comissao, "red"], [`Taxa ${e.variaveis?.taxaPct || 0}%`, -k.taxa, "red"],
        ["Resultado", k.resultado, k.resultado < 0 ? "red" : "lime"],
      ]} />

      <div className="ksub">Receitas</div>
      <div className="sdp-grid sdp-g4">
        {RECEITAS.map(([rotulo, chave]) => {
          const v = k.rec[chave];
          return (
            <div className="sdp-card" key={chave}>
              <div className="k">{rotulo}</div>
              <div className={"v" + (chave === "bar" ? " green" : "")}>{R(v)}</div>
              <div className="foot">{k.receita ? Math.round(((v || 0) / k.receita) * 100) + "%" : ""}{fechada ? "" : " · previsto"}</div>
            </div>
          );
        })}
      </div>

      <div className="ksub">Público e digital</div>
      <div className="sdp-grid sdp-g4">
        <div className="sdp-card"><div className="k">Público real</div><div className="v green">{N(p.publico)}</div><div className="foot">{p.checkin != null ? "check-in Sympla: " + N(p.checkin) : "estimado"}</div></div>
        <div className="sdp-card"><div className="k">Retiradas</div><div className="v">{N(p.retiradas)}</div><div className="foot">{p.visitas != null ? N(p.visitas) + " visitas à página" : ""}</div></div>
        <div className="sdp-card"><div className="k">Comparecimento</div><div className="v">{p.publico && p.retiradas ? Math.round((p.publico / p.retiradas) * 100) + "%" : "—"}</div><div className="foot">presentes ÷ retiradas</div></div>
        <div className="sdp-card hl"><div className="k">E-mails capturados</div><div className="v">{N(p.emails)}</div><div className="foot">base para as próximas</div></div>
      </div>
      <div className="sdp-grid sdp-g4" style={{ marginTop: 16 }}>
        <div className="sdp-card"><div className="k">Receita por presente</div><div className="v">{p.publico ? R2(k.receita / p.publico) : "—"}</div></div>
        <div className="sdp-card">
          <div className="k">Ticket de bar por presente</div>
          <div className={"v " + (p.publico && (k.rec.bar || 0) / p.publico < 40 ? "red" : "")}>{p.publico ? R2((k.rec.bar || 0) / p.publico) : "—"}</div>
          <div className="foot">meta: acima de R$ 40</div>
        </div>
        <div className="sdp-card"><div className="k">Porta por presente</div><div className="v">{p.publico ? R2((k.rec.porta || 0) / p.publico) : "—"}</div></div>
        <div className="sdp-card">
          <div className="k">ADS por retirada</div>
          <div className="v green">{p.ads && p.retiradas ? R2(p.ads / p.retiradas) : "—"}</div>
          <div className="foot">ADS {R(p.ads)}{p.publico && p.ads ? " · " + R2(p.ads / p.publico) + " por presente" : ""}</div>
        </div>
      </div>

      {e.curva.length > 0 && (
        <>
          <div className="ksub">Curva de retiradas</div>
          <div className="curve">
            {e.curva.map((c) => (
              <div className={"sdp-col " + (/^dia|^D\+/i.test(c.dia) ? "d0" : "")} key={c.dia}>
                <span className="n">{N(c.n)}</span>
                <div className="b" style={{ height: (c.n / maxCurva) * 100 + "%" }} />
                <span className="d">{c.dia}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {linhasAcerto && (
        <>
          <div className="ksub">Acerto entre sócios</div>
          <div className="tw">
            <table>
              <thead><tr><th>Sócio</th><th className="num">Adiantou</th><th className="num">Parte no resultado</th><th className="num">Saldo a receber</th></tr></thead>
              <tbody>
                {linhasAcerto.map((a) => (
                  <tr key={a.socio.id}>
                    <td><b>{a.socio.nome}</b></td>
                    <td className="num">{R2(a.pagou)}</td>
                    <td className="num">{R2(a.devido)}</td>
                    <td className="num" style={{ fontWeight: 700, color: a.saldo >= 0 ? "var(--green)" : "var(--red)" }}>{R2(a.saldo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="note">
            Saldo = o que o sócio adiantou do próprio bolso + a parte dele no resultado. O ideal é que tudo saia do
            caixa do evento e esta tabela fique só com o resultado. {e.acertoObs || ""}
          </div>
        </>
      )}

      <div className="ksub">Balanço</div>
      <div className="wl">
        <div className="sdp-col win"><h3>✓ O que funcionou</h3>{pontos("certo")}</div>
        <div className="sdp-col loss"><h3>✕ O que pesou</h3>{pontos("errado")}</div>
      </div>

      <div className="ksub">Impacto Instagram</div>
      {e.instagram
        ? <div className="sdp-card">{e.instagram}</div>
        : <div className="note">A preencher: alcance, novos seguidores, engajamento dos posts e stories.</div>}

      <div className="sechead" style={{ marginTop: 28 }}>
        <div className="ksub" style={{ margin: 0 }}>Arquivos da edição</div>
        <div className="actions"><button className="sdp-btn small" onClick={() => editarArquivo(null)}>+ Arquivo</button></div>
      </div>
      <div className="files" style={{ marginTop: 10 }}>
        {(e.arquivos || []).map((a, i) => (
          <div className="file" key={i}>
            {a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer">{a.nome}</a> : <span className="fn">{a.nome}</span>}
            <span className="fd">{a.desc}</span>
            <span><button className="sdp-btn small" onClick={() => editarArquivo(i)}>editar</button></span>
          </div>
        ))}
      </div>
      {modal.elemento}
    </section>
  );
}
