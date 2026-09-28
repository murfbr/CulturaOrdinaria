/* Banco de textos: tudo o que já foi escrito nos formulários dos projetos,
   agrupado por conceito (apresentação, justificativa, trajetória...). Para
   achar o melhor texto de partida antes de escrever um formulário novo. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { abrirProjeto } from "../../store/navegacao";
import { copiarComAviso } from "../../components/Toast";
import { editalDoProjeto, nomeCurto, nomesArtistas } from "../../lib/nomes";
import { indiceMemo, type TextoMestre } from "../../lib/textos";
import { CONCEITOS_CAMPO, ROTULO_STATUS_CAMPO } from "../../types";
import { comparar } from "../../utils";

export function BancoTextos() {
  const { painel, rascunhos, formularios } = usarCentral();
  const [conceito, setConceito] = useState("");
  const [artista, setArtista] = useState("");
  const [status, setStatus] = useState("");
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState<string | null>(null);

  const indice = indiceMemo(painel, rascunhos, formularios);
  const termo = busca.trim().toLowerCase();
  const lista = indice.filter((t) =>
    (!conceito || t.conceito === conceito)
    && (!artista || (t.projeto?.artistaIds || []).includes(artista))
    && (!status || t.status === status)
    && (!termo || [t.texto, t.projeto?.nome, t.campoRotulo].join(" ").toLowerCase().includes(termo)));

  const rotulo = (k: string) => CONCEITOS_CAMPO.find(([x]) => x === k)?.[1] || k;
  const conceitos = CONCEITOS_CAMPO.map(([k]) => k).filter((k) => lista.some((t) => t.conceito === k));
  const chave = (t: TextoMestre) => t.rascunhoId + "/" + t.campo;

  return (
    <>
      <div className="shead">
        <div>
          <h2>Banco de textos</h2>
          <p className="sub">
            Tudo o que já foi escrito nos formulários, por conceito. No formulário de um projeto, o botão
            "Reaproveitar" de cada campo mostra os textos do mesmo conceito, com o mesmo artista primeiro.
          </p>
        </div>
      </div>

      <div className="filtros-sim">
        <input type="search" value={busca} placeholder="buscar no texto, projeto ou campo…" onChange={(e) => setBusca(e.target.value)} />
        <select value={conceito} onChange={(e) => setConceito(e.target.value)}>
          <option value="">todos os conceitos</option>
          {CONCEITOS_CAMPO.filter(([k]) => indice.some((t) => t.conceito === k)).map(([k, r]) => <option key={k} value={k}>{r}</option>)}
        </select>
        <select value={artista} onChange={(e) => setArtista(e.target.value)}>
          <option value="">todos os artistas</option>
          {[...painel.artistas].sort((a, b) => comparar(a.nome, b.nome)).map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">qualquer status</option>
          <option value="col">colado na plataforma</option>
          <option value="rev">revisado</option>
          <option value="rasc">rascunho</option>
        </select>
        <span className="n">{lista.length} texto(s)</span>
      </div>

      {conceitos.map((k) => (
        <div className="grupo textos-grupo" key={k}>
          <div className="grupo-h"><h3>{rotulo(k)}</h3><span className="n">{lista.filter((t) => t.conceito === k).length}</span></div>
          {lista.filter((t) => t.conceito === k).map((t) => {
            const e = editalDoProjeto(t.projeto);
            const on = aberto === chave(t);
            return (
              <div className={"reap-item" + (on ? " on" : "")} key={chave(t)} style={{ marginBottom: 8 }}>
                <div className="reap-h" onClick={() => setAberto(on ? null : chave(t))}>
                  <span className="reap-t">
                    <b>{t.projeto?.nome || t.formNome}</b>
                    <span className="muted"> · {t.projeto ? nomesArtistas(t.projeto) : ""} · {e ? nomeCurto(e) : t.formNome} · {t.campoRotulo}</span>
                  </span>
                  <span className="reap-tags">
                    <span className="st" data-v={t.status}>{ROTULO_STATUS_CAMPO[t.status]}</span>
                    <span className="chip">{t.texto.length.toLocaleString("pt-BR")} car.{t.limite ? " / " + t.limite.toLocaleString("pt-BR") : ""}</span>
                  </span>
                </div>
                {on ? (
                  <>
                    <div className="reap-texto">{t.texto}</div>
                    <div className="reap-acoes">
                      <button className="btn sm ghost" onClick={() => void copiarComAviso(t.texto, "Texto copiado")}>Copiar</button>
                      <span className="sp" />
                      {t.projeto && <button className="btn sm" onClick={() => abrirProjeto(t.projeto!.id, "formulario")}>Abrir no projeto →</button>}
                    </div>
                  </>
                ) : (
                  <div className="reap-previa muted" onClick={() => setAberto(chave(t))}>{t.texto.slice(0, 200)}{t.texto.length > 200 ? "…" : ""}</div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      {!lista.length && (
        <div className="vazio-msg">
          {indice.length ? "Nenhum texto com esses filtros." : "Ainda não há textos escritos nos formulários dos projetos."}
        </div>
      )}
    </>
  );
}
