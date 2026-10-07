/* Banco de textos: tudo o que já foi escrito nos formulários dos projetos,
   agrupado por conceito (apresentação, justificativa, trajetória...). Para
   achar o melhor texto de partida antes de escrever um formulário novo.
   Um painel por conceito; cada texto é uma caixa que abre ao clicar. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { abrirProjeto } from "../../store/navegacao";
import { copiarComAviso } from "../../components/Toast";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../components/Filtros";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { Chip } from "../../components/ui/Chip";
import { Painel } from "../../components/ui/Painel";
import { Vazio } from "../../components/ui/Vazio";
import { editalDoProjeto, nomeCurto, nomesArtistas } from "../../lib/nomes";
import { indiceMemo, type TextoMestre } from "../../lib/textos";
import { CONCEITOS_CAMPO, ROTULO_STATUS_CAMPO } from "../../types";
import { comparar } from "../../utils";
import { cx } from "../../utils/classes";

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
      <CabecalhoSecao grande titulo="Banco de textos"
        sub={'Tudo o que já foi escrito nos formulários, por conceito. No formulário de um projeto, o botão "Reaproveitar" de cada campo mostra os textos do mesmo conceito, com o mesmo artista primeiro.'} />

      <BarraFiltros mostrando={lista.length} total={indice.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar no texto, projeto ou campo…" />
        <SeletorFiltro valor={conceito} aoMudar={setConceito} rotuloTodos="todos os conceitos"
          opcoes={CONCEITOS_CAMPO.filter(([k]) => indice.some((t) => t.conceito === k)).map(([k, r]) => ({ valor: k, rotulo: r }))} />
        <SeletorFiltro valor={artista} aoMudar={setArtista} rotuloTodos="todos os artistas"
          opcoes={[...painel.artistas].sort((a, b) => comparar(a.nome, b.nome)).map((a) => ({ valor: a.id, rotulo: a.nome }))} />
        <SeletorFiltro valor={status} aoMudar={setStatus} rotuloTodos="qualquer status"
          opcoes={[{ valor: "col", rotulo: "colado na plataforma" }, { valor: "rev", rotulo: "revisado" }, { valor: "rasc", rotulo: "rascunho" }]} />
      </BarraFiltros>

      {conceitos.map((k) => (
        <Painel key={k} titulo={rotulo(k)} sub={lista.filter((t) => t.conceito === k).length}>
          {lista.filter((t) => t.conceito === k).map((t) => {
            const e = editalDoProjeto(t.projeto);
            const on = aberto === chave(t);
            return (
              <div key={chave(t)} className={cx("mb-2 rounded-lg border bg-card p-2.5 last:mb-0", on ? "border-accent" : "border-line")}>
                <div className="flex cursor-pointer flex-wrap items-center justify-between gap-2" onClick={() => setAberto(on ? null : chave(t))}>
                  <span className="min-w-[200px] flex-1 text-sm">
                    <b>{t.projeto?.nome || t.formNome}</b>
                    <span className="text-muted"> · {t.projeto ? nomesArtistas(t.projeto) : ""} · {e ? nomeCurto(e) : t.formNome} · {t.campoRotulo}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge tom={t.status}>{ROTULO_STATUS_CAMPO[t.status]}</Badge>
                    <Chip>{t.texto.length.toLocaleString("pt-BR")} car.{t.limite ? " / " + t.limite.toLocaleString("pt-BR") : ""}</Chip>
                  </span>
                </div>
                {on ? (
                  <>
                    <div className="my-2 max-h-[34vh] overflow-auto whitespace-pre-wrap rounded-md bg-bg p-2 text-sm leading-normal">{t.texto}</div>
                    <div className="flex items-center gap-1.5">
                      <Botao variante="fantasma" tamanho="pequeno" onClick={() => void copiarComAviso(t.texto, "Texto copiado")}>Copiar</Botao>
                      <span className="flex-1" />
                      {t.projeto && <Botao variante="fantasma" tamanho="pequeno" onClick={() => abrirProjeto(t.projeto!.id, "formulario")}>Abrir no projeto →</Botao>}
                    </div>
                  </>
                ) : (
                  <div className="mt-1.5 cursor-pointer text-xs text-muted" onClick={() => setAberto(chave(t))}>{t.texto.slice(0, 200)}{t.texto.length > 200 ? "…" : ""}</div>
                )}
              </div>
            );
          })}
        </Painel>
      ))}
      {!lista.length && (
        <Vazio>
          {indice.length ? "Nenhum texto com esses filtros." : "Ainda não há textos escritos nos formulários dos projetos."}
        </Vazio>
      )}
    </>
  );
}
