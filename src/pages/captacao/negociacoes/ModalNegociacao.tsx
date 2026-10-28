/* Modal da negociação (criar e editar): empresa, projeto, cota (filtrada pelo
   projeto; escolher preenche o valor vazio), quem capta, etapa, datas, próximo
   passo, reserva, motivo, comissão, recebido e paga. Avisa, sem bloquear,
   quando outra captadora está na mesma empresa e projeto ou há reserva.
   "Perdido" exige o motivo, e o motivo novo vira uma entrada no histórico
   de contato da empresa ao salvar. */
import { useState } from "react";
import { usarCentral } from "../../../store/central";
import { excluirRegistro, porId, salvarRegistro } from "../../../store/mutacoes";
import { emailSessao } from "../../../services/sessao";
import { AcoesModal, Modal, RodapeModal } from "../../../components/Modal";
import { BotaoExcluir } from "../../../components/BotaoExcluir";
import { toast } from "../../../components/Toast";
import { Botao } from "../../../components/ui/Botao";
import { AreaTexto, Campo, Entrada, Linhas, Marcacao, Selecao } from "../../../components/ui/Campo";
import { Dica } from "../../../components/ui/Dica";
import { hojeIso } from "../../../lib/prazos";
import { ETAPA_PERDIDO, type Negociacao } from "../../../types";
import { clonar, comparar, uid } from "../../../utils";
import { EQUIPE, dataBr, itensDaLista, nomeCaptadora, nomeItem, nomeProjeto } from "../apoio";
import { avisosDaNegociacao, brl, cotasDoProjeto, numero } from "../calculo";

interface Props {
  registro?: Negociacao;
  /** Valores iniciais de uma nova (projeto do filtro, captadora do "Ver como", empresa da ficha). */
  inicial?: Partial<Negociacao>;
  /** Veio da troca de etapa para "Perdido" na tabela: avisa, foca o motivo e só grava ao salvar. */
  pedirMotivo?: boolean;
  aoFechar: () => void;
}

const NOVA: Negociacao = {
  id: "", empresaId: "", projetoId: "", cotaId: "", captadoraId: "", valor: null, etapa: "prospeccao", ultimoContato: "",
  proximoPasso: "", dataProximo: "", reservaAte: "", motivoPerda: "", comissaoPct: null, valorRecebido: null, comissaoPaga: false, obs: "",
};

export function ModalNegociacao({ registro, inicial, pedirMotivo, aoFechar }: Props) {
  const { painel } = usarCentral();
  const [r, setR] = useState<Negociacao>(registro ? { ...registro } : { ...NOVA, ...inicial, id: uid("n") });
  const muda = <K extends keyof Negociacao>(k: K, v: Negociacao[K]) => setR((x) => ({ ...x, [k]: v }));
  const numeroOuNulo = (s: string) => (s === "" ? null : Number(s));

  const empresas = [...painel.empresas].sort((a, b) => comparar(a.nome, b.nome));
  const projetos = [...painel.portfolio].sort((a, b) => comparar(a.nome, b.nome));
  const captadoras = [...painel.captadoras].sort((a, b) => comparar(a.nome, b.nome));
  const cotas = cotasDoProjeto(painel.cotas, r.projetoId);
  const avisos = avisosDaNegociacao(r, painel.negociacoes, hojeIso(), nomeCaptadora, (id) => nomeItem("etapas", id), dataBr);

  function escolherCota(id: string) {
    const c = painel.cotas.find((x) => x.id === id);
    setR((x) => ({ ...x, cotaId: id, valor: x.valor == null && c && numero(c.valor) != null ? numero(c.valor) : x.valor }));
  }

  /** Perdida com motivo novo: a empresa ganha uma entrada no histórico de contato. */
  function anotarPerdaNaEmpresa() {
    const motivo = r.motivoPerda.trim();
    const jaAnotada = registro?.etapa === ETAPA_PERDIDO && (registro.motivoPerda || "").trim() === motivo;
    const empresa = porId("empresas", r.empresaId);
    if (jaAnotada || !empresa) return;
    const copia = clonar(empresa);
    copia.historico.push({ id: uid("h"), data: hojeIso(), quem: emailSessao(), texto: `Negociação perdida em ${nomeProjeto(r.projetoId)}: ${motivo}` });
    salvarRegistro("empresas", copia);
  }

  function salvar() {
    if (!r.empresaId) { toast("Escolha a empresa."); return; }
    if (!r.projetoId) { toast("Escolha o projeto."); return; }
    const perdida = r.etapa === ETAPA_PERDIDO;
    if (perdida && !r.motivoPerda.trim()) { toast("Diga o motivo da perda."); return; }
    if (!salvarRegistro("negociacoes", r)) return;
    if (perdida) anotarPerdaNaEmpresa();
    toast(registro ? "Salvo" : "Negociação cadastrada");
    aoFechar();
  }

  return (
    <Modal titulo={registro ? "Negociação" : "Nova negociação"} aoFechar={aoFechar} largo>
      {pedirMotivo && (
        <Dica emModal className="mb-3 text-ink">
          Marcando como perdida: diga o motivo no campo “Motivo, se perdido”. A etapa só muda ao salvar; cancelar deixa tudo como estava.
        </Dica>
      )}
      {avisos.length > 0 && (
        <div className="mb-3 rounded-md border border-gold bg-warn-soft p-2.5 text-sm">
          {avisos.map((a) => <div key={a}>{a}</div>)}
        </div>
      )}
      <Linhas colunas={2}>
        <Campo rotulo="Empresa">
          <Selecao value={r.empresaId} onChange={(e) => muda("empresaId", e.target.value)}>
            <option value="">Escolha a empresa</option>
            {empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </Selecao>
        </Campo>
        <Campo rotulo="Projeto">
          <Selecao value={r.projetoId} onChange={(e) => { muda("projetoId", e.target.value); muda("cotaId", ""); }}>
            <option value="">Escolha o projeto</option>
            {projetos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </Selecao>
        </Campo>
        <Campo rotulo="Cota">
          <Selecao value={r.cotaId} onChange={(e) => escolherCota(e.target.value)}>
            <option value="">Sem cota definida</option>
            {cotas.map((c) => <option key={c.id} value={c.id}>{c.nome}{numero(c.valor) != null ? " · " + brl(c.valor) : ""}</option>)}
          </Selecao>
        </Campo>
        <Campo rotulo="Valor (R$)">
          <Entrada type="number" min={0} value={r.valor ?? ""} onChange={(e) => muda("valor", numeroOuNulo(e.target.value))} />
        </Campo>
        <Campo rotulo="Quem capta">
          <Selecao value={r.captadoraId} onChange={(e) => muda("captadoraId", e.target.value)}>
            <option value="">{EQUIPE}</option>
            {captadoras.map((k) => <option key={k.id} value={k.id}>{k.nome}</option>)}
          </Selecao>
        </Campo>
        <Campo rotulo="Etapa">
          <Selecao value={r.etapa} onChange={(e) => muda("etapa", e.target.value)}>
            {itensDaLista("etapas").map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </Selecao>
        </Campo>
        <Campo rotulo="Último contato"><Entrada type="date" value={r.ultimoContato} onChange={(e) => muda("ultimoContato", e.target.value)} /></Campo>
        <Campo rotulo="Data do próximo passo"><Entrada type="date" value={r.dataProximo} onChange={(e) => muda("dataProximo", e.target.value)} /></Campo>
      </Linhas>
      <Campo rotulo="Próximo passo"><AreaTexto rows={2} value={r.proximoPasso} onChange={(e) => muda("proximoPasso", e.target.value)} /></Campo>
      <Linhas colunas={2}>
        <Campo rotulo="Reservado para quem capta até (exclusividade combinada)"><Entrada type="date" value={r.reservaAte} onChange={(e) => muda("reservaAte", e.target.value)} /></Campo>
        <Campo rotulo="Motivo, se perdido (ao salvar, entra no histórico da empresa)">
          <Entrada value={r.motivoPerda} autoFocus={pedirMotivo} onChange={(e) => muda("motivoPerda", e.target.value)} />
        </Campo>
        <Campo rotulo="Comissão desta negociação (%); em branco = a do projeto">
          <Entrada type="number" min={0} step="0.1" value={r.comissaoPct ?? ""} onChange={(e) => muda("comissaoPct", numeroOuNulo(e.target.value))} />
        </Campo>
        <Campo rotulo="Valor recebido (R$)">
          <Entrada type="number" min={0} value={r.valorRecebido ?? ""} onChange={(e) => muda("valorRecebido", numeroOuNulo(e.target.value))} />
        </Campo>
      </Linhas>
      <Marcacao marcado={r.comissaoPaga} aoMudar={(v) => muda("comissaoPaga", v)} className="mb-3">Comissão já paga</Marcacao>
      <Campo rotulo="Observações"><AreaTexto rows={2} value={r.obs} onChange={(e) => muda("obs", e.target.value)} /></Campo>
      <RodapeModal>
        {registro && <BotaoExcluir aoConfirmar={() => { excluirRegistro("negociacoes", registro.id); toast("Negociação excluída"); aoFechar(); }} />}
        <AcoesModal>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao onClick={salvar}>{registro ? "Salvar" : "Cadastrar"}</Botao>
        </AcoesModal>
      </RodapeModal>
    </Modal>
  );
}
