/* Line-up confirmado: artistas, DJs e oficineiros com status confirmado, e o
   estado da grade (shows com atração, a definir, conflitos). */
import { cadastrosDoTipo } from "../calculo";
import { analisarGrade } from "../programacao/calculoGrade";
import type { Base } from "../tipos";
import { Botao } from "../ui/Botao";
import { SECAO } from "../ui/classes";
import { Resumo } from "../ui/Resumo";
import { Tag } from "../ui/Tag";
import type { IrPara } from "../vista";

function Grupo({ titulo, base, tipo }: { titulo: string; base: Base; tipo: string }) {
  const todos = cadastrosDoTipo(base, tipo);
  const confirmados = todos.filter((d) => d.status === "confirmado");
  return (
    <div className="cdf:rounded-xl cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie cdf:p-4">
      <h3 className="cdf:m-0 cdf:mb-2 cdf:text-sm cdf:font-bold cdf:text-tinta-2">{titulo} <span className="cdf:font-normal cdf:text-fraco">{confirmados.length} de {todos.length}</span></h3>
      {confirmados.length
        ? <div>{confirmados.map((d) => <Tag key={d.id}>{d.nome}</Tag>)}</div>
        : <p className="cdf:m-0 cdf:text-sm cdf:text-fraco">Ninguém confirmado ainda.</p>}
    </div>
  );
}

export function Lineup({ base, irPara }: { base: Base; irPara: IrPara }) {
  const analise = analisarGrade(base);
  const horarios = Object.values(base.slots);
  const shows = horarios.filter((s) => s.atividade === "show");
  const comAtracao = shows.filter((s) => (s.participantes || []).length).length;
  const aDefinir = horarios.filter((s) => analise.pendencias[s.id].includes("vazio")).length;
  const conflitos = horarios.filter((s) => analise.conflitos[s.id]).length;
  return (
    <>
      <h2 className={SECAO}>Line-up confirmado<Botao mini className="cdf:ml-auto cdf:font-sans" onClick={() => irPara("cadastro")}>Cadastro geral</Botao></h2>
      <div className="cdf:mb-3.5 cdf:grid cdf:grid-cols-1 cdf:gap-3 cdf:md:grid-cols-3">
        <Grupo titulo="Artistas e bandas" base={base} tipo="artista" />
        <Grupo titulo="DJs" base={base} tipo="dj" />
        <Grupo titulo="Oficineiros" base={base} tipo="oficineiro" />
      </div>
      <Resumo
        itens={[
          { titulo: "Shows com atração", valor: comAtracao + " de " + shows.length, sub: "horários de show com alguém escalado" },
          { titulo: "A definir", valor: aDefinir, sub: "horários sem ninguém escalado" },
          { titulo: "Conflitos", valor: conflitos, sub: conflitos ? "sobreposição ou choque de agenda" : "nenhum" },
          { titulo: "Horários na grade", valor: horarios.length, sub: <button type="button" className="cdf:cursor-pointer cdf:border-0 cdf:bg-transparent cdf:p-0 cdf:font-bold cdf:text-link cdf:underline" onClick={() => irPara("programacao")}>abrir a Programação</button> },
        ]}
      />
    </>
  );
}
