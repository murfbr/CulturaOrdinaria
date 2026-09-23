/* Pendências: o que falta em pessoas, artistas, projetos e editais abertos —
   com atalho "+ tarefa" que já nasce com o título da lacuna. CPF, RG e dados
   bancários não entram como pendência: pela regra r24, ficam fora da Central. */
import type { ReactNode } from "react";
import { usarCentral } from "../../store/central";
import { abrirDetalhe } from "../../store/navegacao";
import { abrirEdicao, abrirNovo, type ChaveEntidade } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
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
    return <div className="panel"><h4>{titulo}</h4><p className="muted" style={{ margin: 0 }}>✓ nada pendente aqui.</p></div>;
  }
  const total = itens.reduce((n, x) => n + x.lacunas.length, 0);
  return (
    <div className="panel">
      <h4>{titulo}<span className="act"><span className="badge st-prev">{total}</span></span></h4>
      <p className="hint" style={{ margin: "-2px 0 8px" }}>{sub}</p>
      {itens.map((item) => (
        <div key={item.id}>
          <div style={{ margin: "12px 0 2px" }}>
            <b style={{ fontSize: 13, cursor: "pointer", color: "var(--accent)" }} onClick={item.abrir}>{item.nome}</b>{" "}
            <span className="muted" style={{ fontSize: 11 }}>({item.lacunas.length})</span>
          </div>
          {item.lacunas.map((lacuna, i) => (
            <div className="docitem" key={i}>
              <span className="badge st-prev" style={{ fontSize: 9, flex: "0 0 auto" }}>falta</span>
              <span style={{ flex: 1, cursor: "pointer" }} onClick={item.abrir}>{lacuna}</span>
              <button className="btn ghost sm" style={{ padding: "2px 8px", fontSize: 10 }}
                onClick={(e) => { e.stopPropagation(); abrirNovo("tarefa", { titulo: item.nome + " — " + lacuna }); }}>
                + tarefa
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
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
