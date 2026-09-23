/* Exclusão de projeto com o modal de impacto (tarefas ligadas, formulário).
   Um hook para as telas que excluem: `pedir(p)` abre, `modal` desenha. */
import { useState } from "react";
import { ModalExclusao } from "../../components/ModalExclusao";
import { emLoteDeExclusao } from "../../store/mutacoes";
import { impactoExclusao, type ImpactoExclusao } from "../../store/vinculos";
import type { Projeto } from "../../types";

export function usarExclusaoProjeto(aoExcluir?: () => void) {
  const [pedido, setPedido] = useState<{ p: Projeto; impacto: ImpactoExclusao } | null>(null);
  return {
    pedir: (p: Projeto) => setPedido({ p, impacto: impactoExclusao("projeto", p.id) }),
    modal: pedido && (
      <ModalExclusao
        titulo="Projeto"
        nome={pedido.p.nome}
        impacto={pedido.impacto}
        aoFechar={() => setPedido(null)}
        aoExcluir={(destino) => {
          emLoteDeExclusao(() => pedido.impacto.excluir(destino));
          setPedido(null);
          aoExcluir?.();
        }}
      />
    ),
  };
}
