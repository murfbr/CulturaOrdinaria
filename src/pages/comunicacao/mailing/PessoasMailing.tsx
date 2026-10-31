/* Mailing › Pessoas: uma linha por e-mail, com os eventos em que esteve.
   Os filtros montam a lista de um envio (quem esteve no evento X e não no Y,
   quem veio 2 vezes ou mais, quem é do plano Z); exportar ou copiar deixa
   linha no registro e nunca leva quem pediu descadastro. */
import { useMemo, useState } from "react";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../../components/Filtros";
import { Badge } from "../../../components/ui/Badge";
import { Botao } from "../../../components/ui/Botao";
import { Tabela, Td, Th } from "../../../components/ui/Tabela";
import { Vazio } from "../../../components/ui/Vazio";
import { diaMes, formatar } from "../biblioteca/calculo";
import { linhasCsvPessoas, type Pessoa } from "./calculoMailing";
import { copiarEmails, exportarCsv } from "./exportar";
import { usarDadosMailing } from "./usarMailing";

const POR_PAGINA = 200;
const dataCurta = (d: string) => (d ? diaMes(d) + "/" + d.slice(2, 4) : "");

export function PessoasMailing() {
  const { eventos, pessoas } = usarDadosMailing();
  const [busca, setBusca] = useState("");
  const [esteve, setEsteve] = useState("");
  const [naoEsteve, setNaoEsteve] = useState("");
  const [plano, setPlano] = useState("");
  const [minimo, setMinimo] = useState("");
  const [checkin, setCheckin] = useState("");
  const [limite, setLimite] = useState(POR_PAGINA);

  const opcoesEvento = eventos.map((e) => ({ valor: e.symplaId, rotulo: dataCurta(e.data) + " · " + e.titulo }));
  const planos = [...new Set(eventos.map((e) => e.plano).filter(Boolean))].sort();

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const min = Number(minimo) || 0;
    return pessoas
      .filter((p) => !termo || p.email.includes(termo) || p.nome.toLowerCase().includes(termo))
      .filter((p) => !esteve || p.eventos.some((e) => e.symplaId === esteve))
      .filter((p) => !naoEsteve || !p.eventos.some((e) => e.symplaId === naoEsteve))
      .filter((p) => !plano || p.eventos.some((e) => e.plano === plano))
      .filter((p) => p.eventos.length >= min)
      .filter((p) => !checkin || (checkin === "sim" ? p.checkins > 0 : p.checkins === 0))
      .sort((a, b) => b.eventos.length - a.eventos.length || b.ultimo.localeCompare(a.ultimo) || a.email.localeCompare(b.email));
  }, [pessoas, busca, esteve, naoEsteve, plano, minimo, checkin]);

  const descricao = () => {
    const nomeEv = (id: string) => opcoesEvento.find((o) => o.valor === id)?.rotulo || id;
    return [
      busca && "busca \"" + busca + "\"", esteve && "esteve em " + nomeEv(esteve), naoEsteve && "não esteve em " + nomeEv(naoEsteve),
      plano && "plano " + plano, minimo && minimo + "+ eventos", checkin && (checkin === "sim" ? "com check-in" : "sem check-in"),
    ].filter(Boolean).join(", ") || "todas as pessoas";
  };
  const validos = lista.filter((p) => !p.descadastrado);
  const fora = lista.length - validos.length;

  if (!pessoas.length) return <Vazio>Nenhuma lista importada ainda (vista Importar).</Vazio>;

  return (
    <>
      <BarraFiltros mostrando={lista.length} total={pessoas.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="e-mail ou nome…" />
        <SeletorFiltro valor={esteve} aoMudar={setEsteve} rotuloTodos="esteve em: qualquer" opcoes={opcoesEvento} />
        <SeletorFiltro valor={naoEsteve} aoMudar={setNaoEsteve} rotuloTodos="não esteve em: —" opcoes={opcoesEvento} />
        {planos.length > 1 && <SeletorFiltro valor={plano} aoMudar={setPlano} rotuloTodos="todos os planos" opcoes={planos} />}
        <SeletorFiltro valor={minimo} aoMudar={setMinimo} rotuloTodos="1 evento ou mais"
          opcoes={[{ valor: "2", rotulo: "2 eventos ou mais" }, { valor: "3", rotulo: "3 ou mais" }, { valor: "4", rotulo: "4 ou mais" }]} />
        <SeletorFiltro valor={checkin} aoMudar={setCheckin} rotuloTodos="check-in: tanto faz"
          opcoes={[{ valor: "sim", rotulo: "fez check-in alguma vez" }, { valor: "nao", rotulo: "nunca fez check-in" }]} />
      </BarraFiltros>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Botao tamanho="pequeno" variante="fantasma" disabled={!validos.length}
          onClick={() => exportarCsv("mailing-pessoas.csv", linhasCsvPessoas(lista), "Pessoas (" + descricao() + ")")}>
          Exportar CSV ({formatar(validos.length, "int")})
        </Botao>
        <Botao tamanho="pequeno" variante="fantasma" disabled={!validos.length}
          onClick={() => copiarEmails(validos.map((p) => p.email), "Pessoas (" + descricao() + ")")}>
          Copiar e-mails
        </Botao>
        <span className="text-sm text-muted">
          {fora ? fora + " descadastrado(s) ficam de fora. " : ""}Exportar e copiar ficam no registro.
        </span>
      </div>

      <Tabela minima="min-w-[860px]">
        <thead>
          <tr>
            <Th>E-mail</Th>
            <Th>Nome</Th>
            <Th numerico>Eventos</Th>
            <Th>Em quais</Th>
            <Th numerico>Check-ins</Th>
            <Th>Último</Th>
          </tr>
        </thead>
        <tbody>
          {lista.slice(0, limite).map((p: Pessoa) => (
            <tr key={p.email} className={p.descadastrado ? "opacity-50" : ""}>
              <Td className="break-all">{p.email}{p.descadastrado && <Badge mini tom="aviso" className="ml-1.5">descadastro</Badge>}</Td>
              <Td>{p.nome}</Td>
              <Td numerico>{p.eventos.length}</Td>
              <Td className="text-sm text-muted">
                {p.eventos.map((e) => dataCurta(e.data) + (e.checkin ? "✓" : "")).join(" · ")}
              </Td>
              <Td numerico>{p.checkins}</Td>
              <Td className="whitespace-nowrap">{dataCurta(p.ultimo)}</Td>
            </tr>
          ))}
        </tbody>
      </Tabela>
      {lista.length > limite && (
        <div className="mt-3 text-center">
          <Botao variante="quieto" onClick={() => setLimite(limite + POR_PAGINA)}>mostrar mais {Math.min(POR_PAGINA, lista.length - limite)}</Botao>
        </div>
      )}
      <p className="m-0 mt-2 max-w-texto text-sm text-muted">✓ = fez check-in naquele evento. O nome é o do evento mais recente.</p>
    </>
  );
}
