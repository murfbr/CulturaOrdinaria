/* Mapa de máquinas: uma linha por terminal, com o ID da estação como chave
   da reconciliação e os totais por natureza (bar, bar interno, porta e comida). */
import { R, soma } from "../calculo";
import { alterarEdicao } from "../dados";
import { usarModalCampos } from "../ModalCampos";
import { camposMaquina } from "./pedidos";
import type { Edicao, Maquina, Painel } from "../tipos";

export function Maquinas({ painel, e }: { painel: Painel; e: Edicao }) {
  const modal = usarModalCampos();
  const lista = e.maquinas;
  const naturezas = painel.presets.naturezasMaquina;
  const temVendas = lista.some((m) => m.vendas != null);
  const porNatureza = (n: string) => soma(lista.filter((m) => m.nat === n), (m) => m.vendas);

  /** i = índice na lista; null = nova máquina. */
  function editar(i: number | null) {
    const atual: Maquina = i == null ? { n: lista.length + 1, resp: "", nat: naturezas[0] || "Bar", vendas: null, fontes: "", estacao: "" } : lista[i];
    modal.abrir({
      titulo: i == null ? "Nova máquina" : "Editar máquina",
      campos: camposMaquina(naturezas),
      valores: atual as unknown as Record<string, unknown>,
      aoAplicar: (s) => alterarEdicao(e.id, (ed) => {
        if (i == null) ed.maquinas.push({ ...atual, ...s } as Maquina);
        else Object.assign(ed.maquinas[i], s);
        ed.maquinas.sort((a, b) => (a.n || 0) - (b.n || 0));
      }),
      aoExcluir: i == null ? undefined : () => {
        if (window.confirm("Excluir esta máquina?")) alterarEdicao(e.id, (ed) => { ed.maquinas.splice(i, 1); });
      },
    });
  }

  return (
    <section id="e-maquinas">
      <div className="sechead">
        <div><div className="sdp-eyebrow">{e.nome} · faturamento</div><h2>Mapa de máquinas</h2></div>
        <div className="actions"><button className="sdp-btn small" onClick={() => editar(null)}>+ Máquina</button></div>
      </div>
      <p className="lead">Uma linha por terminal. A chave confiável é o ID da estação, nunca o nome de usuário no cupom.</p>
      {e.maquinasObs && <div className="editnote">✎ {e.maquinasObs}</div>}
      {temVendas && (
        <div className="sdp-grid sdp-g3" style={{ marginBottom: 18 }}>
          <div className="sdp-card"><div className="k">Bar (garçons)</div><div className="v green">{R(porNatureza("Bar"))}</div><div className="foot">{lista.filter((m) => m.nat === "Bar").length} máquinas</div></div>
          <div className="sdp-card"><div className="k">Bar interno / cortesia</div><div className="v">{R(porNatureza("Bar interno"))}</div><div className="foot">não entra como receita</div></div>
          <div className="sdp-card"><div className="k">Porta + comida</div><div className="v">{R(porNatureza("Porta") + porNatureza("Comida"))}</div><div className="foot">{lista.filter((m) => m.nat === "Porta" || m.nat === "Comida").length} máquinas</div></div>
        </div>
      )}
      <div className="tw">
        <table>
          <thead><tr><th style={{ width: 40 }}>#</th><th>Responsável</th><th>Natureza</th><th>ID estação</th><th className="num">Vendas</th><th>Fontes</th><th /></tr></thead>
          <tbody>
            {lista.map((m, i) => (
              <tr key={i}>
                <td>{m.n}</td>
                <td>{m.resp}</td>
                <td>{m.nat}</td>
                <td>{m.estacao || "—"}</td>
                <td className="num">{m.vendas != null ? R(m.vendas) : "—"}</td>
                <td><span className="m">{m.fontes}</span></td>
                <td className="rowact"><button className="sdp-btn small" onClick={() => editar(i)}>editar</button></td>
              </tr>
            ))}
            {temVendas && <tr className="total"><td colSpan={4}>Total</td><td className="num">{R(soma(lista, (m) => m.vendas))}</td><td colSpan={2} /></tr>}
          </tbody>
        </table>
      </div>
      {modal.elemento}
    </section>
  );
}
