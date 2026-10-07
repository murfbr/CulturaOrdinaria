/* Regras: a tabela filtrável (escopo, tipo, busca). Sem fonte, a regra vira lenda. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { entidades, textoFonte } from "../../lib/contexto/consultas";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../components/Filtros";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { Chip } from "../../components/ui/Chip";
import { Tabela, Td, Th, Tr } from "../../components/ui/Tabela";
import { Vazio } from "../../components/ui/Vazio";
import { ESTILO_AUXILIAR } from "../../components/ui/estilos";
import { clonar } from "../../utils";
import { ROTULO_TIPO_REGRA, type Regra, type TipoFicha } from "../../types";
import type { PedidoModalRegra } from "./ModalRegra";

const ESCOPOS = [
  { valor: "geral", rotulo: "geral" },
  { valor: "artista", rotulo: "por artista" },
  { valor: "projeto", rotulo: "por projeto" },
  { valor: "edital", rotulo: "por edital" },
  { valor: "mecanismo", rotulo: "por mecanismo" },
];

export function TelaRegras({ aoAbrirRegra }: { aoAbrirRegra: (p: PedidoModalRegra) => void }) {
  const { regras } = usarCentral();
  const [filtroEscopo, setFiltroEscopo] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [busca, setBusca] = useState("");

  const todas = Object.values(regras);
  const filtradas = todas.filter((r) =>
    (!filtroEscopo || r.escopo.tipo === filtroEscopo) &&
    (!filtroTipo || r.tipoRegra === filtroTipo) &&
    (!busca || (r.texto + " " + (r.fonte?.ref || "")).toLowerCase().includes(busca.toLowerCase())));

  const nomeEscopo = (r: Regra) => {
    if (r.escopo.tipo === "geral") return <Chip><b className="text-ink">Geral</b></Chip>;
    if (r.escopo.tipo === "mecanismo") return <Chip>mecanismo <b className="text-ink">{r.escopo.id}</b></Chip>;
    const entidade = entidades(r.escopo.tipo as TipoFicha).find((x) => x.id === r.escopo.id);
    return <Chip>{r.escopo.tipo} <b className="text-ink">{entidade?.nome || r.escopo.id}</b></Chip>;
  };

  return (
    <>
      <CabecalhoSecao
        grande
        titulo="Regras"
        sub="Uma linha por regra: o que fazer ou evitar, em que escopo, de que tipo, e de onde veio. Sem fonte, a regra vira lenda."
      >
        <Botao onClick={() => aoAbrirRegra({ contexto: { tipo: "geral" } })}>+ nova regra</Botao>
      </CabecalhoSecao>

      <BarraFiltros mostrando={filtradas.length} total={todas.length}>
        <SeletorFiltro valor={filtroEscopo} aoMudar={setFiltroEscopo} rotuloTodos="todos os escopos" opcoes={ESCOPOS} />
        <SeletorFiltro valor={filtroTipo} aoMudar={setFiltroTipo} rotuloTodos="todos os tipos"
          opcoes={Object.entries(ROTULO_TIPO_REGRA).map(([valor, rotulo]) => ({ valor, rotulo }))} />
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar no texto ou na fonte" />
      </BarraFiltros>

      <Tabela minima="min-w-[760px]">
        <thead>
          <tr><Th>Tipo</Th><Th>Regra</Th><Th>Escopo</Th><Th>Fonte</Th><Th>Status</Th><Th /></tr>
        </thead>
        <tbody>
          {filtradas.map((r) => (
            <Tr key={r.id}>
              <Td><Badge caixaAlta tom={r.tipoRegra}>{ROTULO_TIPO_REGRA[r.tipoRegra]}</Badge></Td>
              <Td className="max-w-[52ch]">{r.texto}</Td>
              <Td>{nomeEscopo(r)}</Td>
              <Td className={ESTILO_AUXILIAR}>{textoFonte(r.fonte)}</Td>
              <Td>
                {r.status === "duvida"
                  ? <Badge tom="aviso" mini>a confirmar</Badge>
                  : <span className={ESTILO_AUXILIAR}>vigente</span>}
              </Td>
              <Td className="text-right">
                <Botao variante="quieto" tamanho="mini" onClick={() => aoAbrirRegra({ regra: clonar(r) })}>editar</Botao>
              </Td>
            </Tr>
          ))}
          {!filtradas.length && <tr><Td colSpan={6}><Vazio emLinha>nenhuma regra com esse filtro</Vazio></Td></tr>}
        </tbody>
      </Tabela>
    </>
  );
}
