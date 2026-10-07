/* Pendências: o que falta em pessoas, artistas, projetos e editais abertos —
   com atalho "+ tarefa" que já nasce com o título da lacuna. CPF, RG e dados
   bancários não entram como pendência: pela regra r24, ficam fora da Central.
   Cada grupo é um Painel com uma Linha por lacuna. */
import type { ReactNode } from "react";
import { usarCentral } from "../../store/central";
import { abrirDetalhe } from "../../store/navegacao";
import { abrirEdicao, abrirNovo, type ChaveEntidade } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { Painel } from "../../components/ui/Painel";
import { Linha } from "../../components/ui/Linha";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { Dica } from "../../components/ui/Dica";
import { Vazio } from "../../components/ui/Vazio";
import { ESTILO_APAGADO, ESTILO_LINK } from "../../components/ui/estilos";
import { cx } from "../../utils/classes";
import { STATUS_PROJETO } from "../../types";

interface ItemPendente {
  id: string;
  nome: string;
  /** As lacunas encontradas. */
  lacunas: string[];
  /** O que fazer ao clicar (abrir ficha ou edição). */
  abrir: () => void;
}

function SecaoPendencias({ titulo, sub, itens }: { titulo: string; sub: string; itens: ItemPendente[] }) {
  if (!itens.length) {
    return <Painel titulo={titulo}><Vazio emLinha>✓ nada pendente aqui.</Vazio></Painel>;
  }
  const total = itens.reduce((n, x) => n + x.lacunas.length, 0);
  return (
    <Painel titulo={titulo} acoes={<Badge tom="st-prev">{total}</Badge>}>
      <Dica className="-mt-0.5 mb-2">{sub}</Dica>
      {itens.map((item) => (
        <div key={item.id}>
          <div className="mb-0.5 mt-3">
            <span className={cx(ESTILO_LINK, "text-sm")} onClick={item.abrir}>{item.nome}</span>{" "}
            <span className={ESTILO_APAGADO}>({item.lacunas.length})</span>
          </div>
          {item.lacunas.map((lacuna, i) => (
            <Linha
              key={i}
              direita={
                <Botao variante="fantasma" tamanho="mini"
                  onClick={(e) => { e.stopPropagation(); abrirNovo("tarefa", { titulo: item.nome + " — " + lacuna }); }}>
                  + tarefa
                </Botao>
              }
            >
              <div className="flex items-center gap-2.5">
                <Badge tom="st-prev" mini>falta</Badge>
                <span className="flex-1 cursor-pointer" onClick={item.abrir}>{lacuna}</span>
              </div>
            </Linha>
          ))}
        </div>
      ))}
    </Painel>
  );
}

export function Pendencias() {
  const { painel } = usarCentral();

  const artistas: ItemPendente[] = painel.artistas.map((a) => {
    const lacunas: string[] = [];
    (a.det?.pendencias || []).filter((x) => x.status !== "resolvida")
      .forEach((x) => lacunas.push((x.tipo === "perguntar" ? "Perguntar: " : "") + x.texto));
    if (a.det?.docs) a.det.docs.filter((d) => d.status !== "ok").forEach((d) => lacunas.push("Documento: " + d.nome));
    else if (!a.det) lacunas.push("Ficha ainda vazia");
    return { id: a.id, nome: a.nome, lacunas, abrir: () => abrirDetalhe("artista", a.id) };
  }).filter((x) => x.lacunas.length);

  const encerrado = new Set(STATUS_PROJETO.filter((s) => s.fim).map((s) => s.id));
  const projetos: ItemPendente[] = painel.projetos.filter((p) => !p.arquivado && !encerrado.has(p.status)).map((p) => ({
    id: p.id, nome: p.nome,
    lacunas: [
      ...(p.docs || []).filter((d) => !d.ok).map((d) => "Documento: " + d.nome),
      ...(p.producao || []).filter((x) => x.status !== "feito").map((x) => x.texto),
    ],
    abrir: () => abrirDetalhe("projeto", p.id),
  })).filter((x) => x.lacunas.length);

  const editais: ItemPendente[] = painel.editais.filter((e) => e.status === "open" || e.status === "cont").map((e) => {
    const lacunas: string[] = [];
    if (!e.objeto && !e.estimula) lacunas.push("Descrever o que financia");
    if (!e.comoInscrever) lacunas.push("Como se inscrever");
    if (!e.linkDrive) lacunas.push("Colar link da pasta no Drive");
    return { id: e.id, nome: e.nome, lacunas, abrir: () => abrirDetalhe("edital", e.id) };
  }).filter((x) => x.lacunas.length);

  const lacunasPessoa = (p: { nomeCompleto?: string; email?: string }, comEmail: boolean) => {
    const lacunas: string[] = [];
    if (!p.nomeCompleto) lacunas.push("Nome completo");
    if (comEmail && !p.email) lacunas.push("E-mail (convites de reunião)");
    return lacunas;
  };
  const editar = (chave: ChaveEntidade, id: string) => () => abrirEdicao(chave, id);
  const pessoas: ItemPendente[] = [
    ...painel.equipe.map((p) => ({ id: p.id, nome: p.nome + " (equipe)", lacunas: lacunasPessoa(p, true), abrir: editar("equipe", p.id) })),
    ...painel.elenco.map((p) => ({ id: p.id, nome: p.nome + " · " + (p.funcao || "elenco"), lacunas: lacunasPessoa(p, false), abrir: editar("elenco", p.id) })),
  ].filter((x) => x.lacunas.length);

  const total = [artistas, projetos, editais, pessoas]
    .reduce((n, arr) => n + arr.reduce((m, x) => m + x.lacunas.length, 0), 0);

  const sub: ReactNode = `atualiza sozinho conforme vocês preenchem: ${total} item(ns) no total. Clique pra abrir; "+ tarefa" cria a tarefa já com o título.`;

  return (
    <>
      <CabecalhoSecao titulo="Pendências — o que falta" sub={sub} />
      <SecaoPendencias titulo="Artistas" sub="pendências, perguntas para o artista e documentos do acervo" itens={artistas} />
      <SecaoPendencias titulo="Projetos" sub="documentos da inscrição e itens de produção (projetos em aberto)" itens={projetos} />
      <SecaoPendencias titulo="Editais abertos" sub="infos e link do Drive faltando" itens={editais} />
      <SecaoPendencias titulo="Pessoas" sub="nome completo e e-mail (CPF, RG e dados bancários ficam fora da Central, regra r24)" itens={pessoas} />
    </>
  );
}
