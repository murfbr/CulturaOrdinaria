/* Vistas panorâmicas dos editais (as do Mapa dos Editais): critérios por
   conceito, campos de formulário por conceito, lacunas por quem resolve e os
   alertas que mudam decisão. Tudo derivado dos registros de edital. */
import { abrirDetalhe } from "../../../store/navegacao";
import { nomeCurto } from "../../../lib/nomes";
import {
  CONCEITOS_CAMPO, CONCEITOS_CRITERIO, QUEM_RESOLVE, type AlertaEdital, type Edital,
} from "../../../types";

const abrir = (id: string) => abrirDetalhe("edital", id);

/** Critérios: pontos por conceito em cada edital (em % do total, para comparar). */
export function MatrizCriterios({ editais }: { editais: Edital[] }) {
  const com = editais.filter((e) => (e.criterios || []).some((c) => c.pontos));
  const conceitos = CONCEITOS_CRITERIO.filter(([k]) => com.some((e) => (e.criterios || []).some((c) => c.conceito === k)));
  if (!com.length) return <p className="muted">Nenhum edital com critérios pontuados nesses filtros.</p>;
  return (
    <>
      <p className="hint" style={{ marginTop: 0 }}>
        Quanto cada conceito pesa na nota de cada edital, em % do total de pontos. Clique no nome para abrir o edital.
        Edital sem critério público (patrocínio, cadastro) fica fora.
      </p>
      <div className="tbl-wrap matriz">
        <table>
          <thead>
            <tr><th>Edital</th>{conceitos.map(([k, r]) => <th key={k} title={r}>{r}</th>)}<th>Total</th></tr>
          </thead>
          <tbody>
            {com.map((e) => {
              const total = (e.criterios || []).reduce((s, c) => s + (c.pontos || 0), 0) || 1;
              return (
                <tr key={e.id}>
                  <td><a className="lnk" onClick={() => abrir(e.id)}>{nomeCurto(e)}</a></td>
                  {conceitos.map(([k]) => {
                    const pts = (e.criterios || []).filter((c) => c.conceito === k).reduce((s, c) => s + (c.pontos || 0), 0);
                    const pct = Math.round((100 * pts) / total);
                    return <td key={k} className="num" style={pts ? { background: `rgba(228,87,46,${Math.min(0.08 + pct / 120, 0.7)})` } : undefined}>{pts ? pct + "%" : ""}</td>;
                  })}
                  <td className="num muted">{e.criteriosTotal ?? total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Campos do formulário por conceito: onde o mesmo texto se repete, e com que limite. */
export function MatrizCampos({ editais }: { editais: Edital[] }) {
  const com = editais.filter((e) => (e.formCampos || []).length);
  const conceitos = CONCEITOS_CAMPO.filter(([k]) => !["cadastro", "declaracao", "anexo", "enquadramento"].includes(k))
    .map(([k, r]) => ({ k, r, n: com.filter((e) => (e.formCampos || []).some((c) => c.conceito === k)).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);
  if (!com.length) return <p className="muted">Nenhum edital com campos de formulário mapeados nesses filtros.</p>;
  const celula = (e: Edital, k: string) => {
    const cs = (e.formCampos || []).filter((c) => c.conceito === k);
    if (!cs.length) return "";
    const limites = cs.map((c) => (c.limite ? c.limite.toLocaleString("pt-BR") + (c.unidade === "palavras" ? "p" : c.unidade === "páginas" ? "pg" : "") : "livre"));
    return limites.join(" + ");
  };
  return (
    <>
      <p className="hint" style={{ marginTop: 0 }}>
        Os textos que os formulários pedem, por conceito (colunas ordenadas pelo quanto se repetem), com o limite de
        caracteres de cada campo (p = palavras, pg = páginas). É a base dos textos-mestres: escrever uma vez, ajustar o tamanho.
      </p>
      <div className="tbl-wrap matriz">
        <table>
          <thead>
            <tr><th>Edital</th>{conceitos.map((c) => <th key={c.k} title={c.r + " · aparece em " + c.n}>{c.r} <span className="muted">({c.n})</span></th>)}</tr>
          </thead>
          <tbody>
            {com.map((e) => (
              <tr key={e.id}>
                <td><a className="lnk" onClick={() => abrir(e.id)}>{nomeCurto(e)}</a></td>
                {conceitos.map((c) => {
                  const v = celula(e, c.k);
                  return <td key={c.k} className="num" style={v ? { background: "rgba(46,158,91,.12)" } : undefined}>{v}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** O que falta saber de cada edital, agrupado por quem consegue resolver. */
export function QuemResolve({ editais }: { editais: Edital[] }) {
  const itens = editais.flatMap((e) => (e.lacunas || []).filter((l) => l.status !== "fechada").map((l) => ({ e, l })));
  const grupos = Object.keys(QUEM_RESOLVE).filter((c) => c !== "fechada" && itens.some((x) => x.l.cat === c));
  if (!itens.length) return <p className="muted">Nenhuma lacuna aberta nesses filtros.</p>;
  return (
    <>
      {grupos.map((c) => (
        <div className="panel" key={c}>
          <h4>{QUEM_RESOLVE[c]} <span className="act"><span className="badge st-prev">{itens.filter((x) => x.l.cat === c).length}</span></span></h4>
          {itens.filter((x) => x.l.cat === c).map(({ e, l }, i) => (
            <div className="lac" key={e.id + i}>
              <div><a className="lnk" onClick={() => abrir(e.id)}>{nomeCurto(e)}</a> · <b>{l.lacuna}</b> <span className="muted">({l.status})</span></div>
              {l.achado && <div className="lac-t">{l.achado}</div>}
              {l.por_que && <div className="lac-p">{l.por_que}</div>}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

/** Alertas que mudam decisão, sem repetir o mesmo alerta de editais diferentes. */
export function ListaAlertas({ editais }: { editais: Edital[] }) {
  const vistos = new Set<string>();
  const alertas: (AlertaEdital & { donos: Edital[] })[] = [];
  for (const e of editais) {
    for (const a of e.alertas || []) {
      if (vistos.has(a.titulo)) { alertas.find((x) => x.titulo === a.titulo)?.donos.push(e); continue; }
      vistos.add(a.titulo);
      alertas.push({ ...a, donos: [e] });
    }
  }
  if (!alertas.length) return <p className="muted">Nenhum alerta nesses filtros.</p>;
  return (
    <>
      <p className="hint" style={{ marginTop: 0 }}>Do "O que muda decisão" do Mapa dos Editais (levantamento de 23/09/2026). Confira a data antes de agir.</p>
      {alertas.map((a) => (
        <div className="panel alerta-panel" key={a.titulo}>
          <h4 style={{ textTransform: "none", letterSpacing: 0, fontSize: 14, color: "var(--ink)" }}>
            {a.titulo}
            <span className="act">{a.quando && <span className="badge ur-d7">{a.quando}</span>}</span>
          </h4>
          <p style={{ margin: "0 0 6px" }}>{a.texto}</p>
          {a.fazer && <p style={{ margin: "0 0 6px" }}><b>Fazer:</b> {a.fazer}</p>}
          <div className="muted" style={{ fontSize: 12 }}>
            {a.donos.map((e, i) => <span key={e.id}>{i > 0 && ", "}<a className="lnk" onClick={() => abrir(e.id)}>{nomeCurto(e)}</a></span>)}
            {a.fonte && <> · fonte: {a.fonte}</>}
          </div>
        </div>
      ))}
    </>
  );
}
