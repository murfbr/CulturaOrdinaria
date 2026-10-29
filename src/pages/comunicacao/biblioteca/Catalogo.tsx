/* O catálogo: todas as referências da Biblioteca, em qualquer rodada, com
   filtro por plano, grupo e nível de leitura, busca e ordem por coluna. Os
   números são os da última leitura de cada uma. Clicar abre a ficha. */
import { useMemo, useState } from "react";
import { BarraFiltros, CampoBusca, SeletorFiltro, ThOrdenavel, type OrdemTabela } from "../../../components/Filtros";
import { Badge } from "../../../components/ui/Badge";
import { GradeKpis, Kpi } from "../../../components/ui/Kpi";
import { Tabela, Td, Th, Tr } from "../../../components/ui/Tabela";
import { Vazio } from "../../../components/ui/Vazio";
import { definirBibliotecaAberta } from "../../../store/navegacao";
import type { Referencia } from "../../../types";
import { comparar } from "../../../utils";
import { diaMes, formatar } from "./calculo";
import { corDa } from "./cores";
import { grupoDa, planosDa, referenciasEmOrdem } from "./dados";
import { Bolinha } from "./Texto";

interface Linha {
  ref: Referencia;
  nome: string;
  grupo: string;
  planos: string;
  nivel: string;
  papel: string;
  data: string;
  seguidores: number | null;
  postsSemana: number | null;
  pctReels: number | null;
  pctCollab: number | null;
  viewsReel: number | null;
  curtidasPorView: number | null;
}

const NUMERICOS = new Set(["seguidores", "postsSemana", "pctReels", "pctCollab", "viewsReel", "curtidasPorView"]);
const ROTULO_GRUPO: Record<string, string> = { festivais: "Festivais", bandas: "Bandas", eventos: "Eventos" };

function ordenar(linhas: Linha[], ordem: OrdemTabela): Linha[] {
  if (!ordem.campo) return linhas;
  const k = ordem.campo as keyof Linha;
  const sinal = ordem.desc ? -1 : 1;
  return [...linhas].sort((a, b) => {
    if (NUMERICOS.has(ordem.campo)) {
      const va = a[k] as number | null, vb = b[k] as number | null;
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return (va - vb) * sinal;
    }
    return comparar(String(a[k] ?? ""), String(b[k] ?? "")) * sinal;
  });
}

export function Catalogo({ referencias }: { referencias: Record<string, Referencia> }) {
  const [plano, setPlano] = useState("");
  const [grupo, setGrupo] = useState("");
  const [nivel, setNivel] = useState("");
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<OrdemTabela>({ campo: "", desc: false });

  const ordenadas = useMemo(() => referenciasEmOrdem(referencias), [referencias]);
  const linhas = useMemo<Linha[]>(() => ordenadas.map((ref) => {
    const u = ref.ultimaLeitura;
    return {
      ref, nome: ref.nome, grupo: grupoDa(ref), planos: planosDa(ref).join(", "), nivel: ref.nivelLeitura || "", papel: ref.papel || "",
      data: u?.data || "", seguidores: u?.seguidores ?? null, postsSemana: u?.postsSemana ?? null, pctReels: u?.pctReels ?? null,
      pctCollab: u?.pctCollab ?? null, viewsReel: u?.viewsReel ?? null, curtidasPorView: u?.curtidasPorView ?? null,
    };
  }), [ordenadas]);

  const planos = [...new Set(linhas.flatMap((l) => planosDa(l.ref)))].sort(comparar);
  const grupos = [...new Set(linhas.map((l) => l.grupo).filter(Boolean))];
  const niveis = [...new Set(linhas.map((l) => l.nivel).filter(Boolean))];
  const termo = busca.trim().toLowerCase();
  const filtradas = ordenar(linhas.filter((l) =>
    (!plano || planosDa(l.ref).includes(plano)) && (!grupo || l.grupo === grupo) && (!nivel || l.nivel === nivel)
    && (!termo || [l.nome, l.ref.instagram, l.ref.logica, l.papel, ...(l.ref.marcacoes || [])].join(" ").toLowerCase().includes(termo))), ordem);

  const th = (campo: string, rotulo: string) => <ThOrdenavel campo={campo} ordem={ordem} aoOrdenar={setOrdem}>{rotulo}</ThOrdenavel>;
  const v5 = linhas.filter((l) => l.nivel === "grade v5").length;

  return (
    <>
      <GradeKpis>
        <Kpi n={linhas.length} rotulo="referências" />
        <Kpi n={v5} rotulo="com leitura completa (grade v5)" />
        <Kpi n={linhas.length - v5} rotulo="só leitura rápida" />
        <Kpi n={planos.length} rotulo={planos.length === 1 ? "plano" : "planos"} />
      </GradeKpis>
      <BarraFiltros mostrando={filtradas.length} total={linhas.length}>
        <SeletorFiltro valor={plano} aoMudar={setPlano} rotuloTodos="todos os planos" opcoes={planos} />
        {grupos.length > 1 && <SeletorFiltro valor={grupo} aoMudar={setGrupo} rotuloTodos="todo grupo" opcoes={grupos.map((g) => ({ valor: g, rotulo: ROTULO_GRUPO[g] || g }))} />}
        <SeletorFiltro valor={nivel} aoMudar={setNivel} rotuloTodos="todo nível de leitura" opcoes={niveis} />
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="nome, @, lógica, marcação…" />
      </BarraFiltros>
      {filtradas.length === 0 ? <Vazio>Nenhuma referência com esses filtros.</Vazio> : (
        <Tabela minima="min-w-[1040px]">
          <thead>
            <tr>
              {th("nome", "Referência")}{th("planos", "Plano")}{th("grupo", "Grupo")}{th("nivel", "Leitura")}{th("data", "Última")}
              {th("seguidores", "Seguidores")}{th("postsSemana", "Posts/sem")}{th("pctReels", "Reels")}{th("pctCollab", "Collab")}
              {th("viewsReel", "Views/Reel")}{th("curtidasPorView", "Curt./view")}<Th>Lógica</Th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((l) => (
              <Tr key={l.ref.id} aoClicar={() => definirBibliotecaAberta(l.ref.id)}>
                <Td className="whitespace-nowrap">
                  <Bolinha cor={corDa(ordenadas.indexOf(l.ref) % 8)} className="mr-1.5" />
                  <span className="font-semibold text-ink">{l.nome}</span>
                  <span className="block pl-4 text-xs text-faint">@{l.ref.instagram}{l.papel ? " · " + l.papel : ""}</span>
                </Td>
                <Td className="whitespace-nowrap text-muted">{planosDa(l.ref).map((p) => <span key={p} className="block">{p}</span>)}</Td>
                <Td className="whitespace-nowrap text-muted">{ROTULO_GRUPO[l.grupo] || l.grupo}</Td>
                <Td><Badge mini tom={l.nivel === "grade v5" ? "ok" : "neutro"}>{l.nivel || "sem leitura"}</Badge></Td>
                <Td className="whitespace-nowrap tabular-nums">{l.data ? diaMes(l.data) + "/" + l.data.slice(2, 4) : ""}</Td>
                <Td numerico>{formatar(l.seguidores, "compact")}</Td>
                <Td numerico>{formatar(l.postsSemana, "dec1")}</Td>
                <Td numerico>{formatar(l.pctReels, "pct")}</Td>
                <Td numerico>{formatar(l.pctCollab, "pct")}</Td>
                <Td numerico>{l.viewsReel != null ? formatar(l.viewsReel, "compact") : ""}</Td>
                <Td numerico>{l.curtidasPorView != null ? formatar(l.curtidasPorView, "pct2") : ""}</Td>
                <Td className="min-w-[200px] text-muted">{l.ref.logica}</Td>
              </Tr>
            ))}
          </tbody>
        </Tabela>
      )}
      <p className="m-0 mt-2 max-w-texto text-sm text-muted">
        Views por Reel e curtidas por view só existem na leitura completa (grade v5); a rápida lê a página sem a aba Reels.
        Os números são da última leitura de cada referência, de qualquer rodada.
      </p>
    </>
  );
}
