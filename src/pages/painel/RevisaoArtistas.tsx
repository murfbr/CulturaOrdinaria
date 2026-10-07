/* Revisão dos artistas: tudo o que está em aberto nas fichas, num lugar só.
   Correções propostas pela pesquisa (marcar como aplicada ou descartar),
   perguntas que só o artista responde (com "copiar perguntas" para mandar de
   uma vez) e pendências do coletivo, com resposta e "resolver" em série.
   Um Painel por artista; cada item é um ItemRevisao (componente local). */
import { useState, type ReactNode } from "react";
import { usarCentral } from "../../store/central";
import { abrirDetalhe } from "../../store/navegacao";
import { abrirNovo } from "../../store/edicao";
import { salvarRegistro } from "../../store/mutacoes";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../components/Filtros";
import { toast } from "../../components/Toast";
import { Pilulas } from "../../components/ui/Pilulas";
import { Painel } from "../../components/ui/Painel";
import { Botao } from "../../components/ui/Botao";
import { Rotulo } from "../../components/ui/Rotulo";
import { Vazio } from "../../components/ui/Vazio";
import { ESTILO_CONTROLE } from "../../components/ui/Campo";
import { ESTILO_APAGADO, ESTILO_AUXILIAR, ESTILO_LINK } from "../../components/ui/estilos";
import { cx } from "../../utils/classes";
import { clonar, comparar } from "../../utils";
import type { Artista, DetalheArtista } from "../../types";

type Vista = "propostas" | "perguntar" | "pendencia" | "resolvidas";

function alterarDet(a: Artista, mudar: (det: DetalheArtista) => void, rapido = true) {
  const copia = clonar(a);
  copia.det = copia.det || {};
  mudar(copia.det);
  salvarRegistro("artistas", copia, rapido);
}

async function copiar(texto: string, aviso: string) {
  try { await navigator.clipboard.writeText(texto); toast(aviso); }
  catch { toast("Não deu para copiar: selecione o texto e copie à mão"); }
}

/**
 * Um item da revisão: o conteúdo em coluna e, embaixo, a barra de ações —
 * `esquerda` encostada à esquerda, `direita` empurrada para o fim da linha.
 * `feita` apaga o item (já resolvido ou já aplicado).
 */
function ItemRevisao({ feita, esquerda, direita, children }: {
  feita?: boolean; esquerda?: ReactNode; direita?: ReactNode; children: ReactNode;
}) {
  return (
    <div className={cx("flex flex-col gap-1.5 border-t border-line py-2.5 first:border-t-0", feita && "opacity-70")}>
      {children}
      <div className="flex flex-wrap items-center gap-1.5">
        {esquerda}
        <span className="ml-auto flex flex-wrap gap-1.5">{direita}</span>
      </div>
    </div>
  );
}

/** "hoje: valor" / "passa a ser: valor" de uma correção proposta. */
function DePara({ rotulo, apagado, children }: { rotulo: string; apagado?: boolean; children: ReactNode }) {
  return (
    <div className={cx("flex items-baseline gap-2 text-sm", apagado && "text-muted")}>
      <Rotulo className="w-20 flex-none">{rotulo}</Rotulo>
      <span className="min-w-0">{children}</span>
    </div>
  );
}

export function RevisaoArtistas() {
  const { painel } = usarCentral();
  const [vista, setVista] = useState<Vista>("propostas");
  const [artistaId, setArtistaId] = useState("");
  const [busca, setBusca] = useState("");
  const termo = busca.toLowerCase();

  const artistas = [...painel.artistas].sort((a, b) => comparar(a.nome, b.nome));
  const conta = (a: Artista) => {
    const d = a.det || {};
    const pend = d.pendencias || [];
    return {
      propostas: (d.propostas || []).filter((x) => x.status === "aberta").length,
      perguntar: pend.filter((x) => x.tipo === "perguntar" && x.status !== "resolvida").length,
      pendencia: pend.filter((x) => x.tipo !== "perguntar" && x.status !== "resolvida").length,
      resolvidas: pend.filter((x) => x.status === "resolvida").length
        + (d.propostas || []).filter((x) => x.status !== "aberta").length,
    };
  };
  const total = artistas.reduce((t, a) => {
    const c = conta(a);
    return { propostas: t.propostas + c.propostas, perguntar: t.perguntar + c.perguntar, pendencia: t.pendencia + c.pendencia, resolvidas: t.resolvidas + c.resolvidas };
  }, { propostas: 0, perguntar: 0, pendencia: 0, resolvidas: 0 });

  const VISTAS: { id: Vista; rotulo: string }[] = [
    { id: "propostas", rotulo: `Correções propostas (${total.propostas})` },
    { id: "perguntar", rotulo: `Perguntas ao artista (${total.perguntar})` },
    { id: "pendencia", rotulo: `Pendências do coletivo (${total.pendencia})` },
    { id: "resolvidas", rotulo: `Já resolvidas (${total.resolvidas})` },
  ];

  const bate = (...t: (string | undefined)[]) => !termo || t.join(" ").toLowerCase().includes(termo);

  const blocos = artistas.filter((a) => !artistaId || a.id === artistaId).map((a) => {
    const d = a.det || {};
    let linhas: JSX.Element[] = [];

    if (vista === "propostas") {
      linhas = (d.propostas || []).map((x, i) => ({ ...x, i }))
        .filter((x) => x.status === "aberta" && bate(x.campo, x.de, x.para, x.motivo))
        .map((x) => (
          <ItemRevisao
            key={"p" + x.i}
            esquerda={
              <>
                <Botao variante="fantasma" tamanho="pequeno" onClick={() => copiar(x.para, "Texto novo copiado")}>copiar texto novo</Botao>
                <Botao variante="fantasma" tamanho="pequeno" onClick={() => abrirDetalhe("artista", a.id)}>abrir ficha</Botao>
              </>
            }
            direita={
              <>
                <Botao tamanho="pequeno" title="depois de editar o campo na ficha (ou se já estava certo)"
                  onClick={() => { alterarDet(a, (det) => { det.propostas![x.i].status = "aplicada"; }); toast("Marcada como aplicada"); }}>aplicada</Botao>
                <Botao variante="fantasma" tamanho="pequeno"
                  onClick={() => { alterarDet(a, (det) => { det.propostas![x.i].status = "descartada"; }); toast("Descartada"); }}>descartar</Botao>
              </>
            }
          >
            <div className="font-semibold">{x.campo}</div>
            <DePara rotulo="hoje" apagado>{x.de || "—"}</DePara>
            <DePara rotulo="passa a ser">{x.para}</DePara>
            {x.motivo && <div className={ESTILO_APAGADO}>{x.motivo}</div>}
          </ItemRevisao>
        ));
    } else if (vista === "resolvidas") {
      const pend = (d.pendencias || []).map((x, i) => ({ ...x, i })).filter((x) => x.status === "resolvida" && bate(x.texto, x.resposta));
      const props = (d.propostas || []).map((x, i) => ({ ...x, i })).filter((x) => x.status !== "aberta" && bate(x.campo, x.para));
      linhas = [
        ...pend.map((x) => (
          <ItemRevisao key={"r" + x.i} feita
            direita={<Botao variante="fantasma" tamanho="pequeno" onClick={() => alterarDet(a, (det) => { det.pendencias![x.i].status = "aberta"; })}>reabrir</Botao>}>
            <div>{x.tipo === "perguntar" ? "Pergunta: " : ""}{x.texto}</div>
            {x.resposta && <div className={ESTILO_AUXILIAR}>→ {x.resposta}</div>}
          </ItemRevisao>
        )),
        ...props.map((x) => (
          <ItemRevisao key={"rp" + x.i} feita
            direita={<Botao variante="fantasma" tamanho="pequeno" onClick={() => alterarDet(a, (det) => { det.propostas![x.i].status = "aberta"; })}>reabrir</Botao>}>
            <div><b>{x.campo}</b> <span className={ESTILO_AUXILIAR}>· {x.status}</span></div>
            <div className={ESTILO_AUXILIAR}>{x.para}</div>
          </ItemRevisao>
        )),
      ];
    } else {
      linhas = (d.pendencias || []).map((x, i) => ({ ...x, i }))
        .filter((x) => (vista === "perguntar" ? x.tipo === "perguntar" : x.tipo !== "perguntar") && x.status !== "resolvida" && bate(x.texto, x.resposta, x.fonte))
        .map((x) => (
          <ItemRevisao
            key={"q" + x.i}
            esquerda={<Botao variante="fantasma" tamanho="pequeno" onClick={() => abrirNovo("tarefa", { titulo: a.nome + ": " + x.texto.slice(0, 90) })}>+ tarefa</Botao>}
            direita={<Botao tamanho="pequeno" onClick={() => { alterarDet(a, (det) => { det.pendencias![x.i].status = "resolvida"; }); toast("Resolvida"); }}>resolver</Botao>}
          >
            <div>{x.texto}{x.fonte && <span className={ESTILO_AUXILIAR}> · {x.fonte}</span>}</div>
            <textarea rows={1} className={cx("w-full resize-y", ESTILO_CONTROLE)}
              placeholder={vista === "perguntar" ? "resposta do artista" : "como foi resolvido"}
              value={x.resposta || ""} onChange={(e) => alterarDet(a, (det) => { det.pendencias![x.i].resposta = e.target.value; }, false)} />
          </ItemRevisao>
        ));
    }
    if (!linhas.length) return null;
    const perguntas = (d.pendencias || []).filter((x) => x.tipo === "perguntar" && x.status !== "resolvida");
    return (
      <Painel
        key={a.id}
        titulo={<span className={ESTILO_LINK} onClick={() => abrirDetalhe("artista", a.id)}>{a.nome}</span>}
        sub={`· ${linhas.length}`}
        acoes={vista === "perguntar" && perguntas.length > 0 ? (
          <Botao variante="fantasma" tamanho="pequeno" onClick={() => copiar(
            "Oi! Para os editais, precisamos confirmar algumas coisas sobre " + a.nome + ":\n\n"
            + perguntas.map((x, k) => (k + 1) + ". " + x.texto).join("\n"),
            "Perguntas copiadas: é só colar na conversa com o artista",
          )}>copiar perguntas para mandar</Botao>
        ) : undefined}
      >
        <div>{linhas}</div>
      </Painel>
    );
  }).filter(Boolean);

  return (
    <>
      <CabecalhoSecao titulo="Revisão dos artistas" sub="tudo o que está em aberto nas fichas, num lugar só: responda, resolva ou descarte em série" />
      <Pilulas opcoes={VISTAS} ativa={vista} aoEscolher={(id) => setVista(id as Vista)} />
      <BarraFiltros mostrando={blocos.length} total={artistas.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar no texto…" />
        <SeletorFiltro valor={artistaId} aoMudar={setArtistaId} rotuloTodos="todos os artistas"
          opcoes={artistas.map((a) => ({ valor: a.id, rotulo: a.nome }))} />
      </BarraFiltros>
      {blocos}
      {!blocos.length && <Vazio>✓ Nada em aberto nesta vista.</Vazio>}
    </>
  );
}
