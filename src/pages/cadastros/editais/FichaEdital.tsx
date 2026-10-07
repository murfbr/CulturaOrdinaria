/* Ficha do edital (Cadastros), no formato do Mapa dos Editais: Geral (o que
   quer, valores, linhas, quem pode, exigências, links e alertas), Critérios,
   Formulário (os mapeados e os campos lidos), Documentos, Contexto (a ficha de
   escrita), Projetos, Notas (lacunas, fontes, confiança) e Histórico. Este
   arquivo é a casca: o cabeçalho com as etiquetas e as sub-abas, e os modais;
   o corpo de cada sub-aba está no arquivo irmão FichaEdital<Aba>.tsx. */
import { useState } from "react";
import { usarCentral } from "../../../store/central";
import { porId } from "../../../store/mutacoes";
import { fecharDetalhe, mudarSubAba } from "../../../store/navegacao";
import { abrirEdicao } from "../../../store/edicao";
import { nomeCurto, prazoCurto } from "../../../lib/nomes";
import { prazoEncerrado } from "../../../lib/prazos";
import { Historico } from "../../../components/Historico";
import { Badge } from "../../../components/ui/Badge";
import { Botao } from "../../../components/ui/Botao";
import { CabecalhoFicha } from "../../../components/ui/CabecalhoFicha";
import { PainelFicha } from "../../contexto/Fichas";
import { ModalRegra, type PedidoModalRegra } from "../../contexto/ModalRegra";
import { ModalNovoProjeto } from "../../projetos/ModalNovoProjeto";
import { CATEGORIAS_EDITAL, ESFERAS, STATUS_EDITAL, type CategoriaEdital } from "../../../types";
import { FichaEditalCriterios } from "./FichaEditalCriterios";
import { FichaEditalDocumentos } from "./FichaEditalDocumentos";
import { FichaEditalFormulario } from "./FichaEditalFormulario";
import { FichaEditalGeral } from "./FichaEditalGeral";
import { FichaEditalNotas } from "./FichaEditalNotas";
import { FichaEditalProjetos } from "./FichaEditalProjetos";

const SUB_ABAS: [string, string][] = [
  ["geral", "Geral"], ["criterios", "Critérios"], ["formulario", "Formulário"], ["docs", "Documentos"],
  ["contexto", "Contexto"], ["projetos", "Projetos"], ["notas", "Notas e lacunas"], ["historico", "Histórico"],
];

export function FichaEdital({ id, sub }: { id: string; sub: string }) {
  const { painel } = usarCentral();
  const e = porId("editais", id)!;
  const [modalRegra, setModalRegra] = useState<PedidoModalRegra | null>(null);
  const [novoProjeto, setNovoProjeto] = useState(false);
  const esf = ESFERAS[e.esfera] || { rotulo: "—", classe: "" };
  const st = STATUS_EDITAL[e.status] || STATUS_EDITAL.open;
  const cat = CATEGORIAS_EDITAL[(e.categoria || "edital") as CategoriaEdital];
  const projetos = painel.projetos.filter((p) => p.editalId === e.id);
  const nAlertas = (e.alertas || []).length;
  const aba = SUB_ABAS.some(([k]) => k === sub) ? sub : sub === "financia" ? "geral" : sub === "cands" ? "projetos" : sub === "obs" ? "notas" : "geral";

  let corpo;
  if (aba === "geral") {
    corpo = <FichaEditalGeral e={e} />;
  } else if (aba === "criterios") {
    corpo = <FichaEditalCriterios e={e} />;
  } else if (aba === "formulario") {
    corpo = <FichaEditalFormulario e={e} aoNovoProjeto={() => setNovoProjeto(true)} />;
  } else if (aba === "docs") {
    corpo = <FichaEditalDocumentos e={e} />;
  } else if (aba === "contexto") {
    corpo = <PainelFicha id={e.id} aoAbrirRegra={setModalRegra} semCabecalho />;
  } else if (aba === "projetos") {
    corpo = <FichaEditalProjetos projetos={projetos} aoNovoProjeto={() => setNovoProjeto(true)} />;
  } else if (aba === "historico") {
    corpo = <Historico ids={[e.id]} />;
  } else {
    corpo = <FichaEditalNotas e={e} />;
  }

  return (
    <>
      <CabecalhoFicha
        rotuloVoltar="Voltar para Editais"
        aoVoltar={fecharDetalhe}
        avatar={nomeCurto(e)[0] || "E"}
        titulo={nomeCurto(e)}
        sub={
          <>
            <div>{e.nome}</div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge tom={esf.classe}>{esf.rotulo}</Badge>
              <Badge tom={st.classe}>{st.rotulo}</Badge>
              {prazoEncerrado(e) && (
                <Badge tom="ur-vencido" title="O edital está marcado como Aberto, mas o prazo já passou. Atualize o status em Editar.">prazo encerrado</Badge>
              )}
              {cat && <Badge tom="tipo">{cat.rotulo}</Badge>}
              <span title={e.prazo}>· prazo {prazoCurto(e) || "—"}</span>
            </div>
          </>
        }
        acoes={<Botao variante="fantasma" tamanho="pequeno" onClick={() => abrirEdicao("edital", e.id)}>Editar</Botao>}
        abas={SUB_ABAS.map(([id, rotulo]) => ({
          id, rotulo, n: id === "geral" ? nAlertas : id === "projetos" ? projetos.length : undefined,
        }))}
        abaAtiva={aba}
        aoTrocarAba={mudarSubAba}
      />
      {corpo}
      {modalRegra && <ModalRegra pedido={modalRegra} aoFechar={() => setModalRegra(null)} />}
      {novoProjeto && <ModalNovoProjeto editalId={e.id} aoFechar={() => setNovoProjeto(false)} />}
    </>
  );
}
