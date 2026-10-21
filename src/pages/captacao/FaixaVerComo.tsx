/* A faixa "Ver como" no topo das abas da Captação: todos (o coletivo) ou uma
   captadora. Simula a visão dela: o que é dela e da equipe aparece inteiro; do
   que é de outra captadora, só que a conversa existe. É um filtro do
   navegador (visao.ts), não um controle de acesso. */
import { useEffect } from "react";
import { usarCentral } from "../../store/central";
import { ESTILO_CONTROLE } from "../../components/ui/Campo";
import { Dica } from "../../components/ui/Dica";
import { comparar } from "../../utils";
import { definirComo, usarComo } from "./visao";

export function FaixaVerComo() {
  const { painel } = usarCentral();
  const como = usarComo();
  const captadoras = [...painel.captadoras].sort((a, b) => comparar(a.nome, b.nome));
  const atual = captadoras.find((c) => c.id === como);

  // Captadora apagada (ou de outro banco): volta para "todos".
  useEffect(() => { if (como && painel.captadoras.length && !atual) definirComo(""); }, [como, atual, painel.captadoras.length]);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-line bg-bg-sunk px-3 py-2">
      <label className="flex items-center gap-2 text-sm text-muted">
        Ver como
        <select className={ESTILO_CONTROLE + " py-1 text-sm"} value={como} onChange={(e) => definirComo(e.target.value)} aria-label="Ver como">
          <option value="">Todos (coletivo)</option>
          {captadoras.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </label>
      {atual && (
        <Dica emModal>
          Você está vendo a Captação como <b>{atual.nome}</b>: o que é dela e da equipe aparece inteiro; do que é de outra captadora, só que existe a conversa.
        </Dica>
      )}
    </div>
  );
}
