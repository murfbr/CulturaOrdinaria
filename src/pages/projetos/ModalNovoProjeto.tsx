/* Novo projeto: escolher o formulário (um dos mapeados, que já traz o edital)
   ou Livre, os artistas (em lista, o primeiro é o principal), o responsável e
   o status de partida. Criado, o projeto abre direto. */
import { useMemo, useState } from "react";
import { Modal, RodapeModal } from "../../components/Modal";
import { toast } from "../../components/Toast";
import { usarCentral } from "../../store/central";
import { criarProjeto } from "../../store/mutacoes";
import { abrirProjeto } from "../../store/navegacao";
import { nomeCurto } from "../../lib/nomes";
import { ROTULO_STATUS_PROJETO, STATUS_EDITAL, STATUS_PROJETO, type Edital, type StatusProjeto } from "../../types";
import { comparar } from "../../utils";

interface OpcaoFormulario {
  formId: string;
  editalId: string;
  rotulo: string;
  grupo: string;
}

interface Props {
  aoFechar: () => void;
  /** Pré-seleção (ex. vindo da ficha de um edital ou de um artista). */
  editalId?: string;
  artistaId?: string;
}

export function ModalNovoProjeto({ aoFechar, editalId, artistaId }: Props) {
  const { painel, formularios } = usarCentral();

  // Uma opção por formulário mapeado, com o edital dele (Mobilidades tem dois).
  const opcoes = useMemo<OpcaoFormulario[]>(() => {
    const saida: OpcaoFormulario[] = [];
    const vistos = new Set<string>();
    const ordemStatus = (e: Edital) => STATUS_EDITAL[e.status]?.ordem ?? 9;
    const editais = [...painel.editais].sort((a, b) => ordemStatus(a) - ordemStatus(b) || comparar(nomeCurto(a), nomeCurto(b)));
    for (const e of editais) {
      const ids = [...new Set([...(e.formIds || []), ...(e.formId ? [e.formId] : [])])];
      for (const f of ids) {
        const def = formularios[f];
        if (!def) continue;
        vistos.add(f);
        saida.push({
          formId: f, editalId: e.id,
          rotulo: nomeCurto(e) + (ids.length > 1 ? " · " + def.nome : "") + (def.origem === "documento" ? " (dos documentos)" : ""),
          grupo: STATUS_EDITAL[e.status]?.rotulo || "Outros",
        });
      }
    }
    // Formulário no banco sem edital que aponte para ele.
    Object.values(formularios).filter((f) => !vistos.has(f.id)).sort((a, b) => comparar(a.nome, b.nome))
      .forEach((f) => saida.push({ formId: f.id, editalId: "", rotulo: f.nome, grupo: "Sem edital" }));
    return saida;
  }, [painel.editais, formularios]);

  const inicial = editalId ? opcoes.find((o) => o.editalId === editalId) : undefined;
  const [escolha, setEscolha] = useState(inicial ? inicial.formId + "|" + inicial.editalId : editalId ? "livre|" + editalId : "");
  const [editalLivre, setEditalLivre] = useState(editalId && !inicial ? editalId : "");
  const [nome, setNome] = useState("");
  const [artistas, setArtistas] = useState<string[]>(artistaId ? [artistaId] : []);
  const [resp, setResp] = useState("");
  const [status, setStatus] = useState<StatusProjeto>("prospeccao");

  const [formId, editalDaOpcao] = escolha ? escolha.split("|") : ["", ""];
  const livre = formId === "livre";
  const editalFinal = livre ? editalLivre : editalDaOpcao;
  const grupos = [...new Set(opcoes.map((o) => o.grupo))];
  const pronto = Boolean(escolha) && nome.trim().length > 0;
  // Já existe projeto em aberto com um destes artistas no mesmo edital? (evita o duplicado criado à mão)
  const parecidos = editalFinal
    ? painel.projetos.filter((p) => !p.arquivado && p.editalId === editalFinal && p.artistaIds.some((a) => artistas.includes(a)))
    : [];

  function alternarArtista(id: string) {
    setArtistas((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  }

  function criar() {
    const id = criarProjeto({ nome, artistaIds: artistas, editalId: editalFinal, formId, respId: resp, status });
    toast("Projeto criado");
    aoFechar();
    abrirProjeto(id);
  }

  return (
    <Modal titulo="Novo projeto" aoFechar={aoFechar} largo>
      <div className="field">
        <label htmlFor="np-form">Formulário (já traz o edital)</label>
        <select id="np-form" value={escolha} onChange={(e) => setEscolha(e.target.value)}>
          <option value="">escolha um dos formulários mapeados, ou Livre</option>
          <option value="livre|">Livre: sem formulário, só a seção Geral</option>
          {grupos.map((g) => (
            <optgroup key={g} label={g}>
              {opcoes.filter((o) => o.grupo === g).map((o) => (
                <option key={o.formId + o.editalId} value={o.formId + "|" + o.editalId}>{o.rotulo}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {livre && (
        <div className="field">
          <label htmlFor="np-edital">Edital (opcional, para projeto Livre)</label>
          <select id="np-edital" value={editalLivre} onChange={(e) => setEditalLivre(e.target.value)}>
            <option value="">sem edital</option>
            {[...painel.editais].sort((a, b) => comparar(nomeCurto(a), nomeCurto(b))).map((e) => (
              <option key={e.id} value={e.id}>{nomeCurto(e)}</option>
            ))}
          </select>
        </div>
      )}

      <div className="field">
        <label htmlFor="np-nome">Nome do projeto</label>
        <input id="np-nome" value={nome} placeholder="ex.: Circuito Blocos da Cidade · Rouanet 2027" onChange={(e) => setNome(e.target.value)} />
      </div>

      <div className="field">
        <label>Artistas {artistas.length > 0 && <span className="muted">(na ordem: o primeiro é o principal)</span>}</label>
        {artistas.length > 0 && (
          <div style={{ marginBottom: 6 }}>
            {artistas.map((id, i) => (
              <span className="chip" key={id}>{i + 1}. {painel.artistas.find((a) => a.id === id)?.nome}</span>
            ))}
          </div>
        )}
        <div className="multi-grade">
          {[...painel.artistas].sort((a, b) => comparar(a.nome, b.nome)).map((a) => (
            <label key={a.id}>
              <input type="checkbox" checked={artistas.includes(a.id)} onChange={() => alternarArtista(a.id)} />
              {a.nome}
            </label>
          ))}
        </div>
      </div>

      <div className="linha2">
        <div className="field">
          <label htmlFor="np-resp">Responsável</label>
          <select id="np-resp" value={resp} onChange={(e) => setResp(e.target.value)}>
            <option value="">ninguém ainda</option>
            {painel.equipe.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="np-status">Status de partida</label>
          <select id="np-status" value={status} onChange={(e) => setStatus(e.target.value as StatusProjeto)}>
            {STATUS_PROJETO.map((s) => <option key={s.id} value={s.id}>{s.rotulo}</option>)}
          </select>
        </div>
      </div>

      {parecidos.length > 0 && (
        <div className="aviso-duplicado">
          <b>Já existe projeto deste artista neste edital:</b>
          {parecidos.map((p) => (
            <div key={p.id}>
              <a className="lnk" onClick={() => { aoFechar(); abrirProjeto(p.id); }}>{p.nome}</a>
              <span className="muted"> · {ROTULO_STATUS_PROJETO[p.status] || p.status}</span>
            </div>
          ))}
          <span className="muted">Se for a mesma inscrição, abra o existente. Crie outro só se for uma proposta diferente.</span>
        </div>
      )}

      <RodapeModal>
        <span className="sp">
          <button className="btn ghost" onClick={aoFechar}>Cancelar</button>
          <button className="btn" disabled={!pronto} onClick={criar}>{parecidos.length ? "Criar mesmo assim" : "Criar projeto"}</button>
        </span>
      </RodapeModal>
    </Modal>
  );
}
