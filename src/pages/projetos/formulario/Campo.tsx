/* Um campo da plataforma no editor: cartão com a borda esquerda na cor do
   status, cabeçalho com rótulo, obrigatório, código, status (rascunho →
   revisado → colado), copiar e nota — e o corpo delegado ao componente do
   tipo (campos/*). */
import { useState } from "react";
import { statusEfetivo, textoDe } from "../../../lib/simulador/motor";
import { conceitoDoCampo, indiceMemo, sugestoesPara } from "../../../lib/textos";
import { usarCentral } from "../../../store/central";
import { ModalReaproveitar } from "./ModalReaproveitar";
import { copiarComAviso, toast } from "../../../components/Toast";
import { Badge } from "../../../components/ui/Badge";
import { Botao } from "../../../components/ui/Botao";
import { ESTILO_CONTROLE_DISCRETO } from "../../../components/ui/Campo";
import { Chip } from "../../../components/ui/Chip";
import { Dica } from "../../../components/ui/Dica";
import { ESTILO_MONO } from "../../../components/ui/estilos";
import { cx } from "../../../utils/classes";
import { ROTULO_STATUS_CAMPO, type StatusCampo } from "../../../types";
import type { PropsCampo } from "./tipos";
import { CampoTexto } from "./campos/CampoTexto";
import { CampoTextoLongo } from "./campos/CampoTextoLongo";
import { CampoData, CampoSelecao } from "./campos/CampoSelecao";
import { CampoOpcaoUnica } from "./campos/CampoOpcaoUnica";
import { CampoMultiplaEscolha } from "./campos/CampoMultiplaEscolha";
import { CampoRepetivel } from "./campos/CampoRepetivel";
import { CampoDocumentos } from "./campos/CampoDocumentos";
import { CampoAnexo } from "./campos/CampoAnexo";
import { PlanilhaOrcamento } from "../orcamento/PlanilhaOrcamento";
import { ResumoOrcamento } from "../orcamento/ResumoOrcamento";

/** Cor da borda esquerda do cartão, pelo status da resposta. */
const BORDA_STATUS: Record<string, string> = {
  vazio: "border-l-line-strong", rasc: "border-l-gold", rev: "border-l-fed", col: "border-l-ok",
};

/** O componente de corpo de cada tipo de campo do motor. */
function CorpoDoCampo(props: PropsCampo) {
  switch (props.c.t) {
    case "txt": return <CampoTexto {...props} />;
    case "ta": return <CampoTextoLongo {...props} />;
    case "sel": return <CampoSelecao {...props} />;
    case "date": return <CampoData {...props} />;
    case "rad": return <CampoOpcaoUnica {...props} />;
    case "chk": return <CampoMultiplaEscolha {...props} />;
    case "rep": return <CampoRepetivel {...props} />;
    case "docs": return <CampoDocumentos {...props} />;
    case "anexo": return <CampoAnexo {...props} />;
    case "orc": return <PlanilhaOrcamento r={props.r} alterar={props.alterar} />;
    case "orcresumo": return <ResumoOrcamento r={props.r} alterar={props.alterar} />;
    default: return null;
  }
}

export function Campo({ r, c, alterar }: PropsCampo) {
  const st = statusEfetivo(r, c);
  const { painel, rascunhos, formularios } = usarCentral();
  const [reaproveitar, setReaproveitar] = useState(false);
  // Textos-mestres: o que já foi escrito com o mesmo conceito em outros projetos.
  const conceito = conceitoDoCampo(c);
  const projeto = painel.projetos.find((p) => p.rascunhoId === r.id || p.id === r.ref);
  const artistaIds = projeto?.artistaIds || [];
  const sugestoes = conceito ? sugestoesPara(indiceMemo(painel, rascunhos, formularios), conceito, r.id, c.n, artistaIds) : [];

  function girarStatus() {
    if (st === "vazio") { toast("Campo vazio: o status aparece quando houver conteúdo"); return; }
    const ordem: StatusCampo[] = ["rasc", "rev", "col"];
    alterar((copia) => {
      copia.status[c.n] = ordem[(ordem.indexOf(copia.status[c.n] || "rasc") + 1) % 3];
    });
  }

  function alternarNota() {
    if (r.notas[c.n] != null && !(r.notas[c.n] || "").trim()) {
      alterar((copia) => { delete copia.notas[c.n]; });
    } else if (r.notas[c.n] == null) {
      alterar((copia) => { copia.notas[c.n] = ""; });
    }
  }

  return (
    <div className={cx("mb-2.5 rounded-xl border border-l-4 border-line bg-card px-3.5 py-3", BORDA_STATUS[st])}>
      <div className="mb-1.5 flex flex-wrap items-baseline gap-2.5">
        <label htmlFor={"f-" + c.n} className="text-sm font-semibold">{c.l}</label>
        {c.req ? <span className="text-xs text-gold">obrigatório</span> : null}
        {c.n.startsWith("doc__") ? null : <span className={ESTILO_MONO}>{c.cod || c.n}</span>}
        {c.limiteTexto && <Chip>{c.limiteTexto}</Chip>}
        <span className="ml-auto flex items-center gap-1">
          <button type="button" className="cursor-pointer border-0 bg-transparent p-0" title="clique para mudar o status" onClick={girarStatus}>
            <Badge tom={st === "vazio" ? "neutro" : st} clicavel>{ROTULO_STATUS_CAMPO[st]}</Badge>
          </button>
          <Botao variante="quieto" tamanho="pequeno"
            onClick={() => void copiarComAviso(textoDe(c, r.valores[c.n], r), "Campo copiado")}>Copiar</Botao>
          <Botao variante="quieto" tamanho="pequeno" onClick={alternarNota}>Nota</Botao>
          {sugestoes.length > 0 && (
            <Botao variante="quieto" tamanho="pequeno" title="textos já escritos com o mesmo conceito em outros projetos"
              onClick={() => setReaproveitar(true)}>Reaproveitar ({sugestoes.length})</Botao>
          )}
        </span>
      </div>
      {c.dica && <Dica className="mb-2 max-w-[75ch]">{c.dica}</Dica>}
      <CorpoDoCampo r={r} c={c} alterar={alterar} />
      {reaproveitar && (
        <ModalReaproveitar c={c} r={r} conceito={conceito} sugestoes={sugestoes} artistaIds={artistaIds}
          alterar={alterar} aoFechar={() => setReaproveitar(false)} />
      )}
      {r.notas[c.n] != null && (
        <div className="mt-2 flex items-start gap-2 rounded-md bg-bg-sunk px-2.5 py-1.5 text-sm text-muted">
          <b className="flex-none pt-1 font-semibold text-ink">Nota:</b>
          <input type="text" className={cx("w-full", ESTILO_CONTROLE_DISCRETO)} value={r.notas[c.n]}
            placeholder="anotação interna sobre este campo"
            onChange={(e) => alterar((copia) => { copia.notas[c.n] = e.target.value; })} />
        </div>
      )}
    </div>
  );
}
