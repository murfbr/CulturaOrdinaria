/* Reaproveitar texto num campo: os textos já escritos com o mesmo conceito em
   outros projetos (mesmo artista primeiro), com o tamanho comparado ao limite
   deste campo. Usar substitui (ou acrescenta ao fim) e marca como rascunho. */
import { useState } from "react";
import { Modal, RodapeModal } from "../../../components/Modal";
import { copiarComAviso, toast } from "../../../components/Toast";
import { nomeCurto, editalDoProjeto } from "../../../lib/nomes";
import type { TextoMestre } from "../../../lib/textos";
import type { CampoAchatado } from "../../../lib/simulador/motor";
import { CONCEITOS_CAMPO, ROTULO_STATUS_CAMPO, type Rascunho } from "../../../types";
import type { Alterar } from "./tipos";

interface Props {
  c: CampoAchatado;
  r: Rascunho;
  conceito: string;
  sugestoes: TextoMestre[];
  artistaIds: string[];
  alterar: Alterar;
  aoFechar: () => void;
}

export function ModalReaproveitar({ c, r, conceito, sugestoes, artistaIds, alterar, aoFechar }: Props) {
  const [aberto, setAberto] = useState<number | null>(0);
  const atual = typeof r.valores[c.n] === "string" ? (r.valores[c.n] as string) : "";
  const rotuloConceito = CONCEITOS_CAMPO.find(([k]) => k === conceito)?.[1] || conceito;

  function usar(t: TextoMestre, modo: "trocar" | "somar") {
    alterar((copia) => {
      const antes = typeof copia.valores[c.n] === "string" ? (copia.valores[c.n] as string) : "";
      copia.valores[c.n] = modo === "somar" && antes.trim() ? antes.trimEnd() + "\n\n" + t.texto : t.texto;
      copia.status[c.n] = "rasc";
    }, true);
    toast(modo === "somar" ? "Texto acrescentado ao fim do campo" : "Texto colocado no campo (como rascunho)");
    aoFechar();
  }

  return (
    <Modal titulo={"Reaproveitar: " + rotuloConceito} aoFechar={aoFechar} largo>
      <p className="hint" style={{ marginTop: 0 }}>
        Textos já escritos para "{rotuloConceito}" em outros projetos. Este campo: <b>{c.l}</b>
        {c.max ? <> · limite de {c.max.toLocaleString("pt-BR")} caracteres</> : null}
        {atual.trim() ? <> · já tem {atual.length.toLocaleString("pt-BR")} caracteres escritos</> : null}.
        Adapte ao edital depois de usar: o texto entra como rascunho.
      </p>
      <div className="reap-lista">
        {sugestoes.map((t, i) => {
          const e = editalDoProjeto(t.projeto);
          const doArtista = (t.projeto?.artistaIds || []).some((a) => artistaIds.includes(a));
          const passa = c.max ? t.texto.length - c.max : 0;
          return (
            <div className={"reap-item" + (aberto === i ? " on" : "")} key={t.rascunhoId + t.campo}>
              <div className="reap-h" onClick={() => setAberto(aberto === i ? null : i)}>
                <span className="reap-t">
                  <b>{t.projeto?.nome || t.formNome}</b>
                  <span className="muted"> · {e ? nomeCurto(e) : t.formNome} · {t.campoRotulo}</span>
                </span>
                <span className="reap-tags">
                  {doArtista && <span className="chip chip-sim">mesmo artista</span>}
                  <span className="st" data-v={t.status}>{ROTULO_STATUS_CAMPO[t.status]}</span>
                  <span className={passa > 0 ? "badge ur-vencido" : "chip"}>
                    {t.texto.length.toLocaleString("pt-BR")} car.{passa > 0 ? ` (passa ${passa.toLocaleString("pt-BR")})` : ""}
                  </span>
                </span>
              </div>
              {aberto === i ? (
                <>
                  <div className="reap-texto">{t.texto}</div>
                  <div className="reap-acoes">
                    <button className="btn sm ghost" onClick={() => void copiarComAviso(t.texto, "Texto copiado")}>Copiar</button>
                    <span className="sp" />
                    {atual.trim() && <button className="btn sm ghost" onClick={() => usar(t, "somar")}>Acrescentar ao fim</button>}
                    <button className="btn sm" onClick={() => usar(t, "trocar")}>{atual.trim() ? "Substituir pelo texto" : "Usar este texto"}</button>
                  </div>
                </>
              ) : (
                <div className="reap-previa muted" onClick={() => setAberto(i)}>{t.texto.slice(0, 220)}{t.texto.length > 220 ? "…" : ""}</div>
              )}
            </div>
          );
        })}
      </div>
      <RodapeModal>
        <span className="sp"><button className="btn ghost" onClick={aoFechar}>Fechar</button></span>
      </RodapeModal>
    </Modal>
  );
}
