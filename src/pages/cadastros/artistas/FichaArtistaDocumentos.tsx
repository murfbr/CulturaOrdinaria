/* Sub-aba Documentos da ficha do artista: o acervo de documentos com o
   status anexado/pendente (o clique alterna) e a linha para adicionar. */
import { Badge } from "../../../components/ui/Badge";
import { Botao } from "../../../components/ui/Botao";
import { ESTILO_CONTROLE } from "../../../components/ui/Campo";
import { Dica } from "../../../components/ui/Dica";
import { Linha } from "../../../components/ui/Linha";
import { Painel } from "../../../components/ui/Painel";
import { cx } from "../../../utils/classes";
import { VAZIO_ACERVO, type PropsAcervo } from "./FichaArtistaBase";

interface Props extends PropsAcervo {
  novoDoc: string;
  setNovoDoc: (v: string) => void;
}

export function FichaArtistaDocumentos({ d, alterarDet, novoDoc, setNovoDoc }: Props) {
  const docs = d.docs || [];

  function adicionarDoc() {
    const nome = novoDoc.trim();
    if (!nome) return;
    alterarDet((det) => { det.docs = [...(det.docs || []), { nome, status: "pend" }]; });
    setNovoDoc("");
  }

  return (
    <Painel titulo="Documentos" sub="clique no status para alternar">
      {docs.map((doc, i) => (
        <Linha compacta key={i}
          direita={
            <>
              <Badge tom={doc.status === "ok" ? "ok" : "aviso"} clicavel title="alternar anexado / pendente"
                onClick={() => alterarDet((det) => { det.docs![i].status = det.docs![i].status === "ok" ? "pend" : "ok"; })}>
                {doc.status === "ok" ? "anexado" : "pendente"}
              </Badge>
              <Botao variante="quieto" tamanho="mini" title="remover" onClick={() => alterarDet((det) => { det.docs!.splice(i, 1); })}>×</Botao>
            </>
          }>
          {doc.nome}
        </Linha>
      ))}
      {!docs.length && VAZIO_ACERVO}
      <div className="mt-3 flex items-center gap-2">
        <input className={cx("min-w-0 flex-1", ESTILO_CONTROLE)} value={novoDoc} placeholder="novo documento (ex.: Portfólio em PDF)"
          onChange={(e) => setNovoDoc(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") adicionarDoc(); }} />
        <Botao tamanho="pequeno" onClick={adicionarDoc}>+ adicionar</Botao>
      </div>
      <Dica className="mt-3">Esse acervo aparece nos documentos de cada projeto deste artista e nas Pendências.</Dica>
    </Painel>
  );
}
