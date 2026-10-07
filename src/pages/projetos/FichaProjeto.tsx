/* Ficha do projeto, em página: CabecalhoFicha com o nome editável, artistas,
   edital e formulário, o status em pílula (◀ ▶) e as ações; abas Geral
   (dados, proponente, anotações, documentos, produção, tarefas), Formulário
   (as respostas no formulário do edital), Transferência (copiar para a
   plataforma oficial), Contexto (fichas e regras ligadas) e Histórico (quem
   mudou o quê, do log de alterações). */
import { useState, type ReactNode } from "react";
import { usarCentral } from "../../store/central";
import { arquivarProjeto, duplicarProjeto, moverProjeto, definirStatusProjeto, salvarRegistro } from "../../store/mutacoes";
import { abrirDetalhe, abrirProjeto, fecharDetalhe, mudarSubAba } from "../../store/navegacao";
import { abrirEdicao } from "../../store/edicao";
import { editalDoProjeto, nomeCurto } from "../../lib/nomes";
import { normalizarRascunho } from "../../lib/simulador/motor";
import { toast } from "../../components/Toast";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { CabecalhoFicha, type SubAba } from "../../components/ui/CabecalhoFicha";
import { ESTILO_CONTROLE_DISCRETO } from "../../components/ui/Campo";
import { Vazio } from "../../components/ui/Vazio";
import { ESTILO_LINK } from "../../components/ui/estilos";
import { STATUS_PROJETO, type Projeto, type StatusProjeto } from "../../types";
import { clonar } from "../../utils";
import { cx } from "../../utils/classes";
import { GeralProjeto } from "./GeralProjeto";
import { FormularioRascunho } from "./formulario/Formulario";
import { Transferencia } from "./Transferencia";
import { ContextoProjeto } from "./ContextoProjeto";
import { usarExclusaoProjeto } from "./exclusao";
import { Historico } from "../../components/Historico";

const CHAVE_ETAPA = "central-proj-etapa-v1";
const lerEtapas = (): Record<string, number> => {
  try { return JSON.parse(localStorage.getItem(CHAVE_ETAPA) || "{}"); } catch { return {}; }
};

/** Link do subtítulo (artista, edital, formulário): abre a ficha. */
const link = (texto: ReactNode, abrir: () => void) => (
  <a href="#" className={ESTILO_LINK} onClick={(e) => { e.preventDefault(); abrir(); }}>{texto}</a>
);

export function FichaProjeto({ p, sub }: { p: Projeto; sub: string }) {
  const { painel, rascunhos, formularios } = usarCentral();
  const [etapas, setEtapas] = useState<Record<string, number>>(lerEtapas);
  const exclusao = usarExclusaoProjeto(() => fecharDetalhe());
  const edital = editalDoProjeto(p);
  const form = p.formId !== "livre" ? formularios[p.formId] : undefined;
  const rascunho = p.rascunhoId ? rascunhos[p.rascunhoId] : undefined;
  const temFormulario = p.formId !== "livre";
  const aba = !temFormulario && (sub === "formulario" || sub === "transferencia") ? "geral" : sub;
  const statusAtual = STATUS_PROJETO.find((s) => s.id === p.status);

  function irEtapa(ei: number) {
    const novo = { ...etapas, [p.id]: ei };
    setEtapas(novo);
    try { localStorage.setItem(CHAVE_ETAPA, JSON.stringify(novo)); } catch { /* sem localStorage */ }
  }

  let corpo;
  if (aba === "formulario" || aba === "transferencia") {
    if (!rascunho) {
      corpo = <Vazio>Este projeto ainda não tem as respostas do formulário. Abra a aba Geral e escolha o formulário de novo para criar.</Vazio>;
    } else if (aba === "formulario") {
      corpo = <FormularioRascunho projeto={p} rascunho={normalizarRascunho(clonar(rascunho))} etapaAberta={etapas[p.id] || 0} aoMudarEtapa={irEtapa} />;
    } else {
      corpo = <Transferencia projeto={p} rascunho={normalizarRascunho(clonar(rascunho))} />;
    }
  } else if (aba === "contexto") {
    corpo = <ContextoProjeto p={p} />;
  } else if (aba === "historico") {
    corpo = <Historico ids={[p.id, p.rascunhoId || ""]} />;
  } else {
    corpo = <GeralProjeto p={p} />;
  }

  const abas: SubAba[] = ([
    ["geral", "Geral", true],
    ["formulario", "Formulário", temFormulario],
    ["transferencia", "Transferência", temFormulario],
    ["contexto", "Contexto", true],
    ["historico", "Histórico", true],
  ] as [string, string, boolean][]).filter(([, , ok]) => ok).map(([id, rotulo]) => ({ id, rotulo }));

  const artistas = p.artistaIds
    .map((id) => {
      const a = painel.artistas.find((x) => x.id === id);
      return a ? <span key={id}>{link(a.nome, () => abrirDetalhe("artista", id))}</span> : null;
    })
    .reduce<ReactNode[]>((acc, el, i) => (i ? [...acc, ", ", el] : [el]), []);

  return (
    <>
      <CabecalhoFicha
        rotuloVoltar="Projetos"
        aoVoltar={fecharDetalhe}
        avatar={(p.nome.trim()[0] || "?").toUpperCase()}
        titulo={
          <input type="text" className={cx(ESTILO_CONTROLE_DISCRETO, "w-full font-display text-5xl font-normal")} value={p.nome} aria-label="nome do projeto"
            onChange={(e) => salvarRegistro("projetos", { ...clonar(p), nome: e.target.value }, false)} />
        }
        sub={
          <>
            {p.artistaIds.length ? artistas : <span className="text-faint">sem artista</span>}
            {" · "}
            {edital ? link(nomeCurto(edital), () => abrirDetalhe("edital", edital.id)) : <span className="text-faint">sem edital</span>}
            {" · "}
            {temFormulario
              ? link(<>formulário {form?.nome || p.formId}{form?.origem === "documento" ? " (dos documentos)" : ""}</>, () => abrirDetalhe("formulario", p.formId))
              : <span>Livre</span>}
            {p.grupo && <> · <span className="text-faint">parte de {p.grupo}</span></>}
            {p.arquivado && <> · <Badge tom="st-closed">arquivado</Badge></>}
          </>
        }
        acoes={
          <>
            <span className="flex items-center gap-1">
              <Botao variante="fantasma" tamanho="pequeno" title="status anterior" onClick={() => moverProjeto(p, -1)}>◀</Botao>
              {/* A pílula do status é um Badge com o select dentro: a cor vem da tabela do Badge. */}
              <Badge tom={statusAtual?.classe} className="cursor-pointer">
                <select className="cursor-pointer appearance-none border-0 bg-transparent p-0 font-sans text-xs font-bold text-current outline-none"
                  value={p.status} aria-label="status do projeto"
                  onChange={(e) => definirStatusProjeto(p, e.target.value as StatusProjeto)}>
                  {STATUS_PROJETO.map((s) => <option key={s.id} value={s.id}>{s.rotulo}</option>)}
                </select>
                ▾
              </Badge>
              <Botao variante="fantasma" tamanho="pequeno" title="próximo status" onClick={() => moverProjeto(p, 1)}>▶</Botao>
            </span>
            <Botao variante="fantasma" tamanho="pequeno" onClick={() => abrirEdicao("projeto", p.id)}>Editar dados</Botao>
            <Botao variante="fantasma" tamanho="pequeno" onClick={() => { const id = duplicarProjeto(p); toast("Projeto duplicado"); abrirProjeto(id); }}>Duplicar</Botao>
            <Botao variante="fantasma" tamanho="pequeno" onClick={() => { arquivarProjeto(p, !p.arquivado); toast(p.arquivado ? "Projeto reaberto" : "Projeto arquivado"); }}>
              {p.arquivado ? "Reabrir" : "Arquivar"}
            </Botao>
            <Botao variante="apagar" tamanho="pequeno" onClick={() => exclusao.pedir(p)}>Excluir</Botao>
          </>
        }
        abas={abas}
        abaAtiva={aba}
        aoTrocarAba={mudarSubAba}
      />

      {corpo}
      {exclusao.modal}
    </>
  );
}
