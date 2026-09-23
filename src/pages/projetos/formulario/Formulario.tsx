/* Aba Formulário do projeto: as respostas no formulário do edital, etapa por
   etapa, como na plataforma real — barra do topo (progresso, gaveta de regras
   e fichas, versões, copiar tudo), lateral de etapas e os campos. A seção
   interna (proponente, anotações, documentos) mora na aba Geral do projeto. */
import { useEffect, useState } from "react";
import { usarCentral } from "../../../store/central";
import { idsDoProjeto, salvarRascunho } from "../../../store/mutacoes";
import { mudarSubAba } from "../../../store/navegacao";
import { nomePlataforma } from "../../../data";
import { talvezFotografar } from "../../../lib/simulador/versoes";
import { ModalVersoes } from "./ModalVersoes";
import {
  comoTexto, condicaoOk, resumoRascunho, visivel, type CampoAchatado,
} from "../../../lib/simulador/motor";
import { copiarComAviso } from "../../../components/Toast";
import { RegrasParaRascunho } from "../../contexto/RegrasParaRascunho";
import { LateralEtapas } from "./LateralEtapas";
import { Campo } from "./Campo";
import { clonar } from "../../../utils";
import type { Projeto, Rascunho } from "../../../types";

interface Props {
  projeto: Projeto;
  rascunho: Rascunho;
  etapaAberta: number;
  aoMudarEtapa: (ei: number) => void;
}

export function FormularioRascunho({ projeto, rascunho: r, etapaAberta, aoMudarEtapa }: Props) {
  const { formularios } = usarCentral();
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [versoesAbertas, setVersoesAbertas] = useState(false);
  const f = formularios[r.form];

  // Fotografa o estado ao abrir o formulário (no máximo a cada 4 h): a versão
  // nasce ANTES das edições desta sessão de escrita.
  useEffect(() => { void talvezFotografar(r); }, [r.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // A definição vem do banco: ou ainda está chegando, ou não existe mesmo.
  if (!f) {
    return (
      <div className="vazio-msg">
        {Object.keys(formularios).length === 0
          ? "abrindo os formulários do banco…"
          : <>Este projeto usa o formulário <span className="mono">{r.form}</span>, que não está no banco.
            Importe a definição em Cadastros → Formulários.</>}
      </div>
    );
  }

  const s = resumoRascunho(r);

  /** Aplica uma mudança nas respostas e salva (grava com debounce). */
  const alterar = (fn: (r: Rascunho) => void, rapido = false) => {
    const copia = clonar(r);
    fn(copia);
    salvarRascunho(copia, rapido);
  };

  const ei = Math.max(0, Math.min(etapaAberta, f.etapas.length - 1));
  const etapa = f.etapas[ei];
  const irPara = (k: number) => { aoMudarEtapa(k); window.scrollTo({ top: 0 }); };

  return (
    <>
      <div className="form-top">
        <span className="refl"><b>{f.nome}</b> · {nomePlataforma(f.plataforma)}
          {f.origem === "documento" && <> · <span className="chip at" title={f.fonte}>mapeado dos documentos, sem os códigos da plataforma</span></>}
        </span>
        <button className="btn sm quiet" title="regras e fichas do Contexto ligadas a este projeto"
          onClick={() => setDrawerAberto(!drawerAberto)}>Regras e fichas</button>
        <span className="stat">{s.col} colados · {s.rev} revisados · {s.rasc} rascunho · {s.vazio} vazios</span>
        <div className="acts">
          <button className="btn sm" onClick={() => setVersoesAbertas(true)}>Versões</button>
          <button className="btn sm" onClick={() => void copiarComAviso(comoTexto(r), "Formulário copiado em texto")}>Copiar tudo em texto</button>
          <button className="btn sm" onClick={() => mudarSubAba("transferencia")}>Ir para transferência →</button>
        </div>
      </div>

      {drawerAberto && (
        <div className="drawer">
          <RegrasParaRascunho ids={idsDoProjeto(projeto)} aoFechar={() => setDrawerAberto(false)} />
        </div>
      )}

      <div className="form-body">
        <aside className={"side" + (f.nav === "stepper" ? " stepper" : "")}>
          <LateralEtapas r={r} etapaAberta={ei} aoMudarEtapa={irPara} />
        </aside>
        <div>
          <div className="etapa-h"><h3>{etapa.nome}</h3><span className="k">etapa {ei + 1} de {f.etapas.length}</span></div>
          {etapa.blocos.map((b, bi) => {
            if (!condicaoOk(b.quando, r.valores)) return null;
            return (
              <div className="bloco-plat" key={bi}>
                <h4>{b.t}{b.tag && <span className="tag">{b.tag}</span>}</h4>
                {b.campos.map((c, ci) => {
                  if (c.t === "info") {
                    return <div className="info" key={ci} dangerouslySetInnerHTML={{ __html: c.html || c.l || "" }} />;
                  }
                  const achatado: CampoAchatado = { ...c, n: c.n!, etapa, ei, bloco: b };
                  if (!visivel(achatado, r.valores)) return null;
                  return <Campo key={c.n} r={r} c={achatado} alterar={alterar} />;
                })}
              </div>
            );
          })}
          <div className="nav-passos">
            {ei > 0
              ? <button className="btn" onClick={() => irPara(ei - 1)}>← {f.etapas[ei - 1].nome}</button>
              : <span />}
            {ei < f.etapas.length - 1
              ? <button className="btn primary" onClick={() => irPara(ei + 1)}>{f.etapas[ei + 1].nome} →</button>
              : <button className="btn primary" onClick={() => mudarSubAba("transferencia")}>Ir para transferência →</button>}
          </div>
        </div>
      </div>

      {versoesAbertas && <ModalVersoes rascunho={r} aoFechar={() => setVersoesAbertas(false)} />}
    </>
  );
}
