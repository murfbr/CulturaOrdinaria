/* Cronograma: lista de prazos por mês, derivada dos editais com data,
   mais os previstos sem data exata. Abre do mês atual para frente; os prazos
   de meses passados já encerrados ficam atrás do botão "Mostrar anteriores".
   Cada prazo é um Evento (componente local): dia grande à esquerda, título e
   projetos, etiquetas à direita. */
import { useState, type ReactNode } from "react";
import { usarCentral } from "../../store/central";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { Badge } from "../../components/ui/Badge";
import { Rotulo } from "../../components/ui/Rotulo";
import { ESTILO_AUXILIAR } from "../../components/ui/estilos";
import { eventosAgenda, type EventoAgenda } from "../../lib/agenda";
import { Dica } from "../../components/ui/Dica";
import { abrirDetalhe } from "../../store/navegacao";
import { CLASSE_URGENCIA, ROTULO_URGENCIA, hojeIso, statusEfetivo, urgenciaDe } from "../../lib/prazos";
import { Botao } from "../../components/ui/Botao";
import { STATUS_EDITAL, type Edital } from "../../types";
import { MESES } from "../../utils";

/** Um prazo do cronograma: dia e mês à esquerda, título e subtítulo, etiquetas à direita. Clicável inteiro. */
function Evento({ dia, mes, titulo, sub, etiquetas, aoClicar }: {
  dia: string; mes: string; titulo: string; sub: string; etiquetas: ReactNode; aoClicar: () => void;
}) {
  return (
    <div
      className="mb-2 flex cursor-pointer items-center gap-3.5 rounded-md border border-line bg-card px-3.5 py-2.5 hover:border-accent"
      onClick={aoClicar}
    >
      <div className="w-[46px] flex-none text-center">
        <div className="font-mono text-4xl font-medium leading-none">{dia}</div>
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

/** Prazo de mês passado cujo edital já encerrou (pela regra que deduz
    "Aberto" com prazo vencido como encerrado): fica atrás do botão. */
function anterior(e: EventoAgenda, editais: Edital[], mesAtual: string): boolean {
  if (e.iso >= mesAtual) return false;
  const edital = editais.find((x) => x.id === e.editalId);
  const st = edital ? statusEfetivo(edital) : e.status;
  return st === "closed" || st === "norma";
}

export function Cronograma() {
  const { painel } = usarCentral();
  const [mostrarAnteriores, setMostrarAnteriores] = useState(false);
  const mesAtual = hojeIso().slice(0, 7);
  const todos = eventosAgenda(painel.editais, painel.projetos);
  const anteriores = todos.filter((e) => anterior(e, painel.editais, mesAtual)).length;
  const eventos = mostrarAnteriores ? todos : todos.filter((e) => !anterior(e, painel.editais, mesAtual));
  const meses = [...new Set(eventos.map((e) => e.iso.slice(0, 7)))].sort();
  const previstosSemData = painel.editais.filter((e) => !e.prazoIso && e.status === "prev");

  return (
    <>
      <CabecalhoSecao titulo="Cronograma" sub="prazos derivados dos editais e dos projetos" />
      {anteriores > 0 && (
        <Botao variante="quieto" tamanho="pequeno" onClick={() => setMostrarAnteriores(!mostrarAnteriores)}>
          {mostrarAnteriores ? "Esconder anteriores" : `Mostrar ${anteriores} prazo${anteriores > 1 ? "s" : ""} anterior${anteriores > 1 ? "es" : ""}`}
        </Botao>
      )}
      {!eventos.length && <Dica className="mt-2">Nenhum prazo deste mês em diante.</Dica>}
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
