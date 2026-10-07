/* Sub-aba Documentos da ficha do edital: documentos exigidos (viram o
   checklist de cada projeto novo), como se inscrever e o acervo no Drive. */
import { Badge } from "../../../components/ui/Badge";
import { Dados } from "../../../components/ui/Dados";
import { Dica } from "../../../components/ui/Dica";
import { Linha } from "../../../components/ui/Linha";
import { Painel } from "../../../components/ui/Painel";
import { Vazio } from "../../../components/ui/Vazio";
import { ESTILO_APAGADO, ESTILO_LINK } from "../../../components/ui/estilos";
import type { Edital } from "../../../types";
import { url } from "../../../utils";
import { DadoEdital, Texto } from "./FichaEditalBase";

export function FichaEditalDocumentos({ e }: { e: Edital }) {
  const docs = e.docsExig || [];
  const arquivos = e.arquivos || [];
  return (
    <>
      <Painel titulo="Documentos exigidos">
        {docs.length
          ? docs.map((d) => <Linha compacta key={d}>{d}</Linha>)
          : <Vazio emLinha>Ainda não cadastrados: edite o edital para listar.</Vazio>}
        <Dica className="mt-3">Todo projeto novo neste edital já nasce com esta lista no checklist de documentos.</Dica>
      </Painel>
      <Painel titulo="Como se inscrever"><Texto t={e.comoInscrever} /></Painel>
      <Painel titulo="Acervo no Drive">
        <Dados>
          <DadoEdital rotulo="Pasta do edital">
            {e.linkDrive ? <a className={ESTILO_LINK} href={url(e.linkDrive)} target="_blank" rel="noopener noreferrer">📁 abrir ↗</a> : null}
          </DadoEdital>
        </Dados>
        {arquivos.map((a, i) => (
          <Linha compacta key={i} direita={<><Badge tom="tipo">{a.tipo}</Badge><span className={ESTILO_APAGADO}>{a.kb} KB</span></>}>
            {a.nome} <span className="text-muted">· {a.onde}</span>
          </Linha>
        ))}
        {!arquivos.length && <Vazio emLinha>Nenhum arquivo do acervo associado.</Vazio>}
      </Painel>
    </>
  );
}
