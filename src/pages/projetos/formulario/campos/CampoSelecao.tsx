/* Campos de escolha única simples: select (tipo "sel") e data (tipo "date"). */
import { Entrada, Selecao } from "../../../../components/ui/Campo";
import { LARGURA_CAMPO } from "./estilos";
import type { PropsCampo } from "../tipos";

export function CampoSelecao({ r, c, alterar }: PropsCampo) {
  const texto = typeof r.valores[c.n] === "string" ? (r.valores[c.n] as string) : "";
  return (
    <Selecao name={c.n} value={texto} onChange={(e) => alterar((copia) => { copia.valores[c.n] = e.target.value; })}>
      <option value="" />
      {(c.opts || []).map((o) => <option key={o}>{o}</option>)}
    </Selecao>
  );
}

export function CampoData({ r, c, alterar }: PropsCampo) {
  const texto = typeof r.valores[c.n] === "string" ? (r.valores[c.n] as string) : "";
  return (
    <Entrada type="date" name={c.n} className={LARGURA_CAMPO.curto} value={texto}
      onChange={(e) => alterar((copia) => { copia.valores[c.n] = e.target.value; })} />
  );
}
