/* Todos os posts da rodada (ou de uma referência), com filtro por perfil,
   formato, editoria e texto, e ordem por qualquer coluna. Desempenho é a conta
   da Biblioteca (curtidas ÷ o típico do formato no perfil). */
import { useMemo, useState } from "react";
import { BarraFiltros, CampoBusca, SeletorFiltro, ThOrdenavel, type OrdemTabela } from "../../../components/Filtros";
import { Tabela, Td, Th } from "../../../components/ui/Tabela";
import { Vazio } from "../../../components/ui/Vazio";
import { FORMATOS_POST, type LeituraReferencia, type PostReferencia } from "../../../types";
import { comparar } from "../../../utils";
import { diaMes, formatar, rotuloDia } from "./calculo";
import { Bolinha } from "./Texto";

interface Linha extends PostReferencia { perfil: string; refId: string; desempenho: number | null }

const NUMERICOS = new Set(["dia", "curtidas", "comentarios", "views", "desempenho"]);

function ordenar(linhas: Linha[], ordem: OrdemTabela): Linha[] {
  if (!ordem.campo) return linhas;
  const k = ordem.campo as keyof Linha;
  const sinal = ordem.desc ? -1 : 1;
  return [...linhas].sort((a, b) => {
    if (NUMERICOS.has(ordem.campo)) {
      const va = a[k] as number | null, vb = b[k] as number | null;
      if (va == null && vb == null) return 0;
      if (va == null) return 1; // vazio sempre no fim
      if (vb == null) return -1;
      return (va - vb) * sinal;
    }
    return comparar(String(a[k] ?? ""), String(b[k] ?? "")) * sinal;
  });
}

export function TabelaPosts({ leituras, cor, desempenho, soUma }: {
  leituras: LeituraReferencia[];
  cor: (refId: string) => string;
  desempenho: Record<string, number | null>;
  /** Tabela dentro da ficha de uma referência: sem filtro e coluna de perfil. */
  soUma?: boolean;
}) {
  const [perfil, setPerfil] = useState("");
  const [formato, setFormato] = useState("");
  const [editoria, setEditoria] = useState("");
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<OrdemTabela>({ campo: "", desc: false });

  const todas = useMemo<Linha[]>(() => leituras.flatMap((l) => l.posts.map((p) => ({
    ...p, perfil: l.nome, refId: l.refId, desempenho: desempenho[p.n] ?? null,
  }))), [leituras, desempenho]);
  const editorias = [...new Set(todas.map((p) => p.editoria))].sort(comparar);
  const termo = busca.trim().toLowerCase();
  const filtradas = ordenar(todas.filter((p) =>
    (!perfil || p.refId === perfil) && (!formato || p.formato === formato) && (!editoria || p.editoria === editoria)
    && (!termo || [p.n, p.resumo, p.evento, p.serie, p.editoria, p.autor].join(" ").toLowerCase().includes(termo))), ordem);

  const th = (campo: string, rotulo: string) => <ThOrdenavel campo={campo} ordem={ordem} aoOrdenar={setOrdem}>{rotulo}</ThOrdenavel>;

  return (
    <>
      <BarraFiltros mostrando={filtradas.length} total={todas.length}>
        {!soUma && <SeletorFiltro valor={perfil} aoMudar={setPerfil} rotuloTodos="todas as referências" opcoes={leituras.map((l) => ({ valor: l.refId, rotulo: l.nome }))} />}
        <SeletorFiltro valor={formato} aoMudar={setFormato} rotuloTodos="todo formato" opcoes={FORMATOS_POST} />
        <SeletorFiltro valor={editoria} aoMudar={setEditoria} rotuloTodos="toda editoria" opcoes={editorias} />
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="evento, série, resumo…" />
      </BarraFiltros>
      {filtradas.length === 0 ? <Vazio>Nenhum post com esses filtros.</Vazio> : (
        <Tabela minima="min-w-[1080px]">
          <thead>
            <tr>
              {th("n", "#")}{th("data", "Data")}{th("formato", "Formato")}{th("editoria", "Editoria")}{th("serie", "Série")}
              {th("evento", "Evento")}{th("dia", "D")}{th("chamada", "Chamada")}{th("curtidas", "Curtidas")}{th("comentarios", "Coment.")}
              {th("views", "Views")}{th("desempenho", "Desemp.")}<Th>Resumo</Th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((p) => (
              <tr key={p.n}>
                <Td className="whitespace-nowrap font-mono text-xs">
                  {!soUma && <Bolinha cor={cor(p.refId)} className="mr-1.5" />}{p.n}
                </Td>
                <Td className="whitespace-nowrap tabular-nums">{diaMes(p.data)}</Td>
                <Td className="whitespace-nowrap">{p.formato}{p.fixado ? " · fixado" : ""}{!p.naGrade ? " · fora da grade" : ""}</Td>
                <Td className="whitespace-nowrap">{p.editoria}</Td>
                <Td>{p.serie}</Td>
                <Td className="min-w-[150px]">{p.evento}{p.collab && <span className="block text-xs text-faint">collab · {p.autor}</span>}</Td>
                <Td numerico>{rotuloDia(p.dia)}</Td>
                <Td>{p.chamada ? "sim" : "não"}</Td>
                <Td numerico>{formatar(p.curtidas, "int")}</Td>
                <Td numerico>{formatar(p.comentarios, "int")}</Td>
                <Td numerico>{p.views != null ? formatar(p.views, "compact") : ""}</Td>
                <Td numerico className={p.desempenho != null && p.desempenho >= 2 ? "font-semibold text-ink" : ""}>
                  {p.desempenho != null ? formatar(p.desempenho, "x") : ""}
                </Td>
                <Td className="min-w-[280px] text-muted">
                  {p.resumo}{" "}
                  {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="whitespace-nowrap font-semibold text-accent hover:underline">abrir ↗</a>}
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
    </>
  );
}
