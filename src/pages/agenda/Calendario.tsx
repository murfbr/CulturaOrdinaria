/* Calendário: grade mensal com os prazos posicionados no dia. A grade rola de
   lado no celular; cada dia é uma Celula (componente local). */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { Botao } from "../../components/ui/Botao";
import { Rotulo } from "../../components/ui/Rotulo";
import { Dica } from "../../components/ui/Dica";
import { cx } from "../../utils/classes";
import { eventosAgenda, tituloCurto } from "../../lib/agenda";
import { MESES } from "../../utils";

/** Meses que aparecem no calendário: os que têm evento + o mês atual. */
function mesesDoCalendario(eventos: { iso: string }[]): string[] {
  const conjunto = new Set(eventos.map((e) => e.iso.slice(0, 7)));
  conjunto.add(new Date().toISOString().slice(0, 7));
  return [...conjunto].sort();
}

/** Um dia da grade: número no alto e um marcador laranja por prazo. `vazia` é o espaço antes do dia 1. */
function Celula({ vazia, dia, marcadores = [] }: { vazia?: boolean; dia?: number; marcadores?: string[] }) {
  return (
    <div className={cx("min-h-20 rounded-lg border p-1.5", vazia ? "border-transparent" : "border-line bg-card")}>
      {!vazia && <div className="text-xs font-semibold text-faint">{dia}</div>}
      {marcadores.map((t, k) => (
        <div key={k} className="mt-1 rounded-md bg-accent px-1.5 py-0.5 text-3xs font-semibold leading-tight text-on-fill">{t}</div>
      ))}
    </div>
  );
}

export function Calendario() {
  const { painel } = usarCentral();
  const eventos = eventosAgenda(painel.editais, painel.projetos);
  const meses = mesesDoCalendario(eventos);
  const mesAtual = new Date().toISOString().slice(0, 7);
  const [indice, setIndice] = useState(() => Math.max(0, meses.indexOf(mesAtual)));

  const i = Math.min(indice, meses.length - 1);
  const [ano, mes] = meses[i].split("-").map(Number);
  const primeiroDia = new Date(ano, mes - 1, 1);
  const inicioSemana = (primeiroDia.getDay() + 6) % 7; // semana começa na segunda
  const diasNoMes = new Date(ano, mes, 0).getDate();

  const celulas = [];
  for (let v = 0; v < inicioSemana; v++) celulas.push(<Celula vazia key={"v" + v} />);
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const iso = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    celulas.push(
      <Celula key={dia} dia={dia} marcadores={eventos.filter((e) => e.iso === iso).map((e) => tituloCurto(e.titulo))} />,
    );
  }

  return (
    <>
      <CabecalhoSecao titulo="Calendário" sub="visão de mês — prazos posicionados no dia" />
      <CabecalhoSecao titulo={`${MESES[mes - 1]} ${ano}`}>
        <Botao variante="fantasma" tamanho="pequeno" onClick={() => setIndice(Math.max(0, i - 1))}>←</Botao>
        <Botao variante="fantasma" tamanho="pequeno" onClick={() => setIndice(Math.min(meses.length - 1, i + 1))}>→</Botao>
      </CabecalhoSecao>
      <div className="overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-7 gap-1.5">
          {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => <Rotulo key={d} className="p-0.5 text-center">{d}</Rotulo>)}
          {celulas}
        </div>
      </div>
      <Dica className="mt-2">Os marcadores vêm sozinhos dos editais cadastrados.</Dica>
    </>
  );
}
