/* Consulta os CNPJs na base pública da Receita e mostra, proponente por
   proponente, o que mudaria no cadastro (abertura, CNAE, sede, perfil e uma
   linha de observação com situação e razão social). Nada é gravado antes de
   "Aplicar". As consultas vão uma de cada vez, com pausa, para não esbarrar
   no limite do serviço. */
import { useEffect, useState } from "react";
import { AcoesModal, Modal, RodapeModal } from "../../../components/Modal";
import { toast } from "../../../components/Toast";
import { Badge } from "../../../components/ui/Badge";
import { Botao } from "../../../components/ui/Botao";
import { Dica } from "../../../components/ui/Dica";
import { Tabela, Td } from "../../../components/ui/Tabela";
import { ESTILO_AUXILIAR, ESTILO_LINK } from "../../../components/ui/estilos";
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
      <Dica emModal className="mb-3">
        Base pública da Receita (via BrasilAPI): só dados da empresa, sem sócios, endereço ou contato.
        Confira as mudanças e desmarque o que não quiser gravar.
      </Dica>
      <div className="flex max-h-[56vh] flex-col gap-3 overflow-auto">
        {alvos.map((p) => {
          const r = res[p.id];
          return (
            <div key={p.id} className="rounded-lg border border-line bg-white p-2.5">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-sm">
                {r?.estado === "ok" && r.mudancas.length > 0 && (
                  <input type="checkbox" className="accent-accent" checked={marcados.has(p.id)} onChange={() => alternar(p.id)} aria-label={"aplicar em " + p.nome} />
                )}
                <b>{p.nome}</b> <span className="text-muted">· {p.cnpj}</span>
                {r?.estado === "esperando" && <span className="text-muted">· na fila</span>}
                {r?.estado === "consultando" && <span className="text-muted">· consultando…</span>}
                {r?.estado === "ok" && (
                  <Badge tom={r.dados.situacao.toUpperCase() === "ATIVA" ? "st-ok" : "st-closed"}>
                    {r.dados.situacao || "situação ?"}
                  </Badge>
                )}
              </div>
              {r?.estado === "erro" && <div className="text-xs text-warn-ink">⚠ {r.erro}</div>}
              {r?.estado === "ok" && !r.mudancas.length && <div className={ESTILO_AUXILIAR}>O cadastro já bate com a Receita.</div>}
              {r?.estado === "ok" && r.mudancas.length > 0 && (
                <Tabela simples>
                  <tbody>
                    {r.mudancas.map((m) => (
                      <tr key={m.campo}>
                        <Td className="whitespace-nowrap text-muted">{m.rotulo}</Td>
                        <Td className="break-words">
                          {m.antes ? <s className="text-muted">{mostrar(m.campo, m.antes)}</s> : <span className="text-muted">vazio</span>}
                        </Td>
                        <Td className="break-words">{mostrar(m.campo, m.depois)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Tabela>
              )}
            </div>
          );
        })}
      </div>
      {terminou && algumErro && (
        <Dica emModal className="mt-3">
          Se a consulta automática falhar, dá para ver o cartão CNPJ no site da Receita
          (<a className={ESTILO_LINK} href={RECEITA} target="_blank" rel="noreferrer">comprovante de inscrição</a>) e preencher à mão no cadastro.
        </Dica>
      )}
      <RodapeModal>
        <AcoesModal>
          <Botao variante="fantasma" onClick={aoFechar}>Fechar</Botao>
          <Botao disabled={!terminou || !marcados.size} onClick={aplicar}>
            {terminou ? `Aplicar em ${marcados.size} proponente(s)` : "consultando…"}
          </Botao>
        </AcoesModal>
      </RodapeModal>
    </Modal>
  );
}
