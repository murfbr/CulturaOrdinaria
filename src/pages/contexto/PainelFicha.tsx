/* Uma ficha inteira, editável em linha: posicionamento, argumentos (ou "o que
   o julgador pesa", nos editais), vocabulário, já-foi-dito e cuidados; embaixo,
   as regras do escopo e os julgamentos ligados. É a mesma ficha usada no
   Contexto e nas abas Contexto de Cadastros (artista, edital) e de Projetos:
   com `semCabecalho` fica solta dentro do painel de quem a embute (sem largura
   própria, sem padding lateral, sem margem de cima). */
import { Fragment, useState, type ReactNode } from "react";
import { usarCentral } from "../../store/central";
import { salvarFicha } from "../../store/mutacoes";
import { abrirFichaContexto, abrirJulgamento } from "../../store/navegacao";
import { entidades, fichaDe, julgamentosOrdenados, nomeDaEntidade, regrasDe } from "../../lib/contexto/consultas";
import { montarBloco } from "../../lib/contexto/bloco";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { copiarComAviso, toast } from "../../components/Toast";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { AreaTexto } from "../../components/ui/Campo";
import { Dado, Dados } from "../../components/ui/Dados";
import { Linha } from "../../components/ui/Linha";
import { Painel } from "../../components/ui/Painel";
import { Vazio } from "../../components/ui/Vazio";
import { ESTILO_AUXILIAR, ESTILO_LINK, ESTILO_MONO } from "../../components/ui/estilos";
import { ItemMarcado } from "./ItemMarcado";
import { LinhaRegra } from "./LinhaRegra";
import type { PedidoModalRegra } from "./ModalRegra";
import { clonar } from "../../utils";
import { cx } from "../../utils/classes";
import { ROTULO_RESULTADO, type Ficha } from "../../types";

type ChaveBloco = "posicionamento" | "argumentos" | "julgador" | "vocabulario" | "usados" | "cuidados";

export function PainelFicha({ id, aoAbrirRegra, semCabecalho }: {
  id: string; aoAbrirRegra: (p: PedidoModalRegra) => void; semCabecalho?: boolean;
}) {
  const { fichas, regras, julgamentos } = usarCentral();
  void fichas; void regras; void julgamentos; // re-render quando qualquer um mudar
  const [editando, setEditando] = useState<ChaveBloco | null>(null);
  const [textoEdicao, setTextoEdicao] = useState("");

  const f = fichaDe(id);
  const regrasDoEscopo = regrasDe(f.tipo, f.id);
  const julgamentosLigados = julgamentosOrdenados().filter((j) =>
    j.edital === f.id || j.projeto === f.id ||
    (f.tipo === "artista" && entidades("projeto").some((p) => p.id === j.projeto && (p.artistas || []).includes(f.id))));

  /** Valor do bloco como texto editável (um item por linha; pares com " | "). */
  const valorEditavel = (chave: ChaveBloco): string => {
    if (chave === "posicionamento") return f.posicionamento || "";
    if (chave === "cuidados") return f.cuidados || "";
    if (chave === "argumentos") return (f.argumentos || []).join("\n");
    if (chave === "julgador") return (f.julgador || []).join("\n");
    if (chave === "vocabulario") return (f.vocabulario || []).map((v) => v.usar + " | " + v.evitar).join("\n");
    return (f.usados || []).map((u) => u.texto + " | " + u.onde + " | " + u.quando).join("\n");
  };

  const dicas: Record<ChaveBloco, string> = {
    posicionamento: "duas linhas", cuidados: "texto livre", argumentos: "um por linha",
    julgador: "um por linha", vocabulario: "por linha: usar | evitar", usados: "por linha: texto | onde | quando",
  };

  function salvarBloco(chave: ChaveBloco) {
    const linhas = textoEdicao.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    const doc: Ficha = {
      id: f.id, tipo: f.tipo,
      posicionamento: f.posicionamento, argumentos: f.argumentos || [], julgador: f.julgador || [],
      vocabulario: f.vocabulario || [], usados: f.usados || [], cuidados: f.cuidados || "",
    };
    if (chave === "posicionamento" || chave === "cuidados") doc[chave] = textoEdicao.trim();
    else if (chave === "argumentos" || chave === "julgador") doc[chave] = linhas;
    else if (chave === "vocabulario") doc.vocabulario = linhas.map((l) => {
      const p = l.split("|").map((x) => x.trim());
      return { usar: p[0] || "", evitar: p[1] || "" };
    });
    else doc.usados = linhas.map((l) => {
      const p = l.split("|").map((x) => x.trim());
      return { texto: p[0] || "", onde: p[1] || "", quando: p[2] || "" };
    });
    salvarFicha(doc);
    setEditando(null);
    toast("Ficha salva");
  }

  // Função (não componente) para o textarea manter identidade — e o foco — entre renders.
  const bloco = (chave: ChaveBloco, titulo: string, pergunta: string, conteudo: ReactNode) => {
    const emEdicao = editando === chave;
    return (
      <Painel
        titulo={titulo}
        sub={<span className="italic">{pergunta}</span>}
        acoes={!emEdicao && (
          <Botao variante="quieto" tamanho="pequeno" onClick={() => { setEditando(chave); setTextoEdicao(valorEditavel(chave)); }}>
            editar
          </Botao>
        )}
      >
        {emEdicao ? (
          <>
            <AreaTexto rows={chave === "posicionamento" || chave === "cuidados" ? 4 : 6}
              value={textoEdicao} onChange={(e) => setTextoEdicao(e.target.value)} autoFocus />
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-faint">
              <span className="mr-auto">{dicas[chave]}</span>
              <Botao tamanho="pequeno" onClick={() => salvarBloco(chave)}>Salvar</Botao>
              <Botao variante="quieto" tamanho="pequeno" onClick={() => setEditando(null)}>Cancelar</Botao>
            </div>
          </>
        ) : conteudo}
      </Painel>
    );
  };

  const Itens = ({ itens }: { itens: string[] }) =>
    itens.length
      ? <div className="max-w-texto">{itens.map((a, i) => <ItemMarcado marca={i + 1} key={i}>{a}</ItemMarcado>)}</div>
      : <Vazio emLinha>nada registrado ainda</Vazio>;

  const copiar = () => void copiarComAviso(montarBloco([f.id], true), "Ficha copiada em texto para colar numa conversa");
  const idMono = <code className={ESTILO_MONO}>{f.id}</code>;

  return (
  <div>
    {!semCabecalho ? (
      <CabecalhoSecao
        grande
        titulo={f.nome}
        sub={<>
          {f.tipo} · no Painel: {idMono}
          {f.artista && <> · de <a href="#" className={ESTILO_LINK} onClick={(e) => { e.preventDefault(); abrirFichaContexto(f.artista!); }}>{nomeDaEntidade(f.artista)}</a></>}
        </>}
      >
        <Botao variante="fantasma" tamanho="pequeno" onClick={copiar}>Copiar para o Claude</Botao>
      </CabecalhoSecao>
    ) : (
      <div className="mb-3.5 flex flex-wrap items-center gap-3">
        <span className={ESTILO_AUXILIAR}>ficha de escrita · {idMono} · a mesma do ambiente Contexto</span>
        <span className="ml-auto flex flex-wrap gap-2">
          <Botao variante="fantasma" tamanho="pequeno" onClick={copiar}>Copiar para o Claude</Botao>
          <Botao variante="quieto" tamanho="pequeno" onClick={() => abrirFichaContexto(f.id)}>Abrir no Contexto</Botao>
        </span>
      </div>
    )}
    <p className={cx("m-0 mb-4 max-w-texto", ESTILO_AUXILIAR)}>Só conhecimento de escrita. Os fatos (bio, docs, prazos) estão no cadastro {f.id}.</p>

    {bloco("posicionamento", "Posicionamento", "como abrir um parágrafo sobre isso",
      f.posicionamento ? <p className="m-0 max-w-texto whitespace-pre-wrap">{f.posicionamento}</p> : <Vazio emLinha>nada registrado ainda</Vazio>)}

    {f.tipo === "edital"
      ? bloco("julgador", "O que o julgador pesa", "lido dos critérios e dos pareceres, não do objeto",
        <Itens itens={f.julgador || []} />)
      : bloco("argumentos", "Argumentos fortes", "os pontos que sempre convencem",
        <Itens itens={f.argumentos || []} />)}

    {bloco("vocabulario", "Vocabulário", "usar assim, e não assim",
      (f.vocabulario || []).length ? (
        <div className="grid max-w-texto gap-x-gutter gap-y-1.5 text-base md:grid-cols-2">
          {f.vocabulario.map((v, i) => (
            <Fragment key={i}>
              <span className="text-ok">{v.usar}</span>
              <span className="text-accent line-through">{v.evitar}</span>
            </Fragment>
          ))}
        </div>
      ) : <Vazio emLinha>nada registrado ainda</Vazio>)}

    {bloco("usados", "Já foi dito, e onde", "para não repetir o mesmo texto em dois lugares",
      (f.usados || []).length ? (
        <Dados>
          {f.usados.map((u, i) => (
            <Dado key={i} rotulo={<><span className={ESTILO_AUXILIAR}>{u.onde}</span><br />{u.quando}</>}>{u.texto}</Dado>
          ))}
        </Dados>
      ) : <Vazio emLinha>nada registrado ainda</Vazio>)}

    {bloco("cuidados", "Cuidados", "o que checar antes de escrever",
      f.cuidados ? <p className="m-0 max-w-texto whitespace-pre-wrap">{f.cuidados}</p> : <Vazio emLinha>nenhum</Vazio>)}

    <Painel
      titulo="Regras deste escopo"
      sub={<span className="italic">{regrasDoEscopo.length} regra{regrasDoEscopo.length === 1 ? "" : "s"}; as gerais valem sempre</span>}
      acoes={<Botao variante="quieto" tamanho="pequeno" onClick={() => aoAbrirRegra({ contexto: { tipo: f.tipo, id: f.id } })}>+ regra</Botao>}
    >
      {regrasDoEscopo.length
        ? regrasDoEscopo.map((r) => <LinhaRegra r={r} key={r.id} aoEditar={() => aoAbrirRegra({ regra: clonar(r) })} />)
        : <Vazio emLinha>nenhuma regra específica</Vazio>}
    </Painel>

    <Painel titulo="Julgamentos ligados" sub={<span className="italic">o que já foi avaliado envolvendo esta ficha</span>}>
      {julgamentosLigados.length ? julgamentosLigados.map((j) => (
        <Linha key={j.id} direita={<span className="text-xs text-faint">{j.ano}</span>}>
          <div className="flex flex-wrap items-center gap-2.5 text-base">
            <Badge caixaAlta tom={j.resultado}>{ROTULO_RESULTADO[j.resultado] || j.resultado}</Badge>
            <a href="#" className={ESTILO_LINK} onClick={(e) => { e.preventDefault(); abrirJulgamento(j.id); }}>
              {nomeDaEntidade(j.edital)}{j.projeto ? " · " + nomeDaEntidade(j.projeto) : ""}
            </a>
          </div>
        </Linha>
      )) : <Vazio emLinha>nenhum</Vazio>}
    </Painel>
  </div>
  );
}
