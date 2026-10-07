/* Sub-aba Critérios da ficha do edital: como avalia (critérios, pontos e
   conceito), nota mínima, desempate, bônus e a fonte. */
import { Badge } from "../../../components/ui/Badge";
import { Chip } from "../../../components/ui/Chip";
import { Dados } from "../../../components/ui/Dados";
import { Painel } from "../../../components/ui/Painel";
import { Tabela, Td, Th } from "../../../components/ui/Tabela";
import { Vazio } from "../../../components/ui/Vazio";
import { ESTILO_APAGADO } from "../../../components/ui/estilos";
import { CONCEITOS_CRITERIO, type Edital } from "../../../types";
import { cx } from "../../../utils/classes";
import { DadoEdital, rotuloConceito } from "./FichaEditalBase";

export function FichaEditalCriterios({ e }: { e: Edital }) {
  const crit = e.criterios || [];
  return (
    <Painel titulo="Como avalia" acoes={e.criteriosTotal ? <Badge tom="tipo">total {e.criteriosTotal} pontos</Badge> : undefined}>
      {crit.length ? (
        <Tabela simples>
          <thead><tr><Th>Critério</Th><Th>Pontos</Th><Th>Conceito</Th></tr></thead>
          <tbody>
            {crit.map((c, i) => (
              <tr key={i}>
                <Td><b>{c.criterio}</b>{c.descricao && <div className={cx("mt-0.5", ESTILO_APAGADO)}>{c.descricao}</div>}</Td>
                <Td numerico><b>{c.pontos ?? "—"}</b></Td>
                <Td><Chip>{rotuloConceito(CONCEITOS_CRITERIO, c.conceito)}</Chip></Td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      ) : <Vazio emLinha>Sem critérios públicos (patrocínio por análise interna, cadastro ou norma). Veja as Notas.</Vazio>}
      <Dados className="mt-3">
        <DadoEdital rotulo="Nota mínima">{e.notaMinima}</DadoEdital>
        <DadoEdital rotulo="Desempate">{e.desempate}</DadoEdital>
        <DadoEdital rotulo="Bônus, cotas, induções">{e.bonus}</DadoEdital>
        <DadoEdital rotulo="Fonte">{e.criteriosFonte}</DadoEdital>
      </Dados>
    </Painel>
  );
}
