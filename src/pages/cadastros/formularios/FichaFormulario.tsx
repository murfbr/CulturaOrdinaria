/* Ficha de um formulário: de onde veio (plataforma ou documentos), confiança,
   editais que o usam, como a plataforma funciona e a estrutura inteira —
   etapas, blocos e campos, com limite, obrigatoriedade e conceito. */
import { useState } from "react";
import { usarCentral } from "../../../store/central";
import { abrirDetalhe, abrirProjeto, fecharDetalhe } from "../../../store/navegacao";
import { PLATAFORMAS, nomePlataforma } from "../../../data";
import { nomeCurto, prazoCurto } from "../../../lib/nomes";
import { ModalNovoProjeto } from "../../projetos/ModalNovoProjeto";
import { CONCEITOS_CAMPO, ROTULO_STATUS_PROJETO } from "../../../types";
import { url } from "../../../utils";
import { cx } from "../../../utils/classes";
import { Badge } from "../../../components/ui/Badge";
import { Botao } from "../../../components/ui/Botao";
import { CabecalhoFicha } from "../../../components/ui/CabecalhoFicha";
import { Chip } from "../../../components/ui/Chip";
import { Dado, Dados } from "../../../components/ui/Dados";
import { Grade } from "../../../components/ui/Grade";
import { Linha } from "../../../components/ui/Linha";
import { Painel } from "../../../components/ui/Painel";
import { Rotulo } from "../../../components/ui/Rotulo";
import { Tabela, Td } from "../../../components/ui/Tabela";
import { Vazio } from "../../../components/ui/Vazio";
import { ESTILO_APAGADO, ESTILO_LINK, ESTILO_MONO } from "../../../components/ui/estilos";
import { TOM_CONFIANCA } from "../editais/FichaEditalBase";
import { contarCampos } from "./ListaFormularios";

const TIPO_CAMPO: Record<string, string> = {
  txt: "texto curto", ta: "texto longo", sel: "lista", rad: "escolha única", chk: "múltipla escolha",
  date: "data", rep: "lista repetível", docs: "checklist de anexos", anexo: "anexo", orc: "planilha orçamentária",
  orcresumo: "resumo do orçamento", info: "informativo",
};

export function FichaFormulario({ id }: { id: string }) {
  const { painel, formularios } = usarCentral();
  const [novoProjeto, setNovoProjeto] = useState(false);
  const f = formularios[id];
  if (!f) {
    return (
      <CabecalhoFicha
        rotuloVoltar="Voltar para Formulários"
        aoVoltar={fecharDetalhe}
        titulo={<>Formulário <span className={ESTILO_MONO}>{id}</span></>}
        sub="não está no banco (ainda carregando, ou foi excluído)."
      />
    );
  }
  const plat = PLATAFORMAS.find((p) => p.id === f.plataforma);
  const editais = painel.editais.filter((e) => e.formId === f.id || (e.formIds || []).includes(f.id) || (f.editais || []).includes(e.id));
  const projetos = painel.projetos.filter((p) => p.formId === f.id);
  const conceito = (k?: string) => (k ? CONCEITOS_CAMPO.find(([x]) => x === k)?.[1] || k : "");
  const doDocumento = f.origem === "documento";
  const seta = <span className="font-bold text-accent">→</span>;

  return (
    <>
      <CabecalhoFicha
        rotuloVoltar="Voltar para Formulários"
        aoVoltar={fecharDetalhe}
        avatar="F"
        titulo={f.nome}
        sub={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <Badge tom={doDocumento ? "st-prev" : "st-open"}>{doDocumento ? "mapeado dos documentos" : "mapeado na plataforma"}</Badge>
            <span>· {nomePlataforma(f.plataforma)} · {f.etapas.length} etapa(s) · {contarCampos(f)} campos</span>
          </span>
        }
        acoes={<Botao tamanho="pequeno" onClick={() => setNovoProjeto(true)}>+ Novo projeto com este formulário</Botao>}
      />

      <Grade colunas={2}>
        <Painel titulo="Origem">
          <Dados>
            <Dado rotulo="Como foi mapeado">
              {doDocumento
                ? "Reconstruído do documento do edital. A ordem e os nomes podem variar na plataforma, e não há os códigos dos campos."
                : "Extraído da plataforma real, campo a campo, com os códigos (name) de cada campo."}
            </Dado>
            <Dado rotulo="Fonte"><span className="break-words">{f.fonte || (doDocumento ? "—" : "plataforma oficial")}</span></Dado>
            <Dado rotulo="Extraído em">{f.extraido || "—"}</Dado>
            {f.confianca && <Dado rotulo="Confiança"><Badge tom={TOM_CONFIANCA[f.confianca]} mini caixaAlta>{f.confianca}</Badge></Dado>}
            {f.divergencias && <Dado rotulo="Divergências"><span className="whitespace-pre-wrap">{f.divergencias}</span></Dado>}
            {f.obs && <Dado rotulo="Observação">{f.obs}</Dado>}
          </Dados>
        </Painel>
        <Painel titulo="Onde é usado">
          {editais.map((e) => (
            <Linha compacta key={e.id} aoClicar={() => abrirDetalhe("edital", e.id)} direita={seta}>
              <b>{nomeCurto(e)}</b> <span className="text-muted">· {prazoCurto(e) || "sem prazo"}</span>
            </Linha>
          ))}
          {!editais.length && <Vazio emLinha>Nenhum edital aponta para este formulário.</Vazio>}
          {projetos.map((p) => (
            <Linha compacta key={p.id} aoClicar={() => abrirProjeto(p.id, "formulario")} direita={<Badge tom="tipo">{ROTULO_STATUS_PROJETO[p.status]}</Badge>}>
              {p.nome}{p.arquivado ? <span className="text-muted"> (arquivado)</span> : null}
            </Linha>
          ))}
        </Painel>
      </Grade>

      {plat && (
        <Painel titulo={`Plataforma: ${plat.nome}`}>
          <Dados>
            {plat.url && (
              <Dado rotulo="Endereço">
                <a className={cx(ESTILO_LINK, "break-all")} href={url(plat.url)} target="_blank" rel="noopener noreferrer">{plat.url} ↗</a>
              </Dado>
            )}
            {([["Arquitetura", plat.arq], ["Porta de entrada", plat.porta], ["Códigos", plat.codigos], ["Limites", plat.limites], ["Anexos", plat.anexos], ["Armadilhas", plat.armadilhas]] as [string, string][])
              .filter(([, v]) => v).map(([k, v]) => <Dado key={k} rotulo={k}>{v}</Dado>)}
          </Dados>
        </Painel>
      )}

      {f.etapas.map((et, ei) => (
        <Painel key={et.id} titulo={<>{ei + 1}. {et.nome}{et.cod && <span className={cx("ml-2 normal-case tracking-normal", ESTILO_MONO)}>{et.cod}</span>}</>}>
          {et.blocos.map((b, bi) => (
            <div key={bi} className="mb-2.5">
              {b.t && b.t !== et.nome && <Rotulo className="mb-1 mt-1.5">{b.t}</Rotulo>}
              <Tabela simples>
                <tbody>
                  {b.campos.map((c, ci) => (
                    <tr key={ci}>
                      <Td className="w-5/12">
                        <b>{c.l || (c.t === "info" ? "texto informativo" : "")}</b>{c.req ? <span className="text-muted"> *</span> : null}
                        {c.dica && <div className={ESTILO_APAGADO}>{c.dica.length > 220 ? c.dica.slice(0, 220) + "…" : c.dica}</div>}
                      </Td>
                      <Td className="text-muted">{TIPO_CAMPO[c.t] || c.t}{c.opts?.length ? " (" + c.opts.length + " opções)" : ""}</Td>
                      <Td numerico>{c.max ? c.max.toLocaleString("pt-BR") + " car." : c.limiteTexto || ""}</Td>
                      <Td>{c.conceito && <Chip>{conceito(c.conceito)}</Chip>}</Td>
                      <Td>{c.n && !c.n.startsWith("doc__") ? <span className={ESTILO_MONO}>{c.cod || c.n}</span> : ""}</Td>
                    </tr>
                  ))}
                </tbody>
              </Tabela>
            </div>
          ))}
        </Painel>
      ))}

      {novoProjeto && <ModalNovoProjeto editalId={editais[0]?.id} aoFechar={() => setNovoProjeto(false)} />}
    </>
  );
}
