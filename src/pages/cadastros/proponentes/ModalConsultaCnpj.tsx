/* Consulta os CNPJs na base pública da Receita e mostra, proponente por
   proponente, o que mudaria no cadastro (abertura, CNAE, sede, perfil e uma
   linha de observação com situação e razão social). Nada é gravado antes de
   "Aplicar". As consultas vão uma de cada vez, com pausa, para não esbarrar
   no limite do serviço. */
import { useEffect, useState } from "react";
import { Modal, RodapeModal } from "../../../components/Modal";
import { toast } from "../../../components/Toast";
import { salvarRegistro } from "../../../store/mutacoes";
import { consultarCnpj, mudancasPelaReceita, type DadosCnpj, type MudancaCampo } from "../../../lib/cnpj";
import type { Proponente } from "../../../types";
import { clonar } from "../../../utils";

type Resultado =
  | { estado: "esperando" | "consultando" }
  | { estado: "ok"; dados: DadosCnpj; mudancas: MudancaCampo[] }
  | { estado: "erro"; erro: string };

const RECEITA = "https://solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp";
const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Datas AAAA-MM-DD aparecem como DD/MM/AAAA. */
const mostrar = (campo: string, v: string) =>
  campo === "abertura" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v.split("-").reverse().join("/") : v;

export function ModalConsultaCnpj({ alvos, aoFechar }: { alvos: Proponente[]; aoFechar: () => void }) {
  const [res, setRes] = useState<Record<string, Resultado>>(() =>
    Object.fromEntries(alvos.map((p) => [p.id, { estado: "esperando" } as Resultado])));
  const [marcados, setMarcados] = useState<Set<string>>(new Set());

  useEffect(() => {
    let vivo = true;
    (async () => {
      for (const [i, p] of alvos.entries()) {
        if (!vivo) return;
        if (i > 0) await pausa(400);
        setRes((r) => ({ ...r, [p.id]: { estado: "consultando" } }));
        try {
          const dados = await consultarCnpj(p.cnpj);
          const mudancas = mudancasPelaReceita(p, dados);
          if (!vivo) return;
          setRes((r) => ({ ...r, [p.id]: { estado: "ok", dados, mudancas } }));
          if (mudancas.length) setMarcados((m) => new Set(m).add(p.id));
        } catch (e) {
          if (!vivo) return;
          setRes((r) => ({ ...r, [p.id]: { estado: "erro", erro: String((e as Error)?.message || e) } }));
        }
      }
    })();
    return () => { vivo = false; };
    // Consulta uma vez ao abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const terminou = alvos.every((p) => ["ok", "erro"].includes(res[p.id]?.estado));
  const algumErro = alvos.some((p) => res[p.id]?.estado === "erro");

  function aplicar() {
    let n = 0;
    for (const p of alvos) {
      const r = res[p.id];
      if (!marcados.has(p.id) || r?.estado !== "ok" || !r.mudancas.length) continue;
      const novo = clonar(p) as Proponente & Record<string, unknown>;
      r.mudancas.forEach((m) => { (novo as Record<string, unknown>)[m.campo] = m.depois; });
      salvarRegistro("proponentes", novo);
      n++;
    }
    toast(n ? `${n} proponente(s) atualizado(s) com os dados da Receita` : "Nada aplicado");
    aoFechar();
  }

  const alternar = (id: string) => setMarcados((m) => {
    const x = new Set(m);
    if (x.has(id)) x.delete(id); else x.add(id);
    return x;
  });

  return (
    <Modal titulo="Consultar CNPJ na Receita" aoFechar={aoFechar} largo>
      <p className="hint" style={{ marginTop: 0 }}>
        Base pública da Receita (via BrasilAPI): só dados da empresa, sem sócios, endereço ou contato.
        Confira as mudanças e desmarque o que não quiser gravar.
      </p>
      <div className="cnpj-lista">
        {alvos.map((p) => {
          const r = res[p.id];
          return (
            <div key={p.id} className="cnpj-item">
              <div className="cnpj-cab">
                {r?.estado === "ok" && r.mudancas.length > 0 && (
                  <input type="checkbox" checked={marcados.has(p.id)} onChange={() => alternar(p.id)} aria-label={"aplicar em " + p.nome} />
                )}
                <b>{p.nome}</b> <span className="muted">· {p.cnpj}</span>
                {r?.estado === "esperando" && <span className="muted"> · na fila</span>}
                {r?.estado === "consultando" && <span className="muted"> · consultando…</span>}
                {r?.estado === "ok" && (
                  <span className={r.dados.situacao.toUpperCase() === "ATIVA" ? "badge st-ok" : "badge st-closed"} style={{ marginLeft: 6 }}>
                    {r.dados.situacao || "situação ?"}
                  </span>
                )}
              </div>
              {r?.estado === "erro" && <div className="aviso-linha">⚠ {r.erro}</div>}
              {r?.estado === "ok" && !r.mudancas.length && <div className="muted">O cadastro já bate com a Receita.</div>}
              {r?.estado === "ok" && r.mudancas.length > 0 && (
                <table className="cnpj-mud">
                  <tbody>
                    {r.mudancas.map((m) => (
                      <tr key={m.campo}>
                        <td className="muted nowrap">{m.rotulo}</td>
                        <td>{m.antes ? <s className="muted">{mostrar(m.campo, m.antes)}</s> : <span className="muted">vazio</span>}</td>
                        <td>{mostrar(m.campo, m.depois)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
      {terminou && algumErro && (
        <p className="hint">
          Se a consulta automática falhar, dá para ver o cartão CNPJ no site da Receita
          (<a href={RECEITA} target="_blank" rel="noreferrer">comprovante de inscrição</a>) e preencher à mão no card.
        </p>
      )}
      <RodapeModal>
        <span className="sp">
          <button className="btn ghost" onClick={aoFechar}>Fechar</button>
          <button className="btn" disabled={!terminou || !marcados.size} onClick={aplicar}>
            {terminou ? `Aplicar em ${marcados.size} proponente(s)` : "consultando…"}
          </button>
        </span>
      </RodapeModal>
    </Modal>
  );
}
