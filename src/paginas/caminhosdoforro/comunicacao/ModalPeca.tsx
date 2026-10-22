/* Nova ou editar peça de comunicação: nome, canal por onde sai, quem faz
   (equipe), prazo, status, link do arquivo e anotações. As peças ficam no
   documento da página, como os canais. */
import { useState } from "react";
import { toast } from "../../../components/Toast";
import { cadastrosDoTipo } from "../calculo";
import { alterarPagina } from "../dados";
import { STATUS_PECA, type Base, type Peca, type StatusPeca } from "../tipos";
import { linkValido } from "../ui/Arquivo";
import { AreaTexto, Campo, Entrada, Selecao } from "../ui/Campo";
import { LINHA_INTEIRA, Modal } from "../ui/Modal";

interface Props { base: Base; id: string | null; aoFechar: () => void }

export function ModalPeca({ base, id, aoFechar }: Props) {
  const pecas = base.pagina.pecas || [];
  const canais = [...(base.pagina.canais || [])].sort((a, b) => a.ordem - b.ordem);
  const existente = id ? pecas.find((c) => c.id === id) : undefined;
  const [nome, setNome] = useState(existente?.nome || "");
  const [canal, setCanal] = useState(existente?.canal || "");
  const [resp, setResp] = useState(existente?.responsavel || "");
  const [prazo, setPrazo] = useState(existente?.prazo || "");
  const [status, setStatus] = useState<StatusPeca>(existente?.status || "a_fazer");
  const [url, setUrl] = useState(existente?.url || "");
  const [anotacoes, setAnotacoes] = useState(existente?.anotacoes || "");
  const equipe = cadastrosDoTipo(base, "equipe");

  function salvar() {
    const n = nome.trim();
    if (!n) { toast("Dê um nome à peça."); return; }
    if (!linkValido(url)) { toast("O link precisa começar com http:// ou https://"); return; }
    const peca: Peca = {
      id: existente?.id || "peca_" + Math.random().toString(36).slice(2, 10), nome: n, canal: canal || null, responsavel: resp || null,
      prazo: prazo || null, status, url: url.trim(), anotacoes: anotacoes.trim(), ordem: existente?.ordem ?? pecas.length,
    };
    alterarPagina((p) => { p.pecas = [...(p.pecas || []).filter((c) => c.id !== peca.id), peca].sort((a, b) => a.ordem - b.ordem); });
    aoFechar();
    toast("Peça salva.");
  }

  function excluir() {
    alterarPagina((p) => { p.pecas = (p.pecas || []).filter((c) => c.id !== id); });
    aoFechar();
    toast("Peça excluída.");
  }

  return (
    <Modal titulo={id ? "Editar peça" : "Nova peça"} aoFechar={aoFechar} aoSalvar={salvar} aoExcluir={id ? excluir : undefined}>
      <Campo rotulo="Peça" className={LINHA_INTEIRA}><Entrada autoFocus required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Anúncio do line-up, kit da chamada aberta, release…" /></Campo>
      <Campo rotulo="Canal por onde sai">
        <Selecao value={canal} onChange={(e) => setCanal(e.target.value)}>
          <option value="">Vários ou a definir</option>
          {canais.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </Selecao>
      </Campo>
      <Campo rotulo="Quem faz">
        <Selecao value={resp} onChange={(e) => setResp(e.target.value)}>
          <option value="">Sem responsável</option>
          {equipe.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </Selecao>
      </Campo>
      <Campo rotulo="Prazo"><Entrada type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} /></Campo>
      <Campo rotulo="Status">
        <Selecao value={status} onChange={(e) => setStatus(e.target.value as StatusPeca)}>
          {STATUS_PECA.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
        </Selecao>
      </Campo>
      <Campo rotulo="Link do arquivo (Canva, Drive…)" className={LINHA_INTEIRA}><Entrada type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></Campo>
      <Campo rotulo="Anotações (texto, formato, o que falta)" className={LINHA_INTEIRA}><AreaTexto rows={3} value={anotacoes} onChange={(e) => setAnotacoes(e.target.value)} /></Campo>
    </Modal>
  );
}
