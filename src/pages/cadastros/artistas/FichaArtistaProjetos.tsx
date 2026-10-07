/* Sub-aba Projetos da ficha do artista: os projetos em que ele entra, com o
   status e o atalho para abrir cada um, e o botão de novo projeto. */
import { Badge } from "../../../components/ui/Badge";
import { Botao } from "../../../components/ui/Botao";
import { Linha } from "../../../components/ui/Linha";
import { Painel } from "../../../components/ui/Painel";
import { Vazio } from "../../../components/ui/Vazio";
import { ESTILO_AUXILIAR } from "../../../components/ui/estilos";
import { nomeEditalDoProjeto } from "../../../lib/nomes";
import { abrirProjeto } from "../../../store/navegacao";
import { ROTULO_STATUS_PROJETO, type Projeto } from "../../../types";

export function FichaArtistaProjetos({ nome, projetos, aoNovoProjeto }: { nome: string; projetos: Projeto[]; aoNovoProjeto: () => void }) {
  return (
    <Painel titulo={`Projetos com ${nome}`} acoes={<Botao tamanho="pequeno" onClick={aoNovoProjeto}>+ Novo projeto</Botao>}>
      {projetos.map((p) => (
        <Linha key={p.id} aoClicar={() => abrirProjeto(p.id)}
          direita={<><Badge tom="tipo">{ROTULO_STATUS_PROJETO[p.status]}</Badge><span className="font-bold text-accent">→</span></>}>
          <b>{p.nome}</b>{p.arquivado && <span className="text-muted"> (arquivado)</span>}
          <div className={ESTILO_AUXILIAR}>
            {nomeEditalDoProjeto(p)}{p.artistaIds.length > 1 ? " · com mais " + (p.artistaIds.length - 1) + " artista(s)" : ""}
          </div>
        </Linha>
      ))}
      {!projetos.length && <Vazio emLinha>Nenhum projeto com este artista ainda.</Vazio>}
    </Painel>
  );
}
