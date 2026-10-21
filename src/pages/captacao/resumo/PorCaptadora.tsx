/* Tabela por quem capta: a equipe do coletivo e cada captadora, com abertas,
   em negociação, confirmado e comissão a pagar (só na visão "todos"). */
import { Painel } from "../../../components/ui/Painel";
import { Tabela, Th, Td } from "../../../components/ui/Tabela";
import type { Captadora, Negociacao, ProjetoCaptacao } from "../../../types";
import { comparar } from "../../../utils";
import { EQUIPE } from "../apoio";
import { brl, totais } from "../calculo";

export function PorCaptadora({ captadoras, negociacoes, projetos }: { captadoras: Captadora[]; negociacoes: Negociacao[]; projetos: ProjetoCaptacao[] }) {
  const linhas: [string, string][] = [["", EQUIPE], ...[...captadoras].sort((a, b) => comparar(a.nome, b.nome)).map((c) => [c.id, c.nome] as [string, string])];
  let estimada = false;
  return (
    <Painel titulo="Por captadora" sub="a carteira de cada uma">
      <Tabela simples>
        <thead><tr><Th>Quem capta</Th><Th numerico>Abertas</Th><Th numerico>Em negociação</Th><Th numerico>Confirmado</Th><Th numerico>Comissão a pagar</Th></tr></thead>
        <tbody>
          {linhas.map(([id, nome]) => {
            const t = totais(negociacoes.filter((n) => n.captadoraId === id), projetos);
            if (t.estimada) estimada = true;
            return (
              <tr key={id || "equipe"}>
                <Td>{nome}</Td>
                <Td numerico>{t.abertas}</Td>
                <Td numerico>{brl(t.negociando)}</Td>
                <Td numerico>{brl(t.confirmado)}</Td>
                <Td numerico>{id ? brl(t.aPagar) + (t.estimada ? "*" : "") : "—"}</Td>
              </tr>
            );
          })}
        </tbody>
      </Tabela>
      {estimada && <div className="mt-2 text-xs text-faint">* estimativa sobre o valor fechado, enquanto a regra da comissão está a definir.</div>}
    </Painel>
  );
}
