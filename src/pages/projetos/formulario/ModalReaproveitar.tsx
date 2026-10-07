/* Reaproveitar texto num campo: os textos já escritos com o mesmo conceito em
   outros projetos (mesmo artista primeiro), com o tamanho comparado ao limite
   deste campo. Usar substitui (ou acrescenta ao fim) e marca como rascunho. */
import { useState } from "react";
import { AcoesModal, Modal, RodapeModal } from "../../../components/Modal";
import { copiarComAviso, toast } from "../../../components/Toast";
import { Badge } from "../../../components/ui/Badge";
import { Botao } from "../../../components/ui/Botao";
import { Chip } from "../../../components/ui/Chip";
import { Dica } from "../../../components/ui/Dica";
import { cx } from "../../../utils/classes";
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
      <Dica emModal className="mb-3">
        Textos já escritos para "{rotuloConceito}" em outros projetos. Este campo: <b>{c.l}</b>
        {c.max ? <> · limite de {c.max.toLocaleString("pt-BR")} caracteres</> : null}
        {atual.trim() ? <> · já tem {atual.length.toLocaleString("pt-BR")} caracteres escritos</> : null}.
        Adapte ao edital depois de usar: o texto entra como rascunho.
      </Dica>
      <div className="my-1.5 flex max-h-[60vh] flex-col gap-2 overflow-auto">
        {sugestoes.map((t, i) => {
          const e = editalDoProjeto(t.projeto);
          const doArtista = (t.projeto?.artistaIds || []).some((a) => artistaIds.includes(a));
          const passa = c.max ? t.texto.length - c.max : 0;
          const tamanho = t.texto.length.toLocaleString("pt-BR") + " car." + (passa > 0 ? ` (passa ${passa.toLocaleString("pt-BR")})` : "");
          return (
            <div className={cx("rounded-lg border bg-card px-2.5 py-2", aberto === i ? "border-accent" : "border-line")} key={t.rascunhoId + t.campo}>
              <div className="flex flex-wrap cursor-pointer items-center justify-between gap-2" onClick={() => setAberto(aberto === i ? null : i)}>
                <span className="min-w-[200px] flex-1 text-sm">
                  <b>{t.projeto?.nome || t.formNome}</b>
                  <span className="text-muted"> · {e ? nomeCurto(e) : t.formNome} · {t.campoRotulo}</span>
                </span>
                <span className="flex flex-wrap items-center gap-1">
                  {doArtista && <Badge tom="ok">mesmo artista</Badge>}
                  <Badge tom={t.status}>{ROTULO_STATUS_CAMPO[t.status]}</Badge>
                  {passa > 0 ? <Badge tom="ur-vencido">{tamanho}</Badge> : <Chip>{tamanho}</Chip>}
                </span>
              </div>
              {aberto === i ? (
                <>
                  <div className="my-2 max-h-[34vh] overflow-auto whitespace-pre-wrap rounded-md bg-bg p-2 text-sm leading-normal">{t.texto}</div>
                  <div className="flex items-center gap-1.5">
                    <Botao variante="fantasma" tamanho="pequeno" onClick={() => void copiarComAviso(t.texto, "Texto copiado")}>Copiar</Botao>
                    <span className="flex-1" />
                    {atual.trim() && <Botao variante="fantasma" tamanho="pequeno" onClick={() => usar(t, "somar")}>Acrescentar ao fim</Botao>}
                    <Botao tamanho="pequeno" onClick={() => usar(t, "trocar")}>{atual.trim() ? "Substituir pelo texto" : "Usar este texto"}</Botao>
                  </div>
                </>
              ) : (
                <div className="mt-1 cursor-pointer text-sm text-muted" onClick={() => setAberto(i)}>{t.texto.slice(0, 220)}{t.texto.length > 220 ? "…" : ""}</div>
              )}
            </div>
          );
        })}
      </div>
      <RodapeModal>
        <AcoesModal><Botao variante="fantasma" onClick={aoFechar}>Fechar</Botao></AcoesModal>
      </RodapeModal>
    </Modal>
  );
}
