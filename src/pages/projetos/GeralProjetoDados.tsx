/* Aba Geral do projeto, parte 1: os dados do projeto (status, artistas,
   edital, formulário, equipe, valores, links), os alertas do edital e o
   proponente (do cadastro de proponentes ou escrito à mão). */
import type { ReactNode } from "react";
import { paginaDoProjeto, usarCentral } from "../../store/central";
import { escolherProponente, trocarFormulario } from "../../store/mutacoes";
import { abrirDetalhe, irParaAmbiente } from "../../store/navegacao";
import { abrirEdicao } from "../../store/edicao";
import { anosDeCnpj, avisosProponente, idadeLegivel, proponenteDoProjeto } from "../../lib/proponentes";
import { editalDoProjeto, nomeEquipe, prazoCurto } from "../../lib/nomes";
import { temValor } from "../../lib/simulador/motor";
import { alertaVencido } from "../../lib/prazos";
import { PERFIS_JURIDICOS } from "../../data";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { Entrada, Selecao } from "../../components/ui/Campo";
import { Dado, Dados } from "../../components/ui/Dados";
import { Linha } from "../../components/ui/Linha";
import { Painel } from "../../components/ui/Painel";
import { Rotulo } from "../../components/ui/Rotulo";
import { ESTILO_LINK } from "../../components/ui/estilos";
import { ROTULO_STATUS_PROJETO, STATUS_EDITAL, type Projeto, type StatusProjeto } from "../../types";
import { url } from "../../utils";
import { alterarProjeto } from "./GeralProjetoComum";

const TRACO = <span className="text-muted">—</span>;

/** Link de ação dentro de um dado (abre a ficha do artista ou do edital). */
function LinkAcao({ aoClicar, children }: { aoClicar: () => void; children: ReactNode }) {
  return <a href="#" className={ESTILO_LINK} onClick={(e) => { e.preventDefault(); aoClicar(); }}>{children}</a>;
}

export function GeralProjetoDados({ p }: { p: Projeto }) {
  const { painel, rascunhos, formularios } = usarCentral();
  const edital = editalDoProjeto(p);
  const rascunho = p.rascunhoId ? rascunhos[p.rascunhoId] : undefined;
  const formularioVazio = !rascunho || !Object.values(rascunho.valores || {}).some(temValor);
  const artistas = p.artistaIds.map((id) => painel.artistas.find((a) => a.id === id)).filter(Boolean);
  const pagina = paginaDoProjeto(p.id);
  const opcoesForm = Object.values(formularios)
    .filter((f) => !edital || !(edital.formIds?.length || edital.formId) || (edital.formIds || [edital.formId]).includes(f.id))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const valores = [
    p.valorPedido && "pedido " + p.valorPedido,
    p.valorAprovado && "aprovado " + p.valorAprovado,
    p.valorCaptado && "captado " + p.valorCaptado,
  ].filter(Boolean).join(" · ");

  return (
    <Painel titulo="Dados do projeto"
      acoes={<Botao variante="fantasma" tamanho="pequeno" onClick={() => abrirEdicao("projeto", p.id)}>Editar dados</Botao>}>
      <Dados>
        <Dado rotulo="Status">{ROTULO_STATUS_PROJETO[p.status as StatusProjeto] || TRACO}</Dado>
        <Dado rotulo="Artistas">
          {artistas.length ? artistas.map((a, i) => (
            <span key={a!.id}>{i > 0 && ", "}<LinkAcao aoClicar={() => abrirDetalhe("artista", a!.id)}>{a!.nome}</LinkAcao></span>
          )) : TRACO}
        </Dado>
        <Dado rotulo="Edital">
          {edital ? (
            <>
              <LinkAcao aoClicar={() => abrirDetalhe("edital", edital.id)}>{edital.nome}</LinkAcao>
              {" "}<Badge tom={STATUS_EDITAL[edital.status]?.classe || "neutro"}>{STATUS_EDITAL[edital.status]?.rotulo}</Badge>
              {edital.prazo && <span className="text-muted" title={edital.prazo}> · prazo {prazoCurto(edital)}</span>}
            </>
          ) : TRACO}
        </Dado>
        <Dado rotulo="Formulário">
          {formularioVazio ? (
            <Selecao className="w-auto max-w-full py-1 text-sm" value={p.formId} onChange={(e) => trocarFormulario(p, e.target.value)}>
              <option value="livre">Livre (sem formulário)</option>
              {opcoesForm.map((f) => <option key={f.id} value={f.id}>{f.nome}{f.origem === "documento" ? " (dos documentos)" : ""}</option>)}
              {p.formId !== "livre" && !formularios[p.formId] && <option value={p.formId}>{p.formId}</option>}
            </Selecao>
          ) : (
            <>{formularios[p.formId]?.nome || p.formId} <span className="text-muted">(já tem respostas; para trocar, duplique o projeto)</span></>
          )}
        </Dado>
        <Dado rotulo="Responsável">{p.respId ? nomeEquipe(p.respId) : TRACO}</Dado>
        <Dado rotulo="Equipe">{(p.equipeIds || []).map(nomeEquipe).join(", ") || TRACO}</Dado>
        <Dado rotulo="Tipo · janela">{[p.tipo, p.ano].filter(Boolean).join(" · ") || TRACO}</Dado>
        <Dado rotulo="Faz parte de">{p.grupo || TRACO}</Dado>
        <Dado rotulo="Valores">{valores || TRACO}</Dado>
        <Dado rotulo="Nº de inscrição">{p.inscricao || TRACO}</Dado>
        <Dado rotulo="Resultado">{p.resultado || TRACO}</Dado>
        <Dado rotulo="Pasta no Drive">
          {p.linkDrive ? <a className={ESTILO_LINK} href={url(p.linkDrive)} target="_blank" rel="noopener noreferrer">📁 abrir ↗</a> : TRACO}
        </Dado>
        {pagina && <Dado rotulo="Página própria"><a className={ESTILO_LINK} href={"/" + pagina.slug + "/"}>{pagina.titulo} ↗</a></Dado>}
        {p.obs && <Dado rotulo="Observações"><span className="whitespace-pre-wrap">{p.obs}</span></Dado>}
      </Dados>
    </Painel>
  );
}

export function GeralProjetoAlertas({ p }: { p: Projeto }) {
  const edital = editalDoProjeto(p);
  if (!edital?.alertas?.length) return null;
  return (
    <Painel alerta titulo="Alertas do edital" sub="do Mapa dos Editais">
      {edital.alertas.map((a, i) => {
        const passou = alertaVencido(a, edital);
        return (
          <Linha topo apagada={passou} key={i}>
            <div><b>{a.titulo}</b>{a.quando && <span className="text-muted"> · {a.quando}</span>}{passou && <span className="text-muted"> · data já passou</span>}</div>
            <div className="mt-0.5">{a.texto}</div>
            {a.fazer && <div className="mt-0.5 text-accent"><b>Fazer:</b> {a.fazer}</div>}
          </Linha>
        );
      })}
    </Painel>
  );
}

export function GeralProjetoProponente({ p }: { p: Projeto }) {
  const { painel } = usarCentral();
  const proponente = proponenteDoProjeto(p, painel);
  const avisos = avisosProponente(p, painel);
  const alterar = (fn: (c: Projeto) => void, rapido = true) => alterarProjeto(p, fn, rapido);
  const proponentes = [...painel.proponentes].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return (
    <Painel titulo="Proponente" sub="quem assina a inscrição (quase nunca é o artista)">
      <div className="grid grid-cols-1 gap-x-3.5 gap-y-2.5 rounded-md bg-accent-soft px-3.5 py-3 md:grid-cols-2">
        <div className="flex flex-col gap-1 md:col-span-2">
          <Rotulo>do cadastro de proponentes</Rotulo>
          <div className="flex items-center gap-2">
            <Selecao className="flex-1" value={p.proponenteId || ""}
              onChange={(e) => escolherProponente(p, painel.proponentes.find((x) => x.id === e.target.value))}>
              <option value="">— nenhum do cadastro (usar o nome escrito abaixo)</option>
              {proponentes.map((x) => (
                <option key={x.id} value={x.id}>{x.nome}{x.situacao === "a_confirmar" ? " (a confirmar)" : ""}</option>
              ))}
            </Selecao>
            <Botao variante="fantasma" tamanho="pequeno" onClick={() => irParaAmbiente("cadastros", "proponentes")}>cadastro →</Botao>
          </div>
        </div>
        {proponente && (
          <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-sm md:col-span-2">
            <span>{proponente.perfil || "perfil não informado"}</span>
            {proponente.cnpj && <span>CNPJ {proponente.cnpj}</span>}
            {proponente.abertura && <span>aberto há {idadeLegivel(anosDeCnpj(proponente.abertura))}</span>}
            {proponente.cnae && <span>CNAE {proponente.cnae}</span>}
            {proponente.representante && <span>assina: {proponente.representante}</span>}
            <a className={ESTILO_LINK} onClick={() => abrirEdicao("proponente", proponente.id)}>editar cadastro</a>
          </div>
        )}
        {!proponente && (
          <>
            <div className="flex flex-col gap-1">
              <Rotulo>nome</Rotulo>
              <Entrada value={p.proponente.nome} placeholder="pessoa ou empresa que inscreve"
                onChange={(e) => alterar((c) => { c.proponente.nome = e.target.value; }, false)} />
            </div>
            <div className="flex flex-col gap-1">
              <Rotulo>perfil jurídico</Rotulo>
              <Selecao value={p.proponente.perfil} onChange={(e) => alterar((c) => { c.proponente.perfil = e.target.value; })}>
                {PERFIS_JURIDICOS.map((x) => <option key={x}>{x}</option>)}
              </Selecao>
            </div>
          </>
        )}
        <div className="flex flex-col gap-1 md:col-span-2">
          <Rotulo>observação</Rotulo>
          <Entrada value={p.proponente.obs} placeholder="sem CPF, RG ou dados bancários aqui"
            onChange={(e) => alterar((c) => { c.proponente.obs = e.target.value; }, false)} />
        </div>
      </div>
      {avisos.length > 0 && (
        <div className="mt-3 flex flex-col gap-1 rounded-md border border-gold bg-warn-soft px-3 py-2 text-sm text-warn">
          {avisos.map((a) => <div key={a}>⚠ {a}</div>)}
        </div>
      )}
    </Painel>
  );
}
