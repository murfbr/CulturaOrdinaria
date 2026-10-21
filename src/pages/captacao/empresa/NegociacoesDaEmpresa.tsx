/* As negociações da empresa (as abordagens): projeto e cota, etapa, quem capta,
   valor e o motivo quando perdida. Clicar abre o modal; "+ Negociação" já vem
   com a empresa. Na visão de uma captadora, as de outras mostram só a conversa. */
import { useState } from "react";
import { usarCentral } from "../../../store/central";
import { Badge } from "../../../components/ui/Badge";
import { Botao } from "../../../components/ui/Botao";
import { Linha } from "../../../components/ui/Linha";
import { Painel } from "../../../components/ui/Painel";
import { Vazio } from "../../../components/ui/Vazio";
import type { Empresa, Negociacao } from "../../../types";
import { indiceEtapa, nomeCaptadora, nomeCota, nomeItem, nomeProjeto, tomEtapa } from "../apoio";
import { brl, restrita } from "../calculo";
import { ModalNegociacao } from "../negociacoes/ModalNegociacao";
import { usarComo } from "../visao";

export function NegociacoesDaEmpresa({ empresa }: { empresa: Empresa }) {
  const { painel } = usarCentral();
  const como = usarComo();
  const [modal, setModal] = useState<{ registro?: Negociacao } | null>(null);
  const negs = painel.negociacoes.filter((n) => n.empresaId === empresa.id).sort((a, b) => indiceEtapa(b.etapa) - indiceEtapa(a.etapa));

  return (
    <Painel titulo="Negociações" sub="as abordagens desta empresa, por projeto" acoes={<Botao variante="fantasma" tamanho="pequeno" onClick={() => setModal({})}>+ Negociação</Botao>}>
      {negs.map((n) => restrita(n, como) ? (
        <Linha key={n.id}>
          <b>{nomeProjeto(n.projetoId)}</b> <span className="text-muted">· em conversa com {nomeCaptadora(n.captadoraId)}</span>
        </Linha>
      ) : (
        <Linha key={n.id} aoClicar={() => setModal({ registro: n })} direita={<span className="tabular-nums">{brl(n.valor)}</span>}>
          <div className="flex flex-wrap items-center gap-1.5">
            <b>{nomeProjeto(n.projetoId)}</b>
            {n.cotaId && <span className="text-muted">· {nomeCota(n.cotaId)}</span>}
            <Badge tom={tomEtapa(n.etapa)}>{nomeItem("etapas", n.etapa)}</Badge>
            <span className="text-muted">{nomeCaptadora(n.captadoraId)}</span>
          </div>
          {n.motivoPerda && <div className="text-sm text-muted">Motivo: {n.motivoPerda}</div>}
          {n.proximoPasso && <div className="text-sm text-muted">Próximo passo: {n.proximoPasso}</div>}
        </Linha>
      ))}
      {!negs.length && <Vazio emLinha>Nenhuma abordagem registrada.</Vazio>}
      {modal && <ModalNegociacao registro={modal.registro} inicial={{ empresaId: empresa.id, captadoraId: como }} aoFechar={() => setModal(null)} />}
    </Painel>
  );
}
