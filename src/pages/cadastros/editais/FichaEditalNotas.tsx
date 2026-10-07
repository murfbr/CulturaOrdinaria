/* Sub-aba Notas e lacunas da ficha do edital: observações, o que ainda não
   se sabe (lacunas e quem resolve), as fontes lidas e a confiança. */
import { Badge } from "../../../components/ui/Badge";
import { Chip } from "../../../components/ui/Chip";
import { Linha } from "../../../components/ui/Linha";
import { Painel } from "../../../components/ui/Painel";
import { ESTILO_APAGADO, ESTILO_AUXILIAR, ESTILO_LINK } from "../../../components/ui/estilos";
import { QUEM_RESOLVE, type Edital } from "../../../types";
import { cx } from "../../../utils/classes";
import { TOM_CONFIANCA, TRACO, Texto } from "./FichaEditalBase";

export function FichaEditalNotas({ e }: { e: Edital }) {
  const lac = e.lacunas || [];
  const fontes = e.fontes || [];
  return (
    <>
      <Painel titulo="Observações"><Texto t={e.obs} /></Painel>

      <Painel titulo="O que ainda não se sabe">
        {lac.map((l, i) => (
          <Linha topo compacta key={i}>
            <div><b>{l.lacuna}</b> <Chip>{QUEM_RESOLVE[l.cat] || l.cat}</Chip> <span className="text-muted">({l.status})</span></div>
            {l.achado && <div className="mt-0.5">{l.achado}</div>}
            {l.por_que && <div className={cx("mt-0.5", ESTILO_APAGADO)}>{l.por_que}</div>}
          </Linha>
        ))}
        {e.lacunasTexto && (
          <p className={cx("m-0 whitespace-pre-wrap", ESTILO_AUXILIAR, lac.length > 0 && "mt-2.5")}>{e.lacunasTexto}</p>
        )}
        {!lac.length && !e.lacunasTexto && TRACO}
      </Painel>

      <Painel titulo="Fontes lidas"
        acoes={e.confianca ? <Badge tom={TOM_CONFIANCA[e.confianca]} mini caixaAlta>confiança {e.confianca}</Badge> : undefined}>
        {fontes.length ? (
          <ul className={cx("m-0 list-disc pl-5", ESTILO_AUXILIAR)}>
            {fontes.map((f, i) => (
              <li key={i} className="my-0.5 break-all">
                {/^https?:/.test(f) ? <a className={ESTILO_LINK} href={f} target="_blank" rel="noopener noreferrer">{f}</a> : f}
              </li>
            ))}
          </ul>
        ) : TRACO}
      </Painel>
    </>
  );
}
