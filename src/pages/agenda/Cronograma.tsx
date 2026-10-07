/* Cronograma: lista de prazos por mês, derivada dos editais com data,
   mais os previstos sem data exata. Cada prazo é um Evento (componente
   local): dia grande à esquerda, título e projetos, etiquetas à direita. */
import type { ReactNode } from "react";
import { usarCentral } from "../../store/central";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { Badge } from "../../components/ui/Badge";
import { Rotulo } from "../../components/ui/Rotulo";
import { ESTILO_AUXILIAR } from "../../components/ui/estilos";
import { eventosAgenda } from "../../lib/agenda";
import { abrirDetalhe } from "../../store/navegacao";
import { CLASSE_URGENCIA, ROTULO_URGENCIA, urgenciaDe } from "../../lib/prazos";
import { STATUS_EDITAL } from "../../types";
import { MESES } from "../../utils";

/** Um prazo do cronograma: dia e mês à esquerda, título e subtítulo, etiquetas à direita. Clicável inteiro. */
function Evento({ dia, mes, titulo, sub, etiquetas, aoClicar }: {
  dia: string; mes: string; titulo: string; sub: string; etiquetas: ReactNode; aoClicar: () => void;
}) {
  return (
    <div
      className="mb-2 flex cursor-pointer items-center gap-3.5 rounded-[10px] border border-line bg-card px-3.5 py-2.5 shadow-card hover:border-accent"
      onClick={aoClicar}
    >
      <div className="w-[46px] flex-none text-center">
        <div className="text-xl font-bold leading-none">{dia}</div>
        <Rotulo>{mes}</Rotulo>
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{titulo}</div>
        <div className={ESTILO_AUXILIAR}>{sub}</div>
      </div>
      <div className="flex flex-none flex-wrap items-center justify-end gap-1.5">{etiquetas}</div>
    </div>
  );
}

export function Cronograma() {
  const { painel } = usarCentral();
  const eventos = eventosAgenda(painel.editais, painel.projetos);
  const meses = [...new Set(eventos.map((e) => e.iso.slice(0, 7)))].sort();
  const previstosSemData = painel.editais.filter((e) => !e.prazoIso && e.status === "prev");

  return (
    <>
      <CabecalhoSecao titulo="Cronograma" sub="prazos derivados dos editais e dos projetos" />
      {meses.map((chave) => {
        const [ano, mes] = chave.split("-");
        return (
          <div key={chave}>
            <Rotulo className="mb-2 mt-4">{MESES[Number(mes) - 1]} {ano}</Rotulo>
            {eventos.filter((e) => e.iso.slice(0, 7) === chave).map((e, i) => {
              const st = STATUS_EDITAL[e.status] || STATUS_EDITAL.open;
              const sub = e.projetos.length
                ? e.projetos.map((p) => p.nome).join(" · ")
                : "sem projeto ainda";
              // Urgência só para o que ainda está em jogo (não-encerrado, até 7 dias ou vencido).
              const urgencia = e.status !== "closed" ? urgenciaDe(e.iso) : "futuro";
              return (
                <Evento
                  key={i}
                  dia={e.iso.slice(8)} mes={MESES[Number(mes) - 1].slice(0, 3)}
                  titulo={e.titulo} sub={sub}
                  aoClicar={() => abrirDetalhe("edital", e.editalId)}
                  etiquetas={
                    <>
                      {urgencia !== "futuro" && <Badge tom={CLASSE_URGENCIA[urgencia]}>{ROTULO_URGENCIA[urgencia]}</Badge>}
                      <Badge tom={st.classe}>{st.rotulo}</Badge>
                    </>
                  }
                />
              );
            })}
          </div>
        );
      })}
      {previstosSemData.length > 0 && (
        <div>
          <Rotulo className="mb-2 mt-4">Sem data exata (previstos)</Rotulo>
          {previstosSemData.map((e) => (
            <Evento
              key={e.id}
              dia="—" mes={(e.prazo.match(/[a-z]{3}/i) || [""])[0]}
              titulo={e.nome} sub={e.prazo}
              aoClicar={() => abrirDetalhe("edital", e.id)}
              etiquetas={<Badge tom="st-prev">Previsto</Badge>}
            />
          ))}
        </div>
      )}
    </>
  );
}
