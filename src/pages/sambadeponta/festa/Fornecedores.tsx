/* Fornecedores: os contatos do tipo Fornecedor da Central (Pessoas → Contatos
   externos). "Último preço" não se digita: é o realizado das linhas de custo
   vinculadas a ele na última edição fechada. */
import { R, fornecedores, ultimoPreco } from "../calculo";
import { contatoNovo, excluirContato, salvarContato } from "../dados";
import { usarModalCampos } from "../ModalCampos";
import { CAMPOS_FORNECEDOR } from "./pedidos";
import type { Contato } from "../../../types";
import type { Painel } from "../tipos";

export function Fornecedores({ painel }: { painel: Painel }) {
  const modal = usarModalCampos();
  const lista = fornecedores(painel);

  function editar(c: Contato | null) {
    const atual = c || contatoNovo();
    modal.abrir({
      titulo: c ? "Editar fornecedor" : "Novo fornecedor",
      campos: CAMPOS_FORNECEDOR,
      valores: atual as unknown as Record<string, unknown>,
      aoAplicar: (s) => { if (s.nome) salvarContato({ ...atual, ...s } as Contato); },
      aoExcluir: c ? () => { if (window.confirm(`Excluir o contato "${c.nome}"? (vai para a lixeira da Central)`)) excluirContato(c.id); } : undefined,
    });
  }

  return (
    <section id="l-fornecedores">
      <div className="sechead">
        <div><div className="sdp-eyebrow">Festa · rede</div><h2>Fornecedores e equipe</h2></div>
        <div className="actions"><button className="sdp-btn small" onClick={() => editar(null)}>+ Fornecedor</button></div>
      </div>
      <p className="lead">
        Contatos do tipo Fornecedor, os mesmos de Pessoas → Contatos externos na Central. O último preço vem das
        linhas de custo vinculadas ao contato na última edição fechada.
      </p>
      <div className="tw">
        <table>
          <thead><tr><th>Nome</th><th>Serviço</th><th>Contato</th><th>Último preço</th><th>Obs.</th><th /></tr></thead>
          <tbody>
            {lista.map((c) => {
              const ultimo = ultimoPreco(painel, c.id);
              return (
                <tr key={c.id}>
                  <td><b>{c.nome}</b></td>
                  <td>{c.ref}</td>
                  <td>{c.contato || "—"}</td>
                  <td>{ultimo ? <>{R(ultimo.valor)} <span className="m">{ultimo.edicao.nome}</span></> : <span className="m">sem linha de custo vinculada</span>}</td>
                  <td><span className="m">{c.obs}</span></td>
                  <td className="rowact"><button className="sdp-btn small" onClick={() => editar(c)}>editar</button></td>
                </tr>
              );
            })}
            {!lista.length && <tr><td colSpan={6}><span className="m">nenhum contato do tipo Fornecedor ainda</span></td></tr>}
          </tbody>
        </table>
      </div>
      {modal.elemento}
    </section>
  );
}
