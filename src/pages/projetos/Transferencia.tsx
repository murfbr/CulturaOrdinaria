/* Transferência: a hora de colar na plataforma oficial. Só os campos com
   conteúdo, na ordem do site, um de cada vez — copiar, marcar como colado
   e seguir para o próximo. Lista dos campos à esquerda (bolinha de status),
   o campo atual à direita. */
import { useState, type ReactNode } from "react";
import { salvarRascunho } from "../../store/mutacoes";
import { mudarSubAba } from "../../store/navegacao";
import { formularioDe } from "../../data";
import {
  campos, statusEfetivo, temValor, textoDe, visivel, type CampoAchatado,
} from "../../lib/simulador/motor";
import { copiarComAviso } from "../../components/Toast";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { Barra } from "../../components/ui/Barra";
import { Botao } from "../../components/ui/Botao";
import { Grade } from "../../components/ui/Grade";
import { Painel } from "../../components/ui/Painel";
import { Rotulo } from "../../components/ui/Rotulo";
import { Vazio } from "../../components/ui/Vazio";
import { ESTILO_MONO } from "../../components/ui/estilos";
import { clonar } from "../../utils";
import { cx } from "../../utils/classes";
import { ROTULO_STATUS_CAMPO, type Projeto, type Rascunho } from "../../types";

/** Campos preenchidos e visíveis, na ordem do formulário. */
const listaTransferivel = (r: Rascunho): CampoAchatado[] =>
  campos(r.form).filter((c) => c.t !== "orcresumo" && visivel(c, r.valores) && temValor(r.valores[c.n]));

/** Cor da bolinha de status na lista (rascunho é o padrão, dourado). */
const COR_PONTO: Record<string, string> = { col: "bg-ok", rev: "bg-fed" };

export function Transferencia({ projeto, rascunho: r }: { projeto: Projeto; rascunho: Rascunho }) {
  const f = formularioDe(r.form);
  const lista = listaTransferivel(r);
  const [indice, setIndice] = useState(0);
  const i = Math.min(indice, Math.max(0, lista.length - 1));
  const colados = lista.filter((c) => statusEfetivo(r, c) === "col").length;

  // A definição vem do banco; sem ela ainda, não há o que transferir.
  if (!f) return <Vazio>abrindo os formulários do banco…</Vazio>;

  async function copiarEMarcar() {
    const c = lista[i];
    await copiarComAviso(textoDe(c, r.valores[c.n], r), "Copiado e marcado como colado");
    const copia = clonar(r);
    copia.status[c.n] = "col";
    salvarRascunho(copia);
    // pula para o próximo campo ainda não colado
    const proximo = lista.findIndex((x, k) => k > i && statusEfetivo(copia, x) !== "col");
    if (proximo >= 0) setIndice(proximo);
  }

  const cabecalho = (
    <CabecalhoSecao grande titulo="Transferência"
      sub={<>Para a hora de colar na plataforma oficial. Só os campos com conteúdo, na ordem do site, um de cada vez.
        {f.origem === "documento" && " Este formulário foi mapeado dos documentos do edital: a ordem e os nomes podem variar na plataforma."}</>}>
      <Rotulo className="self-center">{projeto.nome} · {f.nome}</Rotulo>
      <Botao variante="fantasma" tamanho="pequeno" onClick={() => mudarSubAba("formulario")}>← Formulário</Botao>
    </CabecalhoSecao>
  );

  if (!lista.length) {
    return <>{cabecalho}<Vazio>Nenhum campo preenchido ainda neste rascunho.</Vazio></>;
  }

  const atual = lista[i];
  const valorTexto = textoDe(atual, r.valores[atual.n], r);
  const st = statusEfetivo(r, atual);

  // Lista lateral com separadores por etapa.
  const itensLista: ReactNode[] = [];
  let etapaAnterior = -1;
  lista.forEach((c, k) => {
    if (c.ei !== etapaAnterior) {
      etapaAnterior = c.ei;
      itensLista.push(<Rotulo key={"et" + c.ei} className="px-2 pb-1 pt-2">{c.etapa.nome}</Rotulo>);
    }
    const stc = statusEfetivo(r, c);
    itensLista.push(
      <button key={c.n} type="button" onClick={() => setIndice(k)}
        className={cx(
          "flex w-full cursor-pointer items-center gap-2 rounded-md border-0 px-2 py-[7px] text-left text-sm",
          k === i ? "bg-accent-soft font-semibold text-accent" : "bg-transparent text-muted hover:bg-bg-sunk hover:text-ink",
        )}>
        <i className={cx("size-2 flex-none rounded-full", COR_PONTO[stc] || "bg-gold")} />
        <span className="min-w-0 flex-1">{c.l}</span>
        <span className={ESTILO_MONO}>{c.ei + 1}</span>
      </button>,
    );
  });

  const instrucaoTipo =
    atual.t === "sel" || atual.t === "rad" || atual.t === "chk" ? " e marque a(s) opção(ões) abaixo"
      : atual.t === "anexo" || atual.t === "docs" ? " e faça o upload dos arquivos indicados"
        : atual.t === "rep" ? " e cadastre cada item da lista"
          : atual.t === "orc" ? ": cadastre item a item, na ordem abaixo" : "";

  return (
    <>
      {cabecalho}
      <div className="mb-3.5 flex items-center gap-3 text-sm text-muted tabular-nums">
        <span>{colados} de {lista.length} campos colados</span>
        <Barra className="max-w-[320px] flex-1" trechos={[{ pct: lista.length ? (100 * colados) / lista.length : 0, cor: "ok" }]} />
      </div>
      <Grade colunas="lateral" className="md:grid-cols-[300px_1fr]">
        <div className="max-h-[70vh] overflow-auto rounded-xl border border-line bg-card p-2 ">{itensLista}</div>
        <Painel>
          <Rotulo>{atual.etapa.nome} · {atual.bloco.t} · campo {i + 1} de {lista.length}</Rotulo>
          <h3 className="my-1 font-display text-4xl font-normal">{atual.l}</h3>
          <p className="m-0 mb-3.5 text-sm text-muted">
            {atual.n.startsWith("doc__")
              ? <>Na plataforma, procure o campo "{atual.l}"{instrucaoTipo}</>
              : <>Na plataforma, procure o campo <span className={ESTILO_MONO}>{atual.cod || atual.n}</span>{instrucaoTipo}</>}
          </p>
          <div className="max-w-[72ch] whitespace-pre-wrap break-words rounded-md border border-line bg-bg px-[18px] py-4 text-[15px] leading-[1.65]">{valorTexto}</div>
          {r.notas[atual.n] && (
            <div className="mt-2 flex max-w-[72ch] items-start gap-2 rounded-md bg-bg-sunk px-2.5 py-1.5 text-sm text-muted">
              <b className="flex-none text-ink">Nota:</b><span>{r.notas[atual.n]}</span>
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Botao onClick={() => void copiarEMarcar()}>Copiar e marcar como colado</Botao>
            <Botao variante="fantasma" onClick={() => void copiarComAviso(valorTexto)}>Só copiar</Botao>
            <Botao variante="quieto" onClick={() => setIndice(Math.min(lista.length - 1, i + 1))}>Pular →</Botao>
            <span className="ml-auto text-xs text-faint tabular-nums">{valorTexto.length} caracteres · {ROTULO_STATUS_CAMPO[st]}</span>
          </div>
        </Painel>
      </Grade>
    </>
  );
}
