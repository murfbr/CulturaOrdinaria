/* Novo ou editar canal de comunicação do festival: nome, quem cuida (equipe),
   status, link e anotações. Os canais ficam no documento da página. */
import { useState } from "react";
import { toast } from "../../../components/Toast";
import { cadastrosDoTipo } from "../calculo";
import { alterarPagina } from "../dados";
import { STATUS_CANAL, type Base, type Canal, type StatusCanal } from "../tipos";
import { linkValido } from "../ui/Arquivo";
import { AreaTexto, Campo, Entrada, Selecao } from "../ui/Campo";
import { LINHA_INTEIRA, Modal } from "../ui/Modal";

interface Props { base: Base; id: string | null; aoFechar: () => void }

export function ModalCanal({ base, id, aoFechar }: Props) {
  const canais = base.pagina.canais || [];
  const existente = id ? canais.find((c) => c.id === id) : undefined;
  const [nome, setNome] = useState(existente?.nome || "");
  const [resp, setResp] = useState(existente?.responsavel || "");
  const [status, setStatus] = useState<StatusCanal>(existente?.status || "a_criar");
  const [url, setUrl] = useState(existente?.url || "");
  const [anotacoes, setAnotacoes] = useState(existente?.anotacoes || "");
  const equipe = cadastrosDoTipo(base, "equipe");

  function salvar() {
    const n = nome.trim();
    if (!n) { toast("Dê um nome ao canal."); return; }
    if (!linkValido(url)) { toast("O link precisa começar com http:// ou https://"); return; }
    const canal: Canal = { id: existente?.id || "canal_" + Math.random().toString(36).slice(2, 10), nome: n, responsavel: resp || null, status, url: url.trim(), anotacoes: anotacoes.trim(), ordem: existente?.ordem ?? canais.length };
    alterarPagina((p) => { const lista = (p.canais || []).filter((c) => c.id !== canal.id); p.canais = [...lista, canal].sort((a, b) => a.ordem - b.ordem); });
    aoFechar();
    toast("Canal salvo.");
  }

  function excluir() {
    alterarPagina((p) => { p.canais = (p.canais || []).filter((c) => c.id !== id); });
    aoFechar();
    toast("Canal excluído.");
  }

  return (
    <Modal titulo={id ? "Editar canal" : "Novo canal"} aoFechar={aoFechar} aoSalvar={salvar} aoExcluir={id ? excluir : undefined}>
      <Campo rotulo="Canal" className={LINHA_INTEIRA}><Entrada autoFocus required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Instagram, site, WhatsApp, imprensa…" /></Campo>
      <Campo rotulo="Quem cuida">
        <Selecao value={resp} onChange={(e) => setResp(e.target.value)}>
          <option value="">Sem responsável</option>
          {equipe.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </Selecao>
      </Campo>
      <Campo rotulo="Status">
        <Selecao value={status} onChange={(e) => setStatus(e.target.value as StatusCanal)}>
          {STATUS_CANAL.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
        </Selecao>
      </Campo>
      <Campo rotulo="Link" className={LINHA_INTEIRA}><Entrada type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></Campo>
      <Campo rotulo="Anotações (o que falta, quem faz, combinados)" className={LINHA_INTEIRA}><AreaTexto rows={3} value={anotacoes} onChange={(e) => setAnotacoes(e.target.value)} /></Campo>
    </Modal>
  );
}
