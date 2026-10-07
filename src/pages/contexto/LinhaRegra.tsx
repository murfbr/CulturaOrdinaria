/* Linha de regra reutilizada nas fichas: tipo, texto, status e fonte, com o
   "editar" à direita. */
import { textoFonte } from "../../lib/contexto/consultas";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { Linha } from "../../components/ui/Linha";
import { ROTULO_TIPO_REGRA, type Regra } from "../../types";

export function LinhaRegra({ r, aoEditar }: { r: Regra; aoEditar: () => void }) {
  return (
    <Linha topo direita={<Botao variante="quieto" tamanho="mini" onClick={aoEditar}>editar</Botao>}>
      <div className="flex items-start gap-2.5">
        <Badge caixaAlta tom={r.tipoRegra}>{ROTULO_TIPO_REGRA[r.tipoRegra]}</Badge>
        <div className="min-w-0 max-w-texto">
          <span className="text-base">{r.texto}</span>
          {r.status === "duvida" && <> <Badge tom="aviso" mini>a confirmar</Badge></>}
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-faint">{textoFonte(r.fonte)}</div>
        </div>
      </div>
    </Linha>
  );
}
