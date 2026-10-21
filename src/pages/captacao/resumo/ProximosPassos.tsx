/* Próximos passos com data nos próximos 7 dias (atrasados em vermelho) e
   quantos passos existem sem data. */
import { Dica } from "../../../components/ui/Dica";
import { Linha } from "../../../components/ui/Linha";
import { Painel } from "../../../components/ui/Painel";
import { Vazio } from "../../../components/ui/Vazio";
import type { Negociacao } from "../../../types";
import { dataCurta, nomeEmpresa } from "../apoio";
import { proximosPassos } from "../calculo";

export function ProximosPassos({ negociacoes, hoje, aoAbrir }: { negociacoes: Negociacao[]; hoje: string; aoAbrir: (n: Negociacao) => void }) {
  const { comData, semData, ate } = proximosPassos(negociacoes, hoje);
  return (
    <Painel titulo={"Próximos passos até " + dataCurta(ate)} sub="negociações abertas com passo datado">
      {comData.map((n) => (
        <Linha key={n.id} compacta aoClicar={() => aoAbrir(n)} direita={<span className={"tabular-nums " + (n.dataProximo < hoje ? "text-no font-semibold" : "text-muted")}>{dataCurta(n.dataProximo)}</span>}>
          <b>{nomeEmpresa(n.empresaId)}</b> <span className="text-muted">{n.proximoPasso}</span>
        </Linha>
      ))}
      {!comData.length && <Vazio emLinha>Nenhum próximo passo com data nesta semana.</Vazio>}
      {semData > 0 && <Dica className="mt-2">{semData} negociações têm próximo passo sem data. Dê uma data para que apareçam aqui.</Dica>}
    </Painel>
  );
}
