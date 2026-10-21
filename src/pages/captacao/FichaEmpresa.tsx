/* Ficha da empresa (Captação): dados, pessoas de contato, histórico de contato
   e as negociações dela. Na visão de uma captadora, a empresa em conversa só
   com outras mostra apenas o aviso. Excluir passa pelo impacto nos vínculos,
   como as outras fichas da Central. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { emLoteDeExclusao, porId, salvarRegistro } from "../../store/mutacoes";
import { fecharDetalhe } from "../../store/navegacao";
import { impactoExclusao, type ImpactoExclusao } from "../../store/vinculos";
import { ModalExclusao } from "../../components/ModalExclusao";
import { Botao } from "../../components/ui/Botao";
import { CabecalhoFicha } from "../../components/ui/CabecalhoFicha";
import { Dados, Dado } from "../../components/ui/Dados";
import { Grade } from "../../components/ui/Grade";
import { Painel } from "../../components/ui/Painel";
import { ESTILO_LINK } from "../../components/ui/estilos";
import type { Empresa } from "../../types";
import { clonar, url } from "../../utils";
import { nomeCaptadora, nomeProjeto } from "./apoio";
import { empresaFechada } from "./calculo";
import { HistoricoContato } from "./empresa/HistoricoContato";
import { ModalEmpresa } from "./empresa/ModalEmpresa";
import { NegociacoesDaEmpresa } from "./empresa/NegociacoesDaEmpresa";
import { Pessoas } from "./empresa/Pessoas";
import { usarComo } from "./visao";

export function FichaEmpresa({ id }: { id: string }) {
  const { painel } = usarCentral();
  const como = usarComo();
  const e = porId("empresas", id)!;
  const [editando, setEditando] = useState(false);
  const [impacto, setImpacto] = useState<ImpactoExclusao | null>(null);

  /** Toda edição das listas da empresa passa por aqui: clona, mexe, salva. */
  const alterar = (mudar: (empresa: Empresa) => void) => {
    const copia = clonar(e);
    mudar(copia);
    salvarRegistro("empresas", copia);
  };

  const fechada = empresaFechada(e.id, painel.negociacoes, como);
  const sub = [e.setor, e.cnpj ? "CNPJ " + e.cnpj : "", e.site ? <a key="site" href={url(e.site)} target="_blank" rel="noopener" className={ESTILO_LINK}>{e.site}</a> : ""]
    .filter(Boolean);

  return (
    <>
      <CabecalhoFicha
        rotuloVoltar="Voltar para Empresas"
        aoVoltar={fecharDetalhe}
        avatar={e.nome[0] || "?"}
        titulo={e.nome}
        sub={sub.length ? <span className="inline-flex flex-wrap items-center gap-1.5">{sub.map((s, i) => <span key={i}>{i > 0 && "· "}{s}</span>)}</span> : undefined}
        acoes={!fechada && (
          <>
            <Botao variante="fantasma" tamanho="pequeno" onClick={() => setEditando(true)}>Editar</Botao>
            <Botao variante="apagar" tamanho="pequeno" onClick={() => setImpacto(impactoExclusao("empresa", e.id))}>Excluir</Botao>
          </>
        )}
      />

      {fechada ? (
        <Painel alerta>
          Em conversa com <b>{nomeCaptadora(fechada.captadoraId)}</b> em {nomeProjeto(fechada.projetoId)}. Os contatos e os detalhes ficam com quem está na conversa.
        </Painel>
      ) : (
        <>
          <Grade colunas={2}>
            <div>
              <Painel titulo="Dados">
                <Dados>
                  <Dado rotulo="CNPJ">{e.cnpj || "—"}</Dado>
                  <Dado rotulo="Setor">{e.setor || "—"}</Dado>
                  <Dado rotulo="Site">{e.site ? <a href={url(e.site)} target="_blank" rel="noopener" className={ESTILO_LINK}>{e.site}</a> : "—"}</Dado>
                  <Dado rotulo="Observações" forte={false}>{e.obs || "—"}</Dado>
                </Dados>
              </Painel>
              <Pessoas empresa={e} alterar={alterar} />
            </div>
            <HistoricoContato empresa={e} alterar={alterar} />
          </Grade>
          <NegociacoesDaEmpresa empresa={e} />
        </>
      )}

      {editando && <ModalEmpresa registro={e} aoFechar={() => setEditando(false)} />}
      {impacto && (
        <ModalExclusao
          titulo="Empresa" nome={e.nome} impacto={impacto}
          aoFechar={() => setImpacto(null)}
          aoExcluir={(destino) => { emLoteDeExclusao(() => impacto.excluir(destino)); setImpacto(null); fecharDetalhe(); }}
        />
      )}
    </>
  );
}
