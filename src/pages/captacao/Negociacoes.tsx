/* Captação · Negociações: cada linha junta uma empresa, um projeto e quem
   capta. O funil filtra por etapa; a etapa se troca direto na tabela (perdido
   sem motivo abre o modal pedindo o motivo, e só grava ao salvar); clicar na
   linha abre o resto. Na visão de uma captadora, as negociações de outras
   mostram só "em conversa com X". */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { salvarRegistro } from "../../store/mutacoes";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../components/Filtros";
import { toast } from "../../components/Toast";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { ESTILO_CONTROLE_DISCRETO } from "../../components/ui/Campo";
import { Tabela, Th, Td, Tr } from "../../components/ui/Tabela";
import { Vazio } from "../../components/ui/Vazio";
import { hojeIso } from "../../lib/prazos";
import { ETAPA_PERDIDO, type Negociacao } from "../../types";
import { comparar } from "../../utils";
import { dataCurta, indiceEtapa, itensDaLista, nomeCaptadora, nomeCota, nomeEmpresa, nomeItem, nomeProjeto } from "./apoio";
import { brl, conflitos, normalizar, reservaAtiva, restrita } from "./calculo";
import { CartaoNegociacao } from "./negociacoes/CartaoNegociacao";
import { ModalNegociacao } from "./negociacoes/ModalNegociacao";
import { Funil } from "./resumo/Funil";
import { consumirEtapaPedida, usarComo } from "./visao";

export function Negociacoes() {
  const { painel } = usarCentral();
  const como = usarComo();
  const [fProj, setFProj] = useState("");
  const [fEtapa, setFEtapa] = useState(() => consumirEtapaPedida()); // o funil do Resumo chega com a etapa
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState<{ registro?: Negociacao; pedirMotivo?: boolean } | null>(null);
  const hoje = hojeIso();

  const q = normalizar(busca);
  const base = painel.negociacoes.filter((n) =>
    (!fProj || n.projetoId === fProj) && (!q || normalizar(nomeEmpresa(n.empresaId) + n.proximoPasso + n.obs).includes(q)));
  const linhas = (fEtapa ? base.filter((n) => n.etapa === fEtapa) : base).sort((a, b) =>
    Number(restrita(a, como)) - Number(restrita(b, como))
    || indiceEtapa(b.etapa) - indiceEtapa(a.etapa)
    || comparar(nomeEmpresa(a.empresaId), nomeEmpresa(b.empresaId)));

  function trocarEtapa(n: Negociacao, etapa: string) {
    // Perdido sem motivo: o modal pede o motivo e a etapa só grava ao salvar (cancelar não muda nada).
    if (etapa === ETAPA_PERDIDO && !n.motivoPerda) { setModal({ registro: { ...n, etapa }, pedirMotivo: true }); return; }
    if (!salvarRegistro("negociacoes", { ...n, etapa })) return;
    toast("Etapa: " + nomeItem("etapas", etapa));
  }

  return (
    <>
      <CabecalhoSecao titulo="Negociações" sub="empresa × projeto × quem capta — mude a etapa direto na tabela; clique na linha para o resto">
        <Botao onClick={() => setModal({})}>+ Negociação</Botao>
      </CabecalhoSecao>

      <Funil negociacoes={base} como={como} ativa={fEtapa} aoEscolher={(e) => setFEtapa((atual) => (atual === e ? "" : e))} />

      <BarraFiltros mostrando={linhas.length} total={painel.negociacoes.length}>
        <SeletorFiltro valor={fProj} aoMudar={setFProj} rotuloTodos="todos os projetos"
          opcoes={[...painel.portfolio].sort((a, b) => comparar(a.nome, b.nome)).map((p) => ({ valor: p.id, rotulo: p.nome }))} />
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar empresa ou anotação…" />
        {fEtapa && <Botao variante="quieto" tamanho="pequeno" onClick={() => setFEtapa("")}>mostrar todas as etapas</Botao>}
      </BarraFiltros>

      {/* Celular: um cartão por negociação; tela larga: a tabela. */}
      <div className="flex flex-col gap-2 md:hidden">
        {linhas.map((n) => (
          <CartaoNegociacao
            key={n.id} n={n} todas={painel.negociacoes} como={como} hoje={hoje}
            aoAbrir={() => setModal({ registro: n })} aoTrocarEtapa={(e) => trocarEtapa(n, e)}
          />
        ))}
        {!linhas.length && <Vazio>Nenhuma negociação aqui.</Vazio>}
      </div>

      <Tabela className="hidden md:block">
        <thead>
          <tr>
            <Th>Empresa</Th><Th>Projeto e cota</Th><Th numerico>Valor</Th><Th>Etapa</Th><Th>Quem capta</Th><Th>Último contato</Th><Th>Próximo passo</Th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((n) => {
            if (restrita(n, como)) {
              return (
                <Tr key={n.id}>
                  <Td><b>{nomeEmpresa(n.empresaId)}</b></Td>
                  <Td>{nomeProjeto(n.projetoId)}</Td>
                  <Td colSpan={5} className="text-muted">Em conversa com {nomeCaptadora(n.captadoraId)}</Td>
                </Tr>
              );
            }
            const cf = conflitos(n, painel.negociacoes);
            return (
              <Tr key={n.id} aoClicar={() => setModal({ registro: n })}>
                <Td>
                  <b>{nomeEmpresa(n.empresaId)}</b>
                  {(cf.length > 0 || reservaAtiva(n, hoje)) && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {cf.length > 0 && <Badge tom="aviso" mini>também com {cf.map((o) => nomeCaptadora(o.captadoraId)).join(", ")}</Badge>}
                      {reservaAtiva(n, hoje) && <Badge tom="info" mini>reservado até {dataCurta(n.reservaAte)}</Badge>}
                    </div>
                  )}
                </Td>
                <Td>{nomeProjeto(n.projetoId)}{n.cotaId && <div className="text-sm text-muted">{nomeCota(n.cotaId)}</div>}</Td>
                <Td numerico>{brl(n.valor)}</Td>
                <Td onClick={(e) => e.stopPropagation()}>
                  <select className={ESTILO_CONTROLE_DISCRETO + " text-sm"} value={n.etapa} aria-label="Etapa" onChange={(e) => trocarEtapa(n, e.target.value)}>
                    {itensDaLista("etapas").map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                  </select>
                </Td>
                <Td>{nomeCaptadora(n.captadoraId)}</Td>
                <Td className="tabular-nums">{dataCurta(n.ultimoContato) || "—"}</Td>
                <Td className="text-sm">{n.dataProximo && <b className="tabular-nums">{dataCurta(n.dataProximo)} · </b>}{n.proximoPasso || "—"}</Td>
              </Tr>
            );
          })}
          {!linhas.length && <tr><Td colSpan={7}><Vazio emLinha>Nenhuma negociação aqui.</Vazio></Td></tr>}
        </tbody>
      </Tabela>

      {modal && (
        <ModalNegociacao
          registro={modal.registro}
          pedirMotivo={modal.pedirMotivo}
          inicial={{ projetoId: fProj, captadoraId: como }}
          aoFechar={() => setModal(null)}
        />
      )}
    </>
  );
}
