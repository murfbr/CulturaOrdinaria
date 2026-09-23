/* Roteia o conteúdo dos ambientes de gestão (Painel, Cadastros, Agenda,
   Pessoas, Gestão): ou uma ficha de detalhe aberta, ou a tela da aba.
   Projetos e Contexto têm roteadores próprios (ver App). */
import { useEffect } from "react";
import { usarCentral } from "../store/central";
import { porId } from "../store/mutacoes";
import { fecharDetalhe, usarNavegacao } from "../store/navegacao";
import { Resumo } from "./painel/Resumo";
import { Pendencias } from "./painel/Pendencias";
import { ListaArtistas } from "./cadastros/artistas/ListaArtistas";
import { FichaArtista } from "./cadastros/artistas/FichaArtista";
import { ListaEditais } from "./cadastros/editais/ListaEditais";
import { FichaEdital } from "./cadastros/editais/FichaEdital";
import { ListaFormularios } from "./cadastros/formularios/ListaFormularios";
import { FichaFormulario } from "./cadastros/formularios/FichaFormulario";
import { Cronograma } from "./agenda/Cronograma";
import { Calendario } from "./agenda/Calendario";
import { Elenco } from "./pessoas/Elenco";
import { Equipe } from "./pessoas/Equipe";
import { Contatos } from "./pessoas/Contatos";
import { Reunioes } from "./gestao/Reunioes";
import { FichaReuniao } from "./gestao/FichaReuniao";
import { QuadroTarefas } from "./gestao/QuadroTarefas";
import { Lixeira } from "./gestao/Lixeira";
import { Migracao } from "./gestao/Migracao";
import type { ColecaoPainel } from "../types";

const COLECAO_DO_DETALHE: Record<string, ColecaoPainel> = {
  artista: "artistas", edital: "editais", reuniao: "reunioes",
};

export function RoteadorPainel() {
  const nav = usarNavegacao();
  const { pronto, formularios } = usarCentral(); // re-renderiza este roteador quando os dados mudam

  // Se o registro da ficha aberta sumiu (excluído em outra aba, ou link para id
  // que não existe), volta para a lista — mas só com os dados já carregados,
  // senão um link profundo fecharia antes de a coleção chegar. Formulário tem
  // carga própria (fora do "pronto"): a ficha dele mostra o aviso sozinha.
  const d = nav.detalhe;
  const detalheValido = d && (d.tipo === "formulario"
    ? true
    : COLECAO_DO_DETALHE[d.tipo] && porId(COLECAO_DO_DETALHE[d.tipo], d.id));
  useEffect(() => {
    if (pronto && d && !detalheValido) fecharDetalhe();
  }, [pronto, d, detalheValido]);
  void formularios;

  if (d && detalheValido) {
    switch (d.tipo) {
      case "artista": return <FichaArtista id={d.id} sub={d.sub || "geral"} />;
      case "edital": return <FichaEdital id={d.id} sub={d.sub || "geral"} />;
      case "formulario": return <FichaFormulario id={d.id} />;
      case "reuniao": return <FichaReuniao id={d.id} />;
    }
  }

  switch (nav.aba) {
    case "resumo": return <Resumo />;
    case "pendencias": return <Pendencias />;
    case "artistas": return <ListaArtistas />;
    case "editais": return <ListaEditais />;
    case "formularios": return <ListaFormularios />;
    case "cronograma": return <Cronograma />;
    case "calendario": return <Calendario />;
    case "elenco": return <Elenco />;
    case "equipe": return <Equipe />;
    case "contatos": return <Contatos />;
    case "reunioes": return <Reunioes />;
    case "quadro": return <QuadroTarefas />;
    case "lixeira": return <Lixeira />;
    case "migracao": return <Migracao />;
    default: return <Resumo />;
  }
}
