/* Aba Formulário do projeto: as respostas no formulário do edital, etapa por
   etapa, como na plataforma real — barra do topo (progresso, gaveta de regras
   e fichas, versões, copiar tudo), lateral de etapas presa ao rolar e os
   campos. A seção interna (proponente, anotações, documentos) mora na aba
   Geral do projeto. */
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
import { CabecalhoSecao } from "../../../components/CabecalhoSecao";
import { Botao } from "../../../components/ui/Botao";
import { Chip } from "../../../components/ui/Chip";
import { Gaveta } from "../../../components/ui/Gaveta";
import { Grade } from "../../../components/ui/Grade";
import { Rotulo } from "../../../components/ui/Rotulo";
import { Vazio } from "../../../components/ui/Vazio";
import { ESTILO_MONO } from "../../../components/ui/estilos";
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
      <Vazio className="mt-4">
        {Object.keys(formularios).length === 0
          ? "abrindo os formulários do banco…"
          : <>Este projeto usa o formulário <span className={ESTILO_MONO}>{r.form}</span>, que não está no banco.
            Importe a definição em Cadastros → Formulários.</>}
      </Vazio>
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
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-card px-3.5 py-2.5">
        <span className="text-xs text-muted">
          <b>{f.nome}</b> · {nomePlataforma(f.plataforma)}
          {f.origem === "documento" && <> · <Chip title={f.fonte}>mapeado dos documentos, sem os códigos da plataforma</Chip></>}
        </span>
        <Botao variante="quieto" tamanho="pequeno" title="regras e fichas do Contexto ligadas a este projeto"
          onClick={() => setDrawerAberto(!drawerAberto)}>Regras e fichas</Botao>
        <span className="text-xs text-muted tabular-nums">{s.col} colados · {s.rev} revisados · {s.rasc} rascunho · {s.vazio} vazios</span>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <Botao variante="fantasma" tamanho="pequeno" onClick={() => setVersoesAbertas(true)}>Versões</Botao>
          <Botao variante="fantasma" tamanho="pequeno" onClick={() => void copiarComAviso(comoTexto(r), "Formulário copiado em texto")}>Copiar tudo em texto</Botao>
          <Botao variante="fantasma" tamanho="pequeno" onClick={() => mudarSubAba("transferencia")}>Ir para transferência →</Botao>
        </div>
      </div>

      {drawerAberto && (
        <Gaveta titulo="Regras e fichas para este projeto"
          acoes={<Botao variante="quieto" tamanho="pequeno" onClick={() => setDrawerAberto(false)}>fechar</Botao>}>
          <RegrasParaRascunho ids={idsDoProjeto(projeto)} semCabecalho />
        </Gaveta>
      )}

      <Grade colunas="lateral">
        <LateralEtapas r={r} etapaAberta={ei} aoMudarEtapa={irPara} />
        <div className="min-w-0">
          <CabecalhoSecao titulo={etapa.nome} sub={<span className={ESTILO_MONO}>etapa {ei + 1} de {f.etapas.length}</span>} />
          {etapa.blocos.map((b, bi) => {
            if (!condicaoOk(b.quando, r.valores)) return null;
            return (
              <div className="mb-4" key={bi}>
                <Rotulo className="mb-2">
                  {b.t}
                  {b.tag && <span className="ml-2 font-mono text-3xs font-normal normal-case tracking-normal">{b.tag}</span>}
                </Rotulo>
                {b.campos.map((c, ci) => {
                  if (c.t === "info") {
                    return (
                      <div className="mb-2.5 rounded-xl bg-accent-soft px-3.5 py-3 text-sm text-accent-ink" key={ci}
                        dangerouslySetInnerHTML={{ __html: c.html || c.l || "" }} />
                    );
                  }
                  const achatado: CampoAchatado = { ...c, n: c.n!, etapa, ei, bloco: b };
                  if (!visivel(achatado, r.valores)) return null;
                  return <Campo key={c.n} r={r} c={achatado} alterar={alterar} />;
                })}
              </div>
            );
          })}
          <div className="mt-3.5 flex justify-between gap-2.5">
            {ei > 0
              ? <Botao variante="fantasma" onClick={() => irPara(ei - 1)}>← {f.etapas[ei - 1].nome}</Botao>
              : <span />}
            {ei < f.etapas.length - 1
              ? <Botao onClick={() => irPara(ei + 1)}>{f.etapas[ei + 1].nome} →</Botao>
              : <Botao onClick={() => mudarSubAba("transferencia")}>Ir para transferência →</Botao>}
          </div>
        </div>
      </Grade>

      {versoesAbertas && <ModalVersoes rascunho={r} aoFechar={() => setVersoesAbertas(false)} />}
    </>
  );
}
