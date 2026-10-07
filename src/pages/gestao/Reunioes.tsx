/* Reuniões: destaque da próxima, tabela de todas (com busca, filtro de status
   e ordenação; a linha abre a ficha), e o link de convite do Google Agenda. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { abrirDetalhe } from "../../store/navegacao";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../components/Filtros";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { Chip } from "../../components/ui/Chip";
import { Painel } from "../../components/ui/Painel";
import { Tabela, Td, Th, Tr } from "../../components/ui/Tabela";
import { Vazio } from "../../components/ui/Vazio";
import { emailsConvite, linkGoogleAgenda, nomesParticipantes } from "../../lib/agenda";
import { comparar, formatarData } from "../../utils";

export function Reunioes() {
  const { painel } = usarCentral();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [ordem, setOrdem] = useState("data");

  const reunioes = painel.reunioes.filter((r) =>
    (!filtroStatus || r.status === filtroStatus) &&
    (!busca || (r.titulo + " " + r.local + " " + (r.pauta || []).join(" ")).toLowerCase().includes(busca.toLowerCase())));
  if (ordem === "data") reunioes.sort((a, b) => ((a.data || "9999") < (b.data || "9999") ? -1 : 1));
  if (ordem === "dataDesc") reunioes.sort((a, b) => ((a.data || "") > (b.data || "") ? -1 : 1));
  if (ordem === "titulo") reunioes.sort((a, b) => comparar(a.titulo, b.titulo));

  const hoje = new Date().toISOString().slice(0, 10);
  const proxima = painel.reunioes
    .filter((r) => r.status !== "realizada" && (r.proxima || r.data || "") >= hoje)
    .sort((a, b) => ((a.proxima || a.data) < (b.proxima || b.data) ? -1 : 1))[0];

  return (
    <>
      <CabecalhoSecao titulo="Reuniões" sub="monte a pauta antes, preencha a ata depois; encaminhamentos viram tarefas">
        <Botao onClick={() => abrirNovo("reuniao")}>+ Nova reunião</Botao>
      </CabecalhoSecao>

      <BarraFiltros mostrando={reunioes.length} total={painel.reunioes.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar título, local ou pauta…" />
        <SeletorFiltro valor={filtroStatus} aoMudar={setFiltroStatus} rotuloTodos="todas"
          opcoes={[{ valor: "agendada", rotulo: "agendadas" }, { valor: "realizada", rotulo: "realizadas" }]} />
        <SeletorFiltro valor={ordem} aoMudar={setOrdem}
          opcoes={[
            { valor: "data", rotulo: "data ↑ (antigas primeiro)" },
            { valor: "dataDesc", rotulo: "data ↓ (recentes primeiro)" },
            { valor: "titulo", rotulo: "título A→Z" },
          ]} />
      </BarraFiltros>

      {proxima && (
        <Painel titulo="Próxima reunião" className="border-l-4 border-l-accent">
          <div className="flex flex-wrap items-center gap-2.5">
            <b className="text-base">{proxima.titulo}</b>
            <Badge tom="tipo">
              {formatarData(proxima.proxima || proxima.data)}{proxima.hora ? " · " + proxima.hora : ""}
            </Badge>
            {proxima.recorrencia && proxima.recorrencia !== "Avulsa" && <Badge tom="st-prev">{proxima.recorrencia}</Badge>}
            <Botao variante="fantasma" tamanho="pequeno" className="ml-auto"
              href={linkGoogleAgenda({ ...proxima, data: proxima.proxima || proxima.data }, emailsConvite(proxima))}>
              📅 Adicionar ao Google Agenda
            </Botao>
          </div>
        </Painel>
      )}

      {reunioes.length > 0 ? (
        <Tabela>
          <thead>
            <tr>
              <Th>Reunião</Th><Th>Quando</Th><Th>Local</Th><Th>Participantes</Th><Th>Pauta</Th><Th>Status</Th><Th />
            </tr>
          </thead>
          <tbody>
            {reunioes.map((r) => {
              const encaminhamentos = painel.tarefas.filter((t) => t.origem === "reuniao:" + r.id).length;
              const participantes = nomesParticipantes(r);
              return (
                <Tr key={r.id} aoClicar={() => abrirDetalhe("reuniao", r.id)}>
                  <Td>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <b>{r.titulo}</b>
                      {r.recorrencia && r.recorrencia !== "Avulsa" && <Badge mini tom="st-prev">{r.recorrencia}</Badge>}
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap">{formatarData(r.data)}{r.hora ? " · " + r.hora : ""}</Td>
                  <Td>{r.local}</Td>
                  <Td>{participantes.map((n) => <Chip key={n}>{n}</Chip>)}</Td>
                  <Td className="whitespace-nowrap text-muted">
                    {(r.pauta || []).length} de pauta · {encaminhamentos} encaminhamento(s)
                  </Td>
                  <Td>
                    <Badge tom={r.status === "realizada" ? "st-closed" : "st-open"}>
                      {r.status === "realizada" ? "Realizada" : "Agendada"}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <Botao variante="quieto" tamanho="mini" onClick={(e) => { e.stopPropagation(); abrirEdicao("reuniao", r.id); }}>
                      editar
                    </Botao>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Tabela>
      ) : (
        <Vazio>
          {painel.reunioes.length ? "Nenhuma reunião com esses filtros." : 'Nenhuma reunião ainda. Crie a primeira em "+ Nova reunião".'}
        </Vazio>
      )}
    </>
  );
}
