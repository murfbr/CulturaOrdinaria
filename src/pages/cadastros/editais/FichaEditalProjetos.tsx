/* Sub-aba Projetos da ficha do edital: os projetos inscritos ou em preparo
   neste edital, com status e atalho para abrir, e o botão de novo projeto. */
import { Badge } from "../../../components/ui/Badge";
import { Botao } from "../../../components/ui/Botao";
import { Linha } from "../../../components/ui/Linha";
import { Painel } from "../../../components/ui/Painel";
import { Vazio } from "../../../components/ui/Vazio";
import { ESTILO_AUXILIAR } from "../../../components/ui/estilos";
import { nomesArtistas } from "../../../lib/nomes";
import { abrirProjeto } from "../../../store/navegacao";
import { ROTULO_STATUS_PROJETO, type Projeto } from "../../../types";

export function FichaEditalProjetos({ projetos, aoNovoProjeto }: { projetos: Projeto[]; aoNovoProjeto: () => void }) {
  return (
    <Painel titulo="Projetos neste edital" acoes={<Botao tamanho="pequeno" onClick={aoNovoProjeto}>+ Novo projeto</Botao>}>
      {projetos.map((p) => (
        <Linha key={p.id} aoClicar={() => abrirProjeto(p.id)}
          direita={<><Badge tom="tipo">{ROTULO_STATUS_PROJETO[p.status]}</Badge><span className="font-bold text-accent">→</span></>}>
          <b>{p.nome}</b>{p.arquivado && <span className="text-muted"> (arquivado)</span>}
          <div className={ESTILO_AUXILIAR}>{nomesArtistas(p)}{p.valorPedido ? " · " + p.valorPedido : ""}</div>
        </Linha>
      ))}
      {!projetos.length && <Vazio emLinha>Nenhum projeto neste edital ainda.</Vazio>}
    </Painel>
  );
}
